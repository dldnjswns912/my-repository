"use client";

import {
  Building2,
  Home,
  MessageCircle,
  User,
  LogIn,
  ExternalLink,
  Users,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import WriteModal from "../modal/write-modal/write-modal";
import { accessTokenAtom, isAuthenticatedAtom } from "@/jotai/authAtoms.js";
import { useLogout } from "@/hooks/useLogout.js";
import { useAtom, useAtomValue } from "jotai";
import { useToast } from "../toast-provider";
import { useMediaQuery } from "@/hooks/use-media-query.jsx";
import { Button } from "../ui/button";
import { activeChatRoomAtom } from "@/jotai/chatAtoms";

const Footer = () => {
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const location = useLocation();
  const logouts = useLogout();
  const pathSegments = location.pathname.split("/");
  const { toast } = useToast();
  const [tab, setTab] = useState(null);
  const [filter, setFilter] = useState(null);
  const [classId, setClassId] = useState(null);
  const isChat = location.pathname.includes("/chat");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const footerRef = useRef(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const accessToken = useAtomValue(accessTokenAtom);
  const [_, setActiveRoom] = useAtom(activeChatRoomAtom)

  useEffect(() => {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const initialViewportHeight =
      window.visualViewport?.height || window.innerHeight;
    const initialWindowHeight = window.innerHeight;

    const handleResize = () => {
      if (!footerRef.current) return;

      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialWindowHeight - currentHeight;

      // 키보드가 올라왔는지 확인 (높이 차이가 100px 이상일 때)
      if (heightDifference > 100) {
        setIsKeyboardVisible(true);
        if (isIOS) {
          document.body.style.height = `${currentHeight}px`;
        }
        footerRef.current.style.display = "none";
      } else {
        setIsKeyboardVisible(false);
        document.body.style.height = "100%";
        footerRef.current.style.display = "flex";
      }

      // iOS일 때 추가적인 푸터 위치 조정
      if (
        isIOS &&
        window.visualViewport &&
        window.visualViewport.height < initialWindowHeight
      ) {
        footerRef.current.style.bottom = "0";
      }
    };

    // visualViewport API 사용
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      window.visualViewport.addEventListener("scroll", handleResize);
    }

    // 기본 resize 이벤트도 함께 사용
    window.addEventListener("resize", handleResize);

    // 입력 필드 포커스/블러 이벤트 처리
    const inputs = document.querySelectorAll("input, textarea");
    const handleFocus = () => {
      if (isIOS) {
        setTimeout(() => {
          window.scrollTo(0, 0);
          document.body.scrollTop = 0;
        }, 100);
      }
    };

    inputs.forEach((input) => {
      input.addEventListener("focus", handleFocus);
      // 안드로이드에서 포커스시 푸터 숨기기
      input.addEventListener("focus", () => {
        if (!isIOS && footerRef.current) {
          footerRef.current.style.display = "none";
          setIsKeyboardVisible(true);
        }
      });
      // 안드로이드에서 블러시 푸터 보이기
      input.addEventListener("blur", () => {
        if (!isIOS && footerRef.current) {
          setTimeout(() => {
            footerRef.current.style.display = "flex";
            setIsKeyboardVisible(false);
          }, 100);
        }
      });
    });

    // 초기 푸터 높이 저장
    if (footerRef.current) {
      setFooterHeight(footerRef.current.offsetHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
        window.visualViewport.removeEventListener("scroll", handleResize);
      }
      window.removeEventListener("resize", handleResize);
      inputs.forEach((input) => {
        input.removeEventListener("focus", handleFocus);
        // 이벤트 리스너 제거
        input.removeEventListener("focus", () => {
          if (!isIOS && footerRef.current) {
            footerRef.current.style.display = "none";
            setIsKeyboardVisible(true);
          }
        });
        input.removeEventListener("blur", () => {
          if (!isIOS && footerRef.current) {
            setTimeout(() => {
              footerRef.current.style.display = "flex";
              setIsKeyboardVisible(false);
            }, 100);
          }
        });
      });
    };
  }, []);

  // 푸터 스타일 계산
  const footerStyle = {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 80,
    transform: isKeyboardVisible ? "translateY(100%)" : "translateY(0)",
    transition: "transform 0.3s ease-out",
    backgroundColor: "white",
    borderTop: "1px solid #e5e7eb",
  };

  const handleLogout = (e) => {
    e.preventDefault();
    logouts.mutate();
  };

  const [writeModalOpen, setWriteModalOpen] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    setTab(searchParams.get("tab"));
    setFilter(searchParams.get("filter"));
    setClassId(searchParams.get("classId"));
  }, [location.search]);

  const handleWriteClick = () => {
    if (getFromComponent(pathSegments) == null) {
      toast({
        title: "작성 불가",
        description: "해당 페이지에서는 글을 작성할 수 없습니다.",
        variant: "error",
      });
      return;
    }
    setWriteModalOpen(true);
  };

  const handleGoToOtherFront = () => {
    console.log("플로우 버튼 클릭됨");

    // 환경 변수 확인
    const workflowUrl = import.meta.env.VITE_WORKFLOW_URL;
    if (!workflowUrl) {
      console.error("VITE_WORKFLOW_URL 환경 변수가 설정되지 않았습니다.");
      return;
    }

    // 토큰을 쿼리 파라미터로 전달
    const url = new URL(workflowUrl);
    url.searchParams.append("token", accessToken);

    // 새 창 열기
    window.open(url.toString(), "_blank");
    console.log("쿼리 파라미터로 토큰을 전달하여 새 창을 열었습니다.");
    console.log("url", url.toString());
  };

  const getFromComponent = (pathSegments) => {
    if (
      (pathSegments.length === 2 && pathSegments[1] === "") || // 홈
      (pathSegments.length === 3 && pathSegments[1] === "channel") // 채널
    ) {
      return "channel";
    } else if (
      pathSegments.length === 3 &&
      pathSegments[1] === "organization"
    ) {
      if (tab === "org") {
        return "organization";
      } else if (tab === "classroom") {
        switch (filter) {
          case "question":
            return "organization_question";
          default:
            return null;
        }
      } else {
        return null;
      }
    }
  };

  const checkShowWriteButton = () => {
    if (tab === "classroom" && !classId) return false;
    return true;
  };

  // 현재 경로에 따른 활성화 상태 확인 함수 추가
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // 활성화된 아이템의 스타일을 위한 클래스 생성 함수
  const getNavItemClasses = (path) => {
    return `flex flex-col items-center justify-center flex-1 h-full ${
      isActive(path)
        ? 'text-navy-600 dark:text-white'
        : 'text-gray-600 dark:text-gray-300 hover:text-navy-600 dark:hover:text-white'
    }`;
  };

  return (
    <>
      {/* 푸터 */}
      {!location.pathname.includes('/chat') && !location.pathname.includes('/community') && (
        <footer className="py-8 text-sm text-center text-gray-500 border-t dark:text-gray-400 dark:border-navy-700 relative z-10 bg-white dark:bg-navy-900">
          <div className="container px-4 mx-auto max-w-[1100px]">
            <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
              <div className="flex items-center">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-rPNOL4x5R207uiAJwotp3sB3Bsc2wj.png"
                  alt="JAKDANG LABS"
                  width={100}
                  height={30}
                  className="object-contain mr-2 dark:brightness-110"
                />
                <p className="dark:text-gray-300 ">
                  © 2025 작당연구소. 모든 권리 보유.
                </p>
              </div>
              <div className="flex gap-6 relative z-20 mb-16 md:mb-0">
                <Link
                    to="/notice"
                    className="hover:text-navy-600 dark:hover:text-navy-300 transition-colors"
                    onClick={() => {
                      window.scrollTo({ top: 0 });
                    }}
                >
                  공지사항
                </Link>
                <Link
                  to="/terms"
                  className="hover:text-navy-600 dark:hover:text-navy-300 transition-colors"
                  onClick={() => {
                    window.scrollTo({ top: 0 });
                  }}
                >
                  이용약관
                </Link>
                <Link
                  to="/privacy"
                  className="hover:text-navy-600 dark:hover:text-navy-300 transition-colors"
                  onClick={() => {
                    window.scrollTo({ top: 0 });
                  }}
                >
                  개인정보처리방침
                </Link>
                <a
                  href="#"
                  className="hover:text-navy-600 dark:hover:text-navy-300 transition-colors"
                  onClick={() => {
                    window.scrollTo({ top: 0 });
                  }}
                >
                  고객센터
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
      {/* 모바일 하단 네비게이션 바 */}
      {isMobile && (
        <div
          ref={footerRef}
          className={`fixed bottom-0 left-0 right-0 z-80 flex items-center justify-around bg-white dark:bg-navy-800 border-t dark:border-navy-700 md:hidden`}
          style={{
            transition: "transform 0.3s ease-out",
            transform: isKeyboardVisible ? "translateY(100%)" : "translateY(0)",
            minHeight: "65px",
            height: "calc(65px + env(safe-area-inset-bottom))",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <Link
            to="/"
            className={getNavItemClasses('/')}
          >
            <Home className="w-6 h-6" />
            <span className="mt-1 text-xs">홈</span>
          </Link>
          <Link
            to="/chat"
            className={getNavItemClasses('/chat')}
            onClick={() => setActiveRoom(null)}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="mt-1 text-xs">채팅</span>
          </Link>
          <Link
            to="/community"
            className={getNavItemClasses('/community')}
          >
            <Users className="w-6 h-6" />
            <span className="mt-1 text-xs">커뮤니티</span>
          </Link>
          <button
            variant={"ghost"}
            onClick={() => handleGoToOtherFront()}
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 dark:text-gray-300 hover:text-navy-600 dark:hover:text-white"
          >
            <ExternalLink className="w-6 h-6" />
            <span className="mt-1 text-xs">팀플로우</span>
          </button>
          <Link
            to="/organizations"
            className={getNavItemClasses('/organizations')}
          >
            <Building2 className="w-6 h-6" />
            <span className="mt-1 text-xs">기관</span>
          </Link>
          {isAuth ? (
            <Link
              to="/my"
              className={getNavItemClasses('/my')}
            >
              <User className="w-6 h-6" />
              <span className="mt-1 text-xs">MY</span>
            </Link>
          ) : (
            <Link
              to="/login"
              onClick={() => window.FlutterChannel.postMessage("login")}
              className={getNavItemClasses('/login')}
            >
              <LogIn className="w-6 h-6" />
              <span className="mt-1 text-xs">로그인</span>
            </Link>
          )}
        </div>
      )}

      <WriteModal
        id={() => {
          if (pathSegments.length === 3 && pathSegments[1] === "channel") {
            return pathSegments[2];
          } else if (
            pathSegments.length === 3 &&
            pathSegments[1] === "organization"
          ) {
            if (tab === "org") {
              return pathSegments[2];
            } else if (tab === "classroom") {
              return classId;
            } else {
              return null;
            }
          } else {
            return null;
          }
        }}
        fromComponent={getFromComponent(pathSegments)}
        isOpen={writeModalOpen}
        onClose={() => setWriteModalOpen(false)}
      />
    </>
  );
};

export default Footer;
