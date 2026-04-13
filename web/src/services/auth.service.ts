import api from "../lib/api";

export const loginUser = (data: {
  email: string;
  password: string;
}) => api.post("/auth/login", data);

export const signupUser = (data: {
  name: string;
  email: string;
  password: string;
}) => api.post("/auth/signup", data);

export const logoutUser = () => api.post("/auth/logout");