function formatWithTimezone(value: string, locale: string, options: Intl.DateTimeFormatOptions, timezone?: string | null) {
  const date = new Date(value);
  try {
    return new Intl.DateTimeFormat(locale, { ...options, ...(timezone ? { timeZone: timezone } : {}) }).format(date);
  } catch {
    return new Intl.DateTimeFormat(locale, options).format(date);
  }
}

export function formatEventDate(value: string, locale: string, timezone?: string | null) {
  return formatWithTimezone(value, locale, { dateStyle: "full" }, timezone);
}

export function formatEventTime(value: string, locale: string, timezone?: string | null) {
  return formatWithTimezone(value, locale, { timeStyle: "short" }, timezone);
}

export function getEventDateBadge(value: string, locale: string, timezone?: string | null) {
  return {
    month: formatWithTimezone(value, locale, { month: "short" }, timezone),
    day: formatWithTimezone(value, locale, { day: "2-digit" }, timezone),
    weekday: formatWithTimezone(value, locale, { weekday: "short" }, timezone),
  };
}
