"use client"

import { Home, MessageSquare, Users } from "lucide-react"
import { useAtom } from "jotai"
import { activeCategoryAtom, activeChatRoomAtom } from "@/jotai/chatAtoms"
import { cn } from "@/lib/utils"

export function MobileTabs({
  isMobileSidebarOpen,
  toggleMobileSidebar,
  isMobileMembersSidebarOpen,
  toggleMobileMembersSidebar,
}) {
  const [activeRoom] = useAtom(activeChatRoomAtom)
  // 채팅방이나 채널이 선택되지 않았으면 탭을 표시하지 않음
  if (!activeRoom) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E0E0E0] flex justify-around py-2 lg:hidden z-30">
      <button
        onClick={toggleMobileSidebar}
        className={cn(
          "flex flex-col items-center justify-center p-2 rounded-lg",
          isMobileSidebarOpen ? "text-[#0284c7]" : "text-gray-400",
        )}
      >
        <Home size={20} />
        <span className="text-xs mt-1">채널</span>
      </button>

      <button
        className={cn(
          "flex flex-col items-center justify-center p-2 rounded-lg",
          !isMobileSidebarOpen && !isMobileMembersSidebarOpen ? "text-[#0284c7]" : "text-gray-400",
        )}
        onClick={() => {
          if (isMobileSidebarOpen) toggleMobileSidebar()
          if (isMobileMembersSidebarOpen) toggleMobileMembersSidebar()
        }}
      >
        <MessageSquare size={20} />
        <span className="text-xs mt-1">채팅</span>
      </button>

      <button
        onClick={toggleMobileMembersSidebar}
        className={cn(
          "flex flex-col items-center justify-center p-2 rounded-lg",
          isMobileMembersSidebarOpen ? "text-[#0284c7]" : "text-gray-400",
        )}
      >
        <Users size={20} />
        <span className="text-xs mt-1">멤버</span>
      </button>
    </div>
  )
}
