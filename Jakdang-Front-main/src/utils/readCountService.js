// 새로운 파일 - 안읽은 메시지 관련 유틸리티 함수
export const ReadCountService = {
    // 서버의 모든 카테고리의 안읽은 메시지 수 합계 계산
    getServerTotalUnreadCount: (server, channels) => {
      if (!server || server.id === "home") return 0
  
      const serverData = channels.find((channel) => channel.id === server.id)
      if (!serverData || !serverData.channelCategories) return 0
  
      return serverData.channelCategories.reduce((sum, category) => sum + (category.unreadCount || 0), 0)
    },
  
    // 특정 카테고리의 안읽은 메시지 수 가져오기
    getCategoryUnreadCount: (categoryId, channels, activeServer) => {
      if (!categoryId || !activeServer) return 0
  
      const serverData = channels.find((channel) => channel.id === activeServer)
      if (!serverData || !serverData.channelCategories) return 0
  
      const category = serverData.channelCategories.find((cat) => cat.id === categoryId)
      return category ? category.unreadCount || 0 : 0
    },
  
    // 안읽은 메시지 수 포맷팅 (99+ 처리)
    formatUnreadCount: (count) => {
      if (!count || count <= 0) return null
      return count > 99 ? "99+" : count.toString()
    },
  }
  