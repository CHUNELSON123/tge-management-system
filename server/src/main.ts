import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const envResult = dotenv.config({
  path: resolve(currentDirectory, "../.env"),
  quiet: true,
});

if (envResult.error && (envResult.error as NodeJS.ErrnoException).code !== "ENOENT") {
  throw envResult.error;
}

const { createApp } = await import("./app.module.js");
const { startCallExpiry } = await import("./modules/member-portal/member-messages.module.js");

const port = Number(process.env.PORT) || 4000;
const app = createApp();

app.listen(port, () => {
  startCallExpiry();
  console.log(`TGE API listening on port ${port}`);
});
