import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const environmentFile = [
  resolve(currentDirectory, "../.env"),
  resolve(currentDirectory, "../../.env"),
].find(existsSync);

dotenv.config({ path: environmentFile });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required.");
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
