import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAtomValue } from "jotai";
import { userInfoAtom, isAuthenticatedAtom } from "@/jotai/authAtoms";
import { useChannelApi } from "@/service/api/channelApi";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {ChevronRight, MessageCircle, Heart, User, Plus} from "lucide-react";
import { formatRelativeTime } from "@/utils/formatDate";
import { formatCount } from "@/utils/formatNumber";
import TipTabViewer from "@/components/modal/detail-modal/tiptab-viewer";
import ChannelDetailModal from "@/components/modal/detail-modal/channel-detail-modal";
import { usePostApi } from "@/service/api/postApi";
import { useNavigate } from "react-router-dom";
import WriteModal from "@/components/modal/write-modal/write-modal.jsx";
import {useMediaQuery} from "@/hooks/use-media-query.jsx";

export default function ChannelInfoPage() {
  const location = useLocation();
  const initialChannelId = location.state?.selectedChannelId || "all";
  const [selectedChannelId, setSelectedChannelId] = useState(initialChannelId);
  const userInfo = useAtomValue(userInfoAtom);
  const { activeChannelsQuery } = useChannelApi();
  const { isLoading, data: channelData, error } = activeChannelsQuery;
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // 채널 스크롤 드래그
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
    const walk = (x - startX) * 2;
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

  // 최신 게시물 무한 스크롤 데이터
  const { usePostInfiniteScroll, likePost, bookmarkPost } = usePostApi();
  const {
    items: postItems,
    isLoading: isPostLoading,
    isFetchingNextPage,
    hasNextPage,
    loaderRef,
    error: postError,
  } = usePostInfiniteScroll({
    member_id: userInfo?.userId,
    ownerId: selectedChannelId === "all" ? "all" : selectedChannelId,
    postType: "CHANNEL",
    sort: "publishedTime,desc",
    size: 10,
  });

  // 채널명 가져오기
  const getChannelName = (ownerId) => {
    const channel = channelData?.data?.find((c) => c.id === ownerId);
    return channel?.channelName;
  };

  // showFullMap: 각 게시글별 더보기/접기 상태 관리
  const [showFullMap, setShowFullMap] = useState({});

  // 디테일 모달 상태
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const isAuth = useAtomValue(isAuthenticatedAtom);

  // 프로필 메뉴 상태 관리
  const [activeProfileMenu, setActiveProfileMenu] = useState(null);
  const navigate = useNavigate();

  // 프로필 아바타 클릭 핸들러
  const handleAvatarClick = (e, postId) => {
    e.stopPropagation();
    setActiveProfileMenu(activeProfileMenu === postId ? null : postId);
  };

  // 문서 클릭 시 프로필 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveProfileMenu(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleWriteClick = () => {
    setWriteModalOpen(true);
  };
 
  return (
    <div className="min-h-screen pb-16 bg-slate-50 dark:bg-navy-900 transition-colors duration-200 w-full">
      <main className="container px-4 py-6 mx-auto w-full max-w-[856px]">
        {/* 채널 영역 */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {isLoading || !channelData
                ? (
                  <>
                    <img src="/hashtag.png" alt="hashtag" className="w-10 h-10" />
                    <h2 className="text-xl font-bold dark:text-white ml-2">채널</h2>
                  </>
                )
                : selectedChannelId === "all"
                  ? (
                    <>
                      <img src="/hashtag.png" alt="hashtag" className="w-10 h-10" />
                      <h2 className="text-xl font-bold dark:text-white ml-2">채널</h2>
                    </>
                  )
                  : (() => {
                      const selectedChannel = channelData.data.find(
                        c => String(c.id) === String(selectedChannelId)
                      );
                      return selectedChannel ? (
                        <>
                          {selectedChannel.channelIconAddress ? (
                            <img
                              src={selectedChannel.channelIconAddress}
                              alt={selectedChannel.channelName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-lg font-bold text-white">
                              {selectedChannel.channelName?.[0] || "?"}
                            </div>
                          )}
                          <h2 className="text-xl font-bold dark:text-white ml-2">{selectedChannel.channelName}</h2>
                        </>
                      ) : (
                        <>
                          <img src="/placeholder.svg" alt="채널" className="w-10 h-10" />
                          <h2 className="text-xl font-bold dark:text-white ml-2">채널</h2>
                        </>
                      );
                    })()
              }
            </div>
          </div>
          {isLoading && (
            <div className="flex flex-nowrap gap-3 pb-4 overflow-x-auto scrollbar-hide w-full whitespace-nowrap">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Skeleton key={item} className="h-10 w-32 rounded-full flex-shrink-0" />
              ))}
            </div>
          )}
          {error && <div>채널 정보를 불러오는 중 오류가 발생했습니다.</div>}
          {channelData?.data && channelData?.data.length > 0 && (
            <div
              ref={scrollContainerRef}
              className="flex flex-nowrap gap-3 pb-4 overflow-x-auto scrollbar-hide w-full whitespace-nowrap cursor-grab"
              onMouseDown={handleMouseDown}
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <Button
                variant="ghost"
                className={`flex flex-shrink-0 items-center gap-2 px-4 py-2 rounded-full min-w-max font-semibold cursor-pointer transition-all border shadow-sm hover:shadow-md
                  ${selectedChannelId === "all"
                    ? "bg-navy-600 text-white border-navy-600 dark:bg-navy-600 dark:text-navy-100"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-navy-700/50 dark:hover:bg-navy-600 dark:text-slate-200 border-slate-200 dark:border-navy-600/50"}
                `}
                onClick={() => setSelectedChannelId("all")}
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage src="/hashtag.png" alt="전체" />
                  <AvatarFallback>전체</AvatarFallback>
                </Avatar>
                <span>전체</span>
              </Button>
              {[
                ...channelData.data.filter((c) => c.channelName === "작당"),
                ...channelData.data.filter((c) => c.channelName !== "작당"),
              ].map((channel) => (
                <Button
                  key={channel.id}
                  variant="ghost"
                  className={`flex flex-shrink-0 items-center gap-2 px-4 py-2 rounded-full min-w-max font-semibold cursor-pointer transition-all border shadow-sm hover:shadow-md
                    ${selectedChannelId === channel.id
                      ? "bg-navy-600 text-white border-navy-600 dark:bg-navy-600 dark:text-navy-100"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-navy-700/50 dark:hover:bg-navy-600 dark:text-slate-200 border-slate-200 dark:border-navy-600/50"}
                  `}
                  onClick={() => setSelectedChannelId(channel.id)}
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={channel.channelIconAddress || "/placeholder.svg"} alt={channel.channelName} />
                    <AvatarFallback>{channel.channelName.substring(0, 1)}</AvatarFallback>
                  </Avatar>
                  <span>{channel.channelName}</span>
                </Button>
              ))}
            </div>
          )}
        </section>

        {/* 최신 게시물 영역 */}
        <section className="mb-4">
          <div className="space-y-4">
            {isPostLoading && (
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
            {!isPostLoading && postError && (
              <Card className="overflow-hidden border dark:border-navy-700 dark:bg-navy-800 hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center mb-3">
                    게시물을 불러오는 중 오류가 발생했습니다.
                  </div>
                </CardContent>
              </Card>
            )}
            {!isPostLoading && postItems.length === 0 && (
              <Card className="overflow-hidden border dark:border-navy-700 dark:bg-navy-800 hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center mb-3">게시물이 없습니다.</div>
                </CardContent>
              </Card>
            )}
            {!isPostLoading &&
              postItems.map((post) => {
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
                  <Card key={post.id} className="overflow-hidden border dark:border-navy-700 dark:bg-navy-800 hover:shadow-md transition-shadow">
                    <CardContent
                      className="p-4 sm:p-6 cursor-pointer"
                      onClick={() => {
                        setSelectedChannelId(post.owner_id);
                        setSelectedPost(post);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <div className="flex items-center mb-3">
                        <div className="relative" onClick={e => e.stopPropagation()}>
                          <Avatar
                            className="w-10 h-10 mr-3 border cursor-pointer"
                            onClick={e => handleAvatarClick(e, post.id)}
                          >
                            <AvatarImage src={post.author?.image || "/placeholder.svg"} alt={post.author?.nickname} />
                            <AvatarFallback className="text-white" style={{ backgroundColor: post.author?.backgroundColor || "#FFC107" }}>
                              {post.author?.nickname?.substring(0, 1) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          {/* 프로필 메뉴 */}
                          {isAuth && activeProfileMenu === post.id && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-navy-800 rounded-md shadow-lg z-10 border dark:border-navy-700">
                              <div className="py-1">
                                <button
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-navy-700"
                                  onClick={() => navigate(`/profile/${post.author?.id}`)}
                                >
                                  <User className="mr-2 h-4 w-4" />
                                  프로필 보기
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <p className="text-[15px] font-semibold dark:text-white">{post.author?.nickname || "Unknown User"}</p>
                            <Badge className="ml-2 bg-navy-600 text-black text-[10px] font-bold dark:bg-navy-600 dark:text-navy-100">
                              {isLoading ? "로딩중..." : getChannelName(post.owner_id) ?? "알 수 없는 채널"}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(post.published_time, 1)}</p>
                        </div>
                      </div>
                      <h3 className="mb-2 text-base font-bold dark:text-white truncate">{post.title}</h3>
                      {/* 본문 미리보기 및 더보기/접기 */}
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
                          {previewYoutubeIframes.map((iframe, idx) => (
                            <div key={idx} dangerouslySetInnerHTML={{ __html: iframe }} className="mb-2" />
                          ))}
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                            <Heart className={`w-5 h-5 ${post.is_like ? "text-red-500 fill-red-500" : ""}`} fill={post.is_like ? "currentColor" : "none"} />
                            <div className="font-semibold text-sm">{formatCount(post.like_count)} 개</div>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                            <MessageCircle className="w-5 h-5" />
                            <div className="font-semibold text-sm">{formatCount(post.comment_count)} 개</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            {/* 무한 스크롤 로더 */}
            <div ref={loaderRef} className="flex justify-center items-center">
              {isFetchingNextPage && (
                <span className="text-gray-500 dark:text-gray-400">로딩중...</span>
              )}
              {!hasNextPage && postItems.length > 0 && (
                <span className="text-gray-500 dark:text-gray-400">더 이상 게시물이 없습니다.</span>
              )}
            </div>
          </div>
        </section>
      </main>
      {/* 상세보기 모달 */}
      <ChannelDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPost(null);
        }}
        channelId={selectedChannelId}
        post={selectedPost}
        onLikeClick={likePost}
        onBookmarkClick={bookmarkPost}
      />

      <WriteModal
          // id={() => channelId}
          fromComponent="channel"
          isOpen={writeModalOpen}
          onClose={() => setWriteModalOpen(false)}
          isEditing={false}
          post={null}
      />

      {isMobile && isAuth && (
          <button
              onClick={handleWriteClick}
              className="fixed right-6 bottom-20 z-50 w-12 h-12 rounded-full bg-[#FFC107] text-white shadow-lg flex items-center justify-center hover:bg-[#FFB300] transition-colors"
          >
            <Plus size={24} />
          </button>
      )}
    </div>
  );
}
