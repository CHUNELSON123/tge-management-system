import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";
import { resolve } from "node:path";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import express from "express";
import { prisma } from "database";
import { JwtService } from "../../common/services/jwt.service.js";
import { LoginUseCase } from "../auth/application/use-cases/login.usecase.js";
import { PrismaUserRepository } from "../auth/infrastructure/repositories/prisma-user.repository.js";
import { createAuthRouter } from "../auth/presentation/controllers/auth.controller.js";
import { GetMemberBusinessesUseCase } from "../member-portal/application/get-member-businesses.usecase.js";
import { PrismaMemberBusinessesRepository } from "../member-portal/infrastructure/prisma-member-businesses.repository.js";
import { createMemberPortalRouter } from "../member-portal/presentation/member-portal.controller.js";
import { PrismaPublicBusinessesRepository } from "../public-pages/infrastructure/prisma-public-businesses.repository.js";
import { ManageAdminBusinessesUseCase } from "./application/manage-admin-businesses.usecase.js";
import { PrismaAdminBusinessesRepository } from "./infrastructure/prisma-admin-businesses.repository.js";
import { createAdminBusinessesRouter } from "./presentation/controllers/admin-businesses.controller.js";

dotenv.config({ path: resolve(process.cwd(), ".env") });
test("business review connects owner, administrator and public directory", async () => {
  const suffix = randomUUID();
  const roles = await prisma.role.findMany({ where: { name: { in: ["System Administrator", "Member"] } } });
  const roleId = (name: string) => { const role = roles.find((r) => r.name === name); assert.ok(role); return role.id; };
  const password = "test-password";
  const hash = await bcrypt.hash(password, 4);
  const ids: string[] = [];
  let businessId: string | undefined;
  const app = express(); app.use(express.json());
  app.use("/auth", createAuthRouter(new LoginUseCase(new PrismaUserRepository(), new JwtService()), { sendEmail: async () => {} } as never));
  app.use("/admin", createAdminBusinessesRouter(new ManageAdminBusinessesUseCase(new PrismaAdminBusinessesRepository())));
  app.use("/member", createMemberPortalRouter(null as never, null as never, null as never, null as never, null as never, null as never, null as never, new GetMemberBusinessesUseCase(new PrismaMemberBusinessesRepository())));
  const server = createServer(app); server.listen(0); await once(server, "listening");
  const address = server.address(); if (!address || typeof address === "string") throw new Error("No address");
  const request = (method: string, path: string, token?: string, body?: object) => fetch(`http://127.0.0.1:${address.port}${path}`, { method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = async <T>(response: Response, status: number): Promise<T> => { assert.equal(response.status, status, await response.clone().text()); return ((await response.json()) as { data: T }).data; };
  try {
    const tokens: string[] = [];
    for (const [index, role] of ["System Administrator", "Member", "Member"].entries()) {
      const email = `directory-${index}-${suffix}@example.test`;
      const user = await prisma.user.create({ data: { roleId: roleId(role), email, firstName: "Directory", lastName: "Test", passwordHash: hash, status: "ACTIVE", emailVerifiedAt: new Date() } }); ids.push(user.id);
      if (role === "Member") await prisma.member.create({ data: { userId: user.id, membershipStatus: "active" } });
      tokens.push((await data<{ accessToken: string }>(await request("POST", "/auth/login", undefined, { email, password }), 200)).accessToken);
    }
    const [admin, owner, other] = tokens;
    const input = { name: `Directory ${suffix}`, description: "A business", categoryIds: [], address: "City", websiteUrl: null, email: null, phone: null };
    const created = await data<{ id: string; slug: string; publicationStatus: string }>(await request("POST", "/member/businesses", owner, input), 201); businessId = created.id;
    const publicDirectory = new PrismaPublicBusinessesRepository();
    assert.equal(created.publicationStatus, "pending_review");
    assert.equal(await publicDirectory.findApprovedBusinessBySlug(created.slug), null);
    const queue = await data<{ rows: Array<{ id: string }> }>(await request("GET", `/admin/businesses?status=pending_review&search=${suffix}`, admin), 200);
    assert.ok(queue.rows.some((row) => row.id === created.id));
    assert.equal((await request("PATCH", `/member/businesses/${created.id}`, other, input)).status, 404);
    assert.equal((await request("POST", `/admin/businesses/${created.id}/review`, owner, { status: "approved" })).status, 403);
    await data(await request("POST", `/admin/businesses/${created.id}/review`, admin, { status: "rejected", reason: "Please add more detail." }), 200);
    assert.ok(await prisma.notification.findFirst({ where: { userId: ids[1], notificationType: "business", body: { contains: "Please add more detail." } } }));
    let own = await data<Array<{ id: string; publicationStatus: string; reviewReason: string | null }>>(await request("GET", "/member/businesses", owner), 200);
    assert.equal(own[0].publicationStatus, "rejected"); assert.equal(own[0].reviewReason, "Please add more detail.");
    await data(await request("PATCH", `/member/businesses/${created.id}`, owner, { ...input, description: "Added detail" }), 200);
    own = await data(await request("GET", "/member/businesses", owner), 200); assert.equal(own[0].publicationStatus, "pending_review"); assert.equal(own[0].reviewReason, null);
    await data(await request("POST", `/admin/businesses/${created.id}/review`, admin, { status: "approved" }), 200);
    assert.equal((await publicDirectory.findApprovedBusinessBySlug(created.slug))?.description, "Added detail");
    await data(await request("PATCH", `/member/businesses/${created.id}`, owner, { ...input, description: "New edit" }), 200);
    assert.equal(await publicDirectory.findApprovedBusinessBySlug(created.slug), null);
  } finally {
    server.close();
    if (businessId) { await prisma.businessReview.deleteMany({ where: { businessId } }); await prisma.businessCategoryAssignment.deleteMany({ where: { businessId } }); await prisma.business.deleteMany({ where: { id: businessId } }); }
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  }
});
