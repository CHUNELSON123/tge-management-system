"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, FileUp, Save, X } from "lucide-react";
import { adminResourcesService } from "../services/admin-resources.service";
import { adminProgrammesService } from "../services/admin-programmes.service";
import type { ProgrammeRow,CohortRow } from "../types/admin-programmes.types";
import type { ResourceCategory,ResourceStatus } from "../types/admin-resources.types";

const maxFileBytes=50*1024*1024;
const acceptedExtensions=new Set(["pdf","doc","docx","ppt","pptx","xls","xlsx","png","jpg","jpeg","mp4"]);
function token(){return typeof window==="undefined"?"":localStorage.getItem("tge.accessToken")||sessionStorage.getItem("tge.accessToken")||"";}
type Notice={kind:"success"|"error"|"info";text:string;resourceId?:string};

export function AdminResourceFormPage({resourceId}:{resourceId?:string}) {
  const [categories,setCategories]=useState<ResourceCategory[]>([]);
  const [programmes,setProgrammes]=useState<ProgrammeRow[]>([]);
  const [cohorts,setCohorts]=useState<CohortRow[]>([]);
  const [categoryId,setCategoryId]=useState("");
  const [programmeIds,setProgrammeIds]=useState<string[]>([]);
  const [cohortIds,setCohortIds]=useState<string[]>([]);
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [resourceType,setResourceType]=useState("Guide");
  const [tags,setTags]=useState("");
  const [audience,setAudience]=useState<"member"|"restricted"|"public">("member");
  const [status,setStatus]=useState<ResourceStatus>(resourceId?"draft":"published");
  const [currentStatus,setCurrentStatus]=useState<ResourceStatus|null>(null);
  const [file,setFile]=useState<File|null>(null);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(Boolean(resourceId));
  const [error,setError]=useState("");
  const [notice,setNotice]=useState<Notice|null>(null);
  const [savedId,setSavedId]=useState(resourceId??"");
  const [loaded,setLoaded]=useState(!resourceId);

  useEffect(()=>{
    let alive=true;
    const access=token();
    void Promise.all([
      adminResourcesService.categories(access),
      adminProgrammesService.allProgrammes(access),
      adminProgrammesService.allCohorts(access),
    ] as const).then(([categoryPage,programmePage,cohortPage])=>{
      if(!alive)return;
      setCategories(categoryPage);setProgrammes(programmePage);setCohorts(cohortPage);
    }).catch(reason=>{if(alive)setError(reason instanceof Error?reason.message:"Resource form data could not be loaded.");});
    if(resourceId){
      void adminResourcesService.get(access,resourceId).then(resource=>{
        if(!alive)return;
        setTitle(resource.title);setDescription(resource.description??"");setResourceType(resource.resourceType);setCategoryId(resource.category.id);setTags(resource.tags.join(", "));setAudience(resource.accessLevel as "member"|"restricted"|"public");setStatus(resource.status);setCurrentStatus(resource.status);setProgrammeIds(resource.programmes.map(item=>item.id));setCohortIds(resource.cohorts.map(item=>item.id));setLoaded(true);
      }).catch(reason=>{if(alive)setError(reason instanceof Error?reason.message:"Resource could not be loaded.");}).finally(()=>{if(alive)setLoading(false);});
    }
    return()=>{alive=false;};
  },[resourceId]);

  const availableCohorts=useMemo(()=>cohorts,[cohorts]);
  const restrictedWithoutAssignment=audience==="restricted"&&programmeIds.length===0&&cohortIds.length===0;
  const statusDraftUnavailable=Boolean(resourceId&&currentStatus!==null&&currentStatus!=="draft");

  function toggleValue(values:string[],value:string,setter:(next:string[])=>void){setter(values.includes(value)?values.filter(item=>item!==value):[...values,value]);}
  function chooseFile(candidate:File|undefined){
    setNotice(null);
    if(!candidate){setFile(null);return;}
    const extension=candidate.name.split(".").pop()?.toLowerCase()??"";
    if(candidate.size===0){setNotice({kind:"error",text:"Choose a file that is not empty."});setFile(null);return;}
    if(candidate.size>maxFileBytes){setNotice({kind:"error",text:"The maximum file size is 50 MB."});setFile(null);return;}
    if(!acceptedExtensions.has(extension)){setNotice({kind:"error",text:"Choose a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, PNG, JPG, or MP4 file."});setFile(null);return;}
    setFile(candidate);
  }

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    setNotice(null);
    if(restrictedWithoutAssignment){setNotice({kind:"error",text:"Assign this restricted resource to at least one programme or cohort."});return;}
    const cleanTags=tags.split(",").map(value=>value.trim()).filter(Boolean);
    if(cleanTags.length>20||cleanTags.some(value=>value.length>40)){setNotice({kind:"error",text:"Add up to 20 tags. Each tag can contain up to 40 characters."});return;}
    if(status==="draft"&&statusDraftUnavailable){setNotice({kind:"error",text:"A published or archived resource cannot be moved back to draft."});return;}
    setBusy(true);
    try{
      let resource=await adminResourcesService.save(token(),{title,description,resourceType,categoryId,tags:cleanTags,accessLevel:audience,programmeIds,cohortIds},savedId||undefined);
      setSavedId(resource.id);setCurrentStatus(resource.status);
      if(file){
        try{resource=await adminResourcesService.upload(token(),resource.id,file);setFile(null);}
        catch(reason){setNotice({kind:"error",text:`Resource details were saved, but the file upload failed: ${reason instanceof Error?reason.message:"Upload failed."} The saved draft is available to reopen and retry.`,resourceId:resource.id});return;}
      }
      if(status==="published"&&resource.status!=="published"){
        if(!resource.latestVersion){setNotice({kind:"info",text:"Resource details were saved as a draft. Upload a file before publishing.",resourceId:resource.id});return;}
        resource=await adminResourcesService.status(token(),resource.id,"published");
      }else if(status==="archived"&&resource.status!=="archived"){
        resource=await adminResourcesService.status(token(),resource.id,"archived");
      }
      setCurrentStatus(resource.status);setStatus(resource.status);
      setNotice({kind:"success",text:`Resource ${resource.status==="published"?"published":resource.status==="archived"?"archived":"saved as a draft"}.`,resourceId:resource.id});
    }catch(reason){setNotice({kind:"error",text:reason instanceof Error?reason.message:"The resource could not be saved."});}
    finally{setBusy(false);}
  }

  const noticeStyle=notice?.kind==="success"?"border-emerald-200 bg-emerald-50 text-emerald-900":notice?.kind==="error"?"border-rose-200 bg-rose-50 text-rose-900":"border-sky-200 bg-sky-50 text-sky-900";

  if(loading)return <div role="status" className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">Loading resource…</div>;
  if(error&&!loaded)return <section className="rounded-lg border border-rose-200 bg-white p-8"><p role="alert" className="text-sm text-rose-800">{error}</p><Link href="/admin/resources" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"><ArrowLeft size={16}/>Back to Resources</Link></section>;

  return <form onSubmit={submit} className="mx-auto max-w-6xl space-y-5">
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500"><Link href="/" className="hover:text-emerald-700">Home</Link><span>›</span><Link href="/admin" className="hover:text-emerald-700">Admin</Link><span>›</span><Link href="/admin/resources" className="hover:text-emerald-700">Resources</Link><span>›</span><span className="font-medium text-emerald-700">{resourceId?"Edit Resource":"Create Resource"}</span></nav>
    <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight text-slate-950">{resourceId?"Edit Resource":"Create Resource"}</h1><p className="mt-1 text-sm text-slate-600">{resourceId?"Update resource information, file versions, and access assignments.":"Add a new resource or document to the platform."}</p></div><div className="hidden gap-2 sm:flex"><Link href="/admin/resources" className="inline-flex min-h-11 items-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</Link><button disabled={busy||loading||!categories.length} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"><Save size={16}/>{busy?"Saving…":"Save Resource"}</button></div></header>
    {notice&&<div role={notice.kind==="error"?"alert":"status"} className={`flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm ${noticeStyle}`}><span className="inline-flex items-start gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0"/>{notice.text}</span>{notice.resourceId&&<Link href={`/admin/resources/${notice.resourceId}`} className="shrink-0 font-semibold underline">View resource</Link>}</div>}
    {error&&loaded&&<p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {!categories.length&&!error&&<p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">No resource categories exist yet. Add a category before saving a resource.</p>}

    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.95fr)]">
      <div className="space-y-4">
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><h2 className="font-bold text-slate-950">Basic Information</h2>
          <label className="block text-sm font-semibold text-slate-800">Title <span className="text-rose-700">*</span><input required maxLength={250} value={title} onChange={event=>setTitle(event.target.value)} placeholder="Enter resource title" className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"/></label>
          <label className="block text-sm font-semibold text-slate-800">Description <span className="text-rose-700">*</span><textarea required maxLength={12000} value={description} onChange={event=>setDescription(event.target.value)} placeholder="Write a brief description about this resource…" className="mt-2 min-h-32 w-full resize-y rounded-md border border-slate-300 p-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"/></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-800">Resource Type <span className="text-rose-700">*</span><select required value={resourceType} onChange={event=>setResourceType(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 font-normal">{["Guide","Template","Training Material","Video","Webinar","Article","Document","Other"].map(value=><option key={value}>{value}</option>)}</select></label><label className="block text-sm font-semibold text-slate-800">Category <span className="text-rose-700">*</span><select required value={categoryId} onChange={event=>setCategoryId(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 font-normal"><option value="">Select category</option>{categories.map(category=><option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div>
          <label className="block text-sm font-semibold text-slate-800">Tags<input value={tags} onChange={event=>setTags(event.target.value)} placeholder="Add tags separated by commas" className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3 font-normal"/><span className="mt-1 block text-xs font-normal text-slate-500">Use commas between tags. Up to 20 tags, 40 characters each.</span></label>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-bold text-slate-950">File Upload</h2>{file&&<button type="button" onClick={()=>setFile(null)} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700"><X size={14}/>Remove file</button>}</div>
          <label className="mt-3 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 text-center hover:border-emerald-600 hover:bg-emerald-50/40"><FileUp size={28} className="text-emerald-700"/><span className="mt-2 break-all text-sm font-semibold text-slate-900">{file?file.name:"Choose a file to upload"}</span><span className="mt-1 text-xs text-slate-600">PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, PNG, JPG, MP4 · Maximum 50 MB</span><input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.mp4" onChange={event=>chooseFile(event.target.files?.[0])} className="sr-only"/></label>
          {file&&<p className="mt-2 break-words text-xs text-slate-600">New upload becomes version {resourceId?"on save":"1"} · {(file.size/1024/1024).toFixed(2)} MB</p>}
        </section>
      </div>

      <aside className="space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><h2 className="font-bold text-slate-950">Assignments</h2><p className="mt-1 text-xs text-slate-600">Members in an assigned programme or cohort can access this resource when it is published.</p>
          <fieldset className="mt-4"><legend className="text-sm font-semibold text-slate-800">Related Programmes <span className="font-normal text-slate-500">(Optional)</span></legend>{programmes.length?<div className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">{programmes.map(programme=><label key={programme.id} className="flex min-h-9 items-start gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50"><input type="checkbox" checked={programmeIds.includes(programme.id)} onChange={()=>toggleValue(programmeIds,programme.id,setProgrammeIds)} className="mt-1 accent-emerald-700"/><span className="break-words">{programme.name}</span></label>)}</div>:<p className="mt-2 text-sm text-slate-500">No programmes available.</p>}</fieldset>
          <fieldset className="mt-4"><legend className="text-sm font-semibold text-slate-800">Related Cohorts <span className="font-normal text-slate-500">(Optional)</span></legend>{availableCohorts.length?<div className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">{availableCohorts.map(cohort=><label key={cohort.id} className="flex min-h-9 items-start gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50"><input type="checkbox" checked={cohortIds.includes(cohort.id)} onChange={()=>toggleValue(cohortIds,cohort.id,setCohortIds)} className="mt-1 accent-emerald-700"/><span className="break-words">{cohort.name}</span></label>)}</div>:<p className="mt-2 text-sm text-slate-500">No cohorts available.</p>}</fieldset>
          <fieldset className="mt-4"><legend className="text-sm font-semibold text-slate-800">Target Audience</legend><div className="mt-2 space-y-1">{[{value:"member",label:"All Members",hint:"Available to all members when published"},{value:"restricted",label:"Assigned Members",hint:"Limited to selected programmes or cohorts"},{value:"public",label:"General Public",hint:"Public access level"}].map(option=><label key={option.value} className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-slate-50"><input type="radio" name="audience" value={option.value} checked={audience===option.value} onChange={()=>setAudience(option.value as typeof audience)} className="mt-1 accent-emerald-700"/><span><b className="block text-sm text-slate-800">{option.label}</b><span className="text-xs text-slate-500">{option.hint}</span></span></label>)}</div>{restrictedWithoutAssignment&&<p role="alert" className="mt-2 text-xs text-rose-700">Select at least one programme or cohort for assigned members.</p>}</fieldset>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><h2 className="font-bold text-slate-950">Visibility</h2><div className="mt-3 space-y-1">{[{value:"published",label:"Published",hint:"Visible to its audience after a file is uploaded"},{value:"draft",label:"Draft",hint:"Saved but hidden from members"},{value:"archived",label:"Archived",hint:"Hidden from member access"}].map(option=>{const disabled=option.value==="draft"&&statusDraftUnavailable;return <label key={option.value} className={`flex items-start gap-3 rounded-md p-2 ${disabled?"cursor-not-allowed opacity-50":"cursor-pointer hover:bg-slate-50"}`}><input type="radio" name="visibility" value={option.value} checked={status===option.value} disabled={disabled} onChange={()=>setStatus(option.value as ResourceStatus)} className="mt-1 accent-emerald-700"/><span><b className="block text-sm text-slate-800">{option.label}</b><span className="text-xs text-slate-500">{disabled?"A published or archived resource cannot return to draft.":option.hint}</span></span></label>})}</div></section>
        <p className="rounded-lg border border-sky-100 bg-sky-50 p-4 text-xs leading-relaxed text-sky-900">Resource files are stored privately. Members receive file access only through the authorized resource endpoint.</p>
      </aside>
    </div>
    <div className="sticky bottom-16 flex gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow sm:hidden"><Link href="/admin/resources" className="flex min-h-11 flex-1 items-center justify-center rounded-md border border-slate-300 text-sm font-semibold text-slate-700">Cancel</Link><button disabled={busy||loading||!categories.length} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-emerald-700 text-sm font-semibold text-white disabled:opacity-50"><Save size={16}/>{busy?"Saving…":"Save Resource"}</button></div>
  </form>;
}
