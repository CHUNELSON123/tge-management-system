import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../../../../common/middleware/authenticate.middleware.js";
import { requirePermission } from "../../../../common/middleware/require-role.middleware.js";
import type { ManageAdminUsersUseCase } from "../../application/manage-admin-users.usecase.js";

const id = z.string().uuid();
const listQuery = z.object({ search: z.string().trim().max(120).optional(), roleId: z.string().uuid().optional(), status: z.enum(["PENDING_ACTIVATION", "ACTIVE", "SUSPENDED", "DEACTIVATED"]).optional(), page: z.coerce.number().int().min(1).max(10000).default(1), pageSize: z.coerce.number().int().min(1).max(50).default(10) });
const statusBody = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) }).strict();
const roleBody = z.object({ roleId: z.string().uuid() }).strict();
const grantsBody = z.object({ permissionIds: z.array(z.string().uuid()).max(250).refine((ids) => new Set(ids).size === ids.length, "Permission IDs must be unique.") }).strict();
function systemAdministrator(req: AuthenticatedRequest, res: import("express").Response, next: import("express").NextFunction) { if (req.authenticatedUser?.roleName !== "System Administrator") { res.status(403).json({ message: "Only the System Administrator can manage roles and grants." }); return; } next(); }
function actorId(req: AuthenticatedRequest) { return req.authenticatedUser?.userId; }
function userError(error: unknown) { return error instanceof Error && ["ACCOUNT_TRANSITION_INVALID", "ACCOUNT_CHANGED", "ACCOUNT_SELF_STATUS_CHANGE_FORBIDDEN", "ACCOUNT_SELF_ROLE_CHANGE_FORBIDDEN", "SYSTEM_ADMIN_PERMISSION_REQUIRED", "PERMISSION_NOT_FOUND", "ADMIN_LIMIT_REACHED"].includes(error.message); }

export function createAdminUsersRouter(useCase: ManageAdminUsersUseCase): Router {
  const router = Router();
  router.get("/users-roles/users", authenticate, requirePermission("users.manage"), async (req, res, next) => {
    const query = listQuery.safeParse(req.query); if (!query.success) { res.status(400).json({ message: "User filters are invalid." }); return; }
    try { res.json({ message: "Users loaded.", data: await useCase.list(query.data) }); } catch (error) { next(error); }
  });
  router.get("/users-roles/users/:userId", authenticate, requirePermission("users.manage"), async (req, res, next) => {
    const userId = id.safeParse(req.params.userId); if (!userId.success) { res.status(404).json({ message: "User not found." }); return; }
    try { const data = await useCase.get(userId.data); if (!data) { res.status(404).json({ message: "User not found." }); return; } res.json({ message: "User loaded.", data }); } catch (error) { next(error); }
  });
  router.get("/users-roles/users/:userId/photo", authenticate, requirePermission("users.manage"), async (req, res, next) => {
    const userId = id.safeParse(req.params.userId); if (!userId.success) { res.status(404).json({ message: "Photo not found." }); return; }
    try { const photo = await useCase.getPhoto(userId.data); if (!photo) { res.status(404).json({ message: "Photo not found." }); return; } res.type(photo.contentType).setHeader("Cache-Control", "private, no-store").send(Buffer.from(photo.data)); } catch (error) { next(error); }
  });
  router.get("/users-roles/assignable-roles", authenticate, requirePermission("users.manage"), async (req: AuthenticatedRequest, res, next) => {
    const actor = req.authenticatedUser; if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    try { res.json({ message: "Assignable roles loaded.", data: await useCase.assignableRoles(actor.roleName) }); } catch (error) { next(error); }
  });
  router.get("/users-roles/filter-roles", authenticate, requirePermission("users.manage"), async (_req, res, next) => {
    try { res.json({ data: await useCase.filterRoles() }); } catch (error) { next(error); }
  });
  router.post("/users-roles/users/:userId/status", authenticate, requirePermission("users.manage"), async (req: AuthenticatedRequest, res, next) => {
    const userId = id.safeParse(req.params.userId); const body = statusBody.safeParse(req.body); const actor = actorId(req);
    if (!userId.success) { res.status(404).json({ message: "User not found." }); return; } if (!body.success) { res.status(400).json({ message: "Account status is invalid." }); return; } if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    try { const changed = await useCase.transition(userId.data, body.data.status, actor); if (!changed) { res.status(404).json({ message: "User not found." }); return; } res.json({ message: "Account status updated.", data: await useCase.get(userId.data) }); } catch (error) { if (userError(error)) { res.status(error instanceof Error && error.message === "ACCOUNT_SELF_STATUS_CHANGE_FORBIDDEN" ? 403 : 409).json({ message: error instanceof Error && error.message === "ACCOUNT_SELF_STATUS_CHANGE_FORBIDDEN" ? "You cannot change your own account status." : "This account status change is not allowed. Refresh and try again." }); return; } next(error); }
  });
  router.get("/users-roles/roles", authenticate, requirePermission("roles.manage"), systemAdministrator, async (_req, res, next) => { try { res.json({ message: "Roles loaded.", data: await useCase.roles() }); } catch (error) { next(error); } });
  router.get("/users-roles/permissions", authenticate, requirePermission("roles.manage"), systemAdministrator, async (_req, res, next) => { try { res.json({ message: "Permission catalog loaded.", data: await useCase.permissionCatalog() }); } catch (error) { next(error); } });
  router.post("/users-roles/users/:userId/role", authenticate, requirePermission("roles.manage"), systemAdministrator, async (req: AuthenticatedRequest, res, next) => {
    const userId = id.safeParse(req.params.userId); const body = roleBody.safeParse(req.body); const actor = actorId(req);
    if (!userId.success) { res.status(404).json({ message: "User not found." }); return; } if (!body.success) { res.status(400).json({ message: "Role selection is invalid." }); return; } if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    try { const changed = await useCase.assignRole(userId.data, body.data.roleId, actor); if (!changed) { res.status(404).json({ message: "User or role not found." }); return; } res.json({ message: "User role updated.", data: await useCase.get(userId.data) }); } catch (error) { if (userError(error)) { res.status(error instanceof Error && error.message === "ACCOUNT_SELF_ROLE_CHANGE_FORBIDDEN" ? 403 : 409).json({ message: error instanceof Error && error.message === "ADMIN_LIMIT_REACHED" ? "The maximum of three administrators has been reached." : error instanceof Error && error.message === "ACCOUNT_SELF_ROLE_CHANGE_FORBIDDEN" ? "You cannot change your own role." : "The user role could not be changed." }); return; } next(error); }
  });
  router.put("/users-roles/roles/:roleId/permissions", authenticate, requirePermission("roles.manage"), systemAdministrator, async (req: AuthenticatedRequest, res, next) => {
    const roleId = id.safeParse(req.params.roleId); const body = grantsBody.safeParse(req.body); const actor = actorId(req);
    if (!roleId.success) { res.status(404).json({ message: "Role not found." }); return; } if (!body.success) { res.status(400).json({ message: "Permission grants are invalid." }); return; } if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    try { const data = await useCase.updateRolePermissions(roleId.data, body.data.permissionIds, actor); if (!data) { res.status(404).json({ message: "Role not found." }); return; } res.json({ message: "Role permissions updated.", data }); } catch (error) { if (userError(error)) { res.status(409).json({ message: error instanceof Error && error.message === "SYSTEM_ADMIN_PERMISSION_REQUIRED" ? "The System Administrator role must retain roles.manage." : "One or more permissions are invalid." }); return; } next(error); }
  });
  return router;
}
