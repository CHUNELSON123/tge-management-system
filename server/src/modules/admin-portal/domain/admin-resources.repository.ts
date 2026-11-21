export type ResourceStatus = "draft" | "published" | "archived";
export interface ResourceInput { title: string; description: string | null; resourceType: string; categoryId: string; tags: string[]; accessLevel: "public" | "member" | "restricted"; programmeIds: string[]; cohortIds: string[] }
export interface ResourceFilter { search?: string; categoryId?: string; programmeId?: string; cohortId?: string; status?: ResourceStatus; page: number; pageSize: number }
export interface ResourceVersionRow { id:string; versionNumber:number; originalFilename:string; mimeType:string; fileSize:number; createdAt:string; uploadedBy:string }
export interface StoredResourceVersion extends Omit<ResourceVersionRow, "uploadedBy"> { storageKey:string }
export interface ResourceFileContent { content:AsyncIterable<Uint8Array>; fileSize:number }
export interface AdminResourceFileStorage {
  store(resourceId:string, originalFilename:string, content:Uint8Array):Promise<string>;
  open(storageKey:string):Promise<ResourceFileContent>;
  remove(storageKey:string):Promise<void>;
}
export interface ResourceRow { id: string; title: string; description: string | null; resourceType: string; accessLevel: string; tags: string[]; status: ResourceStatus; createdAt: string; updatedAt: string; publishedAt: string | null; category: { id: string; name: string }; programmes: { id: string; name: string }[]; cohorts: { id: string; name: string }[]; latestVersion: ResourceVersionRow | null; versionHistory: ResourceVersionRow[] }
export interface ResourcePage { summary: { totalResources: number; categories: number; publishedResources: number; downloadsTracked: false }; rows: ResourceRow[]; total: number; page: number; pageSize: number }
export interface AdminResourcesRepository { list(filter: ResourceFilter): Promise<ResourcePage>; get(id: string): Promise<ResourceRow | null>; getVersion(id:string, versionId?:string):Promise<StoredResourceVersion|null>; categories(): Promise<{id:string;name:string;description:string|null}[]>; save(input: ResourceInput, actor: string, id?: string): Promise<ResourceRow>; setStatus(id: string, status: ResourceStatus, actor: string): Promise<ResourceRow | null>; addVersion(id:string, actor:string, file:{storageKey:string;originalFilename:string;mimeType:string;fileSize:number}): Promise<ResourceRow | null>; }
