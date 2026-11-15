import { GetMemberNotificationsUseCase } from "./application/get-member-notifications.usecase.js";
import { PrismaMemberNotificationsRepository } from "./infrastructure/prisma-member-notifications.repository.js";
import { createMemberNotificationsRouter } from "./presentation/member-notifications.controller.js";
export const memberNotificationsRouter = createMemberNotificationsRouter(new GetMemberNotificationsUseCase(new PrismaMemberNotificationsRepository()));
