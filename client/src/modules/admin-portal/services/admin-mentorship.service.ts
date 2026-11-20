import type {MentorshipAssignmentInput,MentorshipDetail,MentorshipList,MentorshipOptions,MentorshipProfileDetail} from "../types/admin-mentorship.types";
const API=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000";
async function request<T>(path:string,token:string,options:RequestInit={}):Promise<T>{const response=await fetch(`${API}/api/admin${path}`,{...options,headers:{Authorization:`Bearer ${token}`,...(options.body?{"Content-Type":"application/json"}:{}),...(options.headers as Record<string,string>|undefined)},cache:"no-store"});const body=await response.json().catch(()=>null) as {message?:string;data?:T}|null;if(!response.ok||body?.data===undefined)throw new Error(body?.message||"Mentorship information is unavailable.");return body.data;}
export const adminMentorshipService={
 list(token:string,params:Record<string,string|number>,signal?:AbortSignal){const query=new URLSearchParams(Object.entries(params).filter(([,value])=>value!=="").map(([key,value])=>[key,String(value)]));return request<MentorshipList>(`/mentorship/overview?${query}`,token,{signal});},
 options(token:string,signal?:AbortSignal){return request<MentorshipOptions>("/mentorship/options",token,{signal});},
 get(token:string,id:string,signal?:AbortSignal){return request<MentorshipDetail>(`/mentorship/assignments/${encodeURIComponent(id)}`,token,{signal});},
 getMentor(token:string,id:string,signal?:AbortSignal){return request<MentorshipProfileDetail>(`/mentorship/mentors/${encodeURIComponent(id)}`,token,{signal});},
 create(token:string,input:MentorshipAssignmentInput){return request<MentorshipDetail>("/mentorship/assignments",token,{method:"POST",body:JSON.stringify(input)});},
 reassign(token:string,id:string,mentorId:string){return request<MentorshipDetail>(`/mentorship/assignments/${encodeURIComponent(id)}/reassign`,token,{method:"POST",body:JSON.stringify({mentorId})});},
 createSession(token:string,id:string,input:{title:string;scheduledStart:string;scheduledEnd:string|null;locationOrUrl:string|null;notes:string|null}){return request<MentorshipDetail>(`/mentorship/assignments/${encodeURIComponent(id)}/sessions`,token,{method:"POST",body:JSON.stringify(input)});},
 createObjective(token:string,id:string,input:{title:string;description:string|null;targetDate:string|null}){return request<MentorshipDetail>(`/mentorship/assignments/${encodeURIComponent(id)}/objectives`,token,{method:"POST",body:JSON.stringify(input)});},
 recordProgress(token:string,id:string,note:string,value:number|null){return request<MentorshipDetail["objectives"][number]["progressRecords"][number]>(`/mentorship/objectives/${encodeURIComponent(id)}/progress`,token,{method:"POST",body:JSON.stringify({note,value})});},
};
