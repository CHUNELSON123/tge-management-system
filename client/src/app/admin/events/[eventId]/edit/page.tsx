import {AdminEventFormPage} from "@/modules/admin-portal/pages/admin-event-form-page";
export const instant = false;

export default async function Page({params}:{params:Promise<{eventId:string}>}){const {eventId}=await params;return <AdminEventFormPage eventId={eventId}/>;}
