"use client";

import ChannelDetailModal from "@/components/modal/detail-modal/channel-detail-modal";
import ProfileEditModal from "@/components/modal/profile-edit-modal";
import { useToast } from "@/components/toast-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import { userInfoAtom } from "@/jotai/authAtoms";
import { usePostApi } from "@/service/api/postApi";
import { applyTimezoneWithPattern } from "@/utils/formatDate";
import DOMPurify from "dompurify";
import { useAtom } from "jotai";
import { Bookmark, Camera, Edit, Heart, MessageSquare } from "lucide-react";
import { useTheme } from "next-themes";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MyPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userInfo, setUserInfo] = useAtom(userInfoAtom);
  const [mounted, setMounted] = useState(false);
  const [userActivity, setUserActivity] = useState([]);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // 활동 탭 페이지네이션 관련 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 북마크 탭 관련 상태
  const [userBookmarks, setUserBookmarks] = useState([]);
  const [currentBookmarkPage, setCurrentBookmarkPage] = useState(0);
  const [bookmarkPageSize, setBookmarkPageSize] = useState(5);
  const [bookmarkTotalPages, setBookmarkTotalPages] = useState(0);
  const [bookmarkTotalElements, setBookmarkTotalElements] = useState(0);

  const { likePost, bookmarkPost } = usePostApi();

  const { useGet } = useAxiosQuery();

  // 활동 탭 데이터 가져오기
  const { data, isLoading, error, refetch } = useGet(
    ["myProfilePost", userInfo?.userId, currentPage, pageSize],
    `${import.meta.env.VITE_API_URL}/posts`,
    {
      member_id: userInfo?.userId,
      sort: "createdAt,desc",
      ownerId: "all",
      postType: "CHANNEL",
      authorId: userInfo?.userId,
      page: currentPage,
      size: pageSize,
    },
    {
      enabled: !!userInfo?.userId && activeTab === "activity",
    }
  );

  // 북마크 탭 데이터 가져오기
  const {
    data: bookmarkData,
    isLoading: isBookmarkLoading,
    error: bookmarkError,
    refetch: refetchBookmarks,
  } = useGet(
    ["myBookmarks", userInfo?.userId, currentBookmarkPage, bookmarkPageSize],
    `${import.meta.env.VITE_API_URL}/posts/bookmarks`,
    {
      userId: userInfo?.userId,
      sort: "createdAt,desc",
      page: currentBookmarkPage,
      size: bookmarkPageSize,
      boardIds: "",
      postType: "CHANNEL",
    },
    {
      enabled: !!userInfo?.userId && activeTab === "bookmarks",
    }
  );

  const handleUpdatePosts = (data) => {
    if (data) {
      setUserActivity(data.content); // 원본 그대로 사용
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    }
  };

  const handleUpdateBookmarks = (data) => {
    if (data) {
      setUserBookmarks(data.content); // 원본 그대로 사용
      setBookmarkTotalPages(data.totalPages);
      setBookmarkTotalElements(data.totalElements);
    }
  };

  const handleLikeClick = async (postId) => {
    try {
      const res = await likePost(postId, userInfo.userId);
      if (res.result) {
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

        // 활동 탭 게시물 업데이트
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

        // 북마크 탭 게시물 업데이트
        setUserBookmarks((prevPosts) =>
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
        // 선택된 게시물 업데이트
        setSelectedPost((prev) =>
          prev?.id === postId
            ? { ...prev, is_bookmark: !prev.is_bookmark }
            : prev
        );

        // 활동 탭 게시물 업데이트
        setUserActivity((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? { ...post, is_bookmark: !post.is_bookmark }
              : post
          )
        );

        // 북마크 탭에서 게시물 제거 (북마크 취소 시)
        if (activeTab === "bookmarks") {
          setUserBookmarks((prevPosts) =>
            prevPosts.filter((post) => post.id !== postId)
          );
          // 북마크 목록 다시 불러오기
          refetchBookmarks();
        }

        toast({
          title: res.result ? "북마크 완료" : "북마크 취소",
          description: res.result
            ? "게시글을 북마크했습니다."
            : "게시글 북마크를 취소했습니다.",
          variant: "success",
        });
      }
      return res;
    } catch (error) {
      console.error(error);
      toast({
        title: "오류 발생",
        description: "북마크 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      throw error;
    }
  };

  React.useEffect(() => {
    if (data?.data && activeTab === "activity") {
      handleUpdatePosts(data.data);
    }
  }, [data, activeTab]);

  React.useEffect(() => {
    if (bookmarkData?.data && activeTab === "bookmarks") {
      handleUpdateBookmarks(bookmarkData.data);
    }
  }, [bookmarkData, activeTab]);

  // 컴포넌트가 마운트된 후에 theme 상태를 업데이트
  React.useEffect(() => {
    setMounted(true);
  }, [userInfo]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // 활동 탭 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 북마크 탭 페이지 변경 핸들러
  const handleBookmarkPageChange = (page) => {
    setCurrentBookmarkPage(page);
  };

  // 프로필 업데이트 핸들러
  const handleProfileUpdate = (updatedProfile) => {
    setUserInfo({ ...userInfo, ...updatedProfile });
    setIsEditModalOpen(false);

    toast({
      title: "프로필 업데이트",
      description: "프로필이 성공적으로 업데이트되었습니다.",
      variant: "success",
    });
  };

  const handleSelectPost = (post) => {
    setSelectedPost(post);
    setIsNoticeModalOpen(true);
  };

  // 활동 탭 페이지네이션 렌더링 함수
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <Pagination className="mt-6">
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

  // 북마크 탭 페이지네이션 렌더링 함수
  const renderBookmarkPagination = () => {
    if (bookmarkTotalPages <= 1) return null;

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() =>
                currentBookmarkPage > 0 &&
                handleBookmarkPageChange(currentBookmarkPage - 1)
              }
              className={
                currentBookmarkPage === 0
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>

          {[...Array(bookmarkTotalPages)].map((_, index) => {
            if (
              index === 0 ||
              index === bookmarkTotalPages - 1 ||
              (index >= currentBookmarkPage - 1 &&
                index <= currentBookmarkPage + 1)
            ) {
              return (
                <PaginationItem key={index}>
                  <PaginationLink
                    isActive={index === currentBookmarkPage}
                    onClick={() => handleBookmarkPageChange(index)}
                    className="cursor-pointer"
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              );
            } else if (
              (index === currentBookmarkPage - 2 && currentBookmarkPage > 2) ||
              (index === currentBookmarkPage + 2 &&
                currentBookmarkPage < bookmarkTotalPages - 3)
            ) {
              return <PaginationEllipsis key={index} />;
            }
            return null;
          })}

          <PaginationItem>
            <PaginationNext
              onClick={() =>
                currentBookmarkPage < bookmarkTotalPages - 1 &&
                handleBookmarkPageChange(currentBookmarkPage + 1)
              }
              className={
                currentBookmarkPage === bookmarkTotalPages - 1
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 pb-16 md:pb-0">
      <main className="container mx-auto px-4 py-6 max-w-[800px]">
        {/* 프로필 헤더 - 배경 사진 제거 및 레이아웃 조정 */}
        <div className="bg-white dark:bg-navy-800 rounded-lg p-6 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-gray-200 dark:border-navy-700">
                <AvatarImage
                  src={userInfo?.image || "/placeholder.svg"}
                  alt={userInfo?.nickname || userInfo?.name}
                />
                <AvatarFallback className="text-white text-[40px]"
                    style={{
                      backgroundColor: userInfo?.image
                          ? "none"
                          : userInfo.backgroundColor
                              ? userInfo.backgroundColor
                              : "#FFC107",
                    }}
                >
                  {(userInfo?.nickname || userInfo?.name)?.[0]}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-navy-600 dark:bg-navy-500 hover:bg-navy-700 cursor-pointer"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold dark:text-white">
                {userInfo?.nickname || userInfo?.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {userInfo?.email}
              </p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
                {/* <Badge variant="outline" className="bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300">
                  {userInfo?.organization}
                </Badge>
                <Badge variant="outline" className="bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300">
                  {userInfo?.position}
                </Badge> */}
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {userInfo?.bio}
              </p>
            </div>

            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-navy-600 hover:bg-navy-700 text-white mt-4 sm:mt-0 sm:self-start cursor-pointer"
            >
              <Edit className="h-4 w-4 mr-2" />
              프로필 편집
            </Button>
          </div>
        </div>

        {/* 탭 메뉴 - 북마크 탭 추가 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-12 bg-gray-100 dark:bg-navy-700 rounded-lg">
            <TabsTrigger value="profile" className="rounded-lg cursor-pointer">
              프로필
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg cursor-pointer">
              활동
            </TabsTrigger>
            <TabsTrigger
              value="bookmarks"
              className="rounded-lg cursor-pointer flex items-center justify-center gap-1"
            >
              <Bookmark className="h-4 w-4" />
              북마크
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6 space-y-6">
            <div className="bg-white dark:bg-navy-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4 dark:text-white">
                기본 정보
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">
                    이메일
                  </span>
                  <span className="font-medium dark:text-white">
                    {userInfo?.email}
                  </span>
                </div>
                {/*<div className="flex justify-between items-center">*/}
                {/*  <span className="text-gray-500 dark:text-gray-400">실명</span>*/}
                {/*  <span className="font-medium dark:text-white">*/}
                {/*    {userInfo?.name}*/}
                {/*  </span>*/}
                {/*</div>*/}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">
                    닉네임
                  </span>
                  <span className="font-medium dark:text-white">
                    {userInfo?.nickname}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">
                    전화번호
                  </span>
                  <span className="font-medium dark:text-white">
                    {userInfo?.phone}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">소개</span>
                  <span className="font-medium dark:text-white break-words line-clamp-2">
                    {userInfo?.bio}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">
                    가입일
                  </span>
                  <span className="font-medium dark:text-white">
                    {userInfo?.createdAt?.substring(0, 10)}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-6 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold dark:text-white flex justify-between items-center">
                  <span>내 게시글</span>
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
                  <div className="space-y-4 h-auto">
                    {userActivity.map((post) => (
                      <div
                        key={post?.id}
                        className="shadow-sm pb-4 last:border-0 hover:bg-gray-50 dark:hover:bg-navy-700 p-3 rounded-md transition-colors"
                        onClick={() => handleSelectPost(post)}
                      >
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-lg dark:text-white break-words cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition-colors w-full overflow-hidden text-ellipsis whitespace-nowrap">
                            {/*{(post.title).substring(0,15).length > 15 ? (post.title).substring(0,15) + "..." : post.title}*/}
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-1">
                            {post.is_bookmark && (
                              <Badge
                                variant="outline"
                                className="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 ml-1"
                              >
                                <Bookmark className="h-3 w-3 mr-1 fill-current" />
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p
                          className="text-sm text-gray-600 dark:text-gray-400 mt-2 break-words"
                          dangerouslySetInnerHTML={{
                            __html:
                              DOMPurify.sanitize(post.contents).substring(
                                0,
                                100
                              ) + (post.contents.length > 100 ? "..." : ""),
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
                          <span className="flex items-center text-xs bg-navy-600 text-black px-2 py-1 rounded-full">
                            {post.channel?.channelName}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`text-xs p-1 rounded-full transition-all duration-200 ${
                              post.is_bookmark
                                ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "hover:bg-yellow-50 hover:text-yellow-600"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookmarkClick(post.id);
                            }}
                          >
                            {post.is_bookmark ? (
                              <div className="flex items-center">
                                <Bookmark className="h-3.5 w-3.5 mr-1 fill-current animate-pulse" />
                                <span>저장됨</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <Bookmark className="h-3.5 w-3.5 mr-1" />
                                <span>북마크</span>
                              </div>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      작성한 게시글이 없습니다.
                    </p>
                    {/* <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => navigate('/')}
                    >
                      게시글 작성하러 가기
                    </Button> */}
                  </div>
                )}

                {/* 페이지네이션 렌더링 */}
                {renderPagination()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 북마크 탭 */}
          <TabsContent value="bookmarks" className="mt-6 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold dark:text-white flex justify-between items-center">
                  <div className="flex items-center">
                    <Bookmark className="h-5 w-5 mr-2 text-yellow-500 dark:text-yellow-400" />
                    <span>북마크한 게시글</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="ml-2"
                  >
                    총 {bookmarkTotalElements}개
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isBookmarkLoading ? (
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
                ) : userBookmarks.length > 0 ? (
                  <div className="space-y-4 h-auto">
                    {userBookmarks.map((post) => (
                      <div
                        key={post?.id}
                        className="shadow-sm pb-4 last:border-0 hover:bg-gray-50 dark:hover:bg-navy-700 p-3 rounded-md transition-colors"
                        onClick={() => handleSelectPost(post)}
                      >
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-lg dark:text-white break-words cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition-colors w-full overflow-hidden text-ellipsis whitespace-nowrap">
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="outline"
                              className="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 ml-1 flex items-center gap-1 px-2 py-1 border-yellow-200 dark:border-yellow-800/30"
                            >
                              <Bookmark className="h-3.5 w-3.5 fill-current" />
                              <span className="text-xs">저장됨</span>
                            </Badge>
                          </div>
                        </div>
                        <p
                          className="text-sm text-gray-600 dark:text-gray-400 mt-2 break-words"
                          dangerouslySetInnerHTML={{
                            __html:
                              DOMPurify.sanitize(post.contents).substring(
                                0,
                                100
                              ) + (post.contents.length > 100 ? "..." : ""),
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
                          <span className="flex items-center text-xs bg-navy-600 text-black px-2 py-1 rounded-full">
                            {post.channel?.channelName}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 p-1 rounded-full transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookmarkClick(post.id);
                            }}
                          >
                            <div className="flex items-center">
                              <Bookmark className="h-3.5 w-3.5 mr-1 fill-current" />
                            </div>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      북마크한 게시글이 없습니다.
                    </p>
                  </div>
                )}

                {/* 페이지네이션 렌더링 */}
                {renderBookmarkPagination()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/*/!* 모바일 하단 네비게이션 바 *!/*/}
      {/*<div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 bg-white dark:bg-navy-800 border-t dark:border-navy-700 md:hidden">*/}
      {/*  <Link*/}
      {/*    to="/"*/}
      {/*    className="flex flex-col items-center justify-center w-1/4 h-full text-gray-600 dark:text-gray-300"*/}
      {/*  >*/}
      {/*    <Home className="w-6 h-6" />*/}
      {/*    <span className="mt-1 text-xs">홈</span>*/}
      {/*  </Link>*/}
      {/*  <Link*/}
      {/*    to="/organizations"*/}
      {/*    className="flex flex-col items-center justify-center w-1/4 h-full text-gray-600 dark:text-gray-300"*/}
      {/*  >*/}
      {/*    <Building2 className="w-6 h-6" />*/}
      {/*    <span className="mt-1 text-xs">기관</span>*/}
      {/*  </Link>*/}
      {/*  <Link*/}
      {/*    to="/chat"*/}
      {/*    className="flex flex-col items-center justify-center w-1/4 h-full text-gray-600 dark:text-gray-300"*/}
      {/*  >*/}
      {/*    <MessageSquare className="w-6 h-6" />*/}
      {/*    <span className="mt-1 text-xs">채팅</span>*/}
      {/*  </Link>*/}
      {/*  <Link*/}
      {/*    to="/my"*/}
      {/*    className="flex flex-col items-center justify-center w-1/4 h-full text-navy-600 dark:text-white"*/}
      {/*  >*/}
      {/*    <User className="w-6 h-6" />*/}
      {/*    <span className="mt-1 text-xs">MY</span>*/}
      {/*  </Link>*/}
      {/*</div>*/}

      {/* 프로필 편집 모달 */}
      {
        isEditModalOpen &&
          <ProfileEditModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              userData={userInfo}
              onSave={handleProfileUpdate}
          />
      }


      {/* 게시글 상세 모달 */}
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
}
