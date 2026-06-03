/**
 * api-client.ts — Canonical API client for MomDigital web app.
 *
 * Auth strategy: The NestJS backend issues JWTs exclusively as HttpOnly
 * cookies (access_token / refresh_token).  We MUST NOT read or write tokens
 * from localStorage — the browser cannot access HttpOnly cookies via JS.
 *
 * The canonical Axios instance lives in `src/lib/api.ts`.  It:
 *   • Sends cookies with every request (withCredentials: true)
 *   • Automatically retries on 401 via POST /auth/refresh
 *   • Redirects to /login only when the refresh also fails
 *
 * This file re-exports that instance and builds the typed `api` helper so
 * that any existing import of `web/lib/api-client` continues to work.
 */

// Re-export the canonical, cookie-aware Axios instance
export { default as apiClient } from '../src/lib/api';

import apiInstance from '../src/lib/api';

// ─── Typed API helpers ────────────────────────────────────────────────────────

export const api = {
  auth: {
    /**
     * Register a new mother account.
     * At least one of dueDate / babyBirthDate must be supplied.
     */
    register: (
      email: string,
      password: string,
      name: string,
      dueDate?: string,
      babyBirthDate?: string,
    ) =>
      apiInstance.post('/auth/register', {
        email,
        password,
        name,
        dueDate,
        babyBirthDate,
      }),

    /** Login — backend sets HttpOnly access_token + refresh_token cookies. */
    login: (email: string, password: string) =>
      apiInstance.post('/auth/login', { email, password }),

    /** Fetch the authenticated user's profile (requires valid cookie). */
    getMe: () => apiInstance.get('/auth/me'),

    /** Invalidate the current session cookie. */
    logout: () => apiInstance.post('/auth/logout'),
  },

  posts: {
    /** Create a community post. `category` is optional. */
    create: (content: string, category?: string) =>
      apiInstance.post('/posts', { content, category }),

    /** Fetch all posts (paginated on backend). */
    getAll: (page = 1, limit = 20) =>
      apiInstance.get('/posts', { params: { page, limit } }),

    /**
     * Toggle like on a post — optimistic updates should be applied in the
     * component before calling this; roll back on rejection.
     */
    like: (postId: string) => apiInstance.post(`/posts/${postId}/like`),

    getById: (postId: string) => apiInstance.get(`/posts/${postId}`),
  },

  uploads: {
    /**
     * Upload a document as multipart/form-data.
     * Max size: 10 MB (enforced by backend).
     */
    upload: (file: File, type?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (type) formData.append('type', type);
      return apiInstance.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  },
};

