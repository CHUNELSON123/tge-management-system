import { AdminProgrammeFormPage } from "@/modules/admin-portal/pages/admin-programme-form-page";
export const instant = false;

export default async function Page({ params }: PageProps<"/admin/programmes/[programmeId]/edit">) { const { programmeId } = await params; return <AdminProgrammeFormPage programmeId={programmeId} />; }
