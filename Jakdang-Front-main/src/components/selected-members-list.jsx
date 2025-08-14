"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { memo } from "react"

// 메모이제이션된 컴포넌트
const SelectedMembersList = memo(({ members, onRemoveMember }) => {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-xs text-gray-500">초대할 멤버 ({members.length}명)</label>
      <div className="w-full border border-[#E0E0E0] rounded-xl p-2 max-h-[120px] overflow-y-auto bg-white">
        {members.length === 0 ? (
          <p className="text-center text-gray-400 py-4">선택된 멤버가 없습니다</p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border border-[#E0E0E0]">
                  <AvatarImage src={member.avatar || "/placeholder.svg?height=40&width=40"} alt={member.name} />
                  <AvatarFallback className="bg-[#FFC107] text-white">{member.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-800">{member.name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveMember(member.id)}
                className="h-8 w-8 p-0 rounded-full text-gray-800 hover:bg-[#F5F5F5]"
              >
                ×
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
})

SelectedMembersList.displayName = "SelectedMembersList"

export default SelectedMembersList
