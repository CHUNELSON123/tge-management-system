import { PublicWebsiteEntriesPage } from "@/modules/public-pages/pages/public-website-entries-page";
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <PublicWebsiteEntriesPage kind="blog" slug={slug} />; }
