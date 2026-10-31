import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const envResult = dotenv.config({
  path: resolve(currentDirectory, "../.env"),
  override: true,
});

if (envResult.error) {
  throw envResult.error;
}

const { createApp } = await import("./app.module.js");

const port = Number(process.env.PORT) || 4000;
const app = createApp();

app.listen(port, () => {
  console.log(`TGE API listening on port ${port}`);
});
