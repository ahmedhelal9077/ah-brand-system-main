/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener("push", (event: PushEvent) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      sw.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || "/icon512_maskable.png",
        data: data.url
      })
    );
  }
});

sw.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  if (event.notification.data) {
    event.waitUntil(sw.clients.openWindow(event.notification.data));
  }
});
