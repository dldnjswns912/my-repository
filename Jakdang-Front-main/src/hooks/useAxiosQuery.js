/* eslint-disable no-useless-catch */
import { accessTokenAtom, isTokenLoadingAtom } from "@/jotai/authAtoms";
import axiosClient from "@/utils/service/axiosClient";
import createTokenInterceptors from "@/utils/service/axiosInterceptor";
import {
  useMutation,
  useQuery
} from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue } from 'jotai';
import { useNavigate } from "react-router-dom";

export const useAxiosQuery = () => {
  const accessToken = useAtomValue(accessTokenAtom);
  const isTokenLoading = useAtomValue(isTokenLoadingAtom);
  const navigate = useNavigate()
  const getAxiosWithToken = () => {
    const axiosInstance = axios.create({
      ...axiosClient.defaults,
      headers: {
        ...axiosClient.defaults.headers,
        authorization: accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`,
        // authorization: normalizeBearerToken(accessToken),
      },
    });

    const interceptors = createTokenInterceptors(axiosInstance, navigate);
    axiosInstance.interceptors.request.use(
      interceptors.request.onRequest,
      interceptors.request.onRequestError
    );
    axiosInstance.interceptors.response.use(
      interceptors.response.onResponse,
      interceptors.response.onError
    );

    return axiosInstance;
  };

  // Bearer가 중복되거나 누락되는 문제를 막기 위해 normalizeBearerToken() 함수를 만들어 항상 "Bearer " 한 번만 붙도록 처리한다.
  const normalizeBearerToken = (token) => {
    if (!token) return "";
    return token.replace(/^Bearer\s+/i, "").trim().length > 0
        ? `Bearer ${token.replace(/^Bearer\s+/i, "").trim()}`
        : "";
  };

  const getAxiosWithApiKey = () => {
    const axiosInstance = axios.create({
      ...axiosClient.defaults,
      headers: {
        ...axiosClient.defaults.headers,
      },
    });

    const interceptors = createTokenInterceptors(axiosInstance, navigate);
    axiosInstance.interceptors.request.use(
      interceptors.request.onRequest,
      interceptors.request.onRequestError
    );
    axiosInstance.interceptors.response.use(
      interceptors.response.onResponse,
      interceptors.response.onError
    );

    return axiosInstance;
  };

  const waitForTokenLoading = async () => {
    if (isTokenLoading) {
      return new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!useAtomValue(isTokenLoadingAtom)) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100); // 100ms마다 확인
      });
    }
  };

  const useGet = (
    queryKey,
    endPoint,
    params = {},
    options = {}
  ) => {
    return useQuery({
      queryKey: [...queryKey, params],
      queryFn: async () => {
        const axiosInstance = getAxiosWithToken();
        const response = await axiosInstance.get(endPoint, { params });
        return response.data;
      },
      ...options,
    });
  };

  const usePost = (options = {}) => {
    return useMutation({
      mutationFn: async ({ endPoint, data, params = {} }) => {
        try {
          const axiosInstance = getAxiosWithToken();
          const response = await axiosInstance.post(endPoint, data, { params });
          return { response: response.data, result: true };
        } catch (error) {
          return { response: error, result: false };
        }
      },
      ...options,
    });
  };

  const usePostQuery = (
    queryKey,
    endPoint,
    postData,
    axiosParams = {},
    queryOptions = {}
  ) => {
    return useQuery({
      queryKey: [...queryKey],
      queryFn: async () => {
        const axiosInstance = getAxiosWithToken();
        const response = await axiosInstance.post(endPoint, postData, axiosParams);
        return response.data;
      },
      ...queryOptions,
    });
  };

  const usePatch = (options = {}) => {
    return useMutation({
      mutationFn: async ({ endPoint, data, params = {} }) => {
        try {
          const axiosInstance = getAxiosWithToken();
          const response = await axiosInstance.patch(endPoint, data, { params });
          return { response: response.data, result: true };
        } catch (error) {
          return { response: error, result: false };
        }
      },
      ...options,
    });
  };

  // React Query와 통합된 PUT 요청
  const usePut = (options = {}) => {
    return useMutation({
      mutationFn: async ({ endPoint, data, params = {} }) => {
        try {
          const axiosInstance = getAxiosWithToken();
          const response = await axiosInstance.put(endPoint, data, { params });
          return { response: response.data, result: true };
        } catch (error) {
          return { response: error, result: false };
        }
      },
      ...options,
    });
  };

  // React Query와 통합된 DELETE 요청
  const useDelete = (options = {}) => {
    return useMutation({
      mutationFn: async ({ endPoint, params = {} }) => {
        try {
          const axiosInstance = getAxiosWithToken();
          const response = await axiosInstance.delete(endPoint, { params });
          return { response: response.data, result: true };
        } catch (error) {
          return { response: error, result: false };
        }
      },
      ...options,
    });
  };

  // 레거시 함수들도 유지 (기존 코드와의 호환성)
  const fetchGet = async (endPoints, param = {}) => {
    await waitForTokenLoading(); // 토큰 로딩이 완료될 때까지 대기
    try {
      const axiosInstance = getAxiosWithToken();
      const response = await axiosInstance.get(endPoints, { params: param });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const fetchPost = async (endPoints, postData, param = {}) => {
    await waitForTokenLoading(); // 토큰 로딩이 완료될 때까지 대기
    try {
      const axiosInstance = getAxiosWithToken();
      const response = await axiosInstance.post(endPoints, postData, { params: param });
      return { response: response.data, result: true };
    } catch (error) {
      return { response: error, result: false };
    }
  };

  const fetchPatch = async (endPoints, patchData, param = {}) => {
    try {
      const axiosInstance = getAxiosWithToken();
      const response = await axiosInstance.patch(endPoints, patchData, { params: param });
      return { response: response.data, result: true };
    } catch (error) {
      return { response: error, result: false };
    }
  };

  const fetchPut = async (endPoints, putData, param = {}) => {
    await waitForTokenLoading(); // 토큰 로딩이 완료될 때까지 대기
    try {
      const axiosInstance = getAxiosWithToken();
      const response = await axiosInstance.put(endPoints, putData, { params: param });
      return { response: response.data, result: true };
    } catch (error) {
      return { response: error, result: false };
    }
  };

  const fetchDelete = async (endPoints, param = {}) => {
    await waitForTokenLoading(); // 토큰 로딩이 완료될 때까지 대기
    try {
      const axiosInstance = getAxiosWithToken();
      const response = await axiosInstance.delete(endPoints, { params: param });
      return { response: response.data, result: true };
    } catch (error) {
      return { response: error, result: false };
    }
  };

  return { 
    // React Query 통합 훅
    useGet,
    usePost,
    usePostQuery,
    usePatch,
    usePut,
    useDelete,
    
    // 레거시 함수 (기존 코드와의 호환성)
    fetchGet, 
    fetchPost, 
    fetchPatch, 
    fetchDelete, 
    fetchPut, 
    
    // 기타 유틸리티
    getAxiosWithToken,
    getAxiosWithApiKey
  };
};