import { Prisma } from "@prisma/client";

import { handleError, ok } from "@/lib/api";
import { requireStaff } from "@/lib/auth";
import { serialiseComplaint } from "@/lib/complaints";
import { prisma } from "@/lib/db";
import { complaintListQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Staff view over every grievance in the city. */
export async function GET(req: Request) {
  try {
    await requireStaff();
    const query = complaintListQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );

    const where: Prisma.ComplaintWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.ward ? { ward: query.ward } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q } },
              { referenceCode: { contains: query.q } },
              { areaAddress: { contains: query.q } },
              { pincode: { contains: query.q } },
            ],
          }
        : {}),
    };

    const [items, total, statusCounts] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          photos: true,
          resident: {
            select: {
              email: true,
              mobile: true,
              resident: { select: { firstName: true, lastName: true } },
            },
          },
          notifications: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.complaint.count({ where }),
      prisma.complaint.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    return ok({
      items: items.map(serialiseComplaint),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
      stats: Object.fromEntries(
        statusCounts.map((s) => [s.status, s._count._all]),
      ),
    });
  } catch (error) {
    return handleError(error);
  }
}
