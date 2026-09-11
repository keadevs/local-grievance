import { Prisma } from "@prisma/client";

import {
  ApiError,
  assertSameOrigin,
  created,
  enforceRateLimit,
  handleError,
  ok,
  readJson,
} from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { generateReferenceCode, serialiseComplaint } from "@/lib/complaints";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  complaintCreateSchema,
  complaintListQuerySchema,
} from "@/lib/validation";
import { dispatchComplaintAlert, type ComplaintAlert } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** MODULE 2 - paginated list of the signed-in resident's grievances. */
export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const url = new URL(req.url);
    const query = complaintListQuerySchema.parse(
      Object.fromEntries(url.searchParams),
    );

    const where: Prisma.ComplaintWhereInput = {
      residentId: session.sub,
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q } },
              { referenceCode: { contains: query.q } },
              { areaAddress: { contains: query.q } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: { photos: true, _count: { select: { events: true } } },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.complaint.count({ where }),
    ]);

    return ok({
      items: items.map(serialiseComplaint),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

/** MODULE 2 + MODULE 3 - submit a grievance and alert the social worker. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await requireSession();
    enforceRateLimit(req, "complaints:create", {
      limit: 10,
      windowSeconds: 3600,
    });

    const input = complaintCreateSchema.parse(await readJson(req));

    const resident = await prisma.resident.findUnique({
      where: { userId: session.sub },
    });
    if (!resident) {
      throw new ApiError(
        "Complete your resident profile before filing a complaint.",
        409,
        "PROFILE_INCOMPLETE",
      );
    }

    const complaint = await prisma.complaint.create({
      data: {
        referenceCode: generateReferenceCode(),
        residentId: session.sub,
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        areaAddress: input.areaAddress,
        landmark: input.landmark || null,
        ward: input.ward || resident.ward,
        pincode: input.pincode,
        contactNumber: input.contactNumber,
        latitude:
          input.latitude != null ? new Prisma.Decimal(input.latitude) : null,
        longitude:
          input.longitude != null ? new Prisma.Decimal(input.longitude) : null,
        photos: { createMany: { data: input.photos } },
        events: {
          create: {
            actorId: session.sub,
            toStatus: "SUBMITTED",
            note: "Complaint submitted by resident",
          },
        },
      },
      include: { photos: true },
    });

    const alert: ComplaintAlert = {
      referenceCode: complaint.referenceCode,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      priority: complaint.priority,
      areaAddress: complaint.areaAddress,
      landmark: complaint.landmark,
      ward: complaint.ward,
      pincode: complaint.pincode,
      contactNumber: complaint.contactNumber,
      residentName: `${resident.firstName} ${resident.lastName}`,
      residentEmail: session.email,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      photoUrls: complaint.photos.map((p) => p.url),
      portalUrl: `${getEnv().APP_URL}/admin/complaints/${complaint.id}`,
      submittedAt: complaint.createdAt,
    };

    // Fire-and-forget: a messaging outage must not fail the citizen's submission.
    void dispatchComplaintAlert(complaint.id, alert).catch((err) =>
      logger.error(
        { err, complaintId: complaint.id },
        "WhatsApp dispatch crashed",
      ),
    );

    return created(serialiseComplaint(complaint));
  } catch (error) {
    return handleError(error);
  }
}
