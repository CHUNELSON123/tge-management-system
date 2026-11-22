import { prisma } from "../../../infrastructure/database/prisma-client.js";
import { progressionFor, progressionSelect } from "../../programme-progression/progression.js";
import type { AdminMentorshipRepository, MentorshipAssignmentInput, MentorshipAssignmentRow, MentorshipDetail, MentorshipFilter, MentorshipOptions, MentorshipProgressRecord, MentorshipSummary, MentorshipSessionInput, MentorshipObjectiveInput, MentorshipProfileDetail } from "../domain/admin-mentorship.repository.js";

const assignmentSelect={
  id:true,mentorId:true,memberId:true,programmeId:true,status:true,startDate:true,endDate:true,createdAt:true,
  mentor:{select:{expertise:true,user:{select:{firstName:true,lastName:true}}}},
  member:{select:{user:{select:{firstName:true,lastName:true,email:true}}}},
  programme:{select:{name:true}},
  _count:{select:{sessions:true,objectives:true}},
  sessions:{select:{status:true}},
} as const;
const isoDay=(value:Date|null)=>value?.toISOString().slice(0,10)??null;
function shape(row:any):MentorshipAssignmentRow {
  const sessions=row.sessions as Array<{status:string}>;
  return {id:row.id,mentorId:row.mentorId,mentorName:[row.mentor.user.firstName,row.mentor.user.lastName].filter(Boolean).join(" "),mentorExpertise:row.mentor.expertise,memberId:row.memberId,memberName:[row.member.user.firstName,row.member.user.lastName].filter(Boolean).join(" "),memberEmail:row.member.user.email,programmeId:row.programmeId,programmeName:row.programme?.name??null,status:row.status,startDate:isoDay(row.startDate)!,endDate:isoDay(row.endDate),sessionCount:row._count.sessions,completedSessionCount:sessions.filter((item)=>item.status.toLowerCase()==="completed").length,objectiveCount:row._count.objectives,updatedAt:row.createdAt.toISOString()};
}
function whereFor(search?:string,status?:string,scopeMentorId?:string) {
  const q=search?.trim();
  return { ...(status?{status}:{}),...(scopeMentorId?{mentorId:scopeMentorId}:{}),...(q?{OR:[{mentor:{user:{firstName:{contains:q,mode:"insensitive" as const}}}},{mentor:{user:{lastName:{contains:q,mode:"insensitive" as const}}}},{member:{user:{firstName:{contains:q,mode:"insensitive" as const}}}},{member:{user:{lastName:{contains:q,mode:"insensitive" as const}}}},{programme:{name:{contains:q,mode:"insensitive" as const}}}]}:{}) };
}

export class PrismaAdminMentorshipRepository implements AdminMentorshipRepository {
  async mentorIdForUser(userId:string) { return (await prisma.mentor.findUnique({where:{userId},select:{id:true}}))?.id??null; }

  async list(filter:MentorshipFilter,scopeMentorId?:string) {
    const where=whereFor(filter.search,filter.status,scopeMentorId);
    const summaryWhere=scopeMentorId?{mentorId:scopeMentorId}:{};
    const [total,records,mentors,activeAssignments,distinctMentees,completedSessions]=await Promise.all([
      prisma.mentorAssignment.count({where}),
      prisma.mentorAssignment.findMany({where,orderBy:[{createdAt:"desc"},{id:"asc"}],skip:(filter.page-1)*filter.pageSize,take:filter.pageSize,select:assignmentSelect}),
      prisma.mentor.count({where:{status:"active",user:{status:"ACTIVE",deletedAt:null}}}),
      prisma.mentorAssignment.count({where:{...summaryWhere,status:"active"}}),
      prisma.mentorAssignment.findMany({where:{...summaryWhere,status:"active"},distinct:["memberId"],select:{memberId:true}}),
      prisma.mentoringSession.count({where:{status:{equals:"completed",mode:"insensitive"},assignment:summaryWhere}}),
    ]);
    const summary:MentorshipSummary={mentors,activeMentees:distinctMentees.length,activeMatches:activeAssignments,completedSessions};
    return {summary,rows:records.map(shape),total,page:filter.page,pageSize:filter.pageSize};
  }

  async options():Promise<MentorshipOptions> {
    const [mentors,members,programmes]=await Promise.all([
      prisma.mentor.findMany({where:{status:"active",user:{status:"ACTIVE",deletedAt:null}},orderBy:[{user:{firstName:"asc"}},{user:{lastName:"asc"}}],select:{id:true,expertise:true,user:{select:{firstName:true,lastName:true}}}}),
      prisma.member.findMany({where:{membershipStatus:"active",user:{status:"ACTIVE",deletedAt:null}},orderBy:[{user:{firstName:"asc"}},{user:{lastName:"asc"}}],select:{id:true,user:{select:{firstName:true,lastName:true,email:true}},enrollments:{where:{status:"completed"},select:progressionSelect}}}),
      prisma.programme.findMany({where:{status:{not:"archived"}},orderBy:{name:"asc"},select:{id:true,name:true}}),
    ]);
    return {mentors:mentors.map(row=>({id:row.id,name:[row.user.firstName,row.user.lastName].filter(Boolean).join(" "),expertise:row.expertise})),members:members.map(row=>({id:row.id,name:[row.user.firstName,row.user.lastName].filter(Boolean).join(" "),email:row.user.email,...progressionFor(row.enrollments)})),programmes};
  }

  async getMentor(id:string,scopeUserId?:string):Promise<MentorshipProfileDetail|null> {
    const row=await prisma.mentor.findFirst({where:{id,...(scopeUserId?{userId:scopeUserId}:{})},select:{id:true,status:true,expertise:true,professionalBackground:true,availability:true,createdAt:true,user:{select:{firstName:true,lastName:true,email:true}},assignments:{orderBy:[{createdAt:"desc"},{id:"asc"}],select:assignmentSelect}}});
    if(!row)return null;
    return {id:row.id,name:[row.user.firstName,row.user.lastName].filter(Boolean).join(" "),email:row.user.email,status:row.status,expertise:row.expertise,professionalBackground:row.professionalBackground,availability:row.availability,createdAt:row.createdAt.toISOString(),assignments:row.assignments.map(shape)};
  }

  async get(id:string,scopeMentorId?:string):Promise<MentorshipDetail|null> {
    const row=await prisma.mentorAssignment.findFirst({where:{id,...(scopeMentorId?{mentorId:scopeMentorId}:{})},select:{...assignmentSelect,notes:true,sessions:{orderBy:[{scheduledStart:"desc"},{id:"asc"}],select:{id:true,title:true,scheduledStart:true,scheduledEnd:true,locationOrUrl:true,status:true,notes:true,outcome:true}},objectives:{orderBy:[{targetDate:"asc"},{createdAt:"asc"}],select:{id:true,title:true,description:true,status:true,targetDate:true,progressRecords:{orderBy:[{recordedAt:"desc"},{id:"asc"}],select:{id:true,progressNote:true,progressValue:true,recordedAt:true,recordedBy:{select:{firstName:true,lastName:true}}}}}}}});
    if(!row)return null;
    const records=row.objectives.flatMap(item=>item.progressRecords);
    return {...shape(row),notes:scopeMentorId?null:row.notes,sessions:row.sessions.map(item=>({id:item.id,title:item.title,scheduledStart:item.scheduledStart.toISOString(),scheduledEnd:item.scheduledEnd?.toISOString()??null,locationOrUrl:item.locationOrUrl,status:item.status,notes:item.notes,outcome:item.outcome})),objectives:row.objectives.map(item=>({id:item.id,title:item.title,description:item.description,status:item.status,targetDate:isoDay(item.targetDate),progressRecords:item.progressRecords.map(p=>({id:p.id,note:p.progressNote,value:p.progressValue,recordedAt:p.recordedAt.toISOString(),recordedBy:[p.recordedBy.firstName,p.recordedBy.lastName].filter(Boolean).join(" ")}))}))};
  }

  async create(input:MentorshipAssignmentInput,actorId:string):Promise<MentorshipDetail> {
    const created=await prisma.$transaction(async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('tge_progression_policy')::bigint)`;
      await tx.$queryRaw`SELECT id FROM members WHERE id = ${input.memberId}::uuid FOR UPDATE`;
      const [mentor,member,programme,duplicate]=await Promise.all([
        tx.mentor.findFirst({where:{id:input.mentorId,status:"active",user:{status:"ACTIVE",deletedAt:null}},select:{id:true,userId:true}}),
        tx.member.findFirst({where:{id:input.memberId,membershipStatus:"active",user:{status:"ACTIVE",deletedAt:null}},select:{id:true,userId:true}}),
        input.programmeId?tx.programme.findFirst({where:{id:input.programmeId,status:{not:"archived"}},select:{id:true}}):Promise.resolve({id:"optional"}),
        tx.mentorAssignment.findFirst({where:{mentorId:input.mentorId,memberId:input.memberId,programmeId:input.programmeId,status:"active"},select:{id:true}}),
      ]);
      if(!mentor)throw new Error("MENTOR_NOT_ELIGIBLE");
      if(!member)throw new Error("MEMBER_NOT_ELIGIBLE");
      const progress = progressionFor(await tx.enrollment.findMany({where:{memberId:input.memberId,status:"completed"},select:progressionSelect}));
      if(!progress.foundationComplete)throw new Error("FOUNDATION_REQUIRED");
      if(!progress.secondStageComplete)throw new Error("SECOND_STAGE_REQUIRED");
      if(!programme)throw new Error("PROGRAMME_NOT_ELIGIBLE");
      if(duplicate)throw new Error("MENTORSHIP_ASSIGNMENT_EXISTS");
      const assignment=await tx.mentorAssignment.create({data:{mentorId:input.mentorId,memberId:input.memberId,programmeId:input.programmeId,startDate:new Date(`${input.startDate}T00:00:00.000Z`),endDate:input.endDate?new Date(`${input.endDate}T00:00:00.000Z`):null,notes:input.notes,status:"active"},select:{id:true}});
      await tx.notification.createMany({data:[{userId:member.userId,title:"Mentor assigned",body:"An administrator assigned you a mentor. Open My Mentorship to see the assignment.",notificationType:"mentorship"},{userId:mentor.userId,title:"New mentee assigned",body:"An administrator assigned you a mentee. Open Mentorship to see the assignment.",notificationType:"mentorship"}]});
      await tx.auditLog.create({data:{actorUserId:actorId,action:"ADMIN_MENTORSHIP_ASSIGNED",entityType:"MentorAssignment",entityId:assignment.id,details:{mentorId:input.mentorId,memberId:input.memberId,programmeId:input.programmeId,status:"active"}}});
      return assignment.id;
    });
    const detail=await this.get(created);
    if(!detail)throw new Error("MENTORSHIP_ASSIGNMENT_NOT_FOUND");
    return detail;
  }

  async reassign(assignmentId:string,mentorId:string,actorId:string):Promise<MentorshipDetail|null> {
    await prisma.$transaction(async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('tge_progression_policy')::bigint)`;
      const current=await tx.mentorAssignment.findUnique({where:{id:assignmentId},select:{id:true,mentorId:true,memberId:true,programmeId:true,status:true}});
      if(!current)throw new Error("MENTORSHIP_ASSIGNMENT_NOT_FOUND");
      if(current.status!=="active")throw new Error("MENTORSHIP_ASSIGNMENT_NOT_ACTIVE");
      await tx.$queryRaw`SELECT id FROM members WHERE id = ${current.memberId}::uuid FOR UPDATE`;
      const progress = progressionFor(await tx.enrollment.findMany({where:{memberId:current.memberId,status:"completed"},select:progressionSelect}));
      if(!progress.foundationComplete)throw new Error("FOUNDATION_REQUIRED");
      if(!progress.secondStageComplete)throw new Error("SECOND_STAGE_REQUIRED");
      const mentor=await tx.mentor.findFirst({where:{id:mentorId,status:"active",user:{status:"ACTIVE",deletedAt:null}},select:{id:true}});
      if(!mentor)throw new Error("MENTOR_NOT_ELIGIBLE");
      const duplicate=await tx.mentorAssignment.findFirst({where:{id:{not:assignmentId},mentorId,memberId:current.memberId,programmeId:current.programmeId,status:"active"},select:{id:true}});
      if(duplicate)throw new Error("MENTORSHIP_ASSIGNMENT_EXISTS");
      await tx.mentorAssignment.update({where:{id:assignmentId},data:{mentorId}});
      await tx.auditLog.create({data:{actorUserId:actorId,action:"ADMIN_MENTORSHIP_REASSIGNED",entityType:"MentorAssignment",entityId:assignmentId,details:{previousMentorId:current.mentorId,mentorId,memberId:current.memberId,programmeId:current.programmeId,status:current.status}}});
    });
    return this.get(assignmentId);
  }

  async createSession(assignmentId:string,actorId:string,input:MentorshipSessionInput,scopeMentorId?:string):Promise<MentorshipDetail|null> {
    const created=await prisma.$transaction(async tx=>{
      await tx.$queryRaw`SELECT id FROM mentor_assignments WHERE id = ${assignmentId}::uuid FOR UPDATE`;
      const assignment=await tx.mentorAssignment.findFirst({where:{id:assignmentId,status:"active",...(scopeMentorId?{mentorId:scopeMentorId}:{})},select:{id:true}});
      if(!assignment)return false;
      const session=await tx.mentoringSession.create({data:{assignmentId,title:input.title,scheduledStart:new Date(input.scheduledStart),scheduledEnd:input.scheduledEnd?new Date(input.scheduledEnd):null,locationOrUrl:input.locationOrUrl,notes:input.notes,status:"scheduled"},select:{id:true}});
      await tx.auditLog.create({data:{actorUserId:actorId,action:"MENTORSHIP_SESSION_CREATED",entityType:"MentoringSession",entityId:session.id,details:{assignmentId,status:"scheduled"}}});
      return true;
    });
    return created?this.get(assignmentId,scopeMentorId):null;
  }

  async createObjective(assignmentId:string,actorId:string,input:MentorshipObjectiveInput,scopeMentorId?:string):Promise<MentorshipDetail|null> {
    const created=await prisma.$transaction(async tx=>{
      await tx.$queryRaw`SELECT id FROM mentor_assignments WHERE id = ${assignmentId}::uuid FOR UPDATE`;
      const assignment=await tx.mentorAssignment.findFirst({where:{id:assignmentId,status:"active",...(scopeMentorId?{mentorId:scopeMentorId}:{})},select:{id:true}});
      if(!assignment)return false;
      const objective=await tx.mentoringObjective.create({data:{assignmentId,title:input.title,description:input.description,targetDate:input.targetDate?new Date(`${input.targetDate}T00:00:00.000Z`):null,status:"not_started"},select:{id:true}});
      await tx.auditLog.create({data:{actorUserId:actorId,action:"MENTORSHIP_OBJECTIVE_CREATED",entityType:"MentoringObjective",entityId:objective.id,details:{assignmentId,status:"not_started"}}});
      return true;
    });
    return created?this.get(assignmentId,scopeMentorId):null;
  }

  async recordProgress(objectiveId:string,actorId:string,note:string,value:number|null,scopeMentorId?:string):Promise<MentorshipProgressRecord|null> {
    const result=await prisma.$transaction(async tx=>{
      const existing=await tx.mentoringObjective.findUnique({where:{id:objectiveId},select:{assignmentId:true}});
      if(!existing)return null;
      await tx.$queryRaw`SELECT id FROM mentor_assignments WHERE id = ${existing.assignmentId}::uuid FOR UPDATE`;
      const objective=await tx.mentoringObjective.findFirst({where:{id:objectiveId,assignment:{status:"active",...(scopeMentorId?{mentorId:scopeMentorId}:{})}},select:{id:true,assignmentId:true}});
      if(!objective)return null;
      const record=await tx.mentoringProgressRecord.create({data:{objectiveId,recordedByUserId:actorId,progressNote:note,progressValue:value},select:{id:true,progressNote:true,progressValue:true,recordedAt:true,recordedBy:{select:{firstName:true,lastName:true}}}});
      await tx.auditLog.create({data:{actorUserId:actorId,action:"MENTORSHIP_PROGRESS_RECORDED",entityType:"MentoringProgressRecord",entityId:record.id,details:{objectiveId,assignmentId:objective.assignmentId,hasValue:value!==null}}});
      return record;
    });
    return result?{id:result.id,note:result.progressNote,value:result.progressValue,recordedAt:result.recordedAt.toISOString(),recordedBy:[result.recordedBy.firstName,result.recordedBy.lastName].filter(Boolean).join(" ")}:null;
  }
}
