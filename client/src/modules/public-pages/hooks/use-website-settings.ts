"use client";
import { useEffect, useState } from "react";
import { websiteSettingsService, type PublicWebsiteSettings } from "../services/website-settings.service";
export function useWebsiteSettings() {
  const [settings, setSettings] = useState<PublicWebsiteSettings | null>(null);
  useEffect(() => { const controller = new AbortController(); websiteSettingsService.public(controller.signal).then(setSettings).catch(() => {}); return () => controller.abort(); }, []);
  return settings;
}
