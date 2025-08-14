"use client";

import CreateRoomDialog from "@/components/create-room-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useChatService } from "@/hooks/useChatService";
import { userInfoAtom } from "@/jotai/authAtoms";
import {
  activeChatRoomAtom,
  chatRoomsAtom,
  messagesAtom,
  unreadCountsAtom,
} from "@/jotai/chatAtoms";
import { cn } from "@/lib/utils";
import { RoomType } from "@/utils/constant/constants";
import { useAtom } from "jotai";
import {
  MessageSquare,
  Settings,
  User,
  Users,
  X
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function Sidebar({ toggleSidebar }) {
  const [showDMs, setShowDMs] = useState(true);
  const [_, setMessages] = useAtom(messagesAtom)
  const [user] = useAtom(userInfoAtom);
  const [roomList, setRoomList] = useAtom(chatRoomsAtom);
  const [activeRoom, setActiveRoom] = useAtom(activeChatRoomAtom);
  const [unreadCounts] = useAtom(unreadCountsAtom);

  // 채팅방 수정 상태
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editRoomData, setEditRoomData] = useState({
    name: "",
    description: "",
  });

  const {
    selectRoom,
    createRoom,
    fetchRoomList,
    leaveRoom,
    inviteToRoomMembers,
    updateRoom, // 채팅방 업데이트 함수 (추가 필요)
  } = useChatService(user?.userId);

  console.log("roomList", roomList);

  // ✅ 사용자 로그인 시 데이터 초기 로드 (루프 없음)
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (user?.userId && isMounted && !window.sidebarDataLoaded) {
        window.sidebarDataLoaded = true;
        // await fetchRoomList();
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [user?.userId]);

  const handleRoomSelect = useCallback(
    (roomId) => {
      if (activeRoom && activeRoom.id === roomId) return; // 이미 선택된 방은 무시
      setMessages([])
      selectRoom(roomId);
      roomList.find((room) => room.id === roomId).unreadCount = 0; // 읽지 않은 메시지 수 초기화
      // 모바일에서 채팅방 선택 시 사이드바 닫기
      if (toggleSidebar && window.innerWidth < 1024) {
        toggleSidebar();
      }
    },
    [activeRoom, roomList, selectRoom, setMessages, toggleSidebar]
  );

  const handleCreateRoom = useCallback(
    async (name, type, members) => {
      if (!name.trim()) return;

      // 채팅방 생성 및 멤버 초대 로직
      const roomId = await createRoom(name, type);

      // 선택된 멤버가 있으면 초대 로직 실행
      if (members.length > 0 && roomId) {
        try {
          const inviterName =
            user?.nickname || user?.email?.split("@")[0] || "사용자";
          const memberRequests = members.map((member) => ({
            roomId: roomId.id,
            userId: user?.userId,
            targetUserId: member.id,
            nickname: member.nickname,
          }));
          console.log(memberRequests);
          console.log(roomId);
          await inviteToRoomMembers(memberRequests);
        } catch (error) {
          console.error("멤버 초대 오류:", error);
        }
      }
    },
    [createRoom, inviteToRoomMembers, user]
  );

  // 채팅방 수정 다이얼로그 열기
  const handleOpenEditDialog = () => {
    if (activeRoom) {
      setEditRoomData({
        name: activeRoom.name || "",
        description: activeRoom.description || "",
      });
      setIsEditDialogOpen(true);
    }
  };

  // 채팅방 정보 수정 처리
  const handleUpdateRoom = async () => {
    if (activeRoom && editRoomData.name.trim()) {
      try {
        // 채팅방 정보 업데이트 API 호출
        // roomId, name, desc
        await updateRoom(activeRoom.id,  editRoomData.name, editRoomData.description)

        // 로컬 상태 업데이트
        setRoomList((prevRoomList) =>
          prevRoomList.map((room) =>
            room.id === activeRoom.id
              ? {
                  ...room,
                  name: editRoomData.name,
                  description: editRoomData.description,
                }
              : room
          )
        );

        // 현재 활성화된 채팅방 정보도 업데이트
        setActiveRoom((prev) => ({
          ...prev,
          name: editRoomData.name,
          description: editRoomData.description,
        }));

        setIsEditDialogOpen(false);
      } catch (error) {
        console.error("채팅방 정보 업데이트 오류:", error);
        alert("채팅방 정보 업데이트에 실패했습니다.");
      }
    }
  };

  // 나가기 처리 함수
  const handleLeave = useCallback(async () => {
    if (activeRoom) {
      // 채팅방 나가기 로직
      const confirmMessage = "정말로 이 채팅방을 나가시겠습니까?";
      if (window.confirm(confirmMessage)) {
        console.log("채팅방 나가기:", activeRoom.id);
        await leaveRoom(activeRoom.id);
        // 로컬 상태에서 채팅방 제거
        setRoomList((prevRoomList) =>
          prevRoomList.filter((room) => room.id !== activeRoom.id)
        );
        setActiveRoom(null);
      }
    }
  }, [activeRoom, leaveRoom, setActiveRoom, setRoomList]);

  return (
    <>
      {/* 모바일 닫기 버튼 */}
      {toggleSidebar && (
        <button
          className="absolute top-3 right-3 z-50 lg:hidden bg-[#F5F5F5] p-1.5 rounded-lg text-gray-600 hover:text-gray-800"
          onClick={toggleSidebar}
        >
          <X size={18} />
        </button>
      )}

      {/* 채널 리스트 사이드바 - 그리드 레이아웃 사용 */}
      <div className="w-64 bg-white border-r border-[#E0E0E0] h-full grid grid-rows-[auto_auto_1fr_auto]">
        {/* 헤더 영역 */}
        <div className="p-4 bg-white border-b border-[#E0E0E0] flex justify-between items-center">
          <button className="text-left text-gray-800 font-medium">
            채팅방
          </button>
          {activeRoom && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings size={28} className="text-gray-600" />
                </Button>
              </DialogTrigger>
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
                        onClick={handleLeave}
                      >
                        채팅방 나가기
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* 채팅방 목록 헤더 */}
        <div className="mt-4 px-4">
          <div className="flex items-center justify-between w-full mb-2">
            {/*<button*/}
            {/*  className="flex items-center text-gray-600 hover:text-gray-800"*/}
            {/*  onClick={() => setShowDMs(!showDMs)}*/}
            {/*>*/}
            {/*  <span className="text-xs font-semibold">채팅방 목록</span>*/}
            {/*  <ChevronDown*/}
            {/*    size={16}*/}
            {/*    className={cn(*/}
            {/*      "ml-1 transition-transform",*/}
            {/*      showDMs ? "rotate-0" : "-rotate-90"*/}
            {/*    )}*/}
            {/*  />*/}
            {/*</button>*/}
            <div className="flex items-center text-gray-600">
              <span className="text-xs font-semibold">채팅방 목록</span>
            </div>
            <CreateRoomDialog onCreateRoom={handleCreateRoom} />
          </div>
        </div>

        {/* 채팅방 목록 스크롤 영역 */}
        {showDMs && (
          <ScrollArea className="px-2 overflow-auto">
            <div className="space-y-0.5 py-2">
              <button
                className={cn(
                  "flex items-center justify-between w-full p-2 rounded-lg text-left hover:bg-[#F5F5F5]"
                )}
                onClick={() => setActiveRoom(null)}
              >
                <div className="flex items-center">
                  <div className="relative mr-3 bg-[#FFC107] h-8 w-8 rounded-full flex items-center justify-center shadow-sm">
                    <User size={16} className="text-white" />
                  </div>
                  <span className="truncate max-w-[140px] text-gray-800">
                    친구 목록
                  </span>
                </div>
              </button>

              {/* 채팅방 목록 표시 */}
              {roomList.map((room) => {
                const unreadCount = room.unreadCount || 0;
                return (
                  <button
                    key={room.id}
                    className={cn(
                      "flex items-center justify-between w-full p-2 rounded-lg text-left",
                      activeRoom && activeRoom.id === room.id
                        ? "bg-[#F5F5F5]"
                        : "hover:bg-[#F5F5F5]"
                    )}
                    onClick={() => handleRoomSelect(room.id)}
                  >
                    <div className="flex items-center">
                      <div className="relative mr-3 bg-[#FFC107] h-8 w-8 rounded-full flex items-center justify-center shadow-sm">
                        {room.type === RoomType.GROUP_CHAT ? (
                          <Users size={16} className="text-white" />
                        ) : (
                          <MessageSquare size={16} className="text-white" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "truncate max-w-[140px]",
                          activeRoom && activeRoom.id === room.id
                            ? "text-gray-800"
                            : "text-gray-600"
                        )}
                      >
                        {room.type === RoomType.INDIVIDUAL ?  (room.members.find((member) => {
                          return member.userId !== user.userId;
                        })?.nickname || "1:1 대화방") : room.name }
                      </span>
                    </div>

                    {/* 읽지 않은 메시지 수 표시 */}
                    {unreadCount > 0 && (
                      <span className="bg-[#FFC107] text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* 사용자 프로필 영역 */}
        <div className="p-3 bg-white flex items-center border-t border-[#E0E0E0]">
          <Avatar
            className={`${
              user?.image ? "border-none" : `border-[${user?.backgroundColor}]`
            } text-white h-8 w-8 mr-2 border-2 shadow-sm`}
          >
            <AvatarImage src={user?.image || "/placeholder.svg"} />
            <AvatarFallback
              className={`${
                user?.image ? "bg-none" : `bg-[${user?.backgroundColor}]`
              } text-white`}
              style={{
                backgroundColor: user?.image
                  ? "none"
                  : user?.backgroundColor
                  ? user?.backgroundColor
                  : "#FFC107",
              }}
            >
              {user?.nickname ? user.nickname.charAt(0).toUpperCase() : "Me"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate text-gray-800">
              {user?.nickname || "사용자"}
            </div>
            <div className="text-xs text-gray-600 truncate">
              {user?.email || ""}
            </div>
          </div>
        </div>
      </div>

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
    </>
  );
}
