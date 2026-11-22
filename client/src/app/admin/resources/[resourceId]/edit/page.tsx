import {AdminResourceFormPage} from "@/modules/admin-portal/pages/admin-resource-form-page";
export const instant = false;

export default async function Page({params}:{params:Promise<{resourceId:string}>}){const {resourceId}=await params;return <AdminResourceFormPage resourceId={resourceId}/>;}
