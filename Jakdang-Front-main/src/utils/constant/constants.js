// 채팅방 유형
export const RoomType = {
    INDIVIDUAL: 'INDIVIDUAL',
    GROUP_CHAT: 'GROUP_CHAT',
    DISCORD_CATEGORY: 'DISCORD_CATEGORY'
  };
  
  // 멤버 역할
  export const MemberRole = {
    CREATOR: 'CREATOR',
    ADMIN: 'ADMIN',
    MEMBER: 'MEMBER'
  };
  
  // 채팅 메시지 액션
  export const ChatMessageAction = {
    SEND: 'SEND',
    SENDFILE: 'SENDFILE',
    EDIT: 'EDIT',
    DELETE: 'DELETE',
    MESSAGE_PAGING: 'MESSAGE_PAGING',
    MESSAGE_INFO: 'MESSAGE_INFO',
    MARK_READ: 'MARK_READ',
    UNREAD_COUNT: 'UNREAD_COUNT'
  };
  
  // 채팅방 액션
  export const ChatRoomAction = {
    CREATE: 'CREATE',
    GET: 'GET',
    GET_BY_USER: 'GET_BY_USER',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    JOIN: 'JOIN',
    KICK: 'KICK',
    LEAVE: 'LEAVE'
  };
  
  // 디스코드 채널 액션
  export const DiscordChannelAction = {
    CREATE: 'CREATE',
    GET: 'GET',
    GET_ALL: 'GET_ALL',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    ADD_CATEGORY: 'ADD_CATEGORY',
    REMOVE_CATEGORY: 'REMOVE_CATEGORY'
  };
  
  // 디스코드 카테고리 액션
  export const DiscordCategoryAction = {
    CREATE: 'CREATE',
    GET: 'GET',
    GET_ALL: 'GET_ALL',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE'
  };