"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAccessService } from "../services/admin-access.service";
import { adminProgrammesService, AdminProgrammesRequestError } from "../services/admin-programmes.service";
import type { AdminAccess } from "../types/admin-access.types";
import type { CohortPage, ProgrammePage } from "../types/admin-programmes.types";

function token() { return localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken"); }
export function useAdminProgrammes() {
  const router = useRouter(); const [data,setData] = useState<ProgrammePage|null>(null); const [cohortData,setCohortData] = useState<CohortPage|null>(null); const [loading,setLoading] = useState(true); const [failed,setFailed] = useState(false);
  const [filters,setFilters] = useState({search:"",status:""}); const [tab,setTab] = useState<"programmes"|"cohorts">("programmes"); const [page,setPage] = useState(1); const [version,setVersion] = useState(0); const [access,setAccess] = useState<AdminAccess|null>(null);
  const query = useMemo(()=>JSON.stringify({...filters,page,pageSize:10}),[filters,page]);
  useEffect(()=>{const key=token(); if(!key){router.replace("/admin/login");return;} const c=new AbortController(); adminAccessService.getAccess(key,c.signal).then(setAccess).catch((e:unknown)=>{const s=e instanceof AdminProgrammesRequestError?e.status:0;if(s===401){localStorage.removeItem("tge.accessToken");sessionStorage.removeItem("tge.accessToken");router.replace("/admin/login");}else if(s===403)router.replace("/portal");});return()=>c.abort();},[router]);
  useEffect(()=>{const key=token();if(!key){router.replace("/admin/login");return;}const c=new AbortController();setLoading(true);setFailed(false);const params=JSON.parse(query) as Record<string,string|number>;const load=tab==="programmes"?adminProgrammesService.list(key,params,c.signal):adminProgrammesService.cohorts(key,params,c.signal);load.then((value)=>{if(c.signal.aborted)return;if(tab==="programmes")setData(value as ProgrammePage);else setCohortData(value as CohortPage);}).catch((e:unknown)=>{if(c.signal.aborted)return;const s=e instanceof AdminProgrammesRequestError?e.status:0;if(s===401){localStorage.removeItem("tge.accessToken");sessionStorage.removeItem("tge.accessToken");router.replace("/admin/login");}else if(s===403)router.replace("/portal");else setFailed(true);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[query,router,version,tab]);
  const canManage=Boolean(access?.permissions.includes("programmes.manage"));
  return {data,cohortData,loading,failed,filters,setFilters:(v:typeof filters)=>{setFilters(v);setPage(1);},tab,setTab,page,setPage,retry:()=>setVersion(v=>v+1),canManage};
}
