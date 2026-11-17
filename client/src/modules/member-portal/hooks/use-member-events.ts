"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { publicPagesService, type PublicGalleryItem } from "@/modules/public-pages/services/public-pages.service";
import { useLanguage } from "@/modules/i18n/language-provider";
import { useCurrentTime } from "@/hooks/use-current-time";
import { memberLearningEventsService, MemberLearningEventsRequestError } from "../services/member-learning-events.service";
import type { MemberEvent, MemberEventDetails, MemberEventTab } from "../types/member-events.types";

function accessToken() {
  return localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
}

export function useMemberEvents(eventId?: string) {
  const { t } = useLanguage();
  const router = useRouter();
  const [events, setEvents] = useState<MemberEvent[]>([]);
  const [details, setDetails] = useState<MemberEventDetails | null>(null);
  const [gallery, setGallery] = useState<PublicGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<MemberEventTab>("upcoming");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [requestVersion, setRequestVersion] = useState(0);
  const [previousRequest, setPreviousRequest] = useState({ eventId, router, requestVersion });

  if (previousRequest.eventId !== eventId || previousRequest.router !== router || previousRequest.requestVersion !== requestVersion) {
    setPreviousRequest({ eventId, router, requestVersion });
    setLoading(true);
    setFailed(false);
    setNotFound(false);
  }

  useEffect(() => {
    const controller = new AbortController();
    const token = accessToken();
    if (!token) { router.replace("/login"); return () => controller.abort(); }
    const load = eventId
      ? memberLearningEventsService.getEventDetails(token, eventId, controller.signal).then((result) => { if (!controller.signal.aborted) setDetails(result); })
      : memberLearningEventsService.getEvents(token, controller.signal).then((result) => { if (!controller.signal.aborted) setEvents(result); });
    Promise.all([load, publicPagesService.getEventGallery(controller.signal).catch(() => [])]).then(([, items]) => { if (!controller.signal.aborted) setGallery(items); }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof MemberLearningEventsRequestError && error.status === 401) {
        localStorage.removeItem("tge.accessToken"); sessionStorage.removeItem("tge.accessToken"); router.replace("/login"); return;
      }
      if (error instanceof MemberLearningEventsRequestError && error.status === 404) { setNotFound(true); return; }
      setFailed(true);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [eventId, router, requestVersion]);

  const now = useCurrentTime() ?? 0;
  const upcoming = useMemo(() => events.filter((event) => Date.parse(event.startAt) >= now), [events, now]);
  const past = useMemo(() => events.filter((event) => Date.parse(event.startAt) < now), [events, now]);
  const categories = useMemo(() => [...new Set(events.map((event) => event.eventType).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [events]);
  const filteredEvents = useMemo(() => {
    const source = tab === "upcoming" ? upcoming : tab === "past" ? past : [];
    const query = search.trim().toLocaleLowerCase();
    return source.filter((event) => (category === "all" || event.eventType === category) &&
      (!query || `${event.title} ${event.description ?? ""} ${event.venue ?? ""} ${event.eventType}`.toLocaleLowerCase().includes(query)));
  }, [category, past, search, tab, upcoming]);
  const emptyMessage = filteredEvents.length > 0 ? "" : search.trim() ? t("memberEventNoResults") : tab === "upcoming" ? t("memberEventEmptyUpcoming") : t("memberEventEmptyPast");

  return {
    events: filteredEvents, allEvents: events, upcomingEvents: upcoming, now, upcomingCount: upcoming.length, pastCount: past.length, categories,
    details, gallery, detailImage: details ? gallery.find((item) => item.eventId === details.id) ?? null : null,
    loading, failed, notFound, tab, setTab, search, setSearch, category, setCategory, emptyMessage,
    retry: () => setRequestVersion((value) => value + 1),
  };
}
