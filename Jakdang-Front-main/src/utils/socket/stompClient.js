import { accessTokenAtom } from '@/jotai/authAtoms';
import { Client } from '@stomp/stompjs';
import { useAtomValue } from 'jotai';
import SockJS from 'sockjs-client';

// STOMP 클라이언트 인스턴스를 싱글톤으로 관리
let stompClient = null;

// 웹소켓 연결 상태 콜백
let onConnectCallbacks = [];
let onDisconnectCallbacks = [];
let onErrorCallbacks = [];

// 구독 관리
const subscriptions = {};

// STOMP 클라이언트 생성 및 설정
export const setupStompClient = (token) => {
  if (stompClient) {
    // 이미 클라이언트가 존재하면 재사용
    return stompClient;
  }

  const socket = new SockJS('http://localhost:19091/ws/chat');
  stompClient = new Client({
    webSocketFactory: () => socket,
    connectHeaders: {
      Authorization: `Bearer ${token}`
    },
    debug: function() {}, // 디버그 로그 비활성화
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000
  });

  stompClient.onConnect = (frame) => {
    console.log('Connected to STOMP');
    onConnectCallbacks.forEach(callback => callback(frame));
  };

  stompClient.onDisconnect = (frame) => {
    console.log('Disconnected from STOMP');
    onDisconnectCallbacks.forEach(callback => callback(frame));
  };

  stompClient.onStompError = (frame) => {
    console.error('STOMP Error:', frame);
    onErrorCallbacks.forEach(callback => callback(frame));
  };

  return stompClient;
};

// 웹소켓 연결
export const connectStomp = (token) => {
  const client = setupStompClient(token);
  if (!client.active) {
    client.activate();
  }
  return client;
};

// 웹소켓 연결 해제
export const disconnectStomp = () => {
  if (stompClient && stompClient.active) {
    stompClient.deactivate();
    stompClient = null;
  }
};

// 메시지 전송
export const sendStompMessage = (destination, body) => {
  if (stompClient && stompClient.active) {
    stompClient.publish({
      destination,
      body: JSON.stringify(body)
    });
  } else {
    console.error('STOMP client not connected');
  }
};

// 채널 구독
export const subscribeTopic = (destination, callback) => {
  if (stompClient && stompClient.active) {
    if (subscriptions[destination]) {
      console.log(`Already subscribed to ${destination}`);
      return;
    }

    const subscription = stompClient.subscribe(destination, (message) => {
      const parsedBody = JSON.parse(message.body);
      callback(parsedBody);
    });

    subscriptions[destination] = subscription;
    return subscription;
  } else {
    console.error('STOMP client not connected');
    return null;
  }
};

// 구독 해제
export const unsubscribeTopic = (destination) => {
  if (subscriptions[destination]) {
    subscriptions[destination].unsubscribe();
    delete subscriptions[destination];
  }
};

// 연결 이벤트 리스너 설정
export const onConnect = (callback) => {
  onConnectCallbacks.push(callback);
  if (stompClient && stompClient.active) {
    callback();
  }
};

// 연결 해제 이벤트 리스너 설정
export const onDisconnect = (callback) => {
  onDisconnectCallbacks.push(callback);
};

// 에러 이벤트 리스너 설정
export const onError = (callback) => {
  onErrorCallbacks.push(callback);
};

// React 훅을 사용하여 STOMP 클라이언트를 제공하는 커스텀 훅
export const useStompClient = () => {
  const accessToken = useAtomValue(accessTokenAtom);
  
  return {
    connect: () => connectStomp(accessToken),
    disconnect: disconnectStomp,
    sendMessage: sendStompMessage,
    subscribe: subscribeTopic,
    unsubscribe: unsubscribeTopic,
    onConnect,
    onDisconnect,
    onError
  };
};