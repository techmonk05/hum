self.addEventListener('push', function(event) {
  console.log('PUSH EVENT RECEIVED', event);
  
  let data = { title: 'Hum 🩷', body: 'You have a notification' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      data: { url: data.url ?? '/' },
    }).then(() => console.log('Notification shown'))
      .catch(err => console.error('Notification failed:', err))
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url ?? '/'));
});