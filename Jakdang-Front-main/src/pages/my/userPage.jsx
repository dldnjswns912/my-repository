"use client";

import ChannelDetailModal from "@/components/modal/detail-modal/channel-detail-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import { useChatService } from "@/hooks/useChatService";
import { userInfoAtom } from "@/jotai/authAtoms";
import { activeChatRoomAtom, chatRoomsAtom } from "@/jotai/chatAtoms";
import { usePostApi } from "@/service/api/postApi";
import { RoomType } from "@/utils/constant/constants";
import { applyTimezoneWithPattern } from "@/utils/formatDate";
import DOMPurify from "dompurify";
import { useAtom, useAtomValue } from "jotai";
import { Heart, Loader2, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const UserProfile = () => {
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const userInfo = useAtomValue(userInfoAtom);
  const location = useLocation();
  const navigate = useNavigate();
  const param = useParams();
  const userId = param.id;
  const { useGet } = useAxiosQuery();
  const {
    data: userData,
    isLoading: isUserDataLoading,
    isError: isUserError,
  } = useGet(
    `profile/${userId}`,
    `/user/profile/${userId}`,
    {},
    {
      enabled: !!userId,
    }
  );  const [_, setActiveRoom] = useAtom(activeChatRoomAtom);
  const { createRoom, inviteToRoom, createOrFindDirectRoom } = useChatService(userInfo?.userId);
  const [chatRoomLists, setChatRooms] = useAtom(chatRoomsAtom);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);  const [totalElements, setTotalElements] = useState(0);
  const [userActivity, setUserActivity] = useState([]);
  const { likePost, bookmarkPost } = usePostApi();

  const { data, isLoading, error, refetch } = useGet(
    ["myProfilePost", userId, currentPage, pageSize],
    `${import.meta.env.VITE_API_URL}/posts`,
    {
      member_id: userId,
      sort: "createdAt,desc",
      ownerId: "all",
      postType: "CHANNEL",
      authorId: userId,
      page: currentPage,
      size: pageSize,
    },
    {
      enabled: !!userId,
    }
  );
  if (isUserError) {
    navigate("/404");
  }  const handleDirectMessage = async () => {
    if (!userInfo?.userId || !userData?.data?.id) {
      console.error("사용자 정보가 없습니다.");
      return;
    }

    try {
      console.log("1:1 채팅방 생성/검색 시작:", {
        currentUser: userInfo.userId,
        targetUser: userData.data.id,
        targetUserName: userData.data.nickname || userData.data.name
      });      // 1:1 채팅방 이름 생성
      const roomName = `${userInfo.nickname || "나"} & ${userData.data.nickname || userData.data.name}`;
        // 기존 1:1 채팅방 찾기 또는 새로 생성
      const targetUser = {
        id: userData.data.id,
        nickname: userData.data.nickname || userData.data.name,
        email: userData.data.email
      };
      
      console.log('targetUser 객체:', targetUser);
      console.log('현재 userInfo:', userInfo);
      
      const roomResult = await createOrFindDirectRoom(targetUser);
      
      if (roomResult && roomResult.room && roomResult.room.id) {
        const roomId = roomResult.room.id;
        const isNewRoom = roomResult.isNewRoom;
        
        console.log(`1:1 채팅방 ${isNewRoom ? '생성' : '찾기'} 성공:`, roomId);
        
        // 새로운 방인 경우에만 상대방 초대
        if (isNewRoom) {
          await inviteToRoom(roomId, userData.data.id, userData.data.nickname || userData.data.name);
          console.log("상대방 초대 완료");
        } else {
          console.log("기존 1:1 채팅방을 재사용합니다.");
        }        // 팝업 채팅창 열기
        const popupUrl = `/popup-chat/room/${roomId}`;        const popup = window.open(
          popupUrl,
          `chat-${roomId}`,
          'width=512,height=700,resizable=no,scrollbars=yes'
        );
        
        if (popup) {
          popup.focus();
          console.log("팝업 채팅창 열기 성공");
        } else {
          alert("팝업이 차단되었습니다. 브라우저의 팝업 차단을 해제해주세요.");
        }
        
      } else {
        console.error("1:1 채팅방 생성/검색 실패");
        alert("채팅방 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("1:1 채팅방 생성/검색 오류:", error);
      alert("채팅방 생성 중 오류가 발생했습니다.");
    }
  };

  const handleUpdatePosts = (data) => {
    if (data) {
      const newItems = data.content.map((item) => ({
        author: item.author,
        owner_id: item.owner_id,
        postType: item.postType,
        id: item.id,
        contents: item.contents,
        title: item.title,
        published_time:
          item.published_time || item.published_time || item.createdAt,
        like_count: item.like_count,
        comment_count: item.comment_count,
        channel: item.channel,
        organization: item.organization,
        is_like: item.is_like,
        is_bookmark: item.is_bookmark,
      }));

      setUserActivity(newItems);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    }
  };

  const handleLikeClick = async (postId) => {
    try {
      const res = await likePost(postId, userInfo.userId);
      if (res.result) {
        setUserActivity((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  is_like: !post.is_like,
                  like_count: post.is_like
                    ? post.like_count - 1
                    : post.like_count + 1,
                }
              : post
          )
        );
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
        setUserActivity((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  is_bookmark: !post.is_bookmark,
                }
              : post
          )
        );
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

  useEffect(() => {
    if (data?.data) {
      handleUpdatePosts(data.data);
    }
  }, [data]);

  useEffect(() => {
    if (!userId) {
      navigate("/404");
      return;
    }
  }, [userId]);

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSelectPost = (post) => {
    setSelectedPost(post);
    setIsNoticeModalOpen(true);
  };

  // 페이지네이션 렌더링 함수
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <Pagination className="mt-6 flex justify-center">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() =>
                currentPage > 0 && handlePageChange(currentPage - 1)
              }
              className={
                currentPage === 0
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>

          {[...Array(totalPages)].map((_, index) => {
            if (
              index === 0 ||
              index === totalPages - 1 ||
              (index >= currentPage - 1 && index <= currentPage + 1)
            ) {
              return (
                <PaginationItem key={index}>
                  <PaginationLink
                    isActive={index === currentPage}
                    onClick={() => handlePageChange(index)}
                    className="cursor-pointer"
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              );
            } else if (
              (index === currentPage - 2 && currentPage > 2) ||
              (index === currentPage + 2 && currentPage < totalPages - 3)
            ) {
              return <PaginationEllipsis key={index} />;
            }
            return null;
          })}

          <PaginationItem>
            <PaginationNext
              onClick={() =>
                currentPage < totalPages - 1 &&
                handlePageChange(currentPage + 1)
              }
              className={
                currentPage === totalPages - 1
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  if (isUserDataLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-10 w-10" />
        <p>프로필 제조하는중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* 프로필 헤더 */}
      <div className="px-4 py-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold break-words line-clamp-1">
              {userData?.data?.nickname || userData?.data?.name}
            </h1>
            <div className="flex items-center gap-1 text-sm text-muted-foreground"></div>
          </div>
          <Avatar className="w-20 h-20">
            <AvatarImage
              src={`${
                userData?.data?.image
                  ? userData?.data?.image
                  : "/placeholder-graphic.png?height=80&width=80"
              }`}
              alt={`${userData?.data?.nickname}`}
            />
            <AvatarFallback>{userData?.data?.nickname}</AvatarFallback>
          </Avatar>
        </div>

        <div className="mt-6 w-full max-w-2xl mx-auto">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold">자기소개</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base text-gray-700 whitespace-pre-line py-2">
                {userData?.data?.bio || "자기소개가 없습니다."}
              </CardDescription>
            </CardContent>
          </Card>
        </div>        <div className="mt-4">
          <Button
            onClick={() => handleDirectMessage()}
            variant="default"
            className="rounded-lg w-full flex items-center justify-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            메시지 보내기
          </Button>
        </div>
      </div>

      <Separator />

      {/* 게시글 피드 */}
      <div className="mt-4">
        <h2 className="px-4 py-2 font-medium">게시글</h2>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold dark:text-white flex justify-between items-center">
              <span>게시글</span>
              <Badge variant="outline" className="ml-2">
                총 {totalElements}개
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              // 로딩 스켈레톤 UI
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="border-b pb-4 last:border-0 last:pb-0"
                  >
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <div className="flex items-center gap-4 mt-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : userActivity.length > 0 ? (
              <div className="space-y-4">
                {userActivity.map((post) => (
                  <div
                    key={post?.id}
                    className="shadow-sm pb-4 last:border-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-navy-700 p-3 rounded-md transition-colors"
                    onClick={() => handleSelectPost(post)}
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-lg dark:text-white break-words cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                        {post.title.substring(0, 15).length > 15
                          ? post.title.substring(0, 15) + "..."
                          : post.title}
                      </h3>
                      <div className="flex items-center gap-1">
                        {/* {post.is_like && (
                            <Badge variant="outline" className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                              <Heart className="h-3 w-3 mr-1 fill-current" /> 좋아요
                            </Badge>
                          )}
                          {post.is_bookmark && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 ml-1">
                              북마크
                            </Badge>
                          )} */}
                      </div>
                    </div>
                    <p
                      className="text-sm text-gray-600 dark:text-gray-400 mt-2 break-words line-clamp-3"
                      dangerouslySetInnerHTML={{
                        __html:
                          DOMPurify.sanitize(post.contents).substring(0, 255) +
                          (post.contents.length > 255 ? "..." : ""),
                      }}
                    ></p>
                    <div className="flex items-center flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {post.like_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />{" "}
                        {post.comment_count}
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-navy-700 px-2 py-1 rounded-full">
                        {applyTimezoneWithPattern(post.published_time, 1)}
                      </span>
                      <span className="flex items-center text-xs bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 px-2 py-1 rounded-full">
                        {post.channel?.channelName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  게시글이 없습니다.
                </p>
              </div>
            )}

            {/* 페이지네이션 렌더링 */}
            {renderPagination()}
          </CardContent>
        </Card>
      </div>

      <ChannelDetailModal
        isOpen={isNoticeModalOpen}
        onClose={() => {
          setIsNoticeModalOpen(false);
          setSelectedPost(null);
        }}
        channelId={selectedPost?.owner_id}
        post={selectedPost}
        onLikeClick={handleLikeClick}
        onBookmarkClick={handleBookmarkClick}
      />
    </div>
  );
};

export default UserProfile;
