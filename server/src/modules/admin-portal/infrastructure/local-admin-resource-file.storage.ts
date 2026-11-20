import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, realpath, rm, stat, writeFile, rename } from "node:fs/promises";
import { extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import type { AdminResourceFileStorage, ResourceFileContent } from "../domain/admin-resources.repository.js";

function assertSafeKey(key:string) {
  const normalized=key.replaceAll("\\","/");
  if(!normalized||normalized.startsWith("/")||isAbsolute(normalized)||normalized.split("/").some(part=>part==="."||part==="..")) throw new Error("Resource file key is invalid.");
  return normalized;
}

export class LocalAdminResourceFileStorage implements AdminResourceFileStorage {
  private configuredRoot() { return resolve(process.env.RESOURCE_STORAGE_ROOT?.trim()||"./storage/resources"); }
  private async root() { const root=this.configuredRoot(); await mkdir(root,{recursive:true}); return realpath(root); }
  private async safePath(key:string) {
    const root=await this.root();
    const path=resolve(root,...assertSafeKey(key).split("/"));
    const relativePath=relative(root,path);
    if(!relativePath||relativePath===".."||relativePath.startsWith(`..${sep}`)||isAbsolute(relativePath)) throw new Error("Resource file is outside the configured storage root.");
    return {root,path};
  }

  async store(resourceId:string,originalFilename:string,content:Uint8Array):Promise<string> {
    const extension=extname(originalFilename).toLowerCase();
    const key=assertSafeKey(`${resourceId}/${randomUUID()}${extension}`);
    const {path}=await this.safePath(key);
    await mkdir(resolve(path,".."),{recursive:true});
    const temporary=`${path}.${randomUUID()}.tmp`;
    try { await writeFile(temporary,content,{flag:"wx",mode:0o600}); await rename(temporary,path); }
    catch(error) { await rm(temporary,{force:true}); throw error; }
    return key;
  }

  async open(storageKey:string):Promise<ResourceFileContent> {
    const {root,path}=await this.safePath(storageKey);
    const resolved=await realpath(path);
    const relativePath=relative(root,resolved);
    if(!relativePath||relativePath===".."||relativePath.startsWith(`..${sep}`)||isAbsolute(relativePath)) throw new Error("Resource file is outside the configured storage root.");
    const file=await stat(resolved);
    if(!file.isFile()) throw new Error("Resource file is not a regular file.");
    return {content:createReadStream(resolved),fileSize:file.size};
  }

  async remove(storageKey:string):Promise<void> {
    const {path}=await this.safePath(storageKey);
    await rm(path,{force:true});
  }
}
