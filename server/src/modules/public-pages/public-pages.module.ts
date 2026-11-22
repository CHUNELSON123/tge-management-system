import { GetHomePreviewsUseCase } from "./application/get-home-previews.usecase.js";
import { PrismaPublicHomePreviewRepository } from "./infrastructure/prisma-public-home-preview.repository.js";
import { createPublicPagesRouter } from "./presentation/public-pages.controller.js";
import { GetPublicProgrammesUseCase } from "./application/get-public-programmes.usecase.js";
import { PrismaPublicEventsRepository } from "./infrastructure/prisma-public-events.repository.js";
import { GetPublicEventsUseCase } from "./application/get-public-events.usecase.js";
import { GetPublicEventDetailsUseCase } from "./application/get-public-event-details.usecase.js";
import { GetPublicNewsUseCase, GetPublicNewsDetailsUseCase } from "./application/get-public-news.usecase.js";
import { PrismaPublicNewsRepository } from "./infrastructure/prisma-public-news.repository.js";
import { PrismaPublicBusinessesRepository } from "./infrastructure/prisma-public-businesses.repository.js";
import { GetPublicBusinessesUseCase, GetPublicBusinessCategoriesUseCase, GetPublicBusinessDetailsUseCase } from "./application/get-public-businesses.usecase.js";
import { createPublicBusinessesRouter } from "./presentation/public-businesses.controller.js";
import { GetPublicPageUseCase } from "./application/get-public-page.usecase.js";
import { PrismaPublicPagesRepository } from "./infrastructure/prisma-public-pages.repository.js";
import { PrismaAdminSettingsRepository } from "../system-settings/infrastructure/prisma-admin-settings.repository.js";
import { GetPublicWebsiteEntriesUseCase } from "./application/get-public-website-entries.usecase.js";
import { PrismaPublicWebsiteEntriesRepository } from "./infrastructure/prisma-public-website-entries.repository.js";
import { createPublicWebsiteEntriesRouter } from "./presentation/public-website-entries.controller.js";

const repository = new PrismaPublicHomePreviewRepository();
const getHomePreviews = new GetHomePreviewsUseCase(repository);
const getPublicProgrammes = new GetPublicProgrammesUseCase(repository);
const eventsRepository = new PrismaPublicEventsRepository();
const getPublicEvents = new GetPublicEventsUseCase(eventsRepository);
const getPublicEventDetails = new GetPublicEventDetailsUseCase(eventsRepository);
const newsRepository = new PrismaPublicNewsRepository();
const getPublicNews = new GetPublicNewsUseCase(newsRepository);
const getPublicNewsDetails = new GetPublicNewsDetailsUseCase(newsRepository);

const organisationSettings = new PrismaAdminSettingsRepository();
export const publicPagesRouter = createPublicPagesRouter(getHomePreviews, getPublicProgrammes, getPublicEvents, getPublicEventDetails, getPublicNews, getPublicNewsDetails, new GetPublicPageUseCase(new PrismaPublicPagesRepository()), () => organisationSettings.get());
export const publicWebsiteEntriesRouter = createPublicWebsiteEntriesRouter(new GetPublicWebsiteEntriesUseCase(new PrismaPublicWebsiteEntriesRepository()));

const businessesRepository = new PrismaPublicBusinessesRepository();
export const publicBusinessesRouter = createPublicBusinessesRouter(
  new GetPublicBusinessesUseCase(businessesRepository),
  new GetPublicBusinessCategoriesUseCase(businessesRepository),
  new GetPublicBusinessDetailsUseCase(businessesRepository),
);
