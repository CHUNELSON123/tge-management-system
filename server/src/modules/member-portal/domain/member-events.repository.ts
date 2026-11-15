export interface MemberEventRecord {
  id: string; title: string; eventType: string; description: string | null; startAt: string; endAt: string | null;
  timezone: string | null; venue: string | null; registrationStatus: string | null; registeredAt: string | null;
}
export interface MemberEventDetails extends MemberEventRecord { isUpcoming: boolean }
export interface MemberEventsRepository {
  listForMember(userId: string): Promise<MemberEventRecord[] | null>;
  findAccessibleEvent(userId: string, eventId: string, now: Date): Promise<MemberEventDetails | null>;
}
