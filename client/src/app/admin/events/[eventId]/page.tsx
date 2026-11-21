import {AdminEventDetailPage} from "@/modules/admin-portal/pages/admin-event-detail-page";
export const instant = false;

export default async function Page({params}:{params:Promise<{eventId:string}>}){const {eventId}=await params;return <AdminEventDetailPage id={eventId}/>;}
