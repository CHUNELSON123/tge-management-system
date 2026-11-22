import { ManagePaymentsUseCase } from "./application/manage-payments.usecase.js";
import { PrismaPaymentsRepository } from "./infrastructure/prisma-payments.repository.js";
import { createAdminPaymentsRouter, createMemberPaymentsRouter } from "./presentation/payments.controller.js";
const payments = new ManagePaymentsUseCase(new PrismaPaymentsRepository());
export const adminPaymentsRouter = createAdminPaymentsRouter(payments);
export const memberPaymentsRouter = createMemberPaymentsRouter(payments);
