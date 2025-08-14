"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, User, Crown, Shield } from "lucide-react";

export function PopupMembersSidebar({ room, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("PopupMembersSidebar useEffect 실행:", { 
      room: room ? { id: room.id, name: room.name, members: room.members } : null 
    });
    
    if (!room) {
      setMembers([]);
      setLoading(false);
      return;
    }    // 채팅방 멤버 정보 로드
    const loadMembers = () => {
      try {
        let roomMembers = [];

        // 다양한 데이터 구조에 대응
        if (room.members && Array.isArray(room.members)) {
          roomMembers = room.members;
        } else if (room.participants && Array.isArray(room.participants)) {
          roomMembers = room.participants;
        } else if (room.users && Array.isArray(room.users)) {
          roomMembers = room.users;
        }

        console.log("원본 멤버 데이터:", roomMembers);        // 멤버 정보 정규화 - 기존 로직 참고
        const normalizedMembers = roomMembers.map((member) => {
          console.log("멤버 원본 데이터:", member);
          
          return {
            id: member.userId || member.id || member.memberId,
            name: member.nickname || member.name || member.displayName || "익명",
            photoURL: member.image || member.profileImage || member.profileUrl || member.avatar || 
                     member.profile_image || member.imageUrl || member.thumbnailUrl ||
                     member.picture || member.photo,
            role: member.role || "MEMBER",
            status: member.status || "ONLINE",
            statusMessage: member.statusMessage || member.bio || member.description || "",
            backgroundColor: member.backgroundColor || "#FFC107",
          };
        });

        console.log("팝업 멤버 사이드바 - 정규화된 멤버:", normalizedMembers);
        setMembers(normalizedMembers);
      } catch (error) {
        console.error("멤버 정보 로드 실패:", error);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [room]);

  // 역할별 아이콘
  const getRoleIcon = (role) => {
    switch (role?.toUpperCase()) {
      case "OWNER":
      case "ADMIN":
        return <Crown size={10} className="text-yellow-500" />;
      case "MODERATOR":
        return <Shield size={10} className="text-blue-500" />;
      default:
        return null;
    }
  };

  // 상태별 색상
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "ONLINE":
        return "bg-green-400";
      case "AWAY":
        return "bg-yellow-400";
      case "BUSY":
        return "bg-red-400";
      case "OFFLINE":
      default:
        return "bg-gray-300";
    }
  };  if (loading) {
    return (
      <div className="h-full bg-white">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">
            대화상대
          </h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600 mb-2"></div>
            <p className="text-sm text-gray-500">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="h-full bg-white">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">
            대화상대
          </h3>
        </div>
        <div className="flex items-center justify-center py-12 text-gray-500">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <User size={24} className="text-gray-400" />
            </div>
            <p className="text-sm">채팅방이 선택되지 않았습니다.</p>
          </div>
        </div>
      </div>
    );
  }  return (
    <div className="h-full flex flex-col bg-white">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            대화상대
          </h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {members.length}
          </span>
        </div>
      </div>

      {/* 멤버 목록 */}
      <div className="flex-1 overflow-hidden bg-white">
        {members.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <User size={24} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                대화상대가 없습니다.
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-0">
              {members.map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
                >
                  {/* 프로필 이미지 */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-11 w-11 border border-gray-200">
                      <AvatarImage 
                        src={member.photoURL || "/placeholder.svg"} 
                        alt={member.name}
                      />
                      <AvatarFallback
                        className="text-white font-semibold"
                        style={{backgroundColor: member.backgroundColor}}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* 사용자 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-base font-normal text-gray-900 truncate">
                        {member.name}
                      </p>
                      {getRoleIcon(member.role)}
                    </div>
                    {member.statusMessage && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {member.statusMessage}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
