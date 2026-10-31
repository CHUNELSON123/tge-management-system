import express from "express";
import cors from "cors";
import helmet from "helmet";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { authModule, authRouter, accountRouter } from "./modules/auth/auth.module.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
  }));
  app.use(express.json());

  const appController = new AppController(new AppService());

  app.use("/api", appController.router);
  app.use("/api/auth", authRouter);
  app.use("/api/auth/accounts", accountRouter);
  app.use("/api/membership-applications", authModule);

  return app;
}



