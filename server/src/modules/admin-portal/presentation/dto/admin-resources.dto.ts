import { z } from "zod";
const uuid=z.string().uuid();
export const resourceIdSchema=uuid;
export const resourceListQuerySchema=z.object({search:z.string().max(150).optional(),categoryId:uuid.optional(),programmeId:uuid.optional(),cohortId:uuid.optional(),status:z.enum(["draft","published","archived"]).optional(),page:z.coerce.number().int().min(1).default(1),pageSize:z.coerce.number().int().min(1).max(50).default(10)});
export const resourceWriteSchema=z.object({title:z.string().trim().min(1).max(250),description:z.string().trim().max(12000).nullable().optional(),resourceType:z.enum(["Guide","Template","Training Material","Video","Webinar","Article","Document","Other"]),categoryId:uuid,tags:z.array(z.string().trim().min(1).max(40)).max(20).default([]),accessLevel:z.enum(["public","member","restricted"]),programmeIds:z.array(uuid).max(100).default([]),cohortIds:z.array(uuid).max(100).default([])}).refine(value=>value.accessLevel!=="restricted"||value.programmeIds.length>0||value.cohortIds.length>0,{message:"Restricted resources need a programme or cohort assignment.",path:["cohortIds"]});
export const resourceStatusSchema=z.object({status:z.enum(["published","archived"])});
