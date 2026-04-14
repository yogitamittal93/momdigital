import api from "../lib/api";

export const loginUser = (data: {
  email: string;
  password: string;
}) => api.post("/auth/login", data);

export const signupUser = (data: {
  name: string;
  email: string;
  password: string;
  dueDate?: string;
  babyBirthDate?: string;
}) => api.post("/auth/register", data);

export const logoutUser = () => api.post("/auth/logout");
export const fetchMe = () => api.get("/auth/me");
export const fetchSessions = () => api.get("/auth/sessions");