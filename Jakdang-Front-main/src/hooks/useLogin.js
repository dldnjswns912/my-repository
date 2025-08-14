import {
  accessTokenAtom,
  AUTH_QUERY_KEYS,
  userInfoAtom,
} from "@/jotai/authAtoms";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSetAtom } from "jotai";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { requestForToken } from "@/firebase";

export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAccessToken = useSetAtom(accessTokenAtom);
  const setUserInfo = useSetAtom(userInfoAtom);
  
  const registerFcmToken = async (token) => {
    try {
      const fcmToken = await requestForToken();
      await axios.post(
        `${import.meta.env.VITE_API_URL}/fcm/token`,
        {
          token: fcmToken,
          device: "WEB"
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Failed to register FCM token:", error);
    }
  };

  const getInfo = async (token) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/get-info`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const decodedToken = jwtDecode(token);
      // Jotai 상태 업데이트
      setUserInfo({
        ...response.data.data,
        userId: jwtDecode(token).userId,
      });

      // React Query 캐시 업데이트
      queryClient.setQueryData(AUTH_QUERY_KEYS.USER_INFO, response.data.data);
      queryClient.setQueryData(AUTH_QUERY_KEYS.AUTH_STATUS, true);

      console.log("response.data.data", response.data.data);

      return response.data.data;
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      return null;
    }
  };

  return useMutation({
    mutationFn: async (credentials) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        credentials,
        {
          withCredentials: true,
        }
      );
      return response;
    },
    onSuccess: async (response) => {
      const token = response.headers.authorization.split(" ")[1];
      navigate("/");
      // Jotai 상태 업데이트
      setAccessToken(response.headers.authorization);
      await getInfo(token);
      await registerFcmToken(token);
      // 인증 상태 캐시 업데이트
      queryClient.setQueryData(AUTH_QUERY_KEYS.AUTH_STATUS, true);

    },
  });
};
