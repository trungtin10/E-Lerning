import React, { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { useNotify } from '../../context/NotifyContext';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, Globe, Mail, Shield,
  Database, Palette, Bell, Save, Loader2,
  Server, Cloud, Lock, Image as ImageIcon, Eye, EyeOff
} from 'lucide-react';

const Settings = () => {
  const { toast } = useNotify();
  const [activeTab, setActiveTab] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast('Đã lưu cấu hình hệ thống thành công!', 'success');
    }, 1000);
  };

  const tabs = [
    { id: 'general', label: 'Cấu hình chung', icon: Globe },
    { id: 'email', label: 'Email & Thông báo', icon: Mail },
    { id: 'storage', label: 'Lưu trữ Cloud', icon: Cloud },
    { id: 'security', label: 'Bảo mật & Hệ thống', icon: Shield },
    { id: 'branding', label: 'Thương hiệu', icon: Palette },
  ];

  return (
    <AdminLayout>
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h2 className="fw-bold tracking-tight mb-1">Cài đặt hệ thống</h2>
          <p className="text-muted small">Thiết lập các tham số vận hành cho toàn bộ nền tảng LMS.</p>
        </div>
        <button className="btn btn-primary px-4 py-2 rounded-3 shadow-sm fw-bold d-flex align-items-center gap-2" onClick={handleSave} disabled={submitting}>
          {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Lưu thay đổi
        </button>
      </div>

      <div className="row g-4">
        {/* Sidebar Tabs */}
        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="list-group list-group-flush">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`list-group-item list-group-item-action border-0 p-3 d-flex align-items-center gap-3 transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-sm' : 'text-secondary hover-bg-light'}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon size={18} />
                  <span className="fw-medium small">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-md-9">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white min-vh-50">
            {activeTab === 'general' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                  <Globe size={20} className="text-primary" /> Thông tin nền tảng
                </h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Tên hệ thống</label>
                    <input type="text" className="form-control rounded-3" defaultValue="E-Learning CMS" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Tên miền chính</label>
                    <input type="text" className="form-control rounded-3" defaultValue="elearning.com" />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold">Mô tả hệ thống</label>
                    <textarea className="form-control rounded-3" rows="3" defaultValue="Hệ thống quản trị đào tạo doanh nghiệp thông minh."></textarea>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Ngôn ngữ mặc định</label>
                    <select className="form-select rounded-3">
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'email' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                  <Mail size={20} className="text-primary" /> Cấu hình SMTP (Gửi Mail)
                </h5>
                <div className="alert alert-warning border-0 bg-warning-subtle small mb-4">
                  Hệ thống sử dụng SMTP để gửi email kích hoạt tài khoản và thông báo khóa học.
                </div>
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label small fw-bold">SMTP Server</label>
                    <input type="text" className="form-control rounded-3" defaultValue="smtp.gmail.com" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Cổng (Port)</label>
                    <input type="text" className="form-control rounded-3" defaultValue="587" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Email người gửi</label>
                    <input type="email" className="form-control rounded-3" defaultValue="ttintran04@gmail.com" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Mật khẩu ứng dụng (App Password)</label>
                    <div className="input-group">
                      <input type={showPassword ? "text" : "password"} title="Mật khẩu đã được mã hóa" className="form-control rounded-3" defaultValue="********" />
                      <button type="button" className="btn btn-outline-secondary rounded-3 ms-2 d-flex align-items-center" onClick={() => setShowPassword(!showPassword)} style={{ border: '1px solid #dee2e6' }}>
                        {showPassword ? <EyeOff size={18} className="text-muted" /> : <Eye size={18} className="text-muted" />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'storage' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                  <Cloud size={20} className="text-primary" /> Lưu trữ Video & Tài liệu
                </h5>
                <div className="d-flex flex-column gap-3">
                  <div className="p-3 border rounded-4 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2 bg-light rounded-3 text-primary"><Server size={24} /></div>
                      <div>
                        <div className="fw-bold small">Lưu trữ nội bộ (Local Storage)</div>
                        <div className="text-muted small">Dung lượng hiện tại: 1.2 GB / Không giới hạn</div>
                      </div>
                    </div>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" defaultChecked />
                    </div>
                  </div>
                  <div className="p-3 border rounded-4 d-flex align-items-center justify-content-between opacity-50">
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2 bg-light rounded-3 text-warning"><Cloud size={24} /></div>
                      <div>
                        <div className="fw-bold small">Amazon S3 (Khuyên dùng)</div>
                        <div className="text-muted small">Tích hợp lưu trữ đám mây tốc độ cao</div>
                      </div>
                    </div>
                    <button className="btn btn-light btn-sm fw-bold border">Kết nối</button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                  <Shield size={20} className="text-primary" /> Chính sách bảo mật
                </h5>
                <div className="row g-4">
                  <div className="col-12">
                    <div className="form-check form-switch d-flex justify-content-between align-items-center p-0">
                      <label className="form-check-label fw-medium small">Bắt buộc xác thực Email khi đăng ký</label>
                      <input className="form-check-input ms-0" type="checkbox" defaultChecked />
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-check form-switch d-flex justify-content-between align-items-center p-0">
                      <label className="form-check-label fw-medium small">Cho phép đăng nhập SSO (Google/Microsoft)</label>
                      <input className="form-check-input ms-0" type="checkbox" defaultChecked />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Thời gian hết hạn Token (Phút)</label>
                    <input type="number" className="form-control rounded-3" defaultValue="60" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'branding' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                  <Palette size={20} className="text-primary" /> Tùy chỉnh giao diện
                </h5>
                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Logo hệ thống</label>
                    <div className="border-2 border-dashed rounded-4 p-4 text-center cursor-pointer hover-bg-light transition-all">
                      <ImageIcon size={32} className="text-muted mb-2" />
                      <div className="small text-muted">Nhấn để tải Logo mới</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Màu sắc chủ đạo</label>
                    <div className="d-flex gap-2">
                      {['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                        <div key={color} className="rounded-circle border cursor-pointer hover-scale" style={{ width: '32px', height: '32px', backgroundColor: color }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .hover-scale:hover { transform: scale(1.1); transition: 0.2s; }
      `}</style>
    </AdminLayout>
  );
};

export default Settings;
