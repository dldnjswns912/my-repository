"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button.js";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogContent2,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.js";
import { Input } from "@/components/ui/input.js";
import { Label } from "@/components/ui/label.js";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChatService } from "@/hooks/useChatService";
import { useDiscordService } from "@/hooks/useDiscordService";
import { userInfoAtom } from "@/jotai/authAtoms.js";
import {
  activeCategoryAtom,
  activeChannelAtom,
  activeChatRoomAtom,
  activeServerAtom,
  chatRoomsAtom,
  discordChannelsAtom,
  serversAtom,
  unreadCountsAtom,
} from "@/jotai/chatAtoms";
import { cn } from "@/lib/utils";
import { RoomType } from "@/utils/constant/constants";
import { useAtom } from "jotai";
import {
  ChevronDown,
  Hash,
  MessageSquare,
  Plus,
  Settings,
  User,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import CreateRoomDialog from "@/components/create-room-dialog.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import CommunityServerModal from "@/components/modal/community-server-modal";

export function MobileSidebar({ toggleSidebar, selectPage }) {
  const [user] = useAtom(userInfoAtom);
  const [activeRoom, setActiveRoom] = useAtom(activeChatRoomAtom);
  const [activeCategory, setActiveCategory] = useAtom(activeCategoryAtom);
  const [activeChannel, setActiveChannel] = useAtom(activeChannelAtom);
  const [servers] = useAtom(serversAtom);
  const [channels] = useAtom(discordChannelsAtom);
  const [unreadCounts] = useAtom(unreadCountsAtom);
  const [showChannels, setShowChannels] = useState(true);
  const [showDMs, setShowDMs] = useState(true);
  const [activeServer, setActiveServer] = useAtom(activeServerAtom);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [roomList, setRoomList] = useAtom(chatRoomsAtom);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState(RoomType.GROUP_CHAT);
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false);
  const [showCreateChannelDialog, setShowCreateChannelDialog] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] =
    useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [inviteServerName, setInviteServerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreateServerDialog, setShowCreateServerDialog] = useState(false);

  // 채팅방 수정 상태
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editRoomData, setEditRoomData] = useState({
    name: "",
    description: "",
  });

  const { fetchPost } = useAxiosQuery();

  const {
    selectRoom,
    createRoom,
    fetchRoomList,
    leaveRoom,
    inviteToRoomMembers,
    updateRoom,
  } = useChatService(user?.userId);

  const activeServerData = channels.find(
    (server) => server.id === activeServer
  );

  const {
    selectChannel,
    createChannel,
    createCategory,
    selectCategory,
    fetchDiscordData,
    fetchDiscordChannelAll,
    leaveDiscordServer,
  } = useDiscordService(user?.userId);

  useEffect(() => {
    // 최초에 높이 계산
    const updateHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    updateHeight(); // 처음 실행

    // 화면 크기 변경 시 다시 계산
    window.addEventListener("resize", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (user?.userId && isMounted && !window.sidebarDataLoaded) {
        window.sidebarDataLoaded = true;
        await fetchRoomList();
        await fetchDiscordData();
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [user?.userId, fetchRoomList, fetchDiscordData]);

  useEffect(() => {
    if (servers?.length > 0 && activeServer === null) {
      setActiveServer(servers[0].id);
    }
  }, [servers, activeServer, setActiveServer]);

  useEffect(() => {
    if (activeTab === "join") {
      const fetchChannels = async () => {
        try {
          const response = await fetchDiscordChannelAll();
          if (response) {
            console.log("채널 목록:", response);
          }
        } catch (error) {
          console.error("채널 목록 가져오기 실패:", error);
        }
      };
      fetchChannels();
    }
  }, [activeTab, fetchDiscordChannelAll]);

  const handleRoomSelect = (roomId) => {
    if (activeServer !== "home") {
      setActiveServer("home");
    }
    if (activeRoom && activeRoom.id === roomId) return;
    setActiveCategory(null);
    selectRoom(roomId);
    // 읽지 않은 메시지 수 초기화
    const updatedRoomList = roomList.map((room) =>
      room.id === roomId ? { ...room, unreadCount: 0 } : room
    );
    setRoomList(updatedRoomList);
    toggleSidebar();
  };

  const handleServerSelect = (serverId) => {
    if (activeServer === serverId) return;
    setActiveServer(serverId);
    if (serverId === "home") {
      setActiveChannel(null);
      setActiveCategory(null);
    } else {
      setActiveRoom(null);
      selectChannel(serverId);
    }
  };

  const handleCategorySelect = (category) => {
    setActiveRoom(null);
    selectCategory(category);
    // 읽지 않은 메시지 수 초기화
    category.unreadCount = 0;
    toggleSidebar();
  };

  const handleCreateServer = async (name, desc, imageInfo) => {
    if (name.trim()) {
      try {
        setLoading(true);
        await createChannel(name, desc, imageInfo);
        setNewChannelName("");
        setNewChannelDesc("");
        setShowCreateChannelDialog(false);
        setShowCreateServerDialog(false);
        await fetchDiscordData();
      } catch (error) {
        console.error("서버 생성 실패:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreateCategory = async () => {
    if (newCategoryName.trim() && activeServer !== "home") {
      await createCategory(newCategoryName, newCategoryDesc, activeServer);
      setNewCategoryName("");
      setNewCategoryDesc("");
      setShowCreateCategoryDialog(false);
    }
  };

  const handleCreateRoom = async (name, type, members) => {
    if (!name.trim()) return;

    // 채팅방 생성 및 멤버 초대 로직
    const roomId = await createRoom(name, type);

    // 선택된 멤버가 있으면 초대 로직 실행
    if (members && members.length > 0 && roomId) {
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
  };

  // 서버 가입 처리 함수
  const handleJoinServer = async (inviteCode) => {
    if (inviteCode.trim()) {
      try {
        setLoading(true);
        const response = await fetchPost(`/chat/discord/join/server`, null, {
          serverId: inviteCode,
        });

        console.log(response);
        console.log("서버 가입 시도:", inviteCode);
        setInviteServerName("");
        setShowCreateServerDialog(false);
        await fetchDiscordData();
      } catch (error) {
        console.error("서버 가입 실패:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // 채팅방 정보 수정 처리
  const handleUpdateRoom = async () => {
    if (activeRoom && editRoomData.name.trim()) {
      try {
        // 채팅방 정보 업데이트 API 호출
        await updateRoom(activeRoom.id, {
          name: editRoomData.name,
          description: editRoomData.description,
        });

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
    } else if (activeServer && activeServer !== "home") {
      // 커뮤니티 나가기 로직
      const confirmMessage = "정말로 이 커뮤니티를 나가시겠습니까?";
      if (window.confirm(confirmMessage)) {
        console.log("커뮤니티 나가기:", activeServer);
        await leaveDiscordServer(activeServer);
        setActiveServer(
          servers.length > 1
            ? servers.find((s) => s.id !== activeServer)?.id
            : null
        );
        setActiveCategory(null);
        setActiveChannel(null);
      }
    }
  }, [
    activeRoom,
    activeServer,
    leaveRoom,
    leaveDiscordServer,
    setActiveRoom,
    setRoomList,
    setActiveServer,
    setActiveCategory,
    setActiveChannel,
    servers,
  ]);

  // 서버의 모든 카테고리의 안읽은 메시지 수 합계 계산 함수
  const getServerTotalUnreadCount = (serverId) => {
    if (!serverId || serverId === "home") return 0;

    const serverData = channels.find((channel) => channel.id === serverId);
    if (!serverData || !serverData.channelCategories) return 0;

    return serverData.channelCategories.reduce(
      (sum, category) => sum + (category.unreadCount || 0),
      0
    );
  };

  // 안읽은 메시지 수 포맷팅 (99+ 처리)
  const formatUnreadCount = (count) => {
    if (!count || count <= 0) return null;
    return count > 99 ? "99+" : count;
  };

  return (
    <div className="flex h-full">
      {toggleSidebar && (
        <button
          className="absolute top-0 right-0 z-50 lg:hidden p-1.5 rounded-lg text-gray-600"
          onClick={toggleSidebar}
        >
          <X size={15} />
        </button>
      )}
      {/* 서버 리스트 사이드바 */}
      {selectPage !== "chat" && (
        <div className="w-[72px] bg-white flex flex-col items-center space-y-2 border-r border-[#E0E0E0] h-full">          <div
            className="w-full overflow-y-auto scrollbar-hide"
            style={{ height: `${viewportHeight - 132}px` }}
          >
            <div className="flex flex-col items-center space-y-2 py-2 gap-2 h-auto">
              {servers.map((server) => {
                // 서버의 모든 카테고리의 안읽은 메시지 수 합계 계산
                const totalUnreadCount = getServerTotalUnreadCount(server.id);

                return (
                  <TooltipProvider key={server.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <button
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all shadow-sm",
                              activeServer === server.id
                                ? "bg-[#FFC107] text-white"
                                : "bg-[#F5F5F5] text-gray-600 hover:bg-[#FFC107]"
                            )}
                            onClick={() => handleServerSelect(server.id)}
                          >
                            {server.icon}
                          </button>
                          {/* 안읽은 메시지 수 배지 */}
                          {totalUnreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                              {formatUnreadCount(totalUnreadCount)}
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {server.name}
                        {totalUnreadCount > 0 && ` (${totalUnreadCount})`}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="w-12 h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-gray-600 hover:bg-[#FFC107] hover:text-white transition-all shadow-sm"
                      onClick={() => setShowCreateServerDialog(true)}
                    >
                      <Plus size={24} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">커뮤니티 추가</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* 커뮤니티 생성/가입 모달 */}
              <CommunityServerModal
                open={showCreateServerDialog}
                onOpenChange={setShowCreateServerDialog}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onCreate={handleCreateServer}
                onJoin={handleJoinServer}
                loading={loading}
                inviteServerName={inviteServerName}
                servers={servers}              />
            </div>
          </div>
        </div>
      )}

      {/* 채널 리스트 사이드바 */}
      <div className="w-66 bg-white flex flex-col border-r border-[#E0E0E0] h-full">
        <div className="flex flex-col h-auto">
          <div className="p-4 shadow-sm bg-white border-b border-[#E0E0E0] flex justify-between items-center">
            <button className="w-full text-left text-gray-800 font-medium">
              {selectPage === "chat" ? "채팅방" : "커뮤니티"}
            </button>

            {/* 설정 버튼 (채팅방이나 서버가 선택된 경우에만 표시) */}
            {/*{(activeRoom || (activeServer && activeServer !== "home")) && (*/}
            {activeRoom && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings size={28} className="text-gray-600" />
                  </Button>
                </DialogTrigger>
                <DialogContent2 className="sm:max-w-[425px]">
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
                        <Button
                          className="w-full"
                          onClick={handleOpenEditDialog}
                        >
                          채팅방 정보 수정
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="leave" className="py-4">
                      <div className="space-y-4">
                        <p className="text-sm text-gray-500">
                          채팅방을 나가면 모든 대화 내용에 접근할 수 없게
                          됩니다. 정말로 나가시겠습니까?
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
                </DialogContent2>
              </Dialog>
            )}
          </div>

          <div className="mt-4 px-4">
            <div className="flex items-center justify-between w-full mb-2">
              {/*<button*/}
              {/*  className="flex items-center text-gray-600 hover:text-gray-800"*/}
              {/*  onClick={() => setShowDMs(!showDMs)}*/}
              {/*>*/}
              {/*  <span className="text-xs font-semibold">*/}
              {/*    {selectPage === "chat" || activeServer === "home"*/}
              {/*      ? "채팅방 목록"*/}
              {/*      : "채널 목록"}*/}
              {/*  </span>*/}
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
              {selectPage === "chat" || activeServer === "home" ? (
                <CreateRoomDialog onCreateRoom={handleCreateRoom} />
              ) : (
                activeServer !== "home" && (
                  <Dialog
                    open={showCreateCategoryDialog}
                    onOpenChange={setShowCreateCategoryDialog}
                  >
                    <DialogTrigger asChild>
                      <button className="text-gray-600 hover:text-[#FFC107]">
                        <Plus size={16} />
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>새 채널 만들기</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="category-name" className="text-right">
                            이름
                          </Label>
                          <Input
                            id="category-name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label
                            htmlFor="category-description"
                            className="text-right"
                          >
                            설명
                          </Label>
                          <Input
                            id="category-description"
                            value={newCategoryDesc}
                            onChange={(e) => setNewCategoryDesc(e.target.value)}
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">취소</Button>
                        </DialogClose>
                        <Button onClick={handleCreateCategory}>생성</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )
              )}
            </div>
          </div>

          {showDMs && (
            <div className="w-full h-[calc(90vh-222px)] overflow-y-auto scrollbar-hide">
              <div className="space-y-0.5 py-2">
                {/* 채팅 페이지 또는 홈 서버 선택 시 채팅방 목록 표시 */}
                {(selectPage === "chat" || activeServer === "home") && (
                  <>
                    <button
                      className={cn(
                        "flex items-center justify-between w-full p-2 rounded-lg text-left hover:bg-[#F5F5F5]"
                      )}
                      onClick={() => {
                        setActiveRoom(null);
                        toggleSidebar();
                      }}
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
                                <MessageSquare
                                  size={16}
                                  className="text-white"
                                />
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
                              {room.type === RoomType.INDIVIDUAL
                                ? room.members.find((member) => {
                                    return member.userId !== user.userId;
                                  })?.nickname || "1:1 대화방"
                                : room.name}
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
                  </>
                )}

                {/* 서버 선택 시 채널 목록 표시 */}
                {selectPage !== "chat" &&
                  activeServer !== "home" &&
                  activeServerData && (
                    <>
                      {/* 서버의 채널 카테고리 목록 표시 */}
                      {activeServerData.channelCategories &&
                        activeServerData.channelCategories.map((category) => (
                          <button
                            key={category.id}
                            className={cn(
                              "flex items-center w-full p-2 rounded-lg text-left relative",
                              activeCategory &&
                                activeCategory.id === category.id
                                ? "bg-[#F5F5F5]"
                                : "hover:bg-[#F5F5F5]"
                            )}
                            onClick={() => handleCategorySelect(category)}
                          >
                            <Hash size={18} className="mr-2 text-[#FFC107]" />
                            <span
                              className={cn(
                                "truncate max-w-[160px]",
                                activeCategory &&
                                  activeCategory.id === category.id
                                  ? "text-gray-800 font-medium"
                                  : "text-gray-600"
                              )}
                            >
                              {category.name}
                            </span>

                            {/* 채널별 안읽은 메시지 수 표시 */}
                            {category.unreadCount > 0 && (
                              <div className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                {formatUnreadCount(category.unreadCount)}
                              </div>
                            )}
                          </button>
                        ))}

                      {/* 채널이 없는 경우 안내 메시지 */}
                      {(!activeServerData.channelCategories ||
                        activeServerData.channelCategories.length === 0) && (
                        <div className="text-center py-4 text-gray-400 text-sm">
                          채널이 없습니다. 새 채널을 만들어보세요!
                        </div>                      )}
                    </>
                  )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto p-3 bg-white flex items-center border-t border-[#E0E0E0]">
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
                className="resize-none"
                id="edit-room-description"
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
