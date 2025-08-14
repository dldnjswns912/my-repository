import { accessTokenAtom } from "@/jotai/authAtoms";
import { Client } from "@stomp/stompjs";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";

const useWebSocket = (config = {}) => {
  const { onConnected, onDisconnected, onError, onMessage, debug = false } = config;

  // 상태 관리
  const stompClient = useRef(null);
  const accessToken = useAtomValue(accessTokenAtom);
  const [connectionState, setConnectionState] = useState("disconnected");
  const subscriptions = useRef({});
  const reconnectTimer = useRef(null);
  const connectAttempts = useRef(0);
  const recentMessages = useRef(new Map());
  const MAX_CONNECT_ATTEMPTS = 3;
  const MESSAGE_DEDUPLICATION_WINDOW = 5000; 
  
  // 현재 활성화된 채팅방 구독 추적용
  const activeRoomSubscription = useRef(null);
  const lastRoomId = useRef(null);
  const subscriptionInProgress = useRef(false);

  // 디버그 로그 함수
  const log = useCallback((...args) => {
    if (debug) {
      // console.log("[WebSocket]", ...args);
    }
  }, [debug]);

  // 서버 URL
  const getServerUrl = () => {
    return import.meta.env.VITE_BASE_API_URL + `/ws/chat`;
  };

  // 연결 함수
  const connect = useCallback(() => {
    // 이미 연결 중인 경우 중복 시도 방지
    if (connectionState === "connecting") {
      log("이미 연결 중입니다");
      return;
    }

    // 이미 연결된 경우 재연결 시도 방지
    if (connectionState === "connected" && stompClient.current?.connected) {
      log("이미 연결되어 있습니다");
      return;
    }

    // 최대 연결 시도 횟수 제한
    if (connectAttempts.current >= MAX_CONNECT_ATTEMPTS) {
      log(`최대 연결 시도 횟수(${MAX_CONNECT_ATTEMPTS})에 도달했습니다`);
      setConnectionState("error");
      return;
    }

    // 연결 시도 카운트 증가
    connectAttempts.current++;
    log(`연결 시도 ${connectAttempts.current}/${MAX_CONNECT_ATTEMPTS}`);
    setConnectionState("connecting");

    // 기존 연결 정리
    if (stompClient.current) {
      try {
        log("기존 클라이언트 정리 중");
        stompClient.current.deactivate();
        stompClient.current = null;
      } catch (e) {
        console.error("기존 클라이언트 정리 오류:", e);
      }
    }

    try {
      // SockJS 인스턴스 생성
      const sockjsUrl = getServerUrl();
      log(`SockJS URL: ${sockjsUrl}`);
      
      // STOMP 클라이언트 생성
      const client = new Client({
        webSocketFactory: () => new SockJS(sockjsUrl),
        connectHeaders: {
          Authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
        debug: debug ? (str) => console.log('[STOMP]', str) : undefined,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        
        // 연결 성공 시
        onConnect: (frame) => {
          log('연결 성공:', frame);
          setConnectionState("connected");
          connectAttempts.current = 0; // 성공 시 시도 횟수 초기화
          
          if (onConnected) {
            onConnected(frame);
          }
        },
        
        // 연결 해제 시
        onDisconnect: (frame) => {
          log('연결 해제:', frame);
          setConnectionState("disconnected");
          
          // 구독 정보 초기화
          subscriptions.current = {};
          activeRoomSubscription.current = null;
          lastRoomId.current = null;
          subscriptionInProgress.current = false;
          
          if (onDisconnected) {
            onDisconnected(frame);
          }
        },
        
        // STOMP 오류 시
        onStompError: (frame) => {
          console.error('STOMP 오류:', frame.headers, frame.body);
          setConnectionState("error");
          subscriptionInProgress.current = false;
          
          if (onError) {
            onError(frame);
          }
        },
        
        // WebSocket 오류 시
        onWebSocketError: (error) => {
          console.error('WebSocket 오류:', error);
          setConnectionState("error");
          subscriptionInProgress.current = false;
          
          if (onError) {
            onError(error);
          }
        },
      });

      // 클라이언트 저장 및 활성화
      stompClient.current = client;
      client.activate();
      
    } catch (error) {
      console.error("WebSocket 연결 오류:", error);
      setConnectionState("error");
      subscriptionInProgress.current = false;
      
      if (onError) {
        onError(error);
      }
    }
  }, [accessToken, connectionState, debug, log, onConnected, onDisconnected, onError]);

  // 연결 해제
  const disconnect = useCallback(() => {
    if (!stompClient.current) return;

    log("연결 해제 중");

    // 타이머 정리
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    // 활성 채팅방 구독 해제
    if (activeRoomSubscription.current) {
      try {
        log(`활성 채팅방 구독 해제: ${lastRoomId.current}`);
        activeRoomSubscription.current.unsubscribe();
        activeRoomSubscription.current = null;
        lastRoomId.current = null;
      } catch (e) {
        console.error("활성 채팅방 구독 해제 오류:", e);
      }
    }

    // 추가 구독 정리
    Object.entries(subscriptions.current).forEach(([key, sub]) => {
      try {
        log(`구독 해제: ${key}`);
        sub.unsubscribe();
      } catch (e) {
        console.error(`구독 해제 오류 (${key}):`, e);
      }
    });
    subscriptions.current = {};
    subscriptionInProgress.current = false;

    // 클라이언트 정리
    try {
      stompClient.current.deactivate();
      stompClient.current = null;
      setConnectionState("disconnected");
    } catch (e) {
      console.error("클라이언트 연결 해제 오류:", e);
    }
  }, [log]);

  // 메시지 중복 확인
  const isDuplicateMessage = useCallback((messageId, messageData) => {
    if (!messageId) {
      return false;
    }
    
    const now = Date.now();
    
    // 이미 저장된 메시지인지 확인
    if (recentMessages.current.has(messageId)) {
      const timestamp = recentMessages.current.get(messageId);
      if (now - timestamp < MESSAGE_DEDUPLICATION_WINDOW) {
        log(`중복 메시지 감지: ${messageId}`);
        return true;
      }
    }
    
    // 메시지 내용 기반 중복 확인 (메시지 ID가 다르더라도 내용이 같으면 중복)
    let contentFingerprint = null;
    try {
      // 메시지 내용 기반 핑거프린트 생성
      if (messageData.content && messageData.senderId && messageData.sentAt) {
        contentFingerprint = `${messageData.senderId}:${messageData.content}:${new Date(messageData.sentAt).getTime()}`;
        
        // 최근 메시지 순회하며 내용 기반 중복 확인
        for (const [existingId, timestamp] of recentMessages.current.entries()) {
          if (now - timestamp < MESSAGE_DEDUPLICATION_WINDOW) {
            if (existingId.startsWith(contentFingerprint)) {
              log(`내용 기반 중복 메시지 감지: ${messageId}`);
              return true;
            }
          }
        }
      }
    } catch (e) {
      console.error("메시지 중복 확인 오류:", e);
    }
    
    // 중복 아니면 메시지 저장
    recentMessages.current.set(
      contentFingerprint ? `${contentFingerprint}:${messageId}` : messageId, 
      now
    );
    
    // 캐시 크기 제한 (100개 이상이면 가장 오래된 것부터 삭제)
    if (recentMessages.current.size > 100) {
      const oldestKey = [...recentMessages.current.entries()]
        .sort(([, a], [, b]) => a - b)[0][0];
      recentMessages.current.delete(oldestKey);
    }
    
    return false;
  }, [log]);

  // 채팅방 구독 (개선된 버전)
  const subscribeToRoom = useCallback(
    (roomId, callback) => {
      // 이미 구독 진행 중이면 중복 호출 방지
      if (subscriptionInProgress.current) {
        log(`구독 진행 중입니다. 대기 필요: ${roomId}`);
        return null;
      }
      
      if (!stompClient.current || !stompClient.current.connected) {
        console.warn("WebSocket이 연결되지 않아 구독할 수 없습니다");
        return null;
      }
      
      // 같은 채팅방이면 구독 생성 안함
      if (lastRoomId.current === roomId && activeRoomSubscription.current) {
        log(`이미 구독 중인 채팅방입니다: ${roomId}`);
        return activeRoomSubscription.current;
      }
      
      subscriptionInProgress.current = true;
      
      // 이전 활성 채팅방 구독 있으면 해제
      if (activeRoomSubscription.current) {
        try {
          log(`이전 채팅방 구독 해제: ${lastRoomId.current}`);
          activeRoomSubscription.current.unsubscribe();
          activeRoomSubscription.current = null;
        } catch (e) {
          console.error("이전 채팅방 구독 해제 오류:", e);
        }
      }
  
      const destination = `/topic/room/${roomId}`;
      log(`새 채팅방 구독: ${destination}`);
      
      try {
        // 새 구독 생성
        const subscription = stompClient.current.subscribe(
          destination,
          (message) => {
            log(`메시지 수신 [${destination}]:`, message);
  
            try {
              const parsedMessage = JSON.parse(message.body);
              
              // 메시지 ID 추출
              const messageId = parsedMessage.id;
              
              // 중복 메시지 확인
              if (isDuplicateMessage(messageId, parsedMessage)) {
                log(`중복 메시지 무시: ${messageId}`);
                return;
              }
              
              // 메시지 처리
              if (callback) {
                callback(parsedMessage);
              }
              
              if (onMessage) {
                onMessage(parsedMessage);
              }
            } catch (e) {
              console.error("메시지 파싱 오류:", e);
            }
          }
        );
  
        // 활성 채팅방 구독 저장
        activeRoomSubscription.current = subscription;
        lastRoomId.current = roomId;
        subscriptionInProgress.current = false;
        
        return subscription;
      } catch (e) {
        console.error(`채팅방 구독 오류:`, e);
        subscriptionInProgress.current = false;
        return null;
      }
    },
    [log, onMessage, isDuplicateMessage]
  );

  // 사용자 알림 구독
  const subscribeToUser = useCallback((userId, callback) => {
    if (!stompClient.current || !stompClient.current.connected) {
      console.warn("WebSocket이 연결되지 않아 구독할 수 없습니다");
      return null;
    }

    const destination = `/user/${userId}/queue/notifications`;
    log(`사용자 알림 구독: ${destination}`);

    // 기존 구독 정리
    if (subscriptions.current[destination]) {
      try {
        subscriptions.current[destination].unsubscribe();
        delete subscriptions.current[destination];
      } catch (e) {
        console.error(`${destination} 구독 해제 오류:`, e);
      }
    }

    try {
      // 새 구독 생성
      const subscription = stompClient.current.subscribe(
        destination,
        (message) => {
          log(`알림 수신:`, message);

          try {
            const parsedMessage = JSON.parse(message.body);
            
            // 메시지 ID 추출
            const messageId = parsedMessage.id;
            
            // 중복 알림 확인
            if (isDuplicateMessage(messageId, parsedMessage)) {
              log(`중복 알림 무시: ${messageId}`);
              return;
            }
            
            if (callback) {
              callback(parsedMessage);
            }
          } catch (e) {
            console.error("알림 파싱 오류:", e);
          }
        }
      );

      // 구독 저장
      subscriptions.current[destination] = subscription;
      return subscription;
    } catch (e) {
      console.error(`${destination} 구독 오류:`, e);
      return null;
    }
  }, [log, isDuplicateMessage]);

  // 구독 취소
  const unsubscribe = useCallback((destination) => {
    if (destination.startsWith('/topic/room/')) {
      // 채팅방 구독 해제는 subscribeToRoom에서 관리
      if (activeRoomSubscription.current) {
        const roomId = destination.replace('/topic/room/', '');
        
        if (lastRoomId.current === roomId) {
          try {
            log(`채팅방 구독 해제: ${roomId}`);
            activeRoomSubscription.current.unsubscribe();
            activeRoomSubscription.current = null;
            lastRoomId.current = null;
            return true;
          } catch (e) {
            console.error(`채팅방 구독 해제 오류:`, e);
            return false;
          }
        }
        return false;
      }
    }
    
    if (!subscriptions.current[destination]) return false;

    try {
      subscriptions.current[destination].unsubscribe();
      delete subscriptions.current[destination];
      return true;
    } catch (e) {
      console.error(`${destination} 구독 해제 오류:`, e);
      return false;
    }
  }, [log]);

  // 메시지 전송
  const sendMessage = useCallback(
    (destination, message) => {
      if (!stompClient.current || !stompClient.current.connected) {
        console.error("커뮤니티 연결이 끊어졌습니다. 다시 시도해주세요.");
        return false;
      }

      try {
        log(`메시지 전송 [${destination}]:`, message);

        // 메시지 ID가 없으면 추가
        if (!message.id) {
          message.id = `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        }
        
        // 전송 전에 중복 메시지로 등록 (자신이 보낸 메시지도 웹소켓으로 돌아오는 경우 대비)
        isDuplicateMessage(message.id, message);

        stompClient.current.publish({
          destination,
          body: JSON.stringify(message),
          headers: {
            Authorization: accessToken ? `Bearer ${accessToken}` : '',
          },
        });

        return true;
      } catch (e) {
        console.error(`메시지 전송 오류 [${destination}]:`, e);
        return false;
      }
    },
    [accessToken, log, isDuplicateMessage]
  );

  // 수동 재연결
  const reconnect = useCallback(() => {
    log("수동 재연결 요청");

    // 카운터 초기화
    connectAttempts.current = 0;

    // 연결 정리 후 재연결
    disconnect();
    setTimeout(connect, 1000);
  }, [connect, disconnect, log]);

  // 메시지 정리 함수 - 오래된 메시지 캐시 정리
  const cleanupMessages = useCallback(() => {
    const now = Date.now();
    const messagesToDelete = [];
    
    recentMessages.current.forEach((timestamp, messageId) => {
      if (now - timestamp > MESSAGE_DEDUPLICATION_WINDOW * 2) {
        messagesToDelete.push(messageId);
      }
    });
    
    messagesToDelete.forEach(messageId => {
      recentMessages.current.delete(messageId);
    });
    
    if (messagesToDelete.length > 0) {
      log(`${messagesToDelete.length}개의 오래된 메시지 캐시를 정리했습니다.`);
    }
  }, [log]);

  // 주기적으로 메시지 캐시 정리
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupMessages, MESSAGE_DEDUPLICATION_WINDOW);
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, [cleanupMessages]);

  useEffect(() => {
    if (accessToken && connectionState === "disconnected") {
      log("최초 연결 시도");
      
      // 디바운스 적용
      const timer = setTimeout(() => {
        connect();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [accessToken, connectionState, connect, log]);

  // beforeunload 이벤트에 대한 처리 추가 - 브라우저 닫기/새로고침 시 정리
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 활성 채팅방 구독 해제
      if (activeRoomSubscription.current && lastRoomId.current) {
        try {
          activeRoomSubscription.current.unsubscribe();
        } catch (e) {
          // 무시
        }
      }
      
      // 다른 구독들도 정리
      Object.values(subscriptions.current).forEach(sub => {
        try {
          sub.unsubscribe();
        } catch (e) {
          // 무시
        }
      });
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 컴포넌트 언마운트 시 연결 해제
  useEffect(() => {
    return () => {
      if (stompClient.current && connectionState === "connected") {
        disconnect();
      }
    };
  }, [disconnect, connectionState]);

  return {
    connect,
    disconnect,
    subscribeToRoom,
    subscribeToUser,
    unsubscribe,
    sendMessage,
    connectionState,
    reconnect,
    isRecentMessage: (messageId) => {
      return messageId && recentMessages.current.has(messageId);
    },
    clearMessageCache: () => {
      recentMessages.current.clear();
      log("메시지 캐시를 초기화했습니다.");
    },
    // 현재 구독 중인 채팅방 ID 반환
    getCurrentRoomId: () => lastRoomId.current
  };
};

export default useWebSocket;