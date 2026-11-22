import { ManageEventRegistrationUseCase } from "./application/manage-event-registration.usecase.js";
import { PrismaEventRegistrationRepository } from "./infrastructure/prisma-event-registration.repository.js";
import { createMemberEventRegistrationRouter } from "./presentation/member-event-registration.controller.js";
export const eventRegistrationUseCase = new ManageEventRegistrationUseCase(new PrismaEventRegistrationRepository());
export const memberEventRegistrationRouter = createMemberEventRegistrationRouter(eventRegistrationUseCase);
