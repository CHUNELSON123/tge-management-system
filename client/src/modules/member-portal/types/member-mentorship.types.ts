export interface MemberMentorshipSession { id: string; title: string; scheduledStart: string; scheduledEnd: string | null; status: string }
export interface MemberMentorshipAssignment { id: string; mentorName: string; expertise: string | null; programmeName: string | null; status: string; sessions: MemberMentorshipSession[] }
export interface MemberMentorshipData { assignments: MemberMentorshipAssignment[]; completedSessions: number; mentorshipHours: number | null }
