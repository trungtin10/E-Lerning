import React from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';

const titleByPath = {
  '/admin/home-config/header': 'Đầu trang',
  '/admin/home-config/slider-vi': 'Slider trang chủ VN',
  '/admin/home-config/slider-en': 'Slider trang chủ EN',
  '/admin/home-config/small-banner': 'Banner nhỏ',
  '/admin/home-config/testimonials': 'Cảm nhận khách hàng',
  '/admin/home-config/footer': 'Thông tin chân trang',
  '/admin/home-config/policy': 'Chính sách & Quy định',
  '/admin/home-config/social-links': 'Liên kết mạng xã hội',
};

export default function HomeConfig() {
  const { pathname } = useLocation();
  const title = titleByPath[pathname] || 'Cấu hình trang chủ';

  return (
    <AdminLayout>
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">
          <h2 className="fw-bold mb-1">{title}</h2>
          <p className="text-muted small mb-0">Trang cấu hình đang được xây dựng.</p>
        </div>
      </div>
    </AdminLayout>
  );
}

