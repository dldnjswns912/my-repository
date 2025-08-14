"use client"

import AssignmentSubmitConfirmModal from "@/components/modal/assignment-submit-confirm-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    ArrowLeft,
    Bookmark,
    Calendar,
    Clock,
    Eye,
    FileText,
    Heart,
    MessageCircle,
    Paperclip,
    Share2,
    Upload,
} from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

// 과제 데이터 (실제 구현에서는 API에서 가져옴)
const assignmentData = {
  id: 7,
  author: "김강사",
  authorAvatar: "/placeholder.svg?height=40&width=40",
  timeAgo: "3일 전",
  title: "React 컴포넌트 구현 과제",
  content: "다음 주 월요일까지 React 컴포넌트를 구현하는 과제입니다. 자세한 내용은 첨부파일을 확인하세요.",
  likes: 12,
  comments: 15,
  views: 156,
}

export default function AssignmentDetailPage({ params }) {
  const navigate = useNavigate() // Next.js의 useRouter 대신 React Router의 useNavigate 사용
  const [submissionText, setSubmissionText] = useState("")
  const [files, setFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(assignmentData.likes)
  const [comments, setComments] = useState(assignmentData.comments)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles([...files, ...newFiles])
    }
  }

  const removeFile = (index) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      setFiles([...files, ...newFiles])
    }
  }

  const handleSubmit = () => {
    setIsConfirmModalOpen(true)
  }

  const confirmSubmit = () => {
    setIsConfirmModalOpen(false)
    setIsSubmitting(true)
    // 실제 구현에서는 API 호출로 과제 제출
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 1500)
  }

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

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">과제</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-[800px]">
        {/* 과제 정보 */}
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">{assignmentData.title}</h1>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={assignmentData.authorAvatar} />
                <AvatarFallback>{assignmentData.author[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{assignmentData.author}</div>
                <div className="text-sm text-gray-500">{assignmentData.timeAgo}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{assignmentData.views}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{likeCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{comments}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>제출 기한: 2023년 12월 15일 오후 11:59</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>남은 시간: 3일 2시간 45분</span>
            </div>
          </div>

          <div className="prose max-w-none">
            <p>{assignmentData.content}</p>
            <p>이 과제에서는 다음 요구사항에 맞게 React 컴포넌트를 구현해야 합니다:</p>
            <ul>
              <li>사용자 입력을 받는 폼 컴포넌트 구현</li>
              <li>입력 데이터 유효성 검사 기능 추가</li>
              <li>제출 시 데이터를 서버로 전송하는 기능 구현</li>
              <li>로딩 및 에러 상태 처리</li>
            </ul>
            <p>구현한 코드는 GitHub 저장소에 업로드하고, 배포된 URL과 함께 제출해주세요.</p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="text-blue-500 font-medium">과제_명세서.pdf</span>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className={`flex cursor-pointer items-center gap-1 ${isLiked ? "text-red-500" : "text-gray-600"}`}
                onClick={toggleLike}
              >
                <Heart className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
                <span>좋아요</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex cursor-pointer items-center gap-1 text-gray-600">
                <Share2 className="w-5 h-5 cursor-pointer" />
                <span>공유</span>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={`flex cursor-pointer items-center gap-1 ${isBookmarked ? "text-yellow-500" : "text-gray-600"}`}
              onClick={toggleBookmark}
            >
              <Bookmark className="w-5 h-5" fill={isBookmarked ? "currentColor" : "none"} />
              <span>북마크</span>
            </Button>
          </div>

          {/* 구분선 */}
          <div className="border-t my-6"></div>

          {/* 과제 제출 폼 */}
          {!isSubmitted ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">과제 제출</h3>
              <Textarea
                placeholder="과제에 대한 설명이나 메모를 입력하세요."
                className="min-h-[120px] resize-none"
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
              />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex cursor-pointer items-center gap-1"
                    onClick={() => document.getElementById("file-upload").click()}
                  >
                    <Paperclip className="w-4 h-4" />
                    파일 첨부
                  </Button>
                  <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} />
                  <span className="text-sm text-gray-500">최대 5개 파일, 각 20MB 이하</span>
                </div>

                <div
                  className={`mt-4 border-2 border-dashed rounded-lg p-6 transition-colors ${
                    isDragging
                      ? "border-navy-500 bg-navy-50 dark:border-navy-400 dark:bg-navy-900/50"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <Paperclip className="w-8 h-8 mb-2 text-gray-400 dark:text-gray-500" />
                    <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                      파일을 여기에 드래그하여 업로드하세요
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      또는 파일 첨부 버튼을 클릭하여 파일을 선택하세요
                    </p>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">첨부된 파일 ({files.length})</p>
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-navy-700 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-6 w-6 p-0 text-gray-500 dark:text-gray-400"
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                className="w-full bg-navy-600 hover:bg-navy-700 mt-4"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> 제출 중...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4" /> 과제 제출하기
                  </span>
                )}
              </Button>
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                과제가 성공적으로 제출되었습니다!
              </div>
              <p className="text-sm text-green-600 mt-2">제출 시간: {new Date().toLocaleString()}</p>
            </div>
          )}
        </div>
      </main>

      {/* 과제 제출 확인 모달 */}
      <AssignmentSubmitConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmSubmit}
      />
    </div>
  )
}

