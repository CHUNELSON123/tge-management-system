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

const roleGrants: Record<string, string[]> = {
  "System Administrator": ["users.manage", "roles.manage", "system.manage", "audit.view", "members.manage", "programmes.manage", "events.manage", "resources.manage", "mentorship.manage", "reports.view", "website.manage"],
  "Organisation Administrator": ["users.manage", "members.manage", "programmes.manage", "events.manage", "resources.manage", "mentorship.manage", "reports.view", "website.manage"],
  Member: ["profile.manage", "resources.read", "events.read", "mentorship.read"],
  Mentor: ["assigned-members.read", "mentorship.manage", "resources.manage", "events.read"],
  "Trainer / Facilitator": ["assigned-members.read", "programmes.deliver", "resources.manage", "events.read"],
};

const permissions = [
  ["users.manage", "Create and manage user accounts"],
  ["roles.manage", "Manage roles and permissions"],
  ["system.manage", "Manage platform settings"],
  ["audit.view", "View security audit records"],
  ["members.manage", "Manage member records"],
  ["programmes.manage", "Manage programmes and cohorts"],
  ["programmes.deliver", "Deliver assigned programmes"],
  ["events.manage", "Manage events"],
  ["events.read", "View events"],
  ["resources.manage", "Manage learning resources"],
  ["resources.read", "View available resources"],
  ["mentorship.manage", "Manage assigned mentorship activities"],
  ["mentorship.read", "View mentorship activities"],
  ["assigned-members.read", "View assigned participants"],
  ["reports.view", "View operational reports"],
  ["website.manage", "Manage public website content"],
  ["profile.manage", "Manage own profile"],
] as const;

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

  for (const [code, description] of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: { description },
      create: { code, description },
    });
  }

  const roleIds = new Map(seededRoles.map(({ id, name }) => [name, id]));
  for (const [roleName, codes] of Object.entries(roleGrants)) {
    const roleId = roleIds.get(roleName);
    if (!roleId) continue;
    for (const code of codes) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { code }, select: { id: true } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId: permission.id } },
        update: {},
        create: { roleId, permissionId: permission.id },
      });
    }
  }

  console.log("Roles seeded successfully:");
  console.log(JSON.stringify(seededRoles, null, 2));
} finally {
  await prisma.$disconnect();
}
