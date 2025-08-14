"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userInfoAtom } from "@/jotai/authAtoms";
import { RoomType } from "@/utils/constant/constants";
import { useAtomValue } from "jotai";
import { MessageSquare, Plus, Users } from "lucide-react";
import { useState, useCallback, memo } from "react";
import SearchMember from "./search-member";
import SelectedMembersList from "./selected-members-list";

// 메모이제이션된 컴포넌트
const CreateRoomDialog = memo(({ onCreateRoom }) => {
  const [open, setOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState(RoomType.GROUP_CHAT);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const user = useAtomValue(userInfoAtom);

  // 다이얼로그가 열릴 때마다 상태 초기화
  const handleOpenChange = useCallback((isOpen) => {
    setOpen(isOpen);
    if (isOpen) {
      setNewRoomName("");
      setNewRoomType(RoomType.GROUP_CHAT);
      setSelectedMembers([]);
    }
  }, []);

  const handleCreateRoom = useCallback(async () => {
    if (newRoomName.trim()) {
      await onCreateRoom(newRoomName, newRoomType, selectedMembers);
      setOpen(false);
    }
  }, [newRoomName, newRoomType, selectedMembers, onCreateRoom]);

  const handleAddMember = useCallback((member) => {
    setSelectedMembers((prev) => {
      // 이미 선택된 멤버인지 확인
      if (prev.some((m) => m.id === member.id)) {
        return prev;
      }
      return [...prev, member];
    });
  }, []);

  const handleRemoveMember = useCallback((memberId) => {
    setSelectedMembers((prev) =>
      prev.filter((member) => member.id !== memberId)
    );
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="text-gray-600 hover:text-[#FFC107]">
          <Plus size={16} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>새 채팅방 만들기</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-6">
            {/* 채팅방 정보 섹션 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MessageSquare size={16} />
                채팅방 정보
              </h3>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room-name" className="text-right">
                  이름
                </Label>
                <Input
                  id="room-name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="col-span-3"
                  placeholder="채팅방 이름을 입력하세요"
                />
              </div>
            </div>

            {/* 구분선 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-500">멤버 초대</span>
              </div>
            </div>

            {/* 멤버 초대 섹션 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Users size={16} />
                초대할 멤버 선택
              </h3>

              {/* 검색 컴포넌트 */}
              <SearchMember onMemberSelect={handleAddMember} />

              {/* 선택된 멤버 목록 */}
              <SelectedMembersList
                members={selectedMembers}
                onRemoveMember={handleRemoveMember}
              />
            </div>
          </div>
        </div>

        {/* 반응형으로 수정된 Footer */}
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 p-4 border-t mt-auto bg-white">
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              취소
            </Button>
          </DialogClose>
          <Button
            onClick={handleCreateRoom}
            disabled={!newRoomName.trim()}
            className="bg-[#FFC107] hover:bg-[#FFB000] text-white w-full sm:w-auto"
          >
            {selectedMembers.length > 0
              ? `생성 및 초대 (${selectedMembers.length}명)`
              : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

CreateRoomDialog.displayName = "CreateRoomDialog";

export default CreateRoomDialog;
