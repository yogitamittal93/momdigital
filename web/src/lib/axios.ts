import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true, // 🔥 REQUIRED for cookies
});

/* =========================
   RESPONSE INTERCEPTOR
========================= */

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // auto logout / redirect
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export default api;