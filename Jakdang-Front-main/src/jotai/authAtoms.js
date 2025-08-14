// authAtoms.js - Jotai와 React Query 통합
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { QueryClient } from "@tanstack/react-query";

// 토큰 관련 Atom
export const accessTokenAtom = atomWithStorage('access-token', '');

export const isAuthenticatedAtom = atom((get) => !!get(accessTokenAtom));

export const firstLoginCheckAtom = atom(false);

export const setAccessTokenAtom = atom(null, (_, set, token) => {
  set(accessTokenAtom, token);
});

export const clearAccessTokenAtom = atom(null, (_, set) => {
  set(accessTokenAtom, "");
});

// 토큰 로딩 상태를 관리하는 atom
export const isTokenLoadingAtom = atom(false);

// 사용자 정보 관련 Atom
export const userInfoAtom = atomWithStorage("user-info", {
  userId: "",
  email: "",
  phone: "",
  name: "", // 실명
  nickname: "", // 닉네임 (기존 name 필드와 구분)
  image: "",
  createdAt: "",
  backgroundColor: ""
});

export const setUserInfoAtom = atom(null, (_, set, userInfo) => {
  set(userInfoAtom, userInfo);
});

export const clearUserInfoAtom = atom(null, (_, set) => {
  set(userInfoAtom, {
    userId: "",
    email: "",
    phone: "",
    name: "",
    nickname: "",
    image: "",
    createdAt: "",
    backgroundColor: ""
  });
});

// React Query 통합을 위한 키 정의
export const AUTH_QUERY_KEYS = {
  USER_INFO: ['user', 'info'],
  AUTH_STATUS: ['auth', 'status'],
  USER_PROFILE: ['user', 'profile'],
};

// 인증 상태 무효화 함수
export const invalidateAuthQueries = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.USER_INFO });
  queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.AUTH_STATUS });
  queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.USER_PROFILE });
};

// 인증 상태 초기화 함수
export const clearAuthState = (set, queryClient) => {
  set(accessTokenAtom, "");
  set(userInfoAtom, {
    userId: "",
    email: "",
    phone: "",
    name: "",
    nickname: "",
    image: "",
    createdAt: "",
    backgroundColor: ""
  });
  
  // 캐시 초기화
  invalidateAuthQueries(queryClient);
};