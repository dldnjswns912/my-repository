"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import useChat from "@/hooks/useChatHooks"
import {
  filteredChatRoomsAtom,
  isMobileAtom,
  searchQueryAtom,
  selectChatRoomAtom,
  selectedChatRoomAtom,
  showChatListAtom,
  toggleCreateChatModalAtom,
  toggleCreateGroupChatModalAtom,
} from "@/recoil/chatAtoms"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { Plus, Search, UserPlus, Users } from "lucide-react"
import { useEffect } from "react"

const ChatList = () => {
  const filteredChatRooms = useAtomValue(filteredChatRoomsAtom)
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom)
  const selectedChatRoom = useAtomValue(selectedChatRoomAtom)
  const selectChatRoom = useSetAtom(selectChatRoomAtom)
  const isMobile = useAtomValue(isMobileAtom)
  const setShowChatList = useSetAtom(showChatListAtom)
  const toggleCreateChatModal = useSetAtom(toggleCreateChatModalAtom)
  const toggleCreateGroupChatModal = useSetAtom(toggleCreateGroupChatModalAtom)

  const { fetchChatRooms, isChatRoomsLoading } = useChat()

  useEffect(() => {
    fetchChatRooms()
  }, [])

  const handleSelectChat = (chatId) => {
    selectChatRoom(chatId)
    if (isMobile) {
      setShowChatList(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b dark:border-navy-700 flex items-center gap-2 bg-white dark:bg-navy-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
          <Input
            placeholder="검색"
            className="pl-10 bg-gray-100 dark:bg-navy-700 border-none rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-chat-hover dark:hover:bg-chat-darkHover"
            >
              <Plus className="h-5 w-5 text-chat-primary dark:text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl shadow-modal">
            <DropdownMenuItem onClick={() => toggleCreateChatModal(true)} className="rounded-lg cursor-pointer">
              <UserPlus className="mr-2 h-4 w-4 text-chat-primary" />
              <span>새 채팅</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleCreateGroupChatModal(true)} className="rounded-lg cursor-pointer">
              <Users className="mr-2 h-4 w-4 text-chat-primary" />
              <span>새 단톡방</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 채팅 목록 */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-navy-800">
        {isChatRoomsLoading && (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-chat-primary"></div>
          </div>
        )}

        {!isChatRoomsLoading && filteredChatRooms.length === 0 && (
          <div className="text-center p-8 text-gray-500 dark:text-gray-400">
            {searchQuery ? "검색 결과가 없습니다." : "채팅방이 없습니다."}
          </div>
        )}

        {filteredChatRooms.map((chat) => (
          <div
            key={chat.id}
            className={`flex items-center p-4 cursor-pointer transition-all hover:bg-chat-hover dark:hover:bg-chat-darkHover ${
              selectedChatRoom?.id === chat.id ? "bg-chat-light dark:bg-navy-700" : ""
            }`}
            onClick={() => handleSelectChat(chat.id)}
          >
            <div className="relative mr-3">
              <Avatar className="h-12 w-12 border-2 border-gray-100 dark:border-navy-600">
                <AvatarImage
                  src={
                    chat.thumbnails && chat.thumbnails.length > 0
                      ? chat.thumbnails[0]
                      : "/placeholder.svg?height=40&width=40"
                  }
                  alt={chat.room_name || "채팅방"}
                />
                <AvatarFallback className="bg-chat-primary text-white">
                  {(chat.room_name || "채팅방")[0]}
                </AvatarFallback>
              </Avatar>
              {chat.is_online && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-chat-online border-2 border-white dark:border-navy-800"></span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-800 dark:text-white truncate">
                  {chat.room_name || getChatRoomName(chat)}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatTime(chat.send_time)}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {chat.last_message || "새로운 채팅방"}
              </p>
            </div>
            {chat.unreads > 0 && (
              <Badge className="ml-2 bg-chat-primary text-white rounded-full min-w-[20px] h-5 flex items-center justify-center">
                {chat.unreads}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// 채팅방 이름 생성 유틸리티 함수
const getChatRoomName = (chat) => {
  if (chat.room_name) return chat.room_name
  if (chat.default_room_name) return chat.default_room_name

  // members가 문자열로 저장된 경우 파싱
  try {
    if (typeof chat.members === "string") {
      const memberIds = JSON.parse(chat.members)
      if (Array.isArray(memberIds) && memberIds.length > 0) {
        return `${memberIds.length}인 채팅방`
      }
    }
  } catch (error) {
    console.error("채팅방 멤버 파싱 오류:", error)
  }

  return "채팅방"
}

// 시간 포맷 유틸리티 함수
const formatTime = (timeString) => {
  if (!timeString) return ""

  const now = new Date()
  const messageTime = new Date(timeString)

  // 오늘 날짜인 경우 시간만 표시
  if (
    now.getFullYear() === messageTime.getFullYear() &&
    now.getMonth() === messageTime.getMonth() &&
    now.getDate() === messageTime.getDate()
  ) {
    return messageTime.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  // 어제 날짜인 경우 '어제' 표시
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (
    yesterday.getFullYear() === messageTime.getFullYear() &&
    yesterday.getMonth() === messageTime.getMonth() &&
    yesterday.getDate() === messageTime.getDate()
  ) {
    return "어제"
  }

  // 일주일 이내인 경우 요일 표시
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)
  if (messageTime >= weekAgo) {
    const days = ["일", "월", "화", "수", "목", "금", "토"]
    return `${days[messageTime.getDay()]}요일`
  }

  // 그 외의 경우 날짜 표시
  return messageTime.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default ChatList

