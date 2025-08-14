"use client";

import NotificationPanel from "@/components/global/notification-panel.jsx";
import ChannelDetailModal from "@/components/modal/detail-modal/channel-detail-modal";
import SidebarProfilePanel from "@/components/modal/moble_SheetContent.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet.jsx";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import { useChatService } from "@/hooks/useChatService";
import { useLogout } from "@/hooks/useLogout.js";
import { accessTokenAtom, userInfoAtom } from "@/jotai/authAtoms";
import { isAuthenticatedAtom } from "@/jotai/authAtoms.js";
import {
  activeCategoryAtom,
  activeChannelAtom,
  activeChatRoomAtom,
  activeServerAtom,
  communityUnreadCountAtom,
  serversAtom,
  unreadCountsAtom,
} from "@/jotai/chatAtoms";
import { notiCountAtom } from "@/jotai/notiAtoms";
import { usePostApi } from "@/service/api/postApi";
import { useAtom, useAtomValue } from "jotai";
import {
  Bell,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  UserPlus,
  Users,
  X,
  Star,
  Building2,
} from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import WriteModal from "../modal/write-modal/write-modal";
import { useToast } from "../toast-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.js";
import { useMyOrganizations } from "@/hooks/useOrganizations.js";
import { useDiscordService } from "@/hooks/useDiscordService";
import popupManager from "@/utils/popupManager";

// 스크롤링 공지사항 컴포넌트
const ScrollingNotice = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const { likePost, bookmarkPost } = usePostApi();
  const userInfo = useAtomValue(userInfoAtom);
  const { toast } = useToast();
  const isAuth = useAtomValue(isAuthenticatedAtom);

  const { items: notices, isLoading } = usePostApi().usePostInfiniteScroll({
    postType: "NOTICE",
    published: true,
    sort_by: "createdAt",
    sort_direction: "DESC",
    size: 5,
  });

  useEffect(() => {
    if (!notices || notices.length === 0) return;

    const timer = setInterval(() => {
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentNoticeIndex((prev) => (prev + 1) % notices.length);
        setIsAnimating(true);
      }, 500);
    }, 8000);

    return () => clearInterval(timer);
  }, [notices]);

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  const handleNoticeClick = (notice) => {
    setSelectedPost(notice);
    setIsDetailModalOpen(true);
  };

  const handleLikeClick = async (postId) => {
    try {
      const res = await likePost(postId, userInfo.userId);
      if (res.result) {
        setSelectedPost((prev) =>
          prev?.id === postId
            ? {
                ...prev,
                is_like: !prev.is_like,
                like_count: prev.is_like
                  ? prev.like_count - 1
                  : prev.like_count + 1,
              }
            : prev
        );
      }
      return res;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleBookmarkClick = async (postId) => {
    try {
      const res = await bookmarkPost(postId, userInfo.userId);
      if (res.result) {
        setSelectedPost((prev) =>
          prev?.id === postId
            ? {
                ...prev,
                is_bookmark: !prev.is_bookmark,
              }
            : prev
        );
      }
      return res;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  if (!isVisible || isLoading || !notices || notices.length === 0) return null;

  return (
    <>
      <div className="bg-navy-600 text-black py-0.5 relative overflow-hidden animate-slide-up">
        <div className="container mx-auto px-4 max-w-[1280px] flex items-center justify-between">
          <div className="flex-1 overflow-hidden">
            <div
              className={`animate-scroll h-[24px] whitespace-nowrap transition-opacity duration-500 cursor-pointer w-[90%] flex items-center ${
                isAnimating ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => handleNoticeClick(notices[currentNoticeIndex])}
            >
              <span className="inline-block font font-semibold w-[100%] overflow-hidden text-ellipsis text-[14px]">
                {notices[currentNoticeIndex]?.title}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 공지 인디케이터 */}
            <div className="flex gap-1">
              {notices.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentNoticeIndex(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer hover:bg-white ${
                    index === currentNoticeIndex ? "bg-white" : "bg-white/50"
                  }`}
                  aria-label={`공지사항 ${index + 1}번으로 이동`}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-navy-500"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ChannelDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
        isNotice={true}
        onLikeClick={handleLikeClick}
        onBookmarkClick={handleBookmarkClick}
      />
    </>
  );
};

const Navbar = () => {
  const [userInfo, setUserInfo] = useAtom(userInfoAtom);
  const [mounted, setMounted] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [showNotice, setShowNotice] = useState(true);
  const { theme, setTheme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation(); // 현재 URL 경로 가져오기
  const pathSegments = location.pathname.split("/"); // "/" 기준으로 분할
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const logouts = useLogout();
  const [notiCounts, setNotiCounts] = useAtom(notiCountAtom);
  const [unreadCount, setUnreadCounts] = useAtom(unreadCountsAtom);
  const [communityUnreadCount, setCommunityUnreadCount] = useAtom(
    communityUnreadCountAtom
  );
  // const totalUnreadCount = useAtomValue(totalUnreadCountAtom);
  // const chatService = useChatService();
  const { getAxiosWithToken } = useAxiosQuery();
  const accessToken = useAtomValue(accessTokenAtom);
  const { getUnreadCount } = useChatService(userInfo?.userId);

  const [activeCategory, setActiveCategory] = useAtom(activeCategoryAtom);
  const [activeServer, setActiveServer] = useAtom(activeServerAtom);
  const [activeChatRoom, setActiveChatRoom] = useAtom(activeChatRoomAtom);
  const [activeChannel, setActiveChannel] = useAtom(activeChannelAtom);
  const [servers] = useAtom(serversAtom);
  const { fetchDiscordData, selectChannel } = useDiscordService(
    userInfo?.userId
  );

  const { data: myOrganizations, isLoading: myOrgLoading } =
    useMyOrganizations();

  console.log("activeCategory", activeCategory);

  useEffect(() => {
    if (!isAuth) return; // 로그인 안 되어 있으면 아무 것도 하지 않음

    const handleGetUnreadCount = async () => {
      const response = await getUnreadCount();
      setUnreadCounts(response?.count);
      setCommunityUnreadCount(response?.communityCount);
      console.log("unreadCount", response);
    };

    // Initial fetch
    handleGetUnreadCount();

    // Set up polling interval every 10 seconds
    const intervalId = setInterval(handleGetUnreadCount, 10000);

    // Clean up interval on unmount or when userInfo.userId 또는 isAuth 변경 시
    return () => clearInterval(intervalId);
  }, [userInfo?.userId, isAuth]); // isAuth도 의존성에 추가해야 조건 변경에 반응함

  useEffect(() => {
    // 브라우저 뒤로가기/앞으로가기 감지 함수
    const handlePopState = () => {
      console.log("브라우저 뒤로가기/앞으로가기 감지됨");
      // 상태 초기화
      setActiveChatRoom(null);
      setActiveCategory(null);
      setActiveServer(null);
      setActiveChannel(null);
    };

    // 이벤트 리스너 등록
    window.addEventListener("popstate", handlePopState);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [setActiveChatRoom, setActiveCategory, setActiveServer, setActiveChannel]);

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

  useEffect(() => {
    window.appBridge = {
      ...window.appBridge,
      openWriteModal: () => {
        // 글쓰기 모달 상태 변경
        setWriteModalOpen(true);
      },
    };
  }, []);

  const handleGetUnreadChat = async () => {
    // console.log(userInfo.userId)
    // const unreadData = await chatService.getUnreadCount(userInfo?.userId);
    // const counts = unreadData.reduce((acc, cur) => acc + cur.count, 0);
    // setUnreadCounts(counts);
    // console.log(counts)
  };

  const handleLogout = (e) => {
    e.preventDefault();
    logouts.mutate();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    setMounted(true);
    if (servers.length <= 0) {
      fetchDiscordData();
    }
    if (userInfo?.userId !== "" && isAuth) {
      handleGetUnreadChat();
    }
  }, [userInfo]);

  const handleWriteClick = () => {
    if (isMobile) {
      navigate("/write");
    } else {
      setWriteModalOpen(true);
    }
  };

  const handleServerSelect = (serverId) => {
    if (activeServer === serverId) return; // 이미 선택된 서버는 무시
    setActiveServer(serverId);
    setActiveCategory(null);
    selectChannel(serverId);
  };

  useEffect(() => {
    console.log("location", location);
  }, [location]);

  useEffect(() => {
    console.log("userInfo", userInfo);
  }, [userInfo]);

  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const activityRef = useRef(null);

  useEffect(() => {
    if (!isActivityOpen) return;
    function handleClickOutside(event) {
      if (activityRef.current && !activityRef.current.contains(event.target)) {
        setIsActivityOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isActivityOpen]);

  return (
    <>
      {/* 고정된 상단 영역 */}
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* 헤더 */}
        <header className="bg-white dark:bg-navy-800 border-b dark:border-navy-700 shadow-sm">
          <div className="container flex items-center justify-between h-16 px-4 mx-auto max-w-[1280px]">
            <div className="flex items-center gap-8">
              <Link
                to="/"
                className="font-medium text-navy-700 hover:text-navy-600 dark:text-white dark:hover:text-white transition-colors"
              >
                <img
                  src="/Jackdang_logo.png"
                  // src="/jakdang_logo2_nobg.png"
                  alt="JAKDANG LABS"
                  width={244.44}
                  height={25}
                  className="object-contain"
                />
              </Link>

              <nav className="hidden md:flex">
                <ul className="flex items-center space-x-8">
                  <li className="text-blue-600 dark:text-white">
                    <Link
                      to="/"
                      className="text-sky-800 hover:text-navy-700 dark:text-white dark:hover:text-white font-semibold transition-colors"
                    >
                      홈
                    </Link>
                  </li>
                  {/*<li className="text-blue-600 dark:text-white">*/}
                  {/*  <Link*/}
                  {/*      to="/channel"*/}
                  {/*      className="text-sky-800 hover:text-navy-700 dark:text-white dark:hover:text-white font-semibold transition-colors"*/}
                  {/*  >*/}
                  {/*    채널*/}
                  {/*  </Link>*/}
                  {/*</li>*/}
                  <li>
                    <Link
                      to="/organizations"
                      className="text-sky-800 hover:text-navy-700 dark:text-gray-300 dark:hover:text-white font-semibold transition-colors"
                    >
                      기관
                    </Link>
                  </li>
                  <li>
                    <Button
                      onClick={() => handleGoToOtherFront()}
                      style={{ fontSize: "1.0rem" }}
                      className="bg-transparent border-none shadow-none p-0 m-0 text-sky-800 hover:text-navy-700 dark:text-gray-300 dark:hover:text-white font-semibold transition-colors focus:outline-none focus:ring-0 hover:bg-transparent active:bg-transparent"
                    >
                      팀플로우
                    </Button>
                  </li>
                </ul>
              </nav>
            </div>

            <div className="flex items-center gap-4 md:gap-7">
              {isAuth ? (
                <>
                  {location.pathname === "/" ||
                  location.pathname === "/channel" ? (
                    <Button
                      className=" hidden md:flex bg-navy-600 text-white hover:bg-navy-700 font-semibold cursor-pointer"
                      onClick={handleWriteClick}
                    >
                      글쓰기
                    </Button>
                  ) : null}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          variant="ghost"
                          // size="icon"
                          className="relative text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-navy-700 cursor-pointer ml-[10px] md:ml-[0px]"
                          onClick={() => setIsNotificationOpen(true)}
                        >
                          <Bell size={20} />
                          {notiCounts > 0 && (
                            <span className="absolute top-[-12px] left-[12px] flex items-center justify-center min-w-4.5 w-auto h-4.5 text-[10px] text-white bg-red-500 rounded-full px-[4px]">
                              {notiCounts >= 100 ? "99+" : notiCounts}
                            </span>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>알림</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>                  <div className="relative hidden md:flex">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            variant="ghost"
                            // size="icon"
                            onClick={() => {
                              // 팝업으로 채팅 리스트 열기
                              popupManager.openChatList();
                            }}
                            className="text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-navy-700 cursor-pointer"
                          >
                            <MessageCircle size={20} />
                            {unreadCount > 0 && (
                              <span className="absolute top-[-12px] left-[12px] flex items-center justify-center min-w-4.5 w-auto h-4.5 text-[10px] text-white bg-red-500 rounded-full px-[4px]">
                                {unreadCount >= 100 ? "99+" : unreadCount}
                              </span>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>채팅</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="relative hidden md:flex">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            variant="ghost"
                            // size="icon"
                            onClick={() => {
                              setActiveChatRoom(null);
                              setActiveCategory(null);
                              setActiveServer(null);
                              setActiveChannel(null);
                              navigate("/community");
                            }}
                            className="text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-navy-700 cursor-pointer"
                          >
                            <Users size={20} />
                            {communityUnreadCount > 0 && (
                              <span className="absolute top-[-12px] left-[12px] flex items-center justify-center min-w-4.5 w-auto h-4.5 text-[10px] text-white bg-red-500 rounded-full px-[4px]">
                                {communityUnreadCount}
                              </span>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>커뮤니티</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="relative hidden md:flex" ref={activityRef}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            variant="ghost"
                            className="text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-navy-700 cursor-pointer"
                            onClick={() => setIsActivityOpen((prev) => !prev)}
                          >
                            <Star size={20} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>내 활동</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {isActivityOpen && (
                      <div className="z-100 absolute left-1/2 -translate-x-1/2 top-[calc(100%+0.5rem)] w-[350px] bg-white dark:bg-navy-800 shadow-lg rounded-md overflow-hidden z-50 border border-gray-200 dark:border-navy-600 animate-fade-in">
                        <div className="absolute w-4 h-4 bg-white dark:bg-navy-800 border-t border-l border-gray-300 dark:border-navy-600 transform rotate-45 -top-2 left-1/2 -translate-x-1/2"></div>

                        <div className="p-3 border-b border-gray-200 dark:border-navy-700">
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            내가 가입한 기관
                          </h3>
                        </div>
                        {myOrganizations.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                            가입한 기관이 없습니다.
                          </div>
                        ) : (
                          myOrganizations.map((org) => (
                            <ul
                              key={org}
                              className="divide-y divide-gray-100 dark:divide-navy-700 max-h-[300px] overflow-y-auto"
                            >
                              <li>
                                <Link
                                  to={`organization/${org.id}`}
                                  className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors"
                                >
                                  <div className="flex-shrink-0 w-10 h-10 rounded-md bg-gray-100 dark:bg-navy-700 flex items-center justify-center">
                                    {org.logo ? (
                                      <img
                                        src={org.logo}
                                        alt={org.name}
                                        width={80}
                                        height={80}
                                        className="max-h-full object-contain rounded-lg"
                                      />
                                    ) : (
                                      <Building2 className="h-16 w-16 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {org.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {org.description}
                                    </p>
                                  </div>
                                </Link>
                              </li>
                            </ul>
                          ))
                        )}

                        <div className="p-3 border-y border-gray-200 dark:border-navy-700">
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            내가 속한 커뮤니티
                          </h3>
                        </div>
                        <div className="p-3">
                          <div
                            className="overflow-x-auto scrollbar-hide"
                            style={{
                              scrollbarWidth: "none",
                              msOverflowStyle: "none",
                            }}
                            ref={(el) => {
                              if (el) {
                                const slider = el;
                                let isDown = false;
                                let startX;
                                let scrollLeft;

                                slider.addEventListener("mousedown", (e) => {
                                  isDown = true;
                                  slider.style.cursor = "grabbing";
                                  startX = e.pageX - slider.offsetLeft;
                                  scrollLeft = slider.scrollLeft;
                                  e.preventDefault();
                                });

                                slider.addEventListener("mouseleave", () => {
                                  isDown = false;
                                  slider.style.cursor = "grab";
                                });

                                slider.addEventListener("mouseup", () => {
                                  isDown = false;
                                  slider.style.cursor = "grab";
                                });

                                slider.addEventListener("mousemove", (e) => {
                                  if (!isDown) return;
                                  e.preventDefault();
                                  const x = e.pageX - slider.offsetLeft;
                                  const walk = (x - startX) * 1.5; // Scroll speed multiplier
                                  slider.scrollLeft = scrollLeft - walk;
                                });
                              }
                            }}
                          >
                            <div className="flex space-x-0.5 pb-2 cursor-grab">
                              {/* 커뮤니티 아이템 - 더미 데이터 */}
                              {(() => {
                                const joinedCommunities = servers.filter(
                                  (community) => community.name !== "홈"
                                );
                                if (joinedCommunities.length === 0) {
                                  return (
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      가입한 커뮤니티가 없습니다.
                                    </span>
                                  );
                                }
                                return joinedCommunities.map((community) => (
                                  <Link
                                    key={community.id}
                                    to="/community"
                                    onClick={() => {
                                      handleServerSelect(community.id);
                                    }}
                                    className="flex flex-col items-center min-w-[80px] group"
                                  >
                                    <div className="w-16 h-16 p-0.5 hover:border-amber-300 rounded-md overflow-hidden mb-2 border-2 border-gray-200 dark:border-navy-600 group-hover:border-gray-300 dark:group-hover:border-navy-500 transition-colors">
                                      {community.imageRequest ? (
                                        <img
                                          src={
                                            community.imageRequest?.imageUrl ||
                                            "/placeholder.svg"
                                          }
                                          alt={community.name}
                                          className="w-full h-full object-cover rounded-2xl"
                                        />
                                      ) : (
                                        <span className="flex items-center justify-center w-full h-full text-2xl text-gray-500 dark:text-gray-400">
                                          {community.icon}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-center text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white truncate w-full">
                                      {community.name}
                                    </span>
                                  </Link>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <Link to="/my">
                      <Avatar className="w-9 h-9 border cursor-pointer transition-all">
                        <AvatarImage
                          src={userInfo?.image || "/placeholder.svg"}
                          alt="프로필"
                        />
                        <AvatarFallback
                          className="text-white"
                          style={{
                            backgroundColor: userInfo?.image
                              ? "none"
                              : userInfo.backgroundColor
                              ? userInfo.backgroundColor
                              : "#FFC107",
                          }}
                        >
                          {userInfo?.nickname?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-navy-700 flex items-center gap-2 font-medium cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>로그아웃</span>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="hidden md:flex items-center gap-3">
                    <Link to="/login">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-navy-700 flex items-center gap-2 cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>로그인</span>
                      </Button>
                    </Link>
                    <Link to="/signup">
                      <Button
                        className="bg-navy-600 text-white hover:bg-navy-700 dark:bg-navy-500 dark:hover:bg-navy-600 flex items-center gap-2 cursor-pointer"
                        size="sm"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>회원가입</span>
                      </Button>
                    </Link>
                  </div>
                </>
              )}

              <Sheet className="block md:hidden">
                <SheetTrigger asChild>
                  <button
                    variant="ghost"
                    // size="icon"
                    // className="flex items-center justify-center relative group block md:hidden"
                    className="text-gray-600 hover:text-gray-800 p-2 lg:hidden flex items-center justify-center block md:hidden"
                  >
                    <Menu size={20} />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[280px] sm:w-[350px] p-0 border-r-0 block md:hidden border-none h-[100hv-64px] mb-[64px] z-100"
                >
                  <SidebarProfilePanel />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        {/* 스크롤링 공지사항 */}
        {showNotice &&
          location.pathname !== "/chat" &&
          location.pathname !== "/community" && (
            <ScrollingNotice onClose={() => setShowNotice(false)} />
          )}
      </div>

      {/* 헤더와 공지사항의 높이만큼 여백 추가 */}
      {location.pathname !== "/chat" && location.pathname !== "/community" && (
        <div className={`${showNotice ? "mt-[94px]" : "mt-16"}`} />
      )}

      <WriteModal
        Id={() => {
          if (pathSegments.length === 3 && pathSegments[1] === "channel") {
            return pathSegments[2];
          } else {
            return null;
          }
        }}
        fromComponent={"channel"}
        isOpen={writeModalOpen}
        onClose={() => setWriteModalOpen(false)}
      />
      <NotificationPanel
        isOpen={isNotificationOpen}
        onOpenChange={setIsNotificationOpen}
      />
    </>
  );
};

export default Navbar;
