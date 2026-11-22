import { Readable } from "node:stream";
import { extname } from "node:path";
import { raw, Router, type RequestHandler } from "express";
import { authenticate, type AuthenticatedRequest } from "../../../../common/middleware/authenticate.middleware.js";
import { requirePermission } from "../../../../common/middleware/require-role.middleware.js";
import type { ManageAdminResourcesUseCase } from "../../application/manage-admin-resources.usecase.js";
import { resourceIdSchema, resourceListQuerySchema, resourceStatusSchema, resourceWriteSchema } from "../dto/admin-resources.dto.js";

const maxFileSize=50*1024*1024;
const expectedMime:Record<string,string>={".pdf":"application/pdf",".doc":"application/msword",".docx":"application/vnd.openxmlformats-officedocument.wordprocessingml.document",".ppt":"application/vnd.ms-powerpoint",".pptx":"application/vnd.openxmlformats-officedocument.presentationml.presentation",".xls":"application/vnd.ms-excel",".xlsx":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".mp4":"video/mp4"};
const allowedExtensions=new Set(Object.keys(expectedMime));

function signatureOk(extension:string,bytes:Buffer) {
  if(extension===".pdf")return bytes.subarray(0,5).toString()==="%PDF-";
  if(extension===".png")return bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if(extension===".jpg"||extension===".jpeg")return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  if(extension===".mp4")return bytes.length>12&&bytes.toString("ascii",4,8)==="ftyp";
  if([".doc",".ppt",".xls"].includes(extension))return bytes.subarray(0,8).equals(Buffer.from([208,207,17,224,161,177,26,225]));
  return bytes.subarray(0,2).toString()==="PK";
}

const parseResourceUpload:RequestHandler=(req,res,next)=>raw({type:()=>true,limit:maxFileSize})(req,res,error=>{
  if(error&&typeof error==="object"&&"type" in error&&error.type==="entity.too.large") { res.status(413).json({message:"Resource files must be no larger than 50 MB."}); return; }
  if(error) { next(error); return; }
  next();
});

export function createAdminResourcesRouter(useCase:ManageAdminResourcesUseCase):Router {
  const router=Router();
  const protect: RequestHandler[] = [authenticate,requirePermission("resources.manage"),(req:AuthenticatedRequest,res,next)=>{if(req.authenticatedUser?.roleName === "Mentor"){res.status(403).json({message:"Use the assigned resource portal for your role."});return;}next();}];

  router.get("/resources",...protect,async(req:AuthenticatedRequest,res,next)=>{
    const query=resourceListQuerySchema.safeParse(req.query);
    if(!query.success){res.status(400).json({message:"Resource filters are invalid."});return;}
    try{res.json({message:"Resources loaded.",data:await useCase.list(query.data)});}catch(error){next(error);}
  });

  router.get("/resources/categories",...protect,async(_req,res,next)=>{
    try{res.json({message:"Resource categories loaded.",data:await useCase.categories()});}catch(error){next(error);}
  });

  router.get("/resources/:resourceId",...protect,async(req,res,next)=>{
    const id=resourceIdSchema.safeParse(req.params.resourceId);
    if(!id.success){res.status(404).json({message:"Resource was not found."});return;}
    try{const data=await useCase.get(id.data);if(!data){res.status(404).json({message:"Resource was not found."});return;}res.json({message:"Resource loaded.",data});}catch(error){next(error);}
  });

  router.post("/resources",...protect,async(req:AuthenticatedRequest,res,next)=>{
    const input=resourceWriteSchema.safeParse(req.body),actor=req.authenticatedUser?.userId;
    if(!input.success){res.status(400).json({message:"Resource details are invalid.",issues:input.error.flatten()});return;}
    if(!actor){res.status(401).json({message:"Authentication required."});return;}
    try{res.status(201).json({message:"Resource saved as draft.",data:await useCase.save({...input.data,description:input.data.description??null},actor)});}catch(error){resourceError(error,res,next);}
  });

  router.patch("/resources/:resourceId",...protect,async(req:AuthenticatedRequest,res,next)=>{
    const id=resourceIdSchema.safeParse(req.params.resourceId),input=resourceWriteSchema.safeParse(req.body),actor=req.authenticatedUser?.userId;
    if(!id.success){res.status(404).json({message:"Resource was not found."});return;}
    if(!input.success){res.status(400).json({message:"Resource details are invalid.",issues:input.error.flatten()});return;}
    if(!actor){res.status(401).json({message:"Authentication required."});return;}
    try{const data=await useCase.save({...input.data,description:input.data.description??null},actor,id.data);if(!data){res.status(404).json({message:"Resource was not found."});return;}res.json({message:"Resource details saved.",data});}catch(error){resourceError(error,res,next);}
  });

  router.post("/resources/:resourceId/status",...protect,async(req:AuthenticatedRequest,res,next)=>{
    const id=resourceIdSchema.safeParse(req.params.resourceId),input=resourceStatusSchema.safeParse(req.body),actor=req.authenticatedUser?.userId;
    if(!id.success){res.status(404).json({message:"Resource was not found."});return;}
    if(!input.success){res.status(400).json({message:"Resource status is invalid."});return;}
    if(!actor){res.status(401).json({message:"Authentication required."});return;}
    try{const data=await useCase.setStatus(id.data,input.data.status,actor);if(!data){res.status(404).json({message:"Resource was not found."});return;}res.json({message:`Resource ${input.data.status}.`,data});}catch(error){resourceError(error,res,next);}
  });

  router.post("/resources/:resourceId/versions",...protect,parseResourceUpload,async(req:AuthenticatedRequest,res,next)=>{
    const id=resourceIdSchema.safeParse(req.params.resourceId),actor=req.authenticatedUser?.userId;
    let filename=String(req.headers["x-file-name"]??"").trim();
    try{filename=decodeURIComponent(filename);}catch{filename="";}
    filename=filename.replace(/[\\/\r\n\0]/g,"_").slice(0,255);
    const extension=extname(filename).toLowerCase();
    const mime=String(req.headers["x-file-mime"]??expectedMime[extension]??"").toLowerCase();
    const bytes=req.body;
    if(!id.success){res.status(404).json({message:"Resource was not found."});return;}
    if(!actor){res.status(401).json({message:"Authentication required."});return;}
    if(Array.isArray(bytes)||!Buffer.isBuffer(bytes)||bytes.length===0||bytes.length>maxFileSize||!allowedExtensions.has(extension)||mime!==expectedMime[extension]||!signatureOk(extension,bytes)){
      res.status(400).json({message:"Choose a valid PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, PNG, JPG, or MP4 file up to 50 MB."});return;
    }
    try{if(!await useCase.get(id.data)){res.status(404).json({message:"Resource was not found."});return;}const result=await useCase.addVersion(id.data,actor,{originalFilename:filename,mimeType:mime,content:bytes});res.status(201).json({message:"Resource file uploaded as a new version.",data:result});}catch(error){resourceError(error,res,next);}
  });

  router.get("/resources/:resourceId/file",...protect,async(req,res,next)=>{
    const id=resourceIdSchema.safeParse(req.params.resourceId);
    if(!id.success){res.status(404).json({message:"Resource file was not found."});return;}
    const versionId=typeof req.query.versionId==="string"?req.query.versionId:undefined;
    try{
      const file=await useCase.download(id.data,versionId);
      if(!file){res.status(404).json({message:"Resource file or version was not found."});return;}
      const filename=file.originalFilename.replace(/[\r\n"\\]/g,"_").slice(0,200)||"resource";
      const encodedFilename=encodeURIComponent(filename).replace(/[!'()*]/g,character=>`%${character.charCodeAt(0).toString(16).toUpperCase()}`);
      res.setHeader("Content-Type",file.mimeType);
      res.setHeader("Content-Length",String(file.fileSize));
      res.setHeader("Content-Disposition",`attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
      res.setHeader("Cache-Control","private, no-store");
      res.setHeader("X-Content-Type-Options","nosniff");
      res.setHeader("Content-Security-Policy","sandbox");
      Readable.from(file.content).on("error",()=>res.destroy()).pipe(res);
    }catch(error){next(error);}
  });

  return router;
}

function resourceError(error:unknown,res:import("express").Response,next:import("express").NextFunction) {
  if(error instanceof Error&&["RESOURCE_CATEGORY_NOT_FOUND","RESOURCE_ASSIGNMENT_INVALID","RESOURCE_FILE_REQUIRED","RESOURCE_STATUS_CHANGED","RESOURCE_TRANSITION_INVALID","RESOURCE_NOT_FOUND"].includes(error.message)) {
    if(error.message==="RESOURCE_NOT_FOUND"){res.status(404).json({message:"Resource was not found."});return;}
    const message=error.message==="RESOURCE_FILE_REQUIRED"?"Upload a file before publishing this resource.":error.message==="RESOURCE_TRANSITION_INVALID"?"An archived resource cannot be published again.":"Resource details no longer match the available records.";
    res.status(409).json({message});return;
  }
  next(error);
}
