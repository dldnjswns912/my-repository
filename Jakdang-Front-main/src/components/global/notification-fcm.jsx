import { useEffect } from "react";
import { onMessageListener, messaging } from "@/firebase";
import { useToast } from "@/components/toast-provider";

const NotificationFCM = () => {
    const { toast } = useToast();

    // 포그라운드 메시지 리스너 설정
    useEffect(() => {
        // Firebase Messaging이 초기화되지 않은 경우 리스너를 설정하지 않음
        if (!messaging) {
            console.warn('Firebase Messaging이 초기화되지 않아 알림을 받을 수 없습니다.');
            return;
        }

        let isSubscribed = true;

        const setupMessageListener = async () => {
            try {
                const payload = await onMessageListener();
                
                if (isSubscribed) {
                    toast({
                        title: payload.notification?.title || "새 알림",
                        description: payload.notification?.body || "새로운 메시지가 도착했습니다",
                        variant: "default",
                        duration: 5000,
                    });
                    
                    // 성공적으로 메시지를 받은 경우에만 다음 리스너 설정
                    setupMessageListener();
                }
            } catch (err) {
                if (isSubscribed) {
                    console.error('알림 수신 중 오류가 발생했습니다:', err);
                    // 오류 발생 시 리스너 재설정하지 않음
                }
            }
        };
        
        setupMessageListener();
        
        return () => {
            isSubscribed = false;
        };
    }, [toast]);

    return null;
};

export default NotificationFCM;
