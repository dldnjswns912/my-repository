import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/ui/chat-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useChat from '@/hooks/useChatHooks';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';
import {
  isMobileAtom,
  isMoreMenuOpenAtom,
  memberIdAtom,
  messagesAtom,
  selectedChatRoomAtom,
  showChatListAtom
} from '@/recoil/chatAtoms';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ArrowLeft, ImageIcon, Info, LogOut, MoreVertical, Paperclip, Send, Smile, Trash, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Message from './message';

const ChatRoom = () => {
  const [selectedChatRoom, setSelectedChatRoom] = useAtom(selectedChatRoomAtom);
  const [messages, setMessages] = useAtom(messagesAtom);
  const memberId = useAtomValue(memberIdAtom);
  const isMobile = useAtomValue(isMobileAtom);
  const setShowChatList = useSetAtom(showChatListAtom);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useAtom(isMoreMenuOpenAtom);
  
  const [newMessage, setNewMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const messageAreaRef = useRef(null);
  
  const { 
    fetchChatMessages, 
    sendMessage, 
    sendImageMessage, 
    sendFileMessage, 
    markAsRead, 
    leaveChatRoom, 
    deleteMessage
  } = useChat();

  // 무한 스크롤 구현
  const {
    items: olderMessages,
    loaderRef,
    hasMore,
    isFetchingNextPage
  } = useInfiniteScroll({
    queryKey: `chatMessages-${selectedChatRoom?.id}`,
    fetchFn: async (pageParam) => {
      if (!selectedChatRoom || !memberId) return [];
      
      try {
        const lastMessageId = pageParam > 1 && messages.length > 0 ? messages[0].id : null;
        const response = await fetchChatMessages(selectedChatRoom.id, memberId, lastMessageId);
        return response.data || [];
      } catch (error) {
        console.error('메시지 조회 오류:', error);
        return [];
      }
    }
  });

  // 초기 메시지 로드
  useEffect(() => {
    if (selectedChatRoom && memberId) {
      fetchChatMessages(selectedChatRoom.id, memberId);
      markAsRead(selectedChatRoom.id);
    }
  }, [selectedChatRoom, memberId]);

  // 메시지 영역 자동 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 메시지 전송 핸들러
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    sendMessage(selectedChatRoom.id, newMessage.trim());
    setNewMessage("");
  };

  // 파일 업로드 핸들러
  const handleFileUpload = (files) => {
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      // 실제 구현에서는 파일을 서버에 업로드하는 로직이 필요합니다.
      // 여기서는 데모용으로 직접 메시지를 생성합니다.
      const fileType = file.type.startsWith('image/') ? 'image' : 'file';
      const fileUrl = URL.createObjectURL(file);
      
      if (fileType === 'image') {
        sendImageMessage(selectedChatRoom.id, fileUrl, { fileName: file.name, fileSize: file.size });
      } else {
        sendFileMessage(selectedChatRoom.id, fileUrl, { fileName: file.name, fileSize: file.size });
      }
    });
  };

  // 이모지 선택 핸들러
  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // 드래그 앤 드롭 핸들러
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = messageAreaRef.current.getBoundingClientRect();
    if (
      e.clientX < rect.left || 
      e.clientX > rect.right || 
      e.clientY < rect.top || 
      e.clientY > rect.bottom
    ) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  // 채팅방 나가기 핸들러
  const handleLeaveChatRoom = async () => {
    setIsMoreMenuOpen(false);
    const success = await leaveChatRoom(selectedChatRoom.id);
    if (success) {
      setSelectedChatRoom(null);
    }
  };

  // 채팅방 삭제 핸들러
  const handleDeleteChatRoom = async () => {
    setIsMoreMenuOpen(false);
    // Note: 실제 구현에서는 채팅방 삭제 API 호출이 필요합니다.
    setSelectedChatRoom(null);
  };

  if (!selectedChatRoom) {
    return (
      <div className="flex items-center justify-center h-full bg-chat-secondary dark:bg-navy-900">
        <div className="text-center p-8 max-w-md">
          <div className="bg-white dark:bg-navy-700 rounded-full p-6 mb-6 shadow-chat mx-auto w-20 h-20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-chat-primary">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3 className="font-medium text-xl mb-3 dark:text-white">채팅방을 선택해주세요</h3>
          <p className="text-gray-500 dark:text-gray-400">왼쪽 목록에서 채팅방을 선택하거나 새로운 채팅을 시작하세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 채팅방 헤더 */}
      <div className="p-4 border-b dark:border-navy-700 flex items-center justify-between bg-white dark:bg-navy-800 shadow-sm">
        <div className="flex items-center">
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2 rounded-full hover:bg-chat-hover dark:hover:bg-chat-darkHover" 
              onClick={() => setShowChatList(true)}
            >
              <ArrowLeft className="h-5 w-5 text-chat-primary dark:text-white" />
            </Button>
          )}
          <Avatar className="h-10 w-10 mr-3 border-2 border-chat-light dark:border-navy-600">
            <AvatarImage
              src={selectedChatRoom.thumbnails && selectedChatRoom.thumbnails.length > 0 
                ? selectedChatRoom.thumbnails[0] 
                : "/placeholder.svg?height=40&width=40"}
              alt={selectedChatRoom.room_name || "채팅방"}
            />
            <AvatarFallback className="bg-chat-primary text-white">
              {(selectedChatRoom.room_name || "채팅방")[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-gray-800 dark:text-white">
              {selectedChatRoom.room_name || getChatRoomName(selectedChatRoom)}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              {selectedChatRoom.room_type === 1
                ? `${getMemberCount(selectedChatRoom)}명`
                : selectedChatRoom.is_online
                  ? (
                    <>
                      <span className="h-2 w-2 bg-chat-online rounded-full mr-1.5"></span>
                      온라인
                    </>
                  )
                  : "오프라인"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-chat-hover dark:hover:bg-chat-darkHover"
          >
            <Info className="h-5 w-5 text-chat-primary dark:text-white" />
          </Button>
          <DropdownMenu open={isMoreMenuOpen} onOpenChange={setIsMoreMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-chat-hover dark:hover:bg-chat-darkHover"
              >
                <MoreVertical className="h-5 w-5 text-gray-600 dark:text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl shadow-modal">
              {selectedChatRoom.room_type === 1 && (
                <DropdownMenuItem
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    // 멤버 초대 기능 구현 (모달 열기)
                    // TODO: 추가 구현 필요
                  }}
                  className="rounded-lg cursor-pointer"
                >
                  <UserPlus className="mr-2 h-4 w-4 text-chat-primary" />
                  <span>멤버 초대</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={handleLeaveChatRoom}
                className="rounded-lg cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4 text-chat-primary" />
                <span>채팅방 나가기</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDeleteChatRoom}
                className="text-red-500 focus:text-red-500 rounded-lg cursor-pointer"
              >
                <Trash className="mr-2 h-4 w-4" />
                <span>채팅방 삭제</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDragging ? "bg-blue-50 dark:bg-navy-600/30" : "bg-chat-secondary dark:bg-navy-900"}`}
        ref={messageAreaRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ 
          height: "calc(100vh - 220px)", 
          maxHeight: "calc(100vh - 220px)",
          overflowY: "auto"
        }}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 dark:bg-navy-600/50 z-10 pointer-events-none">
            <div className="bg-white dark:bg-navy-700 p-6 rounded-xl shadow-modal text-center">
              <Paperclip className="h-12 w-12 mx-auto mb-3 text-chat-primary dark:text-chat-accent" />
              <p className="text-lg font-medium text-chat-primary dark:text-chat-accent">파일을 여기에 놓아주세요</p>
            </div>
          </div>
        )}
        
        {/* 무한 스크롤 로더 */}
        {hasMore && (
          <div ref={loaderRef} className="text-center py-2">
            {isFetchingNextPage && (
              <div className="inline-block animate-spin w-5 h-5 border-2 border-chat-primary dark:border-white border-t-transparent dark:border-t-transparent rounded-full"></div>
            )}
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 py-10">
            <div className="bg-white dark:bg-navy-700 rounded-full p-6 mb-4 shadow-chat">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-chat-primary">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <p className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">대화를 시작해보세요</p>
            <p className="text-sm">첫 메시지를 보내 대화를 시작해보세요.</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {messages.map((message) => (
              <Message 
                key={message.id} 
                message={message} 
                chatRoom={selectedChatRoom}
                onDelete={deleteMessage}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 메시지 입력 */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-navy-800 border-t dark:border-navy-700 flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
          multiple
        />
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full hover:bg-chat-hover dark:hover:bg-chat-darkHover"
        >
          <Paperclip className="h-5 w-5 text-chat-primary dark:text-white" />
        </Button>

        <input
          type="file"
          ref={imageInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFileUpload(e.target.files)}
          multiple
        />
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={() => imageInputRef.current?.click()}
          className="rounded-full hover:bg-chat-hover dark:hover:bg-chat-darkHover"
        >
          <ImageIcon className="h-5 w-5 text-chat-primary dark:text-white" />
        </Button>

        <ChatInput
          placeholder="메시지 입력..."
          className="flex-1 bg-gray-100 dark:bg-navy-700 border-none rounded-full"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
        />

        <div className="relative">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="rounded-full hover:bg-chat-hover dark:hover:bg-chat-darkHover"
          >
            <Smile className="h-5 w-5 text-chat-primary dark:text-white" />
          </Button>

          {showEmojiPicker && (
            <div className="absolute bottom-12 right-0 bg-white dark:bg-navy-700 p-2 rounded-xl shadow-modal border dark:border-navy-600 z-10 w-64">
              <div className="grid grid-cols-8 gap-1">
                {[
                  "😀", "😂", "😊", "😍", "🥰", "😎", "😢", "😭",
                  "👍", "👎", "👏", "🙏", "🎉", "❤️", "🔥", "✨",
                ].map((emoji) => (
                  <button
                    key={emoji}
                    className="text-xl p-1 hover:bg-gray-100 dark:hover:bg-navy-600 rounded"
                    onClick={() => handleEmojiSelect(emoji)}
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button
          type="submit"
          variant="ghost"
          size="icon"
          disabled={!newMessage.trim()}
          className={`rounded-full hover:bg-chat-hover dark:hover:bg-chat-darkHover ${!newMessage.trim() ? "text-gray-400" : "text-chat-primary dark:text-chat-accent"}`}
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
};

// 채팅방 이름 생성 유틸리티 함수
const getChatRoomName = (chatRoom) => {
  if (chatRoom.room_name) return chatRoom.room_name;
  if (chatRoom.default_room_name) return chatRoom.default_room_name;
  
  try {
    if (typeof chatRoom.members === 'string') {
      const memberIds = JSON.parse(chatRoom.members);
      if (Array.isArray(memberIds) && memberIds.length > 0) {
        return `${memberIds.length}인 채팅방`;
      }
    }
  } catch (error) {
    console.error('채팅방 멤버 파싱 오류:', error);
  }
  
  return "채팅방";
};

// 멤버 수 계산 유틸리티 함수
const getMemberCount = (chatRoom) => {
  if (chatRoom.member_count) return chatRoom.member_count;
  
  try {
    if (typeof chatRoom.members === 'string') {
      const memberIds = JSON.parse(chatRoom.members);
      if (Array.isArray(memberIds)) {
        return memberIds.length;
      }
    }
  } catch (error) {
    console.error('채팅방 멤버 파싱 오류:', error);
  }
  
  return 0;
};

export default ChatRoom;
