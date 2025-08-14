import { atom } from "jotai";

// 로딩 및 오류 상태
export const loadingAtom = atom(false);
export const errorAtom = atom(null);

// 웹소켓 연결 상태
export const stompConnectedAtom = atom(false);
export const stompErrorAtom = atom(null);

// 채팅방 관련 상태
export const chatRoomsAtom = atom([]); // 채팅방 목록
export const activeChatRoomAtom = atom(null); // 현재 활성화된 채팅방
export const messagesAtom = atom([]); // 채팅방 메시지 목록
export const unreadCountsAtom = atom({}); // 채팅방별 읽지 않은 메시지 수
export const communityUnreadCountAtom = atom(0); // 커뮤니티 읽지 않은 메시지 수

// 디스코드 관련 상태
export const serversAtom = atom([]); // 서버 목록 (추가됨)
export const discordChannelsAtom = atom([]); // 채널 데이터 (서버 상세 정보)
export const activeChannelAtom = atom(null); // 현재 활성화된 채널(서버)
export const activeCategoryAtom = atom(null); // 현재 활성화된 카테고리(채널)
export const isLoadingMessagesAtom = atom(false);
export const activeServerAtom = atom(null); // 현재 활성화된 서버
