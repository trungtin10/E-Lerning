import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image as ImageIcon, Globe, Shield, Loader2,
  Upload, Mail, Eye, EyeOff, Calendar,
  ArrowLeft, CheckCircle2, ArrowRight, Building2
} from 'lucide-react';
import api from '../../../api/axios';
import { useNotify } from '../../../context/NotifyContext';
import AdminLayout from '../../../components/layout/AdminLayout';

const CreateCompany = () => {
  const { toast } = useNotify();
  const navigate = useNavigate();
  const [activated, setActivated] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactEmail: '',
    subDomain: '',
    trialDays: '7',
    account: '',
    password: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activated) {
      toast('Công ty này đã được kích hoạt rồi.', 'info');
      navigate('/admin/companies');
      return;
    }
    if (submitting) return;
    setSubmitting(true);

    const data = new FormData();
    data.append('CompanyName', formData.companyName);
    data.append('ContactEmail', formData.contactEmail);
    data.append('SubDomain', formData.subDomain);
    data.append('ServicePlanDurationDays', formData.trialDays);
    data.append('Account', formData.account);
    data.append('Password', formData.password);
    if (logoFile) data.append('LogoFile', logoFile);

    try {
      await api.post('/superadmin/register-tenant', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setActivated(true);
      toast('Đã gửi thông báo kích hoạt hệ thống.', 'success');
      navigate('/admin/companies');
    } catch (err) {
      if (err.response?.data?.errors) {
        toast('Vui lòng kiểm tra lại dữ liệu gửi lên.', 'error');
      } else {
        const msg = err.response?.data || 'Lỗi không xác định.';
        if (typeof msg === 'string' && msg.toLowerCase().includes('đã tồn tại')) {
          setActivated(true);
          toast('Công ty/subdomain đã được kích hoạt trước đó.', 'info');
          navigate('/admin/companies');
          return;
        }
        toast(msg, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    formData.companyName &&
    formData.contactEmail &&
    formData.subDomain &&
    formData.trialDays &&
    formData.account &&
    formData.password;

  return (
    <AdminLayout>
      <div className="px-2 px-md-3 pb-4" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => navigate('/admin/companies')}
          className="btn btn-outline-secondary btn-sm mb-3 d-inline-flex align-items-center gap-2 rounded-3"
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>

        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
          <div>
            <h1 className="h4 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
              <Building2 size={24} className="text-primary" />
              Tạo công ty mới
            </h1>
            <p className="text-muted small mb-0">
              Khởi tạo tenant, gói dùng thử và tài khoản quản trị — gửi email kích hoạt cho khách.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" noValidate>
          <div className="row g-4 align-items-start">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-body p-3 p-md-4">
                  {/* Thông tin công ty + logo */}
                  <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                    <span className="rounded-2 bg-primary-subtle text-primary d-inline-flex p-2">
                      <ImageIcon size={18} />
                    </span>
                    <div>
                      <h2 className="h6 fw-bold mb-0">Thông tin công ty</h2>
                      <span className="text-muted extra-small">Tên, email liên hệ, định danh hệ thống, logo</span>
                    </div>
                  </div>
                  <div className="row g-3 mb-4">
                    <div className="col-md-7">
                      <div className="mb-3">
                        <label className="form-label small fw-bold text-secondary mb-1">Tên công ty khách hàng *</label>
                        <input
                          type="text"
                          required
                          className="form-control rounded-3"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-bold text-secondary mb-1">Email liên hệ hệ thống *</label>
                        <input
                          type="email"
                          required
                          className="form-control rounded-3"
                          value={formData.contactEmail}
                          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        />
                      </div>
                      <div className="mb-0">
                        <label className="form-label small fw-bold text-secondary mb-1">Địa chỉ định danh (subdomain) *</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0 rounded-start-3">
                            <Globe size={16} className="text-muted" />
                          </span>
                          <input
                            type="text"
                            required
                            className="form-control border-start-0 rounded-end-3"
                            placeholder="vd: abc-group"
                            value={formData.subDomain}
                            onChange={(e) => setFormData({ ...formData, subDomain: e.target.value })}
                          />
                        </div>
                        <p className="extra-small text-muted mt-1 mb-0">Định danh duy nhất cho tenant (chữ thường, không dấu cách).</p>
                      </div>
                    </div>
                    <div className="col-md-5">
                      <label className="form-label small fw-bold text-secondary mb-1">Logo thương hiệu</label>
                      <div
                        className="bg-light rounded-3 border border-dashed d-flex flex-column align-items-center justify-content-center position-relative overflow-hidden mx-auto hover-shadow transition-all"
                        style={{ width: '100%', maxWidth: '200px', aspectRatio: '1', cursor: 'pointer' }}
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                      >
                        {previewUrl ? (
                          <img src={previewUrl} alt="" className="w-100 h-100 object-fit-contain p-2" />
                        ) : (
                          <div className="text-center p-3">
                            <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '48px', height: '48px' }}>
                              <Upload size={22} className="text-primary" />
                            </div>
                            <div className="fw-semibold small text-dark">Tải logo</div>
                            <div className="extra-small text-muted">PNG, JPG · tối đa ~2MB</div>
                          </div>
                        )}
                        {previewUrl && (
                          <div className="position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-75 text-white extra-small py-1 text-center">
                            Đổi logo
                          </div>
                        )}
                      </div>
                      <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={handleFileChange} />
                    </div>
                  </div>

                  {/* Dùng thử */}
                  <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                    <span className="rounded-2 bg-primary-subtle text-primary d-inline-flex p-2">
                      <Calendar size={18} />
                    </span>
                    <div>
                      <h2 className="h6 fw-bold mb-0">Gói dùng thử</h2>
                      <span className="text-muted extra-small">Thời hạn miễn phí trước khi nâng cấp</span>
                    </div>
                  </div>
                  <div className="row g-3 mb-4">
                    <div className="col-md-8 col-lg-6">
                      <label className="form-label small fw-bold text-secondary mb-1">Thời hạn *</label>
                      <select
                        className="form-select rounded-3"
                        required
                        value={formData.trialDays}
                        onChange={(e) => setFormData({ ...formData, trialDays: e.target.value })}
                      >
                        <option value="">— Chọn —</option>
                        <option value="3">3 ngày miễn phí</option>
                        <option value="7">7 ngày miễn phí</option>
                        <option value="30">30 ngày miễn phí</option>
                      </select>
                      <div className="form-text text-muted extra-small">Có thể đổi gói trong thời gian dùng thử.</div>
                    </div>
                  </div>

                  {/* Admin */}
                  <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                    <span className="rounded-2 bg-primary-subtle text-primary d-inline-flex p-2">
                      <Shield size={18} />
                    </span>
                    <div>
                      <h2 className="h6 fw-bold mb-0">Tài khoản quản trị</h2>
                      <span className="text-muted extra-small">Thiết lập tài khoản admin cho khách hàng</span>
                    </div>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary mb-1">Tên đăng nhập *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0 rounded-start-3">
                          <Mail size={16} className="text-muted" />
                        </span>
                        <input
                          type="text"
                          required
                          className="form-control border-start-0 rounded-end-3"
                          value={formData.account}
                          onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary mb-1">Mật khẩu khởi tạo *</label>
                      <div className="input-group">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          className="form-control rounded-start-3"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary border-start-0 rounded-end-3 px-3"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-light rounded-3 border d-flex gap-2 align-items-start">
                    <CheckCircle2 size={20} className="text-success flex-shrink-0 mt-0" />
                    <p className="mb-0 small text-muted">
                      Hệ thống sẽ tự động gán quyền Super Admin cho tài khoản này đối với tenant vừa tạo và gửi email hướng dẫn đăng nhập.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="sticky-top" style={{ top: '5.5rem', zIndex: 10 }}>
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                  <div className="card-header bg-light border-bottom py-3 px-3">
                    <h3 className="h6 mb-0 fw-bold d-flex align-items-center gap-2">
                      <CheckCircle2 size={18} className="text-primary" />
                      Tóm tắt
                    </h3>
                  </div>
                  <div className="card-body p-3">
                    <dl className="mb-3 small">
                      <div className="d-flex justify-content-between gap-2 py-2 border-bottom">
                        <dt className="text-muted fw-normal mb-0">Công ty</dt>
                        <dd className="mb-0 fw-semibold text-end text-break">{formData.companyName || '—'}</dd>
                      </div>
                      <div className="d-flex justify-content-between gap-2 py-2 border-bottom">
                        <dt className="text-muted fw-normal mb-0">Subdomain</dt>
                        <dd className="mb-0 fw-semibold text-end font-monospace">{formData.subDomain || '—'}</dd>
                      </div>
                      <div className="d-flex justify-content-between gap-2 py-2 border-bottom">
                        <dt className="text-muted fw-normal mb-0">Dùng thử</dt>
                        <dd className="mb-0 fw-semibold text-end">{formData.trialDays ? `${formData.trialDays} ngày` : '—'}</dd>
                      </div>
                      <div className="d-flex justify-content-between gap-2 py-2">
                        <dt className="text-muted fw-normal mb-0">Tài khoản</dt>
                        <dd className="mb-0 fw-semibold text-end text-break">{formData.account || '—'}</dd>
                      </div>
                    </dl>

                    <div className="rounded-3 border bg-light p-3 text-center mb-3">
                      <Calendar size={28} className="text-primary mb-1" />
                      <div className="text-muted text-uppercase extra-small fw-bold mb-0">Thử nghiệm</div>
                      <div className="fs-4 fw-bold text-dark">{formData.trialDays || '—'}</div>
                      <div className="text-muted extra-small">ngày</div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-2 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                      style={{ boxShadow: '0 2px 8px rgba(13, 110, 253, 0.25)' }}
                      disabled={submitting || !canSubmit}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <ArrowRight size={18} />
                          Kích hoạt hệ thống
                        </>
                      )}
                    </button>
                    <p className="text-center text-muted extra-small mt-2 mb-0 px-1">
                      Khởi tạo môi trường riêng và gửi mail kích hoạt cho khách.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .extra-small { font-size: 0.75rem; }
        .hover-shadow:hover { box-shadow: 0 0.35rem 0.9rem rgba(0,0,0,0.1) !important; }
        .transition-all { transition: all 0.2s ease; }
        .form-control:focus, .form-select:focus {
          border-color: rgba(13,110,253,.4);
          box-shadow: 0 0 0 0.2rem rgba(13,110,253,.12);
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </AdminLayout>
  );
};

export default CreateCompany;
