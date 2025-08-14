"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    ArrowLeft,
    Bookmark,
    Calendar,
    Download,
    Eye,
    FileText,
    Heart,
    MessageCircle,
    Send,
    Share2,
} from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

// 수업자료 데이터 (실제 구현에서는 API에서 가져옴)
const materialData = {
  id: 5,
  author: "김강사",
  authorAvatar: "/placeholder.svg?height=40&width=40",
  timeAgo: "2일 전",
  title: "React 상태 관리 강의자료",
  content: "오늘 수업에서 다룬 React 상태 관리 관련 강의자료입니다. 복습하시기 바랍니다.",
  likes: 32,
  comments: 4,
  views: 201,
}

// 댓글 데이터
const initialComments = [
  {
    id: 1,
    author: "학생C",
    authorAvatar: "/placeholder.svg?height=32&width=32",
    content: "강의자료 감사합니다. 복습하겠습니다!",
    timeAgo: "1일 전",
    likes: 3,
  },
  {
    id: 2,
    author: "학생D",
    authorAvatar: "/placeholder.svg?height=32&width=32",
    content: "Context API 부분이 조금 어려운데 추가 설명 부탁드립니다.",
    timeAgo: "1일 전",
    likes: 2,
  },
  {
    id: 3,
    author: "김강사",
    authorAvatar: "/placeholder.svg?height=32&width=32",
    content: "네, 다음 수업에서 Context API에 대해 더 자세히 다루겠습니다.",
    timeAgo: "1일 전",
    likes: 4,
    isInstructor: true,
  },
  {
    id: 4,
    author: "학생E",
    authorAvatar: "/placeholder.svg?height=32&width=32",
    content: "예제 코드가 정말 도움이 됩니다. 감사합니다!",
    timeAgo: "12시간 전",
    likes: 1,
  },
]

export default function MaterialDetailPage({ params }) {
  const navigate = useNavigate() // Next.js의 useRouter 대신 React Router의 useNavigate 사용
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(materialData.likes)
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState(initialComments)
  const [showComments, setShowComments] = useState(true)

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

  const handleDownload = (fileName) => {
    // 실제 구현에서는 파일 다운로드 로직 추가
    console.log(`Downloading ${fileName}...`)
    alert(`${fileName} 다운로드를 시작합니다.`)
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
            <h1 className="text-lg font-bold">수업자료</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-[800px]">
        {/* 수업자료 정보 */}
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">{materialData.title}</h1>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={materialData.authorAvatar} />
                <AvatarFallback>{materialData.author[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{materialData.author}</div>
                <div className="text-sm text-gray-500">{materialData.timeAgo}</div>
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
              <span>{materialData.views}</span>
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
            <p>{materialData.content}</p>
            <p>
              안녕하세요, 오늘 수업에서 다룬 React 상태 관리 관련 강의자료입니다. 아래 첨부된 파일을 다운로드하여
              복습하시기 바랍니다.
            </p>
            <p>주요 내용:</p>
            <ul>
              <li>React 상태 관리의 기본 개념</li>
              <li>useState와 useReducer 비교</li>
              <li>Context API 활용 방법</li>
              <li>Redux, Recoil 등 외부 상태 관리 라이브러리 소개</li>
            </ul>
            <p>질문이 있으시면 댓글로 남겨주세요.</p>
          </div>

          {/* 첨부 파일 */}
          <div className="space-y-3">
            <h3 className="font-bold">첨부 파일</h3>

            <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="text-blue-500 font-medium">React_상태관리_강의자료.pdf</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-blue-600"
                onClick={() => handleDownload("React_상태관리_강의자료.pdf")}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="text-blue-500 font-medium">상태관리_예제코드.zip</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-blue-600"
                onClick={() => handleDownload("상태관리_예제코드.zip")}
              >
                <Download className="w-4 h-4" />
              </Button>
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
    </div>
  )
}

