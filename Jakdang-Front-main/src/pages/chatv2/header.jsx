"use client";

import { InviteChatDialog } from "@/components/chat/inviteChatDialog";
import { MediaFilesModal } from "@/components/chat/mediaFilesModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import { useChatService } from "@/hooks/useChatService";
import { userInfoAtom } from "@/jotai/authAtoms";
import { activeChatRoomAtom } from "@/jotai/chatAtoms";
import { RoomType } from "@/utils/constant/constants";
import { useAtom, useAtomValue } from "jotai";
import {
  Home,
  Menu,
  MessageSquare,
  Pin,
  UserPlus,
  Users,
  ImageIcon,
  X,
  Settings,
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

export function Header({
  setFixedMessageModalOpen,
  toggleMobileMembersSidebar,
  isMobileMembersSidebarOpen,
  toggleMobileSidebar,
  connectionStatus,
  isPopup = false,
  onClose,
  onUpdateRoom,
  onLeaveRoom,
}) {
  
  const user = useAtomValue(userInfoAtom);
  const [activeRoom, setActiveRoom] = useAtom(activeChatRoomAtom);
  const [isInviteChatDialogOpen, setIsInviteChatDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editRoomData, setEditRoomData] = useState({
    name: "",
    description: "",
  });
  const { fetchPost } = useAxiosQuery();
  const { fetchRoomList, updateRoom, leaveRoom } = useChatService(user?.userId);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const { toast } = useToast();

  // 채팅방 설정 다이얼로그 열기
  const handleOpenEditDialog = () => {
    if (activeRoom) {
      setEditRoomData({
        name: activeRoom.name || "",
        description: activeRoom.description || "",
      });
      setIsEditDialogOpen(true);
      setIsSettingsDialogOpen(false);
    }
  };

  // 채팅방 정보 수정 처리
  const handleUpdateRoom = async () => {
    if (activeRoom && editRoomData.name.trim()) {
      try {
        await updateRoom(activeRoom.id, editRoomData.name, editRoomData.description);
        
        // 현재 활성화된 채팅방 정보 업데이트
        setActiveRoom((prev) => ({
          ...prev,
          name: editRoomData.name,
          description: editRoomData.description,
        }));

        setIsEditDialogOpen(false);
        
        // 외부 핸들러가 있으면 호출
        if (onUpdateRoom) {
          onUpdateRoom(editRoomData);
        }
        
        toast({
          title: "성공",
          description: "채팅방 정보가 업데이트되었습니다.",
        });
      } catch (error) {
        console.error("채팅방 정보 업데이트 오류:", error);
        toast({
          title: "오류",
          description: "채팅방 정보 업데이트에 실패했습니다.",
          variant: "destructive",
        });
      }
    }
  };

  // 채팅방 나가기 처리
  const handleLeaveRoom = async () => {
    if (activeRoom) {
      const confirmMessage = "정말로 이 채팅방을 나가시겠습니까?";
      if (window.confirm(confirmMessage)) {
        try {
          await leaveRoom(activeRoom.id);
          setActiveRoom(null);
          setIsSettingsDialogOpen(false);
          
          // 외부 핸들러가 있으면 호출
          if (onLeaveRoom) {
            onLeaveRoom();
          } else if (isPopup) {
            // 팝업에서는 채팅 리스트로 이동
            window.location.href = "/popup-chat";
          }
          
          toast({
            title: "성공",
            description: "채팅방에서 나갔습니다.",
          });
        } catch (error) {
          console.error("채팅방 나가기 오류:", error);
          toast({
            title: "오류",
            description: "채팅방 나가기에 실패했습니다.",
            variant: "destructive",
          });
        }
      }
    }
  };

  // 헤더 왼쪽에 메뉴 버튼 추가
  const renderMenuButton = () => (
    <button
      className="text-gray-600 hover:text-gray-800 pr-2 lg:hidden flex items-center justify-center"
      onClick={toggleMobileSidebar}
    >
      <Menu size={20} />
    </button>
  );

  // 헤더 오른쪽에 멤버 목록 토글 버튼 추가
  const renderMemberToggleButton = () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="text-gray-600 hover:text-gray-800 bg-[#F5F5F5] p-1.5 rounded-lg"
            onClick={toggleMobileMembersSidebar}
          >
            <Users
              size={18}
              className={isMobileMembersSidebarOpen ? "text-[#0284c7]" : ""}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>멤버 목록</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // 모바일 네비게이션 버튼 렌더링
  const renderMobileNavigation = () => {
    // 채팅방이 선택되지 않았으면 네비게이션을 표시하지 않음
    if (!activeRoom) return null;

    return (
      <div className="flex items-center space-x-2 lg:hidden">
        {renderMemberToggleButton()}
      </div>
    );
  };
  // 헤더에 표시할 내용이 없는 경우
  if (!activeRoom) {
    return (
      <div className="h-[57px] border-b border-[#E0E0E0] flex items-center px-4 shadow-sm bg-white justify-between">
        <div className="flex items-center">
          {!isPopup && renderMenuButton()}
          <span className={`font-bold text-gray-800 ml-2 ${isPopup ? 'ml-10' : ''}`}>채팅</span>
          <div className="ml-2 text-gray-600 text-sm">채팅방을 선택하세요</div>
          {connectionStatus && (
            <div className="ml-2 text-sm text-gray-500">
              ({connectionStatus})
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {!isPopup && renderMobileNavigation()}
          {/* {isPopup && onClose && (
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 p-1"
            >
              <X size={16} />
            </button>
          )} */}
        </div>
      </div>
    );
  }

  // 초대 처리 함수
  const handleInviteMembers = async (
    selectedMembers,
    inviterName,
    chatRoomId,
    userId
  ) => {
    try {
      const members = [];
      selectedMembers.forEach((member) => {
        members.push({
          roomId: chatRoomId,
          userId: userId,
          targetUserId: member.id,
          nickname: member.nickname,
        });
      });
      const response = await fetchPost("/chat/room/invite", members);
      console.log(response);
      await fetchRoomList(); // 방 목록을 새로고침
      return true;
    } catch (error) {
      console.error("초대 처리 오류:", error);
      return false;
    }
  };
  return (
    <div className="border-b border-[#E0E0E0] flex items-center p-3 shadow-sm bg-white justify-between">
      <div className={`flex items-center flex-1 min-w-0 p-0 ${isPopup ? 'pl-8' : ''}`}>
        {!isPopup && renderMenuButton()}

        {/* 일반 채팅방 UI */}
        <>
          <span className="font-bold text-gray-800 text-base ">
            {activeRoom.type === RoomType.INDIVIDUAL
              ? activeRoom.members.find((member) => {
                  return member.userId !== user.userId;
                })?.nickname || "1:1 대화방"
              : activeRoom.name}
          </span>
          {connectionStatus && (
            <div className="ml-2 text-sm text-gray-500">
              ({connectionStatus})
            </div>
          )}
        </>
      </div>
      <div className="flex items-center space-x-2">
        {/* 팝업 모드에서도 멤버 토글 버튼 항상 표시 */}
        {renderMemberToggleButton()}
        {/* 일반 채팅방 액션 버튼 */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-gray-600 hover:text-gray-800 bg-[#F5F5F5] p-1.5 rounded-lg"
                onClick={() => setIsMediaModalOpen(true)}
              >
                <ImageIcon size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent>미디어 모아보기</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-gray-600 hover:text-gray-800 bg-[#F5F5F5] p-1.5 rounded-lg"
                onClick={() => setIsInviteChatDialogOpen((prev) => !prev)}
              >
                <UserPlus size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent>멤버 초대</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* 채팅방 설정 버튼 */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-gray-600 hover:text-gray-800 bg-[#F5F5F5] p-1.5 rounded-lg"
                onClick={() => setIsSettingsDialogOpen(true)}
              >
                <Settings size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent>채팅방 설정</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {activeRoom && user && activeRoom.creatorId === user.userId && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="text-gray-600 hover:text-gray-800 bg-[#F5F5F5] p-1.5 rounded-lg"
                  onClick={() => setFixedMessageModalOpen(true)}
                >
                  <Pin size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent>고정된 메시지</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* 이미지 및 파일 모아보기 모달 */}
      <MediaFilesModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        roomId={activeRoom?.id}
      />

      {/* 초대 다이얼로그 */}
      <InviteChatDialog
        isInviteChatDialogOpen={isInviteChatDialogOpen}
        setIsInviteChatDialogOpen={setIsInviteChatDialogOpen}
        selectedChatRoomId={activeRoom?.id}
        userInfo={{
          id: user?.userId,
          email: user?.email,
          name: user?.name,
        }}
        onInviteMembers={handleInviteMembers}
      />
      
      {/* 채팅방 설정 다이얼로그 */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>채팅방 설정</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">채팅방 정보</TabsTrigger>
              <TabsTrigger value="leave">채팅방 나가기</TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="room-name">채팅방 이름</Label>
                  <Input
                    id="room-name"
                    value={activeRoom?.name || ""}
                    onClick={handleOpenEditDialog}
                    readOnly
                    className="cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room-description">채팅방 설명</Label>
                  <Input
                    id="room-description"
                    value={activeRoom?.description || "설명 없음"}
                    onClick={handleOpenEditDialog}
                    readOnly
                    className="cursor-pointer"
                  />
                </div>
                <Button className="w-full" onClick={handleOpenEditDialog}>
                  채팅방 정보 수정
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="leave" className="py-4">
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  채팅방을 나가면 모든 대화 내용에 접근할 수 없게 됩니다.
                  정말로 나가시겠습니까?
                </p>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLeaveRoom}
                >
                  채팅방 나가기
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* 채팅방 정보 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>채팅방 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-room-name">채팅방 이름</Label>
              <Input
                id="edit-room-name"
                value={editRoomData.name}
                onChange={(e) =>
                  setEditRoomData({ ...editRoomData, name: e.target.value })
                }
                placeholder="채팅방 이름을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-room-description">채팅방 설명</Label>
              <Textarea
                id="edit-room-description"
                className="max-h-[100px] resize-none"
                value={editRoomData.description}
                onChange={(e) =>
                  setEditRoomData({
                    ...editRoomData,
                    description: e.target.value,
                  })
                }
                placeholder="채팅방에 대한 설명을 입력하세요"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleUpdateRoom}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
