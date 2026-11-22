"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/modules/i18n/language-provider";
import { adminMembersService, AdminMembersRequestError } from "../services/admin-members.service";

export function useAdminMemberPhoto(memberId: string) {
  const router = useRouter();
  const { t } = useLanguage();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) { router.replace("/admin/login"); return; }
    const controller = new AbortController();
    let createdUrl: string | null = null;
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset UI state when the active request or session changes.
    setLoading(true);
    adminMembersService.getPhoto(token, memberId, controller.signal).then((blob) => {
      if (!controller.signal.aborted) {
        createdUrl = blob ? URL.createObjectURL(blob) : null;
        setPhotoUrl(createdUrl);
      }
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const status = error instanceof AdminMembersRequestError ? error.status : 0;
      if (status === 401) { localStorage.removeItem("tge.accessToken"); sessionStorage.removeItem("tge.accessToken"); router.replace("/admin/login"); }
      else if (status === 403) router.replace("/portal");
      else if (status === 403) router.replace("/portal");
      else setFeedback(t("profilePhotoError"));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); if (createdUrl) URL.revokeObjectURL(createdUrl); };
  }, [memberId, router, t, version]);

  async function upload(file: File) {
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size === 0 || file.size > 2 * 1024 * 1024) { setFeedback(t("profilePhotoInvalid")); return false; }
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) { router.replace("/admin/login"); return false; }
    setSaving(true); setFeedback(null);
    try {
      await adminMembersService.updatePhoto(token, memberId, file);
      setVersion((current) => current + 1);
      setFeedback(t("profilePhotoSaved"));
      return true;
    } catch (error) {
      const status = error instanceof AdminMembersRequestError ? error.status : 0;
      if (status === 401) { localStorage.removeItem("tge.accessToken"); sessionStorage.removeItem("tge.accessToken"); router.replace("/admin/login"); }
      else if (status === 403) router.replace("/portal");
      else setFeedback(t(status === 400 ? "profilePhotoInvalid" : "profilePhotoError"));
      return false;
    } finally { setSaving(false); }
  }
  return { photoUrl, loading, saving, feedback, upload };
}
