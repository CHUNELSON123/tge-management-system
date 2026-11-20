import { StartConversationUseCase } from "./application/start-conversation.usecase.js";
import { PrismaConversationsRepository } from "./infrastructure/prisma-conversations.repository.js";
import { createConversationsRouter } from "./presentation/conversations.controller.js";
export const conversationsRouter = createConversationsRouter(new StartConversationUseCase(new PrismaConversationsRepository()));
