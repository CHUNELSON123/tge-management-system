import dotenv from "dotenv";

dotenv.config({ path: "../database/.env" });

const { prisma } = await import("database");

const roles = [
  {
    name: "System Administrator",
    description: "Maintains platform operations, security, user accounts, permissions, and system maintenance.",
  },
  {
    name: "Organisation Administrator",
    description: "Manages members, programmes, mentors, events, documents, announcements, reports, and website content.",
  },
  {
    name: "Member",
    description: "Accesses member services, programmes, resources, announcements, and organisational activities.",
  },
  {
    name: "Mentor",
    description: "Mentors assigned members and monitors mentoring activities.",
  },
  {
    name: "Trainer / Facilitator",
    description: "Delivers training programmes, manages learning materials, and monitors participant engagement.",
  },
];

try {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  const seededRoles = await prisma.role.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  console.log("Roles seeded successfully:");
  console.log(JSON.stringify(seededRoles, null, 2));
} finally {
  await prisma.$disconnect();
}
