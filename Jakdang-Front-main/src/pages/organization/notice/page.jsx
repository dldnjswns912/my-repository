"use client"

import ImageWithFallback from "@/components/image-with-fallback"
import ImageViewerModal from "@/components/modal/image-viewer-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Bookmark, Calendar, Eye, Heart, MessageCircle, Send, Share2 } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

// 공지사항 데이터 (실제 구현에서는 API에서 가져옴)
const noticeData = {
  id: 1,
  author: "김강사",
  authorAvatar: "/placeholder.svg?height=40&width=40",
  timeAgo: "1일 전",
  title: "내일 수업 시간 변경 안내",
  content: "내일 수업은 오전 10시부터 오후 6시까지 진행됩니다. 늦지 않게 참석해주세요.",
  likes: 24,
  comments: 5,
  views: 128,
  image: "/placeholder.svg?height=300&width=600",
  tags: ["수업", "시간변경", "필수참석"],
}

// 댓글 데이터
const initialComments = [
  {
    id: 1,
    author: "학생A",
    authorAvatar: "/placeholder.svg?height=32&width=32",
    content: "네, 알겠습니다. 감사합니다!",
    timeAgo: "20시간 전",
    likes: 2,
  },
  {
    id: 2,
    author: "학생B",
    authorAvatar: "/placeholder.svg?height=32&width=32",
    content: "혹시 수업 자료는 미리 공유해주실 수 있나요?",
    timeAgo: "18시간 전",
    likes: 0,
  },
  {
    id: 3,
    author: "김강사",
    authorAvatar: "/placeholder.svg?height=32&width=32",
    content: "네, 오늘 저녁에 수업 자료 올려드리겠습니다.",
    timeAgo: "17시간 전",
    likes: 5,
    isInstructor: true,
  },
]

export default function NoticeDetailPage({ params }) {
  const navigate = useNavigate() // Next.js의 useRouter 대신 React Router의 useNavigate 사용
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(noticeData.likes)
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState(initialComments)
  const [showComments, setShowComments] = useState(true)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked)
  }

  const toggleLike = () => {
    if (isLiked) {
      setLikeCount(likeCount - 1)
    } else {
      setLikeCount(likeCount + 1)
    }
    setIsLiked(!isLiked)
  }

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return

    const newComment = {
      id: comments.length + 1,
      author: "나",
      authorAvatar: "/placeholder.svg?height=32&width=32",
      content: commentText,
      timeAgo: "방금 전",
      likes: 0,
    }

    setComments([...comments, newComment])
    setCommentText("")
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">공지사항</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-[800px]">
        {/* 공지사항 정보 */}
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">{noticeData.title}</h1>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={noticeData.authorAvatar} />
                <AvatarFallback>{noticeData.author[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{noticeData.author}</div>
                <div className="text-sm text-gray-500">{noticeData.timeAgo}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>2023년 12월 10일</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500 border-b pb-4">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{noticeData.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{likeCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span>{comments.length}</span>
            </div>
          </div>

          <div className="prose max-w-none">
            <p>{noticeData.content}</p>
            {noticeData.image && (
              <div
                className="relative w-full h-[300px] rounded-lg overflow-hidden my-4 cursor-pointer"
                onClick={() => setIsImageViewerOpen(true)}
              >
                <ImageWithFallback
                  src={noticeData.image || "/placeholder.svg"}
                  alt={noticeData.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  fallbackSrc="/placeholder.svg?height=300&width=600"
                />
                <div className="absolute inset-0 bg-black/5 hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="sr-only">이미지 크게 보기</span>
                </div>
              </div>
            )}
            {noticeData.tags && (
              <div className="flex flex-wrap gap-2 mt-4">
                {noticeData.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="rounded-full">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 첨부 파일 */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-blue-500 font-medium">공지사항_첨부파일.pdf</span>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-1 ${isLiked ? "text-red-500" : "text-gray-600"}`}
                onClick={toggleLike}
              >
                <Heart className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
                <span>좋아요</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-gray-600"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageCircle className="w-5 h-5" />
                <span>댓글 {showComments ? "접기" : "보기"}</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-600">
                <Share2 className="w-5 h-5" />
                <span>공유</span>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1 ${isBookmarked ? "text-yellow-500" : "text-gray-600"}`}
              onClick={toggleBookmark}
            >
              <Bookmark className="w-5 h-5" fill={isBookmarked ? "currentColor" : "none"} />
              <span>북마크</span>
            </Button>
          </div>

          {/* 댓글 섹션 */}
          {showComments && (
            <div className="space-y-4 mt-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                댓글 {comments.length}개
              </h3>

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.authorAvatar} />
                      <AvatarFallback>{comment.author[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{comment.author}</span>
                          {comment.isInstructor && (
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">강사</span>
                          )}
                          <span className="text-xs text-gray-500">{comment.timeAgo}</span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 ml-2">
                        <button className="text-xs text-gray-500 hover:text-gray-700">좋아요 {comment.likes}</button>
                        <button className="text-xs text-gray-500 hover:text-gray-700">답글</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 댓글 입력 */}
              <div className="flex gap-3 mt-4">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>나</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Textarea
                    placeholder="댓글을 입력하세요..."
                    className="min-h-[80px] flex-1 resize-none"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <Button
                    className="self-end bg-navy-600 hover:bg-navy-700"
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 이미지 뷰어 모달 */}
      <ImageViewerModal
        isOpen={isImageViewerOpen}
        onClose={() => setIsImageViewerOpen(false)}
        imageSrc={noticeData.image}
        alt={noticeData.title}
      />
    </div>
  )
}

