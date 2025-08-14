import {
  activeChatRoomIdAtom,
  chatMessagesAtom,
  chatRoomsAtom,
  selectedChatRoomAtom,
  stompConnectedAtom,
  unreadCountsAtom
} from '@/jotai/chatAtoms';
import {
  sendStompMessage,
  subscribeTopic,
  unsubscribeTopic,
  useStompClient
} from '@/utils/socket/stompClient';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { useChatApi } from './useChatService';

export const useChat = () => {
  const chatApi = useChatApi();
  const stompClient = useStompClient();
  
  const [chatRooms, setChatRooms] = useAtom(chatRoomsAtom);
  const [activeChatRoomId, setActiveChatRoomId] = useAtom(activeChatRoomIdAtom);
  const [selectedChatRoom, setSelectedChatRoom] = useAtom(selectedChatRoomAtom);
  const [chatMessages, setChatMessages] = useAtom(chatMessagesAtom);
  const [unreadCounts, setUnreadCounts] = useAtom(unreadCountsAtom);
  const [stompConnected, setStompConnected] = useAtom(stompConnectedAtom);
  
  const subscriptionsRef = useRef({});
  
  // 채팅방 목록 로드
  const loadChatRooms = useCallback(async () => {
    try {
      const response = await chatApi.fetchChatRooms();
      if (response.result) {
        setChatRooms(response.response.data);
      }
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
    }
  }, [chatApi, setChatRooms]);
  
  // 채팅방 메시지 로드
  const loadChatMessages = useCallback(async (roomId, page = 0, size = 20) => {
    try {
      const response = await chatApi.fetchChatMessages({
        roomId,
        page,
        size,
        sortDirection: 'DESC'
      });
      
      if (response.result) {
        setChatMessages(prev => ({
          ...prev,
          [roomId]: response.response.data
        }));
        return response.response.data;
      }
      return [];
    } catch (error) {
      console.error(`Failed to load messages for room ${roomId}:`, error);
      return [];
    }
  }, [chatApi, setChatMessages]);
  
  // 읽지 않은 메시지 개수 로드
  const loadUnreadCount = useCallback(async (roomId) => {
    try {
      const response = await chatApi.fetchUnreadCount(roomId);
      if (response.result) {
        setUnreadCounts(prev => ({
          ...prev,
          [roomId]: response.response.data.count
        }));
        return response.response.data.count;
      }
      return 0;
    } catch (error) {
      console.error(`Failed to load unread count for room ${roomId}:`, error);
      return 0;
    }
  }, [chatApi, setUnreadCounts]);
  
  // 메시지 전송
  const sendMessage = useCallback((roomId, content, attachments = []) => {
    if (!stompConnected) {
      console.error('STOMP not connected');
      return;
    }
    
    const message = {
      roomId,
      content,
      attachments
    };
    
    sendStompMessage('/app/send.message', message);
  }, [stompConnected]);
  
  // 메시지 삭제
  const deleteMessage = useCallback((roomId, messageId) => {
    if (!stompConnected) {
      console.error('STOMP not connected');
      return;
    }
    
    const message = {
      id: messageId,
      roomId
    };
    
    sendStompMessage('/app/send.delete', message);
  }, [stompConnected]);
  
  // 메시지 읽음 표시
  const markMessageAsRead = useCallback((roomId, messageId) => {
    if (!stompConnected) {
      console.error('STOMP not connected');
      return;
    }
    
    const message = {
      id: messageId,
      roomId
    };
    
    sendStompMessage('/app/send.read', message);
  }, [stompConnected]);
  
  // 메시지 편집
  const editMessage = useCallback((roomId, messageId, content) => {
    if (!stompConnected) {
      console.error('STOMP not connected');
      return;
    }
    
    const message = {
      id: messageId,
      roomId,
      content
    };
    
    sendStompMessage('/app/send.edit', message);
  }, [stompConnected]);
  
  // 채팅방 구독
  const subscribeToChatRoom = useCallback((roomId) => {
    if (!stompConnected) {
      console.error('STOMP not connected');
      return;
    }
    
    // 이미 구독 중인지 확인
    if (subscriptionsRef.current[`/topic/chat/${roomId}`]) {
      return;
    }
    
    // 채팅방 메시지 구독
    const subscription = subscribeTopic(`/topic/chat/${roomId}`, (message) => {
      console.log(`Received message in room ${roomId}:`, message);
      
      // 메시지 추가 처리
      setChatMessages(prev => {
        const roomMessages = prev[roomId] || [];
        return {
          ...prev,
          [roomId]: [...roomMessages, message.data]
        };
      });
    });
    
    // 구독 정보 저장
    if (subscription) {
      subscriptionsRef.current[`/topic/chat/${roomId}`] = subscription;
    }
  }, [stompConnected, setChatMessages]);
  
  // 채팅방 구독 해제
  const unsubscribeFromChatRoom = useCallback((roomId) => {
    const topic = `/topic/chat/${roomId}`;
    unsubscribeTopic(topic);
    delete subscriptionsRef.current[topic];
  }, []);
  
  // 개인 알림 구독
  const subscribeToPersonalNotifications = useCallback(() => {
    if (!stompConnected) {
      console.error('STOMP not connected');
      return;
    }
    
    // 채팅방 업데이트 구독
    const chatRoomSub = subscribeTopic('/user/queue/chat-room-updates', (update) => {
      console.log('Received chat room update:', update);
      loadChatRooms();
    });
    
    // 읽음 상태 구독
    const readStatusSub = subscribeTopic('/user/queue/read-status', (update) => {
      console.log('Received read status update:', update);
      setUnreadCounts(prev => ({
        ...prev,
        [update.data.roomId]: update.data.count
      }));
    });
    
    // 디스코드 업데이트 구독
    const discordSub = subscribeTopic('/user/queue/discord-updates', (update) => {
      console.log('Received discord update:', update);
    });
    
    // 구독 정보 저장
    if (chatRoomSub) {
      subscriptionsRef.current['/user/queue/chat-room-updates'] = chatRoomSub;
    }
    if (readStatusSub) {
      subscriptionsRef.current['/user/queue/read-status'] = readStatusSub;
    }
    if (discordSub) {
      subscriptionsRef.current['/user/queue/discord-updates'] = discordSub;
    }
  }, [stompConnected, loadChatRooms, setUnreadCounts]);
  
  // STOMP 연결 설정
  useEffect(() => {
    const setupConnection = async () => {
      // STOMP 클라이언트 연결
      const client = stompClient.connect();
      
      // 연결 성공 시 이벤트
      stompClient.onConnect(() => {
        setStompConnected(true);
        console.log('STOMP connection established');
        
        // 개인 알림 구독
        subscribeToPersonalNotifications();
        
        // 활성화된 채팅방이 있으면 구독
        if (activeChatRoomId) {
          subscribeToChatRoom(activeChatRoomId);
        }
      });
      
      // 연결 해제 시 이벤트
      stompClient.onDisconnect(() => {
        setStompConnected(false);
        console.log('STOMP connection closed');
      });
      
      // 에러 발생 시 이벤트
      stompClient.onError((frame) => {
        console.error('STOMP error:', frame);
      });
    };
    
    setupConnection();
    
    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      // 모든 구독 해제
      Object.keys(subscriptionsRef.current).forEach(topic => {
        unsubscribeTopic(topic);
      });
      
      subscriptionsRef.current = {};
      stompClient.disconnect();
    };
  }, []);
  
  // 활성화된 채팅방 변경 시 구독 처리
  useEffect(() => {
    if (stompConnected && activeChatRoomId) {
      // 이전 채팅방 구독 해제
      Object.keys(subscriptionsRef.current)
        .filter(key => key.startsWith('/topic/chat/'))
        .forEach(topic => {
          unsubscribeTopic(topic);
          delete subscriptionsRef.current[topic];
        });
      
      // 새 채팅방 구독
      subscribeToChatRoom(activeChatRoomId);
      
      // 채팅방 메시지 로드
      loadChatMessages(activeChatRoomId);
      
      // 읽지 않은 메시지 개수 초기화
      setUnreadCounts(prev => ({
        ...prev,
        [activeChatRoomId]: 0
      }));
    }
  }, [stompConnected, activeChatRoomId, subscribeToChatRoom, loadChatMessages, setUnreadCounts]);
  
  // 채팅방 선택 변경 핸들러
  const selectChatRoom = useCallback(async (roomId) => {
    try {
      const response = await chatApi.fetchChatRoom(roomId);
      if (response.result) {
        setSelectedChatRoom(response.response.data);
        setActiveChatRoomId(roomId);
      }
    } catch (error) {
      console.error(`Failed to select chat room ${roomId}:`, error);
    }
  }, [chatApi, setSelectedChatRoom, setActiveChatRoomId]);
  
  // 채팅방 생성
  const createChatRoom = useCallback(async (name, type = 'GROUP_CHAT') => {
    try {
      const response = await chatApi.fetchCreateChatRoom({
        name,
        type
      });
      
      if (response.result) {
        loadChatRooms();
        return response.response.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to create chat room:', error);
      return null;
    }
  }, [chatApi, loadChatRooms]);
  
  // 채팅방 나가기
  const leaveChatRoom = useCallback(async (roomId) => {
    try {
      const response = await chatApi.fetchLeaveChatRoom({
        roomId
      });
      
      if (response.result) {
        loadChatRooms();
        if (activeChatRoomId === roomId) {
          setActiveChatRoomId(null);
          setSelectedChatRoom(null);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to leave chat room ${roomId}:`, error);
      return false;
    }
  }, [chatApi, loadChatRooms, activeChatRoomId, setActiveChatRoomId, setSelectedChatRoom]);
  
  // 사용자 초대
  const inviteUserToChatRoom = useCallback(async (roomId, targetUserId, nickname) => {
    try {
      const response = await chatApi.fetchInviteUserToChatRoom({
        roomId,
        targetUserId,
        nickname
      });
      
      if (response.result) {
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to invite user to chat room ${roomId}:`, error);
      return false;
    }
  }, [chatApi]);
  
  return {
    // 상태
    chatRooms,
    activeChatRoomId,
    selectedChatRoom,
    chatMessages,
    unreadCounts,
    stompConnected,
    
    // 채팅방 관련 함수
    loadChatRooms,
    selectChatRoom,
    createChatRoom,
    leaveChatRoom,
    inviteUserToChatRoom,
    
    // 메시지 관련 함수
    loadChatMessages,
    sendMessage,
    deleteMessage,
    markMessageAsRead,
    editMessage,
    
    // 구독 관련 함수
    subscribeToChatRoom,
    unsubscribeFromChatRoom
  };
};