export interface MemberBusiness { id: string; name: string; slug: string; description: string | null; status: string; publicationStatus: string; reviewReason: string | null; categories: string[]; categoryAssignments: Array<{id:string;name:string}>; address:string|null; websiteUrl:string|null; email:string|null; phone:string|null }
export interface MemberBusinessCategory {id:string;name:string}
export interface MemberBusinessInput {name:string;description:string|null;categoryIds:string[];address:string|null;websiteUrl:string|null;email:string|null;phone:string|null}
