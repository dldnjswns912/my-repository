"use client";

// useChatService.js - 구독 관리 단순화

import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import { useStomp } from "@/hooks/useStomp";
import { userInfoAtom } from "@/jotai/authAtoms";
import {
  activeCategoryAtom,
  activeChatRoomAtom,
  chatRoomsAtom,
  errorAtom,
  isLoadingMessagesAtom,
  loadingAtom,
  messagesAtom,
  unreadCountsAtom,
} from "@/jotai/chatAtoms";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useRef, useMemo } from "react";

export const useChatService = (userId) => {
  const { fetchGet, fetchPost, fetchDelete, fetchPut } = useAxiosQuery();
  const { connected, subscribe, unsubscribe, send, removeCallback } =
    useStomp();
  const userInfo = useAtomValue(userInfoAtom);
  const [roomList, setRoomList] = useAtom(chatRoomsAtom);
  const [activeRoom, setActiveRoom] = useAtom(activeChatRoomAtom);
  const [activeCategory, setActiveCategory] = useAtom(activeCategoryAtom);
  const [messages, setMessages] = useAtom(messagesAtom);
  const [unreadCounts, setUnreadCounts] = useAtom(unreadCountsAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [isLoadingMessages, setIsLoadingMessages] = useAtom(
    isLoadingMessagesAtom
  );
  const [error, setError] = useAtom(errorAtom);

  // 구독 관리를 위한 refs - 단순화
  const userQueueRef = useRef(null);
  const readStatusQueueRef = useRef(null);
  const activeRoomTopicRef = useRef(null);

  // API 요청 중복 방지를 위한 참조
  const isLoadingRef = useRef(false);

  // 처리된 메시지 ID 세트 - 중복 메시지 처리 방지
  const processedMessageIdsRef = useRef(new Set());  // 채팅방 목록 조회
  const fetchRoomList = useCallback(async () => {
    console.log('fetchRoomList 호출:', { userId, isLoading: isLoadingRef.current });
    
    // 이미 로딩 중이면 중복 요청 방지
    if (isLoadingRef.current || !userId) {
      console.log('fetchRoomList 스킵:', { isLoading: isLoadingRef.current, userId });
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);

    try {
      console.log('채팅방 목록 API 요청 시작');
      const result = await fetchGet("/chat/room");
      
      console.log('채팅방 목록 API 응답:', result);
      
      if (result && result.data) {
        console.log("채팅방 목록 조회 결과:", result.data);
        setRoomList(result.data);
      } else {
        console.warn('채팅방 목록이 비어있음');
        setRoomList([]);
      }
    } catch (err) {
      console.error("채팅방 목록 조회 실패:", err);
      setError(`채팅방 목록 조회 실패: ${err.message}`);
      setRoomList([]); // 오류 시에도 빈 배열로 설정
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
      console.log('fetchRoomList 완료');
    }
  }, [userId, fetchGet, setRoomList, setLoading, setError]);
  // 컴포넌트 마운트 시 채팅방 목록 조회 - 의존성 배열에서 fetchRoomList 제거
  useEffect(() => {
    let isMounted = true;

    if (userId && isMounted && !window.roomListLoaded) {
      window.roomListLoaded = true;
      // fetchRoomList(); // 자동 로드 비활성화 (수동으로 호출)
    }

    return () => {
      isMounted = false;
    };
  }, [userId]); // fetchRoomList 제거

  const updateRoom = useCallback(
    async (roomId, name, desc) => {
      if (!roomId || !userId) return null;

      setLoading(true);

      try {
        const result = await fetchPut(`/chat/room`, {
          roomId: roomId,
          userId: userId,
          name: name,
          description: desc,
        });

        if (result && result.result) {
          await fetchRoomList();
          return result.response.data;
        } else {
          throw new Error(result.response?.message || "채팅방 수정 실패");
        }
      } catch (err) {
        setError(`채팅방 수정 실패: ${err.message}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId, fetchPost, fetchRoomList, setLoading, setError]
  );

  // 채팅방 생성
  const createRoom = useCallback(
    async (name, type) => {
      if (!userId) return null;

      setLoading(true);
      try {
        const result = await fetchPost("/chat/room", {
          name,
          type,
          creatorId: userId,
          nickname: userInfo?.nickname || userInfo?.email,
        });

        if (result && result.result) {
          await fetchRoomList();
          return result.response.data;
        } else {
          throw new Error(result.response?.message || "채팅방 생성 실패");
        }
      } catch (err) {
        setError(`채팅방 생성 실패: ${err.message}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId, fetchPost, fetchRoomList, setLoading, setError]
  );
  // 채팅방 정보 조회
  const getChatRoom = useCallback(
    async (roomId) => {
      if (!roomId) return null;

      setLoading(true);
      try {
        console.log(`getChatRoom 호출: ${roomId}`);
        const result = await fetchGet(`/chat/room/${roomId}`);
        console.log(`getChatRoom API 응답:`, result);
        
        if (result && result.data) {
          console.log(`채팅방 상세 정보:`, {
            id: result.data.id,
            name: result.data.name,
            type: result.data.type,
            members: result.data.members,
            membersCount: result.data.members?.length,
            participants: result.data.participants,
            participantsCount: result.data.participants?.length
          });
          return result.data;
        } else {
          throw new Error("채팅방 정보를 가져올 수 없습니다.");
        }
      } catch (err) {
        console.error(`getChatRoom 오류:`, err);
        setError(`채팅방 정보 조회 실패: ${err.message}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchGet, setLoading, setError]
  );

  // 읽지 않은 메시지 수 조회
  const getUnreadCount = useCallback(
    async (roomId) => {
      if (!userId) return 0;

      try {
        const result = await fetchGet("/chat/unread", { roomId });
        if (result && result.data) {
          setUnreadCounts((prev) => ({
            ...prev,
            [roomId]: result.data.count,
          }));
          return result.data;
        }
        return 0;
      } catch (err) {
        //console.error(`읽지 않은 메시지 수 조회 실패: ${err.message}`)
        return 0;
      }    },
    [userId, fetchGet, setUnreadCounts]
  );

  // 기존 1:1 채팅방 찾기
  const findExistingDirectRoom = useCallback(
    async (targetUserId) => {
      if (!userId || !targetUserId) return null;

      try {
        // 모든 채팅방 목록에서 1:1 채팅방 찾기
        if (!roomList || roomList.length === 0) {
          await fetchRoomList();
        }

        const currentRoomList = roomList;
          // 1:1 채팅방이면서 해당 사용자와의 채팅방 찾기
        const existingRoom = currentRoomList.find(room => {
          // 1:1 채팅방 조건: type이 'INDIVIDUAL'이고 멤버가 정확히 2명
          const isIndividualType = room.type === 'INDIVIDUAL';
          const hasExactlyTwoMembers = room.members?.length === 2;
          
          if (!isIndividualType || !hasExactlyTwoMembers) return false;

          // 멤버 목록에서 현재 사용자와 대상 사용자가 모두 포함되어 있는지 확인
          const memberIds = room.members?.map(member => member.userId || member.id) || [];
          return memberIds.includes(String(userId)) && memberIds.includes(String(targetUserId));
        });

        return existingRoom || null;
      } catch (err) {
        console.error('기존 1:1 채팅방 찾기 실패:', err);
        return null;
      }
    },
    [userId, roomList, fetchRoomList]
  );
  // 기존 1:1 채팅방이 있으면 재사용하고 없으면 새로 생성
  const createOrFindDirectRoom = useCallback(
    async (targetUser) => {
      console.log('createOrFindDirectRoom 호출:', { userId, targetUser });
      
      if (!userId || !targetUser?.id) {
        console.error('createOrFindDirectRoom: userId 또는 targetUser.id가 없습니다.', {
          userId,
          targetUser,
          userInfo
        });
        return { room: null, isNewRoom: false };
      }

      try {
        // 먼저 기존 1:1 채팅방 찾기
        const existingRoom = await findExistingDirectRoom(targetUser.id);
        
        if (existingRoom) {
          console.log('기존 1:1 채팅방 발견:', existingRoom);
          return { room: existingRoom, isNewRoom: false };
        }

        // 기존 채팅방이 없으면 새로 생성
        console.log('새 1:1 채팅방 생성:', targetUser);
        const roomName = `${userInfo?.nickname || userInfo?.email} & ${targetUser.nickname || targetUser.email}`;
        
        const newRoom = await createRoom(roomName, 'INDIVIDUAL');
        
        if (!newRoom) {
          throw new Error('새 채팅방 생성 실패');
        }        // 대상 사용자를 채팅방에 초대
        try {
          const inviteResult = await fetchPost("/chat/room/invite", [
            {
              roomId: newRoom.id,
              userId: userId,
              targetUserId: targetUser.id,
              nickname: targetUser.nickname,
            },
          ]);
          
          if (!inviteResult || !inviteResult.result) {
            console.warn('사용자 초대 실패, 하지만 채팅방은 생성됨');
          }
        } catch (inviteErr) {
          console.warn('사용자 초대 실패:', inviteErr);
        }
        
        // 채팅방 목록 새로고침
        await fetchRoomList();
        
        return { room: newRoom, isNewRoom: true };
      } catch (err) {
        console.error('1:1 채팅방 생성/찾기 실패:', err);
        setError(`1:1 채팅방 생성/찾기 실패: ${err.message}`);
        return { room: null, isNewRoom: false };
      }
    },
    [userId, userInfo, findExistingDirectRoom, createRoom, fetchPost, fetchRoomList, setError]
  );

  // 메시지 핸들러 - 커스텀 이벤트로 전달
  const handleRoomMessage = useCallback(
    (data) => {
      if (!data) {
        console.warn("수신된 데이터가 없음");
        return;
      }

      if (!data.data) {
        console.warn("유효하지 않은 메시지 데이터:", data);
        return;
      }

      const messageData = data.data;
      console.log("채팅방 메시지 수신 (상세):", {
        action: data.action,
        messageId: messageData.id,
        content: messageData.content?.substring(0, 30),
        roomId: messageData.roomId,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
      });

      // 커스텀 이벤트로 메시지 전달
      const messageEvent = new CustomEvent("websocketMessage", {
        detail: {
          action: data.action,
          data: messageData,
        },
      });
      window.dispatchEvent(messageEvent);

      // 읽음 처리는 여기서 계속 수행
      if (data.action.toUpperCase() === "MARK_READ") {
        console.log(`읽음 처리 (roomId: ${messageData.roomId})`);
        getUnreadCount(activeRoom?.id);
      }
    },
    [activeRoom?.id, getUnreadCount]
  );
  // 채팅방 활성화 및 메시지 로드 - 단순화된 버전
  const selectRoom = useCallback(
    async (roomId) => {
      if (!userId) return false;

      try {
        // roomId가 null이면 채팅방에서 나가기
        if (!roomId) {
          console.log('채팅방에서 나가기');
          
          // 이전 구독이 있으면 해제
          if (activeRoomTopicRef.current) {
            console.log(`채팅방 구독 해제: ${activeRoomTopicRef.current}`);
            removeCallback(activeRoomTopicRef.current, null);
            unsubscribe(activeRoomTopicRef.current);
            activeRoomTopicRef.current = null;
          }
          
          // 상태 초기화
          setActiveRoom(null);
          setMessages([]);
          setIsLoadingMessages(false);
          return true;
        }

        // 카테고리 선택 해제 (채팅방과 카테고리는 동시에 활성화되지 않음)
        setActiveCategory(null);
        // 메시지 로딩 상태 활성화
        setIsLoadingMessages(true);

        // 이전 구독이 있으면 해제
        if (activeRoomTopicRef.current) {
          console.log(`이전 채팅방 구독 해제: ${activeRoomTopicRef.current}`);
          removeCallback(activeRoomTopicRef.current, null);
          unsubscribe(activeRoomTopicRef.current);
          activeRoomTopicRef.current = null;
        }
        setMessages([]);

        // 채팅방 정보 로드
        const roomData = await getChatRoom(roomId);
        if (roomData) {
          console.log(`채팅방 ${roomId} 선택됨:`, roomData);
          setActiveRoom(roomData);

          // 읽지 않은 메시지 수 조회
          await getUnreadCount(roomId);

          // 메시지 읽음 처리
          if (connected) {
            send("/app/send.read", {
              roomId,
              senderId: userId,
            });
          }

          // 채팅방 구독 (1회만)
          if (connected) {
            const roomTopic = `/topic/chat/${roomId}`;
            console.log(`채팅방 구독 시도: ${roomTopic}`);

            const subscription = subscribe(roomTopic, handleRoomMessage);
            if (subscription) {
              activeRoomTopicRef.current = roomTopic;
              console.log(`채팅방 ${roomId} 구독 성공`);
            }
          }

          return true;
        }

        // 채팅방 로드 실패 시 메시지 로딩 상태 해제
        setIsLoadingMessages(false);
        return false;
      } catch (err) {
        console.error(`채팅방 선택 실패: ${err.message}`, err);
        setError(`채팅방 선택 실패: ${err.message}`);
        setIsLoadingMessages(false); // 오류 발생 시에도 로딩 상태 해제
        return false;
      }
    },
    [
      userId,
      connected,
      getChatRoom,
      getUnreadCount,
      send,
      subscribe,
      unsubscribe,
      handleRoomMessage,
      setActiveRoom,
      setActiveCategory,
      setIsLoadingMessages,
      setError,
      setMessages,
    ]
  );

  // 파일메시지 전송
  const sendWithFileMessage = useCallback(
    (content, attachments) => {
      if (!activeRoom || !userId) return false;

      // 연결 상태 확인만 하고 재연결 시도하지 않음
      if (!connected) {
        console.error("웹소켓 연결이 없어 메시지를 전송할 수 없습니다.");
        return false;
      }

      const messageData = {
        roomId: activeRoom.id,
        senderId: userId,
        content,
        roomType: activeRoom.type,
        sentAt: new Date().toISOString(),
        senderName: userInfo?.nickname || userInfo?.email,
        attachments: attachments,
      };

      console.log("파일 메시지 전송:", messageData);

      // 메시지를 UI에 즉시 추가 (낙관적 UI 업데이트) - 커스텀 이벤트로 전달
      const tempId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      const tempMessage = {
        ...messageData,
        id: tempId,
        senderName: userInfo.nickname,
        isTemp: true, // 임시 메시지 표시
      };

      // 커스텀 이벤트로 임시 메시지 전달
      const tempMessageEvent = new CustomEvent("websocketMessage", {
        detail: {
          action: "SEND",
          data: tempMessage,
        },
      });
      window.dispatchEvent(tempMessageEvent);

      // 실제 메시지 전송
      return send("/app/send.message", messageData);
    },
    [userId, connected, activeRoom, send, userInfo?.nickname, userInfo?.email]
  );

  // 메시지 전송
  const sendMessage = useCallback(
    (content, replyId, replyContent) => {
      if (!activeRoom || !userId) return false;

      // 연결 상태 확인만 하고 재연결 시도하지 않음
      if (!connected) {
        console.error("웹소켓 연결이 없어 메시지를 전송할 수 없습니다.");
        return false;
      }

      const messageData = {
        roomId: activeRoom.id,
        senderId: userId,
        content,
        roomType: activeRoom.type,
        sentAt: new Date().toISOString(),
        senderName: userInfo?.nickname || userInfo?.email,
        replyTo: replyId || null,
        replyMessage: replyContent || null,
      };      console.log("메시지 전송:", messageData);
      console.log("replyId:", replyId);
      console.log("replyContent:", replyContent);
      
      // 현재 사용자 정보와 전송하는 메시지의 senderId 비교
      console.log("[메시지 전송] 사용자 정보 확인:", {
        현재사용자ID: userInfo?.userId || userInfo?.id,
        메시지발신자ID: messageData.senderId,
        일치여부: (userInfo?.userId || userInfo?.id) === messageData.senderId
      });

      // 메시지를 UI에 즉시 추가 (낙관적 UI 업데이트) - 커스텀 이벤트로 전달
      const tempId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      const tempMessage = {
        ...messageData,
        id: tempId,
        senderName: userInfo.nickname,
        isTemp: true, // 임시 메시지 표시
      };

      // 커스텀 이벤트로 임시 메시지 전달
      const tempMessageEvent = new CustomEvent("websocketMessage", {
        detail: {
          action: "SEND",
          data: tempMessage,
        },
      });
      window.dispatchEvent(tempMessageEvent);

      // 실제 메시지 전송
      return send("/app/send.message", messageData);
    },
    [userId, connected, activeRoom, send, userInfo?.nickname, userInfo?.email]
  );

  // 메시지 삭제
  const deleteMessage = useCallback(
    (messageId) => {
      if (!activeRoom || !connected || !userId || !messageId) return false;

      const messageData = {
        id: messageId,
        roomId: activeRoom.id,
        senderId: userId,
      };

      console.log("메시지 삭제:", messageData);

      // 낙관적 UI 업데이트 - 커스텀 이벤트로 전달
      const deleteEvent = new CustomEvent("websocketMessage", {
        detail: {
          action: "DELETE",
          data: {
            id: messageId,
            roomId: activeRoom.id,
            deletedAt: new Date().toISOString(),
          },
        },
      });
      window.dispatchEvent(deleteEvent);

      return send("/app/send.delete", messageData);
    },
    [userId, connected, activeRoom, send]
  );

  // 메시지 수정
  const editMessage = useCallback(
    (messageId, content) => {
      if (!activeRoom || !connected || !userId || !messageId) return false;

      const messageData = {
        id: messageId,
        roomId: activeRoom.id,
        senderId: userId,
        content,
      };

      console.log("메시지 수정:", messageData);

      // 낙관적 UI 업데이트 - 커스텀 이벤트로 전달
      const editEvent = new CustomEvent("websocketMessage", {
        detail: {
          action: "EDIT",
          data: {
            id: messageId,
            roomId: activeRoom.id,
            content: content,
          },
        },
      });
      window.dispatchEvent(editEvent);

      return send("/app/send.edit", messageData);
    },
    [userId, connected, activeRoom, send]
  );

  const inviteToRoomMembers = useCallback(
    async (request) => {
      if (!request || !userId) return false;

      setLoading(true);
      try {
        const result = await fetchPost("/chat/room/invite", request);

        if (result && result.result) {
          await fetchRoomList();
          return result.response.data;
        }
        return false;
      } catch (err) {
        setError(`초대 실패: ${err.message}`);
        return false;
      }
    },
    [userId, fetchPost, setLoading, setError, fetchRoomList]
  );

  // 채팅방 초대
  const inviteToRoom = useCallback(
    async (roomId, targetUserId, nickname) => {
      if (!roomId || !userId || !targetUserId) return false;

      setLoading(true);
      try {
        const result = await fetchPost("/chat/room/invite", [
          {
            roomId,
            userId,
            targetUserId,
            nickname,
          },
        ]);

        if (result && result.result) {
          await fetchRoomList();
          return result.response.data;
        }
        return false;
      } catch (err) {
        setError(`초대 실패: ${err.message}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [userId, fetchPost, setLoading, setError, fetchRoomList]
  );

  // 채팅방 나가기 - 함수형 프로그래밍 스타일로 개선
  const leaveRoom = useCallback(
    async (roomId) => {
      if (!roomId || !userId) return false;

      setLoading(true);

      const cleanupSubscription = () => {
        if (activeRoomTopicRef.current) {
          // 메시지 핸들러 콜백 제거 후 구독 해제
          removeCallback(activeRoomTopicRef.current, handleRoomMessage);
          unsubscribe(activeRoomTopicRef.current);
          activeRoomTopicRef.current = null;
        }
      };

      const processLeaveResult = (result) =>
        result.result
          ? Promise.resolve(fetchRoomList()).then(() => {
              if (activeRoom && activeRoom.id === result.response.data.id) {
                setActiveRoom(null);
                setMessages([]);
              }
              return true;
            })
          : false;

      try {
        // 구독 정리
        cleanupSubscription();

        // 서버에 나가기 요청
        const result = await fetchPost("/chat/room/leave", { roomId, userId });
        return processLeaveResult(result);
      } catch (err) {
        setError(`채팅방 나가기 실패: ${err.message}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [
      userId,
      activeRoom,
      fetchPost,
      fetchRoomList,
      unsubscribe,
      removeCallback,
      handleRoomMessage,
      setLoading,
      setError,
      setActiveRoom,
      setMessages,
    ]
  );

  // 웹소켓 구독 설정 - 사용자 큐, 읽음 상태 큐 (앱 시작 시 1회만)
  useEffect(() => {
    // 이미 구독이 설정되어 있거나 연결되지 않은 경우 무시
    if (
      !connected ||
      !userId ||
      userQueueRef.current ||
      readStatusQueueRef.current
    )
      return;

    console.log("웹소켓 기본 구독 설정...");

    // 사용자 큐 구독
    const userQueue = `/user/${userId}/queue/chat-room-updates`;
    console.log(`사용자 큐 구독: ${userQueue}`);
    const handleUserQueueMessage = (data) => {
      if (!data || !data.action) {
        console.warn("사용자 큐: 유효하지 않은 메시지 데이터", data);
        return;
      }

      console.log("사용자 큐 메시지 수신:", data);

      // 채팅방 업데이트 처리
      if (
        data.action === "UPDATE" ||
        data.action === "JOIN" ||
        data.action === "LEAVE"
      ) {
        fetchRoomList();
      }
    };

    const subscription = subscribe(userQueue, handleUserQueueMessage);
    userQueueRef.current = userQueue;

    // 읽음 상태 구독
    const readStatusQueue = `/user/${userId}/queue/read-status`;
    console.log(`읽음 상태 구독: ${readStatusQueue}`);
    const handleReadStatusMessage = (data) => {
      if (!data || !data.data) {
        console.warn("읽음 상태 큐: 유효하지 않은 메시지 데이터", data);
        return;
      }

      console.log("읽음 상태 메시지 수신:", data);

      setUnreadCounts((prev) => ({
        ...prev,
        [data.data.roomId]: data.data.count,
      }));
    };

    const readSubscription = subscribe(
      readStatusQueue,
      handleReadStatusMessage
    );
    readStatusQueueRef.current = readStatusQueue;

    // 컴포넌트 언마운트 시 구독 정리
    return () => {
      console.log("기본 구독 정리");

      if (userQueueRef.current) {
        console.log(`사용자 큐 구독 해제: ${userQueueRef.current}`);
        unsubscribe(userQueueRef.current);
        userQueueRef.current = null;
      }

      if (readStatusQueueRef.current) {
        console.log(`읽음 상태 구독 해제: ${readStatusQueueRef.current}`);
        unsubscribe(readStatusQueueRef.current);
        readStatusQueueRef.current = null;
      }
    };
  }, [
    connected,
    userId,
    subscribe,
    unsubscribe,
    fetchRoomList,
    setUnreadCounts,
  ]); // 의존성 배열 최소화

  // 컴포넌트 언마운트 시 모든 구독 정리
  useEffect(() => {
    return () => {
      console.log("컴포넌트 언마운트 시 모든 구독 정리");

      // 활성 채팅방 구독 해제
      if (activeRoomTopicRef.current) {
        console.log(
          `언마운트 시 채팅방 구독 해제: ${activeRoomTopicRef.current}`
        );
        unsubscribe(activeRoomTopicRef.current);
        activeRoomTopicRef.current = null;
      }

      // 기본 구독 해제
      if (userQueueRef.current) {
        console.log(`언마운트 시 사용자 큐 구독 해제: ${userQueueRef.current}`);
        unsubscribe(userQueueRef.current);
        userQueueRef.current = null;
      }

      if (readStatusQueueRef.current) {
        console.log(
          `언마운트 시 읽음 상태 구독 해제: ${readStatusQueueRef.current}`
        );
        unsubscribe(readStatusQueueRef.current);
        readStatusQueueRef.current = null;
      }
    };
  }, [unsubscribe]);
  // 반환 객체를 useMemo로 메모이제이션하여 무한루프 방지
  return useMemo(() => ({
    roomList,
    activeRoom,
    messages,
    unreadCounts,
    loading,
    isLoadingMessages,
    error,

    // 채팅방 관련 메서드
    createRoom,
    selectRoom,
    updateRoom,

    // 메시지 관련 메서드
    sendMessage,
    sendWithFileMessage,
    deleteMessage,
    editMessage,
    getUnreadCount,    // 사용자 관련 메서드
    inviteToRoom,
    inviteToRoomMembers,
    leaveRoom,
    fetchRoomList,
    findExistingDirectRoom,
    createOrFindDirectRoom,
  }), [
    roomList,
    activeRoom,
    messages,
    unreadCounts,
    loading,
    isLoadingMessages,
    error,
    createRoom,
    selectRoom,
    updateRoom,
    sendMessage,
    sendWithFileMessage,
    deleteMessage,
    editMessage,
    getUnreadCount,
    inviteToRoom,
    inviteToRoomMembers,
    leaveRoom,
    fetchRoomList,
    findExistingDirectRoom,
    createOrFindDirectRoom,
  ]);
};
