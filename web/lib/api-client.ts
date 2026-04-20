import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface CustomAxiosConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // JWT Request Interceptor: Attach token from localStorage
  client.interceptors.request.use(
    (config: CustomAxiosConfig) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response Interceptor: Handle 401 errors
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config as CustomAxiosConfig;

      if (error.response?.status === 401 && !config._retry) {
        config._retry = true;
        // Clear token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
};

export const apiClient = createApiClient();

// Typed API methods
export const api = {
  auth: {
    register: (email: string, password: string, name: string, dueDate?: string, babyBirthDate?: string) =>
      apiClient.post('/auth/register', {
        email,
        password,
        name,
        dueDate,
        babyBirthDate,
      }),
    login: (email: string, password: string) =>
      apiClient.post('/auth/login', { email, password }),
    getMe: () => apiClient.get('/auth/me'),
  },
  posts: {
    create: (content: string, category?: string) =>
      apiClient.post('/posts', { content, category }),
    getAll: () => apiClient.get('/posts'),
    like: (postId: string) => apiClient.post(`/posts/${postId}/like`),
    getById: (postId: string) => apiClient.get(`/posts/${postId}`),
  },
  uploads: {
    upload: (file: File, type?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (type) formData.append('type', type);
      return apiClient.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  },
};
