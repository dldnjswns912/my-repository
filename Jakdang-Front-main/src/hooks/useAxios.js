/* eslint-disable no-useless-catch */
import { accessTokenAtom } from "@/jotai/authAtoms";
import axiosClient from "@/utils/service/axiosClient";
import createTokenInterceptors from "@/utils/service/axiosInterceptor";
import axios from "axios";
import { useAtomValue } from 'jotai';
import { useNavigate } from "react-router-dom";

export const useAxios = () => {
    // Jotai 훅을 사용하여 accessToken 가져오기
    const accessToken = useAtomValue(accessTokenAtom);
    const navigate = useNavigate();

    const getAxiosWithToken = () => {
        const axiosInstance = axios.create({
            ...axiosClient.defaults,
            headers: {
                ...axiosClient.defaults.headers,
                Authorization: accessToken ? (accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`) : "",
            },
        });
        
        console.log("useAxios: Authorization 헤더 설정 -", accessToken ? (accessToken.substring(0, 15) + "...") : "토큰 없음");
        
        // 인터셉터 적용
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

    const getAxiosWithApiKey = () => {
        const axiosInstance = axios.create({
            ...axiosClient.defaults,
            headers: {
                ...axiosClient.defaults.headers,
            },
        });
        
        // API 키 인스턴스에도 인터셉터 적용
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

    const fetchGet = async (endPoints, param = {}) => {
        try {
            const axiosInstance = getAxiosWithToken();
            const response = await axiosInstance.get(endPoints, { params: param });
            return response.data;
        } catch (error) {
            throw error;
        }
    };

    const fetchPost = async (endPoints, postData, param = {}) => {
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
        try {
            const axiosInstance = getAxiosWithToken();
            const response = await axiosInstance.put(endPoints, putData, { params: param });
            return { response: response.data, result: true };
        } catch (error) {
            return { response: error, result: false };
        }
    };

    const fetchDelete = async (endPoints, param = {}) => {
        try {
            const axiosInstance = getAxiosWithToken();
            const response = await axiosInstance.delete(endPoints, { params: param });
            return { response: response.data, result: true };
        } catch (error) {
            return { response: error, result: false };
        }
    };

    return { 
        fetchGet, 
        fetchPost, 
        fetchPatch, 
        fetchDelete, 
        fetchPut, 
        getAxiosWithToken,
        getAxiosWithApiKey
    };
};