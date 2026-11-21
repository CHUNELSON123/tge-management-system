import type {AdminEventDetail,AdminEventInput,AdminEventPage,AdminEventRegistrationsPage,AdminEventRow} from "../types/admin-events.types";
const API=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000";
async function request<T>(path:string,token:string,options:RequestInit={}):Promise<T>{const r=await fetch(`${API}/api/admin${path}`,{...options,headers:{Authorization:`Bearer ${token}`,...(options.body?{"Content-Type":"application/json"}:{}),...(options.headers as Record<string,string>|undefined)},cache:"no-store"});const b=await r.json().catch(()=>null) as {message?:string;data?:T}|null;if(!r.ok||b?.data===undefined)throw new Error(b?.message||"Event operation failed.");return b.data;}
export const adminEventsService={
 list(token:string,p:Record<string,string|number>,signal?:AbortSignal){const q=new URLSearchParams(Object.entries(p).filter(([,v])=>v!=="").map(([k,v])=>[k,String(v)]));return request<AdminEventPage>(`/events?${q}`,token,{signal});},
 get(token:string,id:string,signal?:AbortSignal){return request<AdminEventDetail>(`/events/${encodeURIComponent(id)}`,token,{signal});},
 save(token:string,input:AdminEventInput,id?:string){return request<AdminEventRow>(`/events${id?`/${encodeURIComponent(id)}`:""}`,token,{method:id?"PATCH":"POST",body:JSON.stringify(input)});},
 transition(token:string,id:string,status:"published"|"cancelled"){return request<AdminEventRow>(`/events/${encodeURIComponent(id)}/status`,token,{method:"POST",body:JSON.stringify({status})});},
 registrations(token:string,id:string,p:Record<string,string|number>,signal?:AbortSignal){const q=new URLSearchParams(Object.entries(p).filter(([,v])=>v!=="").map(([k,v])=>[k,String(v)]));return request<AdminEventRegistrationsPage>(`/events/${encodeURIComponent(id)}/registrations?${q}`,token,{signal});},
 changeRegistration(token:string,id:string,input:{registrationStatus?:"registered"|"cancelled";attendanceStatus?:"checked_in"|"not_attended"}){return request<void>(`/event-registrations/${encodeURIComponent(id)}`,token,{method:"PATCH",body:JSON.stringify(input)}).catch(async e=>{if(e instanceof Error&&e.message==="Event operation failed.")return;throw e;});}
};
