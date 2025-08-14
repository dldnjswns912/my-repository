"use client"

import { userInfoAtom } from "@/jotai/authAtoms"
import { chatRoomsAtom, currentRoomMessagesAtom, selectedChatRoomIdAtom } from "@/jotai/chatAtoms"
import { useChatService } from "@/service/api/chatApi"
import { formatRelativeTime } from "@/utils/formatDate"
import { useAtom, useAtomValue } from "jotai"
import { Paperclip } from "lucide-react"
import React, { useEffect, useRef, useState } from "react"
import MessageBubbleIcon from "../icons/MessageBubbleIcon"
import ChatMessageItem from "./ChatMessageItem"
import { Button } from "@/components/ui/button"

const ChatMessageList = React.forwardRef(({ connectionState, onFileUpload }, ref) => {
  const userInfo = useAtomValue(userInfoAtom)
  const [selectedChatId] = useAtom(selectedChatRoomIdAtom)
  const [messages, setMessages] = useAtom(currentRoomMessagesAtom)
  const chatRooms = useAtomValue(chatRoomsAtom)
  const chatService = useChatService()

  const messagesEndRef = useRef(null)
  const messageAreaRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  
  // 중복 메시지 방지용 Set
  const messageIds = useRef(new Set())
  const chatIdRef = useRef(null)
  const previousChatIdRef = useRef(null)
  const abortControllerRef = useRef(null)
  const loadingTimerRef = useRef(null)
  const readStatusTimerRef = useRef(null)
  const retryCountRef = useRef(0)
  const MAX_RETRY_COUNT = 3
  const isInitialLoadRef = useRef(true)
  const isTransitioningRef = useRef(false)
  const operationQueueRef = useRef([])
  const requestInProgressRef = useRef(false)
  const pageRef = useRef(0)
  const loadLockRef = useRef(false)
  const lastReadProcessTimeRef = useRef(0)
  const MIN_READ_INTERVAL = 3000 // 최소 읽음 처리 간격 (3초)
  
  // 채팅방 간 상태 관리
  const chatStatesRef = useRef(new Map())

  const selectedChat = chatRooms.find((chat) => chat.id === selectedChatId) || null
  
  // 작업 큐 처리
  const processQueue = () => {
    if (operationQueueRef.current.length === 0 || requestInProgressRef.current || isTransitioningRef.current) {
      return;
    }
    
    const nextOperation = operationQueueRef.current.shift();
    requestInProgressRef.current = true;
    
    try {
      nextOperation(() => {
        requestInProgressRef.current = false;
        // 다음 작업 처리
        setTimeout(processQueue, 0);
      });
    } catch (error) {
      console.error("작업 실행 오류:", error);
      requestInProgressRef.current = false;
      // 에러가 발생해도 큐 계속 처리
      setTimeout(processQueue, 0);
    }
  };
  
  // 작업 큐에 추가
  const enqueueOperation = (operation) => {
    operationQueueRef.current.push(operation);
    if (!requestInProgressRef.current && !isTransitioningRef.current) {
      processQueue();
    }
  };

  // 메시지 로드 함수
  const loadMessages = async (isRetry = false) => {
    // 채팅방 전환 중이거나 로드 잠금이 걸려있으면 작업 취소
    if (isTransitioningRef.current || loadLockRef.current) {
      console.log("채팅방 전환 중이거나 로드 잠금 상태로 로드 요청이 취소됩니다.");
      return;
    }
    
    if (!selectedChatId || !userInfo?.userId) {
      console.log("메시지 로드 조건 미충족:", {
        selectedChatId,
        userId: userInfo?.userId,
      });
      return;
    }

    // 이미 로딩 중이고 재시도가 아닌 경우 중복 호출 방지
    if (isLoading && !isRetry) {
      console.log("이미 메시지 로딩 중입니다.");
      return;
    }

    // 더 이상 메시지가 없는 경우 (페이지가 0이 아니고 재시도가 아닌 경우)
    if (!hasMore && pageRef.current > 0 && !isRetry) {
      console.log("더 이상 메시지가 없습니다.");
      return;
    }
    
    // 작업 큐에 로드 작업 추가
    enqueueOperation((callback) => {
      // 비동기 작업 시작
      _executeLoadMessages(isRetry).finally(() => {
        callback(); // 큐의 다음 작업 진행
      });
    });
  };
  
  // 실제 메시지 로드 실행 함수
  const _executeLoadMessages = async (isRetry = false) => {
    console.log(`실제 메시지 로드 실행: 채팅방=${selectedChatId}, 페이지=${pageRef.current}, isRetry=${isRetry}`);
    
    // 현재 요청 시작 시 채팅방 ID 캡처
    const currentRequestChatId = selectedChatId;
    
    // 이전 요청이 있다면 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // 이전 로딩 타이머가 있다면 취소
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    
    // 새 AbortController 생성
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setLoadError(null);
      
      if (isRetry) {
        console.log(`메시지 로드 재시도 (${retryCountRef.current}/${MAX_RETRY_COUNT}): 채팅방=${selectedChatId}`);
      } else {
        console.log(`메시지 로드 시작: 채팅방=${selectedChatId}, 페이지=${pageRef.current}`);
        retryCountRef.current = 0; // 재시도 카운터 초기화
      }

      // 로딩 타이머 설정 - 10초 후에도 데이터가 없으면 재시도 또는 에러 표시
      loadingTimerRef.current = setTimeout(() => {
        if (isLoading && selectedChatId === currentRequestChatId) {
          if (retryCountRef.current < MAX_RETRY_COUNT) {
            retryCountRef.current++;
            console.log("메시지 로드 타임아웃, 재시도합니다.");
            loadMessages(true); // 재시도
          } else {
            console.error("최대 재시도 횟수에 도달했습니다.");
            setLoadError("메시지를 불러오는데 실패했습니다. 새로고침 후 다시 시도해주세요.");
            setIsLoading(false);
          }
        }
      }, 10000);
      
      // 현재 채팅방에 대한 현재 페이지 번호 사용
      const currentPage = pageRef.current;
      console.log(`API 요청 전 상태 확인: 채팅방=${selectedChatId}, 페이지=${currentPage}`);

      const response = await chatService.getChatMessages(
        userInfo.userId, 
        selectedChatId, 
        currentPage, 
        20, 
        abortControllerRef.current.signal
      );
      
      // 요청이 취소되었거나 채팅방이 변경된 경우
      if (abortControllerRef.current?.signal.aborted || selectedChatId !== currentRequestChatId || isTransitioningRef.current) {
        console.log("요청이 취소되었거나 채팅방이 변경되었습니다.");
        return;
      }

      console.log("API 응답:", response);

      // 타이머 제거 (응답 받음)
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }

      if (!response || !response.content || !Array.isArray(response.content) || response.content.length === 0) {
        console.log("메시지가 없습니다.");
        setHasMore(false);
        
        // 첫 페이지인데 메시지가 없으면 재시도하지 않음
        if (currentPage === 0) {
          // 로딩은 완료됐지만 데이터가 없는 경우
          setLoadError(null);
        }
        setIsLoading(false);
        return;
      }

      // 메시지 변환
      const formattedMessages = response.content
        .map((msg) => {
          // 타입 판별
          let type = 1;
          if (typeof msg.type === "string") {
            if (msg.type.toUpperCase().includes("SYSTEM")) type = 0;
            else if (msg.type.toUpperCase().includes("IMAGE")) type = 2;
            else if (msg.type.toUpperCase().includes("FILE")) type = 3;
          } else if (typeof msg.type === "number") {
            type = msg.type;
          }

          // ID 중복 제거를 위한 처리
          if (msg.id && messageIds.current.has(msg.id)) {
            return null; // 중복 메시지 필터링
          }

          // ID 추적
          if (msg.id) {
            messageIds.current.add(msg.id);
          }

          return {
            id: msg.id,
            roomId: msg.roomId,
            senderId: msg.senderId,
            senderName: msg.senderName || "사용자",
            content: msg.content || "",
            type: type,
            fileUrl: msg.fileUrl || "",
            sentAt: msg.sentAt || new Date().toISOString(),
            isMe: msg.senderId === userInfo.userId,
            readBy: Array.isArray(msg.readBy) ? msg.readBy : [],
            readCount: msg.readCount || 0,
            formattedTime: formatRelativeTime(msg.sentAt || new Date().toISOString(), 0),
          };
        })
        .filter(Boolean); // null 값 필터링

      console.log("변환된 메시지:", formattedMessages.length);

      // 메시지 업데이트
      if (selectedChatId === currentRequestChatId && !isTransitioningRef.current) {
        setMessages((prev) => {
          // 페이지가 0이면 새로 시작
          if (currentPage === 0) {
            return [...formattedMessages].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
          }

          // 중복 제거 (ID 기반)
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueMessages = formattedMessages.filter((m) => !existingIds.has(m.id));

          // 날짜순 정렬
          return [...uniqueMessages, ...prev].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
        });

        // 페이지 증가
        pageRef.current = currentPage + 1;
        setPage(currentPage + 1);
        
        // 에러 상태 초기화
        setLoadError(null);
        // 재시도 카운터 초기화
        retryCountRef.current = 0;
        // 초기 로드 완료
        isInitialLoadRef.current = false;
        
        // 메시지 로드 후 읽음 처리 실행
        setTimeout(() => {
          if (selectedChatId === currentRequestChatId && !isTransitioningRef.current) {
            markMessagesAsRead();
          }
        }, 800);
      }
    } catch (error) {
      // 요청이 취소된 경우는 에러로 처리하지 않음
      if (error.name === 'AbortError') {
        console.log('요청이 취소되었습니다.');
        return;
      }
      
      // 채팅방이 변경된 경우 에러 처리하지 않음
      if (selectedChatId !== currentRequestChatId || isTransitioningRef.current) {
        console.log('채팅방이 변경되어 에러 처리를 취소합니다.');
        return;
      }
      
      console.error("메시지 로드 오류:", error);
      
      // 재시도 카운터 증가
      retryCountRef.current++;
      
      // 최대 재시도 횟수에 도달하지 않았다면 재시도
      if (retryCountRef.current < MAX_RETRY_COUNT && selectedChatId === currentRequestChatId && !isTransitioningRef.current) {
        console.log(`메시지 로드 오류, ${retryCountRef.current}/${MAX_RETRY_COUNT} 재시도...`);
        
        // 잠시 후 재시도
        setTimeout(() => {
          loadMessages(true);
        }, 2000);
        return;
      }
      
      // 최대 재시도 횟수 초과 시 에러 표시
      if (selectedChatId === currentRequestChatId) {
        setHasMore(false);
        setLoadError("메시지를 불러오는데 실패했습니다. 새로고침 후 다시 시도해주세요.");
      }
    } finally {
      // 현재 채팅방이 요청 시작 시의 채팅방과 동일한 경우에만 로딩 상태 변경
      if (selectedChatId === currentRequestChatId && !isTransitioningRef.current) {
        setIsLoading(false);
      }
    }
  };
  
  // 메시지 읽음 처리 함수
  const markMessagesAsRead = async () => {
    if (!selectedChatId || !userInfo?.userId || isTransitioningRef.current) {
      return;
    }
    
    const now = Date.now();
    // 마지막 읽음 처리 시간과 현재 시간 비교, 최소 간격 유지
    if (now - lastReadProcessTimeRef.current < MIN_READ_INTERVAL) {
      console.log("읽음 처리 간격이 너무 짧습니다. 건너뜁니다.");
      return;
    }
    
    lastReadProcessTimeRef.current = now;

    try {
      console.log(`메시지 읽음 처리 시작: 채팅방=${selectedChatId}, 사용자=${userInfo.userId}`);
      
      // 서버에 읽음 처리 요청
      const response = await chatService.markAsRead(userInfo.userId, selectedChatId);
      
      if (response && response.resultCode === 200) {
        console.log("메시지 읽음 처리 성공:", response);
        
        // 현재 메시지 목록에서 읽음 처리 반영
        setMessages(prevMessages => {
          // 변경 필요 여부 확인
          let needsUpdate = false;
          
          // 새 배열 생성
          const updatedMessages = prevMessages.map(msg => {
            // 이미 자신이 읽은 메시지는 건너뛰기
            if (msg.readBy && msg.readBy.includes(userInfo.userId)) {
              return msg;
            }
            
            // 변경 필요 플래그 설정
            needsUpdate = true;
            
            // 읽음 처리: 자신을 readBy 배열에 추가
            const updatedReadBy = [...(msg.readBy || []), userInfo.userId];
            
            // 메시지 객체 복사 및 업데이트
            return {
              ...msg,
              readBy: updatedReadBy,
              // 자신 외에 다른 사람이 읽었는지 여부에 따라 readCount 계산
              readCount: updatedReadBy.length
            };
          });
          
          // 변경이 필요한 경우에만 새 배열 반환, 아니면 기존 배열 유지
          return needsUpdate ? updatedMessages : prevMessages;
        });
      } else {
        console.error("메시지 읽음 처리 실패:", response);
      }
    } catch (error) {
      console.error("메시지 읽음 처리 오류:", error);
    }
  };

  // 웹소켓으로 받은 읽음 상태 업데이트 처리 함수
  const updateReadStatus = (readStatusData) => {
    if (!readStatusData || !readStatusData.userId || !readStatusData.roomId) {
      return;
    }
    
    // 현재 선택된 채팅방과 다르면 무시
    if (readStatusData.roomId !== selectedChatId) {
      return;
    }
    
    console.log("읽음 상태 업데이트 수신:", readStatusData);
    
    // 메시지 목록에 읽음 상태 반영
    setMessages(prevMessages => {
      // 변경 필요 여부 확인
      let needsUpdate = false;
      
      // 새 배열 생성
      const updatedMessages = prevMessages.map(msg => {
        // readBy 배열에 이미 사용자가 포함되어 있으면 건너뛰기
        if (msg.readBy && msg.readBy.includes(readStatusData.userId)) {
          return msg;
        }
        
        // 변경 필요 플래그 설정
        needsUpdate = true;
        
        // 읽음 처리: 사용자를 readBy 배열에 추가
        const updatedReadBy = [...(msg.readBy || []), readStatusData.userId];
        
        // 메시지 객체 복사 및 업데이트
        return {
          ...msg,
          readBy: updatedReadBy,
          readCount: updatedReadBy.length
        };
      });
      
      // 변경이 필요한 경우에만 새 배열 반환, 아니면 기존 배열 유지
      return needsUpdate ? updatedMessages : prevMessages;
    });
  };
  
  // 채팅방 상태 저장
  const saveChatState = (chatId) => {
    if (!chatId) return;
    
    chatStatesRef.current.set(chatId, {
      page: pageRef.current,
      hasMore: hasMore,
      messageIds: new Set(messageIds.current),
    });
    
    console.log(`채팅방 상태 저장: ${chatId}, 페이지=${pageRef.current}, hasMore=${hasMore}`);
  };
  
  // 채팅방 상태 복원
  const restoreChatState = (chatId) => {
    if (!chatId) return false;
    
    const savedState = chatStatesRef.current.get(chatId);
    if (savedState) {
      pageRef.current = savedState.page;
      setPage(savedState.page);
      setHasMore(savedState.hasMore);
      messageIds.current = new Set(savedState.messageIds);
      
      console.log(`채팅방 상태 복원: ${chatId}, 페이지=${savedState.page}, hasMore=${savedState.hasMore}`);
      return true;
    }
    
    return false;
  };

  // 채팅방 변경 시 초기화 및 메시지 로드
  useEffect(() => {
    const handleChatRoomChange = async () => {
      if (selectedChatId !== chatIdRef.current) {
        console.log(`채팅방 변경: ${chatIdRef.current} -> ${selectedChatId}`);
        
        // 읽음 처리 타이머 초기화
        if (readStatusTimerRef.current) {
          clearTimeout(readStatusTimerRef.current);
          readStatusTimerRef.current = null;
        }
        
        // 전환 중 상태 설정
        isTransitioningRef.current = true;
        
        // 이전 요청 처리 중단
        operationQueueRef.current = []; // 작업 큐 초기화
        
        // 이전 요청 취소
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        
        // 이전 타이머 취소
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
          loadingTimerRef.current = null;
        }
        
        // 현재 채팅방 상태 저장
        if (chatIdRef.current) {
          saveChatState(chatIdRef.current);
        }
        
        // 상태 초기화 전에 이전 채팅방 ID 저장
        previousChatIdRef.current = chatIdRef.current;
        chatIdRef.current = selectedChatId;
        
        // 읽음 처리 시간 초기화
        lastReadProcessTimeRef.current = 0;
        
        // 로딩 잠금 설정
        loadLockRef.current = true;
        
        if (selectedChatId) {
          // 이전 채팅방 상태가 있으면 복원, 없으면 초기화
          const stateRestored = restoreChatState(selectedChatId);
          
          if (!stateRestored) {
            // 완전히 새로운 채팅방인 경우 모든 상태 초기화
            console.log("새 채팅방 상태 초기화");
            setMessages([]);
            pageRef.current = 0;
            setPage(0);
            setHasMore(true);
            setLoadError(null);
            messageIds.current = new Set();
            retryCountRef.current = 0;
            isInitialLoadRef.current = true;
          }
          
          // 로딩 상태 표시
          setIsLoading(true);
          
          // 채팅방 전환 완료, 이제 새 요청을 처리 가능
          setTimeout(() => {
            isTransitioningRef.current = false;
            loadLockRef.current = false;
            
            // 메시지 로드 시작
            console.log(`새 채팅방 메시지 로드 시작: ${selectedChatId}, 페이지=${pageRef.current}`);
            loadMessages();
          }, 300); // 상태 업데이트 완료를 위한 지연
          
        } else {
          // 선택된 채팅방이 없을 때 로딩 상태 해제
          setTimeout(() => {
            setIsLoading(false);
            isTransitioningRef.current = false;
            loadLockRef.current = false;
          }, 100);
        }
      }
    };
    
    handleChatRoomChange();
    
    // 컴포넌트 언마운트 또는 새 채팅방 변경 시 정리
    return () => {
      if (previousChatIdRef.current) {
        console.log(`이전 채팅방 정리: ${previousChatIdRef.current}`);
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
      
      if (readStatusTimerRef.current) {
        clearTimeout(readStatusTimerRef.current);
      }
    };
  }, [selectedChatId, setMessages]);

  // 메시지 자동 스크롤
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0 && !isTransitioningRef.current) {
      // 초기 로딩인 경우에는 smooth 대신 auto 사용 (즉시 스크롤)
      messagesEndRef.current.scrollIntoView({ 
        behavior: isInitialLoadRef.current ? "auto" : "smooth" 
      });
      
      // 스크롤 이후에 초기 로드 상태 해제
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
    }
  }, [messages.length]);

  // 메시지 목록이 변경될 때마다 읽음 처리하는 효과
  useEffect(() => {
    // 메시지 목록이 비어있지 않고, 로딩 중이 아니고, 전환 중이 아닐 때만 실행
    if (messages.length > 0 && !isLoading && !isTransitioningRef.current && selectedChatId) {
      // 기존 타이머 취소
      if (readStatusTimerRef.current) {
        clearTimeout(readStatusTimerRef.current);
      }
      
      // 새 타이머 설정
      readStatusTimerRef.current = setTimeout(() => {
        markMessagesAsRead();
        readStatusTimerRef.current = null;
      }, 1000); // 1초 지연
    }
    
    return () => {
      if (readStatusTimerRef.current) {
        clearTimeout(readStatusTimerRef.current);
        readStatusTimerRef.current = null;
      }
    };
  }, [messages.length, selectedChatId, isLoading]);

  // 스크롤 이벤트 핸들러
  const handleScroll = (e) => {
    if (isLoading || !hasMore || isTransitioningRef.current || loadLockRef.current) return;

    const { scrollTop } = e.target;
    
    // 스크롤이 상단에 가까우면 이전 메시지 로드
    if (scrollTop < 50) {
      console.log("상단 스크롤 감지 - 이전 메시지 로드");
      loadMessages();
    }
  };

  // 재로딩 버튼 핸들러
  const handleRetryLoading = () => {
    if (isTransitioningRef.current || loadLockRef.current) return;
    
    setLoadError(null);
    retryCountRef.current = 0; // 재시도 카운터 초기화
    pageRef.current = 0; // 첫 페이지부터 다시 로드
    setPage(0);
    setHasMore(true);
    messageIds.current.clear();
    loadMessages();
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

    if (messageAreaRef.current) {
      const rect = messageAreaRef.current.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        setIsDragging(false);
      }
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
    if (files && files.length > 0 && onFileUpload) {
      onFileUpload(files);
    }
  };

  // 웹소켓으로 받은 새 메시지 추가
  const addNewMessage = (newMessage) => {
    if (isTransitioningRef.current) {
      console.log("채팅방 전환 중에는 새 메시지를 추가하지 않습니다.");
      return;
    }
    
    // 이미 있는 메시지면 무시
    if (newMessage.id && messageIds.current.has(newMessage.id)) {
      console.log("중복 메시지 무시:", newMessage.id);
      return;
    }

    // ID 추적에 추가
    if (newMessage.id) {
      messageIds.current.add(newMessage.id);
    }

    // 현재 선택된 채팅방과 메시지의 채팅방이 다른 경우 무시
    if (newMessage.roomId !== selectedChatId) {
      console.log("다른 채팅방 메시지 무시:", newMessage.roomId);
      return;
    }

    setMessages((prev) => {
      // 중복 메시지 체크 (ID 또는 내용+시간 기준)
      const isDuplicate = prev.some(msg => 
        (msg.id && msg.id === newMessage.id) || 
        (msg.content === newMessage.content && 
         msg.senderId === newMessage.senderId && 
         Math.abs(new Date(msg.sentAt) - new Date(newMessage.sentAt)) < 5000) // 5초 이내 동일 내용 메시지는 중복으로 처리
      );

      if (isDuplicate) {
        console.log("중복 메시지 감지됨, 추가 안함:", newMessage);
        return prev;
      }

      // 임시 메시지 교체 (발신자가 자신이고 같은 내용의 임시 메시지가 있으면 교체)
      if (newMessage.isMe && !newMessage.isTemp) {
        const tempMessageIndex = prev.findIndex(msg => 
          msg.isTemp && 
          msg.content === newMessage.content && 
          msg.senderId === newMessage.senderId &&
          Math.abs(new Date(msg.sentAt) - new Date(newMessage.sentAt)) < 10000 // 10초 이내
        );
        
        if (tempMessageIndex !== -1) {
          console.log("임시 메시지를 실제 메시지로 교체:", prev[tempMessageIndex].id);
          const updatedMessages = [...prev];
          updatedMessages[tempMessageIndex] = newMessage;
          return updatedMessages.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
        }
      }

      const updatedMessages = [...prev, newMessage];

      // 날짜순 정렬
      return updatedMessages.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
    });
    
    // 새 메시지 추가 후 읽음 처리
    setTimeout(() => {
      if (selectedChatId === newMessage.roomId && !isTransitioningRef.current) {
        markMessagesAsRead();
      }
    }, 500);
  };

  // 메시지 ID 확인 (중복 처리용)
  const hasMessage = (messageId) => {
    return messageIds.current.has(messageId);
  };

  // 컴포넌트 메서드 노출
  React.useImperativeHandle(ref, () => ({
    addNewMessage,
    hasMessage,
    loadMessages,
    markMessagesAsRead,
    updateReadStatus,
    scrollToBottom: () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }));

  return (
    <div
      className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDragging ? "bg-blue-50 dark:bg-navy-600/30" : "bg-chat-secondary dark:bg-navy-900"}`}
      ref={messageAreaRef}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onScroll={handleScroll}
      style={{
        height: "calc(100vh - 220px)",
        maxHeight: "calc(100vh - 220px)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 메시지 로드 중 표시 */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-chat-primary dark:border-white border-t-transparent dark:border-t-transparent rounded-full"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">메시지 로딩 중...</p>
        </div>
      )}

      {/* 로딩 에러 표시 */}
      {loadError && (
        <div className="text-center py-4 px-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-600 dark:text-red-400 mb-2">{loadError}</p>
          <Button 
            onClick={handleRetryLoading} 
            variant="destructive" 
            size="sm"
            className="mt-2"
          >
            다시 시도
          </Button>
        </div>
      )}

      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 dark:bg-navy-600/50 z-10 pointer-events-none">
          <div className="bg-white dark:bg-navy-700 p-6 rounded-xl shadow-modal text-center">
            <Paperclip className="h-12 w-12 mx-auto mb-3 text-chat-primary dark:text-chat-accent" />
            <p className="text-lg font-medium text-chat-primary dark:text-chat-accent">파일을 여기에 놓아주세요</p>
          </div>
        </div>
      )}

      {selectedChatId ? (
        messages.length === 0 && !isLoading && !loadError ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 py-10">
            <div className="bg-white dark:bg-navy-700 rounded-full p-6 mb-4 shadow-chat">
              <MessageBubbleIcon className="h-10 w-10 text-chat-primary" />
            </div>
            <p className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">대화를 시작해보세요</p>
            <p className="text-sm">첫 메시지를 보내 대화를 시작해보세요.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-4">
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id || `temp-${message.sentAt}-${message.content}`}
                message={message}
                isGroupChat={selectedChat?.isGroup}
                participants={selectedChat?.participants || []}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 py-10">
          <p>채팅방을 선택해주세요.</p>
        </div>
      )}
    </div>
  )
})

ChatMessageList.displayName = "ChatMessageList"

export default ChatMessageList