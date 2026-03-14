import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Globe, Shield, Loader2, Upload, Mail, Eye, EyeOff } from 'lucide-react';
import api from '../../../api/axios';
import { useNotify } from '../../../context/NotifyContext';

const AddCompanyModal = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useNotify();
  const [formData, setFormData] = useState({
    companyName: '',
    contactEmail: '',
    subDomain: '',
    servicePlan: 'Basic',
    account: '',
    password: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
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
    setSubmitting(true);
    setErrors({});

    const data = new FormData();
    data.append('CompanyName', formData.companyName);
    data.append('ContactEmail', formData.contactEmail);
    data.append('SubDomain', formData.subDomain);
    data.append('ServicePlan', formData.servicePlan);
    data.append('Account', formData.account);
    data.append('Password', formData.password);
    if (logoFile) data.append('LogoFile', logoFile);

    try {
      await api.post('/superadmin/register-tenant', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ companyName: '', contactEmail: '', subDomain: '', servicePlan: 'Basic', account: '', password: '' });
      setLogoFile(null);
      setPreviewUrl(null);
      setShowPassword(false);
      onSuccess();
      onClose();
      toast('Kích hoạt hệ thống thành công!', 'success');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast(err.response?.data || 'Lỗi không xác định.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content border-0 rounded-4 shadow">
          <div className="modal-header border-0 p-4 pb-0">
            <h5 className="fw-bold mb-0">Thiết lập Công ty mới</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Ngăn chặn autofill */}
            <input type="text" style={{ display: 'none' }} />
            <input type="password" style={{ display: 'none' }} />

            <div className="modal-body p-4">
              <div className="row">
                <div className="col-md-6 border-end">
                  <label className="form-label small fw-bold text-primary mb-3 text-uppercase">Thông tin Công ty</label>

                  <div className="mb-4 text-center">
                    <div
                      className="mx-auto bg-light rounded-4 border-2 border-dashed d-flex flex-column align-items-center justify-content-center position-relative overflow-hidden"
                      style={{ width: '100px', height: '120px', cursor: 'pointer' }}
                      onClick={() => fileInputRef.current.click()}
                    >
                      {previewUrl ? (
                        <img src={previewUrl} alt="preview" className="w-100 h-100 object-fit-cover" />
                      ) : (
                        <Upload size={24} className="text-muted" />
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={handleFileChange} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Tên Công ty *</label>
                    <input
                      type="text"
                      required
                      autoComplete="new-password"
                      className={`form-control rounded-3 ${errors.CompanyName ? 'is-invalid' : ''}`}
                      value={formData.companyName}
                      onChange={e => setFormData({...formData, companyName: e.target.value})}
                    />
                    {errors.CompanyName && <div className="invalid-feedback small">{errors.CompanyName[0]}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Email liên hệ *</label>
                    <div className="input-group has-validation">
                      <span className="input-group-text bg-light"><Mail size={16} /></span>
                      <input
                        type="email"
                        required
                        autoComplete="new-password"
                        className={`form-control rounded-end-3 ${errors.ContactEmail ? 'is-invalid' : ''}`}
                        value={formData.contactEmail}
                        onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                      />
                      {errors.ContactEmail && <div className="invalid-feedback small">{errors.ContactEmail[0]}</div>}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Domain riêng *</label>
                    <div className="input-group has-validation">
                      <span className="input-group-text bg-light"><Globe size={16} /></span>
                      <input
                        type="text"
                        required
                        autoComplete="new-password"
                        className={`form-control rounded-end-3 ${errors.SubDomain ? 'is-invalid' : ''}`}
                        value={formData.subDomain}
                        onChange={e => setFormData({...formData, subDomain: e.target.value})}
                      />
                      {errors.SubDomain && <div className="invalid-feedback small">{errors.SubDomain[0]}</div>}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Gói dịch vụ</label>
                    <select className="form-select rounded-3" value={formData.servicePlan} onChange={e => setFormData({...formData, servicePlan: e.target.value})}>
                      <option value="Basic">Gói Basic</option>
                      <option value="Business">Gói Business</option>
                      <option value="Enterprise">Gói Enterprise</option>
                    </select>
                  </div>
                </div>

                <div className="col-md-6 ps-md-4">
                  <label className="form-label small fw-bold text-primary mb-3 text-uppercase">Tài khoản Quản trị (Admin)</label>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Email quản trị (Gmail) *</label>
                    <div className="input-group has-validation">
                      <span className="input-group-text bg-light"><Mail size={16} /></span>
                      <input
                        type="email"
                        required
                        autoComplete="new-password"
                        className={`form-control rounded-end-3 ${errors.ContactEmail ? 'is-invalid' : ''}`}
                        value={formData.contactEmail}
                        onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                      />
                      {errors.ContactEmail && <div className="invalid-feedback small">{errors.ContactEmail[0]}</div>}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Tên tài khoản đăng nhập *</label>
                    <input
                      type="text"
                      required
                      autoComplete="new-password"
                      className={`form-control rounded-3 ${errors.Account ? 'is-invalid' : ''}`}
                      value={formData.account}
                      onChange={e => setFormData({...formData, account: e.target.value})}
                    />
                    {errors.Account && <div className="invalid-feedback small">{errors.Account[0]}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Mật khẩu khởi tạo *</label>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        className={`form-control rounded-3 ${errors.Password ? 'is-invalid' : ''}`}
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                      <button type="button" className="btn btn-outline-secondary rounded-3 ms-2 d-flex align-items-center" onClick={() => setShowPassword(!showPassword)} style={{ border: '1px solid #dee2e6' }}>
                        {showPassword ? <EyeOff size={18} className="text-muted" /> : <Eye size={18} className="text-muted" />}
                      </button>
                    </div>
                    {errors.Password && <div className="invalid-feedback small d-block">{errors.Password[0]}</div>}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 p-4 pt-0">
              <button type="button" className="btn btn-light px-4 fw-bold" onClick={onClose}>Hủy</button>
              <button type="submit" className="btn btn-primary px-4 fw-bold shadow-sm" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Kích hoạt hệ thống'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCompanyModal;
