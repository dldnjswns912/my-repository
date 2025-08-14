import { accessTokenAtom, AUTH_QUERY_KEYS, userInfoAtom } from "@/jotai/authAtoms";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue } from "jotai";

export const useUserInfo = () => {
    const accessToken = useAtomValue(accessTokenAtom);
    const userInfo = useAtomValue(userInfoAtom);
    const queryClient = useQueryClient();
  
    return useQuery({
      queryKey: AUTH_QUERY_KEYS.USER_INFO,
      queryFn: async () => {
        if (!accessToken) {
          throw new Error("No access token available");
        }
        
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/get-info`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        return response.data.data;
      },
      initialData: userInfo,
      enabled: !!accessToken, // 토큰이 있을 때만 쿼리 실행
      staleTime: 1000 * 60 * 5, // 5분 동안 데이터 신선도 유지
      gcTime: 1000 * 60 * 10, // 10분 동안 캐시 유지
    });
  };
  