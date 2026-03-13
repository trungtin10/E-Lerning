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
