"use client";

import Link from "next/link";
import { BookOpen, ChevronLeft, ChevronRight, Download, FileText, Filter, Folder, Plus, RefreshCw, Search, Users } from "lucide-react";
import { useAdminResources } from "../hooks/use-admin-resources";

const statusStyle={published:"bg-emerald-50 text-emerald-800",draft:"bg-amber-50 text-amber-800",archived:"bg-slate-100 text-slate-700"};
function formatDate(value:string) {
  const date=new Date(value);
  return Number.isNaN(date.getTime())?"Date unavailable":new Intl.DateTimeFormat(undefined,{year:"numeric",month:"short",day:"numeric"}).format(date);
}

export function AdminResourcesPage() {
  const vm=useAdminResources();
  const summary=vm.data?.summary;
  const metricValue=(value:number|undefined)=>vm.loading?"Loading…":vm.error?"Unavailable":value??"Unavailable";
  const cards=[
    {label:"Total Resources",value:metricValue(summary?.totalResources),Icon:FileText,tint:"bg-emerald-50 text-emerald-700"},
    {label:"Categories",value:metricValue(summary?.categories),Icon:Folder,tint:"bg-sky-50 text-sky-700"},
    {label:"Total Downloads",value:"Not tracked",Icon:Download,tint:"bg-violet-50 text-violet-700"},
    {label:"Active Resources",value:metricValue(summary?.publishedResources),Icon:Users,tint:"bg-teal-50 text-teal-700"},
  ];
  const clearFilters=()=>vm.setFilters({search:"",categoryId:"",programmeId:"",cohortId:"",status:"",page:1,pageSize:10});
  const categoryTabs=[{id:"",name:"All"},...vm.categories.slice(0,3).map(category=>({id:category.id,name:category.name}))];
  const from=vm.data?.total?((vm.filters.page-1)*vm.filters.pageSize)+1:0;
  const to=vm.data?Math.min(vm.filters.page*vm.filters.pageSize,vm.data.total):0;

  return <section className="mx-auto max-w-7xl space-y-5">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><h1 className="text-2xl font-bold tracking-tight text-slate-950">Resources</h1><p className="mt-1 text-sm text-slate-600">Manage training materials, documents and other resources for members.</p></div>
      <Link href="/admin/resources/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"><Plus size={18}/>Upload Resource</Link>
    </header>

    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map(({label,value,Icon,tint})=><article key={label} className="flex min-h-24 items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${tint}`}><Icon size={25}/></span><div className="min-w-0"><p className="break-words text-xl font-bold leading-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-600">{label}</p>{label==="Total Downloads"&&<p className="mt-1 text-[11px] text-slate-500">Download tracking is unavailable.</p>}</div></article>)}
    </div>

    <section aria-label="Resource filters" className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_repeat(4,minmax(140px,1fr))_auto_auto]">
        <label className="flex min-h-11 min-w-0 items-center gap-2 rounded-md border border-slate-200 px-3 sm:col-span-2 xl:col-span-1"><Search size={17} className="shrink-0 text-slate-500"/><input aria-label="Search resources by title, category, or keyword" placeholder="Search title, category, or keyword…" value={vm.filters.search} onChange={event=>vm.setFilters({...vm.filters,search:event.target.value,page:1})} className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></label>
        <select aria-label="Filter by category" className="min-h-11 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm" value={vm.filters.categoryId} onChange={event=>vm.setFilters({...vm.filters,categoryId:event.target.value,page:1})}><option value="">All Categories</option>{vm.categories.map(category=><option key={category.id} value={category.id}>{category.name}</option>)}</select>
        <select aria-label="Filter by programme" className="min-h-11 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm" value={vm.filters.programmeId} onChange={event=>vm.setFilters({...vm.filters,programmeId:event.target.value,page:1})}><option value="">All Programmes</option>{vm.programmes.map(programme=><option key={programme.id} value={programme.id}>{programme.name}</option>)}</select>
        <select aria-label="Filter by cohort" className="min-h-11 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm" value={vm.filters.cohortId} onChange={event=>vm.setFilters({...vm.filters,cohortId:event.target.value,page:1})}><option value="">All Cohorts</option>{vm.cohorts.filter(cohort=>!vm.filters.programmeId||cohort.programmeId===vm.filters.programmeId).map(cohort=><option key={cohort.id} value={cohort.id}>{cohort.name}</option>)}</select>
        <select aria-label="Filter by status" className="min-h-11 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm" value={vm.filters.status} onChange={event=>vm.setFilters({...vm.filters,status:event.target.value,page:1})}><option value="">All Statuses</option>{["published","draft","archived"].map(status=><option key={status} value={status}>{status[0].toUpperCase()+status.slice(1)}</option>)}</select>
        
        <button onClick={clearFilters} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50"><RefreshCw size={15}/>Reset</button>
      </div>
      <div className="mt-3 flex gap-5 overflow-x-auto border-b border-slate-100 md:hidden">{categoryTabs.map(tab=><button key={tab.id||"all"} onClick={()=>vm.setFilters({...vm.filters,categoryId:tab.id,page:1})} aria-pressed={vm.filters.categoryId===tab.id} className={`min-h-10 shrink-0 border-b-2 px-1 text-sm font-semibold ${vm.filters.categoryId===tab.id?"border-emerald-700 text-emerald-800":"border-transparent text-slate-600"}`}>{tab.name}</button>)}</div>
    </section>

    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-4"><h2 className="font-bold text-slate-950">Resources ({vm.data?.total??(vm.loading?"…":"0")})</h2><span className="text-xs text-slate-500">Search and filters use saved resource metadata.</span></div>
      {vm.loading?<div role="status" className="p-10 text-center text-sm text-slate-600">Loading resources…</div>:vm.error?<div className="p-10 text-center"><p role="alert" className="text-sm text-rose-800">{vm.error}</p><button onClick={()=>void vm.reload()} className="mt-3 text-sm font-semibold text-emerald-800">Try again</button></div>:!vm.data?.rows.length?<div className="p-10 text-center"><BookOpen className="mx-auto mb-3 text-emerald-700"/><p className="font-semibold text-slate-900">{vm.filters.search||vm.filters.categoryId||vm.filters.status||vm.filters.programmeId||vm.filters.cohortId?"No resources match these filters.":"No resources have been uploaded yet."}</p><p className="mt-1 text-sm text-slate-600">Upload a resource to add it to the library.</p></div>:<>
        <div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-600"><tr>{["Title","Category","Programme","Cohort","Type","Downloads","Status","Date Added",""].map((label,index)=><th key={`${label}-${index}`} className="px-3 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{vm.data.rows.map(resource=><tr key={resource.id} className="border-t border-slate-100 align-top"><td className="max-w-[260px] px-3 py-3"><Link className="break-words font-semibold text-slate-900 hover:text-emerald-800" href={`/admin/resources/${resource.id}`}>{resource.title}</Link><p className="mt-1 break-all text-xs text-slate-500">{resource.latestVersion?.originalFilename??"No file uploaded"}</p></td><td className="px-3 py-3">{resource.category.name}</td><td className="max-w-[180px] px-3 py-3 break-words">{resource.programmes.map(programme=>programme.name).join(", ")||"—"}</td><td className="max-w-[180px] px-3 py-3 break-words">{resource.cohorts.map(cohort=>cohort.name).join(", ")||"—"}</td><td className="px-3 py-3">{resource.resourceType}</td><td className="px-3 py-3 text-slate-500">Not tracked</td><td className="px-3 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[resource.status]}`}>{resource.status[0].toUpperCase()+resource.status.slice(1)}</span></td><td className="whitespace-nowrap px-3 py-3">{formatDate(resource.createdAt)}</td><td className="px-3 py-3"><Link className="rounded-md border border-emerald-700 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50" href={`/admin/resources/${resource.id}`}>View</Link></td></tr>)}</tbody></table></div>
        <div className="divide-y divide-slate-100 lg:hidden">{vm.data.rows.map(resource=><Link key={resource.id} href={`/admin/resources/${resource.id}`} className="flex min-h-24 items-start gap-3 p-4 hover:bg-slate-50"><span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700"><FileText size={22}/></span><span className="min-w-0 flex-1"><span className="block break-words font-semibold leading-snug text-slate-950">{resource.title}</span><span className="mt-1 block break-words text-xs text-slate-600">{resource.category.name}{resource.programmes.length?` · ${resource.programmes.map(item=>item.name).join(", ")}`:""}</span><span className="mt-1 block break-all text-xs text-slate-500">{resource.latestVersion?.originalFilename??"No file uploaded"}</span><span className="mt-2 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle[resource.status]}`}>{resource.status[0].toUpperCase()+resource.status.slice(1)}</span><span className="text-[11px] text-slate-500">{resource.resourceType} · {formatDate(resource.createdAt)}</span></span></span><ChevronRight size={18} className="mt-3 shrink-0 text-emerald-700"/></Link>)}</div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 text-xs text-slate-600"><span>Showing {from} to {to} of {vm.data.total} resources</span><div className="flex items-center gap-2"><button aria-label="Previous page" disabled={vm.filters.page<=1} onClick={()=>vm.setFilters({...vm.filters,page:vm.filters.page-1})} className="rounded-md border border-slate-200 p-2 disabled:opacity-40"><ChevronLeft size={16}/></button><span>Page {vm.filters.page} of {Math.max(1,Math.ceil(vm.data.total/vm.filters.pageSize))}</span><button aria-label="Next page" disabled={vm.filters.page*vm.filters.pageSize>=vm.data.total} onClick={()=>vm.setFilters({...vm.filters,page:vm.filters.page+1})} className="rounded-md border border-slate-200 p-2 disabled:opacity-40"><ChevronRight size={16}/></button><select aria-label="Resources per page" value={vm.filters.pageSize} onChange={event=>vm.setFilters({...vm.filters,pageSize:Number(event.target.value),page:1})} className="min-h-9 rounded-md border border-slate-200 bg-white px-2"><option value={10}>10 per page</option><option value={25}>25 per page</option><option value={50}>50 per page</option></select></div></div>
      </>}
    </section>
  </section>;
}
