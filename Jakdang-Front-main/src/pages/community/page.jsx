"use client";

import { FixedMessageHeader } from "@/components/fixed-meesage-header";
import FriendsList from "@/components/friends/FriendsList";
import { MembersSidebar } from "@/components/members-sidebars";
import CommunityServerModal from "@/components/modal/community-server-modal";
import { useToast } from "@/components/ui/use-toast";
import { useMediaQuery } from "@/hooks/use-media-query.jsx";
import { useChatService } from "@/hooks/useChatService";
import { useDiscordService } from "@/hooks/useDiscordService";
import { useStomp } from "@/hooks/useStomp";
import { userInfoAtom } from "@/jotai/authAtoms";
import {
  activeCategoryAtom,
  activeChannelAtom,
  activeChatRoomAtom,
  errorAtom,
  serversAtom,
} from "@/jotai/chatAtoms";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { Header } from "./header";
import { ImageModal } from "./image-modal";
import { MessageInput } from "./input";
import { Main } from "./main";
import { Sidebar } from "./sidebar";
import {useAxiosQuery} from "@/hooks/useAxiosQuery.js";
import {CommunityMobileSidebar} from "@/components/chat/CommunityMobileSidebar.jsx";

function GuideScreen() {
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [activeTab, setActiveTab] = useState("join"); // 가입 탭이 기본값으로 선택됨
  const [loading, setLoading] = useState(false);
  const userInfo = useAtomValue(userInfoAtom)
  const [servers] = useAtom(serversAtom)
  const { fetchDiscordData, createChannel } = useDiscordService(userInfo?.userId);
  const { fetchPost } = useAxiosQuery();

  // 서버 생성 핸들러
  const handleCreateServer = async (name, desc, imageUrl) => {
    if (name.trim()) {
      try {
        setLoading(true);
        // 실제 API 호출 - sidebar.jsx와 동일한 방식
        await createChannel(name, desc, imageUrl);
        // 성공 후 모달 닫기
        setShowCommunityModal(false);
        // 데이터 갱신
        await fetchDiscordData();
      } catch (error) {
        console.error("서버 생성 실패:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // 서버 가입 핸들러
  const handleJoinServer = async (inviteCode) => {
    if (inviteCode.trim()) {
      try {
        setLoading(true);
        // 실제 API 호출 - sidebar.jsx와 동일한 방식
        const response = await fetchPost(`/chat/discord/join/server`, null, {
          serverId: inviteCode,
        });

        console.log(response);
        console.log("서버 가입 시도:", inviteCode);
        // 성공 후 모달 닫기
        setShowCommunityModal(false);
        // 데이터 갱신
        await fetchDiscordData();
      } catch (error) {
        console.error("서버 가입 실패:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 py-12 px-4 sm:px-6 md:px-8 text-center">
      {/* 일러스트 이미지는 public/guide-community.svg 에 추가하거나, 없으면 아래 span만 노출 */}
      <img src="/guide-community.svg" alt="커뮤니티 가이드" className="w-32 sm:w-40 mb-6 opacity-80" onError={e => {e.target.style.display='none'}} />
      <span className="mb-4 text-4xl sm:text-5xl">👥</span>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">커뮤니티를 선택하세요</h2>
      <div className="mx-auto">
        <p className="text-gray-500 mb-6 text-sm sm:text-base">
          왼쪽 사이드바에서 커뮤니티를 선택하면 채널과 게시글을 볼 수 있습니다.<br className="hidden sm:block" />
          아직 가입한 커뮤니티가 없다면, 새로운 커뮤니티에 참여해보세요!
        </p>
      </div>
      <button
        className="px-6 py-2.5 bg-blue-600 text-white text-sm sm:text-base font-medium rounded-md hover:bg-blue-700 transition shadow-sm"
        onClick={() => setShowCommunityModal(true)}
      >
        커뮤니티 탐색하기
      </button>

      {/* 커뮤니티 서버 모달 */}
      <CommunityServerModal
        open={showCommunityModal}
        onOpenChange={setShowCommunityModal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCreate={handleCreateServer}
        onJoin={handleJoinServer}
        loading={loading}
        servers={servers}
      />
    </div>
  )
}

function CommunityPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("대기중");
  const [user] = useAtom(userInfoAtom);
  const [error] = useAtom(errorAtom);
  const setError = useSetAtom(errorAtom);
  const { toast } = useToast();

  // 자동 스크롤 상태를 위한 상태 추가
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeCategory, setActiveCategory] = useAtom(activeCategoryAtom);
  const [activeServer, setActiveServer] = useAtom(activeChannelAtom);
  const [activeChannel] = useAtom(activeChannelAtom);
  const [activeChatRoom, setActiveChatRoom] = useAtom(activeChatRoomAtom);  console.log("activeServer", activeServer);
  const isMobile = useMediaQuery("(max-width: 1023px)");

  // 멤버 사이드바 상태 추가
  const [isMembersSidebarOpen, setIsMembersSidebarOpen] = useState(false);
  // 고정 메시지 모달 상태 추가
  const [isFixedMessageModalOpen, setIsFixedMessageModalOpen] = useState(false);

  // 모바일 사이드바 상태 추가
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // 드래그 상태 추가
  const [isDragOver, setIsDragOver] = useState(false); // 드래그 오버 상태 추가

  // 모바일 멤버 사이드바 토글 상태 추가
  const [isMobileMembersSidebarOpen, setIsMobileMembersSidebarOpen] =
    useState(false);

  const [height, setHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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
  const { fetchRoomList } = useChatService(user?.userId);
  const { sendCategoryMessage, fetchDiscordData, sendWithFileCategoryMessage } =
    useDiscordService(user?.userId);

  // STOMP 연결 초기화
  const { connected, checkConnection } = useStomp();

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

      // 연결 성공 시 데이터 새로고침 - 한 번만 실행되도록 플래그 사용
      if (user?.userId && !window.dataLoaded) {
        window.dataLoaded = true;

        // 데이터 로딩 함수 호출
        fetchRoomList();
        fetchDiscordData();

        // 연결 성공 토스트 표시
        toast({
          title: "커뮤니티 연결 성공",
          description: "메시지 커뮤니티에 연결되었습니다.",
          variant: "default",
        });
      }
    } else {
      console.log("웹소켓 연결 대기 중...");
      setConnectionStatus("대기중");
      // 연결이 끊어지면 플래그 초기화
      window.dataLoaded = false;
    }
  }, [connected, user?.userId, fetchRoomList, fetchDiscordData, toast]);

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

  // 카테고리 메시지 전송 처리 함수 - 디바운스 적용
  const handleSendCategoryMessage = useCallback(
    debounce(async (content) => {
      if (!connected) {
        toast({
          title: "연결 오류",
          description:
            "메시지 커뮤니티에 연결되어 있지 않습니다. 잠시 후 다시 시도해주세요.",
          variant: "destructive",
        });

        // 재연결 시도
        checkConnection();
        return false;
      }

      try {
        console.log("채널 메시지 전송 시도:", {
          contentLength: content?.length,
        });
        const result = sendCategoryMessage(content);

        if (!result) {
          toast({
            title: "채널 메시지 전송 실패",
            description: "메시지를 전송하지 못했습니다. 다시 시도해주세요.",
            variant: "destructive",
          });
        } else {
          // 메시지 전송 성공 시 자동 스크롤 활성화
          setAutoScroll(true);
        }

        return result;
      } catch (err) {
        console.error("채널 메시지 전송 중 오류 발생:", err);
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
    [connected, sendCategoryMessage, toast, checkConnection, setAutoScroll]
  );

  // 채팅방/채널 변경 시 자동 스크롤 활성화
  useEffect(() => {
    console.log("채널 변경됨, 자동 스크롤 활성화");
    setAutoScroll(true);
  }, [activeCategory?.id]);

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
  }  // 모바일 사이드바 토글 함수
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
    setIsDragOver(true);
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
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // MessageInput 컴포넌트로 파일 전달을 위한 커스텀 이벤트 발생
      const filesArray = Array.from(files);
      
      // 파일 타입별로 분류
      const imageFiles = filesArray.filter(file => file.type.startsWith('image/'));
      const videoFiles = filesArray.filter(file => file.type.startsWith('video/'));
      const documentFiles = filesArray.filter(file => 
        !file.type.startsWith('image/') && !file.type.startsWith('video/')
      );

      // 각 타입별로 파일 선택 이벤트 발생
      if (imageFiles.length > 0) {
        window.dispatchEvent(new CustomEvent('dropFiles', { 
          detail: { files: imageFiles, type: 'image' } 
        }));
      }
      if (videoFiles.length > 0) {
        window.dispatchEvent(new CustomEvent('dropFiles', { 
          detail: { files: videoFiles, type: 'video' } 
        }));
      }
      if (documentFiles.length > 0) {
        window.dispatchEvent(new CustomEvent('dropFiles', { 
          detail: { files: documentFiles, type: 'file' } 
        }));
      }
    }
  }, []);

  return (
    // <div
    //     className="flex w-full bg-[#222533] text-gray-200 flex-col mx-auto shadow-xl overflow-hidden mt-[65px]"
    //     style={{ height: 'calc(100vh - 65px)' }}
    // >
    <div
      className="flex w-full lg:w-[1280px] bg-white text-gray-800 flex-col m-auto shadow-xl overflow-hidden"
      style={{
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
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 연결 상태 표시 */}
      {connected === false && (
        <div className="bg-amber-100 text-amber-800 text-center py-1 text-sm">
          <span>
            메시지 커뮤니티 {connectionStatus} - 일부 실시간 기능이 제한될 수
            있습니다.
          </span>
        </div>
      )}      {/* 메인 UI */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* D&D 오버레이 */}
        {isDragOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="text-2xl mb-4">📁</div>
              <p className="text-lg font-medium">파일을 여기에 드롭하세요</p>
              <p className="text-sm text-gray-500 mt-2">이미지, 동영상, 문서를 업로드할 수 있습니다</p>
            </div>
          </div>
        )}        {/* 모바일 사이드바 */}
        <div
          className={`fixed inset-y-0 left-0 w-[328px] bg-white transform transition-transform duration-300 ease-in-out z-50 lg:hidden mt-[65px] mb-[65px] ${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <CommunityMobileSidebar toggleSidebar={toggleMobileSidebar} />
        </div>

        {/* 데스크톱 사이드바 */}
        {!isMobile && (
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
          {/* 헤더 컴포넌트 */}
          <Header
            setFixedMessageModalOpen={setIsFixedMessageModalOpen}
            toggleMobileMembersSidebar={toggleMobileMembersSidebar}
            isMobileMembersSidebarOpen={isMobileMembersSidebarOpen}
            toggleMobileSidebar={toggleMobileSidebar}
          />

          {/*   헤더 */}
          <FixedMessageHeader
            isOpen={isFixedMessageModalOpen}
            setIsOpen={setIsFixedMessageModalOpen}
          />

          {/* 메인 콘텐츠 영역 - 채팅과 멤버 사이드바 */}
          <div className="flex flex-row h-auto flex-1 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              {/* 메인 메시지 컴포넌트 */}
              <div
                className={`flex-1 overflow-hidden ${
                  isMobileMembersSidebarOpen ? "hidden lg:block" : "block"
                }`}
              >
                {activeServer && activeServer?.id === null ? (
                  <GuideScreen />
                ) :
                  (!activeCategory && !activeServer && !activeChannel && !activeChatRoom) ? (
                    <GuideScreen />
                  ) : (
                    <Main autoScroll={autoScroll} setAutoScroll={setAutoScroll} />
                  )
                }

              </div>

              {/* 멤버 사이드바 - 모바일에서는 조건부 표시 */}
              <div
                // className={`${
                //   isMobileMembersSidebarOpen
                //     ? "fixed inset-0 z-30 block pt-14"
                //     : "hidden"
                // } lg:relative lg:block lg:z-auto lg:pt-0`}
                className="fixed inset-0 z-30 block lg:relative lg:z-auto"
              >
                {/* 모바일 멤버 사이드바 오버레이 */}
                {isMobileMembersSidebarOpen && (
                  <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                    onClick={toggleMobileMembersSidebar}
                  />
                )}
                <div
                  className={`w-full ${
                    isMobileMembersSidebarOpen ? "hidden lg:block" : "block"
                  }lg:pb-0`}
                >
                  {!(activeServer === null) && (
                    <MessageInput
                      sendCategoryMessage={handleSendCategoryMessage}
                      setAutoScroll={setAutoScroll}
                      sendWithFileCategoryMessage={sendWithFileCategoryMessage}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className={`${
            isMobileMembersSidebarOpen
              ? "fixed inset-0 z-30 block pt-14"
              : "hidden"
          } lg:relative lg:block lg:z-auto lg:pt-0`}
        >
          <MembersSidebar 
            toggleMobileMembersSidebar={toggleMobileMembersSidebar}
            sourceType="community"
          />
        </div>
      </div>

      {/* 이미지 모달 컴포넌트 */}
      <ImageModal />
    </div>
  );
}

export default CommunityPage;
