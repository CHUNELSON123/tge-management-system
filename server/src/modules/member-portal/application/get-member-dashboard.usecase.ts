import type { MemberDashboard, MemberDashboardRepository } from "../domain/member-dashboard.repository.js";

export class GetMemberDashboardUseCase {
  constructor(private readonly repository: MemberDashboardRepository) {}

  async execute(input: { userId: string; roleId: string; now?: Date }): Promise<MemberDashboard> {
    const now = input.now ?? new Date();
    const identity = await this.repository.findIdentity(input.userId);
    if (!identity?.memberId) {
      return {
        profile: { displayName: identity?.displayName ?? null, incomplete: true },
        summary: { enrolledProgrammes: null, upcomingEvents: null, upcomingMentorshipSessions: null, certificatesEarned: null },
        unreadNotifications: null, programmes: [], upcomingEvents: [], recentAnnouncements: [],
      };
    }
    const memberId = identity.memberId;
    const cohortIds = [...new Set(identity.enrolledCohorts.map(({ cohortId }) => cohortId))];
    const programmeIds = [...new Set(identity.enrolledCohorts.map(({ programmeId }) => programmeId))];
    const [programmeCount, programmes, eventCount, events, mentorshipCount, announcements, unreadNotifications] = await Promise.all([
      this.repository.countEnrolledProgrammes(memberId),
      this.repository.listEnrolledProgrammes(memberId, 3),
      this.repository.countUpcomingEvents(memberId, now),
      this.repository.listUpcomingEvents(memberId, now, 3),
      this.repository.countUpcomingMentorshipSessions(memberId, now),
      this.repository.listRecentAnnouncements({ memberId, roleId: input.roleId, cohortIds, programmeIds, now, limit: 3 }),
      this.repository.countUnreadNotifications(input.userId),
    ]);
    return {
      profile: { displayName: identity.displayName, incomplete: !identity.displayName },
      summary: { enrolledProgrammes: programmeCount, upcomingEvents: eventCount, upcomingMentorshipSessions: mentorshipCount, certificatesEarned: null },
      unreadNotifications, programmes, upcomingEvents: events, recentAnnouncements: announcements,
    };
  }
}
