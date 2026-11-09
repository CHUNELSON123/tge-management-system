"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/modules/i18n/language-provider";
import { memberLearningEventsService, MemberLearningEventsRequestError } from "../services/member-learning-events.service";
import type { MemberProgramme, MemberProgrammeView } from "../types/member-programmes.types";

function accessToken() {
  return localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
}

export function useMemberProgrammes() {
  const { t } = useLanguage();
  const router = useRouter();
  const [programmes, setProgrammes] = useState<MemberProgramme[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<MemberProgrammeView>("enrolled");
  const [search, setSearch] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const token = accessToken();
    if (!token) { router.replace("/login"); return () => controller.abort(); }
    setLoading(true);
    setFailed(false);
    memberLearningEventsService.getProgrammes(token, controller.signal).then(setProgrammes).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof MemberLearningEventsRequestError && error.status === 401) {
        localStorage.removeItem("tge.accessToken"); sessionStorage.removeItem("tge.accessToken"); router.replace("/login"); return;
      }
      setFailed(true);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [router, requestVersion]);

  const filteredProgrammes = useMemo(() => programmes.filter((programme) => {
    const matchView = view === "available" ? programme.enrollmentStatus === null : programme.enrollmentStatus === view;
    const query = search.trim().toLocaleLowerCase();
    return matchView && (!query || `${programme.name} ${programme.description ?? ""} ${programme.cohortName ?? ""}`.toLocaleLowerCase().includes(query));
  }), [programmes, search, view]);

  const counts = useMemo(() => ({
    enrolled: programmes.filter((programme) => programme.enrollmentStatus === "enrolled").length,
    completed: programmes.filter((programme) => programme.enrollmentStatus === "completed").length,
    available: programmes.filter((programme) => programme.enrollmentStatus === null).length,
  }), [programmes]);

  const emptyMessage = filteredProgrammes.length > 0 ? "" : search.trim() ? t("memberProgrammeNoResults") :
    view === "enrolled" ? t("memberProgrammeEmptyEnrolled") : view === "completed" ? t("memberProgrammeEmptyCompleted") : t("memberProgrammeEmptyAvailable");

  return { programmes: filteredProgrammes, counts, loading, failed, view, setView, search, setSearch, emptyMessage, retry: () => setRequestVersion((value) => value + 1) };
}
