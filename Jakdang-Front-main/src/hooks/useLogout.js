import {useNavigate} from "react-router-dom";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useAtom, useStore} from "jotai";
import {AUTH_QUERY_KEYS, clearAccessTokenAtom, clearUserInfoAtom, invalidateAuthQueries} from "@/jotai/authAtoms.js";
import axios from "axios";
import { useResetAllAtoms } from "@/jotai/resetAllJotaiAtoms";


export const useLogout = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [, setAccessToken] = useAtom(clearAccessTokenAtom);
    const [, setUserInfo] = useAtom(clearUserInfoAtom);
    const resetAll = useResetAllAtoms()
    return useMutation({
      mutationFn: async () => {
        // 서버 로그아웃 요청이 있다면 여기에 구현
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/logout`,
            {},
            { withCredentials: true }
          );
          return response;
        } catch (error) {
          // 서버 로그아웃에 실패해도 클라이언트 측 로그아웃은 진행
          console.error("Failed to logout from server:", error);
          return null;
        }
      },
      onSuccess: () => {
        // Navigate to home and refresh the page
        window.location.href = "/";
        // Jotai 상태 초기화
        // setAccessToken();
        // setUserInfo();
        resetAll();
        // React Query 캐시 초기화
        invalidateAuthQueries(queryClient);
        queryClient.setQueryData(AUTH_QUERY_KEYS.AUTH_STATUS, false);
        queryClient.clear();

        useResetAllAtoms();
        console.log("모든 atom 초기화 완료")
        
      },
    });
  };