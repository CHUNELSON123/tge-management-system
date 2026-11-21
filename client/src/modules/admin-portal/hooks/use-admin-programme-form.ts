"use client";
import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { adminProgrammesService,AdminProgrammesRequestError } from "../services/admin-programmes.service";
import type { ProgrammeDetail } from "../types/admin-programmes.types";
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset UI state when the active request or session changes.
export function useAdminProgrammeForm(id?:string){const router=useRouter();const [data,setData]=useState<ProgrammeDetail|null>(null);const [loading,setLoading]=useState(Boolean(id));const [failed,setFailed]=useState(false);const [version,setVersion]=useState(0);useEffect(()=>{if(!id)return;const token=localStorage.getItem("tge.accessToken")??sessionStorage.getItem("tge.accessToken");if(!token){router.replace("/admin/login");return;}const c=new AbortController();setLoading(true);adminProgrammesService.get(token,id,c.signal).then(v=>{if(!c.signal.aborted)setData(v);}).catch((e:unknown)=>{if(c.signal.aborted)return;setFailed(true);if(e instanceof AdminProgrammesRequestError&&e.status===401)router.replace("/admin/login");}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[id,router,version]);return{data,loading,failed,retry:()=>setVersion(v=>v+1)};}
