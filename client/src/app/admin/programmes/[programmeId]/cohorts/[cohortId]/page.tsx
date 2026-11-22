import { AdminCohortDetailPage } from "@/modules/admin-portal/pages/admin-cohort-detail-page";
export const instant = false;

export default async function Page({ params }: PageProps<"/admin/programmes/[programmeId]/cohorts/[cohortId]">) { const { cohortId } = await params; return <AdminCohortDetailPage cohortId={cohortId} />; }
