"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import useChat from "@/hooks/useChatHooks"
import { memberIdAtom } from "@/jotai/authAtoms"
import { useAtomValue } from "jotai"
import { MoreVertical, Trash } from "lucide-react"
import { useState } from "react"

const Message = ({ message, chatRoom, onDelete }) => {
  const memberId = useAtomValue(memberIdAtom)
  const { deleteMessage } = useChat()
  const [menuOpen, setMenuOpen] = useState(false)

  const isMyMessage = message.sender_id === memberId || message.is_me
  const isGroup = chatRoom?.room_type === 1

  const handleDeleteMessage = async () => {
    setMenuOpen(false)
    if (message.id) {
      const success = await deleteMessage(message.id)
      if (success && onDelete) {
        onDelete(message.id)
      }
    }
  }

  // 메시지 타입에 따라 컨텐츠 렌더링
  const renderMessageContent = () => {
    if (message.is_deleted) {
      return <p className="text-gray-400 italic">삭제된 메시지입니다.</p>
    }

    switch (message.type) {      case "image":
        return (
          <div className="max-w-[200px] overflow-hidden rounded-lg">
            <img
              src={message.content || "/placeholder.svg"}
              alt="이미지"
              className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => {
                // ChatV2의 이미지 모달 사용
                if (window.openImageModal) {
                  const imageData = [{
                    fileId: message.id,
                    fileUrl: message.content || "/placeholder.svg",
                    fileName: "이미지"
                  }];
                  window.openImageModal(imageData, 0);
                } else {
                  // 폴백: 새 탭에서 열기
                  window.open(message.content, '_blank');
                }
              }}
              onError={(e) => {
                e.target.onerror = null
                e.target.src = "/placeholder.svg?height=200&width=200"
              }}
            />
          </div>
        )
      case "file":
        return (
          <div className="flex items-center bg-white dark:bg-navy-800 p-2 rounded-lg shadow-sm">
            <div className="bg-chat-primary p-2 rounded-full text-white mr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <a
              href={message.content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-chat-primary dark:text-chat-accent text-sm truncate hover:underline"
            >
              {getFileNameFromUrl(message.content)}
            </a>
          </div>
        )
      default:
        return <p className="whitespace-pre-wrap">{message.content}</p>
    }
  }

  return (
    <div className={`flex ${isMyMessage ? "justify-end" : "justify-start"} mb-4`}>
      {!isMyMessage && (
        <Avatar className="h-8 w-8 mr-2 mt-1 border-2 border-gray-100 dark:border-navy-600">
          <AvatarImage
            src={message.sender_avatar || "/placeholder.svg?height=40&width=40"}
            alt={message.sender_name || message.sender_id}
          />
          <AvatarFallback className="bg-chat-primary text-white">
            {(message.sender_name || message.sender_id || "익명")[0]}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[70%]`}>
        {!isMyMessage && isGroup && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
            {message.sender_name || message.sender_id || "익명"}
          </p>
        )}
        <div className="relative group">
          <div
            className={`p-3 rounded-chat ${
              isMyMessage
                ? "bg-chat-primary text-white rounded-tr-none"
                : "bg-white dark:bg-navy-700 dark:text-white rounded-tl-none shadow-chat"
            } ${message.status === "failed" ? "opacity-50" : ""}`}
          >
            {renderMessageContent()}
          </div>

          {/* 메시지 상태 표시 */}
          {isMyMessage && message.status && (
            <div className="absolute bottom-0 right-0 -mb-4 mr-2 text-xs">
              {message.status === "sending" && <span className="text-gray-400">전송 중...</span>}
              {message.status === "failed" && <span className="text-red-500">전송 실패</span>}
            </div>
          )}

          {isMyMessage && !message.is_deleted && !message.status && (
            <div className="absolute top-2 -left-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-navy-600">
                    <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl shadow-modal">
                  <DropdownMenuItem onClick={handleDeleteMessage} className="text-red-500 rounded-lg cursor-pointer">
                    <Trash className="h-4 w-4 mr-2" />
                    <span>삭제</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatMessageTime(message.time)}</p>
      </div>
    </div>
  )
}

// URL에서 파일명 추출하는 유틸리티 함수
const getFileNameFromUrl = (url) => {
  if (!url) return "파일"

  try {
    const pathParts = new URL(url).pathname.split("/")
    const fileName = pathParts[pathParts.length - 1]
    return decodeURIComponent(fileName) || "파일"
  } catch (error) {
    // URL 파싱 실패시 마지막 '/' 이후의 문자열 반환
    const parts = url.split("/")
    return parts[parts.length - 1] || "파일"
  }
}

// 메시지 시간 포맷팅 유틸리티 함수
const formatMessageTime = (timeString) => {
  if (!timeString) return ""

  if (timeString === "방금 전") return timeString

  try {
    const messageTime = new Date(timeString)
    return messageTime.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  } catch (error) {
    return timeString // 파싱 실패시 원본 문자열 반환
  }
}

export default Message

