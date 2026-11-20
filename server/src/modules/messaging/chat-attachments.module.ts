import { PrismaChatAttachmentsRepository } from "./infrastructure/prisma-chat-attachments.repository.js";
import { createChatAttachmentsRouter } from "./presentation/chat-attachments.controller.js";
import { ChatAttachmentsUseCase } from "./application/chat-attachments.usecase.js";
export const chatAttachmentsRouter = createChatAttachmentsRouter(new ChatAttachmentsUseCase(new PrismaChatAttachmentsRepository()));
