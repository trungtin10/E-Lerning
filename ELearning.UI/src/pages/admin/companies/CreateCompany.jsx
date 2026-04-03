import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Image as ImageIcon, Globe, Shield, Loader2, 
  Upload, Mail, Eye, EyeOff, CreditCard, Calendar,
  ArrowLeft, CheckCircle2, ArrowRight, Building2
} from 'lucide-react';
import api from '../../../api/axios';
import { useNotify } from '../../../context/NotifyContext';
import AdminLayout from '../../../components/layout/AdminLayout';

const CreateCompany = () => {
  const { toast } = useNotify();
  const navigate = useNavigate();
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
    api.get('/plan').then(res => setPlans(res.data)).catch(console.error);
  }, []);

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
      toast('Kích hoạt hệ thống thành công!', 'success');
      navigate('/admin/companies/checkout-success', { state: { companyData: formData } });
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

  const formatVND = (val) => {
    return new Intl.NumberFormat('vi-VN').format(val || 0) + ' VNĐ';
  };

  return (
    <AdminLayout>
      <div className="mb-4">
        <button 
          onClick={() => navigate('/admin/companies')}
          className="btn btn-link p-0 text-decoration-none text-muted d-flex align-items-center gap-2 mb-2"
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>
        <h2 className="fw-bold mb-1">Thiết lập Công ty Mới</h2>
        <p className="text-muted small mb-0">Khởi tạo hệ thống SaaS riêng biệt cho khách hàng và ghi nhận thanh toán.</p>
      </div>

      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="row g-4">
          {/* Left Column: Forms */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
              <div className="card-body p-4">
                <h6 className="fw-bold text-primary mb-4 d-flex align-items-center gap-2">
                  <ImageIcon size={18} /> 1. THÔNG TIN CÔNG TY
                </h6>
                <div className="row g-3">
                  <div className="col-md-7">
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-secondary">Tên Công ty khách hàng *</label>
                      <input
                        type="text" required className="form-control form-control-lg bg-light border-0"
                        value={formData.companyName}
                        onChange={e => setFormData({...formData, companyName: e.target.value})}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-secondary">Email liên hệ hệ thống *</label>
                      <input
                        type="email" required className="form-control form-control-lg bg-light border-0"
                        value={formData.contactEmail}
                        onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-secondary">Địa chỉ định danh (ID Hệ thống) *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white border-end-0"><Globe size={18} className="text-muted" /></span>
                        <input
                          type="text" required className="form-control form-control-lg bg-light border-start-0"
                          value={formData.subDomain}
                          onChange={e => setFormData({...formData, subDomain: e.target.value})}
                        />
                      </div>
                      <p className="extra-small text-muted mt-1">Dùng làm định danh duy nhất cho hệ thống của khách hàng này (VD: abc-group)</p>
                    </div>
                  </div>
                  <div className="col-md-5">
                    <div className="mb-3 text-center">
                      <label className="form-label small fw-bold text-secondary d-block text-start">Logo thương hiệu</label>
                      <div
                        className="bg-light rounded-4 border-2 border-dashed d-flex flex-column align-items-center justify-content-center position-relative overflow-hidden mt-2 mx-auto"
                        style={{ width: '160px', height: '160px', cursor: 'pointer' }}
                        onClick={() => fileInputRef.current.click()}
                      >
                        {previewUrl ? (
                          <img src={previewUrl} alt="preview" className="w-100 h-100 object-fit-contain p-2" />
                        ) : (
                          <div className="text-center p-3 opacity-50">
                             <Upload size={32} className="mb-2 mx-auto" />
                             <div className="small fw-bold">Tải logo lên</div>
                          </div>
                        )}
                        {previewUrl && (
                          <div className="position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-50 text-white small py-1">Thay đổi</div>
                        )}
                      </div>
                      <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={handleFileChange} />
                      <p className="text-muted extra-small mt-3">Định dạng hỗ trợ: PNG, JPG (Max 2MB)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
              <div className="card-body p-4">
                <h6 className="fw-bold text-primary mb-4 d-flex align-items-center gap-2">
                  <CreditCard size={18} /> 2. GÓI DỊCH VỤ & THANH TOÁN
                </h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-secondary">Chọn gói giải pháp *</label>
                      <select className="form-select form-select-lg bg-light border-0" required value={formData.servicePlanId} onChange={e => setFormData({...formData, servicePlanId: e.target.value})}>
                        <option value="">-- Chọn gói phù hợp --</option>
                        {plans.map(p => <option key={p.id} value={p.id}>{p.name} ({p.maxUsers} học viên)</option>)}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">Chu kỳ thanh toán</label>
                      <div className="d-flex gap-2 p-1 bg-light rounded-3">
                         <button type="button" className={`btn btn-sm flex-fill py-2 rounded-2 border-0 ${formData.billingCycleMonths === 1 ? 'bg-white shadow-sm text-primary fw-bold' : 'text-muted'}`} onClick={() => setFormData({...formData, billingCycleMonths: 1})}>Hàng tháng</button>
                         <button type="button" className={`btn btn-sm flex-fill py-2 rounded-2 border-0 ${formData.billingCycleMonths === 12 ? 'bg-white shadow-sm text-primary fw-bold' : 'text-muted'}`} onClick={() => setFormData({...formData, billingCycleMonths: 12})}>Hàng năm (-15%)</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-secondary">Số tiền thu thực tế (₫)</label>
                      <input
                        type="number" className="form-control form-control-lg bg-light border-0 fw-bold text-success"
                        value={formData.amountPaid}
                        onChange={e => setFormData({...formData, amountPaid: e.target.value})}
                      />
                      <div className="mt-1 small text-muted">
                        Định dạng: <span className="fw-bold text-dark">{formatVND(formData.amountPaid)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
               <div className="card-body p-4">
                <h6 className="fw-bold text-primary mb-4 d-flex align-items-center gap-2">
                  <Shield size={18} /> 3. TÀI KHOẢN QUẢN TRỊ (ADMIN)
                </h6>
                <div className="row g-3">
                   <div className="col-md-6">
                     <div className="mb-3">
                        <label className="form-label small fw-bold text-secondary">Username đăng nhập *</label>
                        <div className="input-group">
                           <span className="input-group-text bg-white border-end-0"><Mail size={18} className="text-muted" /></span>
                           <input
                            type="text" required className="form-control form-control-lg bg-light border-start-0"
                            value={formData.account}
                            onChange={e => setFormData({...formData, account: e.target.value})}
                          />
                        </div>
                      </div>
                   </div>
                   <div className="col-md-6">
                     <div className="mb-3">
                        <label className="form-label small fw-bold text-secondary">Mật khẩu khởi tạo *</label>
                        <div className="input-group">
                          <input
                            type={showPassword ? "text" : "password"} required className="form-control form-control-lg bg-light border-end-0"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                          />
                          <button type="button" className="btn btn-light px-3 border-start-0 border" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                   </div>
                </div>
                <div className="mt-3 p-3 bg-info-subtle rounded-3 d-flex gap-2 align-items-start">
                   <CheckCircle2 size={20} className="text-info shrink-0 mt-0.5" />
                   <p className="small mb-0 text-info-emphasis fw-medium">
                     Hệ thống sẽ tự động gán quyền Super Admin cho tài khoản này đối với tenant vừa tạo và gửi email hướng dẫn đăng nhập.
                   </p>
                </div>
               </div>
            </div>
          </div>

          {/* Right Column: Sticky Summary */}
          <div className="col-lg-4">
             <div className="sticky-top" style={{ top: '2rem', zIndex: 10 }}>
                <div className="card border-0 shadow rounded-4 overflow-hidden mb-4">
                  <div className="card-body p-4">
                    <h6 className="fw-bold text-dark mb-4">TỔNG QUAN THIẾT LẬP</h6>
                    
                    <div className="d-flex justify-content-between mb-3 pb-3 border-bottom">
                      <span className="text-muted">Tên tenant:</span>
                      <span className="fw-bold">{formData.companyName || '—'}</span>
                    </div>
                    
                    <div className="d-flex justify-content-between mb-3 pb-3 border-bottom">
                      <span className="text-muted">Gói dịch vụ:</span>
                      <span className="fw-bold">{plans.find(p => p.id == formData.servicePlanId)?.name || 'Chưa chọn'}</span>
                    </div>

                    <div className="d-flex justify-content-between mb-3 pb-3 border-bottom">
                      <span className="text-muted">Chu kỳ:</span>
                      <span className="fw-bold">{formData.billingCycleMonths === 12 ? 'Hàng năm' : 'Hàng tháng'}</span>
                    </div>

                    <div className="mb-4 text-center p-3 bg-success-subtle rounded-4">
                       <div className="text-success small fw-bold text-uppercase mb-1">Thanh toán dự kiến</div>
                       <div className="h3 fw-bold text-success mb-0">{formatVND(formData.amountPaid)}</div>
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary w-100 py-3 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          ĐANG XỬ LÝ...
                        </>
                      ) : (
                        <>
                          KÍCH HOẠT HỆ THỐNG
                        </>
                      )}
                    </button>
                    
                    <p className="text-center text-muted extra-small mt-3 mb-4">
                      Bằng việc nhấn kích hoạt, bạn đồng ý khởi tạo môi trường riêng biệt cho khách hàng này.
                    </p>

                    <div className="border-top pt-4">
                       <h6 className="text-center text-primary fw-bold mb-4">Chọn Phương thức thanh toán</h6>
                       
                       <div className="d-flex flex-column gap-2">
                          <div 
                            className={`payment-option d-flex align-items-center gap-3 p-3 rounded-3 border cursor-pointer transition-all ${formData.paymentMethod === 'VnPay' ? 'border-primary bg-primary-subtle shadow-sm' : 'bg-white'}`}
                            onClick={() => setFormData({...formData, paymentMethod: 'VnPay'})}
                          >
                             <div className="bg-white p-1 rounded shadow-sm">
                                <img src="https://vnpay.vn/wp-content/uploads/2020/07/icon-vnpay.png" alt="vnpay" width="32" height="32" className="object-fit-contain" />
                             </div>
                             <div className="flex-grow-1">
                                <div className="small fw-bold">Thanh toán quét mã <span className="text-danger">VNPAY</span><sup className="text-danger">QR</sup></div>
                             </div>
                          </div>

                          <div 
                            className={`payment-option d-flex align-items-center gap-3 p-3 rounded-3 border cursor-pointer transition-all ${formData.paymentMethod === 'MoMo' ? 'border-primary bg-primary-subtle shadow-sm' : 'bg-white'}`}
                            onClick={() => setFormData({...formData, paymentMethod: 'MoMo'})}
                          >
                             <div className="bg-white p-1 rounded shadow-sm">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/MoMo_Logo.png/320px-MoMo_Logo.png" alt="momo" width="32" height="32" className="object-fit-contain" />
                             </div>
                             <div className="flex-grow-1">
                                <div className="small fw-bold">Ví điện tử <span className="text-danger">MoMo</span></div>
                             </div>
                             <ArrowRight size={16} className="text-muted" />
                          </div>

                          <div 
                            className={`payment-option d-flex align-items-center gap-3 p-3 rounded-3 border cursor-pointer transition-all ${formData.paymentMethod === 'BankTransfer' ? 'border-primary bg-primary-subtle shadow-sm' : 'bg-white'}`}
                            onClick={() => setFormData({...formData, paymentMethod: 'BankTransfer'})}
                          >
                             <div className="bg-white p-1 rounded shadow-sm">
                                <CreditCard size={32} className="text-primary" />
                             </div>
                             <div className="flex-grow-1">
                                <div className="small fw-bold">Thẻ ATM và tài khoản ngân hàng</div>
                             </div>
                             <ArrowRight size={16} className="text-muted" />
                          </div>

                          <div 
                            className={`payment-option d-flex align-items-center gap-3 p-3 rounded-3 border cursor-pointer transition-all ${formData.paymentMethod === 'Check' ? 'border-primary bg-primary-subtle shadow-sm' : 'bg-white'}`}
                            onClick={() => setFormData({...formData, paymentMethod: 'Check'})}
                          >
                             <div className="bg-white p-1 rounded shadow-sm d-flex gap-1">
                                <img src="https://img.icons8.com/color/48/visa.png" width="16" alt="visa" />
                                <img src="https://img.icons8.com/color/48/mastercard.png" width="16" alt="master" />
                             </div>
                             <div className="flex-grow-1">
                                <div className="small fw-bold">Thẻ thanh toán quốc tế</div>
                             </div>
                             <ArrowRight size={16} className="text-muted" />
                          </div>

                          <div 
                            className={`payment-option d-flex align-items-center gap-3 p-3 rounded-3 border cursor-pointer transition-all ${formData.paymentMethod === 'Direct' ? 'border-primary bg-primary-subtle shadow-sm' : 'bg-white'}`}
                            onClick={() => setFormData({...formData, paymentMethod: 'Direct'})}
                          >
                             <div className="bg-white p-1 rounded shadow-sm text-center" style={{width: 40}}>
                                <Building2 size={24} className="text-success" />
                             </div>
                             <div className="flex-grow-1">
                                <div className="small fw-bold">Ví điện tử VNPay / Tiền mặt</div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </form>

      <style>{`
        .extra-small { font-size: 0.75rem; }
        .hover-shadow:hover { box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.1) !important; }
        .bg-info-subtle { background-color: #e0f2fe; }
        .text-info-emphasis { color: #0369a1; }
        .payment-option:hover { border-color: #3498db !important; background-color: #f0f9ff; }
        .cursor-pointer { cursor: pointer; }
        .bg-primary-subtle { background-color: #eef2ff; }
        .transition-all { transition: all 0.2s ease; }
      `}</style>
    </AdminLayout>
  );
};

export default CreateCompany;
