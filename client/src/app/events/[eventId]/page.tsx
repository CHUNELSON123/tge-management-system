import EventDetailPage from "@/modules/public-pages/pages/event-detail-page";

export default async function Page(props: PageProps<"/events/[eventId]">) {
  const { eventId } = await props.params;
  return <EventDetailPage eventId={eventId} />;
}
