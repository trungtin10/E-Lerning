/**
 * Chuẩn hóa URL video - dùng đường dẫn tương đối để request cùng origin.
 * Backend trả về: /uploads/videos/xxx.mp4
 * Frontend dùng trực tiếp -> request cùng origin, proxy chuyển tiếp, không lỗi CORS.
 */
export const resolveVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const u = new URL(trimmed);
      return u.pathname;
    } catch {
      return trimmed;
    }
  }
  return trimmed.startsWith('/') ? trimmed : '/' + trimmed;
};
