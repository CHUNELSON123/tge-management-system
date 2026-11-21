import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createApiRateLimiter } from "./common/middleware/api-rate-limit.middleware.js";
import { errorHandler } from "./common/middleware/error-handler.middleware.js";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { authModule, authRouter, accountRouter, firstAdminRouter } from "./modules/auth/auth.module.js";
import { publicPagesRouter, publicBusinessesRouter, publicWebsiteEntriesRouter } from "./modules/public-pages/public-pages.module.js";
import { memberPortalRouter } from "./modules/member-portal/member-portal.module.js";
import { memberNotificationsRouter, sharedNotificationsRouter } from "./modules/member-portal/member-notifications.module.js";
import { memberMessagesRouter, sharedMessagesRouter } from "./modules/member-portal/member-messages.module.js";
import { memberResourceFilesRouter } from "./modules/member-portal/member-resource-files.module.js";
import { adminPortalRouter } from "./modules/admin-portal/admin-portal.module.js";
import { adminPaymentsRouter, memberPaymentsRouter } from "./modules/payments/payments.module.js";
import { memberEventRegistrationRouter } from "./modules/event-registration/event-registration.module.js";
import { mentorPortalRouter, mentorResourcesRouter, mentorEventsRouter, mentorMentorshipRouter } from "./modules/mentor-portal/mentor-portal.module.js";
import { conversationsRouter } from "./modules/messaging/messaging.module.js";
import { chatAttachmentsRouter } from "./modules/messaging/chat-attachments.module.js";
import { programmeRegistrationRouters } from "./modules/programme-registration/programme-registration.module.js";
import { mentorshipDeliveryRouters } from "./modules/mentorship-delivery/mentorship-delivery.module.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    exposedHeaders: ["Content-Disposition"],
  }));
  // Mount before parsing and routing so every present and future API route is protected.
  app.use("/api", createApiRateLimiter());
  app.use(express.json());

  const appController = new AppController(new AppService());

  app.use("/api", appController.router);
  app.use("/api/public", publicPagesRouter);
  app.use("/api/public", publicBusinessesRouter);
  app.use("/api/public", publicWebsiteEntriesRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/auth", firstAdminRouter);
  app.use("/api/auth/accounts", accountRouter);
  app.use("/api/membership-applications", authModule);
  app.use("/api/member/mentorship-delivery", mentorshipDeliveryRouters.member);
  app.use("/api/member", memberPortalRouter);
  app.use("/api/member", programmeRegistrationRouters.member);
  app.use("/api/member", memberEventRegistrationRouter);
  app.use("/api/member/payments", memberPaymentsRouter);
  app.use("/api/member", memberNotificationsRouter);
  app.use("/api/account", sharedNotificationsRouter);
  app.use("/api/member", memberMessagesRouter);
  app.use("/api/messaging", sharedMessagesRouter);
  app.use("/api/messaging", chatAttachmentsRouter);
  app.use("/api/messaging", conversationsRouter);
  app.use("/api/member", memberResourceFilesRouter);
  app.use("/api/mentor/mentorship-delivery", mentorshipDeliveryRouters.mentor);
  app.use("/api/mentor/mentorship", mentorMentorshipRouter);
  app.use("/api/mentor", mentorPortalRouter);
  app.use("/api/mentor", mentorResourcesRouter);
  app.use("/api/mentor", mentorEventsRouter);
  app.use("/api/admin/mentorship-delivery", mentorshipDeliveryRouters.admin);
  app.use("/api/admin", adminPortalRouter);
  app.use("/api/admin", programmeRegistrationRouters.admin);
  app.use("/api/admin/payments", adminPaymentsRouter);

  app.use(errorHandler);

  return app;
}
