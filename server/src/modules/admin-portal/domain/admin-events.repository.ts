export type AdminEventStatus="draft"|"published"|"cancelled"|"completed";
export interface AdminEventInput {title:string;shortDescription:string;description:string;eventType:string;eventMode:"online"|"in_person"|"hybrid";startAt:string;endAt:string;timezone:string;venue:string;meetingUrl:string|null;registrationDeadline:string|null;capacity:number|null;registrationRequired:boolean}
export interface AdminEventFilter {search?:string;status?:AdminEventStatus;period?:"upcoming"|"ongoing"|"past";page:number;pageSize:number}
export interface AdminEventRow {id:string;title:string;shortDescription:string|null;description:string|null;eventType:string;eventMode:string|null;startAt:string;endAt:string|null;timezone:string|null;venue:string|null;status:AdminEventStatus;capacity:number|null;registrationDeadline:string|null;registrationRequired:boolean;registrationCount:number;createdAt:string}
export interface AdminEventDetail extends AdminEventRow {meetingUrl:string|null;attendedCount:number}
export interface AdminEventRegistration {id:string;name:string;email:string|null;member:boolean;registrationStatus:string;attendanceStatus:string;registeredAt:string;consentAccepted:boolean}
export interface AdminEventPage {summary:{totalEvents:number;upcomingEvents:number;totalRegistrations:number;ongoingEvents:number;averageRating:null};rows:AdminEventRow[];total:number;page:number;pageSize:number}
export interface AdminEventsRepository {
 list(filter:AdminEventFilter):Promise<AdminEventPage>;
 get(id:string):Promise<AdminEventDetail|null>;
 save(input:AdminEventInput,actor:string,id?:string):Promise<AdminEventRow>;
 transition(id:string,status:"published"|"cancelled",actor:string):Promise<AdminEventRow|null>;
 registrations(eventId:string,filter:{search?:string;status?:string;page:number;pageSize:number}):Promise<{event:Pick<AdminEventRow,"id"|"title"|"startAt"|"status"|"capacity">;rows:AdminEventRegistration[];total:number;page:number;pageSize:number}|null>;
 changeRegistration(id:string,actor:string,change:{registrationStatus?:"registered"|"cancelled";attendanceStatus?:"checked_in"|"not_attended"}):Promise<boolean>;
}
