import axios from 'axios';
import createTokenInterceptors from './axiosInterceptor';

const baseURL = `${import.meta.env.VITE_API_URL}`;

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true
});

const interceptors = createTokenInterceptors(api);

api.interceptors.request.use(
  interceptors.request.onRequest,
  interceptors.request.onRequestError
);

api.interceptors.response.use(
  interceptors.response.onResponse,
  interceptors.response.onError
);

export default api;