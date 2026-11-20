export interface MentorResourceInput { id: string; title: string; categoryId: string; targetType: "programme" | "cohort"; targetId: string; storageKey: string; filename: string; mimeType: string; fileSize: number }
export interface MentorResourcesRepository {
  categories(): Promise<{ id: string; name: string }[]>;
  create(userId: string, input: MentorResourceInput): Promise<{ id: string } | null>;
}
export interface MentorUploadStorage { store(id: string, filename: string, content: Uint8Array): Promise<string>; remove(key: string): Promise<void> }
