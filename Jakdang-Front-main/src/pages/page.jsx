"use client";

import ImageContainerComponent from "@/components/ImageContainerComponent";
import ChannelDetailModal from "@/components/modal/detail-modal/channel-detail-modal";
import TipTabViewer from "@/components/modal/detail-modal/tiptab-viewer";
import WriteModal from "@/components/modal/write-modal/write-modal";
import ShareDialog from "@/components/shared/ShareDialog";
import { useToast } from "@/components/toast-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import { isAuthenticatedAtom, userInfoAtom } from "@/jotai/authAtoms";
import { useChannelApi } from "@/service/api/channelApi";
import { usePostApi } from "@/service/api/postApi";
import { formatRelativeTime } from "@/utils/formatDate";
import { useAtomValue } from "jotai";
import {
  BookOpen,
  ChevronRight,
  Rocket,
  Heart,
  MessageCircle,
  ThumbsUp,
  User,
  Plus,
  Share2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { hasYoutube } from "@/components/PostListComponent.jsx";
import AuthRequiredModal from "@/components/modal/auth-required-modal.jsx";
import { formatCount } from "@/utils/formatNumber";
import { Skeleton } from "@/components/ui/skeleton";
import ExpandableText from "@/components/ExpandableText";
import CodeBlock from "@/components/code-block";

export default function HomePage() {
  const navigate = useNavigate(); // Next.js의 useRouter 대신 React Router의 useNavigate 사용
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("recent");
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const userInfo = useAtomValue(userInfoAtom);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const { likePost, bookmarkPost } = usePostApi();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const isAuth = useAtomValue(isAuthenticatedAtom);

  // 프로필 메뉴 상태 관리
  const [activeProfileMenu, setActiveProfileMenu] = useState(null);

  const { activeChannelsQuery } = useChannelApi();
  const { isLoading, data: channelData, error } = activeChannelsQuery;

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // 게시물 데이터 가져오기
  const { useGet } = useAxiosQuery();
  const {
    data: popularPosts,
    isLoading: isLoadingPopularPosts,
    error: errorPopularPosts,
  } = useGet(["popularPosts"], `${import.meta.env.VITE_API_URL}/posts`, {
    member_id: userInfo?.userId,
    ownerId: "all",
    postType: "CHANNEL",
    sort: activeTab === "popular" ? "like_count,desc" : "publishedTime,desc",
    size: 5,
    page: 0,
  });

  useEffect(() => {
    if (!isLoadingPopularPosts && popularPosts?.data?.content?.length > 0) {
      const post = popularPosts?.data.content.find(
        (post) => post.id === selectedPost?.id
      );
      if (post) {
        setSelectedPost(post);
      }
    }
  }, [popularPosts, isLoadingPopularPosts, errorPopularPosts]);

  const { toast } = useToast();

  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const getChannelName = (ownerId) => {
    const channel = channelData?.data?.find(
      (channel) => channel.id === ownerId
    );
    return channel?.channelName;
  };

  const handleMouseDown = (e) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = "grabbing";
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = "grab";
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // 스크롤 속도 조절
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isDragging, startX, scrollLeft]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 문서 클릭 시 프로필 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveProfileMenu(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleWriteClick = () => {
    // 모바일에서도 모달을 사용하도록 수정
    setWriteModalOpen(true);
  };

  const handleLikeClick = async (postId) => {
    try {
      if (!isAuth) {
        setIsAuthModalOpen(true);
        return;
      }

      const res = await likePost(postId, userInfo.userId);
      if (res.result) {
        // 인기 게시물 목록에서 해당 게시물 업데이트
        if (popularPosts?.data?.content) {
          const updatedPopularPosts = { ...popularPosts };
          updatedPopularPosts.data.content =
            updatedPopularPosts.data.content.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    is_like: !post.is_like,
                    like_count: post.is_like
                      ? post.like_count - 1
                      : post.like_count + 1,
                  }
                : post
            );
          // 탠스택 쿼리 캐시 업데이트를 위한 코드가 필요하다면 여기에 추가
        }

        // 선택된 게시물 업데이트
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

  // 프로필 아바타 클릭 핸들러
  const handleAvatarClick = (e, postId) => {
    e.stopPropagation();
    // 이미 활성화된 메뉴가 있으면 닫고, 없으면 현재 포스트 ID로 설정
    setActiveProfileMenu(activeProfileMenu === postId ? null : postId);
  };

  const handleShare = async (post) => {
    try {
      setSelectedPost(post);
      setIsShareModalOpen(true);
    } catch (error) {
      console.error("링크 복사 실패:", error);
      toast({
        title: "링크 복사 실패",
        description: "링크를 복사하는데 실패했습니다.",
        variant: "error",
      });
    }
  };

  // 컴포넌트 최상위에 추가
  const [showFullMap, setShowFullMap] = useState({});

  return (
    <div className="min-h-screen pb-16 md:pb-0 bg-slate-50 dark:bg-navy-900 transition-colors duration-200 w-[100%]">
      <main className="container px-4 py-6 mx-auto w-[100%] max-w-[856px]">
        {/* 게시판 카테고리 */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <img src="/hashtag.png" alt="hashtag" className="w-10 h-10" />
              <h2 className="text-xl font-bold dark:text-white">채널</h2>
            </div>
            <Link to="/channel">
              <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500  hover:text-navy-600 cursor-pointer"
              >
                더보기 <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {isLoading && (
            <div className="flex flex-nowrap gap-3 pb-4 overflow-x-auto scrollbar-hide w-full whitespace-nowrap">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Skeleton
                  key={item}
                  className="h-10 w-32 rounded-full flex-shrink-0"
                />
              ))}
            </div>
          )}
          {error && <div>채널 정보를 불러오는 중 오류가 발생했습니다.</div>}
          {/*{channelData?.data && channelData?.data.length > 0 && (*/}
          {/*  <div*/}
          {/*    ref={scrollContainerRef}*/}
          {/*    className="flex flex-nowrap gap-3 pb-4 overflow-x-auto scrollbar-hide w-full whitespace-nowrap cursor-grab"*/}
          {/*    onMouseDown={handleMouseDown}*/}
          {/*    style={{ WebkitOverflowScrolling: "touch" }}*/}
          {/*  >*/}
          {/*    {channelData.data.map((channel) => (*/}
          {/*      <Link key={channel.id} to={`/channel/${channel.id}`}>*/}
          {/*        <Button*/}
          {/*          variant="ghost"*/}
          {/*          className="flex flex-shrink-0 items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full min-w-max font-semibold dark:bg-navy-700/50 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200 cursor-pointer transition-all border border-slate-200 dark:border-navy-600/50 shadow-sm hover:shadow-md"*/}
          {/*        >*/}
          {/*          <Avatar className="w-6 h-6">*/}
          {/*            <AvatarImage*/}
          {/*              src={channel.channelIconAddress || "/placeholder.svg"}*/}
          {/*              alt={channel.channelName}*/}
          {/*            />*/}
          {/*            <AvatarFallback>*/}
          {/*              {channel.channelName.substring(0, 1)}*/}
          {/*            </AvatarFallback>*/}
          {/*          </Avatar>*/}
          {/*          <span>{channel.channelName}</span>*/}
          {/*        </Button>*/}
          {/*      </Link>*/}
          {/*    ))}*/}
          {/*  </div>*/}
          {/*)}*/}
          {channelData?.data && channelData?.data.length > 0 && (
              <div
                  ref={scrollContainerRef}
                  className="flex flex-nowrap gap-3 pb-4 overflow-x-auto scrollbar-hide w-full whitespace-nowrap cursor-grab"
                  onMouseDown={handleMouseDown}
                  style={{ WebkitOverflowScrolling: "touch" }}
              >
                {[
                  // 먼저 channelName이 '작당'인 것들만 필터링
                  ...channelData.data.filter((channel) => channel.channelName === '작당'),
                  // 나머지 채널들은 '작당'이 아닌 것들
                  ...channelData.data.filter((channel) => channel.channelName !== '작당')
                ].map((channel) => (
                    <Button
                      key={channel.id}
                      variant="ghost"
                      className="flex flex-shrink-0 items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full min-w-max font-semibold dark:bg-navy-700/50 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200 cursor-pointer transition-all border border-slate-200 dark:border-navy-600/50 shadow-sm hover:shadow-md"
                      onClick={() => navigate("/channel", { state: { selectedChannelId: channel.id } })}
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage
                            src={channel.channelIconAddress || "/placeholder.svg"}
                            alt={channel.channelName}
                        />
                        <AvatarFallback>
                          {channel.channelName.substring(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{channel.channelName}</span>
                    </Button>
                ))}
              </div>
          )}
        </section>

        {/* 인기 게시물 */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {activeTab === "popular" ? (
                <img src="/fire.png" alt="fire" className="w-10 h-10" />
              ) : (
                <img src="/rocket.png" alt="rocket" className="w-10 h-10" />
              )}
              <h2 className="text-xl font-bold dark:text-white">
                {activeTab === "popular" ? "인기 게시물" : "최신 게시물"}
              </h2>
            </div>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="hidden sm:block"
            >
              <TabsList className="bg-gray-100 dark:bg-navy-700">
                <TabsTrigger
                  value="recent"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-navy-600 dark:text-gray-300 dark:data-[state=active]:text-white cursor-pointer"
                >
                  최신순
                </TabsTrigger>
                <TabsTrigger
                  value="popular"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-navy-600 dark:text-gray-300 dark:data-[state=active]:text-white cursor-pointer"
                >
                  인기순
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2 sm:hidden">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="sm:hidden sm:block"
              >
                <TabsList className="bg-gray-100 dark:bg-navy-700">
                  <TabsTrigger
                    value="recent"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-navy-600 dark:text-gray-300 dark:data-[state=active]:text-white cursor-pointer"
                  >
                    최신순
                  </TabsTrigger>
                  <TabsTrigger
                    value="popular"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-navy-600 dark:text-gray-300 dark:data-[state=active]:text-white cursor-pointer"
                  >
                    인기순
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="space-y-4">
            {isLoadingPopularPosts && (
              <Card className="overflow-hidden border dark:border-navy-700 dark:bg-navy-800 hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center mb-3">
                    <Skeleton className="w-10 h-10 rounded-full mr-3" />
                    <div>
                      <Skeleton className="w-32 h-5 mb-1" />
                      <Skeleton className="w-24 h-3" />
                    </div>
                  </div>
                  <Skeleton className="w-full h-5 mb-2" />
                  <Skeleton className="w-3/4 h-4 mb-4" />
                  <Skeleton className="w-full h-32 mb-4" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-16 h-6" />
                    <Skeleton className="w-16 h-6" />
                    <Skeleton className="w-20 h-6" />
                  </div>
                </CardContent>
              </Card>
            )}
            {!isLoadingPopularPosts && errorPopularPosts && (
              <Card className="overflow-hidden border dark:border-navy-700 dark:bg-navy-800 hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center mb-3">
                    게시물을 불러오는 중 오류가 발생했습니다.
                  </div>
                </CardContent>
              </Card>
            )}
            {!isLoadingPopularPosts &&
              popularPosts?.data?.content?.length === 0 && (
                <Card className="overflow-hidden border dark:border-navy-700 dark:bg-navy-800 hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center mb-3">
                      게시물이 없습니다.
                    </div>
                  </CardContent>
                </Card>
              )}
            {!isLoadingPopularPosts &&
              popularPosts?.data.content.map((post) => {
                const showFull = showFullMap[post.id] || false;
                // 미리보기용 본문 일부(모든 유튜브 + 텍스트 100자 + 첫 코드블럭 1개) 추출
                let previewHtml = "";
                let previewYoutubeIframes = [];
                if (post.contents) {
                  // 모든 유튜브 iframe 추출
                  previewYoutubeIframes = post.contents.match(/<iframe.*?youtube.*?<\/iframe>/g) || [];
                  // 첫 코드블럭 추출
                  const codeBlockMatch = post.contents.match(/<pre.*?>[\s\S]*?<\/pre>|<code.*?>[\s\S]*?<\/code>/i);
                  const codeBlock = codeBlockMatch ? codeBlockMatch[0] : "";
                  // 텍스트 100자 추출 (유튜브, 코드블럭 제거 후)
                  const textOnly = post.contents
                    .replace(/<iframe.*?youtube.*?<\/iframe>/g, "")
                    .replace(/<pre.*?>[\s\S]*?<\/pre>/gi, "")
                    .replace(/<code.*?>[\s\S]*?<\/code>/gi, "")
                    .replace(/<[^>]+>/g, "")
                    .replace(/\n/g, " ") || "";
                  const textPreview = textOnly.slice(0, 100);
                  previewHtml =
                    (textPreview ? `<p>${textPreview}${textOnly.length > 100 ? "..." : ""}</p>` : "") +
                    codeBlock;
                }
                return (
                  <Card
                    key={post.id}
                    className="overflow-hidden border dark:border-navy-700 dark:bg-navy-800 hover:shadow-md transition-shadow"
                  >
                    <CardContent
                      className="p-4 sm:p-6"
                      onClick={() => {
                        setSelectedChannelId(post.owner_id);
                        setSelectedPost(post);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <div className="flex items-center mb-3">
                        <div
                          className="relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Avatar
                            className="w-10 h-10 mr-3 border cursor-pointer"
                            onClick={(e) => handleAvatarClick(e, post.id)}
                          >
                            <AvatarImage
                              src={post.author?.image || "/placeholder.svg"}
                              alt={post.author}
                            />
                            <AvatarFallback
                              className="text-white"
                              style={{
                                backgroundColor:
                                  post.author?.backgroundColor || "#FFC107",
                              }}
                            >
                              {post.author?.nickname?.substring(0, 1) || "?"}
                            </AvatarFallback>
                          </Avatar>

                          {/* 프로필 메뉴 */}
                          {isAuth && activeProfileMenu === post.id && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-navy-800 rounded-md shadow-lg z-10 border dark:border-navy-700">
                              <div className="py-1">
                                <button
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-navy-700"
                                  onClick={() =>
                                    navigate(`/profile/${post.author?.id}`)
                                  }
                                >
                                  <User className="mr-2 h-4 w-4" />
                                  프로필 보기
                                </button>
                                {/* <button
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-navy-700"
                                  onClick={() => navigate(`/messages/${post.author?.id}`)}
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  메시지 보내기
                                </button> */}
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <p className="text-[15px] font-semibold dark:text-white">
                              {post.author?.nickname || "Unknown User"}
                            </p>
                            <Badge className="ml-2 bg-navy-600 text-black text-[10px] font-bold dark:bg-navy-600 dark:text-navy-100">
                              {isLoading
                                ? "로딩중..."
                                : getChannelName(post.owner_id) ??
                                  "알 수 없는 채널"}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatRelativeTime(post.published_time, 1)}
                          </p>
                        </div>
                      </div>

                      <h3 className="mb-2 text-base font-bold dark:text-white truncate">
                        {post.title}
                      </h3>
                      {/* 게시글 본문 */}
                      {showFull ? (
                        <>
                          <TipTabViewer post={post} />
                          <button
                            className="px-3 py-1 rounded-full font-semibold text-navy-600 bg-navy-50 hover:bg-navy-100 transition-colors duration-150 cursor-pointer text-[12px] mb-2"
                            onClick={e => {
                              e.stopPropagation();
                              setShowFullMap(prev => ({ ...prev, [post.id]: false }));
                            }}
                          >
                            접기
                          </button>
                        </>
                      ) : (
                        <>
                          {/* 유튜브는 직접 렌더링 */}
                          {previewYoutubeIframes.map((iframe, idx) => (
                            <div key={idx} dangerouslySetInnerHTML={{ __html: iframe }} className="mb-2" />
                          ))}
                          {/* 텍스트+코드블럭은 TipTabViewer로 */}
                          <div className="mb-2">
                            <TipTabViewer post={{ ...post, contents: previewHtml }} />
                          </div>
                          {post.contents && post.contents.replace(/<[^>]+>/g, "").length > 100 && (
                            <button
                              className="inline-block self-start px-3 py-1 rounded-full font-semibold text-navy-600 bg-navy-50 hover:bg-navy-100 transition-colors duration-150 cursor-pointer text-[12px] mb-2"
                              onClick={e => {
                                e.stopPropagation();
                                setShowFullMap(prev => ({ ...prev, [post.id]: true }));
                              }}
                            >
                              더보기
                            </button>
                          )}
                        </>
                      )}

                      {/* 유튜브가 없고 이미지가 있으면 바로 이미지 출력 */}
                      {!hasYoutube(post) && post.file_ids.length > 0 && (
                        <ImageContainerComponent post={post} />
                      )}

                      {/* 유튜브가 있고 이미지가 있을 경우 → 더보기 버튼 또는 이미지 */}
                      {/*{hasYoutube(post) && post.file_ids.length > 0 && (*/}
                      {/*  <p>...더보기</p>*/}
                      {/*)}*/}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            variant="ghost"
                            // size="sm"
                            className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-navy-600 dark:hover:text-navy-300 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLikeClick(post.id);
                            }}
                          >
                            <Heart
                              // className="w-4 h-4"
                              className={`w-5 h-5 ${
                                post.is_like ? "text-red-500 fill-red-500" : ""
                              }`}
                              fill={post.is_like ? "currentColor" : "none"}
                            />
                            <div className="font-semibold text-sm">
                              {post.like_count} 개
                            </div>
                          </button>
                          <button
                            variant="ghost"
                            // size="sm"
                            className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-navy-600 dark:hover:text-navy-300 cursor-pointer"
                            onClick={(e) => {
                              setSelectedChannelId(post.owner_id);
                              setSelectedPost(post);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <MessageCircle className="w-5 h-5" />
                            <div className="font-semibold text-sm">
                              {post.comment_count} 개
                            </div>
                          </button>
                          <button
                            variant="ghost"
                            // size="sm"
                            className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-navy-600 dark:hover:text-navy-300 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleShare(post)
                            }}
                          >
                            <Share2 className="w-5 h-5" />
                            <div className="font-semibold text-sm">공유하기</div>
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </section>

        <section className="mb-8">
          <div className="gap-6 md:grid-cols-2 md:grid w-full">
            {isLoading ? (
              <>
                <ChannelSkeleton />
                <ChannelSkeleton />
                <ChannelSkeleton />
                <ChannelSkeleton />
              </>
            ) : (
              channelData?.data &&
              channelData?.data.length > 0 &&
              channelData?.data
                .slice(0, 4)
                .map((channel) => (
                  <ChannelContent
                    channel={channel}
                    key={channel.id}
                    setSelectedChannelId={setSelectedChannelId}
                    setSelectedPost={setSelectedPost}
                  />
                ))
            )}
          </div>
        </section>
      </main>

      {/* 모바일 글쓰기 버튼 */}
      {isMobile && isAuth && (
        <button
          onClick={handleWriteClick}
          className="fixed right-6 bottom-20 z-50 w-12 h-12 rounded-full bg-[#FFC107] text-white shadow-lg flex items-center justify-center hover:bg-[#FFB300] transition-colors"
        >
          <Plus size={24} />
        </button>
      )}

      {/* 글쓰기 모달 */}
      <WriteModal
        isOpen={writeModalOpen}
        onClose={() => setWriteModalOpen(false)}
        fromComponent="channel"
      />

      {/* 상세보기 모달 */}
      <ChannelDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPost(null);
        }}
        channelId={selectedChannelId}
        post={selectedPost}
        onLikeClick={handleLikeClick}
        onBookmarkClick={handleBookmarkClick}
      />

      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {
        isShareModalOpen && selectedPost &&
          <ShareDialog
              isOpen={isShareModalOpen}
              onOpenChange={setIsShareModalOpen}
              post={selectedPost}
          />
      }
    </div>
  );

  function ChannelContent({ channel, setSelectedChannelId, setSelectedPost }) {
    const navigate = useNavigate();
    // 게시물 데이터 가져오기
    const { useGet } = useAxiosQuery();
    const { data, isLoading, error } = useGet(
      ["channel", channel.id],
      `${import.meta.env.VITE_API_URL}/posts?member_id=${
        userInfo.userId
      }&ownerId=${channel.id}&sort=publishedTime,desc&size=5&page=0`
    );

    // console.log("channel", channel);

    return (
      <section
        key={channel.id}
        className="p-4 bg-white rounded-lg shadow-sm dark:bg-navy-800 dark:border dark:border-navy-700 hover:shadow-md transition-shadow md:mb-0 mb-3"
      >
        <div className="flex items-center justify-between mb-4 w-full">
          <div className="flex items-center w-full">
            <div className="flex items-center justify-center w-8 h-8 mr-2 bg-gray-200 rounded-full dark:bg-navy-600">
              {channel && channel.channelIconAddress === null ? (
                channel.channelName.charAt(0)
              ) : (
                <img
                  src={channel.channelIconAddress || "/placeholder.svg"}
                  alt={channel.channelIconAddress}
                  width={30}
                  height={30}
                  className="rounded-full"
                />
              )}
            </div>
            <h3 className="text-lg font-bold">{channel.channelName}</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500  hover:text-navy-600 cursor-pointer"
            onClick={() => navigate('/channel', { state: { selectedChannelId: channel.id } })}
          >
            더보기 <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3 w-full">
          {isLoading && (
            <div className="space-y-3 w-full">
              <Skeleton className="w-full h-6 mb-2" />
              <Skeleton className="w-full h-6 mb-2" />
              <Skeleton className="w-full h-6 mb-2" />
              <Skeleton className="w-full h-6 mb-2" />
              <Skeleton className="w-full h-6" />
            </div>
          )}
          {!isLoading && error && (
            <div>게시물을 불러오는 중 오류가 발생했습니다.</div>
          )}
          {!isLoading && data?.data.content.length === 0 && (
            <div>게시물이 없습니다.</div>
          )}
          {!isLoading &&
            !error &&
            data?.data.content.map((post, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-100 cursor-pointer hover:text-navy-600 dark:border-navy-700 dark:text-gray-300 dark:hover:text-navy-300 transition-colors w-full"
                onClick={() => {
                  setSelectedChannelId(post.owner_id);
                  setSelectedPost(post);
                  setIsDetailModalOpen(true);
                }}
              >
                <h4 className="text-sm font-medium truncate overflow-hidden whitespace-nowrap w-[70%]">
                  {post.title}
                </h4>
                <div className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400 justify-items-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-navy-600 dark:hover:text-navy-300 cursor-pointer justify-items-start min-w-[50px]"
                    style={{ padding: "0px" }}
                    onClick={(e) => {
                      e.stopPropagation(); // ✅ 이벤트 버블링 막기
                      handleLikeClick(post.id);
                    }}
                  >
                    <Heart
                      className={`w-6 h-6 ${
                        post.is_like ? "text-red-500 fill-red-500" : ""
                      }`}
                      fill={post.is_like ? "currentColor" : "none"}
                    />
                    <span className="w-6 text-left">
                      {formatCount(post.like_count)}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-navy-600 dark:hover:text-navy-300 cursor-pointer min-w-[50px]"
                    style={{ padding: "0px" }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="w-6 text-left">
                      {formatCount(post.comment_count)}
                    </span>
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </section>
    );
  }
}

function ChannelSkeleton() {
  return (
    <section className="p-4 bg-white rounded-lg shadow-sm dark:bg-navy-800 dark:border dark:border-navy-700 hover:shadow-md transition-shadow md:mb-0 mb-3">
      <div className="flex items-center justify-between mb-4 w-full">
        <div className="flex items-center w-full">
          <Skeleton className="w-8 h-8 rounded-full mr-2" />
          <Skeleton className="w-32 h-6" />
        </div>
        <Skeleton className="w-20 h-8" />
      </div>
      <div className="space-y-3 w-full">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-navy-700"
          >
            <Skeleton className="w-3/4 h-5" />
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-16 h-6" />
              <Skeleton className="w-16 h-6" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
