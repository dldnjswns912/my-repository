"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, Calendar, Eye, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import CodeBlock from "@/components/code-block"

// 질문 데이터 (실제 구현에서는 API에서 가져옴)
const questionData = {
  id: 3,
  author: "학생1",
  authorAvatar: "/placeholder.svg?height=40&width=40",
  timeAgo: "5시간 전",
  title: "React 컴포넌트 렌더링 문제",
  content: "React 컴포넌트가 두 번 렌더링되는 문제가 있습니다. 어떻게 해결할 수 있을까요?",
  likes: 3,
  comments: 2,
  views: 89,
}

export default function QuestionDetailPage({ params }) {
  const navigate = useNavigate() // Next.js의 useRouter 대신 React Router의 useNavigate 사용
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(questionData.likes)
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState([
    {
      id: 1,
      author: "이학생",
      authorAvatar: "/placeholder.svg?height=32&width=32",
      content: "저도 같은 문제가 있었는데, useEffect의 의존성 배열을 확인해보세요.",
      timeAgo: "30분 전",
      likes: 3,
    },
    {
      id: 2,
      author: "김강사",
      authorAvatar: "/placeholder.svg?height=32&width=32",
      content:
        "React 공식 문서에 관련 내용이 있습니다. 다음 링크를 참고해보세요: https://react.dev/reference/react/useEffect",
      timeAgo: "15분 전",
      likes: 5,
      isInstructor: true,
    },
  ])

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
            <h1 className="text-lg font-bold">질문</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-[800px]">
        {/* 질문 정보 */}
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">{questionData.title}</h1>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={questionData.authorAvatar} />
                <AvatarFallback>{questionData.author[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{questionData.author}</div>
                <div className="text-sm text-gray-500">{questionData.timeAgo}</div>
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
              <span>{questionData.views}</span>
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
            <p>{questionData.content}</p>
            <p>React 컴포넌트가 두 번 렌더링되는 문제가 발생하고 있습니다. 코드는 다음과 같습니다:</p>
            <div className="w-full">
              <CodeBlock
                code={`function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then(result => {
      setData(result);
    });
  }); // 의존성 배열이 없음

  return <div>{data ? data.name : 'Loading...'}</div>;
}`}
                language="javascript"
              />
            </div>
            <p>이 문제를 어떻게 해결할 수 있을까요? 도움 부탁드립니다.</p>
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
          <div className="space-y-4">
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
        </div>
      </main>
    </div>
  )
}

