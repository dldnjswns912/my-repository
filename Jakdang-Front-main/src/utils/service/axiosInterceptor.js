/* eslint-disable no-unused-vars */
import { accessTokenAtom, clearAccessTokenAtom, setAccessTokenAtom, isAuthenticatedAtom } from '@/jotai/authAtoms';
import axios from 'axios';
import { getDefaultStore } from 'jotai';

const jotaiStore = getDefaultStore();

const MAX_REFRESH_ATTEMPTS = 3;
const REFRESH_URL = `${import.meta.env.VITE_API_URL}/auth/refresh`;

let isRefreshing = false;
let refreshPromise = null;
let refreshSubscribers = [];

const onRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

const onRefreshError = (error) => {
  refreshSubscribers.forEach(callback => callback(Promise.reject(error)));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

const createTokenInterceptors = (api, navigate) => {
  const isRefreshRequest = (config) => {
    return config?.url?.includes(REFRESH_URL);
  };

  const handleTokenRefresh = async () => {
    try {
      const accessToken = jotaiStore.get(accessTokenAtom);
      const isAuthenticated = jotaiStore.get(isAuthenticatedAtom);
      if (!isAuthenticated || accessToken === "" || !accessToken) {
        // alert("토큰 갱신은 로그인 사용자만 가능합니다.");
        // navigate("/login");
        return Promise.reject(new Error(" - 로그인하지 않은 사용자"));
      }
      
      if (isRefreshing) {
        return refreshPromise;
      }
      
      isRefreshing = true;
      
      const refreshAxios = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true
      });
      
      refreshPromise = refreshAxios.post(REFRESH_URL)
        .then(response => {
          const newAccessToken = response.headers.authorization
          
          console.log('새로운 액세스 토큰:', newAccessToken);
          
          jotaiStore.set(setAccessTokenAtom, newAccessToken);
          
          onRefreshed(newAccessToken);
          
          return newAccessToken;
        })
        .catch(error => {
          //alert("서버가 현재 불안정 합니다. 잠시 후 다시 시도해주세요.");
          navigate("/");
          console.error('토큰 갱신 중 오류 발생:', error);
          jotaiStore.set(clearAccessTokenAtom);
          
          onRefreshError(error);
          
          throw error;
        })
        .finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      
      return refreshPromise;
    } catch (error) {
      isRefreshing = false;
      refreshPromise = null;
      //alert("서버가 현재 불안정 합니다. 잠시 후 다시 시도해주세요.");
      navigate("/");
      console.error('토큰 갱신 중 예기치 않은 오류 발생:', error);
      jotaiStore.set(clearAccessTokenAtom);
      throw error;
    }
  };

  return {
    request: {
      onRequest: (config) => {
        const accessToken = jotaiStore.get(accessTokenAtom);
        
        if (accessToken && !isRefreshRequest(config)) {
          // 이미 Bearer가 포함되어 있는지 확인
          config.headers.Authorization = accessToken.startsWith('Bearer ') 
            ? accessToken 
            : `Bearer ${accessToken}`;
          
          // 디버깅용 로그
          console.log('Authorization 헤더 설정됨:', accessToken.substring(0, 15) + '...');
        } else {
          console.log('토큰 없음 또는 리프레시 요청임');
        }
        console.log('요청 헤더:', config.headers);
        return config;
      },
      onRequestError: (error) => {
        return Promise.reject(error);
      },
    },
    response: {
      onResponse: (response) => response,
      onError: async (error) => {
        const originalRequest = error.config;

        // 403 오류 처리 - forbidden 페이지로 리디렉션
        if (error.response?.status === 403) {
          console.error('접근 권한이 없습니다:', error);
          navigate("/forbidden");
          return Promise.reject(error);
        }

        if (!originalRequest || isRefreshRequest(originalRequest)) {
          return Promise.reject(error);
        }

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          (originalRequest._retryCount || 0) < MAX_REFRESH_ATTEMPTS
        ) {
          // 액세스 토큰을 확인하도록 수정
          const accessToken = jotaiStore.get(accessTokenAtom);
          const isAuthenticated = jotaiStore.get(isAuthenticatedAtom);
          if (!isAuthenticated || accessToken === "" || !accessToken) {
            // alert("인증이 필요한 작업입니다. 로그인해주세요.");
            // navigate("/login");
            return Promise.reject(new Error("인증되지 않은 사용자이거나 액세스 토큰이 없습니다."));
          }
          
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          originalRequest._retry = true;

          if (isRefreshing) {
            try {
              // eslint-disable-next-line no-unused-vars
              return new Promise((resolve, reject) => {
                addRefreshSubscriber(token => {
                  originalRequest.headers.Authorization = token;
                  resolve(api(originalRequest));
                });
              });
            } catch (error) {
              return Promise.reject(error);
            }
          }

          try {
            const newAccessToken = await handleTokenRefresh();
            originalRequest.headers.Authorization = newAccessToken;
            return api(originalRequest);
          } catch (refreshError) {
            jotaiStore.set(clearAccessTokenAtom);
            alert("로그인이 필요합니다.");
            navigate("/login");
            return Promise.reject(new Error("토큰 갱신에 실패했습니다."));
          }
        }

        return Promise.reject(error);
      },
    },
  };
};

export default createTokenInterceptors;