import {AdminEventRegistrationsPage} from "@/modules/admin-portal/pages/admin-event-registrations-page";
export const instant = false;

export default async function Page({params}:{params:Promise<{eventId:string}>}){const {eventId}=await params;return <AdminEventRegistrationsPage id={eventId}/>;}
