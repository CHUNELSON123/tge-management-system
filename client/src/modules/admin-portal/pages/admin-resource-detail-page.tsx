"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronDown, Download, Edit3, Eye, FileText, Link2, ShieldCheck, Users } from "lucide-react";
import { useAdminResource } from "../hooks/use-admin-resources";
import { adminResourcesService } from "../services/admin-resources.service";
import type { ResourceStatus } from "../types/admin-resources.types";

function token(){return typeof window==="undefined"?"":localStorage.getItem("tge.accessToken")||sessionStorage.getItem("tge.accessToken")||"";}
function prettyDate(value:string|undefined){if(!value)return "—";const date=new Date(value);return Number.isNaN(date.getTime())?"Date unavailable":new Intl.DateTimeFormat(undefined,{year:"numeric",month:"short",day:"numeric"}).format(date);}
const badgeStyle:Record<ResourceStatus,string>={published:"bg-emerald-100 text-emerald-900",draft:"bg-amber-100 text-amber-900",archived:"bg-slate-100 text-slate-700"};
type Notice={kind:"success"|"error";text:string};

export function AdminResourceDetailPage({id}:{id:string}) {
  const vm=useAdminResource(id);
  const [notice,setNotice]=useState<Notice|null>(null);
  const [busy,setBusy]=useState(false);
  const resource=vm.data;

  async function change(status:"published"|"archived"){
    if(!resource)return;
    setBusy(true);setNotice(null);
    try{await adminResourcesService.status(token(),resource.id,status);await vm.reload();setNotice({kind:"success",text:`Resource ${status}.`});}
    catch(reason){setNotice({kind:"error",text:reason instanceof Error?reason.message:"Resource status could not be updated."});}
    finally{setBusy(false);}
  }
  async function download(versionId?:string,filename?:string,mimeType?:string){
    if(!resource)return;
    const version=versionId?resource.versionHistory.find(item=>item.id===versionId):resource.latestVersion;
    if(!version)return;
    setNotice(null);
    try{await adminResourcesService.download(token(),resource.id,filename??version.originalFilename,mimeType??version.mimeType,version.id);setNotice({kind:"success",text:`Download started for ${version.originalFilename}.`});}
    catch(reason){setNotice({kind:"error",text:reason instanceof Error?reason.message:"Resource download failed."});}
  }

  if(vm.loading)return <div role="status" className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">Loading resource…</div>;
  if(vm.error||!resource)return <section className="rounded-lg border border-slate-200 bg-white p-8 text-center"><p role="alert" className="text-sm text-rose-800">{vm.error||"Resource was not found."}</p><Link href="/admin/resources" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"><ArrowLeft size={16}/>Back to Resources</Link></section>;

  const assigned=resource.programmes.length>0||resource.cohorts.length>0;
  const audience=assigned?"Assigned members":resource.accessLevel==="public"?"General public":"All members";
  const noticeStyle=notice?.kind==="success"?"border-emerald-200 bg-emerald-50 text-emerald-900":"border-rose-200 bg-rose-50 text-rose-900";

  return <section className="mx-auto max-w-7xl space-y-5">
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500"><Link href="/" className="hover:text-emerald-700">Home</Link><span>›</span><Link href="/admin" className="hover:text-emerald-700">Admin</Link><span>›</span><Link href="/admin/resources" className="hover:text-emerald-700">Resources</Link><span>›</span><span className="font-medium text-emerald-700">Resource Details</span></nav>
    <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight text-slate-950">Resource Details</h1><p className="mt-1 text-sm text-slate-600">View resource information, download, and manage access.</p></div><div className="flex w-full flex-wrap gap-2 sm:w-auto"><Link href="/admin/resources" className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 sm:flex-none"><ArrowLeft size={16}/>Back to Resources</Link><Link href={`/admin/resources/${resource.id}/edit`} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md border border-emerald-700 px-3 text-sm font-semibold text-emerald-800 sm:flex-none"><Edit3 size={16}/>Edit Resource</Link><details className="relative flex-1 sm:flex-none"><summary className="flex min-h-10 cursor-pointer list-none items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white">More Actions <ChevronDown size={16}/></summary><div className="absolute right-0 z-10 mt-1 min-w-48 rounded-md border border-slate-200 bg-white p-1 shadow-lg">{resource.status==="draft"&&<button disabled={busy} onClick={()=>void change("published")} className="w-full rounded px-3 py-2 text-left text-sm hover:bg-emerald-50 disabled:opacity-50">Publish</button>}{resource.status!=="archived"&&<button disabled={busy} onClick={()=>void change("archived")} className="w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50">Archive</button>}{resource.status==="archived"&&<p className="px-3 py-2 text-xs text-slate-500">No further status actions are available.</p>}</div></details></div></header>
    {notice&&<p role={notice.kind==="error"?"alert":"status"} className={`flex items-start gap-2 rounded-md border p-3 text-sm ${noticeStyle}`}><CheckCircle2 size={17} className="mt-0.5 shrink-0"/>{notice.text}</p>}

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <article className="space-y-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <section className="grid gap-5 md:grid-cols-[minmax(160px,220px)_minmax(0,1fr)]"><div className="grid min-h-52 place-items-center rounded-lg bg-gradient-to-br from-emerald-50 to-slate-100 text-emerald-700"><FileText size={68} strokeWidth={1.5}/></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-xl font-bold leading-tight text-slate-950 sm:text-2xl">{resource.title}</h2><span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle[resource.status]}`}>{resource.status[0].toUpperCase()+resource.status.slice(1)}</span></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">{resource.description||"No description provided."}</p>{resource.latestVersion?<div className="mt-4 flex flex-wrap items-center gap-3"><button onClick={()=>void download()} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-emerald-700 px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"><Download size={16}/>Download latest version</button><span className="break-words text-xs text-slate-600">{resource.latestVersion.mimeType.split("/").at(-1)?.toUpperCase()} · {(resource.latestVersion.fileSize/1024/1024).toFixed(2)} MB · v{resource.latestVersion.versionNumber}</span></div>:<p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">No file has been uploaded. Upload a file before publishing this resource.</p>}
            <dl className="mt-5 grid gap-x-5 gap-y-3 text-sm sm:grid-cols-2"><Info label="Resource Type" value={resource.resourceType}/><Info label="Category" value={resource.category.name}/><Info label="Uploaded By" value={resource.latestVersion?.uploadedBy??"—"}/><Info label="Date Uploaded" value={prettyDate(resource.latestVersion?.createdAt)}/><Info label="Access" value={audience}/><Info label="Last Updated" value={prettyDate(resource.updatedAt)}/></dl>
          </div></section>

        <section className="grid gap-4 border-t border-slate-100 pt-5 lg:grid-cols-2"><div><h3 className="font-semibold text-slate-950">Description</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">{resource.description||"No description provided."}</p><h3 className="mt-5 font-semibold text-slate-950">Tags</h3><div className="mt-2 flex flex-wrap gap-2">{resource.tags.length?resource.tags.map(tag=><span key={tag} className="max-w-full break-words rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-900">{tag}</span>):<span className="text-sm text-slate-500">No tags</span>}</div></div><div className="space-y-4"><AssignmentList title="Related Programmes" values={resource.programmes.map(item=>item.name)}/><AssignmentList title="Related Cohorts" values={resource.cohorts.map(item=>item.name)}/></div></section>
      </article>

      <aside className="space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-bold text-slate-950">Quick Stats</h2><div className="mt-3 grid grid-cols-2 gap-2"><Stat Icon={Download} value="Not tracked" label="Downloads"/><Stat Icon={Eye} value="Not tracked" label="Views"/><Stat Icon={Users} value={assigned?"Restricted":"General"} label="Member access"/><Stat Icon={ShieldCheck} value={resource.status[0].toUpperCase()+resource.status.slice(1)} label="Status"/></div><p className="mt-3 text-xs leading-relaxed text-slate-500">Download and view counts are not recorded by this system.</p></section>
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-2"><h2 className="font-bold text-slate-950">Version History</h2><Link href={`/admin/resources/${resource.id}/edit`} className="text-xs font-semibold text-emerald-800">Replace file</Link></div>{resource.versionHistory.length?<ol className="mt-3 space-y-3">{resource.versionHistory.map(version=><li key={version.id} className="rounded-md border border-slate-100 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="font-semibold text-slate-900">Version {version.versionNumber}</p><p className="mt-1 break-all text-xs text-slate-600">{version.originalFilename}</p></div><button aria-label={`Download version ${version.versionNumber}`} onClick={()=>void download(version.id,version.originalFilename,version.mimeType)} className="rounded-md border border-slate-200 p-2 text-emerald-800 hover:bg-emerald-50"><Download size={15}/></button></div><p className="mt-2 text-xs text-slate-500">{prettyDate(version.createdAt)} · {version.uploadedBy} · {(version.fileSize/1024/1024).toFixed(2)} MB</p></li>)}</ol>:<p className="mt-3 text-sm text-slate-500">No file versions yet.</p>}</section>
        <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600"><Link2 size={16} className="mt-0.5 shrink-0 text-emerald-700"/>Private storage keys are never included in resource details or file links.</div>
      </aside>
    </div>
  </section>;
}

function Info({label,value}:{label:string;value:string}){return <div className="min-w-0"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-0.5 break-words font-medium text-slate-800">{value}</dd></div>}
function AssignmentList({title,values}:{title:string;values:string[]}){return <section className="rounded-md border border-slate-200 p-4"><h3 className="font-semibold text-slate-950">{title}</h3>{values.length?<ul className="mt-2 space-y-2">{values.map(value=><li key={value} className="break-words text-sm text-slate-600">{value}</li>)}</ul>:<p className="mt-2 text-sm text-slate-500">No assignments</p>}</section>}
function Stat({Icon,value,label}:{Icon:typeof Download;value:string;label:string}){return <div className="min-w-0 rounded-md border border-slate-100 bg-slate-50 p-3 text-center"><Icon size={20} className="mx-auto text-emerald-700"/><p className="mt-1 break-words text-sm font-bold text-slate-900">{value}</p><p className="mt-1 break-words text-[11px] text-slate-600">{label}</p></div>}
