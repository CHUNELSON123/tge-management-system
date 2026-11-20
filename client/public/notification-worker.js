/* Notification clicks return to the existing TGE tab when possible. */
self.addEventListener("notificationclick", (event) => {
  const path = typeof event.notification.data?.path === "string" && event.notification.data.path.startsWith("/") && !event.notification.data.path.startsWith("//") ? event.notification.data.path : "/";
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) { existing.postMessage({ type: "tge:open-notification", path }); await existing.focus(); }
    else await self.clients.openWindow(path);
  })());
});
