import BusinessDetailsPage from "@/modules/public-pages/pages/business-details-page";
export default async function Page(props: PageProps<"/business-directory/[slug]">) {
  const { slug } = await props.params;
  return <BusinessDetailsPage slug={slug} />;
}
