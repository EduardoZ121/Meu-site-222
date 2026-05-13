import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;
export const API = `${BASE}/api`;

export const api = axios.create({
  baseURL: API,
  timeout: 180000, // 3 min — image generation (Replicate Flux 2 Klein) can take 30–90s
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("rp_token");
      localStorage.removeItem("rp_user");
    }
    return Promise.reject(err);
  }
);
