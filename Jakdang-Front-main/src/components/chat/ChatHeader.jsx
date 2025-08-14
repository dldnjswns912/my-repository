"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowLeft, Info, LogOut, MoreVertical, Trash, UserPlus } from "lucide-react"
import { useCallback, useState } from "react"

export const ChatHeader = ({ isMobile, setShowChatList, onLeaveChat, selectedChat, setIsInviteChatDialogOpen }) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

  const handleBackClick = useCallback(() => {
    if (isMobile) {
      setShowChatList(true)
    }
  }, [isMobile, setShowChatList])

  const handleLeaveChatClick = useCallback(() => {
    setIsMoreMenuOpen(false)
    if (onLeaveChat) {
      onLeaveChat()
    }
  }, [onLeaveChat])

  const handleInviteClick = useCallback(() => {
    setIsMoreMenuOpen(false)
    if (setIsInviteChatDialogOpen) {
      setIsInviteChatDialogOpen(true)
    }
  }, [setIsInviteChatDialogOpen])

  // 선택된 채팅방이 없는 경우
  if (!selectedChat) {
    return (
      <div className="p-4 border-b dark:border-navy-700 flex items-center bg-white dark:bg-navy-800">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 rounded-full hover:bg-chat-hover dark:hover:bg-chat-darkHover"
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-5 w-5 text-chat-primary dark:text-white" />
          </Button>
        )}
        <h3 className="font-medium text-gray-800 dark:text-white">채팅 선택</h3>
      </div>
    )
  }

  return (
    <div className="p-4 border-b dark:border-navy-700 flex items-center justify-between bg-white dark:bg-navy-800 shadow-sm">
      <div className="flex items-center">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 rounded-full hover:bg-chat-hover dark:hover:bg-chat-darkHover"
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-5 w-5 text-chat-primary dark:text-white" />
          </Button>
        )}
        <Avatar className="h-10 w-10 mr-3 border-2 border-chat-light dark:border-navy-600">
          <AvatarImage src={selectedChat.avatar || "/placeholder.svg?height=40&width=40"} alt={selectedChat.name} />
          <AvatarFallback className="bg-chat-primary text-white">{selectedChat.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium text-gray-800 dark:text-white">{selectedChat.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            {selectedChat.isGroup ? (
              `${selectedChat.participants?.length || 0}명`
            ) : selectedChat.online ? (
              <>
                <span className="h-2 w-2 bg-chat-online rounded-full mr-1.5"></span>
                온라인
              </>
            ) : (
              "오프라인"
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-chat-hover dark:hover:bg-chat-darkHover">
          <Info className="h-5 w-5 text-chat-primary dark:text-white" />
        </Button>
        <DropdownMenu open={isMoreMenuOpen} onOpenChange={setIsMoreMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-chat-hover dark:hover:bg-chat-darkHover"
            >
              <MoreVertical className="h-5 w-5 text-gray-600 dark:text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl shadow-modal">
            {selectedChat.isGroup && (
              <DropdownMenuItem onClick={handleInviteClick} className="rounded-lg cursor-pointer">
                <UserPlus className="mr-2 h-4 w-4 text-chat-primary" />
                <span>멤버 초대</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleLeaveChatClick} className="rounded-lg cursor-pointer">
              <LogOut className="mr-2 h-4 w-4 text-chat-primary" />
              <span>채팅방 나가기</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLeaveChatClick}
              className="text-red-500 focus:text-red-500 rounded-lg cursor-pointer"
            >
              <Trash className="mr-2 h-4 w-4" />
              <span>채팅방 삭제</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default ChatHeader