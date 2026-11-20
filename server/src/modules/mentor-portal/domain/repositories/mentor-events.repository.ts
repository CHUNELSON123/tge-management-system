export interface MentorEvent { id: string; title: string; shortDescription: string | null; eventType: string; startAt: Date; endAt: Date | null; venue: string | null; eventMode: string | null; status: string; isAssigned: boolean; registeredCount: number }
export interface MentorEventsRepository { list(userId: string): Promise<MentorEvent[]> }
