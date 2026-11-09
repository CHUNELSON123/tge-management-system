export interface MemberProgrammeRecord {
  id: string; name: string; slug: string; description: string | null; startDate: string | null; endDate: string | null;
  cohortName: string | null; enrollmentStatus: string | null; enrolledAt: string | null;
}
export interface MemberProgrammesRepository { listForMember(userId: string): Promise<MemberProgrammeRecord[] | null> }
