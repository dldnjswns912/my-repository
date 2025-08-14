import { accessTokenAtom } from '@/jotai/authAtoms';
import { useStompClient } from '@/utils/socket/stompClient';
import { useAtomValue } from 'jotai';
import { createContext, useContext, useEffect, useState } from 'react';

// 채팅 컨텍스트 생성
const ChatContext = createContext(null);

// 채팅 Provider 컴포넌트
export const ChatProvider = ({ children }) => {
  const accessToken = useAtomValue(accessTokenAtom);
  const stompClient = useStompClient();
  const [isConnected, setIsConnected] = useState(false);

  // 로그인 상태에 따른 STOMP 연결 관리
  useEffect(() => {
    // 연결이 이미 되어있거나 토큰이 없으면 처리하지 않음
    if (isConnected || !accessToken) return;

    const connect = async () => {
      try {
        // STOMP 연결
        stompClient.connect();
        
        // 연결 성공 시 처리
        stompClient.onConnect(() => {
          console.log('STOMP connection established');
          setIsConnected(true);
        });
        
        // 연결 해제 시 처리
        stompClient.onDisconnect(() => {
          console.log('STOMP connection closed');
          setIsConnected(false);
        });
        
        // 에러 처리
        stompClient.onError((frame) => {
          console.error('STOMP connection error:', frame);
          setIsConnected(false);
        });
      } catch (error) {
        console.error('Failed to establish STOMP connection:', error);
        setIsConnected(false);
      }
    };

    connect();

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      if (isConnected) {
        stompClient.disconnect();
        setIsConnected(false);
      }
    };
  }, [accessToken, isConnected, stompClient]);

  // 채팅 컨텍스트 값
  const contextValue = {
    isConnected,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// 채팅 컨텍스트 훅
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};