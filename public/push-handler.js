// public/push-handler.js
self.addEventListener('push', function(event) {
  event.waitUntil(
    self.registration.showNotification('Test', {
      body: 'Hello from push handler',
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url ?? '/'));
});