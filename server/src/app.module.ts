import express from "express";
import cors from "cors";
import helmet from "helmet";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { authModule, authRouter, accountRouter } from "./modules/auth/auth.module.js";
import { publicPagesRouter, publicBusinessesRouter } from "./modules/public-pages/public-pages.module.js";
import { memberPortalRouter } from "./modules/member-portal/member-portal.module.js";
import { memberNotificationsRouter } from "./modules/member-portal/member-notifications.module.js";
import { memberMessagesRouter } from "./modules/member-portal/member-messages.module.js";
import { memberResourceFilesRouter } from "./modules/member-portal/member-resource-files.module.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
  }));
  app.use(express.json());

  const appController = new AppController(new AppService());

  app.use("/api", appController.router);
  app.use("/api/public", publicPagesRouter);
  app.use("/api/public", publicBusinessesRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/auth/accounts", accountRouter);
  app.use("/api/membership-applications", authModule);
  app.use("/api/member", memberPortalRouter);
  app.use("/api/member", memberNotificationsRouter);
  app.use("/api/member", memberMessagesRouter);
  app.use("/api/member", memberResourceFilesRouter);

  return app;
}



