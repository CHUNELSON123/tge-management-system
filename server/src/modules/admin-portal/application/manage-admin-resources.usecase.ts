import type { AdminResourceFileStorage, AdminResourcesRepository, ResourceFilter, ResourceInput, ResourceStatus } from "../domain/admin-resources.repository.js";
export class ManageAdminResourcesUseCase {
  constructor(private readonly repository: AdminResourcesRepository, private readonly storage:AdminResourceFileStorage) {}
  list(filter: ResourceFilter) { return this.repository.list(filter); }
  get(id: string) { return this.repository.get(id); }
  categories() { return this.repository.categories(); }
  save(input: ResourceInput, actor: string, id?: string) { return this.repository.save(input, actor, id); }
  setStatus(id: string, status: ResourceStatus, actor: string) { return this.repository.setStatus(id, status, actor); }
  async addVersion(id:string,actor:string,file:{originalFilename:string;mimeType:string;content:Uint8Array}) {
    const storageKey=await this.storage.store(id,file.originalFilename,file.content);
    try {
      const resource=await this.repository.addVersion(id,actor,{storageKey,originalFilename:file.originalFilename,mimeType:file.mimeType,fileSize:file.content.byteLength});
      if(!resource) throw new Error("RESOURCE_NOT_FOUND");
      return resource;
    } catch(error) {
      await this.storage.remove(storageKey).catch(()=>undefined);
      throw error;
    }
  }
  async download(id:string,versionId?:string) {
    const version=await this.repository.getVersion(id,versionId);
    if(!version)return null;
    const file=await this.storage.open(version.storageKey);
    const {storageKey:_storageKey,...metadata}=version;
    return {...metadata,content:file.content,fileSize:file.fileSize};
  }
}
