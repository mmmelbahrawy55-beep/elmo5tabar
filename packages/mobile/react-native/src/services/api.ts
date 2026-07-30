import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { secureStorageService } from './secure-storage.service';
import { offlineQueueService } from './offline-queue.service';
import NetInfo from '@react-native-community/netinfo';

const BASE_URL = __DEV__ ? 'https://dev-api.almokhtabar.com/v1' : 'https://api.almokhtabar.com/v1';
const TIMEOUT = 30000;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Language': 'ar',
  },
});

interface FailedRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  config: InternalAxiosRequestConfig;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      resolve(api(config));
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  async (config) => {
    if (__DEV__) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    const tokens = await secureStorageService.getTokens();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API Response] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const tokens = await secureStorageService.getTokens();
        if (!tokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken: tokens.refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        await secureStorageService.setTokens(accessToken, newRefreshToken);

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await secureStorageService.clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (!error.response && error.message === 'Network Error') {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        offlineQueueService.enqueue({
          config: originalRequest,
          timestamp: Date.now(),
          retryCount: 0,
        });
        if (__DEV__) {
          console.log('[API] Network error - request queued for offline');
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
