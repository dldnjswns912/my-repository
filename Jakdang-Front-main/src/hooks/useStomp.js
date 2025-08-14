"use client";

import { accessTokenAtom } from "@/jotai/authAtoms";
import { stompConnectedAtom, stompErrorAtom } from "@/jotai/chatAtoms";
import { Client } from "@stomp/stompjs";
import { useAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import SockJS from "sockjs-client";

let stompClient = null;
const subscriptions = {};
let isConnecting = false;
let isInitialized = false;

const activeSubscriptionIds = new Map();
const pendingSubscriptions = new Map();

export const useStomp = () => {
  const [accessToken] = useAtom(accessTokenAtom);
  const [connected, setConnected] = useAtom(stompConnectedAtom);
  const [error, setError] = useAtom(stompErrorAtom);
  const initRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);

  const logDebug = (message, data) => {
    console.log(`[STOMP] ${message}`, data || "");
  };  const connectStomp = useCallback(() => {
    if (isConnecting || (stompClient && stompClient.connected)) return;
    if (!accessToken) return;    try {
      isConnecting = true;
      logDebug("연결 시도 중...");
      
      // 토큰 정제 - 따옴표 제거 및 Bearer 확인
      let cleanToken = accessToken;
      if (typeof cleanToken === 'string') {
        // 앞뒤 따옴표 제거
        cleanToken = cleanToken.replace(/^["']|["']$/g, '');
        // 이스케이프된 따옴표 제거
        cleanToken = cleanToken.replace(/\\["']/g, '');
        
        // Bearer가 없으면 추가
        if (!cleanToken.startsWith('Bearer ')) {
          cleanToken = `Bearer ${cleanToken}`;
        }
      }
      
      console.log("[STOMP] 토큰 정제:", {
        원본: accessToken?.substring(0, 30) + "...",
        정제후: cleanToken?.substring(0, 30) + "...",
        길이: cleanToken?.length
      });

      if (stompClient) {
        try {
          stompClient.deactivate();
          logDebug("기존 클라이언트 정리");
        } catch (e) {
          console.warn("기존 클라이언트 정리 중 오류:", e);
        }
      }

      const socket = new SockJS(import.meta.env.VITE_BASE_API_URL + "/ws/chat");
      stompClient = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          Authorization: cleanToken,
        },
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        reconnectDelay: 5000,
        debug: (msg) => {
          if (msg.includes("error") || msg.includes("failed")) {
            console.error("STOMP:", msg);
          }
        },
      });      stompClient.onConnect = () => {
        logDebug("연결 성공");
        isConnecting = false;
        isInitialized = true;
        setConnected(true);
        setError(null);

        // 토큰에서 사용자 정보 추출해서 로그 출력
        try {
          const tokenPart = cleanToken.replace('Bearer ', '');
          const payload = JSON.parse(atob(tokenPart.split('.')[1]));
          console.log("[STOMP] 연결된 토큰의 사용자 정보:", {
            userId: payload.userId,
            username: payload.username,
            email: payload.email
          });
        } catch (e) {
          console.warn("[STOMP] 토큰 파싱 실패:", e);
        }

        Object.keys(subscriptions).forEach((destination) => {
          const callbacks = subscriptions[destination].callbacks;
          if (callbacks && callbacks.size > 0) {
            const subscription = stompClient.subscribe(
              destination,
              (message) => {
                for (const cb of callbacks) {
                  try {
                    const parsedBody = JSON.parse(message.body);
                    cb(parsedBody);
                  } catch (err) {
                    cb(message.body);
                  }
                }
              }
            );
            subscriptions[destination].subscription = subscription;
            activeSubscriptionIds.set(destination, subscription.id);
          }
        });

        pendingSubscriptions.forEach((callbacks, destination) => {
          if (callbacks.size > 0) {
            const subscription = stompClient.subscribe(
              destination,
              (message) => {
                for (const cb of callbacks) {
                  try {
                    const parsedBody = JSON.parse(message.body);
                    cb(parsedBody);
                  } catch (err) {
                    cb(message.body);
                  }
                }
              }
            );
            if (!subscriptions[destination]) {
              subscriptions[destination] = {
                subscription: null,
                callbacks: new Set(),
              };
            }
            callbacks.forEach((cb) =>
              subscriptions[destination].callbacks.add(cb)
            );
            subscriptions[destination].subscription = subscription;
            activeSubscriptionIds.set(destination, subscription.id);
          }
        });
        pendingSubscriptions.clear();
      };      stompClient.onStompError = (frame) => {
        console.error("STOMP 에러:", frame);
        console.error("STOMP 에러 헤더:", frame.headers);
        console.error("STOMP 에러 본문:", frame.body);
        
        isConnecting = false;
        setError(`STOMP 에러: ${frame.headers["message"] || "알 수 없는 오류"}`);
        
        // 인증 오류인 경우 토큰 갱신 시도
        if (frame.headers["message"]?.includes("Unauthorized") || 
            frame.headers["message"]?.includes("401") ||
            frame.headers["message"]?.includes("Authentication")) {
          console.log("[STOMP] 인증 오류 감지, 토큰 갱신 필요");
          // 여기서 토큰 갱신 로직을 호출할 수 있습니다
        }
      };

      stompClient.onWebSocketClose = () => {
        logDebug("웹소켓 연결 종료");
        isConnecting = false;
        setConnected(false);
        Object.keys(subscriptions).forEach((destination) => {
          if (subscriptions[destination].subscription) {
            subscriptions[destination].subscription = null;
            activeSubscriptionIds.delete(destination);
          }
        });
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!stompClient.connected && !isConnecting) {
            connectStomp();
          }
        }, 3000);
      };

      stompClient.activate();
    } catch (err) {
      console.error("STOMP 연결 에러:", err);
      isConnecting = false;
      setError(`연결 에러: ${err.message}`);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!stompClient || (!stompClient.connected && !isConnecting)) {
          connectStomp();
        }
      }, 5000);
    }
  }, [accessToken, setConnected, setError]);

  useEffect(() => {
    if (isInitialized || initRef.current) return;
    if (!accessToken) return;
    initRef.current = true;
    if (!stompClient || !stompClient.connected) {
      connectStomp();
    }
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [accessToken, connectStomp]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (stompClient && stompClient.connected) {
        stompClient.deactivate();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const subscribe = useCallback(
    (destination, callback) => {
      if (!subscriptions[destination]) {
        subscriptions[destination] = {
          subscription: null,
          callbacks: new Set(),
        };
      }

      subscriptions[destination].callbacks.add(callback);

      if (activeSubscriptionIds.has(destination)) {
        return destination;
      }

      if (stompClient && stompClient.connected) {
        const subscription = stompClient.subscribe(destination, (message) => {
          for (const cb of subscriptions[destination].callbacks) {
            try {
              const parsed = JSON.parse(message.body);
              cb(parsed);
            } catch (err) {
              cb(message.body);
            }
          }
        });
        subscriptions[destination].subscription = subscription;
        activeSubscriptionIds.set(destination, subscription.id);
        return destination;
      } else {
        if (!pendingSubscriptions.has(destination)) {
          pendingSubscriptions.set(destination, new Set());
        }
        pendingSubscriptions.get(destination).add(callback);
        connectStomp();
        return null;
      }
    },
    [connectStomp]
  );

  const unsubscribe = useCallback((destination) => {
    if (!destination || !subscriptions[destination]) return false;

    const subInfo = subscriptions[destination];
    if (subInfo.callbacks.size === 0 && subInfo.subscription) {
      subInfo.subscription.unsubscribe();
      subInfo.subscription = null;
      activeSubscriptionIds.delete(destination);
      return true;
    }
    return false;
  }, []);

  const send = useCallback((destination, body) => {
    if (!stompClient || !stompClient.connected) return false;
    try {
      const payload = typeof body === "string" ? body : JSON.stringify(body);
      stompClient.publish({ destination, body: payload });
      return true;
    } catch (err) {
      return false;
    }
  }, []);
  const checkConnection = useCallback(() => {
    return stompClient && stompClient.connected;
  }, []);

  const disconnect = useCallback(() => {
    if (stompClient && stompClient.connected) {
      try {
        stompClient.deactivate();
        setConnected(false);
        logDebug("연결 해제됨");
      } catch (error) {
        console.error("연결 해제 중 오류:", error);
      }
    }
  }, [setConnected]);

  const addCallback = useCallback((destination, callback) => {
    if (!subscriptions[destination]) {
      subscriptions[destination] = {
        subscription: null,
        callbacks: new Set(),
      };
    }
    const added = !subscriptions[destination].callbacks.has(callback);
    subscriptions[destination].callbacks.add(callback);
    return added;
  }, []);

  const removeCallback = useCallback(
    (destination, callback) => {
      if (!subscriptions[destination]) return false;
      if (callback) {
        const removed = subscriptions[destination].callbacks.delete(callback);
        if (subscriptions[destination].callbacks.size === 0) {
          unsubscribe(destination);
        }
        return removed;
      } else {
        subscriptions[destination].callbacks.clear();
        unsubscribe(destination);
        return true;
      }
    },
    [unsubscribe]
  );  return {
    connect: connectStomp,
    disconnect,
    connected,
    error,
    subscribe,
    unsubscribe,
    send,
    checkConnection,
    addCallback,
    removeCallback,
  };
};
