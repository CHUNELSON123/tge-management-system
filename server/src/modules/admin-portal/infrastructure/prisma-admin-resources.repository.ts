import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { AdminResourcesRepository, ResourceFilter, ResourceInput, ResourceRow, ResourceStatus } from "../domain/admin-resources.repository.js";

const resourceSelect={
  id:true,title:true,description:true,resourceType:true,accessLevel:true,tags:true,status:true,createdAt:true,updatedAt:true,publishedAt:true,
  category:{select:{id:true,name:true}},
  programmes:{select:{programme:{select:{id:true,name:true}}}},
  cohorts:{select:{cohort:{select:{id:true,name:true}}}},
  versions:{orderBy:{versionNumber:"desc" as const},take:1,select:{id:true,versionNumber:true,originalFilename:true,mimeType:true,fileSize:true,createdAt:true,uploadedBy:{select:{firstName:true,lastName:true}}}},
};

function shape(row:any):ResourceRow {
  const history=row.versions.map((version:any)=>({
    id:version.id,versionNumber:version.versionNumber,originalFilename:version.originalFilename,mimeType:version.mimeType,
    fileSize:Number(version.fileSize),createdAt:version.createdAt.toISOString(),
    uploadedBy:[version.uploadedBy.firstName,version.uploadedBy.lastName].filter(Boolean).join(" "),
  }));
  return {
    id:row.id,title:row.title,description:row.description,resourceType:row.resourceType,accessLevel:row.accessLevel,tags:row.tags,
    status:row.status as ResourceStatus,createdAt:row.createdAt.toISOString(),updatedAt:row.updatedAt.toISOString(),
    publishedAt:row.publishedAt?.toISOString()??null,category:row.category,
    programmes:row.programmes.map((item:any)=>item.programme),cohorts:row.cohorts.map((item:any)=>item.cohort),
    latestVersion:history[0]??null,versionHistory:history,
  };
}

export class PrismaAdminResourcesRepository implements AdminResourcesRepository {
  async list(filter:ResourceFilter) {
    const search=filter.search?.trim();
    const where:any={
      ...(filter.categoryId?{categoryId:filter.categoryId}:{}),
      ...(filter.status?{status:filter.status}:{}),
      ...(filter.programmeId?{programmes:{some:{programmeId:filter.programmeId}}}:{}),
      ...(filter.cohortId?{cohorts:{some:{cohortId:filter.cohortId}}}:{}),
      ...(search?{OR:[
        {title:{contains:search,mode:"insensitive"}},
        {description:{contains:search,mode:"insensitive"}},
        {tags:{has:search}},
        {category:{name:{contains:search,mode:"insensitive"}}},
      ]}:{}),
    };
    const [total,rows,totalResources,categories,publishedResources]=await Promise.all([
      prisma.resource.count({where}),
      prisma.resource.findMany({where,select:resourceSelect,orderBy:[{createdAt:"desc"},{title:"asc"}],skip:(filter.page-1)*filter.pageSize,take:filter.pageSize}),
      prisma.resource.count(),
      prisma.resourceCategory.count(),
      prisma.resource.count({where:{status:"published"}}),
    ]);
    return {summary:{totalResources,categories,publishedResources,downloadsTracked:false as const},rows:rows.map(shape),total,page:filter.page,pageSize:filter.pageSize};
  }

  async get(id:string) {
    const row=await prisma.resource.findUnique({where:{id},select:{...resourceSelect,versions:{orderBy:{versionNumber:"desc"},take:50,select:{id:true,versionNumber:true,originalFilename:true,mimeType:true,fileSize:true,createdAt:true,uploadedBy:{select:{firstName:true,lastName:true}}}}}});
    return row?shape(row):null;
  }

  async getVersion(id:string,versionId?:string) {
    const version=await prisma.resourceVersion.findFirst({
      where:{resourceId:id,...(versionId?{id:versionId}:{})},orderBy:{versionNumber:"desc"},
      select:{id:true,versionNumber:true,storageKey:true,originalFilename:true,mimeType:true,fileSize:true,createdAt:true},
    });
    return version?{...version,fileSize:Number(version.fileSize),createdAt:version.createdAt.toISOString()}:null;
  }

  categories() { return prisma.resourceCategory.findMany({orderBy:{name:"asc"},select:{id:true,name:true,description:true}}); }

  async save(input:ResourceInput,actor:string,id?:string) {
    const row=await prisma.$transaction(async transaction=>{
      const category=await transaction.resourceCategory.findUnique({where:{id:input.categoryId},select:{id:true}});
      if(!category)throw new Error("RESOURCE_CATEGORY_NOT_FOUND");
      const [programmeCount,cohortCount]=await Promise.all([
        transaction.programme.count({where:{id:{in:input.programmeIds}}}),
        transaction.cohort.count({where:{id:{in:input.cohortIds}}}),
      ]);
      if(programmeCount!==new Set(input.programmeIds).size||cohortCount!==new Set(input.cohortIds).size)throw new Error("RESOURCE_ASSIGNMENT_INVALID");

      let resource;
      if(id) {
        const current=await transaction.resource.findUnique({where:{id},select:{status:true}});
        if(!current)throw new Error("RESOURCE_NOT_FOUND");
        resource=await transaction.resource.update({where:{id},data:{
          title:input.title,description:input.description,resourceType:input.resourceType,categoryId:input.categoryId,tags:input.tags,accessLevel:input.accessLevel,
          programmes:{deleteMany:{},...(input.programmeIds.length?{create:input.programmeIds.map(programmeId=>({programmeId}))}:{})},
          cohorts:{deleteMany:{},...(input.cohortIds.length?{create:input.cohortIds.map(cohortId=>({cohortId}))}:{})},
        },select:{id:true}});
        await transaction.auditLog.create({data:{actorUserId:actor,action:"ADMIN_RESOURCE_UPDATED",entityType:"Resource",entityId:id,details:{status:current.status}}});
      } else {
        resource=await transaction.resource.create({data:{
          title:input.title,description:input.description,resourceType:input.resourceType,categoryId:input.categoryId,uploadedByUserId:actor,tags:input.tags,accessLevel:input.accessLevel,
          programmes:{create:input.programmeIds.map(programmeId=>({programmeId}))},
          cohorts:{create:input.cohortIds.map(cohortId=>({cohortId}))},
        },select:{id:true}});
        await transaction.auditLog.create({data:{actorUserId:actor,action:"ADMIN_RESOURCE_CREATED",entityType:"Resource",entityId:resource.id,details:{status:"draft"}}});
      }
      return resource;
    });
    const updated=await this.get(row.id);
    if(!updated)throw new Error("RESOURCE_NOT_FOUND");
    return updated;
  }

  async setStatus(id:string,status:ResourceStatus,actor:string) {
    const current=await prisma.resource.findUnique({where:{id},select:{status:true,_count:{select:{versions:true}}}});
    if(!current)return null;
    if(current.status==="archived"&&status!=="archived")throw new Error("RESOURCE_TRANSITION_INVALID");
    if(status==="published"&&current._count.versions===0)throw new Error("RESOURCE_FILE_REQUIRED");
    const changed=await prisma.resource.updateMany({where:{id,status:current.status},data:{status,publishedAt:status==="published"?new Date():null}});
    if(changed.count!==1)throw new Error("RESOURCE_STATUS_CHANGED");
    await prisma.auditLog.create({data:{actorUserId:actor,action:status==="published"?"ADMIN_RESOURCE_PUBLISHED":"ADMIN_RESOURCE_ARCHIVED",entityType:"Resource",entityId:id,details:{previousStatus:current.status,status}}});
    return this.get(id);
  }

  async addVersion(id:string,actor:string,file:{storageKey:string;originalFilename:string;mimeType:string;fileSize:number}) {
    const result=await prisma.$transaction(async transaction=>{
      const resource=await transaction.resource.findUnique({where:{id},select:{id:true}});
      if(!resource)return null;
      const aggregate=await transaction.resourceVersion.aggregate({where:{resourceId:id},_max:{versionNumber:true}});
      const version=await transaction.resourceVersion.create({data:{
        resourceId:id,versionNumber:(aggregate._max.versionNumber??0)+1,storageKey:file.storageKey,originalFilename:file.originalFilename,
        mimeType:file.mimeType,fileSize:BigInt(file.fileSize),uploadedByUserId:actor,
      },select:{id:true,versionNumber:true}});
      await transaction.auditLog.create({data:{actorUserId:actor,action:"ADMIN_RESOURCE_VERSION_UPLOADED",entityType:"ResourceVersion",entityId:version.id,details:{resourceId:id,versionNumber:version.versionNumber,fileSize:file.fileSize,mimeType:file.mimeType}}});
      return version;
    });
    return result?this.get(id):null;
  }
}
