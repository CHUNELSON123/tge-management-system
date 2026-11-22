import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../../../../common/middleware/authenticate.middleware.js";
import { requirePermission } from "../../../../common/middleware/require-role.middleware.js";
import type { ManageAdminMentorshipUseCase } from "../../application/manage-admin-mentorship.usecase.js";
import { mentorshipAssignmentSchema, mentorshipIdSchema, mentorshipListQuerySchema, mentorshipProgressSchema, mentorshipSessionSchema, mentorshipObjectiveSchema, mentorshipReassignSchema } from "../dto/admin-mentorship.dto.js";

export function createAdminMentorshipRouter(useCase:ManageAdminMentorshipUseCase):Router {
  const router=Router();
  const progressionError = (error: unknown) => error instanceof Error && error.message === "FOUNDATION_REQUIRED" ? "The member must complete TGE Foundation before mentorship. Check that the Foundation programme has its correct pathway code." : error instanceof Error && error.message === "SECOND_STAGE_REQUIRED" ? "The member must complete Young Entrepreneur or The Entrepreneur after completing Foundation before a mentor can be assigned." : null;
  const protect=[authenticate,requirePermission("mentorship.manage")];
  const scope=async(req:AuthenticatedRequest)=>{
    const actor=req.authenticatedUser;
    if(!actor)return {id:null as string|null,error:401};
    if(actor.roleName==="Mentor") { const id=await useCase.scopeForMentor(actor.userId,actor.roleName);return {id,error:id?null:403}; }
    return {id:null,error:null};
  };
  router.get("/mentorship/overview",...protect,async(req:AuthenticatedRequest,res,next)=>{
    const query=mentorshipListQuerySchema.safeParse(req.query);if(!query.success){res.status(400).json({message:"Mentorship filters are invalid."});return;}
    try{const allowed=await scope(req);if(allowed.error){res.status(allowed.error).json({message:"Mentorship access is not available."});return;}res.json({message:"Mentorship overview loaded.",data:await useCase.list(query.data,allowed.id??undefined)});}catch(error){next(error);}
  });
  router.get("/mentorship/options",...protect,async(req:AuthenticatedRequest,res,next)=>{
    if(req.authenticatedUser?.roleName==="Mentor"){res.status(403).json({message:"Only administrators can create mentor assignments."});return;}
    try{res.json({message:"Mentorship options loaded.",data:await useCase.options()});}catch(error){next(error);}
  });
  router.get("/mentorship/mentors/:mentorId",...protect,async(req:AuthenticatedRequest,res,next)=>{
    const id=mentorshipIdSchema.safeParse(req.params.mentorId),actor=req.authenticatedUser;
    if(!id.success){res.status(404).json({message:"Mentor was not found."});return;}if(!actor){res.status(401).json({message:"Authentication required."});return;}
    try{const data=await useCase.getMentor(id.data,actor.userId,actor.roleName);if(!data){res.status(404).json({message:"Mentor was not found."});return;}res.json({message:"Mentor details loaded.",data});}catch(error){next(error);}
  });
  router.post("/mentorship/assignments",...protect,async(req:AuthenticatedRequest,res,next)=>{
    const actor=req.authenticatedUser,input=mentorshipAssignmentSchema.safeParse(req.body);
    if(actor?.roleName==="Mentor"){res.status(403).json({message:"Only administrators can create mentor assignments."});return;}
    if(!input.success){res.status(400).json({message:"Mentorship assignment details are invalid.",issues:input.error.flatten()});return;}
    if(!actor){res.status(401).json({message:"Authentication required."});return;}
    try{res.status(201).json({message:"Mentor assigned.",data:await useCase.create(input.data,actor.userId)});}catch(error){const message=progressionError(error);if(message){res.status(409).json({message});return;}if(error instanceof Error&&["MENTOR_NOT_ELIGIBLE","MEMBER_NOT_ELIGIBLE","PROGRAMME_NOT_ELIGIBLE","MENTORSHIP_ASSIGNMENT_EXISTS"].includes(error.message)){res.status(409).json({message:error.message==="MENTORSHIP_ASSIGNMENT_EXISTS"?"This mentor is already actively assigned to this member and programme.":"Choose an active mentor, member, and programme."});return;}next(error);}
  });
  router.post("/mentorship/assignments/:assignmentId/reassign",...protect,async(req:AuthenticatedRequest,res,next)=>{
    const id=mentorshipIdSchema.safeParse(req.params.assignmentId),input=mentorshipReassignSchema.safeParse(req.body),actor=req.authenticatedUser;
    if(actor?.roleName==="Mentor"){res.status(403).json({message:"Only administrators can reassign a mentor."});return;}
    if(!id.success){res.status(404).json({message:"Mentorship assignment was not found."});return;}if(!input.success){res.status(400).json({message:"Mentor selection is invalid."});return;}if(!actor){res.status(401).json({message:"Authentication required."});return;}
    try{const data=await useCase.reassign(id.data,input.data.mentorId,actor.userId);if(!data){res.status(404).json({message:"Mentorship assignment was not found."});return;}res.json({message:"Mentor reassigned. Previous mentor and new mentor are recorded in the audit history.",data});}catch(error){const message=progressionError(error);if(message){res.status(409).json({message});return;}if(error instanceof Error&&["MENTORSHIP_ASSIGNMENT_NOT_FOUND","MENTOR_NOT_ELIGIBLE","MENTORSHIP_ASSIGNMENT_EXISTS","MENTORSHIP_ASSIGNMENT_NOT_ACTIVE"].includes(error.message)){const status=error.message==="MENTORSHIP_ASSIGNMENT_NOT_FOUND"?404:409;res.status(status).json({message:error.message==="MENTORSHIP_ASSIGNMENT_EXISTS"?"This mentor is already actively assigned to this member and programme.":error.message==="MENTOR_NOT_ELIGIBLE"?"Choose an active mentor account.":error.message==="MENTORSHIP_ASSIGNMENT_NOT_ACTIVE"?"Only active mentorship assignments can be reassigned.":"Mentorship assignment was not found."});return;}next(error);}
  });
  router.get("/mentorship/assignments/:assignmentId",...protect,async(req:AuthenticatedRequest,res,next)=>{
    const id=mentorshipIdSchema.safeParse(req.params.assignmentId);if(!id.success){res.status(404).json({message:"Mentorship assignment was not found."});return;}
    try{const allowed=await scope(req);if(allowed.error){res.status(allowed.error).json({message:"Mentorship access is not available."});return;}const data=await useCase.get(id.data,allowed.id??undefined);if(!data){res.status(404).json({message:"Mentorship assignment was not found."});return;}res.json({message:"Mentorship assignment loaded.",data});}catch(error){next(error);}
  });
  router.post("/mentorship/assignments/:assignmentId/sessions",...protect,async(req:AuthenticatedRequest,res,next)=>{
    const id=mentorshipIdSchema.safeParse(req.params.assignmentId),input=mentorshipSessionSchema.safeParse(req.body),actor=req.authenticatedUser;
    if(!id.success){res.status(404).json({message:"Mentorship assignment was not found."});return;}if(!input.success){res.status(400).json({message:"Session details are invalid.",issues:input.error.flatten()});return;}if(!actor){res.status(401).json({message:"Authentication required."});return;}
    try{const allowed=await scope(req);if(allowed.error){res.status(allowed.error).json({message:"Mentorship access is not available."});return;}const data=await useCase.createSession(id.data,actor.userId,input.data,allowed.id??undefined);if(!data){res.status(404).json({message:"Mentorship assignment was not found."});return;}res.status(201).json({message:"Mentoring session created.",data});}catch(error){next(error);}
  });
  router.post("/mentorship/assignments/:assignmentId/objectives",...protect,async(req:AuthenticatedRequest,res,next)=>{
    const id=mentorshipIdSchema.safeParse(req.params.assignmentId),input=mentorshipObjectiveSchema.safeParse(req.body),actor=req.authenticatedUser;
    if(!id.success){res.status(404).json({message:"Mentorship assignment was not found."});return;}if(!input.success){res.status(400).json({message:"Objective details are invalid.",issues:input.error.flatten()});return;}if(!actor){res.status(401).json({message:"Authentication required."});return;}
    try{const allowed=await scope(req);if(allowed.error){res.status(allowed.error).json({message:"Mentorship access is not available."});return;}const data=await useCase.createObjective(id.data,actor.userId,input.data,allowed.id??undefined);if(!data){res.status(404).json({message:"Mentorship assignment was not found."});return;}res.status(201).json({message:"Mentorship objective created.",data});}catch(error){next(error);}
  });
  router.post("/mentorship/objectives/:objectiveId/progress",...protect,async(req:AuthenticatedRequest,res,next)=>{
    const id=mentorshipIdSchema.safeParse(req.params.objectiveId),input=mentorshipProgressSchema.safeParse(req.body),actor=req.authenticatedUser;
    if(!id.success){res.status(404).json({message:"Mentorship objective was not found."});return;}if(!input.success){res.status(400).json({message:"Progress details are invalid.",issues:input.error.flatten()});return;}if(!actor){res.status(401).json({message:"Authentication required."});return;}
    try{const allowed=await scope(req);if(allowed.error){res.status(allowed.error).json({message:"Mentorship access is not available."});return;}const data=await useCase.recordProgress(id.data,actor.userId,input.data.note,input.data.value,allowed.id??undefined);if(!data){res.status(404).json({message:"Mentorship objective was not found."});return;}res.status(201).json({message:"Progress recorded.",data});}catch(error){next(error);}
  });
  return router;
}
