import NewsArticlePage from "@/modules/public-pages/pages/news-article-page";
export default async function Page(props: PageProps<"/news/[slug]">) {
  const { slug } = await props.params;
  return <NewsArticlePage slug={slug} />;
}
