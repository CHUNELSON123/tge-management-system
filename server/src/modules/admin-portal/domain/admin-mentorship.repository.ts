export type AssignmentStatus = "active" | "completed" | "cancelled";
export interface MentorshipFilter { search?: string; status?: string; page: number; pageSize: number }
export interface MentorshipAssignmentInput { mentorId: string; memberId: string; programmeId: string | null; startDate: string; endDate: string | null; notes: string | null }
export interface MentorshipSessionInput {title:string;scheduledStart:string;scheduledEnd:string|null;locationOrUrl:string|null;notes:string|null}
export interface MentorshipObjectiveInput {title:string;description:string|null;targetDate:string|null}
export interface MentorshipSummary { mentors: number; activeMentees: number; activeMatches: number; completedSessions: number }
export interface MentorshipAssignmentRow {
  id: string; mentorId: string; mentorName: string; mentorExpertise: string | null; memberId: string; memberName: string; memberEmail: string;
  programmeId: string | null; programmeName: string | null; status: string; startDate: string; endDate: string | null;
  sessionCount: number; completedSessionCount: number; objectiveCount: number; updatedAt: string;
}
export interface MentorshipOptions { mentors: Array<{id:string;name:string;expertise:string|null}>; members:Array<{id:string;name:string;email:string;foundationComplete:boolean;secondStageComplete:boolean}>; programmes:Array<{id:string;name:string}> }
export interface MentorshipProgressRecord { id:string; note:string; value:number|null; recordedAt:string; recordedBy:string }
export interface MentorshipDetail extends MentorshipAssignmentRow {
  notes:string|null; sessions:Array<{id:string;title:string;scheduledStart:string;scheduledEnd:string|null;locationOrUrl:string|null;status:string;notes:string|null;outcome:string|null}>;
  objectives:Array<{id:string;title:string;description:string|null;status:string;targetDate:string|null;progressRecords:MentorshipProgressRecord[]}>;
}
export interface MentorshipProfileDetail {id:string;name:string;email:string;status:string;expertise:string|null;professionalBackground:string|null;availability:string|null;createdAt:string;assignments:MentorshipAssignmentRow[]}
export interface AdminMentorshipRepository {
  mentorIdForUser(userId:string):Promise<string|null>;
  list(filter:MentorshipFilter, scopeMentorId?:string):Promise<{summary:MentorshipSummary;rows:MentorshipAssignmentRow[];total:number;page:number;pageSize:number}>;
  options():Promise<MentorshipOptions>;
  getMentor(id:string,scopeUserId?:string):Promise<MentorshipProfileDetail|null>;
  get(id:string,scopeMentorId?:string):Promise<MentorshipDetail|null>;
  create(input:MentorshipAssignmentInput,actorId:string):Promise<MentorshipDetail>;
  reassign(assignmentId:string,mentorId:string,actorId:string):Promise<MentorshipDetail|null>;
  createSession(assignmentId:string,actorId:string,input:MentorshipSessionInput,scopeMentorId?:string):Promise<MentorshipDetail|null>;
  createObjective(assignmentId:string,actorId:string,input:MentorshipObjectiveInput,scopeMentorId?:string):Promise<MentorshipDetail|null>;
  recordProgress(objectiveId:string,actorId:string,note:string,value:number|null,scopeMentorId?:string):Promise<MentorshipProgressRecord|null>;
}
