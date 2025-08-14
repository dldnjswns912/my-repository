// src/stores/chatAtoms.js
import { atom } from 'jotai';

// 기본 상태 atoms
export const chatRoomsAtom = atom([]);
export const selectedChatRoomAtom = atom(null);
export const messagesAtom = atom([]);
export const unreadCountsAtom = atom({});
export const loadingAtom = atom(false);
export const errorAtom = atom(null);
export const memberIdAtom = atom(null); // 현재 사용자 ID
export const searchQueryAtom = atom('');
export const isMobileAtom = atom(false);
export const showChatListAtom = atom(true);
export const isCreateChatOpenAtom = atom(false);
export const isCreateGroupChatOpenAtom = atom(false);
export const isMoreMenuOpenAtom = atom(false);
export const newChatNameAtom = atom('');
export const selectedMembersAtom = atom([]);
export const availableMembersAtom = atom([]);

// 파생된 상태 atoms
export const filteredChatRoomsAtom = atom(
  (get) => {
    const chatRooms = get(chatRoomsAtom);
    const searchQuery = get(searchQueryAtom).toLowerCase();
    
    if (!searchQuery) return chatRooms;
    
    return chatRooms.filter(
      (chat) => 
        (chat.room_name && chat.room_name.toLowerCase().includes(searchQuery)) || 
        (chat.last_message && chat.last_message.toLowerCase().includes(searchQuery))
    );
  }
);

// 액션 atoms
export const setChatRoomsAtom = atom(
  null,
  (get, set, chatRooms) => {
    set(chatRoomsAtom, chatRooms);
  }
);

export const addChatRoomAtom = atom(
  null,
  (get, set, chatRoom) => {
    const currentRooms = get(chatRoomsAtom);
    set(chatRoomsAtom, [chatRoom, ...currentRooms]);
  }
);

export const selectChatRoomAtom = atom(
  null,
  (get, set, chatRoomId) => {
    const chatRooms = get(chatRoomsAtom);
    const selectedRoom = chatRooms.find(room => room.id === chatRoomId);
    set(selectedChatRoomAtom, selectedRoom);
    set(messagesAtom, []); // 메시지 초기화
  }
);

export const setMessagesAtom = atom(
  null,
  (get, set, messages) => {
    set(messagesAtom, messages);
  }
);

export const addMessageAtom = atom(
  null,
  (get, set, message) => {
    const currentMessages = get(messagesAtom);
    set(messagesAtom, [...currentMessages, message]);
  }
);

export const updateUnreadCountsAtom = atom(
  null,
  (get, set, counts) => {
    set(unreadCountsAtom, counts);
  }
);

export const setMemberIdAtom = atom(
  null,
  (get, set, memberId) => {
    set(memberIdAtom, memberId);
  }
);

export const toggleMobileViewAtom = atom(
  null,
  (get, set) => {
    set(showChatListAtom, !get(showChatListAtom));
  }
);

export const setIsMobileAtom = atom(
  null,
  (get, set, isMobile) => {
    set(isMobileAtom, isMobile);
  }
);

export const toggleCreateChatModalAtom = atom(
  null,
  (get, set, value) => {
    set(isCreateChatOpenAtom, value !== undefined ? value : !get(isCreateChatOpenAtom));
  }
);

export const toggleCreateGroupChatModalAtom = atom(
  null,
  (get, set, value) => {
    set(isCreateGroupChatOpenAtom, value !== undefined ? value : !get(isCreateGroupChatOpenAtom));
  }
);

export const setNewChatNameAtom = atom(
  null,
  (get, set, name) => {
    set(newChatNameAtom, name);
  }
);

export const setSearchQueryAtom = atom(
  null,
  (get, set, query) => {
    set(searchQueryAtom, query);
  }
);

export const toggleMemberSelectionAtom = atom(
  null,
  (get, set, member) => {
    const selectedMembers = get(selectedMembersAtom);
    const memberIndex = selectedMembers.findIndex(m => m.id === member.id);
    
    if (memberIndex >= 0) {
      // 이미 선택된 멤버라면 제거
      set(selectedMembersAtom, 
        selectedMembers.filter(m => m.id !== member.id)
      );
    } else {
      // 아니라면 추가
      set(selectedMembersAtom, [...selectedMembers, member]);
    }
  }
);

export const setAvailableMembersAtom = atom(
  null,
  (get, set, members) => {
    set(availableMembersAtom, members);
  }
);

export const resetChatStateAtom = atom(
  null,
  (get, set) => {
    set(selectedChatRoomAtom, null);
    set(messagesAtom, []);
    set(searchQueryAtom, '');
    set(isCreateChatOpenAtom, false);
    set(isCreateGroupChatOpenAtom, false);
    set(isMoreMenuOpenAtom, false);
    set(newChatNameAtom, '');
    set(selectedMembersAtom, []);
  }
);