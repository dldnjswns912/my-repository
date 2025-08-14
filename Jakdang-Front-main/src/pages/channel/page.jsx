"use client";

import ChannelDetailModal from "@/components/modal/detail-modal/channel-detail-modal";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {isAuthenticatedAtom, userInfoAtom} from "@/jotai/authAtoms";
import { useAtomValue } from "jotai";
import { ChevronLeft, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom"; // Next의 useRouter, useParams 대신 react-router-dom 사용
import { useChannelApi } from "@/service/api/channelApi";
import { usePostApi } from "@/service/api/postApi";
import WriteModal from "@/components/modal/write-modal/write-modal";
import PostListComponent from "@/components/PostListComponent";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMediaQuery } from "@/hooks/use-media-query";

function ChannelPage() {
  const params = useParams(); // Next의 useParams 대신 react-router-dom의 useParams 사용
  const navigate = useNavigate(); // Next의 useRouter 대신 react-router-dom의 useNavigate 사용
  const location = useLocation();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme(); // Next의 next-themes 대신 자체 theme provider 사용
  const [activeTab, setActiveTab] = useState("recent");
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const userInfo = useAtomValue(userInfoAtom);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeProfileMenu, setActiveProfileMenu] = useState(null);
  const isAuth = useAtomValue(isAuthenticatedAtom);

  // 채널 ID 가져오기
  const channelId = params?.id;
  const selectedId = location.state?.selectedChannelId;
  const { likePost, bookmarkPost } = usePostApi();
  const { activeChannelsQuery } = useChannelApi();
  const {
    isLoading: channelIsLoading,
    data: channelData,
    error: channelError,
  } = activeChannelsQuery;

  useEffect(() => {
    setMounted(true);

    if (channelError) {
      console.error(channelError);
      toast({
        title: "오류",
        message: "채널 정보를 불러오는 중 오류가 발생했습니다.",
        type: "error",
      });
      return;
    }

    // state로 전달된 selectedChannelId 우선 적용
    const effectiveChannelId = selectedId || channelId;

    if (effectiveChannelId && !channelIsLoading && channelData) {
      const _channel = channelData?.data.find(
        (channel) => channel.id === effectiveChannelId
      );
      setCategoryInfo({
        id: _channel?.id,
        title: _channel?.channelName || "채널",
        icon: _channel.channelIconAddress,
        description: _channel?.description || "채널 설명",
      });
    } else {
      // 잘못된 채널 ID인 경우 홈으로 리다이렉트
      navigate("/");
    }
  }, [channelId, selectedId, navigate, channelError, channelIsLoading, channelData]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  console.log("channelData", channelData);

  const handleLikeClick = async (postId) => {
    try {
      const res = await likePost(postId, userInfo.userId);
      if (res.result) {
        // 게시물 목록 업데이트
        setPosts((prevPosts) =>
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
        // 게시물 목록 업데이트
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  is_bookmark: !post.is_bookmark,
                }
              : post
          )
        );
        // 선택된 게시물 업데이트
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

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsDetailModalOpen(true);
  };

  // 프로필 아바타 클릭 핸들러
  const handleAvatarClick = (e, postId) => {
    e.stopPropagation();
    // 이미 활성화된 메뉴가 있으면 닫고, 없으면 현재 포스트 ID로 설정
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

  useEffect(() => {
    console.log("selectedPost", selectedPost);
  }, [selectedPost]);

  if (!categoryInfo) {
    return (
      <div className="min-h-screen pb-16 md:pb-0 bg-slate-50 dark:bg-navy-900 transition-colors duration-200">
        <main className="container px-4 py-6 mx-auto max-w-[856px]">
          {/* 채널 헤더 스켈레톤 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-0 h-8 w-8 bg-gray-200 dark:bg-navy-700 rounded-md animate-pulse"></div>
              <div className="h-8 w-48 bg-gray-200 dark:bg-navy-700 rounded-md animate-pulse"></div>
            </div>
            <div className="h-4 w-64 ml-10 bg-gray-200 dark:bg-navy-700 rounded-md animate-pulse mt-2"></div>
          </div>

          {/* 필터 및 정렬 옵션 스켈레톤 */}
          <div className="flex justify-between items-center mb-6">
            <div className="w-full h-10 bg-gray-200 dark:bg-navy-700 rounded-md animate-pulse"></div>
          </div>

          {/* 게시물 목록 스켈레톤 */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="bg-white dark:bg-navy-800 rounded-lg p-4 shadow-sm animate-pulse"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-navy-700"></div>
                  <div className="w-24 h-4 bg-gray-200 dark:bg-navy-700 rounded"></div>
                </div>
                <div className="w-full h-4 bg-gray-200 dark:bg-navy-700 rounded mb-2"></div>
                <div className="w-3/4 h-4 bg-gray-200 dark:bg-navy-700 rounded mb-4"></div>
                <div className="w-full h-40 bg-gray-200 dark:bg-navy-700 rounded-md mb-3"></div>
                <div className="flex justify-between">
                  <div className="w-20 h-6 bg-gray-200 dark:bg-navy-700 rounded"></div>
                  <div className="w-20 h-6 bg-gray-200 dark:bg-navy-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 md:pb-0 bg-slate-50 dark:bg-navy-900 transition-colors duration-200">
      {/* 헤더 */}

      <main className="container px-4 py-6 mx-auto max-w-[856px]">
        {/* 채널 헤더 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="p-0 h-8 w-8"
            >
              {" "}
              {/* router.push 대신 navigate 사용 */}
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold  flex items-center">
              <div className="flex items-center justify-center w-8 h-8 mr-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage
                    src={categoryInfo.icon || "/placeholder.svg"}
                    alt={categoryInfo.title}
                  />
                  <AvatarFallback>
                    {categoryInfo.title.substring(0, 1)}
                  </AvatarFallback>
                </Avatar>
              </div>
              {categoryInfo.title}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 ml-10">
            {categoryInfo.description}
          </p>
        </div>

        {/* 필터 및 정렬 옵션 */}
        <div className="flex justify-between items-center mb-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="bg-gray-100 dark:bg-navy-700 w-full justify-start">
              <TabsTrigger
                value="recent"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-navy-600 dark:text-gray-300 dark:data-[state=active]:text-white"
              >
                최신순
              </TabsTrigger>
              <TabsTrigger
                value="popular"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-navy-600 dark:text-gray-300 dark:data-[state=active]:text-white"
              >
                인기순
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {/* <Button variant="outline" size="sm" className="ml-2 w-20">
            <Filter className="h-4 w-4 mr-1" />
            필터
          </Button> */}
        </div>

        {/* 게시물 목록 */}
        <div className="space-y-4">
          <PostListComponent
            key={`${activeTab}`}
            ownerId={channelId}
            postType={"CHANNEL"}
            handlePostClick={handlePostClick}
            posts={posts}
            setPosts={setPosts}
            onLikeClick={handleLikeClick}
            onBookmarkClick={handleBookmarkClick}
            sort={
              activeTab === "recent" ? "publishedTime,desc" : "like_count,desc"
            }
            activeProfileMenu={activeProfileMenu}
            handleAvatarClick={handleAvatarClick}
          />
          {/*
           */}

          <ChannelDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedPost(null);
            }}
            channelId={channelId}
            post={selectedPost}
            onLikeClick={handleLikeClick}
            onBookmarkClick={handleBookmarkClick}
          />

          <WriteModal
            id={() => channelId}
            fromComponent="channel"
            isOpen={writeModalOpen}
            onClose={() => setWriteModalOpen(false)}
            isEditing={false}
            post={null}
          />
        </div>
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
    </div>
  );
}

export default ChannelPage;
