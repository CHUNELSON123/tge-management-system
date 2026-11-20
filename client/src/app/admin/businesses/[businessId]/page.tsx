import { AdminBusinessDetailPage } from "@/modules/admin-portal/pages/admin-business-detail-page";
export const instant = false;

export default async function Page({ params }: { params: Promise<{ businessId: string }> }) { const { businessId } = await params; return <AdminBusinessDetailPage businessId={businessId} />; }
