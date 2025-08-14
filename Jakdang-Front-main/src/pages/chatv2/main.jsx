"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SelectionCopyDialog } from "@/components/ui/selection-copy-dialog";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import { useChatService } from "@/hooks/useChatService";
import { userInfoAtom } from "@/jotai/authAtoms";
import {
  activeChatRoomAtom,
  isLoadingMessagesAtom,
  messagesAtom,
} from "@/jotai/chatAtoms";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useAtom } from "jotai";
import { Copy, FileIcon, RefreshCw, Trash2 } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// 현재 열린 프로필 메뉴 ID를 추적하는 전역 변수
let openProfileMenuId = null;

// 선택 복사 모달 컴포넌트
const SelectionCopyModal = memo(function SelectionCopyModal({
  isVisible,
  position,
  onCopy,
  onClose,
}) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed z-50"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        transform: "translate(-50%, -150%)",
      }}
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 flex items-center space-x-2">
        <button
          className="text-green-500 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
          onClick={onCopy}
        >
          <Copy size={18} />
        </button>
      </div>
    </div>
  );
});

// 선택 영역 표시를 위한 오버레이 컴포넌트
const SelectionOverlay = memo(function SelectionOverlay({
  isVisible,
  onClose,
}) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 cursor-pointer"
      onClick={onClose}
    />
  );
});

// 이미지 컴포넌트를 최적화하기 위한 메모이제이션 컴포넌트 추가
const MemoizedImage = memo(function MemoizedImage({
  src,
  alt,
  className,
  onClick,
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`relative ${className || ""} ${!loaded ? "bg-gray-100" : ""}`}
    >
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        className={`${className || ""} ${
          loaded ? "opacity-100" : "opacity-0"
        } transition-opacity duration-300`}
        onLoad={() => setLoaded(true)}
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()} // 컨텍스트 메뉴(롱 프레스) 방지
        style={{ WebkitTouchCallout: "none", userSelect: "none" }} // iOS에서 롱 프레스 방지
      />
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-md"></div>
      )}
    </div>
  );
});

// 첨부 파일 컴포넌트를 분리
const AttachmentContent = memo(function AttachmentContent({
  attachments,
  getAttachmentType,
  isGifFile,
}) {
  if (!attachments || attachments.length === 0) return null;

  const imageAttachments = attachments.filter(
    (att) =>
      att.fileType === "image" || (att.fileName && isGifFile(att.fileName))
  );
  const videoAttachments = attachments.filter(
    (att) => att.fileType === "video"
  );
  const fileAttachments = attachments.filter(
    (att) =>
      att.fileType !== "image" &&
      att.fileType !== "video" &&
      !(att.fileName && isGifFile(att.fileName))
  );

  return (
    <div className="mt-2">
      {/* 이미지 그리드 표시 */}
      {imageAttachments.length > 0 && (
        <div
          className={`relative w-full ${
            imageAttachments.length === 1 ? "max-w-[200px]" : "max-w-[256px]"
          } ${imageAttachments.length <= 2 ? "" : "aspect-square"}`}
        >
          <div
            className={`grid gap-1 ${
              imageAttachments.length === 1
                ? "grid-cols-1"
                : imageAttachments.length === 2
                ? "grid-cols-2"
                : "grid-cols-2"
            }`}
          >
            {/* 최대 4개 이미지만 표시 */}
            {imageAttachments.slice(0, 4).map((attachment, index) => (
              <div
                key={attachment.fileId || index}
                className={`relative ${
                  imageAttachments.length === 3 && index === 0
                    ? "col-span-2"
                    : ""
                } ${
                  imageAttachments.length <= 2
                    ? "aspect-[4/3]"
                    : "aspect-square"
                }`}
              >
                <div className="relative h-full w-full overflow-hidden rounded-md border border-[#E0E0E0] bg-white">
                  <MemoizedImage
                    src={attachment.fileUrl}
                    alt={attachment.fileName || "첨부 이미지"}
                    className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity"                    onClick={() => {
                      // 이미지 클릭 시 모달 열기
                      if (window.openImageModal) {
                        window.openImageModal(imageAttachments, index);
                      }
                    }}
                    onContextMenu={(e) => e.preventDefault()} // 컨텍스트 메뉴(롱 프레스) 방지
                  />
                </div>
              </div>
            ))}

            {/* 추가 이미지가 있는 경우 더보기 버튼 표시 */}
            {imageAttachments.length > 4 && (
              <div
                className="absolute bottom-0 right-0 w-[calc(50%-2px)] h-[calc(50%-2px)] flex items-center justify-center cursor-pointer"                onClick={() => {
                  if (window.openImageModal) {
                    window.openImageModal(imageAttachments, 3);
                  }
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-60 rounded-md flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    +{imageAttachments.length - 3}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 동영상 표시 */}
      {videoAttachments.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          {videoAttachments.map((attachment, index) => (
            <div key={attachment.fileId || index} className="max-w-md">
              <div className="rounded-md overflow-hidden border border-[#E0E0E0] bg-white">
                <video
                  src={attachment.fileUrl}
                  controls
                  className="w-full max-h-[300px]"
                  preload="metadata"
                >
                  <source src={attachment.fileUrl} type="video/mp4" />
                  <source src={attachment.fileUrl} type="video/webm" />
                  <source src={attachment.fileUrl} type="video/ogg" />
                  브라우저가 동영상 재생을 지원하지 않습니다.
                </video>
              </div>
              <div className="text-xs text-gray-800 mt-1 truncate">
                {attachment.fileName || "동영상"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 일반 파일 표시 */}
      {fileAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {fileAttachments.map((attachment, index) => (
            <a
              key={attachment.fileId || index}
              href={attachment.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center bg-[#F5F5F5] text-xs text-gray-600 px-3 py-2 rounded-md hover:bg-[#E0E0E0] transition-colors"
            >
              <FileIcon size={14} className="mr-2 text-[#0284c7]" />
              <span className="truncate max-w-[180px]">
                {attachment.fileName || "파일"}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
});

// MessageItem 컴포넌트
const MessageItem = memo(function MessageItem({
  message,
  index,
  user,
  activeRoom,
  mentioned,
  formatMessageTime,
  renderMessageWithMentions,
  handleContextMenu,
  attachments,
  getAttachmentType,
  isGifFile,
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const avatarRef = useRef(null);

  // 선택 복사 기능을 위한 상태 추가
  const [selection, setSelection] = useState({
    isVisible: false,
    text: "",
    position: { x: 0, y: 0 },
  });

  // 답장 대상 메시지 찾기
  const [messages] = useAtom(messagesAtom);
  const hasReplyMessage =
    message.replyMessage &&
    (message.replyMessage.senderName || message.replyMessage.content);
  const senderId = message.senderId;

  // 멤버 정보 가져오기
  const member = activeRoom?.members?.find(
    (m) => m.userId === senderId || m.id === senderId
  );

  const imageUrl = member?.image || message.senderPhotoUrl;
  const hasImage = !!member?.image;
  const backgroundColor = member?.backgroundColor || "#FFC107";
  const fallbackText = message.senderName
    ? message.senderName.charAt(0).toUpperCase()
    : "UN";

  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timerRef = useRef(null);
  const messageBubbleRef = useRef(null);

  // 텍스트 선택 처리 함수 - MouseUp 이벤트로 변경
  const handleTextSelection = useCallback((e) => {
    // 선택 동작이 메시지 버블 내에서 발생했는지 확인
    if (
      !messageBubbleRef.current ||
      !messageBubbleRef.current.contains(e.target)
    ) {
      return;
    }

    const selection = window.getSelection();
    if (selection && selection.toString().trim() !== "") {
      e.stopPropagation(); // 이벤트 전파 중지

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelection({
        isVisible: true,
        text: selection.toString(),
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top,
        },
      });
    }
  }, []);

  // 텍스트 복사 함수
  const copySelectedText = useCallback(() => {
    if (selection.text) {
      navigator.clipboard
        .writeText(selection.text)
        .then(() => {
          // 복사 성공 알림 (선택적)
          alert("텍스트가 복사되었습니다.");
          setSelection((prev) => ({ ...prev, isVisible: false }));
          // 선택 해제
          window.getSelection().removeAllRanges();
        })
        .catch((err) => {
          console.error("텍스트 복사 중 오류 발생:", err);
        });
    }
  }, [selection.text]);

  // 메시지 버블에 mouseup 이벤트 리스너 등록
  useEffect(() => {
    const bubbleElement = messageBubbleRef.current;
    if (bubbleElement) {
      bubbleElement.addEventListener("mouseup", handleTextSelection);
      // 모바일 터치 지원
      bubbleElement.addEventListener("touchend", handleTextSelection);

      return () => {
        bubbleElement.removeEventListener("mouseup", handleTextSelection);
        bubbleElement.removeEventListener("touchend", handleTextSelection);
      };
    }
  }, [handleTextSelection]);

  // 선택 모달 외부 클릭 감지 (선택 해제)
  useEffect(() => {
    if (!selection.isVisible) return;

    const handleClickOutside = (e) => {
      if (
        messageBubbleRef.current &&
        !messageBubbleRef.current.contains(e.target)
      ) {
        setSelection((prev) => ({ ...prev, isVisible: false }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [selection.isVisible]);

  // 프로필 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    // 전역 이벤트 리스너 - 다른 프로필 메뉴가 열릴 때 현재 메뉴 닫기
    const handleCloseAllMenus = () => {
      setShowProfileMenu(false);
      // 메뉴가 닫힐 때 전역 변수도 초기화
      if (openProfileMenuId === senderId) {
        openProfileMenuId = null;
      }
    };

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    // 전역 이벤트 리스너 추가
    document.addEventListener("closeProfileMenus", handleCloseAllMenus);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("closeProfileMenus", handleCloseAllMenus);
    };
  }, [showProfileMenu, senderId]);

  // 터치 이벤트 핸들러 (모바일)
  const handleTouchStart = (event) => {
    timerRef.current = setTimeout(() => {
      setLongPressTriggered(true);
      handleContextMenuCustom(event); // 컨텍스트 메뉴 표시
    }, 600);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setLongPressTriggered(false);
  };

  // 마우스 이벤트 핸들러 (데스크톱)
  const handleMouseDown = (event) => {
    // 삭제되거나 임시 메시지는 롱프레스 허용하지 않음
    if (message.deleted || message.isTemp) return;

    timerRef.current = setTimeout(() => {
      setLongPressTriggered(true);
      handleContextMenuCustom(event); // 컨텍스트 메뉴 표시
    }, 600);
  };

  const handleMouseUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setLongPressTriggered(false);
  };

  // 롱프레스 시 실제로 컨텍스트 메뉴를 표시하도록 수정
  const handleContextMenuCustom = (event) => {
    // 메시지 박스의 위치 정보 가져오기
    if (messageBubbleRef.current) {
      const rect = messageBubbleRef.current.getBoundingClientRect();

      // 메시지 박스 바로 아래에 메뉴 표시
      handleContextMenu(
        {
          preventDefault: () => {},
          // 메시지 박스의 중앙 하단 위치
          clientX: rect.left + rect.width / 2,
          clientY: rect.bottom + 5, // 약간의 여백 추가
          bubbleRect: rect, // 메시지 박스의 위치 정보 전달
          isOwnMessage: message.senderId === user?.userId, // 자신의 메시지인지 여부
        },
        message.id
      );
    }
  };

  // 프로필 아바타 클릭 핸들러
  const handleAvatarClick = (e) => {
    e.stopPropagation();

    // 이미 열린 메뉴가 있고, 현재 클릭한 것과 다르면 모든 메뉴 닫기
    if (openProfileMenuId !== null && openProfileMenuId !== senderId) {
      document.dispatchEvent(new CustomEvent("closeProfileMenus"));
    }

    // 현재 메뉴 토글
    const newState = !showProfileMenu;
    setShowProfileMenu(newState);

    // 전역 변수 업데이트
    openProfileMenuId = newState ? senderId : null;
  };

  // MessageItem 컴포넌트의 최상위 div에 id 속성 추가
  return (
    <div
      key={`${message.id}-${index}`}
      id={`message-${message.id}`}
      className={`flex group ${
        mentioned ? "bg-[#FFF8E1] p-2 rounded-lg" : ""
      } ${
        message.senderId === user?.userId ? "justify-end" : "justify-start"
      } mb-4`}
    >      {/* 상대방 메시지일 경우 아바타 표시 */}
      {message.senderId !== user?.userId && (
        <div className="relative" ref={avatarRef}>
          <Avatar
            className={`h-8 w-8 md:h-10 md:w-10 mr-2 md:mr-3 mt-0.5 shadow-sm flex-shrink-0 ${
              hasImage ? "" : "border-2"
            } cursor-pointer`}
            style={{
              borderColor: hasImage ? "transparent" : backgroundColor,
            }}
            onClick={handleAvatarClick}
          >
            <AvatarImage src={imageUrl || "/placeholder.svg"} />
            <AvatarFallback className="text-white" style={{ backgroundColor }}>
              {fallbackText}
            </AvatarFallback>
          </Avatar>

          {/* 프로필 드롭다운 메뉴 - 위치 계산 없이 단순하게 표시 */}
          {showProfileMenu && (
            <div
              ref={profileMenuRef}
              className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[120px]"
            >
              <Link
                to={`/profile/${senderId}`}
                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 text-gray-700"
                onClick={() => setShowProfileMenu(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                프로필 보기
              </Link>
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[70%] min-w-0`}>
        {/* 상대방 메시지일 경우 이름 표시 */}
        {message.senderId !== user?.userId && (
          <div className="text-sm font-medium text-gray-700 mb-1 ml-1">
            {message.senderName || "알 수 없는 사용자"}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* 내 메시지일 경우 시간을 왼쪽에 표시 */}
          {message.senderId === user?.userId && (
            <div className="flex flex-col items-end justify-end">
              {message.isTemp && (
                <span className="text-xs text-gray-500 italic mb-1">
                  전송 중...
                </span>
              )}
              <span className="text-[10px] md:text-xs text-gray-500">
                {formatMessageTime(message.sentAt)}
              </span>
            </div>
          )}

          {/* 메시지 내용 - 카카오톡 스타일 말풍선 */}
          <div
            ref={messageBubbleRef}
            className={`relative p-2 md:p-3 rounded-lg ${
              message.senderId === user?.userId
                ? "bg-[#FEE500] text-black rounded-tr-none"
                : "bg-white border border-gray-200 rounded-tl-none"
            } ${message.isTemp ? "opacity-70" : ""}`}
            onContextMenu={(e) => {
              e.preventDefault();
              handleContextMenuCustom(e);
            }}
            onTouchStart={handleTouchStart} // 모바일 터치 시작
            onTouchEnd={handleTouchEnd} // 모바일 터치 끝
            onTouchMove={handleTouchEnd} // 터치 이동 시에도 롱프레스 취소
            onMouseDown={handleMouseDown} // 데스크톱 마우스 다운
            onMouseUp={handleMouseUp} // 데스크톱 마우스 업
            onMouseLeave={handleMouseUp} // 마우스가 요소를 벗어나면 롱프레스 취소
          >
            {/* 답장 표시 */}
            {hasReplyMessage && (
              <div className="mb-2 pb-2 border-b border-gray-200 text-xs">
                <div className="text-gray-500 mb-1">
                  {message.replyMessage.senderName}에게 답장
                </div>
                <div className="text-gray-600 truncate">
                  {message.replyMessage.content.length > 50
                    ? `${message.replyMessage.content.substring(0, 50)}...`
                    : message.replyMessage.content}
                </div>
              </div>
            )}            <p
              className={`text-sm md:text-base ${
                message.deleted ? "italic text-gray-500" : ""
              } break-words whitespace-pre-wrap`}
              style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
            >
              {message.deleted
                ? "삭제된 메시지입니다"
                : renderMessageWithMentions(message.content)}
            </p>

            {/* 첨부 파일 표시 */}
            {message.deleted ? (
              <></>
            ) : (
              <AttachmentContent
                attachments={message.attachments}
                getAttachmentType={getAttachmentType}
                isGifFile={isGifFile}
              />
            )}

            {/* 본인 메시지인 경우에만 메뉴 아이콘 표시 - 호버 효과 제거 */}
            {message.senderId === user?.userId &&
              !message.deleted &&
              !message.isTemp && (
                <button
                  className="absolute -top-5 right-0 outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenuCustom(e);
                  }}
                ></button>
              )}
          </div>

          {/* 상대방 메시지일 경우 시간을 오른쪽에 표시 */}
          {message.senderId !== user?.userId && (
            <div className="flex flex-col items-start justify-end">
              {message.isTemp && (
                <span className="text-xs text-gray-500 italic mb-1">
                  전송 중...
                </span>
              )}
              <span className="text-[10px] md:text-xs text-gray-500">
                {formatMessageTime(message.sentAt)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 선택 복사 모달 */}
      <SelectionCopyModal
        isVisible={selection.isVisible}
        position={selection.position}
        onCopy={copySelectedText}
        onClose={() => setSelection((prev) => ({ ...prev, isVisible: false }))}
      />

      {/* 선택 영역 주변 흐리게 표시 오버레이 */}
      <SelectionOverlay
        isVisible={selection.isVisible}
        onClose={() => setSelection((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
});

export function Main({ autoScroll, setAutoScroll, messages: propMessages, isPopup = false }) {
  const [user] = useAtom(userInfoAtom);
  const [activeRoom] = useAtom(activeChatRoomAtom);
  const [messages, setMessages] = useAtom(messagesAtom);
  
  // 팝업 모드에서는 props로 받은 메시지 사용, 아니면 atom 사용
  const displayMessages = isPopup && propMessages ? propMessages : messages;
  const { fetchPost } = useAxiosQuery(); // useAxiosQuery 훅 직접 사용
  // 드래그 앤 드롭 상태 추가
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // SelectionCopyDialog를 위한 상태 추가
  const [selectionCopyDialog, setSelectionCopyDialog] = useState({
    isOpen: false,
    selectedText: "",
  });

  // 컨텍스트 메뉴 상태 - 컴포넌트 최상위 레벨로 이동
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    messageId: null,
    bubbleRect: null,
    position: "bottom", // 메뉴 위치 (top 또는 bottom)
    isOwnMessage: false,
  });
  const contextMenuRef = useRef(null);
  const menuSizeRef = useRef({ width: 120, height: 120 }); // 메뉴 크기 기본값 (실제 측정 전)

  // 서비스 훅 초기화 (메시지 조회 관련 기능 제외)
  const { deleteMessage, editMessage } = useChatService(user?.userId);

  const scrollRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const lastMessageIdRef = useRef(null);
  const loadingPageRef = useRef(false);
  const lastRequestTimeRef = useRef(0);
  const pageSizeRef = useRef(20); // 한 번에 로드할 메시지 개수 제한

  // 무한 스크롤 관련 상태
  const [isScrollLoading, setIsScrollLoading] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [scrollMessages, setScrollMessages] = useState([]);
  const infiniteScrollRef = useRef(null);
  const [isLoadingMsg, setLoadingMsg] = useAtom(isLoadingMessagesAtom);

  // 현재 활성화된 채팅방 ID 저장을 위한 ref
  const currentRoomIdRef = useRef(null);

  // 팝업 모드에서 displayMessages가 변경될 때 scrollMessages 업데이트
  useEffect(() => {
    if (isPopup && propMessages) {
      setScrollMessages(displayMessages);
    }
  }, [isPopup, propMessages, displayMessages]);

  // 웹소켓 메시지 처리 함수
  const handleWebSocketMessage = useCallback(
    (data) => {
      if (!data || !data.data) {
        console.warn("유효하지 않은 메시지 데이터:", data);
        return;
      }

      const messageData = data.data;
      const action = data.action?.toUpperCase();
      const messageId = messageData.id;

      console.log("웹소켓 메시지 수신:", {
        action,
        messageId,
        content: messageData.content?.substring(0, 30),
        roomId: messageData.roomId,
      });

      // 현재 채팅방의 메시지인지 확인
      if (messageData.roomId !== activeRoom?.id) {
        console.log("다른 채팅방의 메시지 무시");
        return;
      }

      if (action === "SEND") {
        setMessages((prev) => {
          // 이미 존재하는 메시지인지 확인 (ID로 체크)
          const existingMsg = prev.find((m) => m.id === messageId && !m.isTemp);
          if (existingMsg) {
            console.log(`이미 존재하는 메시지 무시 (ID: ${messageId})`);
            return prev;
          }

          // 임시 메시지를 실제 메시지로 교체
          const tempIdx = prev.findIndex(
            (m) =>
              m.isTemp &&
              m.content === messageData.content &&
              m.senderId === messageData.senderId
          );
          if (tempIdx >= 0) {
            console.log(`임시 메시지를 실제 메시지로 교체 (ID: ${messageId})`);
            const updated = [...prev];
            updated[tempIdx] = { ...messageData, isTemp: false };
            return updated;
          }

          // 새 메시지 추가
          console.log(`새 메시지 추가 (ID: ${messageId})`);
          return [...prev, messageData];
        });

        // scrollMessages도 업데이트
        setScrollMessages((prev) => {
          const existingMsg = prev.find((m) => m.id === messageId && !m.isTemp);
          if (existingMsg) return prev;

          const tempIdx = prev.findIndex(
            (m) =>
              m.isTemp &&
              m.content === messageData.content &&
              m.senderId === messageData.senderId
          );
          if (tempIdx >= 0) {
            const updated = [...prev];
            updated[tempIdx] = { ...messageData, isTemp: false };
            return updated;
          }

          return [...prev, messageData];
        });
      } else if (action === "DELETE") {
        console.log(`메시지 삭제 처리 (ID: ${messageId})`);
        const updateDeletedMessage = (prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  deleted: true,
                  content: "삭제된 메시지입니다.",
                  deletedAt: messageData.deletedAt,
                }
              : msg
          );

        setMessages(updateDeletedMessage);
        setScrollMessages(updateDeletedMessage);
      } else if (action === "EDIT") {
        console.log(`메시지 수정 처리 (ID: ${messageId})`);
        const updateEditedMessage = (prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: messageData.content }
              : msg
          );

        setMessages(updateEditedMessage);
        setScrollMessages(updateEditedMessage);
      }
    },
    [activeRoom?.id]
  );

  // 메시지 로드 함수 - main.jsx에서 직접 구현
  const loadMessages = useCallback(
    async (pageNum, pageSize = pageSizeRef.current) => {
      // 중복 요청 방지 - 200ms 내에 발생한 요청은 무시
      const now = Date.now();
      if (now - lastRequestTimeRef.current < 200) {
        console.log("메시지 로드 요청 무시: 너무 빠른 요청", {
          pageNum,
          timeDiff: now - lastRequestTimeRef.current,
        });
        return [];
      }

      lastRequestTimeRef.current = now;

      // 이미 로딩 중이면 중복 요청 방지
      if (loadingPageRef.current) {
        console.log("메시지 로드 요청 무시: 이미 로딩 중", { pageNum });
        return [];
      }

      // 현재 활성화된 채팅방 ID 저장
      const currentRoomId = activeRoom?.id;
      currentRoomIdRef.current = currentRoomId;

      if (!currentRoomId) {
        console.log("활성화된 채팅방이 없음");
        return [];
      }

      loadingPageRef.current = true;
      setIsLoading(true);
      setLoadingMsg(true);

      try {
        console.log(
          `메시지 로드 시작: 페이지 ${pageNum}, 크기 ${pageSize}, ID ${currentRoomId}`
        );

        // 직접 API 호출
        const result = await fetchPost("/chat/message", {
          roomId: currentRoomId,
          page: pageNum,
          size: pageSize,
          sortDirection: "DESC",
        });

        // 요청 중에 채팅방이 변경되었는지 확인
        if (currentRoomIdRef.current !== currentRoomId) {
          console.log("채팅방이 변경되어 결과 무시");
          return [];
        }

        if (result && result.result && result.response.data) {
          // 메시지 역순 정렬 (최신 메시지가 아래에 표시되도록)
          const sortedMessages = [...result.response.data].reverse();
          console.log(`메시지 로드 완료: ${sortedMessages.length}개 로드됨`);

          // 더 로드할 메시지가 없는 경우
          if (sortedMessages.length < pageSize) {
            setHasMore(false);
            setHasMoreMessages(false);
          }

          // 페이지가 0이면 메시지 교체, 아니면 기존 메시지 앞에 추가
          if (pageNum === 0) {
            setMessages(sortedMessages);
            setScrollMessages(sortedMessages);
          } else {
            setMessages((prev) => {
              const existingMessageIds = new Set(prev.map((m) => m.id));
              const newMessages = sortedMessages.filter(
                (m) => !existingMessageIds.has(m.id)
              );
              return [...newMessages, ...prev];
            });
            setScrollMessages((prev) => {
              const existingMessageIds = new Set(prev.map((m) => m.id));
              const newMessages = sortedMessages.filter(
                (m) => !existingMessageIds.has(m.id)
              );
              return [...newMessages, ...prev];
            });
          }

          return sortedMessages;
        }

        // 결과가 없는 경우
        if (pageNum === 0) {
          setMessages([]);
          setScrollMessages([]);
        }

        return [];
      } catch (err) {
        console.error(`메시지 조회 실패: ${err.message}`, err);
        return [];
      } finally {
        setIsLoading(false);
        setLoadingMsg(false);
        loadingPageRef.current = false;
      }
    },
    [activeRoom?.id, fetchPost, setMessages, setLoadingMsg]
  );

  // 무한 스크롤 구현 - 개선된 fetchMessages 함수
  const fetchMessages = useCallback(
    async (pageParam) => {
      console.log(`무한 스크롤 페이지 요청: ${pageParam}`);
      setIsFetchingNextPage(true);

      const scrollContainer = scrollRef.current;
      const oldScrollHeight = scrollContainer
        ? scrollContainer.scrollHeight
        : 0;
      const oldScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;

      const result = await loadMessages(pageParam - 1); // pageNum is 0-indexed in loadMessages
      setIsFetchingNextPage(false);

      if (result && result.length > 0 && scrollContainer) {
        requestAnimationFrame(() => {
          const newScrollHeight = scrollContainer.scrollHeight;
          const scrollOffset = newScrollHeight - oldScrollHeight;
          if (scrollOffset > 0) {
            scrollContainer.scrollTop = oldScrollTop + scrollOffset;
            console.log(
              "Scroll position adjusted after fetching older messages:",
              {
                oldScrollTop,
                newScrollHeight,
                oldScrollHeight,
                newScrollTop: scrollContainer.scrollTop,
              }
            );
          }
        });
      }

      return result;
    },
    [loadMessages]
  );

  // 스크롤을 맨 아래로 이동시키는 함수
  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) return;

    const scrollContainer = scrollRef.current;

    // 스크롤 위치를 맨 아래로 설정
    if (scrollContainer) {
      // DOM 업데이트 후 적용하기 위해 requestAnimationFrame 사용
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        console.log("스크롤 실행됨:", scrollContainer.scrollHeight);
      });
    }
  }, []);
  // 메시지 목록이 변경될 때 자동 스크롤 관리
  useEffect(() => {
    // 새 메시지가 추가되었을 때만 스크롤
    if (
      displayMessages.length > 0 &&
      lastMessageIdRef.current !== displayMessages[displayMessages.length - 1]?.id
    ) {
      lastMessageIdRef.current = displayMessages[displayMessages.length - 1]?.id;

      // 자동 스크롤이 활성화된 경우만 스크롤
      if (autoScroll) {
        // 초기 스크롤 시도
        scrollToBottom();

        // DOM 업데이트를 위한 충분한 시간 제공 (300ms)
        const timeoutId = setTimeout(() => {
          scrollToBottom();
        }, 600);

        // 1초 후 한 번 더 시도 (렌더링 지연이 있을 경우 대비)
        const finalTimeoutId = setTimeout(() => {
          scrollToBottom();
        }, 1000);

        return () => {
          clearTimeout(timeoutId);
          clearTimeout(finalTimeoutId);
        };
      }
    }
  }, [displayMessages, autoScroll, scrollToBottom]);

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(
    (event) => {
      // 스크롤 이벤트가 아닌 경우 무시 (예: 마우스 클릭)
      if (event.type !== "scroll") return;

      const container = event.currentTarget;
      // 200px 마진으로 하단 근처 판단 (값 증가)
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        200;

      // 이전 상태와 다른 경우에만 상태 업데이트
      if (autoScroll !== isNearBottom) {
        setAutoScroll(isNearBottom);
        console.log("자동 스크롤 상태 변경:", isNearBottom);
      }

      // 무한 스크롤 처리 - 상단에 가까워지면 이전 메시지 로드
      if (
        container.scrollTop < 100 &&
        hasMoreMessages &&
        !isScrollLoading &&
        !isFetchingNextPage
      ) {
        setIsScrollLoading(true);
        // 다음 페이지 로드
        const nextPage =
          Math.ceil(scrollMessages.length / pageSizeRef.current) + 1;
        fetchMessages(nextPage).finally(() => {
          setIsScrollLoading(false);
        });
      }
    },
    [
      autoScroll,
      setAutoScroll,
      hasMoreMessages,
      isScrollLoading,
      isFetchingNextPage,
      scrollMessages.length,
      fetchMessages,
    ]
  );

  // 메뉴 위치 최적화 및 화면 경계 감지 함수
  const calculateMenuPosition = useCallback(
    (x, y, bubbleRect, isOwnMessage) => {
      // 화면 크기 가져오기
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // 메뉴 크기 (실제 측정 또는 예상값)
      const menuWidth = menuSizeRef.current.width;
      const menuHeight = menuSizeRef.current.height;

      // 기본 위치 (메시지 박스 중앙 하단)
      let posX = x;
      let posY = y;
      let position = "bottom"; // 기본 위치는 아래쪽

      // 메시지 박스 위치 정보가 있는 경우
      if (bubbleRect) {
        // 화면 하단에 가까운 경우 메뉴를 위쪽에 표시
        const spaceBelow = windowHeight - bubbleRect.bottom;
        const spaceAbove = bubbleRect.top;

        if (spaceBelow < menuHeight + 10 && spaceAbove > menuHeight + 10) {
          // 아래 공간이 부족하고 위 공간이 충분하면 위에 표시
          position = "top";
          posY = bubbleRect.top - 5; // 메시지 박스 위쪽에 약간의 여백 추가
        } else {
          // 그 외에는 아래에 표시
          position = "bottom";
          posY = bubbleRect.bottom + 5; // 메시지 박스 아래쪽에 약간의 여백 추가
        }

        // 좌우 위치 조정 (화면 밖으로 나가지 않도록)
        // 메뉴가 화면 왼쪽으로 나가는 경우
        if (posX - menuWidth / 2 < 10) {
          posX = 10 + menuWidth / 2; // 왼쪽 여백 확보
        }

        // 메뉴가 화면 오른쪽으로 나가는 경우
        if (posX + menuWidth / 2 > windowWidth - 10) {
          posX = windowWidth - 10 - menuWidth / 2; // 오른쪽 여백 확보
        }

        // 자신의 메시지인 경우 위치 조정 (오른쪽 정렬)
        if (isOwnMessage) {
          // 자신의 메시지는 오른쪽에 있으므로 메뉴도 오른쪽에 정렬
          posX = Math.min(posX, bubbleRect.right - menuWidth / 4);
        } else {
          // 상대방 메시지는 왼쪽에 있으므로 메뉴도 왼쪽에 정렬
          posX = Math.max(posX, bubbleRect.left + menuWidth / 4);
        }
      } else {
        // 메시지 박스 위치 정보가 없는 경우 기본 위치 조정

        // 화면 하단에 가까운 경우
        if (windowHeight - posY < menuHeight + 10) {
          position = "top";
          posY = Math.max(10, posY - menuHeight - 10);
        }

        // 화면 좌우 경계 확인
        if (posX - menuWidth / 2 < 10) {
          posX = 10 + menuWidth / 2;
        }

        if (posX + menuWidth / 2 > windowWidth - 10) {
          posX = windowWidth - 10 - menuWidth / 2;
        }
      }

      return { x: posX, y: posY, position };
    },
    []
  );

  // 컨텍스트 메뉴 표시 함수
  const handleContextMenu = useCallback(
    (e, messageId) => {
      // 메시지 찾기
      const message = messages.find((m) => m.id === messageId);

      // 삭제되거나 임시 메시지는 컨텍스트 메뉴 표시하지 않음
      if (!message || message.deleted || message.isTemp) return;

      e.preventDefault();

      // 메시지 박스의 위치 정보가 있으면 사용
      const bubbleRect = e.bubbleRect || null;
      const isOwnMessage = message.senderId === user?.userId || e.isOwnMessage;

      // 메뉴 위치 계산
      const { x, y, position } = calculateMenuPosition(
        e.clientX,
        e.clientY,
        bubbleRect,
        isOwnMessage
      );

      setContextMenu({
        visible: true,
        x,
        y,
        messageId,
        isOwnMessage,
        bubbleRect,
        position,
      });
    },
    [messages, user?.userId, calculateMenuPosition]
  );

  // 컨텍스트 메뉴 닫기 함수
  const closeContextMenu = useCallback(() => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      messageId: null,
      bubbleRect: null,
      position: "bottom",
      isOwnMessage: false,
    });
  }, []);

  // 컨텍스트 메뉴 외부 클릭 감지를 위한 useEffect 추가
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target)
      ) {
        closeContextMenu();
      }
    };

    if (contextMenu.visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenu.visible, closeContextMenu]);

  // 컨텍스트 메뉴 크기 측정을 위한 useEffect
  const [menuSize, setMenuSize] = useState({ width: 120, height: 120 });

  useEffect(() => {
    if (contextMenuRef.current && contextMenu.visible) {
      const rect = contextMenuRef.current.getBoundingClientRect();
      setMenuSize({
        width: rect.width,
        height: rect.height,
      });

      // 메뉴 크기가 변경되었으면 위치 재계산
      const { x, y, position } = calculateMenuPosition(
        contextMenu.x,
        contextMenu.y,
        contextMenu.bubbleRect,
        contextMenu.isOwnMessage
      );

      // 위치가 변경되었으면 상태 업데이트
      if (
        x !== contextMenu.x ||
        y !== contextMenu.y ||
        position !== contextMenu.position
      ) {
        setContextMenu((prev) => ({
          ...prev,
          x,
          y,
          position,
        }));
      }
    }
  }, [
    contextMenu.visible,
    contextMenu.x,
    contextMenu.y,
    contextMenu.bubbleRect,
    contextMenu.isOwnMessage,
    calculateMenuPosition,
  ]);

  // 새 채팅방이 선택될 때 메시지 로드
  useEffect(() => {
    if (activeRoom?.id) {
      // 상태 초기화
      setIsLoading(true);
      setHasMore(true);
      setHasMoreMessages(true);
      setIsFirstLoad(true);
      setAutoScroll(true);
      loadingPageRef.current = false;
      lastRequestTimeRef.current = 0;

      setMessages([]);
      setScrollMessages([]);

      // 스크롤 실행
      scrollToBottom();

      // 메시지 직접 로드
      const handleMessages = async () => {
        try {
          const startTime = Date.now();
          await loadMessages(0, pageSizeRef.current);
          setIsLoading(false);
          setIsFirstLoad(false);
          const loadingTime = Date.now() - startTime;
          console.log(`메시지 로딩에 ${loadingTime}ms 걸렸습니다`);
        } catch (error) {
          console.error(
            `Error fetching initial messages for room ${activeRoom.id}:`,
            error
          );
        }
      };

      handleMessages();

      return () => {
        currentRoomIdRef.current = null;
        lastMessageIdRef.current = null;
      };
    }
  }, [activeRoom?.id]);

  // 날짜 포맷 함수
  const formatMessageTime = useCallback((isoDateString) => {
    try {
      const date = new Date(isoDateString);
      const now = new Date();

      // 오늘 보낸 메시지는 시간만 표시
      if (date.toDateString() === now.toDateString()) {
        return format(date, "HH:mm", { locale: ko });
      }

      // 어제 보낸 메시지
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return format(date, "HH:mm", { locale: ko });
      }

      // 그 외 날짜 표시
      return format(date, "HH:mm", { locale: ko });
    } catch (e) {
      console.error("날짜 형식 에러:", e);
      return "날짜 정보 없음";
    }
  }, []);

  // 메시지 수정 처리 함수
  const handleEditMessage = useCallback(
    (message, newContent) => {
      editMessage(message.id, newContent);
    },
    [editMessage]
  );

  // 메시지 삭제 처리 함수
  const handleDeleteMessage = useCallback(
    (messageId) => {
      deleteMessage(messageId);
    },
    [deleteMessage]
  );

  // GIF 파일 확장자 확인 함수
  const isGifFile = useCallback((fileName) => {
    return fileName && fileName && fileName.toLowerCase().endsWith(".gif");
  }, []);

  // 멘션 처리 함수 - 메시지 내용에서 멘션을 하이라이트
  const renderMessageWithMentions = useCallback((content) => {
    if (!content) return null;

    // 멘션 패턴이 있는지 먼저 확인
    const mentionRegex = /@(\S+)/g;
    if (!mentionRegex.test(content)) {
      // 멘션이 없으면 원본 문자열 그대로 반환 (줄바꿈 보존)
      return content;
    }

    // 멘션이 있는 경우 JSX 처리
    mentionRegex.lastIndex = 0; // 정규식 리셋
    const parts = [];
    let lastIndex = 0;
    let match;

    // 멘션 패턴 찾기
    while ((match = mentionRegex.exec(content)) !== null) {
      // 멘션 앞 텍스트 추가
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }

      // 멘션 부분 추가 (하이라이트)
      parts.push(
        <span
          key={`mention-${match.index}`}
          className="bg-[#FFF8E1] text-[#FF8F00] px-1 rounded"
        >
          {match[0]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // 남은 텍스트 추가
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>
      );
    }

    return parts.length > 0 ? parts : content;
  }, []);

  // 현재 사용자가 멘션되었는지 확인
  const isUserMentioned = useCallback(
    (message) => {
      if (!user?.userId || !message.content) return false;

      // 사용자 닉네임 가져오기
      const userNickname = user.displayName || user.nickname;
      if (!userNickname) return false;

      // 멘션 패턴 확인 (@사용자명)
      const mentionPattern = new RegExp(`@${userNickname}\\b`, "i");
      return mentionPattern.test(message.content);
    },
    [user]
  );

  // 파일 타입 분류 함수
  const getAttachmentType = useCallback(
    (attachment) => {
      if (
        attachment.fileType === "image" ||
        (attachment.fileName && isGifFile(attachment.fileName))
      ) {
        return "image";
      } else if (attachment.fileType === "video") {
        return "video";
      } else {
        return "file";
      }
    },
    [isGifFile]
  );

  // 선택 복사 다이얼로그를 위한 이벤트 리스너
  useEffect(() => {
    // 선택 복사 다이얼로그를 열기 위한 이벤트 리스너
    const handleOpenSelectionCopyDialog = (event) => {
      const { text } = event.detail;
      setSelectionCopyDialog({
        isOpen: true,
        selectedText: text,
      });
    };

    // 웹소켓 메시지 수신 이벤트 리스너
    const handleWebSocketMessageEvent = (event) => {
      if (event.detail) {
        handleWebSocketMessage(event.detail);
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener(
      "openSelectionCopyDialog",
      handleOpenSelectionCopyDialog
    );
    window.addEventListener("websocketMessage", handleWebSocketMessageEvent);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener(
        "openSelectionCopyDialog",
        handleOpenSelectionCopyDialog
      );
      window.removeEventListener(
        "websocketMessage",
        handleWebSocketMessageEvent
      );
    };
  }, [handleWebSocketMessage]);
  // 드래그 앤 드롭 핸들러
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 드래그가 컨테이너 밖으로 완전히 나갔는지 확인
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // MessageInput 컴포넌트의 handleFileSelect 함수를 호출하기 위해 커스텀 이벤트 발생
      const filesArray = Array.from(files);
      
      // 파일 타입별로 분류
      const imageFiles = filesArray.filter(file => file.type.startsWith('image/'));
      const videoFiles = filesArray.filter(file => file.type.startsWith('video/'));
      const documentFiles = filesArray.filter(file => 
        !file.type.startsWith('image/') && !file.type.startsWith('video/')
      );

      // 각 타입별로 파일 선택 이벤트 발생
      if (imageFiles.length > 0) {
        window.dispatchEvent(new CustomEvent('dropFiles', { 
          detail: { files: imageFiles, type: 'image' } 
        }));
      }
      if (videoFiles.length > 0) {
        window.dispatchEvent(new CustomEvent('dropFiles', { 
          detail: { files: videoFiles, type: 'video' } 
        }));
      }
      if (documentFiles.length > 0) {
        window.dispatchEvent(new CustomEvent('dropFiles', { 
          detail: { files: documentFiles, type: 'file' } 
        }));
      }
    }
  }, []);  return (
    <div 
      className="h-full w-full bg-white flex flex-col overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >{isDragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-2xl mb-4">📁</div>
            <p className="text-lg font-medium">파일을 여기에 드롭하세요</p>
            <p className="text-sm text-gray-500 mt-2">이미지, 동영상, 문서를 업로드할 수 있습니다</p>
          </div>
        </div>
      )}
      
      {/* ChatMain 내용 */}
      {!activeRoom ? (
        <div className="flex-1 flex flex-col items-center justify-center h-full bg-white py-12 px-4 sm:px-6 md:px-8 text-center">   
          <span className="mb-4 text-4xl sm:text-5xl">💬</span>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
            채팅방을 선택해주세요
          </h2>
          <div className="mx-auto max-w-md">
            <p className="text-gray-500 mb-6 text-sm sm:text-base">
              왼쪽 사이드바에서 참여할 채팅방을 선택하면 메시지가 여기에
              표시됩니다. 친구들과의 대화를 시작해보세요.
            </p>
          </div>
          <div className="flex flex-col gap-3 max-w-sm bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 font-medium">이용 방법</p>
            <ul className="text-left text-sm text-gray-500 list-disc pl-5 space-y-1">
              <li>왼쪽 사이드바에서 기존 채팅방을 선택하세요</li>
              <li>새 채팅방을 만들어 친구들과 대화할 수 있습니다</li>
              <li>친구 목록에서 대화할 친구를 선택해도 됩니다</li>
            </ul>
          </div>
        </div>
      ) : isLoadingMsg && isFirstLoad ? (
        <div className="flex-1 flex flex-col h-100 bg-[#FFFFFF] p-4">
          <div className="w-full max-w-md mx-auto mb-6">
            <div className="h-6 bg-gray-200 rounded-md animate-pulse mb-2 w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded-md animate-pulse w-3/4"></div>
          </div>
          <div className="w-full max-w-md mx-auto space-y-4">
            <div className="flex items-center justify-center my-4">
              <div className="w-20 h-5 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={`skeleton-other-${i}`} className="flex items-start">
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                <div className="flex flex-col">
                  <div className="h-4 bg-gray-200 rounded-md animate-pulse w-20 mb-1"></div>
                  <div className="h-16 bg-gray-200 rounded-lg animate-pulse w-48"></div>
                </div>
              </div>
            ))}
            {[1, 2].map((i) => (
              <div key={`skeleton-my-${i}`} className="flex justify-end">
                <div className="h-12 bg-gray-100 rounded-lg animate-pulse w-40"></div>
              </div>
            ))}
            <div className="flex items-start">
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse mr-3"></div>
              <div className="flex flex-col">
                <div className="h-4 bg-gray-200 rounded-md animate-pulse w-20 mb-1"></div>
                <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-56 mb-2"></div>
                <div className="h-32 w-48 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      ) : scrollMessages.length === 0 && !isLoadingMsg ? (
        <div className="flex-1 flex flex-col h-100 items-center justify-center bg-[#FFFFFF]">
          <p className="text-gray-800 mb-2">
            메시지가 없습니다. 첫 메시지를 보내보세요!
          </p>
          <button
            className="flex items-center text-[#FFC107] hover:text-[#FFB300] bg-[#F5F5F5] px-4 py-2 rounded-lg"
            onClick={() => {
              setIsLoading(true);
              setIsFirstLoad(true);
              loadMessages(0, pageSizeRef.current).finally(() => {
                setIsLoading(false);
                setIsFirstLoad(false);
                scrollToBottom();
              });
            }}
          >
            <RefreshCw size={16} className="mr-2" />
            새로고침
          </button>
        </div>
      ) : (        <div
          className="flex-1 p-3 md:p-4 relative overflow-y-auto bg-[#FFFFFF] min-h-0"
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            margin: "0 auto",
            width: "100%",
          }}
        >
          {hasMoreMessages && (
            <div
              ref={infiniteScrollRef}
              className="flex justify-center py-2 w-full"
              style={{
                height: isScrollLoading || isFetchingNextPage ? "60px" : "20px",
                opacity: isScrollLoading || isFetchingNextPage ? 1 : 0.5,
                transition: "height 0.3s, opacity 0.3s",
                marginBottom: "10px",
              }}
            >
              {isScrollLoading || isFetchingNextPage ? (
                <div className="w-full max-w-md flex flex-col space-y-2">
                  <div className="h-4 bg-gray-200 rounded-md animate-pulse w-1/4 mx-auto"></div>
                  <div className="flex items-start">
                    <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse mr-2"></div>
                    <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-32"></div>
                  </div>
                </div>
              ) : (
                <div className="h-4 w-4 bg-[#F5F5F5] rounded-full" />
              )}
            </div>
          )}
          {(() => {
            const messagesByDate = {};
            scrollMessages.forEach((message) => {
              const messageDate = new Date(message.sentAt)
                .toISOString()
                .split("T")[0];
              if (!messagesByDate[messageDate]) {
                messagesByDate[messageDate] = [];
              }
              messagesByDate[messageDate].push(message);
            });
            const sortedDates = Object.keys(messagesByDate).sort();
            return sortedDates.map((date) => {
              const dateObj = new Date(date);
              const now = new Date();
              const yesterday = new Date(now);
              yesterday.setDate(yesterday.getDate() - 1);
              let formattedDate;
              if (dateObj.toDateString() === now.toDateString()) {
                formattedDate = "오늘";
              } else if (dateObj.toDateString() === yesterday.toDateString()) {
                formattedDate = "어제";
              } else {
                formattedDate = format(dateObj, "yyyy년 MM월 dd일", { locale: ko });
              }
              return (
                <div key={date} className="mb-6">
                  <div className="flex items-center justify-center my-4">
                    <div className="px-3 py-1 bg-[#F5F5F5] rounded-full text-xs text-gray-500 font-medium">
                      {formattedDate}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {messagesByDate[date].map((message, index) => {
                      const mentioned = isUserMentioned(message);
                      return (
                        <MessageItem
                          key={`${message.id}-${index}`}
                          message={message}
                          index={index}
                          user={user}
                          activeRoom={activeRoom}
                          mentioned={mentioned}
                          formatMessageTime={formatMessageTime}
                          renderMessageWithMentions={renderMessageWithMentions}
                          handleContextMenu={handleContextMenu}
                          getAttachmentType={getAttachmentType}
                          isGifFile={isGifFile}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
          {!autoScroll && (
            <button
              className="fixed bottom-16 md:bottom-20 right-4 md:right-10 bg-[#0284c7] text-white rounded-full px-3 py-1.5 md:px-4 md:py-2 shadow-lg opacity-90 hover:opacity-100 z-10 text-sm md:text-base"
              onClick={() => {
                scrollToBottom();
                setAutoScroll(true);
              }}
            >
              최신 메시지로 이동
            </button>
          )}
          {contextMenu.visible && (
            <div
              ref={contextMenuRef}
              className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-fadeIn"
              style={{
                top:
                  contextMenu.position === "bottom" ? `${contextMenu.y}px` : "auto",
                bottom:
                  contextMenu.position === "top"
                    ? `${window.innerHeight - contextMenu.y}px`
                    : "auto",
                left: `${contextMenu.x}px`,
                transform: "translate(-50%, 0)",
                minWidth: "120px",
                transformOrigin:
                  contextMenu.position === "top" ? "bottom center" : "top center",
              }}
            >
              {contextMenu.isOwnMessage && (
                <>
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 text-red-500"
                    onClick={() => {
                      if (window.confirm("정말 메시지를 삭제하시겠습니까?")) {
                        handleDeleteMessage(contextMenu.messageId);
                      }
                      closeContextMenu();
                    }}
                  >
                    <Trash2 size={14} className="mr-2" />
                    삭제하기
                  </button>
                </>
              )}
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 text-blue-500"
                onClick={() => {
                  const message = messages.find(
                    (m) => m.id === contextMenu.messageId
                  );
                  if (message) {
                    const replyEvent = new CustomEvent("replyToMessage", {
                      detail: {
                        messageId: message.id,
                        content: message.content,
                        senderName: message.senderName,
                        replyTo: user.userId,
                      },
                    });
                    window.dispatchEvent(replyEvent);
                  }
                  closeContextMenu();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <polyline points="9 17 4 12 9 7"></polyline>
                  <path d="M20 18v-2a4 4 0 0 0-4-4H4a4 4 0 0 0-4 4v2"></path>
                </svg>
                답장하기
              </button>
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 text-green-500"
                onClick={() => {
                  const message = messages.find(
                    (m) => m.id === contextMenu.messageId
                  );
                  if (message) {
                    navigator.clipboard.writeText(message.content);
                    alert("메시지가 복사되었습니다!");
                  }
                  closeContextMenu();
                }}
              >
                <Copy size={14} className="mr-2" />
                복사하기
              </button>
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 text-blue-500"
                onClick={() => {
                  const message = messages.find(
                    (m) => m.id === contextMenu.messageId
                  );
                  if (message) {
                    closeContextMenu();
                    const openSelectionCopyEvent = new CustomEvent(
                      "openSelectionCopyDialog",
                      {
                        detail: {
                          text: message.content,
                        },
                      }
                    );
                    window.dispatchEvent(openSelectionCopyEvent);
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                선택복사
              </button>
            </div>
          )}
          <SelectionCopyDialog
            isOpen={selectionCopyDialog.isOpen}
            onOpenChange={(isOpen) =>
              setSelectionCopyDialog((prev) => ({ ...prev, isOpen }))
            }
            selectedText={selectionCopyDialog.selectedText}
          />
        </div>
      )}
    </div>
  );
};


