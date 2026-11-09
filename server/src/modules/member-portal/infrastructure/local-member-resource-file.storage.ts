import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import type { MemberResourceFileContent, MemberResourceFileStorage } from "../domain/member-resources.repository.js";

export class LocalMemberResourceFileStorage implements MemberResourceFileStorage {
  async open(storageKey: string): Promise<MemberResourceFileContent> {
    const configuredRoot = process.env.RESOURCE_STORAGE_ROOT?.trim();
    if (!configuredRoot) throw new Error("Resource file storage is not configured.");
    const key = storageKey.replaceAll("\\", "/");
    if (!key || key.startsWith("/") || isAbsolute(key) || key.split("/").some((part) => part === ".." || part === ".")) {
      throw new Error("Resource file key is invalid.");
    }
    const root = await realpath(resolve(configuredRoot));
    const filePath = await realpath(join(root, key));
    const rel = relative(root, filePath);
    if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error("Resource file is outside the configured storage root.");
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) throw new Error("Resource file is not a regular file.");
    return { content: createReadStream(filePath), fileSize: fileStats.size };
  }
}
