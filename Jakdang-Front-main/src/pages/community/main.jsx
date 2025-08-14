"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useChatService } from "@/hooks/useChatService"
import { useDiscordService } from "@/hooks/useDiscordService"
import { userInfoAtom } from "@/jotai/authAtoms"
import { activeCategoryAtom, activeChannelAtom, isLoadingMessagesAtom, messagesAtom } from "@/jotai/chatAtoms"
import { ProfileActionModal } from "@/components/modal/ProfileActionModal"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { useAtom } from "jotai"
import { Earth, Edit, FileIcon, RefreshCw, Trash2 } from "lucide-react"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"

// 현재 열린 프로필 메뉴 ID를 추적하는 전역 변수 추가 (파일 상단에 추가)
let openProfileMenuId = null

// 이미지 컴포넌트를 최적화하기 위한 메모이제이션 컴포넌트 추가
const MemoizedImage = memo(function MemoizedImage({ src, alt, className, onClick }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={`relative ${className || ""} ${!loaded ? "bg-gray-100" : ""}`}>
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        className={`${className || ""} ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
        onLoad={() => setLoaded(true)}
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()} // 컨텍스트 메뉴(롱 프레스) 방지
        style={{ WebkitTouchCallout: "none", userSelect: "none" }} // iOS에서 롱 프레스 방지
      />
      {!loaded && <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-md"></div>}
    </div>
  )
})

// 첨부 파일 컴포넌트 분리
const AttachmentContent = memo(function AttachmentContent({ attachments, getAttachmentType, isGifFile }) {
  if (!attachments || attachments.length === 0) return null

  const imageAttachments = attachments.filter(
    (att) => att.fileType === "image" || (att.fileName && isGifFile(att.fileName)),
  )
  const videoAttachments = attachments.filter((att) => att.fileType === "video")
  const fileAttachments = attachments.filter(
    (att) => att.fileType !== "image" && att.fileType !== "video" && !(att.fileName && isGifFile(att.fileName)),
  )

  return (
    <div className="mt-2">
      {/* 이미지 그리드 표시 */}
      {imageAttachments.length > 0 && (
        <div
          className={`relative w-full ${
            imageAttachments.length === 1 ? "max-w-[400px]" : "max-w-[400px]"
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
                className={`relative ${imageAttachments.length === 3 && index === 0 ? "col-span-2" : ""} ${
                  imageAttachments.length <= 2 ? "aspect-[4/3]" : "aspect-square"
                }`}
              >
                <div className="relative h-full w-full overflow-hidden rounded-md border border-[#E0E0E0] bg-white">
                  <MemoizedImage
                    src={attachment.fileUrl}
                    alt={attachment.fileName || "첨부 이미지"}
                    className="object-cover w-full h-full cursor-pointer"
                    onClick={() => {
                      // 이미지 클릭 시 모달 열기 로직 추가
                      window.openImageModal?.(imageAttachments, index)
                    }}
                  />
                </div>
              </div>
            ))}

            {/* 추가 이미지가 있는 경우 더보기 버튼 표시 */}
            {imageAttachments.length > 4 && (
              <div
                className="absolute bottom-0 right-0 w-[calc(50%-2px)] h-[calc(50%-2px)] flex items-center justify-center cursor-pointer"
                onClick={() => window.openImageModal?.(imageAttachments, 3)}
              >
                <div className="absolute inset-0 bg-black bg-opacity-60 rounded-md flex items-center justify-center">
                  <span className="text-white text-xl font-bold">+{imageAttachments.length - 3}</span>
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
                <video src={attachment.fileUrl} controls className="w-full max-h-[300px]" preload="metadata">
                  <source src={attachment.fileUrl} type="video/mp4" />
                  <source src={attachment.fileUrl} type="video/webm" />
                  <source src={attachment.fileUrl} type="video/ogg" />
                  브라우저가 동영상 재생을 지원하지 않습니다.
                </video>
              </div>
              <div className="text-xs text-gray-400 mt-1 truncate">{attachment.fileName || "동영상"}</div>
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
              <FileIcon size={14} className="mr-2 text-[#5865F2]" />
              <span className="truncate max-w-[180px]">{attachment.fileName || "파일"}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
})

// 메시지 컴포넌트 분리
const MessageItem = memo(function MessageItem({
  message,
  index,
  user,
  activeCategory,
  mentioned,
  formatMessageTime,
  renderMessageWithMentions,
  handleContextMenu,
  getAttachmentType,
  isGifFile,
  handleAvatarClick,
}) {  const senderId = message.senderId

  // MessageItem 컴포넌트에 프로필 메뉴 관련 상태와 로직 추가 (기존 프로필 메뉴는 제거)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef(null)
  const avatarRef = useRef(null)
  const profileMenuPositionRef = useRef({ top: 0, left: 0 })

  // MessageItem 컴포넌트 내에 useEffect 추가
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false)
      }
    }

    // 전역 이벤트 리스너 - 다른 프로필 메뉴가 열릴 때 현재 메뉴 닫기
    const handleCloseAllMenus = () => {
      setShowProfileMenu(false)
      // 메뉴가 닫힐 때 전역 변수도 초기화
      if (openProfileMenuId === senderId) {
        openProfileMenuId = null
      }
    }

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("touchstart", handleClickOutside)
    }    // 전역 이벤트 리스너 추가
    document.addEventListener("closeProfileMenus", handleCloseAllMenus)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
      document.removeEventListener("closeProfileMenus", handleCloseAllMenus)
    }
  }, [showProfileMenu, senderId])

  // 멤버 정보 가져오기
  const member = activeCategory?.channelMembers?.find((m) => m.userId === senderId || m.id === senderId)

  const imageUrl = member?.image || message.senderPhotoUrl
  const hasImage = !!member?.image
  const backgroundColor = member?.backgroundColor || "#FFC107"
  const fallbackText = message.senderName ? message.senderName.charAt(0).toUpperCase() : "UN"

  const [longPressTriggered, setLongPressTriggered] = useState(false)
  const timerRef = useRef(null)
  const messageBubbleRef = useRef(null)

  // 터치 이벤트 핸들러 (모바일)
  const handleTouchStart = (event) => {
    // 본인 메시지만 롱 프레스 허용
    if (message.senderId !== user?.userId || message.deleted || message.isTemp) return

    timerRef.current = setTimeout(() => {
      setLongPressTriggered(true)
      handleContextMenuCustom(event) // 컨텍스트 메뉴 표시
    }, 600)
  }

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setLongPressTriggered(false)
  }

  // 마우스 이벤트 핸들러 (데스크톱)
  const handleMouseDown = (event) => {
    // 본인 메시지만 롱 프레스 허용
    if (message.senderId !== user?.userId || message.deleted || message.isTemp) return

    timerRef.current = setTimeout(() => {
      setLongPressTriggered(true)
      handleContextMenuCustom(event) // 컨텍스트 메뉴 표시
    }, 600)
  }

  const handleMouseUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setLongPressTriggered(false)
  }

  // 롱프레스 시 실제로 컨텍스트 메뉴를 표시하도록 수정
  const handleContextMenuCustom = (event) => {
    // 메시지 박스의 위치 정보 가져오기
    if (messageBubbleRef.current) {
      const rect = messageBubbleRef.current.getBoundingClientRect()

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
        message.id,
      )
    }
  }

  // 우클릭 핸들러 추가
  const handleRightClick = (e) => {
    e.preventDefault()
    // 본인 메시지만 컨텍스트 메뉴 표시
    if (message.senderId !== user?.userId || message.deleted || message.isTemp) return

    // 롱프레스와 동일한 방식으로 메뉴 표시
    handleContextMenuCustom(e)
  }

  return (
    <div
      key={`${message.id}-${index}`}
      id={`message-${message.id}`}
      className={`flex group ${mentioned ? "bg-[#FFF8E1] p-2 rounded-lg" : ""} ${
        message.senderId === user?.userId ? "justify-start" : "justify-start"
      } mb-4 hover:bg-[#F7F7F8]`}
      onContextMenu={handleRightClick} // 우클릭 핸들러 변경
      onTouchStart={handleTouchStart} // 모바일 터치 시작
      onTouchEnd={handleTouchEnd} // 모바일 터치 끝
      onTouchMove={handleTouchEnd} // 터치 이동 시에도 롱프레스 취소
      onMouseDown={handleMouseDown} // 데스크톱 마우스 다운
      onMouseUp={handleMouseUp} // 데스크톱 마우스 업
      onMouseLeave={handleMouseUp} // 마우스가 요소를 벗어나면 롱프레스 취소
    >
      {/* 모든 메시지에 아바타 표시 */}
      <div className="relative">
        <Avatar
          ref={avatarRef}
          className={`h-8 w-8 md:h-10 md:w-10 mr-2 md:mr-3 mt-0.5 shadow-sm flex-shrink-0 ${
            hasImage ? "" : "border-2"
          } cursor-pointer`}
          style={{
            borderColor: hasImage ? "transparent" : backgroundColor,
          }}
          onClick={(e) => handleAvatarClick && handleAvatarClick(e, senderId)}
        >
          <AvatarImage src={imageUrl || "/placeholder.svg"} />
          <AvatarFallback className="text-white" style={{ backgroundColor }}>
            {fallbackText}
          </AvatarFallback>
        </Avatar>

        {/* 프로필 메뉴 - 아바타 바로 아래에 표시 */}
        {showProfileMenu && (
          <div
            ref={profileMenuRef}
            className="absolute z-50 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
            style={{
              top: "10%", // 아바타 바로 아래
              left: 0,
              minWidth: "120px",
            }}
          >
            <Link
              to={`/profile/${senderId}`}
              className="flex items-center w-full px-4 py-2 bg-white-100 text-sm text-left hover:bg-gray-100 text-gray-700"
              onClick={() => {
                setShowProfileMenu(false)
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              프로필 보기
            </Link>
          </div>
        )}
      </div>

      <div className={`max-w-[90%] min-w-0`} ref={messageBubbleRef}>
        {/* 모든 메시지에 이름과 시간 표시 */}
        <div className="flex items-center gap-2 mb-1 ml-1">
          <span className="text-sm font-medium">{message.senderName || "알 수 없는 사용자"}</span>
          <span className="text-[10px] md:text-xs text-gray-500">{formatMessageTime(message.sentAt)}</span>
          {message.isTemp && <span className="text-xs text-gray-500 italic">전송 중...</span>}
        </div>

        {/* 메시지 내용 - 디스코드 스타일 */}
        <div className={`relative ${message.isTemp ? "opacity-70" : ""}`}>          <p
            className={`text-sm md:text-base ${message.deleted ? "italic text-gray-500" : "text-gray-800"} break-words whitespace-pre-wrap`}
            style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
          >
            {message.deleted ? "삭제된 메시지입니다" : renderMessageWithMentions(message.content)}
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

          {/* 본인 메시지인 경우에만 메뉴 아이콘 표시 */}
          {message.senderId === user?.userId && !message.deleted && !message.isTemp && (
            <button
              className="absolute -right-6 top-0 outline-none opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                handleContextMenuCustom(e)
              }}
            ></button>
          )}
        </div>
      </div>
    </div>
  )
})

export function Main({ autoScroll, setAutoScroll }) {
  const [user] = useAtom(userInfoAtom)
  const [activeCategory] = useAtom(activeCategoryAtom)
  const [activeChannel] = useAtom(activeChannelAtom)
  const [messages, setMessages] = useAtom(messagesAtom)
    // 프로필 모달 관련 상태
  const [profileModal, setProfileModal] = useState({
    isOpen: false,
    member: null,
    position: { x: 0, y: 0 }
  })

  // 아바타 클릭 핸들러
  const handleAvatarClick = useCallback((event, senderId) => {
    if (!senderId) return
    
    const rect = event.currentTarget.getBoundingClientRect()
    setProfileModal({
      isOpen: true,
      member: { id: senderId },
      position: {
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8
      }
    })
  }, [])

  // 웹소켓 메시지 이벤트 리스너 - chatv2와 동일한 방식
  useEffect(() => {
    const handleWebSocketMessage = (event) => {
      const { action, data: messageData } = event.detail;

      if (!messageData || !activeCategory?.id) return;

      // 현재 활성 카테고리의 메시지만 처리
      if (messageData.roomId !== activeCategory.id) return;

      const messageId = messageData.id;

      if (action === "send") {
        setMessages((prev) => {
          // 이미 존재하는 메시지인지 확인 (ID로 체크)
          const existingMsg = prev.find((m) => m.id === messageId && !m.isTemp);
          if (existingMsg) {
            console.log(`이미 존재하는 카테고리 메시지 무시 (ID: ${messageId})`);
            return prev;
          }

          // 임시 메시지를 실제 메시지로 교체
          const tempIdx = prev.findIndex(
            (m) => m.isTemp && m.content === messageData.content
          );
          if (tempIdx >= 0) {
            console.log(`임시 카테고리 메시지를 실제 메시지로 교체 (ID: ${messageId})`);
            const updated = [...prev];
            updated[tempIdx] = messageData;
            return updated;
          }

          // 새 메시지 추가
          console.log(`새 카테고리 메시지 추가 (ID: ${messageId})`);
          return [...prev, messageData];
        });
      } else if (action === "delete") {
        console.log(`카테고리 메시지 삭제 처리 (ID: ${messageId})`);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  deleted: true,
                  content: "삭제된 메시지입니다.",
                  deletedAt: messageData.deletedAt,
                }
              : msg
          )
        );
      } else if (action === "edit") {
        console.log(`카테고리 메시지 수정 처리 (ID: ${messageId})`);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: messageData.content }
              : msg
          )
        );
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener("websocketMessage", handleWebSocketMessage);

    // 정리 함수
    return () => {
      window.removeEventListener("websocketMessage", handleWebSocketMessage);
    };
  }, [activeCategory?.id, setMessages])

  // 컨텍스트 메뉴 상태 - 컴포넌트 최상위 레벨로 이동
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    messageId: null,
    bubbleRect: null,
    position: "bottom", // 메뉴 위치 (top 또는 bottom)
    isOwnMessage: false,
  })
  const contextMenuRef = useRef(null)
  const menuSizeRef = useRef({ width: 120, height: 120 }) // 메뉴 크기 기본값 (실제 측정 전)

  // 서비스 훅 초기화 - 디스코드 서비스 사용
  const { deleteMessage, editMessage, getMessages } = useChatService(user?.userId)
  const { deleteCategoryMessage, editCategoryMessage, getCategoryMessages } = useDiscordService(user?.userId)

  const scrollRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const lastMessageIdRef = useRef(null)
  const loadingPageRef = useRef(false)
  const lastRequestTimeRef = useRef(0)
  const pageSizeRef = useRef(20) // 한 번에 로드할 메시지 개수 제한

  // 무한 스크롤 관련 상태
  const [isScrollLoading, setIsScrollLoading] = useState(false)
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [scrollMessages, setScrollMessages] = useState([])
  const [isLoadingMsg, setLoadingMsg] = useAtom(isLoadingMessagesAtom)
  const infiniteScrollRef = useRef(null)

  // 메시지 로드 함수 개선 - 페이지 크기 매개변수 추가
  const loadMessages = useCallback(
    async (pageNum, pageSize = pageSizeRef.current) => {
      // 중복 요청 방지 - 200ms 내에 발생한 요청은 무시
      const now = Date.now()
      if (now - lastRequestTimeRef.current < 200) {
        console.log("메시지 로드 요청 무시: 너무 빠른 요청", {
          pageNum,
          timeDiff: now - lastRequestTimeRef.current,
        })
        return []
      }

      lastRequestTimeRef.current = now

      // 이미 로딩 중이면 중복 요청 방지
      if (loadingPageRef.current) {
        console.log("메시지 로드 요청 무시: 이미 로딩 중", { pageNum })
        return []
      }

      // 카테고리가 선택되지 않았으면 로드하지 않음
      if (!activeCategory?.id) return []

      // 현재 활성화된 채팅방 ID 저장
      const currentRoomId = activeCategory?.id

      loadingPageRef.current = true
      setIsLoading(true)

      try {
        const roomId = activeCategory?.id
        console.log(`메시지 로드 시작: 페이지 ${pageNum}, 크기 ${pageSize}, ID ${roomId}`)

        // 요청 중에 채팅방이 변경되었는지 확인
        if (currentRoomId !== activeCategory?.id) {
          console.log("채팅방이 변경되어 요청 취소")
          return []
        }

        const result = await getCategoryMessages(roomId, pageNum, pageSize)

        // 응답 후에도 채팅방이 변경되었는지 다시 확인
        if (currentRoomId !== activeCategory?.id) {
          console.log("응답 수신 후 채팅방이 변경되어 결과 무시")
          return []
        }

        console.log(`메시지 로드 완료: ${result?.length || 0}개 로드됨`)

        // 더 로드할 메시지가 없는 경우
        if (!result || result.length === 0 || result.length < pageSize) {
          console.log("더 이상 로드할 메시지가 없음", { pageNum })
          setHasMore(false)
          setHasMoreMessages(false)
        }

        return result || []
      } catch (error) {
        console.error("메시지 로드 오류:", error)
        return []
      } finally {
        setIsLoading(false)
        loadingPageRef.current = false
      }
    },
    [activeCategory, getCategoryMessages],
  )

  // 무한 스크롤 구현 - 개선된 fetchMessages 함수
  const fetchMessages = useCallback(
    async (pageParam) => {
      console.log(`무한 스크롤 페이지 요청: ${pageParam}`)
      setIsFetchingNextPage(true)

      const scrollContainer = scrollRef.current
      const oldScrollHeight = scrollContainer ? scrollContainer.scrollHeight : 0
      const oldScrollTop = scrollContainer ? scrollContainer.scrollTop : 0

      const result = await loadMessages(pageParam - 1) // pageNum is 0-indexed in loadMessages
      setIsFetchingNextPage(false)

      if (result && result.length > 0) {
        setScrollMessages((prev) => {
          const existingMessageIds = new Set(prev.map((m) => m.id))
          const newMessages = result.filter((m) => !existingMessageIds.has(m.id))
          const combinedMessages = [...newMessages, ...prev]
          return combinedMessages.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt))
        })

        if (scrollContainer) {
          requestAnimationFrame(() => {
            const newScrollHeight = scrollContainer.scrollHeight
            const scrollOffset = newScrollHeight - oldScrollHeight
            if (scrollOffset > 0) {
              scrollContainer.scrollTop = oldScrollTop + scrollOffset
              console.log("Scroll position adjusted after fetching older messages:", {
                oldScrollTop,
                newScrollHeight,
                oldScrollHeight,
                newScrollTop: scrollContainer.scrollTop,
              })
            }
          })
        }
      }

      return result
    },
    [loadMessages, scrollRef],
  )

  // 스크롤을 맨 아래로 이동시키는 함수
  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) return

    const scrollContainer = scrollRef.current

    // 스크롤 위치를 맨 아래로 설정
    if (scrollContainer) {
      // DOM 업데이트 후 적용하기 위해 requestAnimationFrame 사용
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
        console.log("스크롤 실행됨:", scrollContainer.scrollHeight)
      })
    }
  }, [])

  // 메시지 목록이 변경될 때 자동 스크롤 관리
  useEffect(() => {
    // 새 메시지가 추가되었을 때만 스크롤
    if (messages.length > 0 && lastMessageIdRef.current !== messages[messages.length - 1]?.id) {
      lastMessageIdRef.current = messages[messages.length - 1]?.id

      // 자동 스크롤이 활성화된 경우만 스크롤
      if (autoScroll) {
        // 초기 스크롤 시도
        scrollToBottom()

        // DOM 업데이트를 위한 충분한 시간 제공 (300ms)
        const timeoutId = setTimeout(() => {
          scrollToBottom()
        }, 300)

        // 1초 후 한 번 더 시도 (렌더링 지연이 있을 경우 대비)
        const finalTimeoutId = setTimeout(() => {
          scrollToBottom()
        }, 1000)

        return () => {
          clearTimeout(timeoutId)
          clearTimeout(finalTimeoutId)
        }
      }
    }
  }, [messages, autoScroll, scrollToBottom])

  // 스크롤 이벤트 핸들러 - 사용자가 위로 스크롤하면 자동 스크롤 비활성화
  const handleScroll = useCallback(
    (event) => {
      // 스크롤 이벤트가 아닌 경우 무시 (예: 마우스 클릭)
      if (event.type !== "scroll") return

      const container = event.currentTarget
      // 200px 마진으로 하단 근처 판단 (값 증가)
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200

      // 이전 상태와 다른 경우에만 상태 업데이트
      if (autoScroll !== isNearBottom) {
        setAutoScroll(isNearBottom)
        console.log("자동 스크롤 상태 변경:", isNearBottom)
      }

      // 무한 스크롤 처리 - 상단에 가까워지면 이전 메시지 로드
      if (container.scrollTop < 100 && hasMoreMessages && !isScrollLoading && !isFetchingNextPage) {
        setIsScrollLoading(true)
        // 다음 페이지 로드
        const nextPage = Math.ceil(scrollMessages.length / pageSizeRef.current) + 1
        fetchMessages(nextPage).finally(() => {
          setIsScrollLoading(false)
        })
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
    ],
  )

  // 메뉴 위치 최적화 및 화면 경계 감지 함수
  const calculateMenuPosition = useCallback((x, y, bubbleRect, isOwnMessage) => {
    // 화면 크기 가져오기
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    // 메뉴 크기 (실제 측정 또는 예상값)
    const menuWidth = menuSizeRef.current.width
    const menuHeight = menuSizeRef.current.height

    // 기본 위치 (메시지 박스 중앙 하단)
    let posX = x
    let posY = y
    let position = "bottom" // 기본 위치는 아래쪽

    // 메시지 박스 위치 정보가 있는 경우
    if (bubbleRect) {
      // 화면 하단에 가까운 경우 메뉴를 위쪽에 표시
      const spaceBelow = windowHeight - bubbleRect.bottom
      const spaceAbove = bubbleRect.top

      if (spaceBelow < menuHeight + 10 && spaceAbove > menuHeight + 10) {
        // 아래 공간이 부족하고 위 공간이 충분하면 위에 표시
        position = "top"
        posY = bubbleRect.top - 5 // 메시지 박스 위쪽에 약간의 여백 추가
      } else {
        // 그 외에는 아래에 표시
        position = "bottom"
        posY = bubbleRect.bottom + 5 // 메시지 박스 아래쪽에 약간의 여백 추가
      }

      // 좌우 위치 조정 (화면 밖으로 나가지 않도록)
      // 메뉴가 화면 왼쪽으로 나가는 경우
      if (posX - menuWidth / 2 < 10) {
        posX = 10 + menuWidth / 2 // 왼쪽 여백 확보
      }

      // 메뉴가 화면 오른쪽으로 나가는 경우
      if (posX + menuWidth / 2 > windowWidth - 10) {
        posX = windowWidth - 10 - menuWidth / 2 // 오른쪽 여백 확보
      }

      // 자신의 메시지인 경우 위치 조정 (오른쪽 정렬)
      if (isOwnMessage) {
        // 자신의 메시지는 오른쪽에 있으므로 메뉴도 오른쪽에 정렬
        posX = Math.min(posX, bubbleRect.right - menuWidth / 4)
      } else {
        // 상대방 메시지는 왼쪽에 있으므로 메뉴도 왼쪽에 정렬
        posX = Math.max(posX, bubbleRect.left + menuWidth / 4)
      }
    } else {
      // 메시지 박스 위치 정보가 없는 경우 기본 위치 조정

      // 화면 하단에 가까운 경우
      if (windowHeight - posY < menuHeight + 10) {
        position = "top"
        posY = Math.max(10, posY - menuHeight - 10)
      }

      // 화면 좌우 경계 확인
      if (posX - menuWidth / 2 < 10) {
        posX = 10 + menuWidth / 2
      }

      if (posX + menuWidth / 2 > windowWidth - 10) {
        posX = windowWidth - 10 - menuWidth / 2
      }
    }

    return { x: posX, y: posY, position }
  }, [])

  // 컨텍스트 메뉴 표시 함수
  const handleContextMenu = useCallback(
    (e, messageId) => {
      // 메시지 찾기
      const message = messages.find((m) => m.id === messageId)

      // 본인 메시지만 컨텍스트 메뉴 표시
      if (!message || message.senderId !== user?.userId || message.deleted || message.isTemp) return

      e.preventDefault()

      // 메시지 박스의 위치 정보가 있으면 사용
      const bubbleRect = e.bubbleRect || null
      const isOwnMessage = message.senderId === user?.userId || e.isOwnMessage

      // 메뉴 위치 계산
      const { x, y, position } = calculateMenuPosition(e.clientX, e.clientY, bubbleRect, isOwnMessage)

      setContextMenu({
        visible: true,
        x,
        y,
        messageId,
        isOwnMessage,
        bubbleRect,
        position,
      })
    },
    [messages, user?.userId, calculateMenuPosition],
  )

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
    })
  }, [])

  // 컨텍스트 메뉴 외부 클릭 감지를 위한 useEffect 추가
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        closeContextMenu()
      }
    }

    if (contextMenu.visible) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [contextMenu.visible, closeContextMenu])

  // 컨텍스트 메뉴 크기 측정을 위한 useEffect
  const [menuSize, setMenuSize] = useState({ width: 120, height: 120 })

  useEffect(() => {
    if (contextMenuRef.current && contextMenu.visible) {
      const rect = contextMenuRef.current.getBoundingClientRect()
      setMenuSize({
        width: rect.width,
        height: rect.height,
      })

      // 메뉴 크기가 변경되었으면 위치 재계산
      const { x, y, position } = calculateMenuPosition(
        contextMenu.x,
        contextMenu.y,
        contextMenu.bubbleRect,
        contextMenu.isOwnMessage,
      )

      // 위치가 변경되었으면 상태 업데이트
      if (x !== contextMenu.x || y !== contextMenu.y || position !== contextMenu.position) {
        setContextMenu((prev) => ({
          ...prev,
          x,
          y,
          position,
        }))
      }
    }
  }, [
    contextMenu.visible,
    contextMenu.x,
    contextMenu.y,
    contextMenu.bubbleRect,
    contextMenu.isOwnMessage,
    calculateMenuPosition,
  ])
  // 새 채팅방이 선택될 때 로딩 상태 활성화 및 자동 스크롤 설정
  useEffect(() => {
    if (activeCategory?.id) {
      // 상태 초기화
      setIsLoading(true)
      setHasMore(true)
      setHasMoreMessages(true)
      setIsFirstLoad(true)
      setAutoScroll(true)
      loadingPageRef.current = false
      lastRequestTimeRef.current = 0

      // 즉시 메시지 상태 초기화
      setMessages([]);
      setScrollMessages([]);

      // 메시지 로드 함수
      const handleMessages = async () => {
        try {
          console.log(`카테고리 ${activeCategory.id} 메시지 로딩 시작`)
          
          // 메시지 가져오기
          const result = await getCategoryMessages(activeCategory.id, 0, pageSizeRef.current)
          
          if (result && result.length > 0) {
            console.log(`메시지 ${result.length}개 로드 완료`)
            // 스크롤을 하단으로 이동
            setTimeout(scrollToBottom, 100)
          } else {
            console.log("로드된 메시지가 없습니다")
          }
          
          setIsLoading(false)
          setIsFirstLoad(false)
        } catch (error) {
          console.error(`Error fetching initial messages for room ${activeCategory.id}:`, error)
          setIsLoading(false)
          setIsFirstLoad(false)
        }
      }

      // 메시지 로드 함수 실행
      handleMessages()

      // 클린업 함수
      return () => {
        lastMessageIdRef.current = null // 채팅방 변경 시 마지막 메시지 ID 초기화
      }
    }
  }, [activeCategory?.id])

  // useEffect(() => {
  //   if (activeCategory?.id) {
  //     setIsLoading(true);
  //     setHasMore(true);
  //     setHasMoreMessages(true);
  //     setIsFirstLoad(true);
  //     setAutoScroll(true); // 새 채팅방 선택 시 자동 스크롤 활성화
  //     loadingPageRef.current = false;
  //     lastRequestTimeRef.current = 0;
  //     setScrollMessages([]); // 스크롤 메시지 초기화

  //     // 채팅방 변경 시 즉시 메시지 상태 초기화
  //     setMessages([]); // 이 부분을 추가하여 이전 메시지가 보이지 않도록 함

  //     // 메시지 로딩이 완료되면 로딩 상태 해제
  //     const loadingTimeout = setTimeout(() => {
  //       if ( activeCategory.id ){
  //         getCategoryMessages(activeCategory.id, 0, pageSizeRef.current);
  //         console.log("메시지 로딩 완료");
  //       }
  //       setIsLoading(false);
  //       // 로딩 완료 후 스크롤 실행
  //       scrollToBottom();
  //     }, 300);

  //     return () => {
  //       clearTimeout(loadingTimeout);
  //       lastMessageIdRef.current = null; // 채팅방 변경 시 마지막 메시지 ID 초기화
  //     };
  //   }
  // }, [activeCategory?.id, scrollToBottom, setAutoScroll, setMessages]);

  // 디버깅을 위한 스크롤 정보 로깅
  useEffect(() => {
    if (!scrollRef.current) return

    const logScrollInfo = () => {
      const container = scrollRef.current
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight

      // 스크롤이 상단에 너무 가까우면 로깅
      if (container.scrollTop < 100) {
        console.log("스크롤 상단 근처:", {
          scrollTop: container.scrollTop,
          hasMore: hasMoreMessages,
          isLoading: isScrollLoading || isFetchingNextPage,
        })
      }

      // 스크롤이 하단에 너무 가까우면 로깅
      if (distanceFromBottom < 100) {
        console.log("스크롤 하단 근처:", {
          distanceFromBottom,
          autoScroll,
        })
      }
    }

    const scrollContainer = scrollRef.current
    // 스크롤 이벤트를 스로틀링하여 성능 개선
    let timeout
    const throttledScrollHandler = () => {
      if (!timeout) {
        timeout = setTimeout(() => {
          logScrollInfo()
          timeout = null
        }, 500) // 500ms 마다 최대 1번 실행
      }
    }

    scrollContainer.addEventListener("scroll", throttledScrollHandler)

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", throttledScrollHandler)
      }
      clearTimeout(timeout)
    }
  }, [hasMoreMessages, isScrollLoading, isFetchingNextPage, autoScroll])

  // 날짜 포맷 함수
  const formatMessageTime = useCallback((isoDateString) => {
    try {
      const date = new Date(isoDateString)
      const now = new Date()

      // 오늘 보낸 메시지는 시간만 표시
      if (date.toDateString() === now.toDateString()) {
        return `오늘 ${format(date, "HH:mm", { locale: ko })}`
      }

      // 어제 보낸 메시지
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      if (date.toDateString() === yesterday.toDateString()) {
        return `어제 ${format(date, "HH:mm", { locale: ko })}`
      }

      // 그 외 날짜 표시
      return format(date, "HH:mm", { locale: ko })
    } catch (e) {
      console.error("날짜 형식 에러:", e)
      return "날짜 정보 없음"
    }
  }, [])

  // 메시지 수정 처리 함수
  const handleEditMessage = useCallback(
    (message, newContent) => {
      editCategoryMessage(message.id, newContent)
    },
    [editCategoryMessage],
  )

  // 메시지 삭제 처리 함수
  const handleDeleteMessage = useCallback(
    (messageId) => {
      deleteCategoryMessage(messageId)
    },
    [deleteCategoryMessage],
  )

  // GIF 파일 확장자 확인 함수
  const isGifFile = useCallback((fileName) => {
    return fileName && fileName.toLowerCase().endsWith(".gif")
  }, [])
  // 멘션 처리 함수 - 메시지 내용에서 멘션을 하이라이트
  const renderMessageWithMentions = useCallback((content) => {
    if (!content) return null

    // 멘션 패턴이 있는지 먼저 확인
    const mentionRegex = /@(\S+)/g
    if (!mentionRegex.test(content)) {
      // 멘션이 없으면 원본 문자열 그대로 반환 (줄바꿈 보존)
      return content
    }

    // 멘션이 있는 경우 JSX 처리
    mentionRegex.lastIndex = 0 // 정규식 리셋
    const parts = []
    let lastIndex = 0
    let match

    // 멘션 패턴 찾기
    while ((match = mentionRegex.exec(content)) !== null) {
      // 멘션 앞 텍스트 추가
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex, match.index)}</span>)
      }

      // 멘션 부분 추가 (하이라이트)
      parts.push(
        <span key={`mention-${match.index}`} className="bg-[#5865F2] bg-opacity-30 text-[#5865F2] px-1 rounded">
          {match[0]}
        </span>,
      )

      lastIndex = match.index + match[0].length
    }

    // 남은 텍스트 추가
    if (lastIndex < content.length) {
      parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>)
    }

    return parts.length > 0 ? parts : content
  }, [])

  // 현재 사용자가 멘션되었는지 확인
  const isUserMentioned = useCallback(
    (message) => {
      if (!user?.userId || !message.content) return false

      // 사용자 닉네임 가져오기
      const userNickname = user.displayName || user.nickname
      if (!userNickname) return false

      // 멘션 패턴 확인 (@사용자명)
      const mentionPattern = new RegExp(`@${userNickname}\\b`, "i")
      return mentionPattern.test(message.content)
    },
    [user],
  )

  // 파일 타입 분류 함수
  const getAttachmentType = useCallback(
    (attachment) => {
      if (attachment.fileType === "image" || (attachment.fileName && isGifFile(attachment.fileName))) {
        return "image"
      } else if (attachment.fileType === "video") {
        return "video"
      } else {
        return "file"
      }
    },
    [isGifFile],
  )

  // messages 상태가 변경될 때 scrollMessages 업데이트
  useEffect(() => {
    if (messages.length > 0) {
      // 새 메시지만 사용하도록 변경 (scrollMessages와 병합하지 않음)
      // 이렇게 하면 messages 상태가 이미 서버에서 최신 상태로 제공된다고 가정
      setScrollMessages(messages)
    }
  }, [messages])

  // 채팅방이 선택되지 않은 경우 가이드 화면 표시
  if (!activeCategory) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-white py-12 px-4 sm:px-6 md:px-8 text-center">
        <span className="mb-4 text-4xl sm:text-5xl">
          <Earth className="w-24 h-24" />
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">채널을 선택해주세요</h2>
        <div className="mx-auto max-w-md">
          <p className="text-gray-500 mb-6 text-sm sm:text-base">
            왼쪽 사이드바에서 대화할 채널을 선택하면 메시지가 화면에 표시됩니다.
          </p>
        </div>
        <div className="flex flex-col gap-3 max-w-sm bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 font-medium">이용 방법</p>
          <ul className="text-left text-sm text-gray-500 list-disc pl-5 space-y-1">
            <li>왼쪽 사이드바에서 채널을 선택하세요</li>
            <li>다양한 사람들과 대화할 수 있습니다</li>
            <li>채널 채팅에서 프로필을 눌러 1:1 메세지도 보낼 수 있습니다</li>
          </ul>
        </div>
      </div>
    )
  }

  // 로딩 중인 경우 로딩 인디케이터 표시
  if (isLoadingMsg && isFirstLoad) {
    return (
      <div className="flex-1 flex flex-col h-100 bg-white p-4">
        {/* 채널 이름 스켈레톤 */}
        <div className="w-full max-w-md mx-auto mb-6">
          <div className="h-6 bg-gray-200 rounded-md animate-pulse mb-2 w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded-md animate-pulse w-3/4"></div>
        </div>

        {/* 메시지 스켈레톤 - 여러 개의 메시지 형태로 표시 */}
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* 날짜 구분선 스켈레톤 */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-gray-200 h-px flex-grow"></div>
            <div className="mx-4 w-32 h-5 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="bg-gray-200 h-px flex-grow"></div>
          </div>

          {/* 메시지 스켈레톤 */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={`skeleton-${i}`} className="flex items-start">
              {/* 아바타 스켈레톤 */}
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse mr-3"></div>
              <div className="flex flex-col">
                {/* 이름과 시간 스켈레톤 */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-4 bg-gray-200 rounded-md animate-pulse w-20"></div>
                  <div className="h-3 bg-gray-200 rounded-md animate-pulse w-12"></div>
                </div>
                {/* 메시지 내용 스켈레톤 */}
                <div className="h-4 bg-gray-200 rounded-md animate-pulse w-64 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded-md animate-pulse w-48"></div>

                {/* 이미지 첨부 스켈레톤 (일부 메시지만) */}
                {i % 3 === 0 && <div className="mt-2 h-32 w-48 bg-gray-200 rounded-md animate-pulse"></div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 메시지가 없는 경우 표시
  if (scrollMessages.length === 0 && !isLoadingMsg) {
    return (
      <div className="flex-1 flex flex-col h-100 items-center justify-center bg-white">
        <p className="text-gray-800 mb-2">메시지가 없습니다. 첫 메시지를 보내보세요!</p>
        <button
          className="flex items-center text-[#5865F2] hover:text-[#4752C4] bg-[#F5F5F5] px-4 py-2 rounded-lg"
          onClick={() => {
            setIsLoading(true)
            setIsFirstLoad(true)
            // 메시지 새로고침 요청
            getCategoryMessages(activeCategory.id, 0, pageSizeRef.current).finally(() => {
              setIsLoading(false)
              setIsFirstLoad(false)
              scrollToBottom() // 새로고침 후 스크롤
            })
          }}
        >
          <RefreshCw size={16} className="mr-2" />
          새로고침
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex-1 p-3 md:p-4 h-full relative overflow-y-auto bg-white"
      ref={scrollRef}
      onScroll={handleScroll}
      style={{
        maxHeight: "calc(100vh - 125px)",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* 무한 스크롤 로더 - 상단에 배치 (개선된 로더) */}
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
              <div className="flex items-start">
                <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse mr-2"></div>
                <div className="flex flex-col">
                  <div className="h-3 bg-gray-200 rounded-md animate-pulse w-20 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded-md animate-pulse w-32"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-4 w-4 bg-[#F5F5F5] rounded-full" />
          )}
        </div>
      )}

      {/* 날짜별로 메시지 그룹화 */}
      {(() => {
        // 날짜별로 메시지 그룹화
        const messagesByDate = {}

        scrollMessages.forEach((message) => {
          // 날짜만 추출 (YYYY-MM-DD 형식)
          const messageDate = new Date(message.sentAt).toISOString().split("T")[0]

          if (!messagesByDate[messageDate]) {
            messagesByDate[messageDate] = []
          }

          messagesByDate[messageDate].push(message)
        })

        // 날짜별로 정렬된 배열 생성
        const sortedDates = Object.keys(messagesByDate).sort()

        return sortedDates.map((date) => {
          // 날짜 포맷팅 (YYYY년 MM월 DD일)
          const dateObj = new Date(date)
          const formattedDate = format(dateObj, "yyyy년 MM월 dd일", {
            locale: ko,
          })

          return (
            <div key={date} className="mb-6">
              {/* 날짜 구분선 */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-200 h-px flex-grow"></div>
                <div className="mx-4 px-4 py-1 bg-gray-100 rounded-full text-sm text-gray-600 font-medium">
                  {formattedDate}
                </div>
                <div className="bg-gray-200 h-px flex-grow"></div>
              </div>

              {/* 해당 날짜의 메시지들 */}
              <div className="space-y-4">
                {messagesByDate[date].map((message, index) => {
                  // 현재 사용자가 멘션되었는지 확인
                  const mentioned = isUserMentioned(message)

                  return (                    <MessageItem
                      key={`${message.id}-${index}`}
                      message={message}
                      index={index}
                      user={user}
                      activeCategory={activeChannel}
                      mentioned={mentioned}
                      formatMessageTime={formatMessageTime}
                      renderMessageWithMentions={renderMessageWithMentions}
                      handleContextMenu={handleContextMenu}
                      getAttachmentType={getAttachmentType}
                      isGifFile={isGifFile}
                      handleAvatarClick={handleAvatarClick}
                    />
                  )
                })}
              </div>
            </div>
          )
        })
      })()}

      {/* 자동 스크롤이 비활성화된 경우 표시할 "최신 메시지로 이동" 버튼 */}
      {!autoScroll && (
        <button
          className="fixed bottom-16 md:bottom-20 right-4 md:right-10 bg-[#5865F2] text-white rounded-full px-3 py-1.5 md:px-4 md:py-2 shadow-lg opacity-90 hover:opacity-100 z-10 text-sm md:text-base"
          onClick={() => {
            scrollToBottom()
            setAutoScroll(true)
          }}
        >
          최신 메시지로 이동
        </button>
      )}

      {/* 컨텍스트 메뉴 */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-fadeIn"
          style={{
            top: contextMenu.position === "bottom" ? `${contextMenu.y}px` : "auto",
            bottom: contextMenu.position === "top" ? `${window.innerHeight - contextMenu.y}px` : "auto",
            left: `${contextMenu.x}px`,
            transform: "translate(-50%, 0)",
            minWidth: "150px",
            transformOrigin: contextMenu.position === "top" ? "bottom center" : "top center",
          }}
        >
          <button
            className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 text-gray-700"
            onClick={() => {
              const message = messages.find((m) => m.id === contextMenu.messageId)
              if (message) {
                const currentContent = message.content
                const editedSuffix = " (수정됨)"
                let contentForPrompt = currentContent

                if (currentContent && currentContent.endsWith(editedSuffix)) {
                  contentForPrompt = currentContent.slice(0, -editedSuffix.length)
                }

                const newContent = prompt("메시지 수정", contentForPrompt)

                if (newContent && newContent !== message.content) {
                  handleEditMessage(message, newContent)
                }
              }
              closeContextMenu()
            }}
          >
            <Edit size={14} className="mr-2 text-gray-500" />
            수정하기
          </button>
          <button
            className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 text-red-400"
            onClick={() => {
              if (window.confirm("정말 메시지를 삭제하시겠습니까?")) {
                handleDeleteMessage(contextMenu.messageId)
              }
              closeContextMenu()
            }}
          >            <Trash2 size={14} className="mr-2" />
            삭제하기
          </button>
        </div>
      )}

      {/* 프로필 액션 모달 */}
      {profileModal.isOpen && (
        <ProfileActionModal
          member={profileModal.member}
          position={profileModal.position}
          onClose={() => setProfileModal({ isOpen: false, member: null, position: { x: 0, y: 0 } })}
        />
      )}
    </div>
  )
}
