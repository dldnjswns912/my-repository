"use client";

// useDiscordService.js - 구독 관리 단순화

import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import { useStomp } from "@/hooks/useStomp";
import { userInfoAtom } from "@/jotai/authAtoms";
import {
  activeCategoryAtom,
  activeChannelAtom,
  discordChannelsAtom,
  errorAtom,
  isLoadingMessagesAtom,
  loadingAtom,
  messagesAtom,
  serversAtom,
} from "@/jotai/chatAtoms";
import { RoomType } from "@/utils/constant/constants";
import { formatRelativeTime } from "@/utils/formatDate";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useRef } from "react";

export const useDiscordService = (userId) => {
  const { fetchGet, fetchPost, fetchDelete, fetchPut } = useAxiosQuery();
  const { connected, subscribe, unsubscribe, send, removeCallback } =
    useStomp();

  const [channels, setChannels] = useAtom(discordChannelsAtom);
  const [servers, setServers] = useAtom(serversAtom);
  const [activeChannel, setActiveChannel] = useAtom(activeChannelAtom);
  const [activeCategory, setActiveCategory] = useAtom(activeCategoryAtom);
  const [messages, setMessages] = useAtom(messagesAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [isLoadingMessages, setIsLoadingMessages] = useAtom(
    isLoadingMessagesAtom
  );
  const [error, setError] = useAtom(errorAtom);

  const userInfo = useAtomValue(userInfoAtom);

  const discordQueueRef = useRef(null);
  const activeCategoryTopicRef = useRef(null);
  const isLoadingRef = useRef(false);

  // 처리된 메시지 ID 세트 - 중복 메시지 처리 방지
  const processedMessageIdsRef = useRef(new Set());

  const fetchDiscordData = useCallback(async () => {
    if (isLoadingRef.current || !userId) return;

    isLoadingRef.current = true;
    setLoading(true);

    try {
      const result = await fetchGet("/chat/discord/channel/individual");
      if (result?.data) {
        const serverList = result.data.map((server) => ({
          id: server.id,
          name: server.name,
          description: server.description,
          adminId: server.adminId,
          icon: server.name.charAt(0).toUpperCase(),
          imageRequest: server.imageRequest,
        }));

        const serverListWithHome = [
          { id: "home", name: "홈", icon: "🏠" },
          ...serverList,
        ];

        setServers(serverListWithHome);
        setChannels(result.data);
        return {
          servers: serverListWithHome,
          channels: result.data,
        };
      }
    } catch (err) {
      console.error(`디스코드 데이터 조회 실패: ${err.message}`, err);
      setError(`디스코드 데이터 조회 실패: ${err.message}`);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [userId, fetchGet, setServers, setChannels, setLoading, setError]);

  const fetchDiscordChannelAll = useCallback(async () => {
    if (isLoadingRef.current || !userId) return;

    isLoadingRef.current = true;
    setLoading(true);

    try {
      const result = await fetchGet("/chat/discord/channel/all");
      if (result?.data) {
        const serverList = result.data.map((server) => ({
          id: server.id,
          name: server.name,
          description: server.description,
          adminId: server.adminId,
          icon: server.name.charAt(0).toUpperCase(),
          createdAt: formatRelativeTime(server.createdAt, 2),
        }));

        const serverListWithHome = [
          { id: "home", name: "홈", icon: "🏠" },
          ...serverList,
        ];

        return {
          servers: serverListWithHome,
          channels: result.data,
        };
      }
    } catch (err) {
      console.error(`디스코드 데이터 조회 실패: ${err.message}`, err);
      setError(`디스코드 데이터 조회 실패: ${err.message}`);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [userId, fetchGet, setServers, setChannels, setLoading, setError]);

  useEffect(() => {
    let isMounted = true;

    if (userId && isMounted && !window.discordDataLoaded) {
      window.discordDataLoaded = true;
      fetchDiscordData();
    }

    return () => {
      isMounted = false;
    };
  }, [userId, fetchDiscordData]);

  const createChannel = useCallback(
    async (name, description, imageInfo) => {
      if (!userId) return null;
      setLoading(true);
      try {
        const result = await fetchPost("/chat/discord/channel", {
          name,
          description,
          adminId: userId,
          imageUrl: imageInfo.imageUrl || null,
          imageId: imageInfo.id || null,
        });
        if (result?.result) {
          await fetchDiscordData();
          return result.response.data;
        }
      } catch (err) {
        console.error(`커뮤니티 생성 실패: ${err.message}`, err);
        setError(`커뮤니티 생성 실패: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return null;
    },
    [userId, fetchPost, fetchDiscordData, setLoading, setError]
  );

  const updateChannel = useCallback(
    async (name, description, channelId, imageInfo) => {
      if (!userId) return null;
      setLoading(true);
      try {
        const result = await fetchPut(
          "/chat/discord/channel",
          //Body
          {
            name,
            description,
            adminId: userId,
            imageUrl: imageInfo.imageUrl || null,
            imageId: imageInfo.id || null,
          },
          // Param
          {
            channelId: channelId,
          }
        );
        if (result?.result) {
          await fetchDiscordData();
          return result.response.data;
        }
      } catch (err) {
        console.error(`커뮤니티 수정 실패: ${err.message}`, err);
        setError(`커뮤니티 수정 실패: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return null;
    },
    [userId, fetchPut, fetchDiscordData, setLoading, setError]
  );

  const getChannel = useCallback(
    async (channelId) => {
      if (!channelId) return null;
      setLoading(true);
      try {
        const result = await fetchGet(`/chat/discord/channel/${channelId}`);
        return result?.data || null;
      } catch (err) {
        console.error(`커뮤니티 조회 실패: ${err.message}`, err);
        setError(`커뮤니티 조회 실패: ${err.message}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchGet, setLoading, setError]
  );

  const deleteChannel = useCallback(
    async (channelId) => {
      if (!channelId) return false;
      setLoading(true);
      try {
        const result = await fetchDelete(`/chat/discord/channel/${channelId}`);
        if (result?.result) {
          await fetchDiscordData();
          if (activeChannel?.id === channelId) {
            setActiveChannel(null);
            setActiveCategory(null);
          }
          return true;
        }
      } catch (err) {
        console.error(`커뮤니티 삭제 실패: ${err.message}`, err);
        setError(`커뮤니티 삭제 실패: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return false;
    },
    [
      activeChannel,
      fetchDelete,
      fetchDiscordData,
      setActiveChannel,
      setActiveCategory,
      setLoading,
      setError,
    ]
  );

  const createCategory = useCallback(
    async (name, description, channelId, displayOrder = 0) => {
      if (!channelId || !userId) return null;
      setLoading(true);
      try {
        const result = await fetchPost("/chat/discord/category", {
          name,
          description,
          channelId,
          displayOrder,
        });
        if (result?.result) {
          if (activeChannel?.id === channelId) {
            const updatedChannel = await getChannel(channelId);
            if (updatedChannel) setActiveChannel(updatedChannel);
          }
          await fetchDiscordData();
          return result.response.data;
        }
      } catch (err) {
        console.error(`채널 생성 실패: ${err.message}`, err);
        setError(`채널 생성 실패: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return null;
    },
    [
      userId,
      activeChannel,
      fetchPost,
      getChannel,
      fetchDiscordData,
      setActiveChannel,
      setLoading,
      setError,
    ]
  );

  const updateCategory = useCallback(
    async (name, description, channelId, categoryId, displayOrder = 0) => {
      if (!channelId || !userId) return null;
      setLoading(true);
      try {
        const result = await fetchPut("/chat/discord/category", {
          name,
          description,
          channelId,
          displayOrder,
        }, {categoryId: categoryId});
        if (result?.result) {
          if (activeChannel?.id === channelId) {
            const updatedChannel = await getChannel(channelId);
            if (updatedChannel) setActiveChannel(updatedChannel);
          }
          await fetchDiscordData();
          return result.response.data;
        }
      } catch (err) {
        console.error(`채널 수정 실패: ${err.message}`, err);
        setError(`채널 수정정 실패: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return null;
    },
    [
      userId,
      activeChannel,
      fetchPut,
      getChannel,
      fetchDiscordData,
      setActiveChannel,
      setLoading,
      setError,
    ]
  )

  const deleteCategory = useCallback(
    async (categoryId, channelId) => {
      if (!categoryId || !channelId) return false;
      setLoading(true);
      try {
        const result = await fetchDelete(
          `/chat/discord/category/${categoryId}`,
          { channelId: channelId }
        );
        if (result?.result) {
          if (activeChannel?.id === channelId) {
            const updatedChannel = await getChannel(channelId);
            if (updatedChannel) {
              setActiveChannel(updatedChannel);
              if (activeCategory?.id === categoryId) {
                // 구독 해제
                if (activeCategoryTopicRef.current) {
                  console.log(
                    `카테고리 삭제: 구독 해제 ${activeCategoryTopicRef.current}`
                  );
                  unsubscribe(activeCategoryTopicRef.current);
                  activeCategoryTopicRef.current = null;
                }
                setActiveCategory(null);
              }
            }
          }
          await fetchDiscordData();
          return true;
        }
      } catch (err) {
        console.error(`채널 삭제 실패: ${err.message}`, err);
        setError(`채널 삭제 실패: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return false;
    },
    [
      activeChannel,
      activeCategory,
      fetchDelete,
      getChannel,
      fetchDiscordData,
      unsubscribe,
      setActiveChannel,
      setActiveCategory,
      setLoading,
      setError,
    ]
  );

  const selectChannel = useCallback(
    async (channelId) => {
      if (!channelId) return false;
      try {
        // 이전 카테고리 구독 해제
        if (activeCategoryTopicRef.current) {
          console.log(
            `채널 선택: 이전 카테고리 구독 해제 ${activeCategoryTopicRef.current}`
          );
          unsubscribe(activeCategoryTopicRef.current);
          activeCategoryTopicRef.current = null;
        }

        const channelData = await getChannel(channelId);
        if (channelData) {
          setActiveChannel(channelData);
          setActiveCategory(null);
          setMessages([]);
          return true;
        }
      } catch (err) {
        console.error(`커뮤니티 선택 실패: ${err.message}`, err);
        setError(`커뮤니티 선택 실패: ${err.message}`);
      }
      return false;
    },
    [
      getChannel,
      unsubscribe,
      setActiveChannel,
      setActiveCategory,
      setMessages,
      setError,
    ]
  );

  const getCategoryMessages = useCallback(
    async (categoryId, page = 0, size = 20) => {
      if (!categoryId) return [];

      // 일반 로딩 상태와 메시지 로딩 상태 모두 설정
      setLoading(true);
      setIsLoadingMessages(true);

      try {
        // 채팅 메시지와 동일한 API를 사용하되, roomId 대신 categoryId를 전달
        const result = await fetchPost("/chat/message", {
          roomId: categoryId, // categoryId를 roomId로 사용
          roomType: RoomType.DISCORD_CATEGORY, // 메시지 타입 지정
          page,
          size,
          sortDirection: "DESC",
        });

        if (result && result.result && result.response.data) {
          // 메시지 역순 정렬 (최신 메시지가 아래에 표시되도록)
          const sortedMessages = [...result.response.data].reverse();
          console.log(
            `카테고리 ${categoryId} 메시지 조회 결과 (페이지 ${page}):`,
            sortedMessages.length
          );

          // 처리된 메시지 ID 세트 초기화 - 새 카테고리 선택 시 (페이지가 0인 경우)
          if (page === 0) {
            processedMessageIdsRef.current.clear();
          }

          // 조회된 메시지 ID를 처리된 ID 세트에 추가
          sortedMessages.forEach((msg) => {
            processedMessageIdsRef.current.add(msg.id);
          });

          // 메시지 설정 전에 의도적으로 지연 추가 (더 나은 UX를 위해)
            // 페이지가 0이면 메시지 교체, 아니면 기존 메시지 앞에 추가
            if (page === 0) {
              setMessages(sortedMessages);
            } else {
              setMessages((prev) => [...sortedMessages, ...prev]);
            }
            setIsLoadingMessages(false); // 메시지 로딩 상태 해제


          return sortedMessages;
        }

        // 결과가 없는 경우

          if (page === 0) {
            setMessages([]);
          }
          setIsLoadingMessages(false);

        return [];
      } catch (err) {
        console.error(`카테고리 메시지 조회 실패: ${err.message}`, err);
        setError(`카테고리 메시지 조회 실패: ${err.message}`);

        // 오류 발생 시에도 지연 후 로딩 상태 해제
        setTimeout(() => {
          setIsLoadingMessages(false);
        }, 300);

        return [];
      } finally {
        setLoading(false);
      }
    },
    [fetchPost, setLoading, setIsLoadingMessages, setMessages, setError]
  );
  // 스톰프 메시지 핸들러 - 커스텀 이벤트로 전달
  const handleStompMessage = useCallback(
    (data) => {
      if (!data) {
        console.error("메시지 데이터가 없습니다");
        return;
      }

      if (!data.data) {
        console.error("메시지 data 필드가 없습니다:", data);
        return;
      }

      const messageData = data.data;
      console.log("디스코드 메시지 수신 (상세):", {
        action: data.action,
        messageId: messageData.id,
        content: messageData.content?.substring(0, 30),
        categoryId: messageData.roomId,
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
    },
    [activeCategory?.id]  );

  // 카테고리 선택 - 단순화된 버전
  const selectCategory = useCallback(
    async (category) => {
      if (!category || activeCategory?.id === category.id) return false;

      try {
        // 이전 카테고리 구독 해제
        if (activeCategoryTopicRef.current) {
          console.log(
            `카테고리 변경: 이전 구독 해제 ${activeCategoryTopicRef.current}`
          );
          removeCallback(activeCategoryTopicRef.current, null);
          unsubscribe(activeCategoryTopicRef.current);
          activeCategoryTopicRef.current = null;
        }

        setActiveCategory(category);
        await getCategoryMessages(category.id);

        if (connected) {
          console.log("카테고리 메시지 읽음 처리:");
          send("/app/send.read", {
            roomId: category.id,
            senderId: userId,
          });
        }

        // 카테고리 구독 (1회만)
        if (connected) {
          const categoryTopic = `/topic/chat/${category.id}`;
          console.log(`카테고리 구독 시도: ${categoryTopic}`);

          const subscription = subscribe(categoryTopic, handleStompMessage);
          if (subscription) {
            activeCategoryTopicRef.current = categoryTopic;
            console.log(`카테고리 ${category.id} 구독 성공`);
          }
        }

        return true;
      } catch (err) {
        console.error(`채널 선택 실패: ${err.message}`, err);
        setError(`채널 선택 실패: ${err.message}`);
        return false;
      }
    },
    [
      activeCategory,
      connected,
      getCategoryMessages,
      subscribe,
      unsubscribe,
      handleStompMessage,
      setActiveCategory,
      setError,
    ]
  );
  const sendWithFileCategoryMessage = useCallback(
    (content, attachments) => {
      if (!activeCategory || !userId) return false;

      // 연결 상태 확인만 하고 재연결 시도하지 않음
      if (!connected) {
        console.error("웹소켓 연결이 없어 메시지를 전송할 수 없습니다.");
        return false;
      }

      const messageData = {
        roomId: activeCategory.id,
        senderId: userId,
        content,
        roomType: RoomType.DISCORD_CATEGORY,
        sentAt: new Date().toISOString(),
        senderName: userInfo?.nickname || userInfo?.email,
        attachments: attachments,
      };

      console.log("메시지 전송:", messageData);

      // 실제 메시지 전송
      return send("/app/send.message", messageData);
    },
    [userId, connected, activeCategory, send, userInfo?.nickname, userInfo?.email]
  );

  // 카테고리 메시지 전송 함수 - 연결 확인 로직 개선
  const sendCategoryMessage = useCallback(
    (content) => {
      if (!activeCategory || !userId) return false;

      // 연결 상태 확인만 하고 재연결 시도하지 않음
      if (!connected) {
        console.error("웹소켓 연결이 없어 메시지를 전송할 수 없습니다.");
        return false;
      }

      // 채팅 메시지와 동일한 형식을 사용하되 roomId에 categoryId를 입력
      const messageData = {
        roomId: activeCategory.id, // 카테고리 ID를 roomId로 사용
        senderId: userId,
        content,
        roomType: RoomType.DISCORD_CATEGORY, // 메시지 타입을 DISCORD_CATEGORY로 설정
        sentAt: new Date().toISOString(),
        senderName: userInfo?.nickname || userInfo?.email,
      };

      console.log("카테고리 메시지 전송:", messageData);      // 실제 메시지 전송 - 채팅과 동일한 엔드포인트 사용
      return send("/app/send.message", messageData);
    },
    [activeCategory, connected, userId, send, userInfo?.nickname, userInfo?.email]
  );

  // 카테고리 메시지 삭제 함수
  const deleteCategoryMessage = useCallback(
    (messageId) => {
      if (!activeCategory || !connected || !userId || !messageId) return false;

      const messageData = {
        id: messageId,
        roomId: activeCategory.id,
        senderId: userId,
        roomType: RoomType.DISCORD_CATEGORY,
      };

      console.log("카테고리 메시지 삭제:", messageData);

      // 실제 메시지 삭제 - 채팅과 동일한 엔드포인트 사용
      return send("/app/send.delete", messageData);
    },
    [activeCategory, connected, userId, send]
  );
  // 카테고리 메시지 수정 함수
  const editCategoryMessage = useCallback(
    (messageId, content) => {
      if (!activeCategory || !connected || !userId || !messageId) return false;

      const messageData = {
        id: messageId,
        roomId: activeCategory.id,
        senderId: userId,
        content,
        roomType: RoomType.DISCORD_CATEGORY,
      };

      console.log("카테고리 메시지 수정:", messageData);

      // 실제 메시지 수정 - 채팅과 동일한 엔드포인트 사용
      return send("/app/send.edit", messageData);
    },
    [activeCategory, connected, userId, send]
  );

  const leaveDiscordServer = useCallback(
    async (serverId) => {
      if (!serverId || !userId) return false;
      setLoading(true);
      try {
        const result = await fetchPost("/chat/discord/leave", null, {
          serverId: serverId,
        });

        console.log(result);

        if (result?.result) {
          // 서버 목록 다시 불러오기
          await fetchDiscordData();

          // 현재 활성화된 서버가 나간 서버라면 홈으로 이동
          if (activeChannel?.id === serverId) {
            setActiveChannel(null);
            setActiveCategory(null);
          }

          return true;
        }
      } catch (err) {
        console.error(`커뮤니티 나가기 실패: ${err.message}`, err);
        setError(`커뮤니티 나가기 실패: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return false;
    },
    [
      userId,
      fetchPost,
      fetchDiscordData,
      activeChannel,
      setActiveChannel,
      setActiveCategory,
      setLoading,
      setError,
    ]
  );

  // 컴포넌트 언마운트 시 모든 구독 정리
  useEffect(() => {
    return () => {
      console.log("디스코드 서비스 언마운트 시 구독 정리");

      // 활성 카테고리 구독 해제
      if (activeCategoryTopicRef.current) {
        console.log(
          `언마운트 시 카테고리 구독 해제: ${activeCategoryTopicRef.current}`
        );
        unsubscribe(activeCategoryTopicRef.current);
        activeCategoryTopicRef.current = null;
      }

      // 디스코드 큐 구독 해제
      if (discordQueueRef.current) {
        console.log(
          `언마운트 시 디스코드 큐 구독 해제: ${discordQueueRef.current}`
        );
        unsubscribe(discordQueueRef.current);
        discordQueueRef.current = null;
      }
    };
  }, [unsubscribe]);

  return {
    servers,
    channels,
    activeChannel,
    activeCategory,
    messages,
    loading,
    isLoadingMessages,
    error,
    createChannel,
    selectChannel,
    deleteChannel,
    updateChannel,
    createCategory,
    selectCategory,
    deleteCategory,
    updateCategory,
    sendCategoryMessage,
    sendWithFileCategoryMessage,
    deleteCategoryMessage,
    editCategoryMessage,
    getCategoryMessages,
    fetchDiscordData,
    fetchDiscordChannelAll,
    leaveDiscordServer,
  };
};
