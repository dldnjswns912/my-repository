// // chatApi.js
// import { useAxiosQuery } from '@/hooks/useAxiosQuery';

// // 채팅 관련 API 엔드포인트
// const API_ENDPOINTS = {
//   ROOM_LIST: '/kafka/chat/rooms',
//   ROOM_INFO: '/kafka/chat/room/info',
//   ROOM_MESSAGES: '/kafka/chat/room/messages',
//   ROOM_CREATE: '/kafka/chat/room/create',
//   ROOM_LEAVE: '/kafka/chat/leave',
//   ROOM_MEMBERS: '/kafka/chat/room/members',
//   ROOM_NAME_UPDATE: '/kafka/chat/room/update',
//   INVITE_USER: '/kafka/chat/invite',
//   UNREAD_COUNT: '/kafka/chat/unread',
//   MARK_AS_READ: '/kafka/chat/read',
//   SEND_TEXT: '/kafka/chat/send/text',
//   SEND_IMAGE: '/kafka/chat/send/image',
//   SEND_FILE: '/kafka/chat/send/file',
//   CHAT_MEDIA_SEARCH: '/kafka/chat/media-search',
//   CHAT_DELETE: '/kafka/chat/delete',
//   UPDATE_SESSION: '/kafka/chat/session/update',
//   LEAVE_SESSION: '/kafka/chat/session/leave',
// };

// // 채팅 API 서비스
// export const useChatService = () => {
//   const {
//     useGet,
//     usePost,
//     usePut,
//     useDelete,
//     fetchGet,
//     fetchPost,
//     fetchPatch,
//     fetchDelete,
//     getAxiosWithToken
//   } = useAxiosQuery();

//   // 채팅방 목록 조회
//   const getChatRooms = async (userId, page = 0, size = 20) => {
//     try {
//       const response = await fetchPost(API_ENDPOINTS.ROOM_LIST, {
//         user_id: userId,
//         page,
//         size,
//       });
      
//       if (response.result) {
//         return response.response.data;
//       }
      
//       throw new Error('채팅방 목록을 불러오는데 실패했습니다.');
//     } catch (error) {
//       console.error('채팅방 목록 조회 오류:', error);
//       throw error;
//     }
//   };

//   // 채팅방 정보 조회
//   const getChatRoomInfo = async (userId, roomId) => {
//     try {
//       const response = await fetchPost(API_ENDPOINTS.ROOM_INFO, {
//         user_id: userId,
//         room_id: roomId,
//       });
      
//       if (response.result) {
//         return response.response.data;
//       }
      
//       throw new Error('채팅방 정보를 불러오는데 실패했습니다.');
//     } catch (error) {
//       console.error('채팅방 정보 조회 오류:', error);
//       throw error;
//     }
//   };

//   // 채팅 메시지 목록 조회 (페이징) - AbortController 지원 추가
//   const getChatMessages = async (userId, roomId, page = 0, size = 20, signal = null) => {
//     try {
//       if (signal) {
//         // AbortController 사용 시
//         const axios = getAxiosWithToken();
//         const payload = {
//           user_id: userId,
//           room_id: roomId,
//           page,
//           size
//         };
        
//         const config = {
//           signal,
//         };
        
//         const response = await axios.post(API_ENDPOINTS.ROOM_MESSAGES, payload, config);
        
//         if (response.data && response.data.resultCode === 200) {
//           return response.data.data;
//         }
//         return { content: [] };
//       } else {
//         // 기존 방식으로 호출
//         const response = await fetchPost(API_ENDPOINTS.ROOM_MESSAGES, {
//           user_id: userId,
//           room_id: roomId,
//           page,
//           size,
//         });
        
//         if (response.result) {
//           return response.response.data;
//         }
//         return { content: [] };
//       }
//     } catch (error) {
//       // 요청이 취소된 경우는 에러로 처리하지 않음
//       if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
//         console.log('요청이 취소되었습니다:', error.message);
//         throw error;
//       }
      
//       console.error('채팅 메시지 조회 오류:', error);
//       return { content: [] };
//     }
//   };

//   // 채팅방 생성
//   const createChatRoom = async (userId, roomName, participants = [], isGroup = false) => {
//     try {
//       const response = await fetchPost(API_ENDPOINTS.ROOM_CREATE, {
//         user_id: userId,
//         room_name: roomName,
//         type: isGroup ? 2 : 1, // 1: 일대일, 2: 그룹
//         participants,
//       });
      
//       if (response.result) {
//         return response.response.data;
//       }
      
//       throw new Error('채팅방 생성에 실패했습니다.');
//     } catch (error) {
//       console.error('채팅방 생성 오류:', error);
//       throw error;
//     }
//   };

//   // 채팅방 나가기
//   const leaveChatRoom = async (userId, roomId) => {
//     try {
//       const response = await fetchPost(API_ENDPOINTS.ROOM_LEAVE, {
//         user_id: userId,
//         room_id: roomId,
//       });
      
//       if (response.result) {
//         return response.response.data;
//       }
      
//       throw new Error('채팅방 나가기에 실패했습니다.');
//     } catch (error) {
//       console.error('채팅방 나가기 오류:', error);
//       throw error;
//     }
//   };

//   // 채팅방 이름 변경
//   const updateChatRoomName = async (userId, roomId, roomName) => {
//     try {
//       const response = await fetchPost(API_ENDPOINTS.ROOM_NAME_UPDATE, {
//         user_id: userId,
//         room_id: roomId,
//         room_name: roomName,
//       });
      
//       if (response.result) {
//         return response.response.data;
//       }
      
//       throw new Error('채팅방 이름 변경에 실패했습니다.');
//     } catch (error) {
//       console.error('채팅방 이름 변경 오류:', error);
//       throw error;
//     }
//   };

//   // 사용자 초대
//   const inviteUser = async (userId, inviterId, roomId, userIds, inviterName = '') => {
//     try {
//       const response = await fetchPost(API_ENDPOINTS.INVITE_USER, {
//         user_id: userId,
//         inviter_id: inviterId,
//         room_id: roomId,
//         user_ids: userIds,
//         inviter_name: inviterName,
//       });
      
//       if (response.result) {
//         return response.response.data;
//       }
      
//       throw new Error('사용자 초대에 실패했습니다.');
//     } catch (error) {
//       console.error('사용자 초대 오류:', error);
//       throw error;
//     }
//   };

//   // 멤버 초대 함수 (새로 추가)
//   const inviteMembers = async (roomId, inviterId, inviterName, memberIds) => {
//     try {
//       const response = await fetchPost(API_ENDPOINTS.INVITE_USER, {
//         room_id: roomId,
//         inviter_id: inviterId,
//         inviter_name: inviterName || "사용자",
//         user_ids: memberIds
//       });
      
//       return response.result;
//     } catch (error) {
//       console.error('멤버 초대 오류:', error);
//       return false;
//     }
//   };

//   // 채팅방 멤버 조회
//   const getChatRoomMembers = async (userId, roomId) => {
//     try {
//       const response = await fetchPost(API_ENDPOINTS.ROOM_MEMBERS, {
//         user_id: userId,
//         room_id: roomId,
//       });
      
//       if (response.result) {
//         return response.response.data;
//       }
      
//       throw new Error('채팅방 멤버 조회에 실패했습니다.');
//     } catch (error) {
//       console.error('채팅방 멤버 조회 오류:', error);
//       throw error;
//     }
//   };

//   // 읽지 않은 메시지 수 조회
//   const getUnreadCount = async (userId, roomId = null) => {
//     try {
//       const payload = { user_id: userId };
//       if (roomId) {
//         payload.room_id = roomId;
//       }
      
//       const response = await fetchPost(API_ENDPOINTS.UNREAD_COUNT, payload);
      
//       if (response.result) {
//         return response.response.data;
//       }
      
//       throw new Error('읽지 않은 메시지 수 조회에 실패했습니다.');
//     } catch (error) {
//       console.error('읽지 않은 메시지 수 조회 오류:', error);
//       throw error;
//     }
//   };

//   // 메시지 읽음 처리
//   const markAsRead = async (userId, roomId) => {
//     try {
//       const response = await fetchPost(API_ENDPOINTS.MARK_AS_READ, {
//         user_id: userId,
//         room_id: roomId,
//       });
      
//       if (response.result) {
//         return response.response.data;
//       }
      
//       throw new Error('메시지 읽음 처리에 실패했습니다.');
//     } catch (error) {
//       console.error('메시지 읽음 처리 오류:', error);
//       return { result: false };
//     }
//   };

//   // 텍스트 메시지 전송 - 임시 메시지 기능 추가
//   const sendTextMessage = async (userId, roomId, content, username) => {
//     try {
//       // 메시지 ID 생성 (중복 방지용)
//       const messageId = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
//       const payload = {
//         user_id: userId,
//         room_id: roomId,
//         content,
//         username,
//         message_id: messageId // 클라이언트에서 생성한 메시지 ID 추가
//       };
      
//       // 임시 메시지 객체 생성 (UI에 즉시 표시)
//       const tempMessage = {
//         id: messageId,
//         roomId: roomId,
//         senderId: userId,
//         senderName: username,
//         content: content,
//         type: 1,
//         sentAt: new Date().toISOString(),
//         isMe: true,
//         readBy: [userId],
//         readCount: 0,
//         formattedTime: "방금 전",
//         isTemp: true
//       };
      
//       // API 호출
//       const response = await fetchPost(API_ENDPOINTS.SEND_TEXT, payload);
      
//       return {
//         result: response.result,
//         tempMessage
//       };
//     } catch (error) {
//       console.error('텍스트 메시지 전송 오류:', error);
//       return { result: false };
//     }
//   };

//   // 이미지 메시지 전송 - 임시 메시지 기능 추가
//   const sendImageMessage = async (userId, roomId, fileUrl, username, meta = {}) => {
//     try {
//       const messageId = `${userId}-${Date.now()}-img-${Math.random().toString(36).substring(2, 9)}`;
      
//       const payload = {
//         user_id: userId,
//         room_id: roomId,
//         file_url: fileUrl,
//         username,
//         file_name: meta.fileName || "이미지",
//         message_id: messageId
//       };
      
//       // 임시 메시지 객체
//       const tempMessage = {
//         id: messageId,
//         roomId: roomId,
//         senderId: userId,
//         senderName: username,
//         content: "이미지",
//         type: 2,
//         fileUrl: fileUrl,
//         sentAt: new Date().toISOString(),
//         isMe: true,
//         readBy: [userId],
//         readCount: 0,
//         formattedTime: "방금 전",
//         isTemp: true
//       };
      
//       const response = await fetchPost(API_ENDPOINTS.SEND_IMAGE, payload);
      
//       return {
//         result: response.result,
//         tempMessage
//       };
//     } catch (error) {
//       console.error('이미지 메시지 전송 오류:', error);
//       return { result: false };
//     }
//   };

//   // 파일 메시지 전송 - 임시 메시지 기능 추가
//   const sendFileMessage = async (userId, roomId, fileUrl, fileName, username) => {
//     try {
//       const messageId = `${userId}-${Date.now()}-file-${Math.random().toString(36).substring(2, 9)}`;
      
//       const payload = {
//         user_id: userId,
//         room_id: roomId,
//         file_url: fileUrl,
//         file_name: fileName,
//         username,
//         message_id: messageId
//       };
      
//       // 임시 메시지 객체
//       const tempMessage = {
//         id: messageId,
//         roomId: roomId,
//         senderId: userId,
//         senderName: username,
//         content: fileName,
//         type: 3,
//         fileUrl: fileUrl,
//         sentAt: new Date().toISOString(),
//         isMe: true,
//         readBy: [userId],
//         readCount: 0,
//         formattedTime: "방금 전",
//         isTemp: true
//       };
      
//       const response = await fetchPost(API_ENDPOINTS.SEND_FILE, payload);
      
//       return {
//         result: response.result,
//         tempMessage
//       };
//     } catch (error) {
//       console.error('파일 메시지 전송 오류:', error);
//       return { result: false };
//     }
//   };

//   // 미디어 검색
//   const searchChatMedia = async (userId, roomId, types = [], page = 0, size = 20) => {
//     try {
//       const response = await fetchPost(API_ENDPOINTS.CHAT_MEDIA_SEARCH, {
//         user_id: userId,
//         room_id: roomId,
//         types,
//         page,
//         size,
//       });
      
//       if (response.result) {
//         return response.response.data;
//       }
      
//       throw new Error('미디어 검색에 실패했습니다.');
//     } catch (error) {
//       console.error('미디어 검색 오류:', error);
//       throw error;
//     }
//   };

//   // 메시지 삭제
//   const deleteMessage = async (userId, messageId) => {
//     try {
//       const response = await fetchPost(API_ENDPOINTS.CHAT_DELETE, {
//         user_id: userId,
//         message_id: messageId,
//       });
      
//       if (response.result) {
//         return response.response.data;
//       }
      
//       throw new Error('메시지 삭제에 실패했습니다.');
//     } catch (error) {
//       console.error('메시지 삭제 오류:', error);
//       throw error;
//     }
//   };

//   // React Query Hooks
//   const useChatRoomsQuery = (userId, page = 0, size = 20, options = {}) => {
//     return useGet(
//       ['chatRooms', userId, page, size],
//       API_ENDPOINTS.ROOM_LIST,
//       { user_id: userId, page, size },
//       options
//     );
//   };

//   const useChatMessagesQuery = (userId, roomId, page = 0, size = 20, options = {}) => {
//     return useGet(
//       ['chatMessages', roomId, page, size],
//       API_ENDPOINTS.ROOM_MESSAGES,
//       { user_id: userId, room_id: roomId, page, size },
//       options
//     );
//   };

//   const useSendTextMessageMutation = (options = {}) => {
//     return usePost({
//       onSuccess: (data) => {
//         if (options.onSuccess) options.onSuccess(data);
//       },
//       onError: (error) => {
//         if (options.onError) options.onError(error);
//       },
//       ...options,
//     });
//   };

//   const updateUserSession = async (userId, roomId) => {
//     try {
//       const response = await fetchPost(API_ENDPOINTS.UPDATE_SESSION, {
//         user_id: userId,
//         room_id: roomId,
//       });
      
//       return response.result;
//     } catch (error) {
//       console.error('세션 업데이트 오류:', error);
//       return false;
//     }
//   };

//   const leaveSession = async (userId, roomId) => {
//     try {
//       const response = await fetchPost(API_ENDPOINTS.LEAVE_SESSION, {
//         user_id: userId,
//         room_id: roomId,
//       });
      
//       return response.result;
//     } catch (error) {
//       console.error('세션 정리 오류:', error);
//       return false;
//     }
//   };
  

//   return {
//     // 기본 API 함수
//     getChatRooms,
//     getChatRoomInfo,
//     getChatMessages,
//     createChatRoom,
//     leaveChatRoom,
//     updateChatRoomName,
//     inviteUser,
//     getChatRoomMembers,
//     getUnreadCount,
//     markAsRead,
//     sendTextMessage,
//     sendImageMessage,
//     sendFileMessage,
//     searchChatMedia,
//     deleteMessage,
    
//     // 새로 추가한 함수
//     inviteMembers,
//     updateUserSession,
//     leaveSession,

//     // React Query Hooks
//     useChatRoomsQuery,
//     useChatMessagesQuery,
//     useSendTextMessageMutation,
//   };
// };