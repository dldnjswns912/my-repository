"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { userInfoAtom } from "@/jotai/authAtoms"
import {
  chatSearchQueryAtom,
  filteredChatRoomsAtom,
  isCreateChatOpenAtom,
  isCreateGroupChatOpenAtom,
  selectedChatRoomIdAtom,
  unreadCountsAtom,
} from "@/jotai/chatAtoms"
import { useChatService } from "@/service/api/chatApi"
import { useAtom, useAtomValue } from "jotai"
import { Plus, Search, UserPlus, Users } from "lucide-react"
import { useCallback } from "react"

const ChatRoomList = ({ isMobile, setShowChatList }) => {
  const userInfo = useAtomValue(userInfoAtom)
  const [searchQuery, setSearchQuery] = useAtom(chatSearchQueryAtom)
  const filteredChatList = useAtomValue(filteredChatRoomsAtom)
  const [selectedChatId, setSelectedChatId] = useAtom(selectedChatRoomIdAtom)
  const [unreadCounts] = useAtom(unreadCountsAtom)
  const [isCreateChatOpen, setIsCreateChatOpen] = useAtom(isCreateChatOpenAtom)
  const [isCreateGroupChatOpen, setIsCreateGroupChatOpen] = useAtom(isCreateGroupChatOpenAtom)

  const chatService = useChatService()

  // 채팅 선택 핸들러
  const handleSelectChat = useCallback(
    (chatId) => {
      setSelectedChatId(chatId)

      // 메시지 조회 후 읽음 처리
      if (userInfo?.userId) {
        chatService.markAsRead(userInfo.userId, chatId).catch((error) => {
          console.error("읽음 처리 오류:", error)
        })
      }

      // 모바일에서는 채팅 선택 시 목록 숨기기
      if (isMobile) {
        setShowChatList(false)
      }
    },
    [setSelectedChatId, userInfo?.userId, chatService, isMobile, setShowChatList],
  )

  return (
    <div className="flex flex-col h-full">
      {/* 검색 및 새 채팅 */}
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
            <DropdownMenuItem onClick={() => setIsCreateChatOpen(true)} className="rounded-lg cursor-pointer">
              <UserPlus className="mr-2 h-4 w-4 text-chat-primary" />
              <span>새 채팅</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsCreateGroupChatOpen(true)} className="rounded-lg cursor-pointer">
              <Users className="mr-2 h-4 w-4 text-chat-primary" />
              <span>새 단톡방</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 채팅 목록 */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-navy-800">
        {filteredChatList.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {searchQuery ? "검색 결과가 없습니다." : "채팅방이 없습니다."}
          </div>
        ) : (
          filteredChatList.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center p-4 cursor-pointer transition-all hover:bg-chat-hover dark:hover:bg-chat-darkHover ${selectedChatId === chat.id ? "bg-chat-light dark:bg-navy-700" : ""}`}
              onClick={() => handleSelectChat(chat.id)}
            >
              <div className="relative mr-3">
                <Avatar className="h-12 w-12 border-2 border-gray-100 dark:border-navy-600">
                  <AvatarImage src={chat.avatar} alt={chat.name} />
                  <AvatarFallback className="bg-chat-primary text-white">{chat.name[0]}</AvatarFallback>
                </Avatar>
                {chat.online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-chat-online border-2 border-white dark:border-navy-800"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-800 dark:text-white truncate">{chat.name}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{chat.time}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{chat.lastMessage}</p>
              </div>
              {unreadCounts[chat.id] > 0 && (
                <Badge className="ml-2 bg-chat-primary text-white rounded-full min-w-[20px] h-5 flex items-center justify-center">
                  {unreadCounts[chat.id]}
                </Badge>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ChatRoomList

