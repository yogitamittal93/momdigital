import axios from "axios";
import { getApiBase } from "./api-url";

const baseURL = getApiBase();

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      try {
        await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        return api(original);
      } catch {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;