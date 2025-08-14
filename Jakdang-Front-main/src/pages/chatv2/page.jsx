"use client";

import { useToast } from "@/components/ui/use-toast";
import { useChatService } from "@/hooks/useChatService";
import { useStomp } from "@/hooks/useStomp";
import { userInfoAtom, accessTokenAtom } from "@/jotai/authAtoms";
import { activeChatRoomAtom, errorAtom, messagesAtom } from "@/jotai/chatAtoms";
import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "./header";
import { MessageInput } from "./input";
import { Main } from "./main";
import { Sidebar } from "./sidebar";
import { ImageModal } from "./image-modal";
import { MembersSidebar } from "@/components/members-sidebars";
import { FixedMessageHeader } from "@/components/fixed-meesage-header";
import { useMediaQuery } from "@/hooks/use-media-query.jsx";
import { MobileSidebar } from "@/components/chat/MobileSidebar.jsx";
import FriendsList from "@/components/friends/FriendsList";

function ChatApp() {
  const [searchParams] = useSearchParams();
  const isPopup = searchParams.get('popup') === 'true';
  const roomIdFromUrl = searchParams.get('roomId');
  const tokenFromUrl = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("대기중");
  const [user] = useAtom(userInfoAtom);
  const setAccessToken = useSetAtom(accessTokenAtom);
  const [error] = useAtom(errorAtom);
  const setError = useSetAtom(errorAtom);
  const { toast } = useToast();
  const [messages, setMessages] = useAtom(messagesAtom);

  // 자동 스크롤 상태를 위한 상태 추가
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeRoom] = useAtom(activeChatRoomAtom);

  const isMobile = useMediaQuery("(max-width: 1023px)");

  // 멤버 사이드바 상태 추가
  const [isMembersSidebarOpen, setIsMembersSidebarOpen] = useState(false);

  // 고정 메시지 모달 상태 추가
  const [isFixedMessageModalOpen, setIsFixedMessageModalOpen] = useState(false);

  // 모바일 사이드바 상태 추가
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 모바일 멤버 사이드바 토글 상태 추가
  const [isMobileMembersSidebarOpen, setIsMobileMembersSidebarOpen] =
    useState(false);
  const [height, setHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // 팝업 모드 초기화 (가장 먼저 실행)
  useEffect(() => {
    if (isPopup) {
      console.log('팝업 모드 초기화 시작', { roomIdFromUrl, tokenFromUrl });
      
      // 팝업 모드에서 토큰 처리
      if (tokenFromUrl) {
        console.log('URL에서 토큰 받음:', tokenFromUrl);
        localStorage.setItem('accessToken', tokenFromUrl);
        setAccessToken(tokenFromUrl);
      }

      // 부모 윈도우에 팝업 준비 완료 알림
      if (window.opener) {
        console.log('부모 윈도우에 팝업 준비 완료 알림');
        window.opener.postMessage({
          type: 'POPUP_READY',
          data: { popupType: 'chat-room', roomId: roomIdFromUrl }
        }, window.location.origin);
      }

      // 부모 윈도우로부터 메시지 수신
      const handleMessage = (event) => {
        if (event.origin !== window.location.origin) return;

        const { type, data } = event.data;
        console.log('팝업에서 메시지 수신:', { type, data });
        
        if (type === 'AUTH_INFO') {
          if (data.token) {
            console.log('부모로부터 토큰 받음:', data.token);
            localStorage.setItem('accessToken', data.token);
            setAccessToken(data.token);
          }
          if (data.userInfo) {
            console.log('부모로부터 사용자 정보 받음');
            localStorage.setItem('userInfo', JSON.stringify(data.userInfo));
          }
        }
      };

      window.addEventListener('message', handleMessage);
      
      // 팝업이 닫힐 때 부모에게 알림
      const handleBeforeUnload = () => {
        if (window.opener) {
          console.log('팝업 닫힘 알림');
          window.opener.postMessage({
            type: 'POPUP_CLOSING',
            data: { popupType: 'chat-room', roomId: roomIdFromUrl }
          }, window.location.origin);
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('message', handleMessage);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [isPopup, tokenFromUrl, roomIdFromUrl, setAccessToken]);

  useEffect(() => {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const initialWindowHeight = window.innerHeight;

    // 실제 뷰포트 높이 계산
    const updateHeight = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialWindowHeight - currentHeight;
      const isKeyboardOpen = heightDifference > 100;

      setIsKeyboardVisible(isKeyboardOpen);

      if (isKeyboardOpen) {
        if (isIOS) {
          // iOS에서는 visualViewport.height를 직접 사용
          const viewportHeight = window.visualViewport.height;
          setHeight(viewportHeight - 65); // 헤더만 제외
          // 스크롤 위치 조정
          requestAnimationFrame(() => {
            window.scrollTo(0, 0);
          });
        } else {
          // 안드로이드는 이전과 동일하게 처리
          setHeight(currentHeight - 65);
        }
      } else {
        setHeight(currentHeight - 130); // 헤더 + 푸터 높이 빼기
      }
    };

    updateHeight(); // 처음 실행

    // visualViewport API 사용
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateHeight);
      window.visualViewport.addEventListener("scroll", updateHeight);
    }

    // 기본 resize 이벤트도 함께 사용
    window.addEventListener("resize", updateHeight);

    // 입력 필드 포커스/블러  이벤트 처리
    const inputs = document.querySelectorAll("input, textarea");
    const handleFocus = () => {
      setIsKeyboardVisible(true);
      if (isIOS) {
        // iOS에서 포커스시 즉시 높이 업데이트
        requestAnimationFrame(() => {
          updateHeight();
          // 스크롤 위치 조정을 약간 지연
          setTimeout(() => {
            window.scrollTo(0, 0);
          }, 50);
        });
      }
    };

    const handleBlur = () => {
      setIsKeyboardVisible(false);
      if (isIOS) {
        // iOS에서 블러시 약간의 지연 후 높이 업데이트
        setTimeout(() => {
          updateHeight();
        }, 100);
      } else {
        updateHeight();
      }
    };

    inputs.forEach((input) => {
      input.addEventListener("focus", handleFocus);
      input.addEventListener("blur", handleBlur);
    });

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateHeight);
        window.visualViewport.removeEventListener("scroll", updateHeight);
      }
      window.removeEventListener("resize", updateHeight);
      inputs.forEach((input) => {
        input.removeEventListener("focus", handleFocus);
        input.removeEventListener("blur", handleBlur);
      });
    };
  }, []);

  // 모바일 멤버 사이드바 토글 함수 추가
  const toggleMobileMembersSidebar = () => {
    if (isMobileMembersSidebarOpen) {
      setIsMobileMembersSidebarOpen(false);
    } else {
      setIsMobileMembersSidebarOpen(true);
      // 멤버 사이드바를 열 때 채널 사이드바는 닫기
      setIsMobileSidebarOpen(false);
    }
  };
  // 서비스 초기화
  const { sendMessage, fetchRoomList, sendWithFileMessage, selectRoom } = useChatService(
    user?.userId
  );

  // STOMP 연결 초기화
  const { connected, checkConnection } = useStomp();
  // 팝업 모드에서 roomId 자동 선택 및 채팅방 목록 로드
  useEffect(() => {
    if (isPopup && user?.userId && connected) {
      console.log('팝업 모드 API 초기화', { roomIdFromUrl, userId: user.userId, connected });
      
      // 먼저 채팅방 목록을 로드
      if (fetchRoomList) {
        console.log('팝업 모드: 채팅방 목록 로드');
        fetchRoomList().then(() => {
          // 채팅방 목록 로드 후 특정 roomId가 있으면 자동 선택
          if (roomIdFromUrl && selectRoom) {
            console.log('팝업 모드: 채팅방 자동 선택', roomIdFromUrl);
            selectRoom(roomIdFromUrl).then((success) => {
              if (success) {
                console.log('팝업 모드: 채팅방 선택 성공');
              } else {
                console.warn('팝업 모드: 채팅방 선택 실패');
              }
            });
          }
        }).catch((error) => {
          console.error('팝업 모드: 채팅방 목록 로드 실패', error);
        });
      }
    }
  }, [isPopup, user?.userId, connected, fetchRoomList, selectRoom, roomIdFromUrl]);

  // 초기 로딩 상태
  useEffect(() => {
    // 컴포넌트가 마운트되면 로딩 상태 해제
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(loadingTimeout);
  }, []);

  // 주기적으로 연결 상태 확인
  useEffect(() => {
    if (!user?.userId) return;

    // 연결 상태 모니터링
    const checkConnectionStatus = () => {
      const isConnected = checkConnection();

      if (isConnected) {
        setConnectionStatus("연결됨");
      } else {
        setConnectionStatus("재연결 중...");
        console.log("연결 상태 점검: 연결이 끊어졌습니다. 재연결 시도 중...");
      }
    };

    // 초기 연결 확인
    checkConnectionStatus();

    // 5초마다 연결 상태 확인 및 필요시 재연결
    const connectionCheckInterval = setInterval(checkConnectionStatus, 5000);

    return () => clearInterval(connectionCheckInterval);
  }, [user?.userId, checkConnection]);
  // STOMP 연결 상태 추적 - 데이터 로딩 로직 수정
  useEffect(() => {
    if (connected) {
      console.log("웹소켓 연결됨");
      setConnectionStatus("연결됨");

      // 연결 성공 시 데이터 새로고침 - 팝업 모드가 아닌 경우에만
      if (user?.userId && !window.dataLoaded && !isPopup) {
        window.dataLoaded = true;

        // 일반 모드에서만 채팅방 목록 자동 로드
        if (fetchRoomList) {
          console.log("일반 모드: 자동 채팅방 목록 로드");
          fetchRoomList();
        }

        // 연결 성공 토스트 표시
        toast({
          title: "채팅 연결 성공",
          description: "메시지 서비스에 연결되었습니다.",
          variant: "default",
        });
      } else if (isPopup) {
        console.log("팝업 모드: 웹소켓 연결됨, 자동 로드 스킵");
      }
    } else {
      console.log("웹소켓 연결 대기 중...");
      setConnectionStatus("대기중");
      // 연결이 끊어지면 플래그 초기화
      window.dataLoaded = false;
    }
  }, [connected, user?.userId, fetchRoomList, toast, isPopup]);

  // 오류 발생 시 토스트 알림 표시
  useEffect(() => {
    if (error) {
      toast({
        title: "오류 발생",
        description: error,
        variant: "destructive",
      });
      // 에러 메시지 표시 후 초기화
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  }, [error, toast, setError]);

  // 디바운스 함수 - 메시지 전송 중복 방지
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
      return timeout;
    };
  };

  // 메시지 전송 처리 함수 - 디바운스 적용
  const handleSendMessage = useCallback(
    debounce(async (content, replyId, replyContent) => {
      if (!connected) {
        toast({
          title: "연결 오류",
          description:
            "메시지 서비스에 연결되어 있지 않습니다. 잠시 후 다시 시도해주세요.",
          variant: "destructive",
        });

        // 재연결 시도
        checkConnection();
        return false;
      }

      try {
        console.log("메시지 전송 시도:", { contentLength: content?.length });
        const result = sendMessage(content, replyId, replyContent);

        if (!result) {
          toast({
            title: "메시지 전송 실패",
            description: "메시지를 전송하지 못했습니다. 다시 시도해주세요.",
            variant: "destructive",
          });
        } else {
          // 메시지 전송 성공 시 자동 스크롤 활성화
          setAutoScroll(true);
        }

        return result;
      } catch (err) {
        console.error("메시지 전송 중 오류 발생:", err);
        toast({
          title: "메시지 전송 오류",
          description:
            "메시지 전송 중 오류가 발생했습니다: " +
            (err.message || "알 수 없는 오류"),
          variant: "destructive",
        });
        return false;
      }
    }, 300), // 300ms 디바운스
    [connected, sendMessage, toast, checkConnection, setAutoScroll]
  );

  // 채팅방 변경 시 자동 스크롤 활성화
  useEffect(() => {
    console.log("채팅방 변경됨, 자동 스크롤 활성화");
    setAutoScroll(true);
  }, [activeRoom?.id]);

  // 로그인되지 않은 경우
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-white flex-col">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          로그인이 필요합니다
        </h2>
        <p className="text-gray-600">채팅 기능을 사용하려면 로그인해주세요.</p>
      </div>
    );
  }

  // 모바일 사이드바 토글 함수
  const toggleMobileSidebar = () => {
    if (isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    } else {
      setIsMobileSidebarOpen(true);
      // 채널 사이드바를 열 때 멤버 사이드바는 닫기
      setIsMobileMembersSidebarOpen(false);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    // 드래그가 컨테이너 밖으로 완전히 나갔는지 확인
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // MessageInput 컴포넌트로 파일 전달을 위한 커스텀 이벤트 발생
      const filesArray = Array.from(files);

      // 파일 타입별로 분류
      const imageFiles = filesArray.filter((file) => file.type.startsWith("image/"));
      const videoFiles = filesArray.filter((file) => file.type.startsWith("video/"));
      const documentFiles = filesArray.filter(
        (file) => !file.type.startsWith("image/") && !file.type.startsWith("video/")
      );

      // 각 타입별로 파일 선택 이벤트 발생
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
  return (
    <div
      className={`flex bg-white text-gray-800 flex-col overflow-hidden ${
        isPopup 
          ? "w-full h-screen" 
          : "w-full lg:w-[1280px] mx-auto shadow-xl"
      }`}
      style={
        isPopup 
          ? {} 
          : {
              height: `${height}px`,
              marginTop: "65px",
              marginBottom: !isMobile ? "10px" : isKeyboardVisible ? "0px" : "65px",
              position:
                isKeyboardVisible && /iPad|iPhone|iPod/.test(navigator.userAgent)
                  ? "fixed"
                  : "relative",
              top:
                isKeyboardVisible && /iPad|iPhone|iPod/.test(navigator.userAgent)
                  ? "0"
                  : "auto",
              left:
                isKeyboardVisible && /iPad|iPhone|iPod/.test(navigator.userAgent)
                  ? "0"
                  : "auto",
              right:
                isKeyboardVisible && /iPad|iPhone|iPod/.test(navigator.userAgent)
                  ? "0"
                  : "auto",
            }
      }
    >
      {/* 연결 상태 표시 */}
      {connected === false && (
        <div className="bg-amber-100 text-amber-800 text-center py-1 text-sm">
          <span>
            메시지 서비스 {connectionStatus} - 일부 실시간 기능이 제한될 수
            있습니다.
          </span>
        </div>
      )}      {/* 메인 UI */}
      <div 
        className="flex flex-1 relative overflow-hidden"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* 드래그 오버레이 */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-400 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-blue-600 font-bold text-xl mb-2">파일을 여기에 드롭하세요</p>
              <p className="text-blue-500 text-lg">이미지, 동영상, 문서 파일 업로드</p>
            </div>
          </div>
        )}        {/* 모바일 사이드바 - 팝업 모드에서는 숨김 */}
        {!isPopup && (
          <div
            className={`fixed inset-y-0 left-0 w-[264px] bg-white transform transition-transform duration-300 ease-in-out z-50 lg:hidden mt-[65px] mb-[65px] ${
              isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <MobileSidebar
              toggleSidebar={toggleMobileSidebar}
              selectPage={"chat"}
            />
          </div>
        )}

        {/* 데스크톱 사이드바 - 팝업 모드에서는 숨김 */}
        {!isMobile && !isPopup && (
          <div className="lg:relative flex">
            <div className="flex">
              <Sidebar />
            </div>
          </div>
        )}

        {/* 모바일 사이드바 오버레이 */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 bg-opacity-50 z-40 lg:hidden"
            onClick={toggleMobileSidebar}
          />
        )}

        {/* 메인 채팅 영역 */}
        <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
          {/* 헤더 컴포넌트 */}          <Header
            setFixedMessageModalOpen={setIsFixedMessageModalOpen}
            toggleMobileMembersSidebar={toggleMobileMembersSidebar}
            isMobileMembersSidebarOpen={isMobileMembersSidebarOpen}
            toggleMobileSidebar={toggleMobileSidebar}
            connectionStatus={connectionStatus}
            isPopup={isPopup}
            onClose={isPopup ? () => window.close() : undefined}
          />

          {/* 고정 메시지 헤더 */}
          <FixedMessageHeader
            isOpen={isFixedMessageModalOpen}
            setIsOpen={setIsFixedMessageModalOpen}
          />          {/* 메인 콘텐츠 영역 - 채팅과 멤버 사이드바 */}
          <div className="flex flex-row h-0 flex-1 overflow-hidden">
            <div className="flex flex-col h-full w-full overflow-hidden">
              {/* 메인 메시지 컴포넌트 */}
              <div
                className={`flex-1 min-h-0 overflow-hidden ${
                  isMobileMembersSidebarOpen ? "hidden lg:block" : "block"
                }`}
              >                {activeRoom === null ? (
                  isPopup ? (
                    <div className="flex h-full items-center justify-center text-gray-500">
                      <p>채팅방을 선택해주세요</p>
                    </div>
                  ) : (
                    <FriendsList />
                  )
                ) : (<Main
                    autoScroll={autoScroll}
                    setAutoScroll={setAutoScroll}
                    user={user}
                    activeRoom={activeRoom}
                    messages={messages}
                    setMessages={setMessages}
                    isPopup={isPopup}
                  />
                )}
              </div>

              {/* 메시지 입력 영역 */}
              <div
                className={`flex-shrink-0 w-full ${
                  isMobileMembersSidebarOpen ? "hidden lg:block" : "block"
                }lg:pb-0`}
              >                {activeRoom !== null && (
                  <MessageInput
                    sendMessage={handleSendMessage}
                    sendWithFileMessage={sendWithFileMessage}
                    setAutoScroll={setAutoScroll}
                    isPopup={isPopup}
                    disabled={!connected}
                  />
                )}
              </div>
            </div>
          </div>
        </div>        {/* 멤버 사이드바 - 팝업 모드에서는 숨김 */}
        {!isPopup && (
          <div
            className={`${
              isMobileMembersSidebarOpen
                ? "fixed inset-0 z-30 block pt-14"
                : "hidden"
            } lg:relative lg:block lg:z-auto lg:pt-0`}
          >
            <MembersSidebar
              toggleMobileMembersSidebar={toggleMobileMembersSidebar}
              sourceType="chat"
            />
          </div>
        )}
      </div>

      {/* 이미지 모달 컴포넌트 */}
      <ImageModal />
    </div>
  );
}

export default ChatApp;
