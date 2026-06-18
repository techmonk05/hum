// public/push-handler.js
self.addEventListener('push', function(event) {
  console.log('PUSH EVENT RECEIVED', event);
  event.waitUntil(
    self.registration.showNotification('Test', {
      body: 'Hello from push handler',
    }).then(() => console.log('Notification shown successfully'))
      .catch(err => console.error('Notification failed:', err))
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url ?? '/'));
});