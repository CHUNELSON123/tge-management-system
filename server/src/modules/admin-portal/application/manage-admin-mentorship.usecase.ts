import type { AdminMentorshipRepository, MentorshipAssignmentInput, MentorshipFilter, MentorshipObjectiveInput, MentorshipSessionInput } from "../domain/admin-mentorship.repository.js";

export class ManageAdminMentorshipUseCase {
  constructor(private readonly repository:AdminMentorshipRepository){}
  scopeForMentor(userId:string,roleName:string){return roleName==="Mentor"?this.repository.mentorIdForUser(userId):Promise.resolve(null);}
  list(filter:MentorshipFilter,scopeMentorId?:string){return this.repository.list(filter,scopeMentorId);}
  options(){return this.repository.options();}
  getMentor(id:string,actorUserId:string,roleName:string){return this.repository.getMentor(id,roleName==="Mentor"?actorUserId:undefined);}
  get(id:string,scopeMentorId?:string){return this.repository.get(id,scopeMentorId);}
  create(input:MentorshipAssignmentInput,actorId:string){return this.repository.create(input,actorId);}
  reassign(id:string,mentorId:string,actorId:string){return this.repository.reassign(id,mentorId,actorId);}
  createSession(assignmentId:string,actorId:string,input:MentorshipSessionInput,scopeMentorId?:string){return this.repository.createSession(assignmentId,actorId,input,scopeMentorId);}
  createObjective(assignmentId:string,actorId:string,input:MentorshipObjectiveInput,scopeMentorId?:string){return this.repository.createObjective(assignmentId,actorId,input,scopeMentorId);}
  recordProgress(id:string,actorId:string,note:string,value:number|null,scopeMentorId?:string){return this.repository.recordProgress(id,actorId,note,value,scopeMentorId);}
}
