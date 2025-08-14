"use client"

// src/hooks/useChatHooks.js
import { useEffect, useCallback, useMemo } from "react"
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { useChatService } from "@/lib/chat/chatService"
import useInfiniteScroll from "@/hooks/useInfiniteScroll"

export const useChatRooms = (memberId) => {
  const { getChatRoomList, transformChatRoomData } = useChatService()
  const queryClient = useQueryClient()

  const {
    data: chatRooms,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["chatRooms", memberId],
    queryFn: async () => {
      const result = await getChatRoomList(memberId)

      // API 응답 검증
      if (result.result && result.response && result.response.resultCode === 200) {
        // API 응답에서 채팅방 데이터를 변환
        return transformChatRoomData(result.response)
      }

      throw new Error(result.response?.resultMessage || "채팅방 목록을 불러오는데 실패했습니다.")
    },
    enabled: !!memberId,
  })

  const refreshChatRooms = useCallback(() => {
    queryClient.invalidateQueries(["chatRooms", memberId])
  }, [queryClient, memberId])

  return {
    chatRooms,
    isLoading,
    error,
    refetch,
    refreshChatRooms,
  }
}

export const useChat = (memberId, chatRoomId) => {
  const queryClient = useQueryClient()
  const {
    getPreviousMessages,
    sendTextMessage,
    sendImageMessage,
    sendVideoMessage,
    sendFileMessage,
    markChatAsRead,
    deleteMessage,
    transformMessageData,
  } = useChatService()

  // 채팅 메시지 무한 스크롤로 불러오기
  const fetchMessages = useCallback(
    async (pageParam) => {
      if (!memberId || !chatRoomId) return []

      try {
        const result = await getPreviousMessages(chatRoomId, memberId, pageParam > 1 ? pageParam : null, 20)

        console.log("메시지 API 응답:", result)

        // API 응답 검증
        if (result.result && result.response) {
          if (result.response.resultCode === 200) {
            const transformedMessages = transformMessageData(result.response)
            console.log("변환된 메시지:", transformedMessages)
            return transformedMessages
          } else {
            console.error("메시지 로드 실패:", result.response.resultMessage)
          }
        } else {
          console.error("메시지 응답 형식 오류:", result)
        }

        return []
      } catch (error) {
        console.error("메시지 로드 중 예외 발생:", error)
        return []
      }
    },
    [getPreviousMessages, memberId, chatRoomId, transformMessageData],
  )

  // useInfiniteQuery를 사용하여 메시지 데이터 가져오기
  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, error, fetchNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ["chatMessages", chatRoomId, memberId],
      queryFn: ({ pageParam = 1 }) => fetchMessages(pageParam),
      getNextPageParam: (lastPage, allPages) => {
        // 더 불러올 메시지가 있는지 확인
        return lastPage.length === 0 ? undefined : allPages.length + 1
      },
      enabled: !!memberId && !!chatRoomId,
    })

  // 메시지 데이터 가공
  const messages = useMemo(() => {
    if (!data) return []
    // 모든 페이지의 메시지를 하나의 배열로 합치기
    return data.pages.flat()
  }, [data])

  // 무한 스크롤 로더 ref
  const { loaderRef } = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    hasMore: hasNextPage,
    isLoading: isFetchingNextPage,
  })

  // 메시지 읽음 표시
  const markAsRead = useMutation({
    mutationFn: () => markChatAsRead(memberId, chatRoomId),
    onSuccess: (data) => {
      if (data.result && data.response && data.response.resultCode === 200) {
        queryClient.invalidateQueries(["chatRooms", memberId])
      }
    },
  })

  // 텍스트 메시지 전송
  const sendMessage = useMutation({
    mutationFn: ({ message, parentMessageId = null, meta = null, isCall = false }) =>
      sendTextMessage(chatRoomId, memberId, message, parentMessageId, meta, isCall),
    onSuccess: (data) => {
      if (data.result && data.response && data.response.resultCode === 200) {
        queryClient.invalidateQueries(["chatMessages"])
        queryClient.invalidateQueries(["chatRooms", memberId])
      }
    },
  })

  // 이미지 메시지 전송
  const sendImage = useMutation({
    mutationFn: ({ message, imageUrl, meta = null }) => sendImageMessage(chatRoomId, memberId, message, imageUrl, meta),
    onSuccess: (data) => {
      if (data.result && data.response && data.response.resultCode === 200) {
        queryClient.invalidateQueries(["chatMessages"])
        queryClient.invalidateQueries(["chatRooms", memberId])
      }
    },
  })

  // 비디오 메시지 전송
  const sendVideo = useMutation({
    mutationFn: ({ message, videoUrl, meta = null }) => sendVideoMessage(chatRoomId, memberId, message, videoUrl, meta),
    onSuccess: (data) => {
      if (data.result && data.response && data.response.resultCode === 200) {
        queryClient.invalidateQueries(["chatMessages"])
        queryClient.invalidateQueries(["chatRooms", memberId])
      }
    },
  })

  // 파일 메시지 전송
  const sendFile = useMutation({
    mutationFn: ({ message, fileUrl, fileName, fileSize, meta = null }) =>
      sendFileMessage(chatRoomId, memberId, message, fileUrl, fileName, fileSize, meta),
    onSuccess: (data) => {
      if (data.result && data.response && data.response.resultCode === 200) {
        queryClient.invalidateQueries(["chatMessages"])
        queryClient.invalidateQueries(["chatRooms", memberId])
      }
    },
  })

  // 메시지 삭제
  const deleteChat = useMutation({
    mutationFn: (chatPublishId) => deleteMessage(memberId, chatPublishId),
    onSuccess: (data) => {
      if (data.result && data.response && data.response.resultCode === 200) {
        queryClient.invalidateQueries(["chatMessages"])
        queryClient.invalidateQueries(["chatRooms", memberId])
      }
    },
  })

  // 채팅방에 들어가면 읽음 표시
  useEffect(() => {
    if (memberId && chatRoomId) {
      markAsRead.mutate()
    }
  }, [memberId, chatRoomId])

  return {
    data: messages,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasMore: hasNextPage,
    error,
    loaderRef,
    refetch,
    sendMessage: sendMessage.mutate,
    sendImage: sendImage.mutate,
    sendVideo: sendVideo.mutate,
    sendFile: sendFile.mutate,
    deleteChat: deleteChat.mutate,
    isSending: sendMessage.isPending || sendImage.isPending || sendVideo.isPending || sendFile.isPending,
  }
}

export const useChatRoom = (memberId, chatRoomId) => {
  const { getChatRoomInfo, updateChatRoomName, inviteMembers, leaveChatRoom, transformChatRoomInfo } = useChatService()
  const queryClient = useQueryClient()

  // 채팅방 정보 조회
  const {
    data: roomInfo,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["chatRoomInfo", chatRoomId, memberId],
    queryFn: async () => {
      const result = await getChatRoomInfo(memberId, chatRoomId)

      // API 응답 검증
      if (result.result && result.response && result.response.resultCode === 200) {
        return transformChatRoomInfo(result.response)
      }

      throw new Error(result.response?.resultMessage || "채팅방 정보를 불러오는데 실패했습니다.")
    },
    enabled: !!memberId && !!chatRoomId,
  })

  // 채팅방 이름 변경
  const updateRoomName = useMutation({
    mutationFn: (newName) => updateChatRoomName(memberId, chatRoomId, newName),
    onSuccess: (data) => {
      if (data.result && data.response && data.response.resultCode === 200) {
        queryClient.invalidateQueries(["chatRoomInfo", chatRoomId, memberId])
        queryClient.invalidateQueries(["chatRooms", memberId])
      }
    },
  })

  // 멤버 초대
  const inviteRoomMembers = useMutation({
    mutationFn: ({ inviterId, memberIds }) => inviteMembers(memberId, inviterId, chatRoomId, memberIds),
    onSuccess: (data) => {
      if (data.result && data.response && data.response.resultCode === 200) {
        queryClient.invalidateQueries(["chatRoomInfo", chatRoomId, memberId])
      }
    },
  })

  // 채팅방 나가기
  const leaveRoom = useMutation({
    mutationFn: (nickname) => leaveChatRoom(memberId, chatRoomId, nickname),
    onSuccess: (data) => {
      if (data.result && data.response && data.response.resultCode === 200) {
        queryClient.invalidateQueries(["chatRooms", memberId])
      }
    },
  })

  return {
    roomInfo,
    isLoading,
    error,
    refetch,
    updateRoomName: updateRoomName.mutate,
    inviteRoomMembers: inviteRoomMembers.mutate,
    leaveRoom: leaveRoom.mutate,
    isUpdating: updateRoomName.isPending || inviteRoomMembers.isPending || leaveRoom.isPending,
  }
}

export const useAvailableChatMembers = (memberId, schoolId = null) => {
  const { getAvailableChatMembers } = useChatService()

  const {
    data: availableMembers,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["availableChatMembers", memberId, schoolId],
    queryFn: async () => {
      const result = await getAvailableChatMembers(memberId, schoolId)

      // API 응답 검증
      if (result.result && result.response && result.response.resultCode === 200) {
        return result.response.data?.chatMemberList || []
      }

      return []
    },
    enabled: !!memberId,
  })

  return {
    availableMembers: availableMembers || [],
    isLoading,
    error,
    refetch,
  }
}

export const useCreateChatRoom = (memberId) => {
  const { createChatRoom } = useChatService()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ members, schoolId = null, schoolName = null }) =>
      createChatRoom(memberId, members, schoolId, schoolName),
    onSuccess: (data) => {
      if (data.result && data.response && data.response.resultCode === 200) {
        queryClient.invalidateQueries(["chatRooms", memberId])
      }
    },
  })

  return {
    createRoom: mutation.mutate,
    isCreating: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
  }
}

export const useUnreadCount = (memberId) => {
  const { getUnreadChatCount } = useChatService()

  const {
    data: unreadCount,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["unreadChatCount", memberId],
    queryFn: async () => {
      const result = await getUnreadChatCount(memberId)

      // API 응답 검증
      if (result.result && result.response && result.response.resultCode === 200) {
        return result.response.data !== undefined ? result.response.data : 0
      }

      return 0
    },
    enabled: !!memberId,
    refetchInterval: 30000, // 30초마다 업데이트
  })

  return {
    unreadCount: unreadCount || 0,
    isLoading,
    error,
    refetch,
  }
}

