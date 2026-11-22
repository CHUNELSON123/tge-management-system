import { prisma } from "../../../infrastructure/database/prisma-client.js";
import { enrollmentBlock, progressionFor, progressionSelect } from "../../programme-progression/progression.js";
import { assessProgress } from "../../programme-progression/progress-policy.js";
import type { MemberProgrammeRecord, MemberProgrammesRepository } from "../domain/member-programmes.repository.js";

export class PrismaMemberProgrammesRepository implements MemberProgrammesRepository {
  constructor(private readonly database = prisma) {}

  async listForMember(userId: string): Promise<MemberProgrammeRecord[] | null> {
    const member = await this.database.member.findUnique({ where: { userId }, select: { id: true } });
    if (!member) return null;

    const [enrollments, completed] = await Promise.all([this.database.enrollment.findMany({
      where: { memberId: member.id, status: { in: ["enrolled", "completed"] } },
      orderBy: [{ enrolledAt: "desc" }, { id: "asc" }],
      select: {
        status: true,
        enrolledAt: true,
        progress: true,
        cohort: { select: { id: true, name: true, startDate: true, endDate: true, progressRevision: true, progressPolicy: true, programme: { select: { id: true, name: true, slug: true, description: true, startDate: true, endDate: true, progressPolicy: true } } } },
      },
    }), this.database.enrollment.findMany({ where: { memberId: member.id, status: "completed" }, select: progressionSelect })]);
    const progress = progressionFor(completed);
    const assigned: MemberProgrammeRecord[] = [];
    for (const enrollment of enrollments) {
      const programme = enrollment.cohort.programme;
      const policy = enrollment.cohort.progressPolicy ?? programme.progressPolicy;
      const assessment = assessProgress(policy, enrollment.cohort.progressPolicy ? "cohort" : policy ? "programme" : null, enrollment.progress, enrollment.cohort.progressRevision);
      const completionNeedsReview = enrollment.status === "completed" && (policy ? (!assessment.requirementsMet || !assessment.approvalCurrent) : enrollment.cohort.progressRevision > 0 || !!enrollment.progress?.approvedPolicyKey);
      assigned.push({
        id: programme.id,
        name: programme.name,
        slug: programme.slug,
        description: programme.description,
        startDate: enrollment.cohort.startDate.toISOString().slice(0, 10),
        endDate: enrollment.cohort.endDate?.toISOString().slice(0, 10) ?? null,
        cohortId: enrollment.cohort.id,
        cohortName: enrollment.cohort.name,
        enrollmentStatus: completionNeedsReview ? "enrolled" : enrollment.status,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        eligibilityBlock: null,
        progress: { ...assessment, completionNeedsReview },
      });
    }

    const published = await this.database.programme.findMany({
      where: { status: "published", id: { notIn: assigned.map((programme) => programme.id) } },
      orderBy: [{ startDate: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, description: true, code: true, startDate: true, endDate: true },
    });
    const available = published.map((programme) => ({
      id: programme.id,
      name: programme.name,
      slug: programme.slug,
      description: programme.description,
      startDate: programme.startDate?.toISOString().slice(0, 10) ?? null,
      endDate: programme.endDate?.toISOString().slice(0, 10) ?? null,
      cohortId: null,
      cohortName: null,
      enrollmentStatus: null,
      enrolledAt: null,
      eligibilityBlock: enrollmentBlock(programme.code, progress),
      progress: null,
    }));
    return [...assigned, ...available];
  }
}
