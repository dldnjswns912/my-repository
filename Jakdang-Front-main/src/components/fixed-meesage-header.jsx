"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import { useChatService } from "@/hooks/useChatService";
import { useDiscordService } from "@/hooks/useDiscordService";
import {
  activeCategoryAtom,
  activeChannelAtom,
  activeChatRoomAtom,
  discordChannelsAtom,
} from "@/jotai/chatAtoms";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import { Pin } from "lucide-react";
import { useEffect, useState } from "react";

// 모달 상태를 props로 받도록 수정
export function FixedMessageHeader({ isOpen, setIsOpen, isPopup = false }) {
  const [activeRoom, setActiveRoom] = useAtom(activeChatRoomAtom);
  const [activeChannel] = useAtom(activeChannelAtom);
  const [activeCategory, setActiveCategory] = useAtom(activeCategoryAtom);
  const [message, setMessage] = useState("");
  const [fixedMessages, setFixedMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMessagesLoaded, setIsMessagesLoaded] = useState(false);
  const { fetchPost } = useAxiosQuery();
  const { toast } = useToast();
  const { sendMessage } = useChatService();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { getChannel } = useDiscordService();
  const [discordChannels, setDiscordChannels] = useAtom(discordChannelsAtom);

  const MAX_MESSAGE_LENGTH = 50; // 최대 글자수 설정

  // 팝업 모드 감지 - props 또는 URL로 판단
  const isPopupMode = isPopup || window.location.pathname.includes('/popup-chat');

  // console.log(activeCategory);
  // console.log(activeRoom);
  // console.log(discordChannels);
  // 고정 메시지 불러오기 (컴포넌트 마운트 시 및 활성 채팅방/채널 변경 시)
  useEffect(() => {
    if (activeRoom?.id || activeCategory?.id) {
      setIsMessagesLoaded(false);
      loadFixedMessages();
    }
  }, [activeRoom?.id, activeCategory?.id]);

  // 고정 메시지 불러오기 함수
  const loadFixedMessages = async () => {
    try {
      // 실제 API 호출이 있다면 여기서 처리
      // const response = await fetchGet(`/chat/notice?roomId=${activeRoom?.id || activeCategory?.id}&categoryCheck=${!!activeCategory?.id}`);
      // const noticeData = response.data;      // 현재는 mock 데이터 사용
      const noticeContent =
        activeRoom?.notice ||
        activeCategory?.channelNotice ||
        "고정된 메시지가 없습니다.";

      // 빈 공지사항이 아닌 경우에만 메시지 배열에 추가
      if (noticeContent && noticeContent !== "고정된 메시지가 없습니다.") {
        setFixedMessages([
          {
            id: "1",
            content: noticeContent,
            createdAt: new Date().toISOString(),
            author: {
              id: "admin",
              name: "관리자",
            },
          },
        ]);
      } else {
        setFixedMessages([]);
      }
      setIsMessagesLoaded(true);
    } catch (error) {
      console.error("고정 메시지 로드 오류:", error);
      setFixedMessages([]);
      setIsMessagesLoaded(true);
    }
  };

  // 고정 메시지 추가 함수
  const handleAddFixedMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);

    try {
      const reqData = {
        roomId: activeRoom?.id || activeCategory?.id,
        notice: message,
        categoryCheck: activeCategory?.id ? true : false,
      };
      console.log(reqData);
      const res = await fetchPost("/chat/notice", reqData);
      console.log("resdata", res.response?.data);
      // 서버 응답에서 받은 공지사항으로 상태 업데이트
      const updatedNotice = res.response?.data?.notice || message;

      // 활성 채팅방 또는 카테고리 상태 업데이트
      if (activeRoom) {
        setActiveRoom((prev) => ({
          ...prev,
          notice: updatedNotice,
        }));
      } else if (activeCategory) {
        setActiveCategory((prev) => ({
          ...prev,
          channelNotice: updatedNotice,
        }));

        setDiscordChannels((channels) =>
          channels.map((channel) =>
            channel.id === res.response?.data?.id ? res.response?.data : channel
          )
        );
      }

      // 고정 메시지 배열 직접 업데이트 (소프트 업데이트)
      setFixedMessages([
        {
          id: Date.now().toString(), // 고유 ID 생성
          content: updatedNotice,
          createdAt: new Date().toISOString(),
          author: {
            id: "admin",
            name: "관리자",
          },
        },
      ]);

      // 채팅방에 공지사항 등록 메시지 전송
      const success = await sendMessage(
        `방장이 새로운 공지사항을 등록했습니다. ${updatedNotice}`
      );
      console.log("메시지 전송 성공:", success);

      // 상태 초기화 및 모달 닫기
      setIsLoading(false);
      setIsOpen(false);
      setMessage("");

      // 성공 토스트 메시지 표시
      toast({
        title: "공지사항 등록 완료",
        description: "새로운 공지사항이 등록되었습니다.",
        variant: "default",
      });
    } catch (error) {
      console.error("고정 메시지 추가 오류:", error);
      toast({
        title: "오류 발생",
        description: "메시지를 고정하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      setIsLoading(false);
    }  };

  console.log("FixedMessageHeader 상태:", {
    isPopup,
    isPopupMode,
    activeRoom: activeRoom?.id || "없음",
    activeCategory: activeCategory?.id || "없음",
    fixedMessages: fixedMessages.length
  });

  // 팝업 모드에서는 항상 렌더링, 일반 모드에서는 activeRoom이나 activeCategory가 있을 때만
  if (!isPopupMode && activeCategory === null && activeRoom === null) return null;

  // 팝업 모드일 때와 일반 모드일 때 다른 스타일 적용
  const containerClass = isPopupMode
    ? "fixed top-0 left-0 right-0 z-30"
    : "w-full";
  const containerStyle = isPopupMode ? { top: "55px" } : {};

  return (
    <div className={containerClass} style={containerStyle}>
      {fixedMessages.length > 0 || !isMessagesLoaded ? (
        <div
          className="bg-[#FFC107] border-b border-[#E0E0E0] transition-all duration-200"
          style={{ marginTop: "0px" }}
        >
          {!isMessagesLoaded ? (
            // 로딩 중일 때 최소 높이 유지
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center">
                <Pin size={16} className="text-[#0284c7] mr-2 flex-shrink-0" />
                <span className="text-sm font-medium">메시지 로딩 중...</span>
              </div>
            </div>
          ) : fixedMessages.length > 0 ? (
            <>
              <div
                className="flex items-center justify-between px-4 py-2 cursor-pointer"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <div className="flex items-center">
                  <Pin
                    size={16}
                    className="text-[#0284c7] mr-2 flex-shrink-0"
                  />
                  <span className="text-sm font-medium">
                    {isCollapsed ? "고정된 메시지 보기" : "고정된 메시지"}
                  </span>
                </div>
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${
                      isCollapsed ? "rotate-180" : ""
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>

              {!isCollapsed && (
                <div className="px-4 pb-2">
                  <div className="space-y-2">
                    {fixedMessages.map((msg) => (
                      <div key={msg.id} className="flex items-start group">
                        <div className="flex-1 text-sm break-words whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      ) : null}

      {/* 고정 메시지 추가 모달 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-white border-[#E0E0E0] text-gray-800">
          <DialogHeader>
            <DialogTitle>고정 메시지 추가</DialogTitle>
            <DialogDescription className="text-gray-400">
              모든 사용자에게 표시될 중요한 메시지를 작성하세요. (최대{" "}
              {MAX_MESSAGE_LENGTH}자)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="고정할 메시지 내용을 입력하세요..."
              className="bg-white border-[#E0E0E0] text-gray-800 min-h-[120px] max-h-[200px] resize-none overflow-auto"
              rows={4}
              maxLength={MAX_MESSAGE_LENGTH} // maxLength 속성 추가
            />
            {/* 글자수 표시 */}
            <div className="text-right text-sm text-gray-500 mt-1">
              {message.length} / {MAX_MESSAGE_LENGTH}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="bg-transparent border-[#E0E0E0] text-gray-800 hover:bg-[#F5F5F5]"
            >
              취소
            </Button>
            <Button
              onClick={handleAddFixedMessage}
              disabled={
                !message || isLoading || message.length > MAX_MESSAGE_LENGTH
              } // 글자수 초과 시 비활성화
              className={cn(
                "bg-[#0284c7] text-white hover:bg-[#0369a1]",
                (isLoading || message.length > MAX_MESSAGE_LENGTH) &&
                  "opacity-70 cursor-not-allowed"
              )}
            >
              {isLoading ? "추가 중..." : "메시지 고정"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
