import type { AdminReportsData } from "../types/admin-reports.types";
const API=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000";
export const adminReportsService={async load(token:string,from:string,to:string,signal?:AbortSignal):Promise<AdminReportsData>{const query=new URLSearchParams({from,to});const response=await fetch(`${API}/api/admin/reports?${query}`,{headers:{Authorization:`Bearer ${token}`},cache:"no-store",signal});const body=await response.json().catch(()=>null) as {message?:string;data?:AdminReportsData}|null;if(!response.ok||!body?.data)throw new Error(body?.message||"Reports are unavailable.");return body.data;}};
export async function exportAdminReport(token: string, from: string, to: string): Promise<Blob> {
  const response = await fetch(`${API}/api/admin/reports/export?${new URLSearchParams({ from, to })}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) throw new Error("Report export failed.");
  return response.blob();
}
