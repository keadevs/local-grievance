import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Creates the bootstrap administrator / social-worker account. */
async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@punecivic.local";
  const password = process.env.SEED_ADMIN_PASSWORD;
  const mobile = process.env.SEED_ADMIN_MOBILE ?? "9999999999";

  if (!password || password.length < 10) {
    throw new Error(
      "SEED_ADMIN_PASSWORD must be set to at least 10 characters before seeding.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", passwordHash, isActive: true },
    create: {
      email,
      mobile,
      passwordHash,
      role: "ADMIN",
      resident: {
        create: {
          firstName: "Portal",
          lastName: "Administrator",
          addressLine: "PMC Main Building, Shivajinagar",
          ward: "Shivajinagar - Ghole Road",
          city: "Pune",
          state: "Maharashtra",
          pincode: "411005",
        },
      },
    },
  });

  console.log(`Seeded administrator: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
