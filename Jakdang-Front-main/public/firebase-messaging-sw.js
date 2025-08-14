importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyBee07zoo7GgP4kAsjrqsUaKwh7BGIXmKQ",
    authDomain: "jakdang-labs.firebaseapp.com",
    projectId: "jakdang-labs",
    storageBucket: "jakdang-labs.firebasestorage.app",
    messagingSenderId: "248990220561",
    appId: "1:248990220561:web:4dfaedba9ba696fdfb4cb0",
    measurementId: "G-585J30HL3V"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] 백그라운드 메시지 수신:', payload);
  
  const notificationTitle = payload.notification.title || '새 알림';
  const notificationOptions = {
    body: payload.notification.body || '새로운 메시지가 도착했습니다.',
    icon: '/Jackdang_logo.png',
    data: {
      url: payload.data?.click_action || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});