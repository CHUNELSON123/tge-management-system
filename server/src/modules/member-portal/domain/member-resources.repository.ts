export interface MemberResource {
  id: string; title: string; description: string | null; category: string; resourceType: string;
  version: number | null; mimeType: string | null; fileSize: number | null; publishedAt: string | null;
}
export interface MemberResourcesRepository {
  findForUser(userId: string, now: Date): Promise<MemberResource[] | null>;
  findFileForUser(userId: string, resourceId: string, now: Date): Promise<MemberResourceFileRecord | null>;
}
export interface MemberResourceFileRecord { storageKey: string; originalFilename: string; mimeType: string }
export interface MemberResourceFileContent { content: AsyncIterable<Uint8Array>; fileSize: number }
export interface MemberResourceFileStorage { open(storageKey: string): Promise<MemberResourceFileContent> }
