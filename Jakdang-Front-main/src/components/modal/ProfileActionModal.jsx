"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  User, 
  Crown, 
  Shield, 
  X,
  UserPlus
} from "lucide-react";
import { useAtom } from "jotai";
import { userInfoAtom } from "@/jotai/authAtoms";
import { useChatService } from "@/hooks/useChatService";
import { useToast } from "@/components/ui/use-toast";

// 사용자 역할 정의
const UserRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN", 
  MEMBER: "MEMBER",
};

export function ProfileActionModal({ 
  isOpen, 
  onClose, 
  member, 
  position 
}) {
  const [currentUser] = useAtom(userInfoAtom);
  const modalRef = useRef(null);
  const { createOrFindDirectRoom, inviteToRoom } = useChatService(currentUser?.userId);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // 외부 클릭 시 모달 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen || !member) return null;

  // 자기 자신인지 확인
  const isCurrentUser = currentUser?.userId === member.id;

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

  // 1:1 채팅 시작하기
  const handleStartDirectChat = async () => {
    if (isCurrentUser) {
      toast({
        title: "알림",
        description: "자기 자신과는 채팅할 수 없습니다.",
        variant: "default",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("1:1 채팅 시작:", member);
      
      // createOrFindDirectRoom 함수 사용
      const result = await createOrFindDirectRoom({
        id: member.id,
        nickname: member.name,
        email: member.email
      });

      if (result && result.room) {
        console.log("1:1 채팅방 준비 완료:", result.room);        // 팝업 채팅창 열기 (localStorage에서 직접 토큰 가져다 쓰도록)
        const popupUrl = `/popup-chat/room/${result.room.id}`;
        const popup = window.open(
          popupUrl,
          `chat-${result.room.id}`,
          "width=512,height=700,scrollbars=yes,resizable=no"
        );

        if (popup) {
          toast({
            title: "채팅 시작",
            description: `${member.name}님과의 채팅이 새 창에서 열렸습니다.`,
            variant: "default",
          });
        } else {
          toast({
            title: "팝업 차단",
            description: "팝업이 차단되었습니다. 팝업 차단을 해제해주세요.",
            variant: "destructive",
          });
        }
      } else {
        throw new Error("채팅방 생성/찾기에 실패했습니다.");
      }
    } catch (error) {
      console.error("1:1 채팅 시작 오류:", error);
      toast({
        title: "오류",
        description: "채팅을 시작할 수 없습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      onClose();
    }
  };
  // 프로필 보기 (프로필 페이지로 이동)
  const handleViewProfile = () => {
    // 페이지 이동
    window.location.href = `/profile/${member.id}`;
    onClose();
  };

  // 모달 위치 계산
  const getModalStyle = () => {
    if (!position) return {};
    
    const modalWidth = 220;
    const modalHeight = 180;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let left = position.x;
    let top = position.y;
    
    // 화면 경계 확인 및 조정
    if (left + modalWidth > windowWidth) {
      left = windowWidth - modalWidth - 10;
    }
    
    if (top + modalHeight > windowHeight) {
      top = windowHeight - modalHeight - 10;
    }
    
    if (left < 10) left = 10;
    if (top < 10) top = 10;
    
    return {
      position: "fixed",
      left: `${left}px`,
      top: `${top}px`,
      zIndex: 1000,
    };
  };

  return (
    <div 
      ref={modalRef}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-56 animate-in fade-in-0 zoom-in-95 duration-200"
      style={getModalStyle()}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <User size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            프로필
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
        >
          <X size={14} />
        </Button>
      </div>

      {/* 사용자 정보 */}
      <div className="flex items-center space-x-3 mb-4">
        <Avatar className="h-10 w-10">
          <AvatarImage 
            src={member.photoURL} 
            alt={member.name}
          />
          <AvatarFallback 
            style={{ backgroundColor: member.backgroundColor || "#FFC107" }}
            className="text-white font-medium"
          >
            {member.name?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {member.name}
            </p>
            {getRoleIcon(member.role)}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getRoleText(member.role)}
          </p>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="space-y-2">
        {!isCurrentUser && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-left"
            onClick={handleStartDirectChat}
            disabled={isLoading}
          >
            <MessageCircle size={14} className="mr-2" />
            {isLoading ? "처리 중..." : "1:1 채팅하기"}
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-left"
          onClick={handleViewProfile}
        >
          <User size={14} className="mr-2" />
          프로필 보기
        </Button>
      </div>
    </div>
  );
}
