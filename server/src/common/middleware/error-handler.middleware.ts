import type { ErrorRequestHandler } from "express";

// Never send exception messages, request bodies, or provider errors to clients.
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const type = typeof error === "object" && error !== null && "type" in error
    ? error.type
    : undefined;

  if (type === "entity.parse.failed") {
    res.status(400).json({ message: "Invalid JSON body." });
    return;
  }

  if (type === "entity.too.large") {
    res.status(413).json({ message: "Request body is too large." });
    return;
  }

  res.status(500).json({ message: "An unexpected error occurred." });
};
