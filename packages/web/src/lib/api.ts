import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_ROUTES } from "@clinikchat/shared";
import { useAuthStore } from "../stores/authStore.js";
import { reconnectSocket } from "./socket.js";

export const api = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<{
      success: true;
      data: { accessToken: string; refreshToken: string };
    }>(API_ROUTES.AUTH.REFRESH, { refreshToken }, { withCredentials: true });
    if (!data.success) return null;
    useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken);
    reconnectSocket();
    return data.data.accessToken;
  } catch {
    useAuthStore.getState().logout();
    return null;
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || original._retry || !original) {
      return Promise.reject(error);
    }
    original._retry = true;
    refreshPromise ??= refreshAccessToken();
    const newToken = await refreshPromise;
    refreshPromise = null;
    if (!newToken) {
      return Promise.reject(error);
    }
    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  },
);
