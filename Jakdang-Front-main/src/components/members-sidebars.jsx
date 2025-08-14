"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { userInfoAtom } from "@/jotai/authAtoms";
import {
  activeCategoryAtom,
  activeChannelAtom,
  activeChatRoomAtom,
  activeServerAtom,
  discordChannelsAtom,
} from "@/jotai/chatAtoms";
import { useChatService } from "@/hooks/useChatService";
import { ProfileActionModal } from "@/components/modal/ProfileActionModal";
import { useAtom } from "jotai";
import { Crown, MessageSquarePlus, Shield, Users, X } from "lucide-react";
import { useEffect, useState } from "react";

// 사용자 역할 정의
const UserRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
};

// 사용자 상태 정의
const UserStatus = {
  ONLINE: "ONLINE",
  IDLE: "IDLE",
  DND: "DND", // Do Not Disturb
  OFFLINE: "OFFLINE",
};

export function MembersSidebar({
  toggleMobileMembersSidebar,
  sourceType = "community",
}) {
  const [activeRoom] = useAtom(activeChatRoomAtom);
  const [activeCategory] = useAtom(activeCategoryAtom);
  const [activeChannel] = useAtom(activeChannelAtom);
  const [activeServer] = useAtom(activeServerAtom);
  const [channels] = useAtom(discordChannelsAtom);
  const [currentUser] = useAtom(userInfoAtom);
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // 채팅방 생성 관련 상태
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [roomName, setRoomName] = useState("");

  // 프로필 모달 관련 상태
  const [profileModal, setProfileModal] = useState({
    isOpen: false,
    member: null,
    position: { x: 0, y: 0 }
  });

  // 채팅 서비스
  const { createRoom, inviteToRoomMembers } = useChatService(
    currentUser?.userId
  );

  // 멤버 목록 가져오기 (실제 구현에서는 API 호출)
  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true);
      try {
        // 기본 커뮤니티(홈, 작당 랩스) 확인
        const isDefaultCommunity =
          activeChannel?.name === "홈dd" ||
          activeChannel?.name === "작당 랩스dd";

        console.log("active", activeChannel);
        if (isDefaultCommunity) {
          // 기본 공간은 유저 정보를 제공하지 않음
          setMembers([]);
        } else if (activeRoom?.members && activeRoom.members.length > 0) {
          // 멤버 데이터 형식 변환
          const formattedMembers = activeRoom.members.map((member) => {
            return {
              id: member.userId,
              name: member.nickname || "이름 없음",
              email: `${member.userId}`, // 이메일 정보가 없으므로 임시로 생성
              photoURL: member.image || "/placeholder.svg?height=40&width=40",
              role: member.role || UserRole.MEMBER,
              status: UserStatus.ONLINE, // 상태 정보가 없으므로 기본값으로 설정
              lastSeen: new Date(),
              backgroundColor: member.backgroundColor,
            };
          });

          setMembers(formattedMembers);
        } else if (
          activeChannel?.channelMembers &&
          activeChannel?.channelMembers.length > 0
        ) {
          const formattedMembers = activeChannel?.channelMembers.map(
            (member) => {
              return {
                id: member.userId,
                name: member.nickname || "이름 없음",
                photoURL: member.image || "/placeholder.svg?height=40&width=40",
                role: member.role || UserRole.MEMBER,
                status: UserStatus.ONLINE, // 상태 정보가 없으므로 기본값으로 설정
                lastSeen: new Date(),
              };
            }
          );

          setMembers(formattedMembers);
        } else if (
          activeServer &&
          !activeCategory &&
          !activeChannel &&
          !activeRoom
        ) {
          // activeServer만 선택된 경우: 서버의 모든 멤버 수집
          console.log("activeServer만 선택됨, 서버 멤버 수집:", activeServer);

          // channels 배열에서 activeServer에 해당하는 데이터 찾기
          const serverData = channels?.find(
            (server) => server.id === activeServer
          );

          if (
            serverData?.channelCategories &&
            serverData.channelCategories.length > 0
          ) {
            // 서버의 모든 카테고리에서 멤버들을 수집하고 중복 제거
            const allMembers = new Map(); // userId를 키로 사용하여 중복 제거

            serverData.channelCategories.forEach((category) => {
              if (
                category.channelMembers &&
                category.channelMembers.length > 0
              ) {
                category.channelMembers.forEach((member) => {
                  if (!allMembers.has(member.userId)) {
                    allMembers.set(member.userId, {
                      id: member.userId,
                      name: member.nickname || "이름 없음",
                      photoURL:
                        member.image || "/placeholder.svg?height=40&width=40",
                      role: member.role || UserRole.MEMBER,
                      status: UserStatus.ONLINE,
                      lastSeen: new Date(),
                      backgroundColor: member.backgroundColor,
                    });
                  }
                });
              }
            });

            const uniqueMembers = Array.from(allMembers.values());
            console.log("서버 멤버 수집 완료:", uniqueMembers.length, "명");
            setMembers(uniqueMembers);
          } else {
            console.log("서버에 카테고리나 멤버가 없습니다.");
            setMembers([]);
          }
        } else {
          console.log("멤버 데이터가 없습니다.");
          setMembers([]);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("멤버 목록 가져오기 오류:", error);
        setIsLoading(false);
      }
    };

    if (activeRoom || activeCategory || activeChannel || activeServer) {
      fetchMembers();
    } else {
      setMembers([]);
      setIsLoading(false); // 활성화된 방이나 카테고리, 채널이 없으면 로딩 상태를 false로 설정
    }
  }, [activeRoom, activeChannel, currentUser, activeServer, channels]);

  // 역할별로 멤버 그룹화
  const groupedMembers = members.reduce(
    (acc, member) => {
      // 검색어가 있는 경우 필터링
      if (
        searchQuery &&
        !member.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !member.email.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return acc;
      }

      if (member.role === UserRole.OWNER) {
        acc.owners.push(member);
      } else if (member.role === UserRole.ADMIN) {
        acc.admins.push(member);
      } else {
        if (
          member.status === UserStatus.ONLINE ||
          member.status === UserStatus.IDLE ||
          member.status === UserStatus.DND
        ) {
          acc.onlineMembers.push(member);
        } else {
          acc.offlineMembers.push(member);
        }
      }
      return acc;
    },
    { owners: [], admins: [], onlineMembers: [], offlineMembers: [] }
  );

  // 상태에 따른 색상 반환
  const getStatusColor = (status) => {
    switch (status) {
      case UserStatus.ONLINE:
        return "bg-green-500";
      case UserStatus.IDLE:
        return "bg-yellow-500";
      case UserStatus.DND:
        return "bg-red-500";
      case UserStatus.OFFLINE:
      default:
        return "bg-gray-500";
    }
  };

  // 상태에 따른 텍스트 반환
  const getStatusText = (status) => {
    switch (status) {
      case UserStatus.ONLINE:
        return "참여 중";
      case UserStatus.IDLE:
        return "자리 비움";
      case UserStatus.DND:
        return "방해 금지";
      case UserStatus.OFFLINE:
      default:
        return "오프라인";
    }
  };

  // 역할에 따른 아이콘 반환
  const getRoleIcon = (role) => {
    switch (role) {
      case UserRole.OWNER:
        return <Crown size={14} className="text-yellow-500" />;
      case UserRole.ADMIN:
        return <Shield size={14} className="text-blue-500" />;
      default:
        return null;
    }
  };

  // 역할에 따른 텍스트 반환
  const getRoleText = (role) => {
    switch (role) {
      case UserRole.OWNER:
        return "소유자";
      case UserRole.ADMIN:
        return "관리자";
      default:
        return "멤버";
    }
  };
  // 마지막 접속 시간 포맷
  const formatLastSeen = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  // 멤버 선택/해제 함수
  const handleMemberToggle = (member) => {
    setSelectedMembers((prev) => {
      const isSelected = prev.some((m) => m.id === member.id);
      if (isSelected) {
        return prev.filter((m) => m.id !== member.id);
      } else {
        return [...prev, member];
      }
    });
  };

  // 채팅방 생성 시작
  const handleStartCreateChat = () => {
    setIsCreatingChat(true);
    setSelectedMembers([]);
    setRoomName("");
  };
  // 채팅방 생성 취소
  const handleCancelCreateChat = () => {
    setIsCreatingChat(false);
    setSelectedMembers([]);
    setRoomName("");
  };

  // 멤버 프로필 클릭 핸들러
  const handleMemberClick = (member, event) => {
    // 채팅방 생성 모드가 아닐 때만 프로필 모달 열기
    if (!isCreatingChat) {
      const rect = event.currentTarget.getBoundingClientRect();
      setProfileModal({
        isOpen: true,
        member: member,
        position: {
          x: rect.right + 10, // 멤버 항목 오른쪽에 표시
          y: rect.top
        }
      });
    }
  };

  // 프로필 모달 닫기
  const handleCloseProfileModal = () => {
    setProfileModal({
      isOpen: false,
      member: null,
      position: { x: 0, y: 0 }
    });
  };

  // 채팅방 생성 및 팝업 열기
  const handleCreateChatRoom = async () => {
    if (!roomName.trim() || selectedMembers.length === 0) {
      alert("채팅방 이름을 입력하고 최소 1명의 멤버를 선택해주세요.");
      return;
    }

    try {
      console.log("채팅방 생성 시작:", {
        roomName,
        selectedMembers: selectedMembers.length,
      });

      // 1. 채팅방 생성 (GROUP_CHAT 타입)
      const newRoom = await createRoom(roomName, "GROUP_CHAT");

      if (newRoom && newRoom.id) {
        console.log("채팅방 생성 성공:", newRoom.id);

        // 2. 선택된 멤버들 초대
        const memberRequests = selectedMembers.map((member) => ({
          roomId: newRoom.id,
          userId: currentUser?.userId,
          targetUserId: member.id,
          nickname: member.name,
        }));
        await inviteToRoomMembers(memberRequests);
        console.log("멤버 초대 완료");        // 3. 팝업 채팅창 열기
        const popupUrl = `/popup-chat/room/${newRoom.id}`;
        const popup = window.open(
          popupUrl,
          `chat-${newRoom.id}`,
          "width=512,height=700,resizable=no,scrollbars=yes"
        );

        if (popup) {
          popup.focus();
        } else {
          alert("팝업이 차단되었습니다. 브라우저의 팝업 차단을 해제해주세요.");
        }

        // 4. 상태 초기화
        setIsCreatingChat(false);
        setSelectedMembers([]);
        setRoomName("");
      } else {
        console.error("채팅방 생성 실패");
        alert("채팅방 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("채팅방 생성 오류:", error);
      alert("채팅방 생성 중 오류가 발생했습니다.");
    }
  };
  // 멤버 섹션 렌더링
  const renderMemberSection = (title, members, count) => {
    if (members.length === 0) return null;
    console.log(members);
    return (
      <div className="mb-3 md:mb-4">
        <div className="flex items-center justify-between px-2 md:px-4 py-1 md:py-2">
          <h3 className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase">
            {title} — {count}
          </h3>
        </div>        <div className="space-y-1">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center px-2 md:px-4 py-1.5 md:py-2 hover:bg-[#F5F5F5] rounded-md transition-colors group cursor-pointer"
              onClick={(e) => handleMemberClick(member, e)}
            >              {/* 채팅방 생성 모드일 때 체크박스 표시 */}
              {isCreatingChat && member.id !== currentUser?.userId && (
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedMembers.some((m) => m.id === member.id)}
                    onCheckedChange={() => handleMemberToggle(member)}
                    className="mr-2"
                  />
                </div>
              )}

              <div className="relative">
                <Avatar className="h-6 w-6 md:h-8 md:w-8 border border-[#E0E0E0]">
                  <AvatarImage
                    src={member.photoURL || "/placeholder.svg"}
                    alt={member.name}
                  />
                  <AvatarFallback
                    className="text-white"
                    style={{
                      backgroundColor: member.backgroundColor
                        ? member.backgroundColor
                        : "#FFC107",
                    }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="ml-2 md:ml-3 flex-1 min-w-0">
                <div className="flex items-center">
                  <span className="font-medium text-gray-800 truncate text-xs md:text-sm">
                    {member.name}
                  </span>
                  {getRoleIcon(member.role) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1">
                            {getRoleIcon(member.role)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>{getRoleText(member.role)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {member.id === currentUser?.userId && (
                    <Badge
                      variant="outline"
                      className="ml-2 text-[10px] py-0 h-4 px-1 border-[#0284c7] text-[#0284c7]"
                    >
                      나
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 기본 커뮤니티 확인
  const isDefaultCommunity =
    activeRoom?.name === "홈" ||
    activeRoom?.name === "작당 랩스" ||
    activeCategory?.name === "홈" ||
    activeCategory?.name === "작당 랩스";

  // 소스 타입에 따른 메시지 렌더링 도우미 함수
  const getNoSelectionMessage = () => {
    if (sourceType === "chat") {
      return {
        title: "대화방을 선택해주세요",
        subtitle: "대화방을 선택하면 참여자 목록이 표시됩니다",
      };
    } else {
      return {
        title: "채널을 선택해주세요",
        subtitle: "채널을 선택하면 참여자 목록이 표시됩니다",
      };
    }
  };
  return (
    <div className="w-full lg:w-64 bg-white border-l border-[#E0E0E0] h-full flex flex-col ">
      {" "}
      <div
        className={`${
          (activeRoom || activeCategory) && "p-2"
        } p-2 bg-white border-b border-[#E0E0E0] flex items-center justify-between h-[56px]`}
      >
        <h3 className="font-medium text-gray-60">멤버 목록</h3>
        <div className="flex items-center gap-2">
          {" "}
          {/* 커뮤니티 선택 시 채팅방 생성 버튼 */}
          {console.log("버튼 조건 체크:", {
            activeServer: !!activeServer,
            activeChannel: !!activeChannel,
            activeRoom: !!activeRoom,
            membersLength: members.length,
            shouldShow: members.length > 0,
          })}
          {members.length > 0 && (
            <Button
              size="sm"
              variant={isCreatingChat ? "secondary" : "outline"}
              onClick={
                isCreatingChat ? handleCancelCreateChat : handleStartCreateChat
              }
              className="text-xs"
            >
              {isCreatingChat ? (
                <>
                  <X size={14} className="mr-1" />
                  취소
                </>
              ) : (
                <>
                  <MessageSquarePlus size={14} className="mr-1" />
                  채팅방
                </>
              )}
            </Button>
          )}
          {/* 모바일에서만 보이는 닫기 버튼 */}
          {toggleMobileMembersSidebar && (
            <button
              className="text-gray-600 hover:text-gray-800 bg-[#F5F5F5] p-1.5 rounded-lg lg:hidden"
              onClick={toggleMobileMembersSidebar}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center text-center px-4">
            {/* <div className="w-8 h-8 border-t-2 border-[#0284c7] rounded-full animate-spin mb-3"></div> */}
            <p className="text-gray-600 text-sm font-medium">로딩 중...</p>
            <p className="text-gray-400 text-xs mt-1">잠시만 기다려주세요</p>
          </div>
        </div>
      ) : !activeRoom && !activeCategory && !activeServer ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center text-center px-4">
            {(() => {
              const message = getNoSelectionMessage();
              return (
                <>
                  <p className="text-gray-600 text-sm font-medium">
                    {message.title}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {message.subtitle}
                  </p>
                </>
              );
            })()}
          </div>
        </div>
      ) : isDefaultCommunity ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center text-center px-4">
            <p className="text-gray-600 text-sm font-medium">
              커뮤니티를 선택해주세요
            </p>
            <p className="text-gray-400 text-xs mt-1">
              커뮤니티를 선택하면 참여자 목록이 표시됩니다
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="py-2">
            {/* 채팅방 생성 모드일 때 폼 표시 */}
            {isCreatingChat && (
              <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 mb-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      채팅방 이름
                    </label>
                    <Input
                      type="text"
                      placeholder="채팅방 이름을 입력하세요"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-2">
                      선택된 멤버: {selectedMembers.length}명
                    </p>
                    <Button
                      size="sm"
                      onClick={handleCreateChatRoom}
                      disabled={
                        !roomName.trim() || selectedMembers.length === 0
                      }
                      className="w-full text-xs"
                    >
                      <Users size={14} className="mr-1" />
                      채팅방 생성
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {renderMemberSection(
              "소유자",
              groupedMembers.owners,
              groupedMembers.owners.length
            )}
            {renderMemberSection(
              "관리자",
              groupedMembers.admins,
              groupedMembers.admins.length
            )}
            {renderMemberSection(
              "유저",
              groupedMembers.onlineMembers,
              groupedMembers.onlineMembers.length
            )}
            {renderMemberSection(
              "오프라인",
              groupedMembers.offlineMembers,
              groupedMembers.offlineMembers.length
            )}
          </div>        </ScrollArea>
      )}
      
      {/* 프로필 액션 모달 */}
      <ProfileActionModal
        isOpen={profileModal.isOpen}
        onClose={handleCloseProfileModal}
        member={profileModal.member}
        position={profileModal.position}
      />
    </div>
  );
}
