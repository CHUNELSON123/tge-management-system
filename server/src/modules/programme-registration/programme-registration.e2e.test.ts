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
import { ManageProgrammeRegistration } from "./application/manage-programme-registration.usecase.js";
import { PrismaProgrammeRegistrationRepository } from "./infrastructure/prisma-programme-registration.repository.js";
import { createProgrammeRegistrationRouters } from "./presentation/programme-registration.controller.js";
import { PrismaPaymentsRepository } from "../payments/infrastructure/prisma-payments.repository.js";
import { PrismaAdminProgrammesRepository } from "../admin-portal/infrastructure/prisma-admin-programmes.repository.js";

test("Foundation requests, capacity, waiting list, fee override and payment separation", async t => {
  dotenv.config({ path: resolve(process.cwd(), ".env") });
  const suffix = randomUUID(); const ids: string[] = []; let cohortId = ""; let raceCohortId = ""; let feeId = ""; let madeProgramme = false;
  let programme = await prisma.programme.findUnique({ where: { code: "TGE-FOUNDATION" } });
  if (!programme) { programme = await prisma.programme.create({ data: { code: "TGE-FOUNDATION", name: `Foundation test ${suffix}`, slug: `foundation-test-${suffix}`, status: "published" } }); madeProgramme = true; }
  if (programme.status !== "published") { t.skip("Existing Foundation programme is not published"); return; }
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "Organisation Administrator" } });
  const memberRole = await prisma.role.findUniqueOrThrow({ where: { name: "Member" } });
  const admin = await prisma.user.create({ data: { roleId: adminRole.id, email: `reg-admin-${suffix}@example.test`, firstName: "Test", lastName: suffix, status: "ACTIVE", passwordHash: "unused" } }); ids.push(admin.id);
  const users = [];
  for (let i = 0; i < 3; i++) { const user = await prisma.user.create({ data: { roleId: memberRole.id, email: `reg-${i}-${suffix}@example.test`, firstName: "Test", lastName: suffix, status: "ACTIVE", passwordHash: "unused", memberProfile: { create: { membershipStatus: "active" } } } }); users.push(user); ids.push(user.id); }
  const cohort = await prisma.cohort.create({ data: { programmeId: programme.id, name: `Registration test ${suffix}`, startDate: new Date("2028-01-01"), status: "upcoming", capacity: 1 } }); cohortId = cohort.id;
  const fee = await prisma.feeDefinition.create({ data: { name: `Foundation fee ${suffix}`, category: "programme", audience: "member", amountMinor: 25000, currency: "USD", programmeId: programme.id } }); feeId = fee.id;
  const app = express(); app.use(express.json()); const routers = createProgrammeRegistrationRouters(new ManageProgrammeRegistration(new PrismaProgrammeRegistrationRepository())); app.use("/member", routers.member); app.use("/admin", routers.admin);
  const server = createServer(app); server.listen(0); await once(server, "listening"); const address = server.address(); if (!address || typeof address === "string") throw new Error("Server unavailable");
  const jwt = new JwtService(); const adminToken = jwt.signAccessToken(admin.id); const tokens = users.map(user => jwt.signAccessToken(user.id)); const base = `http://127.0.0.1:${address.port}`;
  const send = (method: string, path: string, token: string, body?: object) => fetch(base + path, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = async <T>(response: Response, status: number) => { assert.equal(response.status, status, await response.clone().text()); return ((await response.json()) as { data: T }).data; };
  try {
    assert.equal((await send("GET", "/admin/foundation/cohorts", tokens[0])).status, 403);
    await data(await send("PUT", `/admin/foundation/cohorts/${cohortId}/fee`, adminToken, { feeId }), 200);
    const first = await data<{ id: string; status: string }>(await send("POST", `/member/foundation/cohorts/${cohortId}/requests`, tokens[0]), 201); assert.equal(first.status, "pending");
    const second = await data<{ id: string; status: string }>(await send("POST", `/member/foundation/cohorts/${cohortId}/requests`, tokens[1]), 201); assert.equal(second.status, "pending");
    assert.equal((await send("POST", `/member/foundation/cohorts/${cohortId}/requests`, tokens[0])).status, 409);
    const approved = await data<{ chargeId: string }>(await send("POST", `/admin/foundation/requests/${first.id}/review`, adminToken, { decision: "approve" }), 200); assert.ok(approved.chargeId);
    assert.equal(await prisma.enrollment.count({ where: { cohortId, status: "enrolled" } }), 1);
    assert.equal((await send("POST", `/admin/foundation/requests/${second.id}/review`, adminToken, { decision: "approve" })).status, 409);
    const waiting = await data<{ id: string; status: string }>(await send("POST", `/member/foundation/cohorts/${cohortId}/requests`, tokens[2]), 201); assert.equal(waiting.status, "waitlisted");
    assert.equal((await send("POST", `/admin/foundation/requests/${second.id}/review`, adminToken, { decision: "reject" })).status, 409);
    await data(await send("POST", `/admin/foundation/requests/${second.id}/review`, adminToken, { decision: "reject", reason: "Please contact us" }), 200);
    const payments = new PrismaPaymentsRepository(); const own = await payments.listOwn(users[0].id); assert.equal(own.find(item => item.id === approved.chargeId)?.outstandingMinor, 25000);
    await payments.simulate({ chargeId: approved.chargeId, amountMinor: 25000, outcome: "success", requestKey: randomUUID() }, users[0].id);
    assert.equal((await payments.listOwn(users[0].id)).find(item => item.id === approved.chargeId)?.outstandingMinor, 25000);
    await payments.recordManual({ chargeId: approved.chargeId, amountMinor: 25000, method: "cash", reference: `TEST-${suffix}`, paidAt: "2026-01-01T00:00:00.000Z" }, admin.id);
    assert.equal((await payments.listOwn(users[0].id)).find(item => item.id === approved.chargeId)?.paymentStatus, "paid");
    await data(await send("POST", `/member/foundation/requests/${waiting.id}/cancel`, tokens[2]), 200);
    assert.equal((await prisma.programmeRegistrationRequest.findUniqueOrThrow({ where: { id: waiting.id } })).status, "cancelled");
    await prisma.enrollment.updateMany({ where: { cohortId }, data: { status: "withdrawn" } });
    const member3 = await prisma.member.findUniqueOrThrow({ where: { userId: users[2].id } });
    await new PrismaAdminProgrammesRepository().enrollMember(cohortId, member3.id, admin.id, null);
    const direct = await prisma.programmeRegistrationRequest.findUniqueOrThrow({ where: { id: waiting.id } });
    assert.equal(direct.status, "approved"); assert.equal(direct.chargeId, null);
    const raceCohort = await prisma.cohort.create({ data: { programmeId: programme.id, name: `Registration race ${suffix}`, startDate: new Date("2028-02-01"), status: "upcoming", capacity: 1 } }); raceCohortId = raceCohort.id;
    const raceRequests = await Promise.all(tokens.slice(0, 2).map(token => send("POST", `/member/foundation/cohorts/${raceCohortId}/requests`, token).then(response => data<{ id: string }>(response, 201))));
    const decisions = await Promise.all(raceRequests.map(item => send("POST", `/admin/foundation/requests/${item.id}/review`, adminToken, { decision: "approve" })));
    assert.deepEqual(decisions.map(response => response.status).sort(), [200, 409]);
    assert.equal(await prisma.enrollment.count({ where: { cohortId: raceCohortId, status: "enrolled" } }), 1);
  } finally {
    server.close();
    const charges = await prisma.memberCharge.findMany({ where: { createdByUserId: admin.id }, select: { id: true } });
    const cohortIds = [cohortId, raceCohortId].filter(Boolean);
    await prisma.programmeRegistrationRequest.deleteMany({ where: { cohortId: { in: cohortIds } } });
    await prisma.paymentRecord.deleteMany({ where: { chargeId: { in: charges.map(item => item.id) } } });
    await prisma.memberCharge.deleteMany({ where: { id: { in: charges.map(item => item.id) } } });
    await prisma.enrollment.deleteMany({ where: { cohortId: { in: cohortIds } } });
    await prisma.cohortRegistrationFee.deleteMany({ where: { cohortId } });
    await prisma.feeDefinition.deleteMany({ where: { id: feeId } });
    await prisma.cohort.deleteMany({ where: { id: { in: cohortIds } } });
    await prisma.notification.deleteMany({ where: { OR: [{ userId: { in: ids } }, { title: "Foundation registration request", body: { contains: suffix } }] } });
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    if (madeProgramme) await prisma.programme.delete({ where: { id: programme.id } });
    await prisma.$disconnect();
  }
});
