// notiInfoApi.js
import { useAxiosQuery } from '@/hooks/useAxiosQuery';
import { usePost } from '@/hooks/usePost';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// 알림 관련 API 엔드포인트
const API_ENDPOINTS = {
  // 알림 기본 엔드포인트
  CREATE_NOTIFICATION: '/api/notifications',
  GET_SYSTEM_NOTIFICATIONS: '/api/notifications/system',
  GET_USER_NOTIFICATIONS: '/api/notifications/user',
  GET_ORGANIZATION_NOTIFICATIONS: '/api/notifications/organization',
  GET_CLASS_NOTIFICATIONS: '/api/notifications/class',
  GET_ALL_NOTIFICATIONS: '/api/notifications/all',
  MARK_AS_READ: '/api/notifications',
  DELETE_NOTIFICATION: '/api/notifications',
  
  // 채팅 관련 알림 엔드포인트
  GET_UNREAD_CHAT_COUNT: '/kafka/chat/unread'
};

export const useNotificationService = () => {
  const { fetchGet, fetchPost, fetchPut, fetchPatch, fetchDelete } = useAxiosQuery();
  const postMutation = usePost();
  const queryClient = useQueryClient();

  /**
   * 알림 생성
   * @param {Object} notificationData - 알림 생성 데이터
   * @returns {Promise<Object>} 생성된 알림 정보
   */
  const createNotification = async (notificationData) => {
    try {
      const response = await fetchPost(API_ENDPOINTS.CREATE_NOTIFICATION, notificationData);
      
      if (response && response.result) {
        return response.response.data;
      }
      
      throw new Error('알림 생성에 실패했습니다.');
    } catch (error) {
      console.error('알림 생성 오류:', error);
      toast.error(error.message || '알림 생성에 실패했습니다.');
      throw error;
    }
  };

  /**
   * 시스템 알림 조회
   * @param {Object} options - 페이지네이션 및 정렬 옵션
   * @returns {Promise<Object>} 알림 목록 데이터
   */
  const getSystemNotifications = async (options = {}) => {
    try {
      const { page = 0, size = 10, sort = 'createdAt,desc' } = options;
      
      const params = { page, size, sort };
      
      const response = await fetchGet(API_ENDPOINTS.GET_SYSTEM_NOTIFICATIONS, params);
      
      if (response && response.result) {
        return response.response.data;
      }
      
      throw new Error('시스템 알림을 가져오는데 실패했습니다.');
    } catch (error) {
      console.error('시스템 알림 조회 오류:', error);
      toast.error(error.message || '시스템 알림을 가져오는데 실패했습니다.');
      throw error;
    }
  };

  /**
   * 사용자 알림 조회
   * @param {string} userId - 사용자 ID
   * @param {Object} options - 페이지네이션 및 정렬 옵션
   * @returns {Promise<Object>} 알림 목록 데이터
   */
  const getUserNotifications = async (userId, options = {}) => {
    try {
      if (!userId) {
        throw new Error('사용자 ID가 없습니다.');
      }

      const { page = 0, size = 10, sort = 'createdAt,desc' } = options;
      
      const params = { page, size, sort };
      
      const response = await fetchGet(`${API_ENDPOINTS.GET_USER_NOTIFICATIONS}/${userId}`, params);
      
      if (response && response.result) {
        return response.response.data;
      }
      
      throw new Error('사용자 알림을 가져오는데 실패했습니다.');
    } catch (error) {
      console.error('사용자 알림 조회 오류:', error);
      toast.error(error.message || '사용자 알림을 가져오는데 실패했습니다.');
      throw error;
    }
  };

  /**
   * 기관 알림 조회
   * @param {string} organizationId - 기관 ID
   * @param {Object} options - 페이지네이션 및 정렬 옵션
   * @returns {Promise<Object>} 알림 목록 데이터
   */
  const getOrganizationNotifications = async (organizationId, options = {}) => {
    try {
      if (!organizationId) {
        throw new Error('기관 ID가 없습니다.');
      }

      const { page = 0, size = 10, sort = 'createdAt,desc' } = options;
      
      const params = { page, size, sort };
      
      const response = await fetchGet(`${API_ENDPOINTS.GET_ORGANIZATION_NOTIFICATIONS}/${organizationId}`, params);
      
      if (response && response.result) {
        return response.response.data;
      }
      
      throw new Error('기관 알림을 가져오는데 실패했습니다.');
    } catch (error) {
      console.error('기관 알림 조회 오류:', error);
      toast.error(error.message || '기관 알림을 가져오는데 실패했습니다.');
      throw error;
    }
  };

  /**
   * 클래스 알림 조회
   * @param {string} classId - 클래스 ID
   * @param {Object} options - 페이지네이션 및 정렬 옵션
   * @returns {Promise<Object>} 알림 목록 데이터
   */
  const getClassNotifications = async (classId, options = {}) => {
    try {
      if (!classId) {
        throw new Error('클래스 ID가 없습니다.');
      }

      const { page = 0, size = 10, sort = 'createdAt,desc' } = options;
      
      const params = { page, size, sort };
      
      const response = await fetchGet(`${API_ENDPOINTS.GET_CLASS_NOTIFICATIONS}/${classId}`, params);
      
      if (response && response.result) {
        return response.response.data;
      }
      
      throw new Error('클래스 알림을 가져오는데 실패했습니다.');
    } catch (error) {
      console.error('클래스 알림 조회 오류:', error);
      toast.error(error.message || '클래스 알림을 가져오는데 실패했습니다.');
      throw error;
    }
  };

  /**
   * 모든 알림 목록 조회 (통합)
   * @param {Object} options - 페이지네이션 및 정렬 옵션
   * @returns {Promise<Object>} 알림 목록 데이터
   */
  const getAllNotifications = async (options = {}) => {
    try {
      const { page = 0, size = 10, sort = 'createdAt,desc' } = options;
      
      const params = { page, size, sort };
      
      const response = await fetchGet(API_ENDPOINTS.GET_ALL_NOTIFICATIONS, params);
      
      if (response && response.result) {
        return response.response.data;
      }
      
      throw new Error('알림 목록을 가져오는데 실패했습니다.');
    } catch (error) {
      console.error('알림 목록 조회 오류:', error);
      toast.error(error.message || '알림 목록을 가져오는데 실패했습니다.');
      throw error;
    }
  };

  /**
   * 특정 알림 읽음 처리
   * @param {string} notificationId - 알림 ID
   * @returns {Promise<Object>} 처리 결과
   */
  const markAsRead = async (notificationId) => {
    try {
      if (!notificationId) {
        throw new Error('알림 ID가 없습니다.');
      }
      
      const response = await fetchPatch(`${API_ENDPOINTS.MARK_AS_READ}/${notificationId}/read`);
      
      if (response && response.result) {
        return response.response;
      }
      
      throw new Error('알림 읽음 처리에 실패했습니다.');
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
      toast.error(error.message || '알림 읽음 처리에 실패했습니다.');
      throw error;
    }
  };

  /**
   * 특정 알림 삭제
   * @param {string} notificationId - 알림 ID
   * @returns {Promise<Object>} 처리 결과
   */
  const deleteNotification = async (notificationId) => {
    try {
      if (!notificationId) {
        throw new Error('알림 ID가 없습니다.');
      }
      
      const response = await fetchDelete(`${API_ENDPOINTS.DELETE_NOTIFICATION}/${notificationId}`);
      
      if (response && response.result) {
        return response.response;
      }
      
      throw new Error('알림 삭제에 실패했습니다.');
    } catch (error) {
      console.error('알림 삭제 오류:', error);
      toast.error(error.message || '알림 삭제에 실패했습니다.');
      throw error;
    }
  };

  /**
   * 읽지 않은 채팅 알림 수 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 읽지 않은 알림 수 정보
   */
  const getUnreadChatCount = async (userId) => {
    try {
      if (!userId) {
        throw new Error('사용자 ID가 없습니다.');
      }

      const response = await postMutation.mutateAsync({
        endPoint: API_ENDPOINTS.GET_UNREAD_CHAT_COUNT,
        data: userId
      });
      
      if (response && response.result) {
        return response.response;
      }
      
      throw new Error('읽지 않은 채팅 알림 수를 가져오는데 실패했습니다.');
    } catch (error) {
      console.error('읽지 않은 채팅 알림 수 조회 오류:', error);
      // 조용히 오류 처리 (토스트 표시 없음)
      return { count: 0 };
    }
  };

  // React Query Hooks

  /**
   * React Query Hook: 모든 알림 목록 조회
   */
  const useAllNotifications = (options = {}, queryOptions = {}) => {
    return useQuery({
      queryKey: ['notifications', 'all', options],
      queryFn: () => getAllNotifications(options),
      ...queryOptions
    });
  };

  /**
   * React Query Hook: 시스템 알림 목록 조회
   */
  const useSystemNotifications = (options = {}, queryOptions = {}) => {
    return useQuery({
      queryKey: ['notifications', 'system', options],
      queryFn: () => getSystemNotifications(options),
      ...queryOptions
    });
  };

  /**
   * React Query Hook: 사용자 알림 목록 조회
   */
  const useUserNotifications = (userId, options = {}, queryOptions = {}) => {
    return useQuery({
      queryKey: ['notifications', 'user', userId, options],
      queryFn: () => getUserNotifications(userId, options),
      enabled: !!userId,
      ...queryOptions
    });
  };

  /**
   * React Query Hook: 읽지 않은 채팅 알림 수 조회
   */
  const useUnreadChatCount = (userId, queryOptions = {}) => {
    return useQuery({
      queryKey: ['notifications', 'unreadChat', userId],
      queryFn: () => getUnreadChatCount(userId),
      enabled: !!userId,
      ...queryOptions
    });
  };

  /**
   * React Query Mutation Hook: 알림 읽음 처리
   */
  const useMarkAsRead = () => {
    return useMutation({
      mutationFn: markAsRead,
      onSuccess: () => {
        // 성공 시 알림 목록 쿼리 무효화 (자동 새로고침)
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    });
  };

  /**
   * React Query Mutation Hook: 알림 삭제
   */
  const useDeleteNotification = () => {
    return useMutation({
      mutationFn: deleteNotification,
      onSuccess: () => {
        // 성공 시 알림 목록 쿼리 무효화 (자동 새로고침)
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    });
  };

  return {
    // 기본 API 함수
    createNotification,
    getSystemNotifications,
    getUserNotifications,
    getOrganizationNotifications,
    getClassNotifications,
    getAllNotifications,
    markAsRead,
    deleteNotification,
    getUnreadChatCount,
    
    // React Query Hooks
    useAllNotifications,
    useSystemNotifications,
    useUserNotifications,
    useUnreadChatCount,
    useMarkAsRead,
    useDeleteNotification
  };
};