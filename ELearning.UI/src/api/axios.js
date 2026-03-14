import axios from 'axios';

// =================================================================
// == BƯỚC QUAN TRỌNG NHẤT ĐỂ CHẠY ONLINE ==
// 1. Chạy lệnh 'ngrok http 5211' trong một terminal mới.
// 2. Copy link ngrok đó (ví dụ: https://random-name.ngrok-free.dev).
// 3. Dán link đó vào biến BACKEND_NGROK_URL bên dưới.
// =================================================================
const BACKEND_NGROK_URL = 'https://glumpy-dyspeptically-felecia.ngrok-free.dev';

// Tự động chọn link API phù hợp
const API_URL = window.location.hostname.includes('ngrok-free.dev')
  ? '/api'
  : 'http://127.0.0.1:5211/api';

// Base URL cho uploads (ảnh, video)
// - localhost: dùng path tương đối /uploads/xxx → Vite proxy chuyển tiếp, tránh CORS
// - ngrok: dùng full URL backend + query param ngrok-skip-browser-warning để load ảnh
export const getUploadUrl = (path) => {
  if (!path) return null;
  const isNgrok = window.location.hostname.includes('ngrok-free.dev');
  let url = path;

  if (!path.startsWith('http')) {
    const p = path.startsWith('/') ? path : '/' + path;
    url = isNgrok ? `${BACKEND_NGROK_URL}${p}` : p;
  } else {
    // Backend trả full URL → localhost dùng path tương đối để proxy hoạt động
    if (!isNgrok) {
      try {
        const u = new URL(path);
        url = u.pathname;
      } catch {
        url = path;
      }
    }
  }

  if (url.includes('ngrok-free.dev') && !url.includes('ngrok-skip-browser-warning')) {
    url += (url.includes('?') ? '&' : '?') + 'ngrok-skip-browser-warning=1';
  }
  return url;
};

const api = axios.create({
  baseURL: API_URL,
});

api.defaults.headers.common['Accept'] = 'application/json';

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Header để bỏ qua trang cảnh báo của ngrok
    config.headers['ngrok-skip-browser-warning'] = 'true';

    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
