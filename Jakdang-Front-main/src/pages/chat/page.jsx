/* eslint-disable no-unused-vars */
"use client";

import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import useWebSocket from "@/hooks/useWebSocket";
import { userInfoAtom } from "@/jotai/authAtoms";
import {
  addChatRoomAtom,
  addMessageToRoomAtom,
  chatRoomsAtom,
  currentRoomMessagesAtom,
  isCreateChatOpenAtom,
  isCreateGroupChatOpenAtom,
  newChatNameAtom,
  newMessageAtom,
  removeChatRoomAtom,
  selectedChatRoomIdAtom,
  selectedMembersAtom,
  unreadCountsAtom,
  updateChatRoomAtom,
  updateUnreadCountsAtom,
} from "@/jotai/chatAtoms";
import { useChatService } from "@/service/api/chatApi";
import { useFileUploadService } from "@/service/api/fileApiV2";
import { formatRelativeTime } from "@/utils/formatDate";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { ArrowLeft, MoreVertical } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// 컴포넌트 불러오기
import ChatHeader from "@/components/chat/ChatHeader";
import ChatInputArea from "@/components/chat/ChatInputArea";
import ChatMessageList from "@/components/chat/ChatMessageList";
import ChatRoomList from "@/components/chat/ChatRoomList";
import ConnectionStatus from "@/components/chat/ConnectionStatus";
import CreateChatDialog from "@/components/chat/CreateChatDialog";
import CreateGroupChatDialog from "@/components/chat/CreateGroupChatDialog";
import InviteChatDialog from "@/components/chat/inviteChatDialog"; // 멤버 초대 다이얼로그 추가
import { ImageModal } from "@/pages/chatv2/image-modal"; // 이미지 모달 추가

// debounce 유틸리티 함수 추가
const debounce = (fn, ms) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, ms);
  };
};

export default function ChatPage() {
  // 기존 코드 유지 (비즈니스 로직)
  const subscriptionRef = useRef({});
  const sessionUpdated = useRef({});
  const pendingReadRequests = useRef({});
  const messageListRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isInitialized = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // 초대 다이얼로그 상태 추가
  const [isInviteChatDialogOpen, setIsInviteChatDialogOpen] = useState(false);

  // Jotai 상태 관리
  const userInfo = useAtomValue(userInfoAtom);
  const [chatRooms, setChatRooms] = useAtom(chatRoomsAtom);
  const [selectedChatId, setSelectedChatId] = useAtom(selectedChatRoomIdAtom);
  const [messages, setMessages] = useAtom(currentRoomMessagesAtom);
  const [newMessage, setNewMessage] = useAtom(newMessageAtom);
  const [unreadCounts, setUnreadCounts] = useAtom(unreadCountsAtom);
  const addMessageToRoom = useSetAtom(addMessageToRoomAtom);
  const updateUnreadCounts = useSetAtom(updateUnreadCountsAtom);
  const addChatRoom = useSetAtom(addChatRoomAtom);
  const removeChatRoom = useSetAtom(removeChatRoomAtom);
  const updateChatRoom = useSetAtom(updateChatRoomAtom);

  // 모달 관련 상태
  const [newChatName, setNewChatName] = useAtom(newChatNameAtom);
  const [isCreateChatOpen, setIsCreateChatOpen] = useAtom(isCreateChatOpenAtom);
  const [isCreateGroupChatOpen, setIsCreateGroupChatOpen] = useAtom(
    isCreateGroupChatOpenAtom
  );
  const [selectedMembers, setSelectedMembers] = useAtom(selectedMembersAtom);

  const [availableUsers] = useState([
    {
      id: "101",
      name: "김민수",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "102",
      name: "이지은",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "103",
      name: "박준영",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "104",
      name: "최유진",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "105",
      name: "정승호",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]);

  // 서비스
  const chatService = useChatService();
  const fileUploadService = useFileUploadService();

  // 선택된 채팅방 정보
  const selectedChat =
    chatRooms.find((chat) => chat.id === selectedChatId) || null;

  // 기존 비즈니스 로직 유지 (markAsRead, handleWebSocketMessage 등)
  const markAsRead = useCallback(
    async (roomId) => {
      if (!roomId || !userInfo?.userId) return;

      if (pendingReadRequests.current[roomId]) {
        return;
      }

      pendingReadRequests.current[roomId] = true;

      try {
        await chatService.markAsRead(userInfo.userId, roomId);

        updateUnreadCounts({ roomId: roomId, count: 0 });
      } catch (error) {

        if (!pendingReadRequests.current[`error_${roomId}`]) {
          pendingReadRequests.current[`error_${roomId}`] = true;

          toast({
            title: "읽음 처리 오류",
            description: "채팅 읽음 처리에 실패했습니다.",
            variant: "destructive",
          });

          setTimeout(() => {
            delete pendingReadRequests.current[`error_${roomId}`];
          }, 5000);
        }
      } finally {
        setTimeout(() => {
          delete pendingReadRequests.current[roomId];
        }, 3000);
      }
    },
    [userInfo?.userId, chatService, updateUnreadCounts, toast]
  );

  const debouncedMarkAsRead = useCallback(
    debounce((roomId) => {
      markAsRead(roomId);
    }, 500),
    [markAsRead]
  );

  const handleWebSocketMessage = useCallback(
    (message) => {
      if (!message) return;

      if (message.type === "READ_STATUS_UPDATE") {
        const data = message.data || {};
        if (!data.roomId) return;

        updateUnreadCounts({
          roomId: data.roomId,
          count: 0,
        });

        if (messageListRef.current?.updateReadStatus && data.roomId === selectedChatId) {
          console.log("메시지 읽음 상태 업데이트:", data);
          messageListRef.current.updateReadStatus(data);
        }

        return;
      }

      let messageType = 1;

      if (typeof message.type === "string") {
        if (message.type.toUpperCase().includes("SYSTEM")) messageType = 0;
        else if (message.type.toUpperCase().includes("IMAGE")) messageType = 2;
        else if (message.type.toUpperCase().includes("FILE")) messageType = 3;
      } else if (typeof message.type === "number") {
        messageType = message.type;
      }

      // 고유한 메시지 ID 생성 (없는 경우)
      const messageId =
        message.id ||
        `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      // 메시지 ID로 중복 검사
      if (
        messageListRef.current?.hasMessage &&
        messageListRef.current.hasMessage(messageId)
      ) {
        console.log("WebSocket 중복 메시지 무시:", messageId);
        return;
      }
      console.log("중복")
      // 내용 기반 중복 체크 추가
      const contentFingerprint = `${message.senderId}:${
        message.content
      }:${new Date(message.sentAt || Date.now()).getTime()}`;
      if (
        messageListRef.current?.hasMessage &&
        messageListRef.current.hasMessage(contentFingerprint)
      ) {
        console.log("내용 기반 중복 메시지 무시:", contentFingerprint);
        return;
      }

      const newMsg = {
        id: messageId,
        roomId: message.roomId,
        senderId: message.senderId,
        senderName: message.senderName || "사용자",
        content: message.content || "",
        type: messageType,
        fileUrl: message.fileUrl || "",
        sentAt: message.sentAt || new Date().toISOString(),
        isMe: message.senderId === userInfo?.userId,
        readCount: message.readCount || 0,
        readBy: message.readBy || [],
        formattedTime: formatRelativeTime(
          message.sentAt || new Date().toISOString(),
          0
        ),
      };

      if (message.roomId === selectedChatId) {
        if (messageListRef.current?.addNewMessage) {
          messageListRef.current.addNewMessage(newMsg);
        }

        if (message.senderId !== userInfo?.userId) {
          markAsRead(message.roomId);
        }
      } else {
        updateUnreadCounts({
          roomId: message.roomId,
          count: (unreadCounts[message.roomId] || 0) + 1,
        });
      }

      updateChatRoom({
        id: message.roomId,
        lastMessage: message.content || "(내용 없음)",
        lastMessageTime: message.sentAt || new Date().toISOString(),
        time: formatRelativeTime(message.sentAt || new Date().toISOString(), 0),
      });
    },
    [
      userInfo?.userId,
      selectedChatId,
      updateUnreadCounts,
      updateChatRoom,
      unreadCounts,
      markAsRead,
    ]
  );

  // WebSocket 설정 (기존 코드 유지)
  const {
    connectionState,
    reconnect: reconnectWebSocket,
    subscribeToRoom,
    subscribeToUser,
  } = useWebSocket({
    onConnected: () => {
      console.log("WebSocket 연결됨");
  
      if (userInfo?.userId) {
        subscribeToUser(userInfo.userId, (notification) => {
          console.log("사용자 알림:", notification);
          // 알림 메시지만 처리하고 일반 메시지는 subscribeToRoom에서 처리하도록 함
          if (notification && notification.type === "MESSAGE" && !notification.roomId) {
            handleWebSocketMessage(notification);
          }
        });
      }
    },
    onDisconnected: () => {
      console.log("WebSocket 연결 종료");
    },
    onError: (error) => {
      console.error("WebSocket 오류:", error);
      toast({
        title: "연결 오류",
        description: "채팅 연결에 문제가 발생했습니다.",
        variant: "destructive",
      });
    },
    // 전역 메시지 핸들러는 사용하지 않음 (중복 처리 방지)
    // onMessage: handleWebSocketMessage,
    debug: true,
  });

  // 기존 useEffect 및 핸들러 함수들 유지
  useEffect(() => {
    if (connectionState !== "connected" || !selectedChatId || !userInfo?.userId)
      return;

    const roomKey = `/topic/room/${selectedChatId}`;
    const isAlreadySubscribed = Boolean(subscriptionRef.current[roomKey]);

    if (isAlreadySubscribed) {
      console.log(`이미 구독 중인 채팅방: ${selectedChatId}`);

      debouncedMarkAsRead(selectedChatId);
      return;
    }

    const subscription = subscribeToRoom(
      selectedChatId,
      handleWebSocketMessage
    );

    if (subscription) {
      subscriptionRef.current[roomKey] = subscription;

      debouncedMarkAsRead(selectedChatId);
    }

    return () => {
      if (subscriptionRef.current[roomKey]) {
        try {
          delete subscriptionRef.current[roomKey];
        } catch (err) {
          console.error("구독 해제 오류:", err);
        }
      }
    };
  }, [
    selectedChatId,
    connectionState,
    userInfo?.userId,
    subscribeToRoom,
    debouncedMarkAsRead,
    handleWebSocketMessage,
  ]);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  useEffect(() => {
    if (isMobile && selectedChatId) {
      setShowChatList(false);
    }
  }, [selectedChatId, isMobile]);

  useEffect(() => {
    if (isInitialized.current) return;

    const loadInitialData = async () => {
      if (!userInfo?.userId) return;
    
      try {
        setLoadingInitial(true);
    
        // 데이터 요청을 병렬로 처리하고 요청 간 의존성 제거
        const [roomsResponse, unreadResponse] = await Promise.all([
          chatService.getChatRooms(userInfo.userId),
          chatService.getUnreadCount(userInfo.userId)
        ]);
    
        // 채팅방 목록 처리
        if (roomsResponse && roomsResponse.content) {
          // 읽지 않은 메시지 수 데이터를 미리 맵으로 변환
          const unreadCountsMap = {};
          if (unreadResponse && unreadResponse.data) {
            unreadResponse.data.forEach((item) => {
              unreadCountsMap[item.roomId] = item.count;
            });
          }
          
          // 한번에 상태 업데이트를 위한 채팅방 목록 준비
          const formattedRooms = roomsResponse.content.map((room) => ({
            id: room.id,
            name: room.name,
            avatar: "/placeholder.svg?height=40&width=40",
            lastMessage: room.lastMessage || "",
            time: formatRelativeTime(room.lastMessageTime, 0),
            unread: unreadCountsMap[room.id] || 0, // 읽지 않은 메시지 수 통합
            online: true,
            isGroup: room.type === "GROUP",
            participants: room.participantIds || [],
            type: room.type,
            createdAt: room.createdAt,
            updatedAt: room.updatedAt,
            lastMessageTime: room.lastMessageTime,
          }));
    
          // 상태 업데이트는 한 번만 수행
          setChatRooms(formattedRooms);
          setUnreadCounts(unreadCountsMap);
    
          if (formattedRooms.length > 0 && !selectedChatId) {
            setSelectedChatId(formattedRooms[0].id);
          }
        }
    
        isInitialized.current = true;
      } catch (error) {
        console.error("초기 데이터 로딩 오류:", error);
        toast({
          title: "데이터 로딩 오류",
          description: "채팅 데이터를 불러오는데 실패했습니다.",
          variant: "destructive",
        });
        isInitialized.current = false;
      } finally {
        setLoadingInitial(false);
      }
    };

    loadInitialData();
  }, [
    userInfo?.userId,
    chatService,
    setChatRooms,
    setSelectedChatId,
    setUnreadCounts,
    selectedChatId,
    toast,
  ]);

  const handleFileUpload = useCallback(
    async (files) => {
      if (!files || files.length === 0 || !selectedChatId || !userInfo?.userId)
        return;

      try {
        setIsUploading(true);

        const uploadResults = await fileUploadService.uploadMultipleFiles(
          files,
          {
            ownerId: userInfo.userId,
            memberType: "USER",
          }
        );

        console.log("파일 업로드 결과:", uploadResults);

        for (const result of uploadResults) {
          if (result.type.startsWith("image")) {
            await chatService.sendImageMessage(
              userInfo.userId,
              selectedChatId,
              result.address,
              userInfo.nickname || userInfo.nickname || "사용자"
            );
          } else {
            await chatService.sendFileMessage(
              userInfo.userId,
              selectedChatId,
              result.address,
              result.name,
              userInfo.nickname || userInfo.nickname || "사용자"
            );
          }
        }

        // 파일 업로드 후 스크롤
        if (messageListRef.current) {
          messageListRef.current.scrollToBottom();
        }

        toast({
          title: "업로드 완료",
          description: `${files.length}개의 파일이 업로드되었습니다.`,
        });
      } catch (error) {
        console.error("파일 업로드 오류:", error);
        toast({
          title: "업로드 오류",
          description: "파일 업로드에 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [selectedChatId, userInfo, fileUploadService, chatService, toast]
  );

  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newMessage.trim() || !selectedChatId || !userInfo?.userId) return;

      try {
        console.log(
          `메시지 전송 시도 - 사용자: ${userInfo.userId}, 채팅방: ${selectedChatId}`
        );

        const result = await chatService.sendTextMessage(
          userInfo.userId,
          selectedChatId,
          newMessage.trim(),
          userInfo.nickname || "사용자"
        );

        console.log("메시지 전송 결과:", result);

        // 메시지 전송 후 스크롤 (messageListRef의 scrollToBottom 함수는 ChatInputArea에서 호출됨)
        setNewMessage("");
      } catch (error) {
        console.error("메시지 전송 오류:", error);
        toast({
          title: "전송 오류",
          description: "메시지 전송에 실패했습니다.",
          variant: "destructive",
        });
      }
    },
    [newMessage, selectedChatId, userInfo, chatService, setNewMessage, toast]
  );

  const handleInviteMembers = useCallback(
    async (memberIds, inviterName) => {
      if (
        !selectedChatId ||
        !userInfo?.userId ||
        !memberIds ||
        memberIds.length === 0
      )
        return false;

      try {
        console.log(
          `멤버 초대 시도 - 채팅방: ${selectedChatId}, 초대자: ${
            userInfo.userId
          }, 멤버: ${memberIds.join(", ")}`
        );

        // inviteUser 인자 순서 확인: userId, inviterId, roomId, userIds, inviterName
        const result = await chatService.inviteUser(
          userInfo.userId,
          userInfo.userId,
          selectedChatId,
          memberIds,
          inviterName
        );

        console.log("멤버 초대 결과:", result);
        return true;
      } catch (error) {
        console.error("멤버 초대 오류:", error);
        toast({
          title: "초대 오류",
          description: "멤버 초대에 실패했습니다.",
          variant: "destructive",
        });
        return false;
      }
    },
    [selectedChatId, userInfo, chatService, toast]
  );

  const handleCreateChat = useCallback(async () => {
    if (!newChatName.trim() || !userInfo?.userId) return;

    try {
      console.log(
        `채팅방 생성 시도 - 사용자: ${userInfo.userId}, 이름: ${newChatName}`
      );
      const result = await chatService.createChatRoom(
        userInfo.userId,
        newChatName,
        selectedMembers ? selectedMembers.map((member) => member.id) : [],
        false
      );

      console.log("채팅방 생성 결과:", result);

      if (result) {
        const newChat = {
          id: result.id,
          name: result.name,
          avatar: "/placeholder.svg?height=40&width=40",
          lastMessage: "",
          time: "방금 전",
          unread: 0,
          online: true,
          isGroup: false,
          participants: result.participantIds || [],
          type: result.type,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        };

        addChatRoom(newChat);

        setSelectedChatId(result.id);

        toast({
          title: "채팅방 생성 완료",
          description: `${newChatName}님과의 채팅방이 생성되었습니다.`,
        });
      }

      setIsCreateChatOpen(false);
      setNewChatName("");
    } catch (error) {
      console.error("채팅방 생성 오류:", error);
      toast({
        title: "생성 오류",
        description: "채팅방 생성에 실패했습니다.",
        variant: "destructive",
      });
    }
  }, [
    newChatName,
    userInfo?.userId,
    chatService,
    addChatRoom,
    setSelectedChatId,
    setIsCreateChatOpen,
    setNewChatName,
    toast,
  ]);

  const handleCreateGroupChat = useCallback(async () => {
    if (
      !newChatName.trim() ||
      selectedMembers.length === 0 ||
      !userInfo?.userId
    )
      return;

    try {
      const participantIds = selectedMembers.map((member) => member.id);
      participantIds.push(userInfo.userId);
      console.log(
        `단톡방 생성 시도 - 사용자: ${
          userInfo.userId
        }, 이름: ${newChatName}, 멤버: ${participantIds.join(", ")}`
      );

      const result = await chatService.createChatRoom(
        userInfo.userId,
        newChatName,
        participantIds,
        true
      );

      console.log("단톡방 생성 결과:", result);

      if (result) {
        const newChat = {
          id: result.id,
          name: result.name,
          avatar: "/placeholder.svg?height=40&width=40",
          lastMessage: "",
          time: "방금 전",
          unread: 0,
          online: true,
          isGroup: true,
          participants: result.participantIds || [],
          type: result.type,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        };

        addChatRoom(newChat);

        setSelectedChatId(result.id);

        toast({
          title: "단톡방 생성 완료",
          description: `${newChatName} 단톡방이 생성되었습니다.`,
        });
      }

      setIsCreateGroupChatOpen(false);
      setNewChatName("");
      setSelectedMembers([]);
    } catch (error) {
      console.error("단톡방 생성 오류:", error);
      toast({
        title: "생성 오류",
        description: "단톡방 생성에 실패했습니다.",
        variant: "destructive",
      });
    }
  }, [
    newChatName,
    selectedMembers,
    userInfo?.userId,
    chatService,
    addChatRoom,
    setSelectedChatId,
    setIsCreateGroupChatOpen,
    setNewChatName,
    setSelectedMembers,
    toast,
  ]);

  const handleLeaveChat = useCallback(async () => {
    if (!selectedChatId || !userInfo?.userId) return;

    try {
      console.log(
        `채팅방 나가기 시도 - 사용자: ${userInfo.userId}, 채팅방: ${selectedChatId}`
      );

      await chatService.leaveChatRoom(userInfo.userId, selectedChatId);

      const chatName =
        chatRooms.find((chat) => chat.id === selectedChatId)?.name || "";

      removeChatRoom(selectedChatId);

      if (chatRooms.length > 1) {
        const nextChatId = chatRooms.find(
          (chat) => chat.id !== selectedChatId
        )?.id;
        setSelectedChatId(nextChatId);
      } else {
        setSelectedChatId(null);
      }

      toast({
        title: "채팅방 나가기",
        description: `${chatName} 채팅방에서 나갔습니다.`,
      });
    } catch (error) {
      console.error("채팅방 나가기 오류:", error);
      toast({
        title: "오류",
        description: "채팅방 나가기에 실패했습니다.",
        variant: "destructive",
      });
    }
  }, [
    selectedChatId,
    userInfo?.userId,
    chatService,
    chatRooms,
    removeChatRoom,
    setSelectedChatId,
    toast,
  ]);

  const handleSelectChat = useCallback(
    (chatId) => {
      if (chatId === selectedChatId) return;

      setSelectedChatId(chatId);

      if (isMobile) {
        setShowChatList(false);
      }
    },
    [selectedChatId, setSelectedChatId, isMobile]
  );

  useEffect(() => {
    if (!userInfo?.userId) return;
    
    const handleBeforeUnload = () => {
      // 현재 선택된 채팅방이 있으면 세션 종료 처리
      if (selectedChatId) {
        // navigator.sendBeacon 사용 (비동기 방식보다 브라우저 종료 시 더 안정적)
        const url = `${import.meta.env.VITE_BASE_API_URL}/api/kafka/chat/session/leave`;
        const formData = new FormData();
        formData.append('user_id', userInfo.userId);
        formData.append('room_id', selectedChatId);
        
        navigator.sendBeacon(url, formData);
        console.log(`브라우저 종료: 채팅방 ${selectedChatId} 세션 종료`);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userInfo?.userId, selectedChatId]);

  // 채팅방 선택 시 웹소켓 구독 관리
  useEffect(() => {
    // 이전 구독 정리
    Object.keys(subscriptionRef.current).forEach((key) => {
      if (
        key.startsWith("/topic/room/") &&
        key !== `/topic/room/${selectedChatId}`
      ) {
        try {
          console.log(`이전 구독 정리: ${key}`);
          delete subscriptionRef.current[key];
        } catch (err) {
          console.error(`구독 해제 오류 (${key}):`, err);
        }
      }
    });

    if (connectionState !== "connected" || !selectedChatId || !userInfo?.userId)
      return;

    if (!sessionUpdated.current[selectedChatId]) {
      sessionUpdated.current[selectedChatId] = true;
      
      chatService.updateUserSession(userInfo.userId, selectedChatId)
        .catch(error => console.error("세션 업데이트 오류:", error));
        
      console.log(`채팅방 ${selectedChatId} 세션 업데이트`);
    }

    const roomKey = `/topic/room/${selectedChatId}`;
    const isAlreadySubscribed = Boolean(subscriptionRef.current[roomKey]);

    if (isAlreadySubscribed) {
      debouncedMarkAsRead(selectedChatId);
      return;
    }


    const subscription = subscribeToRoom(
      selectedChatId,
      handleWebSocketMessage
    );

    if (subscription) {
      subscriptionRef.current[roomKey] = subscription;
      debouncedMarkAsRead(selectedChatId);
    }

    return () => {
      if (selectedChatId && userInfo?.userId) {
        try {
          // 이 함수는 chatApi.js에 추가 필요
          chatService.leaveSession(userInfo.userId, selectedChatId);
        } catch (error) {
          console.error("세션 정리 오류:", error);
        }
      }
      if (subscriptionRef.current[roomKey]) {
        try {
          delete subscriptionRef.current[roomKey];
        } catch (err) {
          console.error("구독 해제 오류:", err);
        }
      }
    };
  }, [
    selectedChatId,
    connectionState,
    userInfo?.userId,
    subscribeToRoom,
    debouncedMarkAsRead,
    handleWebSocketMessage,
  ]);

  // 로딩 화면
  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-white dark:bg-navy-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium dark:text-white mb-2">
            채팅 로딩 중...
          </h2>
          <div className="animate-spin w-10 h-10 border-4 border-chat-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-navy-900 flex flex-col">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white dark:bg-navy-800 border-b dark:border-navy-700 shadow-sm">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto max-w-chat">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="rounded-full hover:bg-chat-hover dark:hover:bg-chat-darkHover"
            >
              <ArrowLeft className="h-5 w-5 text-chat-primary dark:text-white" />
            </Button>
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">
              메시지
            </h1>
          </div>
          {/* <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-chat-hover dark:hover:bg-chat-darkHover"
          >
            <MoreVertical className="h-5 w-5 text-gray-600 dark:text-white" />
          </Button> */}
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="flex flex-1 overflow-hidden max-w-chat mx-auto w-full shadow-chat">
        {/* 채팅 목록 (모바일에서는 조건부 렌더링) */}
        {(showChatList || !isMobile) && (
          <div
            className={`${
              isMobile ? "w-full" : "w-1/3 md:w-2/5 lg:w-1/3"
            } flex flex-col bg-white dark:bg-navy-800 border-r dark:border-navy-700`}
          >
            <ChatRoomList
              isMobile={isMobile}
              setShowChatList={setShowChatList}
              onSelectChat={handleSelectChat}
            />
          </div>
        )}

        {/* 채팅 내용 */}
        {(!showChatList || !isMobile) && (
          <div
            className={`${
              isMobile ? "w-full" : "w-2/3 md:w-3/5 lg:w-2/3"
            } flex flex-col h-full bg-chat-secondary dark:bg-navy-900`}
          >
            {/* 채팅 헤더 */}
            <ChatHeader
              isMobile={isMobile}
              setShowChatList={setShowChatList}
              onLeaveChat={handleLeaveChat}
              selectedChat={selectedChat}
              setIsInviteChatDialogOpen={setIsInviteChatDialogOpen}
            />

            {/* 연결 상태 표시 */}
            <ConnectionStatus
              connectionState={connectionState}
              reconnect={reconnectWebSocket}
            />

            {/* 메시지 영역 */}
            <ChatMessageList
              ref={messageListRef}
              connectionState={connectionState}
              onFileUpload={handleFileUpload}
            />

            {/* 메시지 입력 */}
            {selectedChatId && (
              <ChatInputArea
                onSendMessage={handleSendMessage}
                onFileUpload={handleFileUpload}
                isUploading={isUploading}
                connectionState={connectionState}
                messageListRef={messageListRef}
              />
            )}
          </div>
        )}
      </div>

      {/* 새 채팅방 생성 모달 */}
      <CreateChatDialog onCreateChat={handleCreateChat} />

      {/* 새 단톡방 생성 모달 */}
      <CreateGroupChatDialog
        onCreateGroupChat={handleCreateGroupChat}
        availableUsers={availableUsers}
      />

      {/* 멤버 초대 다이얼로그 추가 */}
      <InviteChatDialog
        isInviteChatDialogOpen={isInviteChatDialogOpen}
        setIsInviteChatDialogOpen={setIsInviteChatDialogOpen}
        selectedChatRoomId={selectedChatId}
        userInfo={userInfo}
        onInviteMembers={handleInviteMembers}
      />
      
      {/* 이미지 모달 */}
      <ImageModal />
    </div>
  );
}
