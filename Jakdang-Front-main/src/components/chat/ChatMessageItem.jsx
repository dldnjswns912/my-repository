import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { userInfoAtom } from "@/jotai/authAtoms";
import { useAtomValue } from "jotai";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Paperclip, Trash } from "lucide-react";
import React, { useEffect, useState } from 'react';

const ChatMessageItem = ({ message, isGroupChat, participants = [] }) => {
  const userInfo = useAtomValue(userInfoAtom);
  const [menuOpen, setMenuOpen] = useState(false);
  const [readStatusDebug, setReadStatusDebug] = useState(null);
  
  // 읽음 상태 디버깅을 위한 효과
  useEffect(() => {
    if (message.isMe) {
      const debug = {
        messageId: message.id,
        content: message.content?.substring(0, 20) + (message.content?.length > 20 ? '...' : ''),
        readByCount: (message.readBy || []).length,
        readByOthers: (message.readBy || []).filter(id => id !== message.senderId).length,
        participantsCount: participants.length || 2,
        readBy: message.readBy || [],
        participants: participants
      };
      setReadStatusDebug(debug);
      
      if (debug.readByOthers === 0) {
        console.log(`읽음 상태 디버그 [${message.id}]:`, debug);
      }
    }
  }, [message, participants]);
  
  // 메시지 삭제 핸들러
  const handleDeleteMessage = async () => {
    setMenuOpen(false);
    // 삭제 기능이 props로 전달되었다면 실행
    if (message.id && onDelete) {
      onDelete(message.id);
    }
  };
  
  // 읽음 상태 표시 렌더링
  const renderReadStatus = () => {
    // 내가 보낸 메시지가 아니면 읽음 상태를 표시하지 않음
    if (!message.isMe) return null;
    
    const readBy = message.readBy || [];
    
    // 최소 참가자 수는 2명 (1:1 채팅)
    // participants가 비어있거나 불완전할 수 있으므로 최소값 설정
    const totalParticipants = Math.max(participants.length, 2);
    
    // 자신을 제외한 참가자 중 읽은 사람 수
    const readByOthers = readBy.filter(id => id !== message.senderId).length;
    
    // 자신을 포함한 읽은 사람 수 (디버깅용)
    const readByCount = readBy.length;
    
    // 모든 참가자가 읽은 경우 (자신 제외)
    // 여러 명이 참여한 채팅방에서는 다른 모든 참가자가 읽어야 함
    if (readByOthers >= totalParticipants - 1) {
      return (
        <span className="text-xs text-green-500 dark:text-green-400 flex items-center gap-1 ml-2">
          <span className="h-2 w-2 bg-green-500 dark:bg-green-400 rounded-full"></span>
          모두 읽음
        </span>
      );
    } 
    // 일부만 읽은 경우
    else if (readByOthers > 0) {
      return (
        <Badge variant="outline" className="text-xs text-gray-500 dark:text-gray-400 ml-2">
          {readByOthers}명이 읽음
        </Badge>
      );
    }
    // 아무도 읽지 않은 경우
    else {
      return (
        <Badge variant="outline" className="text-xs text-orange-500 dark:text-orange-400 ml-2">
          안 읽음
        </Badge>
      );
    }
  };

  // 메시지 유형별 렌더링 함수
  const renderMessageContent = () => {
    if (message.is_deleted) {
      return <p className="text-gray-400 italic">삭제된 메시지입니다.</p>
    }
    
    switch (message.type) {
      case 0: // 시스템 메시지
        return (
          <div className="text-center my-4">
            <span className="px-3 py-1 bg-gray-200 dark:bg-navy-700 rounded-full text-xs">
              {message.content}
            </span>
          </div>
        );
      case 1: // 텍스트 메시지
        return (
          <div className={`p-3 rounded-2xl ${
              message.isMe
                ? "bg-navy-600 text-white rounded-tr-none"
                : "bg-navy-200 dark:bg-navy-300 dark:text-white rounded-tl-none"
            }`}>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        );      case 2: // 이미지 메시지
        return (
          <div className={`p-1 rounded-2xl overflow-hidden ${
              message.isMe
                ? "bg-navy-600 text-white rounded-tr-none"
                : "bg-gray-100 dark:bg-navy-700 dark:text-white rounded-tl-none"
            }`}>
            <img 
              src={message.fileUrl} 
              alt={message.content || "이미지"} 
              className="max-w-[200px] max-h-[200px] rounded cursor-pointer hover:opacity-90 transition-opacity" 
              onClick={() => {
                // ChatV2의 이미지 모달 사용
                if (window.openImageModal) {
                  const imageData = [{
                    fileId: message.id,
                    fileUrl: message.fileUrl,
                    fileName: message.content || "이미지"
                  }];
                  window.openImageModal(imageData, 0);
                } else {
                  // 폴백: 새 탭에서 열기
                  window.open(message.fileUrl, '_blank');
                }
              }}
            />
          </div>
        );
      case 3: // 파일 메시지
        return (
          <div className={`p-3 rounded-2xl ${
              message.isMe
                ? "bg-navy-600 text-white rounded-tr-none"
                : "bg-gray-100 dark:bg-navy-700 dark:text-white rounded-tl-none"
            }`}>
            <div className="flex items-center">
              <Paperclip className="h-4 w-4 mr-2" />
              <a 
                href={message.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline"
              >
                {message.content || "파일 다운로드"}
              </a>
            </div>
          </div>
        );
      default:
        return (
          <div className={`p-3 rounded-2xl ${
              message.isMe
                ? "bg-navy-600 text-white rounded-tr-none"
                : "bg-gray-100 dark:bg-navy-700 dark:text-white rounded-tl-none"
            }`}>
            <p className="whitespace-pre-wrap">{message.content || "내용 없음"}</p>
          </div>
        );
    }
  };

  // 시스템 메시지인 경우 다른 레이아웃 사용
  if (message.type === 0) {
    return renderMessageContent();
  }

  // 디버깅용 읽음 상태 정보
  const debugInfo = message.isMe ? (
    <div className="hidden">
      {/* 디버깅용 데이터: 실제 UI에는 보이지 않음 */}
      <div data-read-by={JSON.stringify(message.readBy || [])}></div>
      <div data-participants={JSON.stringify(participants)}></div>
      <div data-read-by-others={readStatusDebug?.readByOthers}></div>
      <div data-total-participants={readStatusDebug?.participantsCount}></div>
    </div>
  ) : null;

  return (
    <div className={`flex ${message.isMe ? "justify-end" : "justify-start"} items-end mb-4`}>
      {/* 메시지 보낸이 아바타 (내 메시지가 아닐 때만 표시) */}
      {!message.isMe && (
        <Avatar className="h-8 w-8 mr-2 mt-1 border dark:border-navy-600 flex-shrink-0">
          <AvatarImage
            src="/placeholder.svg?height=40&width=40"
            alt={message.senderName}
          />
          <AvatarFallback>{message.senderName ? message.senderName[0] : "?"}</AvatarFallback>
        </Avatar>
      )}
      
      {/* 메시지 내용 */}
      <div className={`max-w-[70%]`}>
        {/* 그룹 채팅이고 내 메시지가 아닐 때 보낸이 이름 표시 */}
        {!message.isMe && isGroupChat && (
          <p className="text-xs text-navy-500 dark:text-gray-400 mb-1">{message.senderName}</p>
        )}
        
        {/* 메시지 내용 및 삭제 버튼 */}
        <div className="relative group">
          {/* 메시지 내용 */}
          {renderMessageContent()}
          
          {/* 메시지 상태 표시 */}
          {message.isMe && message.status && (
            <div className="absolute bottom-0 right-0 -mb-4 mr-2 text-xs">
              {message.status === "sending" && <span className="text-gray-400">전송 중...</span>}
              {message.status === "failed" && <span className="text-red-500">전송 실패</span>}
            </div>
          )}
          
          {/* 메시지 삭제 버튼 (내 메시지일 때만 표시) */}
          {message.isMe && !message.is_deleted && !message.status && (
            <div className="absolute top-2 -left-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-navy-600">
                    <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl shadow-modal">
                  <DropdownMenuItem onClick={handleDeleteMessage} className="text-red-500 rounded-lg cursor-pointer">
                    <Trash className="h-4 w-4 mr-2" />
                    <span>삭제</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        
        {/* 메시지 시간과 읽음 상태 */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
          <span>{message.formattedTime}</span>
          {/* 읽음 상태 표시 - 오른쪽에 배치 */}
          {renderReadStatus()}
          {debugInfo}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatMessageItem);