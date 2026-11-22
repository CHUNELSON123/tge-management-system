export interface MentorProfile {
  expertise: string | null; professionalBackground: string | null; availability: string | null; status: string; createdAt: Date;
  user: { firstName: string; lastName: string; email: string; phone: string | null; location: string | null; bio: string | null; lastLoginAt: Date | null };
}
export interface MentorPerson { id: string; membershipStatus: string; user: { firstName: string; lastName: string; email: string; lastLoginAt: Date | null } }
export interface MentorProgramme { id: string; name: string; description: string | null; status: string; coverImageUrl: string | null }
export interface MentorSession { id: string; title: string; scheduledStart: Date; scheduledEnd: Date | null; locationOrUrl: string | null; status: string; assignment: { id: string; member: { id: string; user: { firstName: string; lastName: string } }; programme: { id: string; name: string } | null } }
export interface MentorWork {
  programmes: MentorProgramme[];
  directProgrammeIds: string[];
  cohorts: Array<{ id: string; name: string; status: string; assignedAt: Date; startDate: Date; endDate: Date | null; programme: MentorProgramme; enrollments: Array<{ status: string; enrolledAt: Date; member: MentorPerson }> }>;
  assignments: Array<{ id: string; status: string; createdAt: Date; programme: { id: string; name: string } | null; member: MentorPerson }>;
  sessions: Array<{ id: string; title: string; scheduledStart: Date; scheduledEnd: Date | null; locationOrUrl: string | null; assignment: { member: { user: { firstName: string; lastName: string } } } }>;
  resources: Array<{ id: string; title: string; resourceType: string; mimeType: string | null; category: { id: string; name: string }; uploadedByUserId: string; publishedAt: Date | null; programmeIds: string[]; cohortIds: string[]; fileSize: number | null }>;
}
