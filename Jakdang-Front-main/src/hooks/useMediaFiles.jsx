import { useCallback } from "react";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import useInfiniteScroll from "@/hooks/useInfiniteScroll";

export function useMediaFiles(roomId, activeTab) {
  const { fetchPost } = useAxiosQuery();
  
  // API 호출 함수
  const fetchMediaFiles = useCallback(async (page) => {
    try {
      const response = await fetchPost("/chat/attachment/room", {
        page: page - 1, // API는 0부터 시작하는 페이지 인덱스 사용
        roomId: roomId,
        size: 20,
        sortDirection: "DESC"
      });
      
      if (!response.result || !response.response.data) {
        return [];
      }
      
      // 응답에서 첨부 파일 데이터 추출
      const messages = response.response.data;
      
      // 첨부 파일이 있는 메시지만 필터링
      const messagesWithAttachments = messages.filter(
        message => message.attachments && message.attachments.length > 0
      );
      
      // 첨부 파일 데이터 변환
      return messagesWithAttachments.map(message => ({
        id: message.id,
        sentAt: message.sentAt,
        attachments: message.attachments.map(attachment => ({
          id: attachment.fileId,
          url: attachment.fileUrl,
          name: attachment.fileName,
          type: attachment.fileType,
          date: message.sentAt
        }))
      }));
    } catch (error) {
      console.error("미디어 파일 로딩 오류:", error);
      return [];
    }
  }, [fetchPost, roomId]);
  
  // 무한 스크롤 훅 사용
  const {
    items: mediaMessages,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasMore,
    loaderRef,
    refetch
  } = useInfiniteScroll(
    ["mediaFiles", roomId, activeTab],
    fetchMediaFiles,
    {
      queryOptions: {
        enabled: !!roomId,
        refetchOnMount: true,
        staleTime: 60000, // 1분
      }
    }
  );
  
  // 첨부 파일 목록 추출 및 필터링
  const extractAttachments = useCallback((messages, type) => {
    if (!messages || messages.length === 0) return [];
    
    // 모든 메시지의 첨부 파일을 하나의 배열로 합치기
    const allAttachments = messages.flatMap(message => 
      message.attachments.map(attachment => ({
        ...attachment,
        messageId: message.id,
        date: message.sentAt
      }))
    );
    
    // 타입에 따라 필터링
    return type === "images" 
      ? allAttachments.filter(attachment => attachment.type === "image")
      : allAttachments.filter(attachment => attachment.type !== "image");
  }, []);
  
  // 일별로 첨부 파일 그룹화
  const groupAttachmentsByDate = useCallback((attachments) => {
    if (!attachments || attachments.length === 0) return {};
    
    return attachments.reduce((groups, attachment) => {
      const date = new Date(attachment.date);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(attachment);
      return groups;
    }, {});
  }, []);
  
  // 현재 탭에 맞는 첨부 파일 추출
  const attachments = extractAttachments(mediaMessages, activeTab);
  
  // 일별로 그룹화
  const groupedAttachments = groupAttachmentsByDate(attachments);
  
  // 날짜 그룹을 정렬 (최신 날짜가 먼저 오도록)
  const sortedDateGroups = Object.keys(groupedAttachments).sort((a, b) => 
    new Date(b) - new Date(a)
  );
  
  return {
    mediaMessages,
    attachments,
    groupedAttachments,
    sortedDateGroups,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasMore,
    loaderRef,
    refetch
  };
}
