"use client";

import { useEffect, useState, useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";
import { userInfoAtom } from "@/jotai/authAtoms";
import {
  chatRoomsAtom,
  activeChatRoomAtom,
  messagesAtom,
} from "@/jotai/chatAtoms";
import { useChatService } from "@/hooks/useChatService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  Search,
  X,
  ArrowLeft,
  ExternalLink,
  Plus,
  Users,
  MessageSquare,
  User,
} from "lucide-react";
import CreateRoomDialog from "@/components/create-room-dialog";
import { PopupMembersSidebar } from "@/components/popup-members-sidebar";
import { FixedMessageHeader } from "@/components/fixed-meesage-header";
import SearchMember from "@/components/search-member";
import { RoomType } from "@/utils/constant/constants";
import { cn } from "@/lib/utils";

// 채팅 컴포넌트들 import
import { Main } from "@/pages/chatv2/main";
import { MessageInput } from "@/pages/chatv2/input";
import { Header } from "@/pages/chatv2/header";
import { ImageModal } from "@/pages/chatv2/image-modal";
import popupManager from "@/utils/popupManager";

export default function PopupChatList() {
  const [user] = useAtom(userInfoAtom);
  const [chatRooms] = useAtom(chatRoomsAtom);
  const [activeRoom] = useAtom(activeChatRoomAtom);
  const [messages, setMessages] = useAtom(messagesAtom);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [fixedMessageModalOpen, setFixedMessageModalOpen] = useState(false);
  const [isMembersSidebarOpen, setIsMembersSidebarOpen] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // 드래그앤드롭 관련 상태

  // 상태 안정화 - 화면 크기 변화에도 selectedRoom과 activeRoom 유지
  // 이 변수들은 반응형 로직과 무관하게 상태를 유지합니다
  const stableSelectedRoom = selectedRoom;
  const stableActiveRoom = activeRoom;

  // 멤버 사이드바 토글 함수
  const toggleMembersSidebar = () => {
    console.log("멤버 사이드바 토글:", {
      현재상태: isMembersSidebarOpen,
      새상태: !isMembersSidebarOpen,
      activeRoom: activeRoom ? activeRoom.id : "없음",
      selectedRoom: selectedRoom ? selectedRoom.id : "없음",
    });
    setIsMembersSidebarOpen(!isMembersSidebarOpen);
  };

  // 100% 상태 안정화 보장 - 어떤 이유로든 상태 초기화를 방지
  useEffect(() => {
    // 팝업 환경에서는 화면 크기 변화나 기타 이벤트로 인한 상태 초기화를 완전히 방지
    const preventStateReset = () => {
      // selectedRoom이나 activeRoom이 의도치 않게 초기화되는 것을 방지
      if (stableSelectedRoom && !selectedRoom) {
        console.warn("selectedRoom 상태 복원:", stableSelectedRoom.id);
        setSelectedRoom(stableSelectedRoom);
      }
    };

    // 윈도우 크기 변화나 기타 이벤트에서도 상태 유지
    window.addEventListener("resize", preventStateReset);
    window.addEventListener("orientationchange", preventStateReset);

    return () => {
      window.removeEventListener("resize", preventStateReset);
      window.removeEventListener("orientationchange", preventStateReset);
    };
  }, [stableSelectedRoom, selectedRoom]);

  // useChatService 훅을 안정적으로 사용
  const chatService = useChatService(user?.userId);
  const {
    sendMessage,
    sendWithFileMessage,
    createRoom,
    inviteToRoomMembers,
    selectRoom,
  } = chatService;

  console.log("PopupChatList 렌더링:", {
    user: user ? "있음" : "없음",
    chatRooms: chatRooms ? chatRooms.length : "없음",
    isLoading,
  });

  // 팝업 윈도우임을 부모에게 알림
  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage(
        {
          type: "POPUP_READY",
          data: { popupType: "chat-list" },
        },
        window.location.origin
      );
    }

    // 팝업이 닫힐 때 부모에게 알림
    const handleBeforeUnload = () => {
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "POPUP_CLOSING",
            data: { popupType: "chat-list" },
          },
          window.location.origin
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // ImageModal이 제대로 초기화되었는지 확인
  useEffect(() => {
    const checkImageModal = () => {
      console.log("ImageModal 초기화 확인:", {
        hasFunction: typeof window.openImageModal === "function",
      });
    };

    // 컴포넌트 마운트 후 잠시 대기 후 확인
    const timer = setTimeout(checkImageModal, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 채팅방 목록 로드 - 최대한 간소화
  useEffect(() => {
    console.log("PopupChatList useEffect:", {
      userId: user?.userId,
      hasRooms: chatRooms?.length || 0,
    });

    if (user?.userId && chatService) {
      console.log("사용자 정보 있음, 채팅방 목록 로드 시도");
      setIsLoading(true);

      // 직접 fetchRoomList 호출
      chatService
        .fetchRoomList()
        .then(() => {
          console.log("채팅방 목록 로드 성공");
        })
        .catch((error) => {
          console.error("채팅방 목록 로드 실패:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [user?.userId]); // chatService 의존성 제거

  // 검색 필터링
  useEffect(() => {
    console.log("검색 필터링:", {
      chatRooms: chatRooms ? chatRooms.length : "없음",
      searchTerm,
    });

    if (!chatRooms || chatRooms.length === 0) {
      // 개발용 더미 데이터 (API가 응답하지 않을 때)
      if (process.env.NODE_ENV === "development" && user?.userId) {
        const dummyRooms = [
          {
            id: "room1",
            name: "개발팀 채팅",
            type: "GROUP",
            participants: [
              { userId: user.userId, nickname: user.nickname || "나" },
              { userId: "user2", nickname: "팀원1" },
              { userId: "user3", nickname: "팀원2" },
            ],
            lastMessage: { content: "안녕하세요!" },
            unreadCount: 2,
          },
          {
            id: "room2",
            name: "프로젝트 논의",
            type: "GROUP",
            participants: [
              { userId: user.userId, nickname: user.nickname || "나" },
              { userId: "user4", nickname: "매니저" },
            ],
            lastMessage: { content: "회의 시간 조정해주세요" },
            unreadCount: 0,
          },
        ];
        setFilteredRooms(dummyRooms);
        return;
      }

      setFilteredRooms([]);
      return;
    }

    const filtered = chatRooms.filter((room) => {
      // 검색어 필터
      if (!searchTerm.trim()) {
        return true;
      }

      const searchLower = searchTerm.toLowerCase();

      // 채팅방 이름으로 검색
      if (room.name?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // 1:1 채팅방의 경우 상대방 닉네임으로 검색
      if (room.type === RoomType.INDIVIDUAL) {
        const otherMember = room.members?.find(
          (member) => member.userId !== user?.userId
        );
        if (otherMember?.nickname?.toLowerCase().includes(searchLower)) {
          return true;
        }
      }

      // 그룹 채팅방의 경우 참여자 닉네임으로 검색
      if (
        room.participants?.some((p) =>
          p.nickname?.toLowerCase().includes(searchLower)
        )
      ) {
        return true;
      }

      // members 배열도 확인 (데이터 구조에 따라)
      if (
        room.members?.some((m) =>
          m.nickname?.toLowerCase().includes(searchLower)
        )
      ) {
        return true;
      }

      return false;
    });

    console.log("필터링된 채팅방:", filtered.length);
    setFilteredRooms(filtered);
  }, [chatRooms, searchTerm, user]);
  // 채팅방 선택 시 새 팝업에서 채팅방 열기
  const handleRoomSelect = (room) => {
    console.log("채팅방 선택:", room);
    console.log("채팅방 멤버 정보:", room.members);

    // 안읽은 메시지 수 초기화
    if (room.unreadCount && room.unreadCount > 0) {
      room.unreadCount = 0;
    }

    // 새 팝업에서 채팅방 열기
    const popupWidth = 800;
    const popupHeight = 600;
    const screenLeft = window.screenLeft || window.screenX || 0;
    const screenTop = window.screenTop || window.screenY || 0;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    
    // 랜덤 위치 조정 (-200 ~ 200)
    const randomX = Math.floor(Math.random() * 401) - 200;
    const randomY = Math.floor(Math.random() * 401) - 200;
    
    const left = screenLeft + (screenWidth - popupWidth) / 2 + randomX;
    const top = screenTop + (screenHeight - popupHeight) / 2 + randomY;

    const popupFeatures = [
      `width=${popupWidth}`,
      `height=${popupHeight}`,
      `left=${left}`,
      `top=${top}`,
      'resizable=yes',
      'scrollbars=yes',
      'location=no',
      'menubar=no',
      'toolbar=no',
      'status=no'
    ].join(',');

    const chatUrl = `/popup-chat/room/${room.id}`;
    console.log(left, top, screenWidth, screenHeight);
    const popup = window.open(chatUrl, `chat-${room.id}`, popupFeatures);

    if (popup) {
      popup.focus();
    } else {
      console.error("팝업 차단됨 - 브라우저 설정을 확인해주세요");
    }
  };

  // 채팅방 목록으로 돌아가기
  const handleBackToList = () => {
    console.log("채팅방 목록으로 돌아가기");

    // 로컬 상태 초기화
    setSelectedRoom(null);

    // activeRoom 상태도 초기화 (채팅방에서 나가기)
    if (chatService?.selectRoom) {
      // null을 전달하여 채팅방에서 나가기
      chatService.selectRoom(null).then(() => {
        console.log("채팅방에서 나가기 완료");
      });
    }
  };

  // 메시지 전송 함수
  const handleSendMessage = useCallback(
    async (content, replyId, replyContent) => {
      if (!sendMessage) return false;

      try {
        const result = sendMessage(content, replyId, replyContent);
        if (result) {
          setAutoScroll(true);
        }
        return result;
      } catch (error) {
        console.error("메시지 전송 실패:", error);
        return false;
      }
    },
    [sendMessage]
  );

  // 팝업 닫기
  const handleClose = () => {
    window.close();
  };

  // 검색된 사용자 선택 시 DM 방 생성 또는 기존 방으로 이동
  const handleMemberSelect = useCallback(
    async (member) => {
      try {
        console.log("사용자 선택:", member);

        // 기존에 해당 사용자와의 DM 방이 있는지 확인
        const existingRoom = chatRooms.find(
          (room) =>
            room.type === RoomType.INDIVIDUAL &&
            room.members?.some((m) => m.userId === member.id)
        );

        if (existingRoom) {
          // 기존 방으로 이동
          console.log("기존 DM 방 발견, 해당 방으로 이동:", existingRoom);
          handleRoomSelect(existingRoom);
        } else {
          // 새 DM 방 생성
          console.log("새 DM 방 생성");
          const roomName = `${user?.nickname || "Me"} & ${member.nickname}`;

          // DM 방 생성 (RoomType.INDIVIDUAL 사용)
          const newRoom = await createRoom(roomName, RoomType.INDIVIDUAL);

          if (newRoom) {
            // 상대방을 방에 초대
            const inviteRequest = {
              roomId: newRoom.id,
              userId: user?.userId,
              targetUserId: member.id,
              nickname: member.nickname,
            };

            await inviteToRoomMembers([inviteRequest]);

            // 생성된 방으로 이동
            console.log("새 DM 방 생성 완료, 방으로 이동");
            // fetchRoomList를 다시 호출해서 최신 방 목록을 가져온 후 방 선택
            await chatService.fetchRoomList();

            // 잠시 후 방 선택 (방 목록이 업데이트되길 기다림)
            setTimeout(() => {
              const updatedRoom = chatRooms.find(
                (room) => room.id === newRoom.id
              );
              if (updatedRoom) {
                handleRoomSelect(updatedRoom);
              }
            }, 500);
          }
        }

        // 검색 모드 종료
        setShowUserSearch(false);
        setSearchTerm("");
      } catch (error) {
        console.error("DM 방 생성/이동 오류:", error);
      }
    },
    [
      chatRooms,
      user,
      createRoom,
      inviteToRoomMembers,
      chatService,
      handleRoomSelect,
    ]
  );

  // 방 만들기 핸들러
  const handleCreateRoom = useCallback(
    async (name, type, members) => {
      if (!name.trim()) return;

      try {
        console.log("팝업에서 방 만들기:", { name, type, members });

        // 채팅방 생성
        const roomId = await createRoom(name, type);

        // 선택된 멤버가 있으면 초대 로직 실행
        if (members.length > 0 && roomId) {
          try {
            const inviterName =
              user?.nickname || user?.email?.split("@")[0] || "사용자";
            const memberRequests = members.map((member) => ({
              roomId: roomId.id,
              userId: user?.userId,
              targetUserId: member.id,
              nickname: member.nickname,
            }));
            console.log("멤버 초대 요청:", memberRequests);
            await inviteToRoomMembers(memberRequests);
          } catch (error) {
            console.error("멤버 초대 오류:", error);
          }
        }

        // 채팅방 목록 새로고침은 useChatService에서 자동으로 처리됨
        console.log("방 만들기 완료");
      } catch (error) {
        console.error("방 만들기 오류:", error);
      }
    },
    [createRoom, inviteToRoomMembers, user]
  );

  // chatV2와 동일하게 드롭 이벤트 처리
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      // 파일 타입별로 분류
      const imageFiles = filesArray.filter((file) =>
        file.type.startsWith("image/")
      );
      const videoFiles = filesArray.filter((file) =>
        file.type.startsWith("video/")
      );
      const documentFiles = filesArray.filter(
        (file) =>
          !file.type.startsWith("image/") && !file.type.startsWith("video/")
      );
      // 각각 이벤트로 전달
      if (imageFiles.length > 0) {
        window.dispatchEvent(
          new CustomEvent("dropFiles", {
            detail: { files: imageFiles, type: "image" },
          })
        );
      }
      if (videoFiles.length > 0) {
        window.dispatchEvent(
          new CustomEvent("dropFiles", {
            detail: { files: videoFiles, type: "video" },
          })
        );
      }
      if (documentFiles.length > 0) {
        window.dispatchEvent(
          new CustomEvent("dropFiles", {
            detail: { files: documentFiles, type: "file" },
          })
        );
      }
    }
  }, []);

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
    },
    [isDragging]
  );

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* 드래그앤드롭 오버레이 */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 pointer-events-none">
          <div className="bg-white rounded-lg p-8 text-center shadow-lg">
            <div className="text-2xl mb-4">📁</div>
            <p className="text-lg font-medium">파일을 여기에 드롭하세요</p>
            <p className="text-sm text-gray-500 mt-2">
              이미지, 동영상, 문서를 업로드할 수 있습니다
            </p>
          </div>
        </div>
      )}
      {/* 선택된 채팅방이 있으면 채팅 화면, 없으면 채팅방 목록 */}
      {selectedRoom || activeRoom ? (
        /* 채팅 화면 */
        <div
          className="h-full flex"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          {/* 메인 채팅 영역 */}
          <div
            className="flex-1 flex flex-col min-h-0"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            {/* 채팅방 헤더 - Header 컴포넌트 사용 */}
            <div className="relative">
              {/* 뒤로가기 버튼 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft size={16} />
              </Button>{" "}
              {/* 기존 헤더 기능 */}
              <Header
                setFixedMessageModalOpen={setFixedMessageModalOpen}
                toggleMobileMembersSidebar={toggleMembersSidebar}
                isMobileMembersSidebarOpen={isMembersSidebarOpen}
                toggleMobileSidebar={() => {}}
                connectionStatus="연결됨"
                isPopup={true}
                onClose={handleClose}
              />
              
            </div>

            {/* 고정된 메시지 헤더 */}
            <div className="flex-shrink-0">
              <FixedMessageHeader
                isOpen={fixedMessageModalOpen}
                setIsOpen={setFixedMessageModalOpen}
                isPopup={true}
              />
            </div>

            {/* 채팅 메시지 영역 */}
            <div className="flex-1 min-h-0">
              <Main
                autoScroll={autoScroll}
                setAutoScroll={setAutoScroll}
                user={user}
                activeRoom={activeRoom}
                messages={messages}
                setMessages={setMessages}
                isPopup={true}
              />
            </div>

            {/* 메시지 입력 영역 */}
            <div className="flex-shrink-0">
              <MessageInput
                sendMessage={handleSendMessage}
                sendWithFileMessage={sendWithFileMessage}
                setAutoScroll={setAutoScroll}
                isPopup={true}
                disabled={false}
              />
            </div>
          </div>{" "}
          {/* 멤버 사이드바 (팝업/모바일에서 슬라이드) */}
          {isMembersSidebarOpen && (
            <>
              {/* 오버레이 */}
              <div
                className="fixed inset-0 z-40 transition-opacity duration-300 lg:hidden"
                style={{
                  background: "rgba(30, 41, 59, 0.12)",
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)",
                }}
                onClick={() => setIsMembersSidebarOpen(false)}
              />
              {/* 슬라이드 패널 */}
              <div
                className={`fixed top-0 right-0 h-full bg-white dark:bg-gray-900 z-50 shadow-xl flex flex-col transition-transform duration-300 ease-in-out
                  translate-x-0 w-[90vw] max-w-xs min-w-[320px] sm:w-96 sm:max-w-sm`}
                style={{ boxShadow: "rgba(0,0,0,0.15) -4px 0px 24px" }}
              >
                {/* 닫기 버튼 및 헤더 */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2 border-gray-200 dark:border-gray-700">
                  <button
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => setIsMembersSidebarOpen(false)}
                    aria-label="멤버 목록 닫기"
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>{" "}
                <div className="flex-1 overflow-y-auto px-0 pb-4">
                  <PopupMembersSidebar
                    room={selectedRoom || activeRoom}
                    onClose={() => setIsMembersSidebarOpen(false)}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* 채팅방 목록 화면 */
        <>
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} className="text-blue-500" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                채팅방 목록
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {/* 방 만들기 버튼 */}
              <CreateRoomDialog onCreateRoom={handleCreateRoom} />

              {/* 사용자 검색 버튼 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserSearch(!showUserSearch)}
                className={cn(
                  "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                  showUserSearch && "text-blue-500 hover:text-blue-600"
                )}
                title="사용자 검색"
              >
                <User size={16} />
              </Button>
            </div>
          </div>

          {/* 검색 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <Input
                placeholder="채팅방 이름 또는 참여자 닉네임으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 검색 결과 안내 */}
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                "{searchTerm}"에 대한 검색 결과: {filteredRooms.length}개
              </div>
            )}
          </div>

          {/* 사용자 검색 컴포넌트 */}
          {showUserSearch && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
              <div className="mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  사용자 검색 및 DM 시작
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  닉네임으로 사용자를 검색하여 즐겨찾기에 추가하거나 DM을
                  시작하세요
                </p>
              </div>
              <SearchMember onMemberSelect={handleMemberSelect} />
            </div>
          )}

          {/* 채팅방 목록 */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">로딩 중...</p>
                </div>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-center text-gray-500 dark:text-gray-400 px-4">
                <div>
                  <MessageCircle
                    size={32}
                    className="mx-auto mb-2 text-gray-400"
                  />
                  <p className="text-sm">
                    {searchTerm
                      ? "검색 결과가 없습니다."
                      : "채팅방이 없습니다."}
                  </p>
                  {chatRooms && chatRooms.length === 0 && (
                    <p className="text-xs mt-2">
                      채팅방을 생성하거나 초대를 받아보세요.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full max-h-[calc(100vh-200px)]">
                <div className="space-y-0.5 py-2 px-2">
                  {filteredRooms.map((room) => {
                    const unreadCount = room.unreadCount || 0;
                    const isActive =
                      selectedRoom?.id === room.id ||
                      activeRoom?.id === room.id;

                    return (
                      <button
                        key={room.id}
                        className={`flex items-center justify-between w-full p-2 rounded-lg text-left ${
                          isActive ? "bg-[#F5F5F5]" : "hover:bg-[#F5F5F5]"
                        }`}
                        onClick={() => handleRoomSelect(room)}
                      >
                        <div className="flex items-center">
                          <div className="relative mr-3 bg-[#FFC107] h-8 w-8 rounded-full flex items-center justify-center shadow-sm">
                            {room.type === "GROUP" ||
                            room.type === "GROUP_CHAT" ? (
                              <Users size={16} className="text-white" />
                            ) : (
                              <MessageSquare size={16} className="text-white" />
                            )}
                          </div>
                          <span
                            className={`truncate max-w-[140px] ${
                              isActive ? "text-gray-800" : "text-gray-600"
                            }`}
                          >
                            {room.type === "INDIVIDUAL" || room.type === "DM"
                              ? room.members?.find(
                                  (member) => member.userId !== user?.userId
                                )?.nickname ||
                                room.otherUser?.nickname ||
                                "1:1 대화방"
                              : room.name}
                          </span>
                        </div>

                        {/* 읽지 않은 메시지 수 표시 */}
                        {unreadCount > 0 && (
                          <span className="bg-[#FFC107] text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {/* 디버그 정보 (개발용) */}
            {process.env.NODE_ENV === "development" && (
              <div className="p-2 bg-gray-100 text-xs text-gray-600 border-t">
                사용자: {user ? "✓" : "✗"} | 채팅방:{" "}
                {chatRooms ? chatRooms.length : "없음"} | 필터링:{" "}
                {filteredRooms.length} | 로딩: {isLoading ? "✓" : "✗"}
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              채팅방을 선택하면 이 창에서 채팅이 열립니다
            </p>
          </div>
        </>
      )}{" "}
      {/* 고정 메시지 모달 */}
      {/* 이미지 모달 */}
      <ImageModal />
    </div>
  );
}
