"use client";

import ImageWithFallback from "@/components/image-with-fallback";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  BookOpen,
  ClipboardList,
  FileText,
  HelpCircle,
  PenSquare,
  Heart,
  Calendar,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useOrganization } from "@/hooks/useOrganizations";
import { usePostApi } from "@/service/api/postApi";
import { useAtomValue } from "jotai";
import { userInfoAtom } from "@/jotai/authAtoms";
import WriteModal from "@/components/modal/write-modal/write-modal";
import ChannelDetailModal from "@/components/modal/detail-modal/channel-detail-modal.jsx";
import AssignmentDetailModal from "@/components/modal/assignment-detail-modal.jsx";
import { useAssignmentApi } from "@/service/api/assignmentApi";
import PostListComponent from "@/components/PostListComponent";

// 한국ICT인재개발원 게시글
const ictPosts = [
  {
    id: 1,
    author: "교육팀",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    timeAgo: "10분 전",
    title: "2024년 Java & Python 개발자 양성과정 모집",
    content:
      "클라우드 기반의 프론트엔드와 백엔드 풀스택 개발자 양성과정 교육생을 모집합니다. 이번 과정에서는 Java와 Python을 중심으로 현업에서 필요한 실무 기술을 배우게 됩니다.",
    likes: 42,
    comments: 15,
    views: 358,
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/study2-LOUXgysgOzphf7NuVsj4ZPiy2rTL63.png",
    tags: ["교육과정", "개발자", "풀스택", "Java", "Python"],
    category: "notice",
  },
  {
    id: 2,
    author: "관리자",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    timeAgo: "22시간",
    title: "신입 교육생 모집",
    content:
      "클라우드 네이티브 애플리케이션 개발자 양성과정 교육생을 모집합니다. 면접 일정 및 과정에 대해 문의 주세요.",
    likes: 36,
    comments: 8,
    views: 1413,
    category: "notice",
  },
  {
    id: 3,
    author: "교육팀",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    timeAgo: "2일 전",
    title: "수강생 프로젝트 발표회 안내",
    content:
      "이번 주 금요일 오후 2시부터 프로젝트 발표회가 진행됩니다. 많은 참여 부탁드립니다.",
    likes: 15,
    comments: 3,
    views: 245,
    category: "event",
  },
];

// 1강의장 게시글
const classroomPosts = {
  notice: [
    {
      id: 1,
      author: "김강사",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      timeAgo: "1일 전",
      title: "내일 수업 시간 변경 안내",
      content:
        "내일 수업은 오전 10시부터 오후 6시까지 진행됩니다. 늦지 않게 참석해주세요.",
      likes: 24,
      comments: 5,
      views: 128,
    },
    {
      id: 2,
      author: "김강사",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      timeAgo: "3일 전",
      title: "중간 프로젝트 발표 일정",
      content:
        "다음 주 수요일에 중간 프로젝트 발표가 있습니다. 준비 잘 해주세요.",
      likes: 18,
      comments: 7,
      views: 145,
    },
  ],
  question: [
    {
      id: 3,
      author: "학생1",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      timeAgo: "5시간 전",
      title: "React 컴포넌트 렌더링 문제",
      content:
        "React 컴포넌트가 두 번 렌더링되는 문제가 있습니다. 어떻게 해결할 수 있을까요?",
      likes: 3,
      comments: 12,
      views: 89,
    },
    {
      id: 4,
      author: "학생2",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      timeAgo: "1일 전",
      title: "API 호출 시 CORS 에러",
      content:
        "백엔드 API 호출 시 CORS 에러가 발생합니다. 해결 방법 알려주세요.",
      likes: 7,
      comments: 8,
      views: 112,
    },
  ],
  material: [
    {
      id: 5,
      author: "김강사",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      timeAgo: "2일 전",
      title: "React 상태 관리 강의자료",
      content:
        "오늘 수업에서 다룬 React 상태 관리 관련 강의자료입니다. 복습하시기 바랍니다.",
      likes: 32,
      comments: 4,
      views: 201,
    },
    {
      id: 6,
      author: "김강사",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      timeAgo: "1주일 전",
      title: "JavaScript ES6+ 문법 정리",
      content: "JavaScript ES6+ 주요 문법 정리 자료입니다. 참고하세요.",
      likes: 45,
      comments: 6,
      views: 278,
    },
  ],
  assignment: [
    {
      id: 7,
      author: "김강사",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      timeAgo: "3일 전",
      title: "React 컴포넌트 구현 과제",
      content:
        "다음 주 월요일까지 React 컴포넌트를 구현하는 과제입니다. 자세한 내용은 첨부파일을 확인하세요.",
      likes: 12,
      comments: 15,
      views: 156,
    },
    {
      id: 8,
      author: "김강사",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      timeAgo: "1주일 전",
      title: "JavaScript 알고리즘 과제",
      content:
        "이번 주 금요일까지 제출해야 하는 JavaScript 알고리즘 과제입니다.",
      likes: 8,
      comments: 10,
      views: 132,
    },
  ],
};

export default function OrganizationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: organization, isLoading } = useOrganization(id);
  const [activeTab, setActiveTab] = useState("org");
  const [activeFilter, setActiveFilter] = useState("notice");
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [isQuestionWriteModalOpen, setIsQuestionWriteModalOpen] =
    useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [posts, setPosts] = useState([]);
  const userInfo = useAtomValue(userInfoAtom);
  const { likePost, bookmarkPost } = usePostApi();

  // 모달 상태
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && organization) {
      // organization.isMember가 명시적으로 false인 경우에만 리다이렉트하도록 수정
      if (organization.isMember === false) {
        navigate(`/organization/details/${id}`);
      }
    }
  }, [organization, isLoading, id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        로딩 중...
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        기관을 찾을 수 없습니다.
      </div>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleWriteClick = () => {
    setIsQuestionWriteModalOpen(true);
    // if (isMobile) {
    //   navigate("/write/question")
    // } else {
    //   setIsQuestionWriteModalOpen(true)
    // }
  };

  const handlePostClick = (post) => {
    if (activeFilter === "assignment") {
      // AssignmentDetailModal에 맞는 데이터 구조로 변환
      const formattedPost = {
        ...post,
        author: post.author?.nickname || "작성자",
        authorAvatar: post.author?.avatar || "/placeholder.svg",
        timeAgo: post.published_time,
        content: post.contents,
        views: post.view_count || 0,
        likes: post.like_count || 0,
        is_like: post.is_like || false,
      };
      setSelectedPost(formattedPost);
      setIsAssignmentModalOpen(true);
    } else {
      setSelectedPost(post);
      setIsNoticeModalOpen(true);
    }

    // if (isMobile) {
    //   switch (activeFilter) {
    //     case "assignment":
    //       navigate(`/organization/assignment/${post.id}`)
    //       break
    //     default:
    //       navigate(`/organization/post/${post.id}`)
    //       break
    //   }
    // }
  };

  const getStringActiveFilter = (activeFilter) => {
    if (activeTab === "org") {
      console.log(activeCategory);
      switch (activeCategory) {
        case "all":
          return "ORGANIZATION";
        case "notice":
          return "NOTICE";
        default:
          return activeFilter.toUpperCase();
      }
    }

    switch (activeFilter) {
      case "question":
        return "QUESTION";
      case "assignment":
        return "ASSIGNMENT";
      default:
        return activeFilter.toUpperCase();
    }
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
  };

  const handleLikeClick = async (postId) => {
    try {
      const res = await likePost(postId, userInfo.userId);
      if (res.result) {
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 pb-16 md:pb-0 flex flex-col">
      <main className="container mx-auto px-4 py-4 max-w-[800px] flex-grow">
        {/* 상단 네비게이션: 기관/강의실 Card형 버튼 (작게) */}
        <div className="flex gap-2 mb-4">
          <button
            className={`flex-1 rounded-lg h-10 px-4 py-1.5 border transition-all duration-150 text-base font-semibold ${
              activeTab === "org"
                ? "bg-white dark:bg-navy-800 border-navy-600 text-navy-700 dark:text-white shadow"
                : "bg-slate-100 dark:bg-navy-700 border-transparent text-gray-500 dark:text-gray-300"
            }`}
            onClick={() => {
              setActiveTab("org");
              setActiveFilter("notice");
              setActiveCategory("all");
              setPosts([]);
            }}
          >
            {organization.name}
          </button>
          <button
            className={`flex-1 rounded-lg h-10 px-4 py-1.5 border transition-all duration-150 text-base font-semibold ${
              activeTab === "classroom"
                ? "bg-white dark:bg-navy-800 border-navy-600 text-navy-700 dark:text-white shadow"
                : "bg-slate-100 dark:bg-navy-700 border-transparent text-gray-500 dark:text-gray-300"
            }`}
            onClick={() => {
              setActiveTab("classroom");
              setActiveFilter("notice");
              setPosts([]);
            }}
          >
            {organization.classInfo ? organization.classInfo.name : "강의실"}
          </button>
        </div>

        {/* 2차 네비게이션: 메뉴 Badge/버튼 (작게) */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {activeTab === "org" ? (
              <Badge
                variant={activeCategory === "all" ? "secondary" : "outline"}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  activeCategory === "all"
                    ? "bg-black text-white dark:bg-navy-600"
                    : "dark:text-gray-300 dark:border-navy-600"
                } cursor-pointer`}
                onClick={() => handleCategoryClick("all")}
              >
                {organization.name} 공지
              </Badge>
            ) : (
              <>
                <Badge
                  variant={activeFilter === "notice" ? "secondary" : "outline"}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    activeFilter === "notice"
                      ? "bg-black text-white dark:bg-navy-600"
                      : "dark:text-gray-300 dark:border-navy-600"
                  } cursor-pointer`}
                  onClick={() => setActiveFilter("notice")}
                >
                  <FileText className="w-4 h-4 mr-1" /> 공지
                </Badge>
                <Badge
                  variant={
                    activeFilter === "question" ? "secondary" : "outline"
                  }
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    activeFilter === "question"
                      ? "bg-black text-white dark:bg-navy-600"
                      : "dark:text-gray-300 dark:border-navy-600"
                  } cursor-pointer`}
                  onClick={() => setActiveFilter("question")}
                >
                  <HelpCircle className="w-4 h-4 mr-1" /> 질문
                </Badge>
                <Badge
                  variant={
                    activeFilter === "material" ? "secondary" : "outline"
                  }
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    activeFilter === "material"
                      ? "bg-black text-white dark:bg-navy-600"
                      : "dark:text-gray-300 dark:border-navy-600"
                  } cursor-pointer`}
                  onClick={() => setActiveFilter("material")}
                >
                  <BookOpen className="w-4 h-4 mr-1" /> 수업자료
                </Badge>
                <Badge
                  variant={
                    activeFilter === "assignment" ? "secondary" : "outline"
                  }
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    activeFilter === "assignment"
                      ? "bg-black text-white dark:bg-navy-600"
                      : "dark:text-gray-300 dark:border-navy-600"
                  } cursor-pointer`}
                  onClick={() => setActiveFilter("assignment")}
                >
                  <ClipboardList className="w-4 h-4 mr-1" /> 과제
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* 강의실 미소속 안내 메시지 */}
        {activeTab === "classroom" && !organization?.classInfo && (
          <div className="bg-white dark:bg-navy-800 rounded-lg p-8 text-center mb-6 shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-navy-700 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold dark:text-white">
                소속된 강의실이 없습니다
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                현재 소속된 강의실이 없습니다. 기관 관리자에게 문의하여 강의실
                배정을 요청해주세요.
              </p>
            </div>
          </div>
        )}

        {/* 게시물 목록 */}
        {!(activeTab === "classroom" && !organization?.classInfo) &&
          (activeFilter === "assignment" ? (
            <AssignmentListComponent
              key={`${activeTab}-${activeFilter}`}
              ownerId={
                activeTab === "classroom" && organization?.classInfo
                  ? organization.classInfo.id
                  : organization?.id
              }
              handlePostClick={handlePostClick}
              posts={posts}
              setPosts={setPosts}
            />
          ) : (
            <PostListComponent
              key={`${activeTab}-${activeFilter}`}
              ownerId={
                activeTab === "classroom" && organization?.classInfo
                  ? organization.classInfo.id
                  : organization?.id
              }
              postType={getStringActiveFilter(activeFilter)}
              handlePostClick={handlePostClick}
              posts={posts}
              setPosts={setPosts}
              onLikeClick={handleLikeClick}
              onBookmarkClick={handleBookmarkClick}
            />
          ))}

        {/* Floating Action Button for Writing */}
        {activeTab === "org" ||
        (activeTab === "classroom" && activeFilter === "question") ? (
          <div
            className={`fixed bottom-20 md:bottom-8 z-40 ${
              isMobile ? "right-4 hidden" : "right-14"
            }`}
            onClick={handleWriteClick}
          >
            {organization?.classInfo && activeFilter !== "notice" && (
              <Button
                size="lg"
                className="h-14 px-6 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg cursor-pointer"
              >
                <PenSquare className="w-5 h-5 mr-2" />
                {activeTab === "org" ? "글쓰기" : "질문하기"}
              </Button>
            )}
          </div>
        ) : null}
      </main>

      {/* 각 카테고리별 디테일 모달 */}
      {selectedPost && (
        <>
          {activeFilter === "assignment" ? (
            <AssignmentDetailModal
              isOpen={isAssignmentModalOpen}
              onClose={() => {
                setIsAssignmentModalOpen(false);
                setSelectedPost(null);
              }}
              assignment={selectedPost}
            />
          ) : (
            <ChannelDetailModal
              isOpen={isNoticeModalOpen}
              onClose={() => {
                setIsNoticeModalOpen(false);
                setSelectedPost(null);
              }}
              channelId={
                activeTab === "classroom" && organization?.classInfo
                  ? organization.classInfo.id
                  : organization?.id
              }
              post={selectedPost}
              onLikeClick={handleLikeClick}
              onBookmarkClick={handleBookmarkClick}
            />
          )}
        </>
      )}

      {/* 질문 작성 모달 */}
      <WriteModal
        id={() =>
          activeTab === "classroom" && organization?.classInfo
            ? organization.classInfo.id
            : organization?.id
        }
        fromComponent={
          activeTab === "org" ? "organization" : "organization_question"
        }
        isOpen={isQuestionWriteModalOpen}
        onClose={() => setIsQuestionWriteModalOpen(false)}
        post={selectedPost}
      />
      {/* <QuestionWriteModal isOpen={isQuestionWriteModalOpen} onClose={() => setIsQuestionWriteModalOpen(false)} /> */}
    </div>
  );
}

const AssignmentListComponent = ({
  ownerId,
  handlePostClick,
  posts,
  setPosts,
}) => {
  const { useAssignmentInfiniteScroll } = useAssignmentApi();
  const loaderElementRef = useRef(null);

  const {
    items: assignmentItems,
    isLoading: isAssignmentLoading,
    fetchNextPage: fetchNextAssignmentPage,
    hasNextPage: hasNextAssignmentPage,
    loaderRef: assignmentLoaderRef,
  } = useAssignmentInfiniteScroll({
    classId: ownerId,
    search: "",
  });

  useEffect(() => {
    if (loaderElementRef.current) {
      assignmentLoaderRef(loaderElementRef.current);
    }
  }, [assignmentLoaderRef, assignmentItems]);

  // items가 변경될 때마다 부모의 posts 상태 업데이트
  useEffect(() => {
    if (assignmentItems) {
      const formattedPosts = assignmentItems.map((post) => ({
        ...post,
        authorAvatar: post.author?.avatar || "/placeholder.svg",
        created_at: post.published_time,
        image: post.files?.[0]?.url || null,
        tags: post.tags || [],
      }));
      setPosts(formattedPosts);
    }
  }, [assignmentItems, setPosts]);

  const getStatusColor = (status) => {
    switch (status) {
      case "IN_PROGRESS":
        return "text-blue-500";
      case "COMPLETED":
        return "text-green-500";
      case "EXPIRED":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "IN_PROGRESS":
        return "진행중";
      case "COMPLETED":
        return "완료";
      case "EXPIRED":
        return "마감";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      {posts && posts.length > 0 ? (
        posts.map((post) => (
          <div
            key={post.id}
            className="bg-white dark:bg-navy-800 rounded-lg p-4 space-y-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handlePostClick(post)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={post.authorAvatar} />
                  <AvatarFallback>
                    {post.author?.nickname?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <span className="font-medium dark:text-white">
                    {post.author?.nickname}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {post.created_at}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className={getStatusColor(post.status)}>
                {getStatusText(post.status)}
              </Badge>
            </div>
            <h3 className="font-bold dark:text-white">{post.title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{post.contents}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  마감일: {new Date(post.dueDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>
                  제출: {post.submittedCount}/{post.totalStudents}
                </span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          {isAssignmentLoading ? "로딩 중..." : "과제가 없습니다."}
        </div>
      )}
      <div
        ref={loaderElementRef}
        className="flex justify-center items-center py-4"
      >
        {isAssignmentLoading ? (
          <span className="text-gray-500 dark:text-gray-400">Loading...</span>
        ) : hasNextAssignmentPage ? (
          <Button variant="outline" onClick={fetchNextAssignmentPage}>
            더 보기
          </Button>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">
            더 이상 과제가 없습니다.
          </span>
        )}
      </div>
    </div>
  );
};
