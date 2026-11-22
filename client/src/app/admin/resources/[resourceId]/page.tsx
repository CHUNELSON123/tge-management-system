import {AdminResourceDetailPage} from "@/modules/admin-portal/pages/admin-resource-detail-page";
export const instant = false;

export default async function Page({params}:{params:Promise<{resourceId:string}>}){const {resourceId}=await params;return <AdminResourceDetailPage id={resourceId}/>;}
