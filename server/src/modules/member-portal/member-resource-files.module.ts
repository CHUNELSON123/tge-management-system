import { GetMemberResourceFileUseCase } from "./application/get-member-resource-file.usecase.js";
import { LocalMemberResourceFileStorage } from "./infrastructure/local-member-resource-file.storage.js";
import { PrismaMemberResourcesRepository } from "./infrastructure/prisma-member-resources.repository.js";
import { createMemberResourceFilesRouter } from "./presentation/member-resource-files.controller.js";
export const memberResourceFilesRouter = createMemberResourceFilesRouter(new GetMemberResourceFileUseCase(new PrismaMemberResourcesRepository(), new LocalMemberResourceFileStorage()));
