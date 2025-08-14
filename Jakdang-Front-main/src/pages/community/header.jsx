"use client";
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
import { activeCategoryAtom, activeChannelAtom } from "@/jotai/chatAtoms";
import { useAtom, useAtomValue } from "jotai";
import {
  Hash,
  Home,
  Info,
  Menu,
  MessageSquare,
  Pin,
  Users,
  ImageIcon,
} from "lucide-react";
import { useState } from "react";

export function Header({
  setFixedMessageModalOpen,
  toggleMobileMembersSidebar,
  isMobileMembersSidebarOpen,
  toggleMobileSidebar,
}) {
  const [activeChannel] = useAtom(activeChannelAtom);
  const [activeCategory] = useAtom(activeCategoryAtom);
  const [isInviteChatDialogOpen, setIsInviteChatDialogOpen] = useState(false);
  const [channelInfoModalOpen, setChannelInfoModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const { fetchPost } = useAxiosQuery();
  const { fetchRoomList } = useChatService();

  const user = useAtomValue(userInfoAtom);
  const isAdmin = activeChannel?.adminId === user.userId;  // 헤더 왼쪽에 메뉴 버튼 추가
  const renderMenuButton = () => (
    <button
      className="text-gray-600 hover:text-gray-800 pr-2 lg:hidden flex items-center justify-center"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof toggleMobileSidebar === 'function') {
          toggleMobileSidebar();
        }
      }}
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
            className="text-gray-600 hover:text-gray-800 bg-[#F5F5F5] p-1.5 rounded-lg block lg:hidden"
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
    // 채팅방이나 채널이 선택되지 않았으면 네비게이션을 표시하지 않음
    if (!activeCategory) return null;

    return (
      <div className="flex items-center space-x-2 lg:hidden">
        <button
          onClick={toggleMobileSidebar}
          className={`text-gray-600 hover:text-gray-800 bg-[#F5F5F5] p-1.5 rounded-lg ${
            isMobileMembersSidebarOpen ? "" : "text-[#0284c7]"
          }`}
        >
          <Home size={18} />
        </button>

        <button
          className={`text-gray-600 hover:text-gray-800 bg-[#F5F5F5] p-1.5 rounded-lg ${
            !isMobileMembersSidebarOpen ? "text-[#0284c7]" : ""
          }`}
          onClick={() => {
            if (isMobileMembersSidebarOpen) toggleMobileMembersSidebar();
          }}
        >
          <MessageSquare size={18} />
        </button>
        {renderMemberToggleButton()}
      </div>
    );
  };
  // 헤더에 표시할 내용이 없는 경우
  if (!activeCategory && !activeChannel) {
    return (
      <div className="h-[57px] border-b border-[#E0E0E0] flex items-center px-4 shadow-sm bg-white justify-between relative z-30">
        <div className="flex items-center">
          {renderMenuButton()}
          <span className="font-bold text-gray-800 ml-2">커뮤니티</span>
          <div className="ml-2 text-gray-600 text-sm">
            커뮤니티를 선택하세요
          </div>
        </div>
        {renderMobileNavigation()}
      </div>
    );
  }
  // 서버만 선택되고 채널은 선택되지 않은 경우
  if (activeChannel && !activeCategory) {
    return (
      <div className="h-14 border-b border-[#E0E0E0] flex items-center px-4 shadow-sm bg-white justify-between relative z-30">
        <div className="flex items-center">
          {renderMenuButton()}
          <span className="font-bold text-gray-800 ml-2">
            {activeChannel.name}
          </span>
          <div className="ml-2 text-gray-600 text-sm">
            {activeChannel.description || "커뮤니티를 선택하세요"}
          </div>
        </div>
        {renderMobileNavigation()}
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
    <div>
      <div className="border-b border-[#E0E0E0] flex items-center p-3 shadow-sm bg-white justify-between h-[56px] relative z-30">
        <div className="flex items-center flex-1 min-w-0 p-0">
          {renderMenuButton()}

          {activeCategory ? (
            // 디스코드 채널(카테고리) UI
            <>
              <Hash size={18} className="mr-2 text-[#0284c7]" />
              <span className="font-bold text-gray-800 text-base">
                {activeCategory.name}
              </span>
              <div className="ml-2 text-gray-600 text-sm truncate">
                {activeCategory.description || "채널 주제를 설정하세요"}
              </div>
            </>
          ) : null}
        </div>

        <div className="flex items-center space-x-2">
          {activeCategory ? (
            // 디스코드 채널(카테고리) 액션 버튼
            <>
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

              {isAdmin && (
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

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="text-gray-600 hover:text-gray-800 bg-[#F5F5F5] p-1.5 rounded-lg"
                      onClick={() => setChannelInfoModalOpen((prev) => !prev)}
                    >
                      <Info size={18} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>채널 정보</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          ) : null}

          {/* 모바일 네비게이션 버튼 */}
          {/* {renderMobileNavigation()} */}
          {renderMemberToggleButton()}
        </div>
      </div>

      {/* 이미지 및 파일 모아보기 모달 */}
      <MediaFilesModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        roomId={activeCategory?.id}
      />

      {/* 채널 정보 모달 */}
      {channelInfoModalOpen && activeCategory && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">채널 정보</h3>
              <button
                onClick={() => setChannelInfoModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-x"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">채널 이름</p>
                <p className="text-base">{activeCategory.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">설명</p>
                <p className="text-base">
                  {activeCategory.description || "설명이 없습니다."}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">생성일</p>
                <p className="text-base">
                  {new Date(activeCategory.createdAt).toLocaleDateString()}
                </p>
              </div>
              {activeCategory.adminId && (
                <div>
                  <p className="text-sm font-medium text-gray-500">관리자</p>
                  <p className="text-base">
                    {activeCategory.adminNickname || "알 수 없음"}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setChannelInfoModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
