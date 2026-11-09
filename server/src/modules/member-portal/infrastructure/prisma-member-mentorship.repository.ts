import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { MemberMentorshipData, MemberMentorshipRepository } from "../domain/member-mentorship.repository.js";

export class PrismaMemberMentorshipRepository implements MemberMentorshipRepository {
  constructor(private readonly database = prisma) {}

  async findForUser(userId: string): Promise<MemberMentorshipData | null> {
    const member = await this.database.member.findUnique({
      where: { userId },
      select: { mentorAssignments: {
        orderBy: [{ startDate: "desc" }, { id: "asc" }],
        select: {
          id: true, status: true,
          programme: { select: { name: true } },
          mentor: { select: { status: true, expertise: true, user: { select: { firstName: true, lastName: true } } } },
          sessions: { orderBy: [{ scheduledStart: "desc" }, { id: "asc" }], select: { id: true, title: true, scheduledStart: true, scheduledEnd: true, status: true } },
        },
      } },
    });
    if (!member) return null;
    const assignments = member.mentorAssignments.map((assignment) => ({
      id: assignment.id,
      mentorName: [assignment.mentor.user.firstName, assignment.mentor.user.lastName].map((part) => part.trim()).filter(Boolean).join(" "),
      expertise: assignment.mentor.status === "active" ? assignment.mentor.expertise : null,
      programmeName: assignment.programme?.name ?? null,
      status: assignment.status,
      sessions: assignment.sessions.map((session) => ({ id: session.id, title: session.title, scheduledStart: session.scheduledStart.toISOString(), scheduledEnd: session.scheduledEnd?.toISOString() ?? null, status: session.status })),
    }));
    const completed = member.mentorAssignments.flatMap((assignment) => assignment.sessions).filter((session) => session.status.toLowerCase() === "completed");
    return {
      assignments,
      completedSessions: completed.length,
      // The schema stores scheduled duration, not completed/attended duration. Do not report scheduled time as delivered mentorship hours.
      mentorshipHours: null,
    };
  }
}
