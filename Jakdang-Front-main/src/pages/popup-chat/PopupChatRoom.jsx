"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAtom, useAtomValue } from "jotai";
import { userInfoAtom } from "@/jotai/authAtoms";
import { activeChatRoomAtom, messagesAtom } from "@/jotai/chatAtoms";
import { useChatService } from "@/hooks/useChatService";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import { useStomp } from "@/hooks/useStomp";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/pages/chatv2/header";
import { MessageInput } from "@/pages/chatv2/input";
import { Main } from "@/pages/chatv2/main";
import { ImageModal } from "@/pages/chatv2/image-modal";
import { PopupMembersSidebar } from "@/components/popup-members-sidebar";
import { FixedMessageHeader } from "@/components/fixed-meesage-header";

export default function PopupChatRoom() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const userInfoParam = searchParams.get("userInfo");
  const [user, setUser] = useAtom(userInfoAtom);
  const [activeRoom, setActiveRoom] = useAtom(activeChatRoomAtom);
  const [messages, setMessages] = useAtom(messagesAtom);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("대기중");
  const [autoScroll, setAutoScroll] = useState(true);
  const [isMembersSidebarOpen, setIsMembersSidebarOpen] = useState(false);
  const [fixedMessageModalOpen, setFixedMessageModalOpen] = useState(false);
  const { toast } = useToast();

  const { connect, connected, subscribe, unsubscribe, send, checkConnection } = useStomp();
  const { selectRoom, fetchRoomList, sendMessage, sendWithFileMessage } = useChatService(user?.userId);
  const { fetchGet } = useAxiosQuery();

  // 뒤로가기 핸들러
  const handleBackToList = async () => {
    try {
      if (selectRoom) {
        await selectRoom(null);
      }
      setActiveRoom(null);
      window.location.href = "/popup-chat";
    } catch (error) {
      console.error("뒤로가기 처리 중 오류:", error);
      window.location.href = "/popup-chat";
    }
  };

  // 팝업 환경에서 인증 정보 초기화
  useEffect(() => {
    console.log("팝업 인증 정보 초기화 시작");
    
    const token = localStorage.getItem("access-token");
    const userInfoKeys = ["user-info", "userInfo", "user_info", "authUser"];
    let userInfo = null;

    // URL 파라미터에서 userInfo 확인
    if (userInfoParam && userInfoParam !== "undefined" && userInfoParam !== "null") {
      try {
        userInfo = JSON.parse(decodeURIComponent(userInfoParam));
        console.log("URL 파라미터에서 사용자 정보 획득:", userInfo);
      } catch (e) {
        console.log("URL 파라미터 userInfo 파싱 실패:", e);
      }
    }

    // localStorage에서 사용자 정보 확인
    if (!userInfo) {
      for (const key of userInfoKeys) {
        const userInfoStr = localStorage.getItem(key);
        if (userInfoStr && userInfoStr !== "undefined" && userInfoStr !== "null") {
          try {
            const parsed = JSON.parse(userInfoStr);
            if (parsed && typeof parsed === "object" && (parsed.userId || parsed.id)) {
              userInfo = parsed;
              console.log(`유효한 사용자 정보 발견 - ${key}:`, userInfo);
              break;
            }
          } catch (e) {
            console.log(`${key} 파싱 실패:`, e);
          }
        }
      }
    }

    if (token && userInfo) {
      try {
        const userId = userInfo.userId || userInfo.id || userInfo.user_id;
        const nickname = userInfo.nickname || userInfo.name || userInfo.displayName;

        if (userId && userId.toString().trim() !== "") {
          const normalizedUser = {
            ...userInfo,
            userId: userId.toString().trim(),
            nickname: nickname || userId,
            id: userInfo.id || userId,
          };

          console.log("정규화된 사용자 정보:", normalizedUser);
          setUser(normalizedUser);
        }
      } catch (error) {
        console.error("사용자 정보 파싱 실패:", error);
      }
    }

    // 부모 윈도우에 알림
    if (window.opener) {
      window.opener.postMessage(
        {
          type: "POPUP_READY",
          data: { popupType: "chat-room", roomId },
        },
        window.location.origin
      );
    }
  }, [roomId, setUser]);

  // WebSocket 연결 및 채팅방 초기화
  useEffect(() => {
    let isMounted = true;
    let initTried = false;

    const checkAndInitialize = async () => {
      if (initTried || !roomId) return;

      // 사용자 정보 확인
      let actualUserId = user?.userId;
      if (!actualUserId) {
        const userInfoStr = localStorage.getItem("user-info");
        if (userInfoStr) {
          try {
            const userInfo = JSON.parse(userInfoStr);
            actualUserId = userInfo?.userId || userInfo?.id || userInfo?.user_id;
            if (actualUserId) {
              actualUserId = actualUserId.toString().trim();
            }
          } catch (e) {
            console.error("localStorage 사용자 정보 파싱 실패:", e);
          }
        }
      }

      if (!actualUserId) {
        setTimeout(() => {
          if (isMounted) checkAndInitialize();
        }, 2000);
        return;
      }

      // WebSocket 연결
      if (!connected) {
        console.log("WebSocket 연결 시도...");
        try {
          connect();
          setTimeout(() => {
            if (isMounted) checkAndInitialize();
          }, 3000);
          return;
        } catch (error) {
          console.error("WebSocket 연결 실패:", error);
          setTimeout(() => {
            if (isMounted) checkAndInitialize();
          }, 3000);
          return;
        }
      }

      // 채팅방 초기화
      initTried = true;
      try {
        if (isMounted) {
          setIsLoading(true);
          setConnectionStatus("연결중...");
        }

        console.log("채팅방 목록 로드 중...");
        await fetchRoomList();
        
        if (!isMounted) return;

        console.log("채팅방 선택 시도:", roomId);
        const success = await selectRoom(roomId);
        
        if (!isMounted) return;

        if (success) {
          console.log("채팅방 선택 성공");
          setConnectionStatus("연결됨");
        } else {
          throw new Error("채팅방 선택 실패");
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("채팅 초기화 실패:", error);
        setConnectionStatus("연결 실패");
        toast({
          title: "연결 실패",
          description: error.message || "채팅방에 연결할 수 없습니다.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkAndInitialize();
    return () => { isMounted = false; };
  }, [connected, user?.userId, roomId]);

  // 메시지 전송 핸들러
  const handleSendMessage = useCallback(
    async (content, replyId, replyContent) => {
      if (!connected) {
        toast({
          title: "연결 오류",
          description: "메시지 서비스에 연결되어 있지 않습니다.",
          variant: "destructive",
        });
        return false;
      }

      try {
        const result = sendMessage(content, replyId, replyContent);
        if (result) {
          setAutoScroll(true);
        }
        return result;
      } catch (err) {
        console.error("메시지 전송 중 오류 발생:", err);
        toast({
          title: "메시지 전송 오류",
          description: "메시지를 전송하지 못했습니다.",
          variant: "destructive",
        });
        return false;
      }
    },
    [connected, sendMessage, toast, setAutoScroll]
  );

  // 멤버 사이드바 토글
  const toggleMembersSidebar = () => {
    setIsMembersSidebarOpen(!isMembersSidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">채팅방을 로드하는 중...</p>
        </div>
      </div>
    );
  }

  if (!activeRoom) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">채팅방을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* 채팅방 헤더 */}
      <div className="flex-shrink-0">
        <div className="relative">
          {/* 뒤로가기 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft size={16} />
          </Button>
          {/* 헤더 */}
          <Header
            activeRoom={activeRoom}
            connectionStatus={connectionStatus}
            toggleMobileMembersSidebar={toggleMembersSidebar}
            isMobileMembersSidebarOpen={isMembersSidebarOpen}
            toggleMobileSidebar={() => {}}
            setFixedMessageModalOpen={setFixedMessageModalOpen}
            isPopup={true}
          />
        </div>
      </div>

      {/* 고정된 메시지 헤더 */}
      <div className="flex-shrink-0">
        <FixedMessageHeader
          isOpen={fixedMessageModalOpen}
          setIsOpen={setFixedMessageModalOpen}
          isPopup={true}
        />
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-hidden min-h-0">
        <Main
          messages={messages}
          autoScroll={autoScroll}
          setAutoScroll={setAutoScroll}
          isPopup={true}
        />
      </div>

      {/* 메시지 입력 */}
      <div className="flex-shrink-0">
        <MessageInput
          sendMessage={handleSendMessage}
          sendWithFileMessage={sendWithFileMessage}
          setAutoScroll={setAutoScroll}
          isPopup={true}
          disabled={!connected}
        />
      </div>

      {/* 이미지 모달 */}
      <ImageModal />

      {/* 멤버 사이드바 */}
      {isMembersSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 transition-opacity duration-300 lg:hidden"
            style={{
              background: "rgba(30, 41, 59, 0.12)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
            onClick={() => setIsMembersSidebarOpen(false)}
          />
          <div
            className={`fixed top-0 right-0 h-full bg-white dark:bg-gray-900 z-50 shadow-xl flex flex-col transition-transform duration-300 ease-in-out
              translate-x-0 w-[90vw] max-w-xs min-w-[320px] sm:w-96 sm:max-w-sm`}
            style={{ boxShadow: "rgba(0,0,0,0.15) -4px 0px 24px" }}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-gray-200 dark:border-gray-700">
              <button
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setIsMembersSidebarOpen(false)}
                aria-label="멤버 목록 닫기"
              >
                <svg
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
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
            </div>
            <div className="flex-1 overflow-y-auto px-0 pb-4">
              <PopupMembersSidebar
                room={activeRoom}
                onClose={() => setIsMembersSidebarOpen(false)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
