export type ResourceStatus="draft"|"published"|"archived";
export interface ResourceVersion {id:string;versionNumber:number;originalFilename:string;mimeType:string;fileSize:number;createdAt:string;uploadedBy:string}
export interface AdminResource {id:string;title:string;description:string|null;resourceType:string;accessLevel:string;tags:string[];status:ResourceStatus;createdAt:string;updatedAt:string;publishedAt:string|null;category:{id:string;name:string};programmes:{id:string;name:string}[];cohorts:{id:string;name:string}[];latestVersion:ResourceVersion|null;versionHistory:ResourceVersion[]}
export interface ResourceList {summary:{totalResources:number;categories:number;publishedResources:number;downloadsTracked:false};rows:AdminResource[];total:number;page:number;pageSize:number}
export interface ResourceCategory {id:string;name:string;description:string|null}
