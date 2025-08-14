import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAxios } from "./useAxios";
import { useAtom } from "jotai";
import { userInfoAtom, accessTokenAtom } from "@/jotai/authAtoms";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

interface ProfileUpdateRequest {
  name: string;
  nickname: string;
  image: string;
  bio: string;
}

interface DecodedTokenType {
  username: string;
  role: string;
  userId: string;
  email: string;
}

export const useUpdateProfile = () => {
  const { fetchPut } = useAxios();
  const [accessToken] = useAtom(accessTokenAtom);
  const [_, setUserInfo] = useAtom(userInfoAtom);
  const queryClient = useQueryClient();

  const getInfo = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/get-info`,
        {
          headers: {
            Authorization: accessToken,
          },
        }
      );

      setUserInfo({
        ...response.data.data,
        userId: (jwtDecode(accessToken) as DecodedTokenType).userId,
      });
    } catch (error) {
      console.error("Failed to fetch updated user info:", error);
      throw error;
    }
  };

  return useMutation({
    mutationFn: async (profileData: ProfileUpdateRequest) => {
      const decodedToken: DecodedTokenType = jwtDecode(accessToken);
      return await fetchPut(`/auth/info/${decodedToken.userId}`, profileData);
    },
    onSuccess: async () => {
      // 프로필 업데이트 성공 후 사용자 정보 갱신
      await getInfo();

      // 프로필 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
