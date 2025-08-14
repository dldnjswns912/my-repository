"use client";

import { useState } from "react";

import ChannelSettingDialog from "@/components/chat/CommunityChannelSettingDialog";
import CommunitySettingDialog from "@/components/chat/CommunitySettingDialog";
import CommunityServerModal from "@/components/modal/community-server-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import { useDiscordService } from "@/hooks/useDiscordService";
import { userInfoAtom } from "@/jotai/authAtoms";
import {
  activeCategoryAtom,
  activeChannelAtom,
  activeServerAtom,
  discordChannelsAtom,
  messagesAtom,
  serversAtom,
} from "@/jotai/chatAtoms";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import { Hash, Plus, X } from "lucide-react";
import { useEffect } from "react";

export function Sidebar({ toggleSidebar }) {
  const [showChannels, setShowChannels] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] =
    useState(false);
  const [showCreateServerDialog, setShowCreateServerDialog] = useState(false);
  const [activeServer, setActiveServer] = useAtom(activeServerAtom);
  const [activeTab, setActiveTab] = useState("create");
  const [loading, setLoading] = useState(false);

  const [user] = useAtom(userInfoAtom);
  const [activeCategory, setActiveCategory] = useAtom(activeCategoryAtom);
  const [servers] = useAtom(serversAtom);
  const [channels] = useAtom(discordChannelsAtom);
  const [activeChannel, setActiveChannel] = useAtom(activeChannelAtom);
  const { fetchPost, fetchGet } = useAxiosQuery();
  const [_, setMessages] = useAtom(messagesAtom);

  const {
    selectChannel,
    createChannel,
    createCategory,
    selectCategory,
    fetchDiscordData,
    leaveDiscordServer,
    deleteCategory,
    deleteChannel,
    updateChannel,
    updateCategory,
  } = useDiscordService(user?.userId);

  const activeServerData = channels.find(
    (server) => server.id === activeServer
  );

  // ✅ 서버 리스트가 준비된 경우, 한 번만 홈 설정
  useEffect(() => {
    if (servers?.length > 0 && activeServer === null) {
      setActiveServer(servers[0].id);
    }
  }, [servers, activeServer, setActiveServer]);

  // ✅ 사용자 로그인 시 데이터 초기 로드 (루프 없음)
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (user?.userId && isMounted && !window.sidebarDataLoaded) {
        window.sidebarDataLoaded = true;
        await fetchDiscordData();
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [user?.userId, fetchDiscordData]);

  const handleServerSelect = (serverId) => {
    if (activeServer === serverId) return; // 이미 선택된 서버는 무시
    setActiveServer(serverId);
    setActiveCategory(null);
    setMessages([]);
    selectChannel(serverId);
  };

  const handleCategorySelect = (category) => {
    selectCategory(category);
    category.unreadCount = 0;
    setMessages([]);
    // 모바일에서 채널 선택 시 사이드바 닫기
    if (toggleSidebar && window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  // 서버 생성 처리 함수
  const handleCreateServer = async (name, desc, imageInfo) => {
    if (name.trim()) {
      try {
        setLoading(true);
        await createChannel(name, desc, imageInfo);
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
    if (newCategoryName.trim() && activeServer) {
      await createCategory(newCategoryName, newCategoryDesc, activeServer);
      setNewCategoryName("");
      setNewCategoryDesc("");
      setShowCreateCategoryDialog(false);
    }
  };

  // 서버 가입 처리 함수
  const handleJoinServer = async (serverId) => {
    if (serverId) {
      try {
        setLoading(true);
        const response = await fetchPost(`/chat/discord/join/server`, null, {
          serverId: serverId,
        });

        console.log(response);
        console.log("서버 가입 시도:", serverId);
        setShowCreateServerDialog(false);
        await fetchDiscordData();
      } catch (error) {
        console.error("서버 가입 실패:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // 나가기 처리 함수
  const handleLeave = async () => {
    if (activeServer) {
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
  };

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

  const handleDeleteCategory = async (categoryId, channelId) => {
    try {
      setLoading(true);
      await deleteCategory(categoryId, channelId);

      // 삭제된 카테고리가 현재 활성화된 카테고리인 경우 선택 해제
      if (activeCategory && activeCategory.id === categoryId) {
        setActiveCategory(null);
      }

      await fetchDiscordData();
    } catch (error) {
      console.error("채널 삭제 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChannel = async (channelId) => {
    try {
      setLoading(true);
      await deleteChannel(channelId);

      if (activeChannel && activeChannel.id === channelId) {
        setActiveChannel(null);
      }

      await fetchDiscordData();
    } catch (error) {
      console.error("채널 삭제 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 안읽은 메시지 수 포맷팅 (99+ 처리)
  const formatUnreadCount = (count) => {
    if (!count || count <= 0) return null;
    return count > 99 ? "99+" : count;
  };

  console.log("activeServer", activeChannel);
  console.log("activeCategory - select", activeCategory);

  console.log("servers", servers);

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
      )}{" "}
      {/* 서버 리스트 사이드바 */}
      <div className="w-[72px] bg-white flex flex-col items-center border-r border-[#E0E0E0] h-full">
        {/* 헤더와 높이를 맞추기 위한 상단 여백 */}
        <div className="h-[55px] w-full border-b border-[#E0E0E0] bg-white"></div>        <div className="w-full flex-1 overflow-y-auto scrollbar-hide">
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
                            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all shadow-sm mx-auto m-0",
                            activeServer === server.id
                              ? "bg-[#FFC107] text-white"
                              : "bg-[#F5F5F5] text-gray-600 hover:bg-[#FFC107]"
                          )}
                          onClick={() => handleServerSelect(server.id)}
                        >
                          {server.imageRequest ? (
                            <img
                              src={server.imageRequest.imageUrl}
                              className="rounded-xl w-10 h-10"
                            ></img>
                          ) : (
                            server.icon
                          )}
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
                    className="w-12 h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-gray-600 hover:bg-[#FFC107] hover:text-white transition-all shadow-sm mx-auto"
                    onClick={() => setShowCreateServerDialog(true)}
                  >
                    <Plus size={24} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">커뮤니티 추가하기</TooltipContent>
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
              servers={servers}
            />
          </div>
        </div>
      </div>
      {/* 채널 리스트 사이드바 */}
      <div className="w-64 bg-white flex flex-col border-r border-[#E0E0E0] h-full">
        {/* 서버 채널 리스트 */}
        <div className="flex flex-col h-full">
          {" "}
          <div
            className={`h-[55px] ${
              activeCategory ? "px-2" : "px-4"
            } bg-white border-b border-[#E0E0E0] flex justify-between items-center`}
          >
            <button className="text-left text-gray-800 font-medium">
              {servers.find((s) => s.id === activeServer)?.name || "커뮤니티"}
            </button>

            {activeServer !== "home" && (
              <CommunitySettingDialog
                handleLeave={handleLeave}
                communityData={servers.find((s) => s.id === activeServer)}
                updateChannel={updateChannel}
              />
              // <Dialog>
              //   <DialogTrigger asChild>
              //     <Button variant="ghost" size="icon" className="h-8 w-8">
              //       <Settings size={18} className="text-gray-600" />
              //     </Button>
              //   </DialogTrigger>
              //   <DialogContent2 className="sm:max-w-[425px]">
              //     <DialogHeader>
              //       <DialogTitle>커뮤니티 설정</DialogTitle>
              //     </DialogHeader>
              //     <div className="py-4">
              //       <Button
              //         variant="destructive"
              //         className="w-full"
              //         onClick={handleLeave}
              //       >
              //         커뮤니티 나가기
              //       </Button>
              //     </div>
              //   </DialogContent2>
              // </Dialog>
            )}
          </div>
          <div className="mt-4 px-4">
            <div className="flex items-center justify-between w-full mb-2">
              {/*<button*/}
              {/*  className="flex items-center text-gray-600 hover:text-gray-800"*/}
              {/*  onClick={() => setShowChannels(!showChannels)}*/}
              {/*>*/}
              {/*  <span className="text-xs font-semibold">채널 목록</span>*/}
              {/*  <ChevronDown*/}
              {/*    size={16}*/}
              {/*    className={cn(*/}
              {/*      "transition-transform",*/}
              {/*      showChannels ? "rotate-0" : "-rotate-90"*/}
              {/*    )}*/}
              {/*  />*/}
              {/*</button>*/}
              <div className="flex items-center text-gray-600">
                <span className="text-xs font-semibold">채널 목록</span>
              </div>
              {activeServer !== "home" && (
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
              )}
            </div>
          </div>          {showChannels && (
            <div
              className="flex-1 px-2 overflow-y-auto scrollbar-hide"
              style={{ height: "calc(100vh - 12rem)" }}
            >
              <div className="space-y-0.5 py-2">
                {/* 서버의 채널 카테고리 목록 표시 */}
                {activeServerData &&
                  activeServerData.channelCategories &&
                  activeServerData.channelCategories.map((category) => (
                    <button
                      key={category.id}
                      className={cn(
                        "flex items-center w-full p-2 rounded-lg text-left relative",
                        activeCategory && activeCategory.id === category.id
                          ? "bg-[#F5F5F5]"
                          : "hover:bg-[#F5F5F5]"
                      )}
                      onClick={() => handleCategorySelect(category)}
                    >
                      <Hash size={18} className="mr-2 text-[#FFC107]" />
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={cn(
                            "truncate max-w-[160px]",
                            activeCategory && activeCategory.id === category.id
                              ? "text-gray-800 font-medium"
                              : "text-gray-600"
                          )}
                        >
                          {category.name}
                        </span>

                        {activeChannel &&
                          activeChannel.adminId === user?.userId && (
                            <ChannelSettingDialog
                              handleDeleteCategory={deleteCategory}
                              handleUpdateCategory={updateCategory}
                              isAdmin={user?.userId === activeChannel.adminId}
                              category={category}
                            />
                            // <Dialog>
                            //   <DialogTrigger asChild>
                            //     <span
                            //       className="ml-2"
                            //       onClick={(e) => e.stopPropagation()}
                            //     >
                            //       <MoreHorizontal className="w-[18px] h-[18px] text-gray-500 hover:text-gray-700" />
                            //     </span>
                            //   </DialogTrigger>
                            //   <DialogContent className="sm:max-w-[425px]">
                            //     <DialogHeader>
                            //       <DialogTitle>채널 설정</DialogTitle>
                            //     </DialogHeader>
                            //     <div className="py-4">
                            //       <div className="mb-4">
                            //         <h3 className="text-sm font-medium mb-2">
                            //           채널 정보
                            //         </h3>
                            //         <p className="text-sm text-gray-500">
                            //           채널 이름: {category.name}
                            //         </p>
                            //         {category.description && (
                            //           <p className="text-sm text-gray-500 mt-1">
                            //             설명: {category.description}
                            //           </p>
                            //         )}
                            //       </div>
                            //       <Button
                            //         variant="destructive"
                            //         className="w-full flex items-center justify-center gap-2"
                            //         onClick={() => {
                            //           if (
                            //             window.confirm(
                            //               "정말로 이 채널을 삭제하시겠습니까?"
                            //             )
                            //           ) {
                            //             handleDeleteCategory(
                            //               category.id,
                            //               category.channelId
                            //             );
                            //           }
                            //         }}
                            //       >
                            //         <Trash2 size={16} />
                            //         채널 삭제
                            //       </Button>
                            //     </div>
                            //   </DialogContent>
                            // </Dialog>
                          )}
                      </div>

                      {/* 채널별 안읽은 메시지 수 표시 */}
                      {category.unreadCount > 0 && (
                        <div className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {formatUnreadCount(category.unreadCount)}
                        </div>
                      )}
                    </button>
                  ))}

                {/* 채널이 없는 경우 안내 메시지 */}
                {(!activeServerData ||
                  !activeServerData.channelCategories ||
                  activeServerData.channelCategories.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-6 px-4">
                    <h3 className="text-gray-700 font-medium text-sm mb-1">
                      커뮤니티를 선택하세요
                    </h3>
                    <p className="text-gray-500 text-xs text-center mb-4">
                      커뮤니티를 선택하면 채널과 게시글을 볼 수 있습니다.
                    </p>

                    {activeServer !== "home" && (
                      <button
                        onClick={() => setShowCreateCategoryDialog(true)}
                        className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors px-3 py-1.5 rounded-md flex items-center"
                      >
                        <Plus size={14} className="mr-1" />새 채널 만들기
                      </button>
                    )}
                  </div>                )}
              </div>
            </div>
          )}
        </div>

        {/* 사용자 프로필 영역 */}
        <div className="mt-auto p-4 bg-white flex items-center border-t border-[#E0E0E0]">
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
    </>
  );
}
