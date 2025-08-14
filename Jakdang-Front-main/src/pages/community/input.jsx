"use client";

import { EmojiPicker } from "./emoji-picker";
import { MentionComponent } from "./mention-components";
import { Input } from "@/components/ui/input";
import { userInfoAtom } from "@/jotai/authAtoms";
import { activeCategoryAtom, activeChannelAtom } from "@/jotai/chatAtoms";
import { useFileApi } from "@/service/api/fileApi";
import { useAtom } from "jotai";
import {
  FileIcon,
  ImageIcon,
  Play,
  PlusCircle,
  Send,
  X,
  FileVideo,
  AtSign,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";

const MessageInput = React.memo(function MessageInput({
  sendMessage,
  sendWithFileMessage,
  sendCategoryMessage,
  setAutoScroll,
  sendWithFileCategoryMessage,
}) {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState([{}]);
  const [user] = useAtom(userInfoAtom);
  const [activeChannel] = useAtom(activeChannelAtom);
  const [activeCategory] = useAtom(activeCategoryAtom);
  const inputRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const messageToSendRef = useRef("");
  const shouldFocusRef = useRef(true);
  const focusTimeoutRef = useRef(null);
  const lastSentTimeRef = useRef(0);  const [selectedFiles, setSelectedFiles] = useState([]);
  const { uploadLargeFile } = useFileApi();
  const { fetchGet } = useAxiosQuery();
  const [roomMembers, setRoomMembers] = useState([]);
  const [showMentionUI, setShowMentionUI] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // 드래그 상태 추가

  useEffect(() => {
    return () => {
      selectedFiles.forEach((file) => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };  }, [selectedFiles]);

  // 동적 높이 조정 함수
  const adjustTextareaHeight = useCallback(() => {
    if (inputRef.current) {
      const textarea = inputRef.current;
      // 스크롤 높이를 정확히 측정하기 위해 높이를 auto로 리셋
      textarea.style.height = 'auto';
      // 스크롤 높이에 기반해 새 높이 계산 (최소 56px, 최대 120px)
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, 56), 120);
      textarea.style.height = `${newHeight}px`;
      
      // 빈 텍스트일 때 기본 높이 보장
      if (!textarea.value.trim()) {
        textarea.style.height = '56px';
      }
    }
  }, []);

  // 초기 높이 설정
  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  // 메시지가 비워질 때 높이 초기화
  useEffect(() => {
    if (message === "" && inputRef.current) {
      inputRef.current.style.height = '56px';
    }
  }, [message]);

  const handleInputChange = useCallback((e) => {
    setMessage(e.target.value);
    
    // 높이 자동 조정
    setTimeout(adjustTextareaHeight, 0);

    // '@' 문자 감지하여 멘션 UI 표시
    if (e.target.value.includes("@")) {
      setShowMentionUI(true);
    } else {
      setShowMentionUI(false);
    }
  }, [adjustTextareaHeight]);

  useEffect(() => {
    messageToSendRef.current = message;
  }, [message]);

  const focusInput = useCallback(() => {
    if (!inputRef.current || !shouldFocusRef.current) return;

    try {
      const isAlreadyFocused = document.activeElement === inputRef.current;
      if (!isAlreadyFocused) {
        console.log("입력 필드에 포커스 설정");
        inputRef.current.focus();

        const length = inputRef.current.value.length;
        inputRef.current.setSelectionRange(length, length);
      }
    } catch (error) {
      console.error("포커스 설정 오류:", error);
    }
  }, []);

  const scheduleFocus = useCallback(() => {
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }

    focusInput();

    focusTimeoutRef.current = setTimeout(() => {
      focusInput();

      focusTimeoutRef.current = setTimeout(() => {
        focusInput();

        focusTimeoutRef.current = setTimeout(focusInput, 300);
      }, 100);
    }, 50);
  }, [focusInput]);

  useLayoutEffect(() => {
    shouldFocusRef.current = true;
    scheduleFocus();

    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [activeCategory?.id, scheduleFocus]);

  useEffect(() => {
    const handleBlur = (e) => {
      if (
        e.relatedTarget &&
        (e.relatedTarget.tagName === "INPUT" ||
          e.relatedTarget.tagName === "BUTTON" ||
          e.relatedTarget.tagName === "TEXTAREA")
      ) {
        return;
      }

      if (!isSending && activeCategory && shouldFocusRef.current) {
        setTimeout(focusInput, 50);
      }
    };

    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener("blur", handleBlur);
    }

    return () => {
      if (inputElement) {
        inputElement.removeEventListener("blur", handleBlur);
      }
    };
  }, [activeCategory, isSending, focusInput]);

  const canSendMessage = useCallback(() => {
    const now = Date.now();
    if (now - lastSentTimeRef.current < 200) {
      console.log("메시지 전송 무시: 너무 빠른 전송 시도");
      return false;
    }
    return true;
  }, []);

  const handleEmojiSelect = useCallback(
    (emoji) => {
      setMessage((prev) => prev + emoji);
      setTimeout(focusInput, 50);
    },
    [focusInput]
  );

  const handleFileSelect = useCallback(
    (files, fileType) => {
      const filesWithInfo = Array.from(files).map((file) => {
        const previewUrl = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null;
        return {
          file,
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          previewUrl,
          fileCategory: fileType, // 파일 카테고리 추가
        };
      });

      setSelectedFiles((prev) => [...prev, ...filesWithInfo]);
      console.log(`${fileType} 파일 선택됨:`, filesWithInfo);

      setTimeout(focusInput, 50);
    },
    [focusInput]
  );

  // 클립보드에서 이미지 처리하는 함수
  const handleClipboardPaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // 클립보드에서 이미지 파일 찾기
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // 이미지 타입인지 확인
      if (item.type.startsWith('image/')) {
        e.preventDefault(); // 기본 붙여넣기 동작 방지
        
        const file = item.getAsFile();
        if (file) {
          // 클립보드 이미지에 임시 이름 지정
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const fileWithName = new File([file], `clipboard-image-${timestamp}.png`, {
            type: file.type
          });

          console.log('클립보드에서 이미지 붙여넣기:', fileWithName);
          handleFileSelect([fileWithName], 'image');
        }
        break;
      }
    }
  }, [handleFileSelect]);

  const handleRemoveFile = useCallback((fileId) => {
    setSelectedFiles((prev) => {
      const updatedFiles = prev.filter((f) => f.id !== fileId);
      return updatedFiles;
    });
  }, []);

  const filterFilesByType = useCallback(
    (acceptType) => {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;

      switch (acceptType) {
        case "image":
          input.accept = "image/*";
          break;
        case "video":
          input.accept = "video/*";
          break;
        case "file":
          // 이미지와 비디오를 제외한 모든 파일
          input.accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar";
          break;
      }

      input.onchange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFileSelect(e.target.files, acceptType);
        }
      };

      input.click();
    },
    [handleFileSelect]
  );

  // 멘션 버튼 클릭 핸들러
  const handleMentionButtonClick = useCallback(() => {
    if (isDisabled) return;

    // 현재 커서 위치에 '@' 삽입
    const cursorPosition = inputRef.current.selectionStart;
    const textBeforeCursor = message.substring(0, cursorPosition);
    const textAfterCursor = message.substring(cursorPosition);

    const newMessage = `${textBeforeCursor}@${textAfterCursor}`;
    setMessage(newMessage);

    // 커서 위치 조정
    setTimeout(() => {
      const newCursorPosition = cursorPosition + 1;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);

    setShowMentionUI(true);
  }, [message, isDisabled]);

  // 드래그 앤 드롭 핸들러
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
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
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      
      // 파일 타입별로 분류
      const imageFiles = filesArray.filter(file => file.type.startsWith('image/'));
      const videoFiles = filesArray.filter(file => file.type.startsWith('video/'));
      const documentFiles = filesArray.filter(file => 
        !file.type.startsWith('image/') && !file.type.startsWith('video/')
      );

      // 각 타입별로 파일 선택 처리
      if (imageFiles.length > 0) {
        handleFileSelect(imageFiles, 'image');
      }
      if (videoFiles.length > 0) {
        handleFileSelect(videoFiles, 'video');
      }
      if (documentFiles.length > 0) {
        handleFileSelect(documentFiles, 'file');
      }
    }
  }, [handleFileSelect]);

  // 멘션 처리 함수
  const processMentions = (messageText) => {
    // matchAll 메서드를 사용하여 모든 멘션 패턴을 한 번에 찾습니다
    const mentionRegex = /@(\S+)/g;
    const matches = Array.from(messageText.matchAll(mentionRegex));

    // 찾은 멘션들을 매핑하여 사용자 정보로 변환
    return matches
      .map((match) => {
        const mentionedName = match[1];
        const mentionedUser = activeCategory?.members.find(
          (member) => member?.nickname === mentionedName
        );

        return mentionedUser
          ? {
              userId: mentionedUser.id,
              nickname: mentionedUser.nickname,
            }
          : null;
      })
      .filter(Boolean); // null 값 제거
  };

  const handleSendMessage = async () => {
    const messageToSend = messageToSendRef.current.trim();
    const hasFiles = selectedFiles.length > 0;

    if ((messageToSend === "" && !hasFiles) || isSending) return;

    if (!canSendMessage()) return;

    try {
      setIsSending(true);
      let success = false;

      lastSentTimeRef.current = Date.now();

      setMessage("");
      messageToSendRef.current = "";

      // textarea 높이 초기화
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.style.height = '56px';
        }
      }, 0);

      const filesToSend = [...selectedFiles];
      setSelectedFiles([]);
      setAutoScroll(true);

      console.log("메시지 전송 시작:", {
        contentLength: messageToSend.length,
        filesCount: filesToSend.length,
      });

      // 멘션 처리
      const mentions = processMentions(messageToSend);
      const messageData = {
        content: messageToSend,
        // mentions: mentions,
      };

      if (filesToSend.length > 0 && activeCategory) {
        const uploadPromises = filesToSend.map((file) =>
          uploadLargeFile(file.file || file)
        );
        const uploadResults = await Promise.all(uploadPromises);

        const fileAttachments = uploadResults.map((successResponse) => ({
          fileId: successResponse.response.data.id || "",
          fileUrl: successResponse.response.data.address || "",
          fileName: successResponse.response.data.name || "",
          fileType: successResponse.response.data.type || "",
        }));

        console.log("첨부파일 전송 완료:", fileAttachments);

        success = await sendWithFileCategoryMessage(
          messageToSend,
          fileAttachments
        );
      } else if (activeCategory) {
        success = await sendCategoryMessage(messageToSend);
      }

      console.log("메시지 전송 완료:", { success });

      scheduleFocus();

      if (!success) {
        setMessage(messageToSend);
        messageToSendRef.current = messageToSend;
        setSelectedFiles(filesToSend);
        // 메시지 복원 시 높이 재조정
        setTimeout(adjustTextareaHeight, 0);
      }
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      setMessage(messageToSendRef.current);
      // 오류 시 높이 재조정
      setTimeout(adjustTextareaHeight, 0);
    } finally {
      setIsSending(false);
      scheduleFocus();
    }
  };
  const isDisabledCalc = !activeCategory || isSending;
  useEffect(() => {
    setIsDisabled(isDisabledCalc);
  }, [activeCategory, isSending, isDisabledCalc]);

  // dropFiles 이벤트 리스너 추가
  useEffect(() => {
    const handleDropFilesEvent = (event) => {
      const { files, type } = event.detail;
      handleFileSelect(files, type);
    };

    window.addEventListener("dropFiles", handleDropFilesEvent);

    return () => {
      window.removeEventListener("dropFiles", handleDropFilesEvent);
    };
  }, []);

  let placeholder = "";
  // placeholder 텍스트 모두 제거
  
  return (
    <div className="p-1 md:p-1.5 bg-white border-t border-[#E0E0E0] sticky bottom-0 w-full">
      <div
        className={`flex flex-wrap gap-1 md:gap-2 ${
          selectedFiles.length > 0 && `mb-3`
        }`}
      >
        {selectedFiles.map((file) => (
          <div key={file.id} className="relative group">
            {file.type.startsWith("image/") ? (
              <div className="relative w-30 h-30 md:w-50 md:h-50 rounded-md overflow-hidden border border-[#E0E0E0] bg-white">
                <img
                  src={file.previewUrl || "/placeholder.svg"}
                  alt={file.name}
                  className="object-cover w-full h-full bg-white"
                  onLoad={() => console.log("이미지 로딩 성공")}
                  onError={(e) => {
                    console.error("이미지 로딩 실패", e);
                    e.target.style.background = "red";
                  }}
                />
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"
                >
                  <X size={14} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-[10px] md:text-[15px] text-white truncate px-1 py-0.5">
                  {file.name}
                </div>
              </div>
            ) : file.type.startsWith("video/") ? (
              <div className="relative w-30 h-30 md:w-50 md:h-50 rounded-md overflow-hidden border border-[#E0E0E0] bg-white flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center bg-[#F5F5F5]">
                  <Play size={20} className="text-[#0284c7]" />
                </div>
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"
                >
                  <X size={14} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-[10px] md:text-[15px] text-white truncate px-1 py-0.5">
                  {file.name}
                </div>
              </div>
            ) : (
              <div className="relative w-30 h-30 md:w-50 md:h-50 rounded-md overflow-hidden border border-[#E0E0E0] bg-white">
                <div className="w-full h-full flex items-center justify-center bg-[#F5F5F5]">
                  <FileIcon
                    size={40}
                    className="text-[#0284c7] mb-4 md:w-[130px] md:h-[130px]"
                  />
                </div>
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"
                >
                  <X size={14} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-[10px] md:text-[15px] text-white truncate px-1 py-0.5">
                  {file.name}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="relative">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 ${
                isDisabled
                  ? "text-gray-600"
                  : "text-gray-400 hover:text-[#0284c7]"
              }`}
              disabled={isDisabled}
            >
              <PlusCircle size={18} className="md:size-[20px]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="bg-[#F5F5F5] border-[#E0E0E0] text-gray-800"
          >
            <DropdownMenuItem
              className="flex items-center cursor-pointer hover:bg-[#E0E0E0]"
              onClick={() => filterFilesByType("file")}
            >
              <FileIcon className="mr-2 h-4 w-4" />
              <span>파일 첨부</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center cursor-pointer hover:bg-[#E0E0E0]"
              onClick={() => filterFilesByType("image")}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              <span>이미지 첨부</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center cursor-pointer hover:bg-[#E0E0E0]"
              onClick={() => filterFilesByType("video")}
            >
              <FileVideo className="mr-2 h-4 w-4" />
              <span>동영상 첨부</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <textarea
          ref={inputRef}
          placeholder={placeholder}
          className={`${
            isDisabled ? "bg-[#F5F5F5]" : "bg-[#F5F5F5]"
          } border-none text-gray-800 pl-10 md:pl-12 pr-20 md:pr-28 text-sm md:text-base rounded-xl shadow-sm resize-none w-full overflow-hidden`}
          style={{ 
            height: '56px',
            maxHeight: '120px',
            minHeight: '56px',
            lineHeight: '20px',
            paddingTop: '18px',
            paddingBottom: '18px',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
            verticalAlign: 'middle'
          }}
          value={message}
          onChange={handleInputChange}
          onPaste={handleClipboardPaste}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (e.shiftKey) {
                // Shift+Enter: 줄바꿈 허용 (기본 동작)
                return;
              } else {
                // Enter: 메시지 전송
                e.preventDefault();
                handleSendMessage();
              }
            }
          }}
          onFocus={() => {
            // 포커스 받았을 때 상태 업데이트
            shouldFocusRef.current = true;
          }}
          disabled={isDisabled}
          // 자동 완성 비활성화로 불필요한 포커스 손실 방지
          autoComplete="off"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
        <div className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 md:space-x-3 text-gray-400">
          <div className="flex justify-center items-center gap-3">
            {/* 멘션 버튼 추가 */}
            <button
              className={`${
                isDisabled
                  ? "text-gray-600"
                  : "text-gray-400 hover:text-[#0284c7]"
              }`}
              disabled={isDisabled}
              onClick={handleMentionButtonClick}
            >
              <AtSign size={20} />
            </button>
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              disabled={isDisabled}
            />
            <button
              className={`${
                isDisabled || (!message.trim() && selectedFiles.length === 0)
                  ? "text-gray-600"
                  : "text-[#0284c7] hover:text-[#0369a1]"
              }`}
              disabled={
                isDisabled || (!message.trim() && selectedFiles.length === 0)
              }
              onClick={handleSendMessage}
            >
              <Send size={20} className={isSending ? "animate-pulse" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* 멘션 컴포넌트 */}
      {showMentionUI && (
        <MentionComponent
          message={message}
          setMessage={setMessage}
          inputRef={inputRef}
          roomMembers={activeChannel?.channelMembers || []}
          isDisabled={isDisabled}
        />
      )}
    </div>
  );
});

export { MessageInput };
export default MessageInput;