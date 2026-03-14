import React, { useState } from 'react';
import { useNotify } from '../../../context/NotifyContext';
import { UserPlus, Shield, Loader2, Mail, Eye, EyeOff } from 'lucide-react';
import api from '../../../api/axios';

const AssignAdminModal = ({ isOpen, onClose, company }) => {
  const { toast } = useNotify();
  const [formData, setFormData] = useState({ account: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post('/superadmin/assign-admin', {
        ...formData,
        fullName: `Admin ${company.companyName}`,
        companyId: company.id
      });
      toast(response.data.message || 'Thành công!', 'success');
      setFormData({ account: '', email: '', password: '' });
      setShowPassword(false);
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data || 'Lỗi không xác định.';
      toast(typeof errorMsg === 'string' ? errorMsg : 'Lỗi không xác định.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !company) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 rounded-4 shadow">
          <div className="modal-header border-0 p-4 pb-0">
            <div>
              <h5 className="fw-bold mb-0">Cấp quyền Admin mới</h5>
              <p className="text-muted small mb-0">Công ty: {company.companyName}</p>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Ngăn chặn autofill */}
            <input type="text" style={{ display: 'none' }} />
            <input type="password" style={{ display: 'none' }} />

            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label small fw-bold">Email (Gmail) nhận thông báo *</label>
                <div className="input-group">
                  <span className="input-group-text bg-light"><Mail size={16} /></span>
                  <input
                    type="email"
                    required
                    autoComplete="new-password"
                    className="form-control rounded-3"
                    placeholder=""
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Tên tài khoản đăng nhập *</label>
                <input
                  type="text"
                  required
                  autoComplete="new-password"
                  className="form-control rounded-3"
                  placeholder=""
                  value={formData.account}
                  onChange={e => setFormData({...formData, account: e.target.value})}
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Mật khẩu khởi tạo *</label>
                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    className="form-control rounded-3"
                    placeholder=""
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                  <button type="button" className="btn btn-outline-secondary rounded-3 ms-2 d-flex align-items-center" onClick={() => setShowPassword(!showPassword)} style={{ border: '1px solid #dee2e6' }}>
                    {showPassword ? <EyeOff size={18} className="text-muted" /> : <Eye size={18} className="text-muted" />}
                  </button>
                </div>
              </div>
              <div className="alert alert-info small border-0 bg-info-subtle d-flex align-items-center gap-2 mb-0">
                <Shield size={16} />
                Hệ thống sẽ tự động gán tên: <strong>Admin {company.companyName}</strong>
              </div>
            </div>
            <div className="modal-footer border-0 p-4 pt-0">
              <button type="button" className="btn btn-light px-4 fw-bold" onClick={onClose}>Hủy</button>
              <button type="submit" className="btn btn-primary px-4 fw-bold shadow-sm" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Gửi mail kích hoạt'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignAdminModal;
