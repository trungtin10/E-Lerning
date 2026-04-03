import React, { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Globe, Shield, Loader2, Upload, Mail, Eye, EyeOff, CreditCard, Calendar } from 'lucide-react';
import api from '../../../api/axios';
import { useNotify } from '../../../context/NotifyContext';

const AddCompanyModal = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useNotify();
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    companyName: '',
    contactEmail: '',
    subDomain: '',
    servicePlanId: '',
    billingCycleMonths: 1,
    paymentMethod: 'BankTransfer',
    amountPaid: '',
    account: '',
    password: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      api.get('/plan').then(res => setPlans(res.data)).catch(console.error);
    }
  }, [isOpen]);

  // Tự động tính số tiền khi chọn gói hoặc chu kỳ
  useEffect(() => {
    if (formData.servicePlanId) {
      const plan = plans.find(p => p.id === parseInt(formData.servicePlanId));
      if (plan) {
        const amount = formData.billingCycleMonths === 12 ? plan.priceYearly : plan.priceMonthly;
        setFormData(prev => ({ ...prev, amountPaid: amount }));
      }
    }
  }, [formData.servicePlanId, formData.billingCycleMonths, plans]);

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
    data.append('ServicePlanId', formData.servicePlanId);
    data.append('BillingCycleMonths', formData.billingCycleMonths);
    data.append('PaymentMethod', formData.paymentMethod);
    data.append('AmountPaid', formData.amountPaid);
    data.append('Account', formData.account);
    data.append('Password', formData.password);
    if (logoFile) data.append('LogoFile', logoFile);

    try {
      await api.post('/superadmin/register-tenant', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ companyName: '', contactEmail: '', subDomain: '', servicePlanId: '', billingCycleMonths: 1, paymentMethod: 'BankTransfer', amountPaid: '', account: '', password: '' });
      setLogoFile(null);
      setPreviewUrl(null);
      setShowPassword(false);
      onSuccess();
      onClose();
      toast('Kích hoạt hệ thống và tạo lịch sử thanh toán thành công!', 'success');
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
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content border-0 rounded-4 shadow overflow-hidden">
          <div className="modal-header border-0 p-4 pb-0 bg-white">
            <div>
              <h5 className="fw-bold mb-0">Thiết lập Công ty & Thanh toán</h5>
              <p className="text-muted small mb-0">Khởi tạo hệ thống mới kèm theo lịch sử giao dịch trực tiếp.</p>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="modal-body p-4 bg-white">
              <div className="row g-4">
                {/* Column 1: Company Info */}
                <div className="col-lg-4 border-end">
                   <h6 className="small fw-bold text-primary mb-3 text-uppercase d-flex align-items-center gap-2">
                     <ImageIcon size={16} /> Thông tin Công ty
                   </h6>
                   
                   <div className="mb-4 text-center">
                    <div
                      className="mx-auto bg-light rounded-4 border-2 border-dashed d-flex flex-column align-items-center justify-content-center position-relative overflow-hidden"
                      style={{ width: '100px', height: '100px', cursor: 'pointer' }}
                      onClick={() => fileInputRef.current.click()}
                    >
                      {previewUrl ? (
                        <img src={previewUrl} alt="preview" className="w-100 h-100 object-fit-cover" />
                      ) : (
                        <Upload size={24} className="text-muted" />
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={handleFileChange} />
                    <div className="text-muted small mt-2">Ảnh Logo</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Tên Công ty *</label>
                    <input
                      type="text" required className="form-control"
                      value={formData.companyName}
                      onChange={e => setFormData({...formData, companyName: e.target.value})}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Email liên hệ *</label>
                    <input
                      type="email" required className="form-control"
                      value={formData.contactEmail}
                      onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Domain riêng (Subdomain) *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><Globe size={16} /></span>
                      <input
                        type="text" required className="form-control"
                        value={formData.subDomain}
                        onChange={e => setFormData({...formData, subDomain: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: Payment info */}
                <div className="col-lg-4 border-end">
                  <h6 className="small fw-bold text-primary mb-3 text-uppercase d-flex align-items-center gap-2">
                     <CreditCard size={16} /> Gói dịch vụ & Giao dịch
                   </h6>
                  
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Chọn gói dịch vụ *</label>
                    <select className="form-select" required value={formData.servicePlanId} onChange={e => setFormData({...formData, servicePlanId: e.target.value})}>
                      <option value="">-- Chọn gói --</option>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Chu kỳ thanh toán</label>
                    <div className="d-flex gap-2">
                       <button type="button" className={`btn btn-sm flex-fill ${formData.billingCycleMonths === 1 ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFormData({...formData, billingCycleMonths: 1})}>Hàng tháng</button>
                       <button type="button" className={`btn btn-sm flex-fill ${formData.billingCycleMonths === 12 ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFormData({...formData, billingCycleMonths: 12})}>Hàng năm (-15%)</button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Phương thức thanh toán</label>
                    <select className="form-select text-capitalize" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                      <option value="Direct">Tiền mặt (Trực tiếp)</option>
                      <option value="BankTransfer">Chuyển khoản</option>
                      <option value="VnPay">VNPay</option>
                      <option value="MoMo">MoMo</option>
                      <option value="Check">Séc</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Số tiền đã thu (₫)</label>
                    <input
                      type="number" className="form-control fw-bold text-success mb-1"
                      value={formData.amountPaid}
                      onChange={e => setFormData({...formData, amountPaid: e.target.value})}
                    />
                    <div className="text-muted small">
                      Định dạng: <span className="fw-bold text-dark">{new Intl.NumberFormat('vi-VN').format(formData.amountPaid || 0)} VNĐ</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Admin account */}
                <div className="col-lg-4">
                  <h6 className="small fw-bold text-primary mb-3 text-uppercase d-flex align-items-center gap-2">
                     <Shield size={16} /> Tài khoản Quản trị
                   </h6>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Tên tài khoản đăng nhập *</label>
                    <input
                      type="text" required className="form-control"
                      value={formData.account}
                      onChange={e => setFormData({...formData, account: e.target.value})}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Mật khẩu khởi tạo *</label>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"} required className="form-control"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                      <button type="button" className="btn btn-outline-secondary px-2" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="alert alert-info py-2 px-3 small mt-4">
                     <i className="bi bi-info-circle me-1"></i>
                     Sau khi kích hoạt, hệ thống sẽ tự động gửi email thông báo và thông tin truy cập cho Admin công ty.
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 p-4 pt-0 bg-white">
              <button type="button" className="btn btn-secondary px-4" onClick={onClose}>Hủy</button>
              <button type="submit" className="btn btn-primary px-5 fw-bold shadow" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin me-2" size={18} /> : 'Kích hoạt & Ghi nhận giao dịch'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCompanyModal;
