"use client";

import { useEffect, useState } from "react";
import { adminMembersService } from "../services/admin-members.service";

export function useAdminMemberPhotos(memberIds: string[]) {
  const idsKey = JSON.stringify(memberIds);
  const [photos, setPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    const ids = JSON.parse(idsKey) as string[];
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Clear stale object URLs as the requested members change.
    if (!token || ids.length === 0) { setPhotos({}); return; }
    const controller = new AbortController();
    const objectUrls: string[] = [];
    setPhotos({});
    Promise.all(ids.map(async (id) => {
      try {
        const blob = await adminMembersService.getPhoto(token, id, controller.signal);
        if (!blob || controller.signal.aborted) return null;
        const url = URL.createObjectURL(blob);
        objectUrls.push(url);
        return [id, url] as const;
      } catch { return null; }
    })).then((entries) => {
      if (!controller.signal.aborted) setPhotos(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null)));
    });
    return () => {
      controller.abort();
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [idsKey]);

  return photos;
}
