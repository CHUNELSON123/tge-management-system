import { GetMemberMessagesUseCase } from "./application/get-member-messages.usecase.js";
import { MemberCallSignalingService } from "./application/member-call-signaling.service.js";
import { PrismaMemberMessagesRepository } from "./infrastructure/prisma-member-messages.repository.js";
import { createMemberMessagesRouter } from "./presentation/member-messages.controller.js";
const repository = new PrismaMemberMessagesRepository();
export const memberMessagesRouter = createMemberMessagesRouter(new GetMemberMessagesUseCase(repository), new MemberCallSignalingService(repository));
