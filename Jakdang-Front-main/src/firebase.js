// Firebase 초기화 설정
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: "AIzaSyBee07zoo7GgP4kAsjrqsUaKwh7BGIXmKQ",
    authDomain: "jakdang-labs.firebaseapp.com",
    projectId: "jakdang-labs",
    storageBucket: "jakdang-labs.firebasestorage.app",
    messagingSenderId: "248990220561",
    appId: "1:248990220561:web:4dfaedba9ba696fdfb4cb0",
    measurementId: "G-585J30HL3V"
};

let messaging = null;

try {
    const app = initializeApp(firebaseConfig);
    // 브라우저가 필요한 기능을 지원하는지 확인
    if (typeof window !== 'undefined' && 
        'serviceWorker' in navigator && 
        'Notification' in window) {
        messaging = getMessaging(app);
    }
} catch (error) {
    console.warn('Firebase 초기화 실패:', error);
}

export const requestForToken = async () => {
    if (!messaging) {
        console.warn('Firebase Messaging이 초기화되지 않았습니다.');
        return null;
    }

    try {
        if (!("Notification" in window)) {
            console.warn("이 브라우저는 알림을 지원하지 않습니다.");
            return null;
        }

        const permission = await Notification.requestPermission();
        
        if (permission !== 'granted') {
            console.warn('알림 권한이 거부되었습니다.');
            return null;
        }
        
        const token = await getToken(messaging, {
            vapidKey: 'BJtBngR0dCUXR--ftSvQlbxuXM7nTdpeskAe8qR5ZmFx9VdMf3WONisMitVNN5in3cJ3MclI5JOj8tdY5b30jAM'
        });
        
        console.log('FCM 토큰:', token);
        return token;
    } catch (error) {
        console.warn('토큰 요청 중 오류 발생:', error);
        return null;
    }
};

export const onMessageListener = () => {
    if (!messaging) {
        return Promise.reject(new Error('Firebase Messaging이 초기화되지 않았습니다.'));
    }

    return new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            console.log('메시지 수신됨:', payload);
            resolve(payload);
        });
    });
};

export { messaging };