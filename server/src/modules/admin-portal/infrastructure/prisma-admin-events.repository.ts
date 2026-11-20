import {prisma} from "../../../infrastructure/database/prisma-client.js";
import type {AdminEventDetail,AdminEventFilter,AdminEventInput,AdminEventRow,AdminEventsRepository} from "../domain/admin-events.repository.js";
const select={id:true,title:true,shortDescription:true,description:true,eventType:true,eventMode:true,startAt:true,endAt:true,timezone:true,venue:true,status:true,capacity:true,registrationDeadline:true,registrationRequired:true,createdAt:true,_count:{select:{registrations:{where:{registrationStatus:"registered",cancelledAt:null}}}}};
function row(v:any):AdminEventRow{return{id:v.id,title:v.title,shortDescription:v.shortDescription,description:v.description,eventType:v.eventType,eventMode:v.eventMode,startAt:v.startAt.toISOString(),endAt:v.endAt?.toISOString()??null,timezone:v.timezone,venue:v.venue,status:v.status,capacity:v.capacity,registrationDeadline:v.registrationDeadline?.toISOString()??null,registrationRequired:v.registrationRequired,registrationCount:v._count.registrations,createdAt:v.createdAt.toISOString()};}
export class PrismaAdminEventsRepository implements AdminEventsRepository{
async list(f:AdminEventFilter){const now=new Date();const search=f.search?.trim();const period=f.period==="upcoming"?{status:"published",startAt:{gt:now}}:f.period==="ongoing"?{status:"published",startAt:{lte:now},OR:[{endAt:null},{endAt:{gte:now}}]}:f.period==="past"?{OR:[{status:"completed"},{status:"published",endAt:{lt:now}}]}:null;const clauses:any[]=[];if(period)clauses.push(period);if(f.status)clauses.push({status:f.status});if(search)clauses.push({OR:[{title:{contains:search,mode:"insensitive"}},{shortDescription:{contains:search,mode:"insensitive"}},{venue:{contains:search,mode:"insensitive"}}]});const where:any=clauses.length?{AND:clauses}:{};const [total,items,totalEvents,upcomingEvents,totalRegistrations,ongoingEvents]=await Promise.all([prisma.event.count({where}),prisma.event.findMany({where,select,orderBy:{startAt:"asc"},skip:(f.page-1)*f.pageSize,take:f.pageSize}),prisma.event.count(),prisma.event.count({where:{status:"published",startAt:{gt:now}}}),prisma.eventRegistration.count({where:{registrationStatus:"registered",cancelledAt:null}}),prisma.event.count({where:{status:"published",startAt:{lte:now},OR:[{endAt:null},{endAt:{gte:now}}]}})]);return{summary:{totalEvents,upcomingEvents,totalRegistrations,ongoingEvents,averageRating:null},rows:items.map(row),total,page:f.page,pageSize:f.pageSize};}
async get(id:string){const v=await prisma.event.findUnique({where:{id},select:{...select,meetingUrl:true}});if(!v)return null;const attendedCount=await prisma.eventRegistration.count({where:{eventId:id,registrationStatus:"registered",attendanceStatus:"checked_in",cancelledAt:null}});return{...row(v),meetingUrl:v.meetingUrl,attendedCount} satisfies AdminEventDetail;}
async save(input:AdminEventInput,actor:string,id?:string){
  const data={title:input.title,shortDescription:input.shortDescription,description:input.description,eventType:input.eventType,eventMode:input.eventMode,startAt:new Date(input.startAt),endAt:input.endAt?new Date(input.endAt):null,timezone:input.timezone,venue:input.venue,meetingUrl:input.meetingUrl,registrationDeadline:input.registrationDeadline?new Date(input.registrationDeadline):null,capacity:input.capacity,registrationRequired:input.registrationRequired};
  return prisma.$transaction(async tx=>{
    const event=id?await tx.event.update({where:{id},data,select}):await tx.event.create({data:{...data,createdByUserId:actor},select});
    await tx.auditLog.create({data:{actorUserId:actor,action:id?"ADMIN_EVENT_UPDATED":"ADMIN_EVENT_CREATED",entityType:"Event",entityId:event.id,details:id?{updated:true}:{status:"draft"}}});
    return row(event);
  });
}
async transition(id:string,status:"published"|"cancelled",actor:string){
  return prisma.$transaction(async tx=>{
    const event=await tx.event.findUnique({where:{id},select:{status:true,title:true}});
    if(!event)return null;
    if(event.status==="cancelled"&&status==="published")throw new Error("EVENT_TRANSITION_INVALID");
    if(event.status==="completed"&&status!=="cancelled")throw new Error("EVENT_TRANSITION_INVALID");
    const r=await tx.event.updateMany({where:{id,status:event.status},data:{status}});
    if(r.count!==1)throw new Error("EVENT_STATUS_CHANGED");
    if(status==="cancelled"&&event.status!=="cancelled"){
      const registrations=await tx.eventRegistration.findMany({where:{eventId:id,registrationStatus:"registered",cancelledAt:null,memberId:{not:null}},select:{member:{select:{userId:true}}}});
      const recipients=[...new Set(registrations.flatMap(registration=>registration.member?[registration.member.userId]:[]))];
      if(recipients.length)await tx.notification.createMany({data:recipients.map(userId=>({userId,title:"Event cancelled",body:`${event.title} has been cancelled.`,notificationType:"event"}))});
    }
    await tx.auditLog.create({data:{actorUserId:actor,action:status==="published"?"ADMIN_EVENT_PUBLISHED":"ADMIN_EVENT_CANCELLED",entityType:"Event",entityId:id,details:{previousStatus:event.status,status}}});
    const updated=await tx.event.findUnique({where:{id},select});return updated?row(updated):null;
  });
}
async registrations(eventId:string,f:{search?:string;status?:string;page:number;pageSize:number}){const event=await prisma.event.findUnique({where:{id:eventId},select});if(!event)return null;const q=f.search?.trim();const where:any={eventId,...(f.status?{registrationStatus:f.status}:{}),...(q?{OR:[{guestName:{contains:q,mode:"insensitive"}},{guestEmail:{contains:q,mode:"insensitive"}},{member:{user:{OR:[{firstName:{contains:q,mode:"insensitive"}},{lastName:{contains:q,mode:"insensitive"}},{email:{contains:q,mode:"insensitive"}}]}}}]}:{})};const [total,records]=await Promise.all([prisma.eventRegistration.count({where}),prisma.eventRegistration.findMany({where,orderBy:{registeredAt:"desc"},skip:(f.page-1)*f.pageSize,take:f.pageSize,select:{id:true,guestName:true,guestEmail:true,member:{select:{user:{select:{firstName:true,lastName:true,email:true}}}},registrationStatus:true,attendanceStatus:true,registeredAt:true,consentAcceptedAt:true}})]);return{event:{id:event.id,title:event.title,startAt:event.startAt.toISOString(),status:event.status as AdminEventRow["status"],capacity:event.capacity},rows:records.map((r:any)=>({id:r.id,name:r.member?[r.member.user.firstName,r.member.user.lastName].filter(Boolean).join(" "):r.guestName??"Guest",email:r.member?.user.email??r.guestEmail,member:Boolean(r.member),registrationStatus:r.registrationStatus,attendanceStatus:r.attendanceStatus,registeredAt:r.registeredAt.toISOString(),consentAccepted:Boolean(r.consentAcceptedAt)})),total,page:f.page,pageSize:f.pageSize};}
async changeRegistration(id:string,actor:string,change:{registrationStatus?:"registered"|"cancelled";attendanceStatus?:"checked_in"|"not_attended"}){
  return prisma.$transaction(async tx=>{
    const initial=await tx.eventRegistration.findUnique({where:{id},select:{eventId:true}});if(!initial)return false;
    await tx.$queryRaw`SELECT id FROM events WHERE id = ${initial.eventId}::uuid FOR UPDATE`;
    const current=await tx.eventRegistration.findUnique({where:{id},select:{eventId:true,registrationStatus:true,attendanceStatus:true,event:{select:{status:true,startAt:true}}}});if(!current)return false;
    if(change.registrationStatus==="registered"&&current.registrationStatus==="cancelled")throw new Error("REGISTRATION_RESTORE_NOT_ALLOWED");
    if(change.registrationStatus==="cancelled"&&current.registrationStatus==="cancelled")throw new Error("REGISTRATION_ALREADY_CANCELLED");
    if(change.attendanceStatus&&current.registrationStatus!=="registered")throw new Error("REGISTRATION_NOT_ACTIVE");
    if(change.attendanceStatus&&current.event.status==="cancelled")throw new Error("EVENT_CANCELLED");
    if(change.attendanceStatus&&current.event.startAt>new Date())throw new Error("EVENT_NOT_STARTED");
    await tx.eventRegistration.update({where:{id},data:{...(change.registrationStatus?{registrationStatus:change.registrationStatus,cancelledAt:change.registrationStatus==="cancelled"?new Date():null}:{}),...(change.attendanceStatus?{attendanceStatus:change.attendanceStatus}:{})}});
    await tx.auditLog.create({data:{actorUserId:actor,action:change.attendanceStatus?"ADMIN_EVENT_ATTENDANCE_UPDATED":"ADMIN_EVENT_REGISTRATION_UPDATED",entityType:"EventRegistration",entityId:id,details:{...change,eventId:current.eventId,previousRegistrationStatus:current.registrationStatus,previousAttendanceStatus:current.attendanceStatus}}});return true;
  });
}
}
