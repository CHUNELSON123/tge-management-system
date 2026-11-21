import {AdminMentorshipDetailPage} from "@/modules/admin-portal/pages/admin-mentorship-detail-page";
export const instant = false;

export default async function Page({params}:PageProps<"/admin/mentorship/assignments/[assignmentId]">){const{assignmentId}=await params;return <AdminMentorshipDetailPage assignmentId={assignmentId}/>;}
