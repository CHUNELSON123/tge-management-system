import { AdminProgrammeDetailPage } from "@/modules/admin-portal/pages/admin-programme-detail-page";
export const instant = false;

export default async function Page({ params }: PageProps<"/admin/programmes/[programmeId]">) { const { programmeId } = await params; return <AdminProgrammeDetailPage programmeId={programmeId} />; }
