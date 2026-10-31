import { Router } from "express";
import { AppService } from "./app.service.js";

export class AppController {
  readonly router = Router();

  constructor(private readonly appService: AppService) {
    this.router.get("/health", (_req, res) => {
      res.status(200).json(this.appService.getHealth());
    });
  }
}
