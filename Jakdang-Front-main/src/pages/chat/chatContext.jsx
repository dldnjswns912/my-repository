// src/contexts/ChatContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import { useChatSocket } from '../hooks/useChatSocket';
import { useUnreadCount } from '../hooks/useChatHooks';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeChatRoomId, setActiveChatRoomId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  // 실제 구현에서는 인증 서비스에서 현재 사용자 정보를 가져옴
  useEffect(() => {
    // 인증 서비스에서 사용자 정보 가져오기 (여기서는 Mock 데이터 사용)
    const mockUser = {
      id: 'test-10001',
      name: '나',
      avatar: '/placeholder.svg?height=40&width=40',
      schoolId: 'school-id',
    };
    
    setCurrentUser(mockUser);
  }, []);
  
  // 채팅 소켓 연결
  const socket = useChatSocket(
    currentUser?.id,
    activeChatRoomId
  );
  
  // 읽지 않은 메시지 수 가져오기
  const { unreadCount } = useUnreadCount(currentUser?.id);
  
  // 소켓 메시지 수신 시 알림 추가
  useEffect(() => {
    if (socket && socket.onMessage) {
      const handleMessage = (topic, message) => {
        try {
          const data = JSON.parse(message);
          
          // 현재 활성화된 채팅방이 아닌 다른 채팅방에서 메시지가 오면 알림 추가
          if (data.chatRoomId !== activeChatRoomId && data.type === 'NEW_MESSAGE') {
            const newNotification = {
              id: Date.now(),
              type: 'message',
              chatRoomId: data.chatRoomId,
              sender: data.senderName,
              message: data.message,
              time: new Date().toLocaleTimeString(),
            };
            
            setNotifications(prev => [newNotification, ...prev]);
          }
        } catch (error) {
          console.error('알림 처리 중 오류:', error);
        }
      };
      
      socket.onMessage(handleMessage);
      
      return () => {
        socket.offMessage(handleMessage);
      };
    }
  }, [socket, activeChatRoomId]);
  
  // 채팅방 활성화
  const activateChat = (chatRoomId) => {
    setActiveChatRoomId(chatRoomId);
    
    // 해당 채팅방 관련 알림 제거
    if (chatRoomId) {
      setNotifications(prev => 
        prev.filter(notification => notification.chatRoomId !== chatRoomId)
      );
    }
  };
  
  // 알림 삭제
  const dismissNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };
  
  // 모든 알림 삭제
  const dismissAllNotifications = () => {
    setNotifications([]);
  };
  
  const contextValue = {
    currentUser,
    activeChatRoomId,
    socket,
    unreadCount,
    notifications,
    activateChat,
    dismissNotification,
    dismissAllNotifications,
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};