import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";
import { resolve } from "node:path";
import dotenv from "dotenv";
import express from "express";
import { prisma } from "database";
import { JwtService } from "../../common/services/jwt.service.js";
import { ManageMentorshipDelivery } from "./application/manage-mentorship-delivery.usecase.js";
import { PrismaMentorshipDeliveryRepository } from "./infrastructure/prisma-mentorship-delivery.repository.js";
import { createMentorshipDeliveryRouter } from "./presentation/mentorship-delivery.controller.js";
import { ManageAdminMentorshipUseCase } from "../admin-portal/application/manage-admin-mentorship.usecase.js";
import { PrismaAdminMentorshipRepository } from "../admin-portal/infrastructure/prisma-admin-mentorship.repository.js";
import { createMentorMentorshipRouter } from "../mentor-portal/presentation/controllers/mentor-mentorship.controller.js";

test("mentorship delivery is scoped to participants, shared, and completed only by admins", async () => {
  dotenv.config({ path: resolve(process.cwd(), ".env") });
  const suffix = randomUUID(); const userIds: string[] = []; const assignments: string[] = []; const objectiveIds: string[] = [];
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "Organisation Administrator" } }); const mentorRole = await prisma.role.findUniqueOrThrow({ where: { name: "Mentor" } }); const memberRole = await prisma.role.findUniqueOrThrow({ where: { name: "Member" } });
  const app = express(); app.use(express.json()); const useCase = new ManageMentorshipDelivery(new PrismaMentorshipDeliveryRepository());
  for (const role of ["admin", "mentor", "member"] as const) app.use(`/${role}/mentorship-delivery`, createMentorshipDeliveryRouter(useCase, role));
  app.use("/mentor/mentorship", createMentorMentorshipRouter(new ManageAdminMentorshipUseCase(new PrismaAdminMentorshipRepository())));
  const server = createServer(app); server.listen(0); await once(server, "listening"); const address = server.address(); if (!address || typeof address === "string") throw new Error("Test server did not start");
  const base = `http://127.0.0.1:${address.port}`; const jwt = new JwtService();
  const call = (method: string, path: string, token: string, body?: object) => fetch(base + path, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = async <T>(response: Response, expected: number) => { assert.equal(response.status, expected, await response.clone().text()); return ((await response.json()) as { data: T }).data; };
  try {
    const roles = [adminRole, mentorRole, mentorRole, memberRole, memberRole];
    for (let i = 0; i < roles.length; i++) { const user = await prisma.user.create({ data: { roleId: roles[i].id, email: `delivery-${i}-${suffix}@example.test`, firstName: "Delivery", lastName: `${i}`, passwordHash: "unused", status: "ACTIVE" } }); userIds.push(user.id); }
    const mentors = await Promise.all([1,2].map(i => prisma.mentor.create({ data: { userId: userIds[i], status: "active" } })));
    const members = await Promise.all([3,4].map(i => prisma.member.create({ data: { userId: userIds[i], membershipStatus: "active" } })));
    const assignment = await prisma.mentorAssignment.create({ data: { mentorId: mentors[0].id, memberId: members[0].id, startDate: new Date("2026-01-01"), status: "active", notes: "Private administrator note" } }); assignments.push(assignment.id);
    const tokens = userIds.map(id => jwt.signAccessToken(id));
    assert.equal((await call("GET", `/member/mentorship-delivery/assignments/${assignment.id}`, tokens[4])).status, 404);
    assert.equal((await call("GET", `/mentor/mentorship-delivery/assignments/${assignment.id}`, tokens[2])).status, 404);
    assert.equal((await call("GET", `/admin/mentorship-delivery/assignments/${assignment.id}`, tokens[1])).status, 403);
    const legacy = await data<{ notes: string | null }>(await call("GET", `/mentor/mentorship/assignments/${assignment.id}`, tokens[1]), 200); assert.equal(legacy.notes, null);
    const objective = await data<{ objectives: { id: string }[] }>(await call("POST", `/mentor/mentorship/assignments/${assignment.id}/objectives`, tokens[1], { title: "Improve business plan", description: null, targetDate: null }), 201); const objectiveId = objective.objectives[0].id; objectiveIds.push(objectiveId);
    await data(await call("POST", `/mentor/mentorship/objectives/${objectiveId}/progress`, tokens[1], { note: "Draft completed", value: null }), 201);
    await data(await call("PATCH", `/mentor/mentorship-delivery/objectives/${objectiveId}`, tokens[1], { status: "in_progress" }), 200);
    const created = await data<{ sessions: { id: string }[] }>(await call("POST", `/mentor/mentorship/assignments/${assignment.id}/sessions`, tokens[1], { title: "Review", scheduledStart: "2026-03-01T10:00:00.000Z", scheduledEnd: null, locationOrUrl: null, notes: null }), 201);
    await data(await call("PATCH", `/mentor/mentorship-delivery/sessions/${created.sessions[0].id}`, tokens[1], { status: "completed", outcome: "Plan reviewed" }), 200);
    const report = { year: 2026, quarter: 1, summary: "Progress made", achievements: "Draft complete", challenges: "Funding", nextSteps: "Review finances" };
    assert.equal((await call("PUT", `/mentor/mentorship-delivery/assignments/${assignment.id}/report`, tokens[2], report)).status, 404);
    const savedReport = await data<{ id: string }>(await call("PUT", `/mentor/mentorship-delivery/assignments/${assignment.id}/report`, tokens[1], report), 200);
    assert.equal((await call("PUT", `/mentor/mentorship-delivery/assignments/${assignment.id}/report`, tokens[1], report)).status, 409);
    await data(await call("PUT", `/mentor/mentorship-delivery/assignments/${assignment.id}/report`, tokens[1], { ...report, reportId: savedReport.id, summary: "Progress made" }), 200);
    const memberView = await data<{ objectives: { progressRecords: { progressNote: string }[] }[]; reports: { summary: string }[]; sessions: { outcome: string }[]; notes?: string }>(await call("GET", `/member/mentorship-delivery/assignments/${assignment.id}`, tokens[3]), 200);
    assert.equal(memberView.objectives[0].progressRecords[0].progressNote, "Draft completed"); assert.equal(memberView.reports[0].summary, "Progress made"); assert.equal(memberView.sessions[0].outcome, "Plan reviewed"); assert.equal(memberView.notes, undefined);
    assert.equal((await call("POST", `/mentor/mentorship-delivery/assignments/${assignment.id}/complete`, tokens[1])).status, 404);
    await data(await call("POST", `/admin/mentorship-delivery/assignments/${assignment.id}/complete`, tokens[0]), 200);
    assert.equal((await call("PUT", `/mentor/mentorship-delivery/assignments/${assignment.id}/report`, tokens[1], report)).status, 409);
    assert.equal((await call("POST", `/mentor/mentorship/objectives/${objectiveId}/progress`, tokens[1], { note: "Late update", value: null })).status, 404);
    const completed = await data<{ status: string; completedAt: string | null }>(await call("GET", `/member/mentorship-delivery/assignments/${assignment.id}`, tokens[3]), 200);
    assert.equal(completed.status, "completed"); assert.ok(completed.completedAt);
  } finally {
    server.close();
    await prisma.mentorshipQuarterlyReport.deleteMany({ where: { assignmentId: { in: assignments } } });
    await prisma.mentoringProgressRecord.deleteMany({ where: { objectiveId: { in: objectiveIds } } });
    await prisma.mentorAssignment.deleteMany({ where: { id: { in: assignments } } });
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  }
});
