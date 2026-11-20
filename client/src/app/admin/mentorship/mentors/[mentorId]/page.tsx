import {AdminMentorDetailPage} from "@/modules/admin-portal/pages/admin-mentor-detail-page";
export const instant = false;

export default async function Page({params}:PageProps<"/admin/mentorship/mentors/[mentorId]">){const{mentorId}=await params;return <AdminMentorDetailPage mentorId={mentorId}/>;}
