"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users } from "lucide-react";
import { memo, useCallback, useState } from "react";
import SearchMember from "../search-member";
import SelectedMembersList from "../selected-members-list";

// 메모이제이션된 컴포넌트
export const InviteChatDialog = memo(
  ({
    isInviteChatDialogOpen,
    setIsInviteChatDialogOpen,
    selectedChatRoomId,
    userInfo,
    onInviteMembers,
  }) => {
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [isInviting, setIsInviting] = useState(false);

    // 멤버 추가 핸들러
    const handleAddMember = useCallback((member) => {
      setSelectedMembers((prev) => {
        // 이미 선택된 멤버인지 확인
        if (prev.some((m) => m.id === member.id)) {
          return prev;
        }
        return [...prev, member];
      });
    }, []);

    // 멤버 제거 핸들러
    const handleRemoveMember = useCallback((memberId) => {
      setSelectedMembers((prev) =>
        prev.filter((member) => member.id !== memberId)
      );
    }, []);

    // 초대 처리 핸들러
    const handleInvite = useCallback(async () => {
      if (selectedMembers.length === 0) return;

      setIsInviting(true);
      try {
        const inviterName =
          userInfo?.name || userInfo?.email?.split("@")[0] || "사용자";
        const success = await onInviteMembers(
          selectedMembers,
          inviterName,
          selectedChatRoomId,
          userInfo.id
        );

        if (success) {
          // 초대 성공 시 다이얼로그 닫기
          setIsInviteChatDialogOpen(false);
          setSelectedMembers([]);
        }
      } catch (error) {
        console.error("초대 처리 오류:", error);
      } finally {
        setIsInviting(false);
      }
    }, [
      selectedMembers,
      userInfo,
      selectedChatRoomId,
      onInviteMembers,
      setIsInviteChatDialogOpen,
    ]);

    // 다이얼로그가 닫힐 때 상태 초기화
    const handleOpenChange = useCallback(
      (isOpen) => {
        setIsInviteChatDialogOpen(isOpen);
        if (!isOpen) {
          setSelectedMembers([]);
        }
      },
      [setIsInviteChatDialogOpen]
    );

    return (
      <Dialog open={isInviteChatDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-white dark:bg-gray-950">
            <DialogTitle>채팅방에 멤버 초대</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid gap-6">
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
            <DialogFooter className="px-6 py-4 border-t flex flex-col sm:flex-row gap-2 sm:gap-2 sticky bottom-0 bg-white dark:bg-gray-950">
              <DialogClose asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  취소
                </Button>
              </DialogClose>
              <Button
                onClick={handleInvite}
                disabled={selectedMembers.length === 0 || isInviting}
                className="bg-[#FFC107] hover:bg-[#FFB000] text-white w-full sm:w-auto"
              >
                {isInviting ? (
                  <>
                    <span className="mr-2">초대 중...</span>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  </>
                ) : (
                  `초대하기 (${selectedMembers.length}명)`
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

InviteChatDialog.displayName = "InviteChatDialog";

export default InviteChatDialog;
