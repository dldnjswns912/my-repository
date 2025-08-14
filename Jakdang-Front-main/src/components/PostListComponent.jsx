"use client";

import { Badge } from "@/components/ui/badge";

import { isAuthenticatedAtom, userInfoAtom } from "@/jotai/authAtoms";
import { usePostApi } from "@/service/api/postApi";
import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import { formatRelativeTime } from "@/utils/formatDate";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import {
  Heart,
  MessageCircle,
  MoreVertical,
  Pencil,
  Trash2,
  User,
  Share2,
  Bookmark,
} from "lucide-react";
import ShareDialog from "@/components/shared/ShareDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import TipTabViewer from "./modal/detail-modal/tiptab-viewer";
import ImageContainerComponent from "./ImageContainerComponent";
import { useToast } from "./toast-provider";
import WriteModal from "./modal/write-modal/write-modal";
import AuthRequiredModal from "@/components/modal/auth-required-modal.jsx";
import { useNavigate } from "react-router-dom";
import ExpandableText from "@/components/ExpandableText";

const PostListComponent = ({
  ownerId,
  postType,
  handlePostClick,
  setPosts,
  sort,
  onLikeClick,
  onBookmarkClick,
  activeProfileMenu,
  handleAvatarClick,
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const userInfo = useAtomValue(userInfoAtom);
  const { usePostInfiniteScroll, deletePost } = usePostApi();
  const loaderElementRef = useRef(null);
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const { toast } = useToast();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const navigate = useNavigate();
  const [showFullMap, setShowFullMap] = useState({});

  const {
    items: postItems,
    isLoading: isPostLoading,
    fetchNextPage: fetchNextPostPage,
    hasNextPage: hasNextPostPage,
    loaderRef: postLoaderRef,
  } = usePostInfiniteScroll({
    member_id: userInfo?.userId,
    ownerId: ownerId,
    postType: postType === "ORGANIZATION" ? "ORGANIZATION,NOTICE" : postType,
    sort: sort,
    size: 10,
  });

  useEffect(() => {
    if (loaderElementRef.current) {
      postLoaderRef(loaderElementRef.current);
    }
  }, [postLoaderRef, postItems]);

  // items가 변경될 때마다 부모의 posts 상태 업데이트
  useEffect(() => {
    if (postItems) {
      const formattedPosts = postItems.map((post) => ({
        ...post,
        authorAvatar: post.author?.avatar || "/placeholder.svg",
        created_at: post.published_time,
        image: post.files?.[0]?.url || null,
        tags: post.tags || [],
      }));
      setPosts(formattedPosts);
    }
  }, [postItems, setPosts]);

  const handlePostDelete = async (e, post) => {
    e.stopPropagation();

    if (!confirm("정말로 이 게시물을 삭제하시겠습니까?")) return;

    try {
      const res = await deletePost(post.id, userInfo.userId);

      if (res.result) {
        toast({
          title: "게시물이 삭제되었습니다.",
          description: "게시물이 성공적으로 삭제되었습니다.",
          variant: "success",
        });
      } else {
        console.error(res);
        toast({
          title: "게시물 삭제 실패",
          description:
            "게시물 삭제 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
          variant: "error",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "게시물 삭제 실패",
        description:
          "게시물 삭제 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "error",
      });
    }
  };

  const handleBookmarkClick = async (e, postId) => {
    e.stopPropagation();
    if (!isAuth) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      await onBookmarkClick(postId);
    } catch (error) {
      console.error(error);
      toast({
        title: "북마크 작업 실패",
        description: "북마크 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "error",
      });
    }
  };

  console.log("postItems", postItems);

  return (
    <div className="space-y-4">
      {!isPostLoading && postItems.length === 0 && (
        <Card className="overflow-hidden border dark:border-navy-700 dark:bg-navy-800 hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-6 flex justify-center items-center">
            게시물이 없습니다.
          </CardContent>
        </Card>
      )}
      {!isPostLoading ? (
        postItems.map((post) => {
          const showFull = showFullMap[post.id] || false;
          const youtubeIframes = post.contents?.match(/<iframe.*?youtube.*?<\/iframe>/g) || [];
          const textWithoutYoutube = post.contents
            ?.replace(/<iframe.*?youtube.*?<\/iframe>/g, "")
            .replace(/<[^>]+>/g, "")
            .replace(/\n/g, " ") || "";
          return (
            <Card
              key={post.id}
              className="overflow-hidden border dark:border-navy-700 dark:bg-navy-800 hover:shadow-md transition-shadow"
              onClick={() => {
                handlePostClick(post);
              }}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div
                      className="relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Avatar
                        className="w-10 h-10 mr-3 border dark:border-navy-600 cursor-pointer"
                        onClick={(e) => handleAvatarClick(e, post.id)}
                      >
                        <AvatarImage
                          src={post.author?.image || "/placeholder.svg"}
                          alt={post.author}
                        />
                        <AvatarFallback
                          className="text-white"
                          style={{
                            backgroundColor: post.author.backgroundColor
                              ? post.author.backgroundColor
                              : "#FFC107",
                          }}
                        >
                          {post.author?.nickname?.substring(0, 1) || "?"}
                        </AvatarFallback>
                      </Avatar>

                      {/* 프로필 메뉴 */}
                      {activeProfileMenu === post.id && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-navy-800 rounded-md shadow-lg z-10 border dark:border-navy-700">
                          <div className="py-1">
                            <button
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-navy-700"
                              onClick={(e) =>
                                navigate(`/profile/${post.author?.id}`)
                              }
                            >
                              <User className="mr-2 h-4 w-4" />
                              프로필 보기
                            </button>
                            {/* <button
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-navy-700"
                            onClick={(e) => navigate(`/messages/${post.author?.id}`)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            메시지 보내기
                          </button> */}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-start">
                        <p className="font-medium dark:text-white">
                          {post.author?.nickname || "Unknown User"}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatRelativeTime(post.published_time, 1)}
                      </p>
                    </div>
                  </div>

                  {post.author_id === userInfo.userId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            // 먼저 선택된 포스트 설정 후 모달 열기
                            setSelectedPost(post);
                            // 약간의 지연 후 모달 열기
                            setTimeout(() => {
                              setWriteModalOpen(true);
                            }, 50);
                          }}
                        >
                          {/* handlePostEditStart */}
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>수정</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => handlePostDelete(e, post)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>삭제</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <h3 className="mb-2 text-lg font-bold dark:text-white">
                  {post.title}
                </h3>
                {/* 게시글 본문 더보기/접기 */}
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
                    {(post.contents?.match(/<iframe.*?youtube.*?<\/iframe>/g) || []).map((iframe, idx) => (
                      <div key={idx} dangerouslySetInnerHTML={{ __html: iframe }} className="mb-2" />
                    ))}
                    {/* 텍스트+코드블럭은 TipTabViewer로 */}
                    {(() => {
                      let previewHtml = "";
                      if (post.contents) {
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
                        <div className="mb-2">
                          <TipTabViewer post={{ ...post, contents: previewHtml }} />
                        </div>
                      );
                    })()}
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
                {/*{hasYoutube(post) && post.file_ids.length > 0 && <p>...더보기</p>}*/}

                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags?.map((tag, index) => (
                    <Badge
                      key={index}
                      className="bg-navy-100 text-navy-700 dark:bg-navy-600 dark:text-navy-100"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      variant="ghost"
                      // size="sm"
                      className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-navy-600 dark:hover:text-navy-300 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation(); // ✅ 이벤트 버블링 막기

                        if (!isAuth) {
                          setIsAuthModalOpen(true);
                          return;
                        }

                        onLikeClick(post.id);
                      }}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          post.is_like ? "text-red-500 fill-red-500" : ""
                        }`}
                        fill={post.is_like ? "currentColor" : "none"}
                      />
                      <div className="font-semibold text-sm">
                        {post.like_count ?? 0} 개
                      </div>
                    </button>
                    <button
                      variant="ghost"
                      // size="sm"
                      className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-navy-600 dark:hover:text-navy-300 cursor-pointer"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <div className="font-semibold text-sm">
                        {post.comment_count ?? 0} 개
                      </div>
                    </button>
                    <button
                      variant="ghost"
                      // size="sm"
                      className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-navy-600 dark:hover:text-navy-300 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPost(post);
                        setIsShareModalOpen(true);
                      }}
                      title="공유하기"
                    >
                      <Share2 className="w-5 h-5" />
                      <div className="font-semibold text-sm">공유하기</div>
                    </button>
                    <button
                      variant="ghost"
                      className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-navy-600 dark:hover:text-navy-300 cursor-pointer"
                      onClick={(e) => handleBookmarkClick(e, post.id)}
                    >
                      <Bookmark className={`w-5 h-5 ${post.is_bookmark ? "text-navy-700 fill-navy-600" : ""}`} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <Card className="overflow-hidden border dark:border-navy-700 dark:bg-navy-800 hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-6 flex justify-center items-center">
            로딩중...
          </CardContent>
        </Card>
      )}

      <div ref={loaderElementRef} className="flex justify-center items-center">
        <Card className="w-full">
          {isPostLoading ? (
            <CardContent className="p-4 sm:p-6 flex justify-center items-center">
              <span className="text-gray-500 dark:text-gray-400">
                로딩중...
              </span>
            </CardContent>
          ) : hasNextPostPage ? (
            <Button variant="outline" onClick={fetchNextPostPage}>
              더 보기
            </Button>
          ) : (
            !isPostLoading &&
            postItems.length != 0 && (
              <CardContent className="p-4 sm:p-6 flex justify-center items-center">
                <span className="text-gray-500 dark:text-gray-400">
                  더 이상 게시물이 없습니다.
                </span>
              </CardContent>
            )
          )}
        </Card>
      </div>
      {/* 글쓰기 모달 */}
      <WriteModal
        id={() => {
          return ownerId;
        }}
        fromComponent={"channel"}
        isOpen={writeModalOpen}
        onClose={() => {
          // 모달을 닫고 선택된 포스트 초기화
          setWriteModalOpen(false);
          // 약간의 지연 후 선택된 포스트 초기화
          setTimeout(() => {
            setSelectedPost(null);
          }, 100);
        }}
        isEditing={!!selectedPost}
        post={selectedPost}
      />

      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {isShareModalOpen && selectedPost && (
        <ShareDialog
          isOpen={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          post={selectedPost}
        />
      )}
    </div>
  );
};

export default PostListComponent;

export const hasYoutube = (post) => {
  return post.contents.includes("youtube.com/embed");
};
