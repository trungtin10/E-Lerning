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
  const [activated, setActivated] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactEmail: '',
    subDomain: '',
    trialDays: '7', // mặc định 7 ngày dùng thử (3/7/30)
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
    if (activated) {
      toast('Công ty này đã được kích hoạt rồi.', 'info');
      navigate('/admin/companies');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setErrors({});

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
        setErrors(err.response.data.errors);
      } else {
        const msg = err.response?.data || 'Lỗi không xác định.';
        // Nếu backend báo đã tồn tại, coi như đã kích hoạt rồi.
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

  const formatVND = (val) => {
    return new Intl.NumberFormat('vi-VN').format(val || 0) + ' VNĐ';
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4 py-3">
        {/* Header with Progress */}
        <div className="mb-5">
          <button 
            onClick={() => navigate('/admin/companies')}
            className="btn btn-outline-secondary btn-sm mb-3 d-flex align-items-center gap-2"
          >
            <ArrowLeft size={16} /> Quay lại danh sách
          </button>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h1 className="h2 fw-bold text-dark mb-1 d-flex align-items-center gap-3">
                <Building2 size={28} className="text-primary" />
                Thiết lập Công ty Mới
              </h1>
              <p className="text-muted mb-0">Khởi tạo hệ thống SaaS riêng biệt cho khách hàng với trải nghiệm chuyên nghiệp</p>
            </div>
            <div className="text-end">
              <div className="small text-muted">Bước 1/3</div>
              <div className="progress mt-2" style={{ width: '200px', height: '6px' }}>
                <div className="progress-bar bg-primary" style={{ width: '33%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="needs-validation" noValidate>
        <div className="row g-5">
          {/* Left Column: Forms */}
          <div className="col-lg-8">
            {/* Step 1: Company Info */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 position-relative">
              <div className="card-header bg-light text-dark py-3 border-bottom">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white border rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <ImageIcon size={20} className="text-primary" />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold">1. Thông tin Công ty</h5>
                    <small className="text-muted">Thiết lập thông tin cơ bản cho khách hàng</small>
                  </div>
                </div>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-7">
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-secondary">Tên Công ty khách hàng *</label>
                      <input
                        type="text" required className="form-control form-control-lg bg-white"
                        value={formData.companyName}
                        onChange={e => setFormData({...formData, companyName: e.target.value})}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-secondary">Email liên hệ hệ thống *</label>
                      <input
                        type="email" required className="form-control form-control-lg bg-white"
                        value={formData.contactEmail}
                        onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-secondary">Địa chỉ định danh (ID Hệ thống) *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white"><Globe size={18} className="text-muted" /></span>
                        <input
                          type="text" required className="form-control form-control-lg bg-white"
                          value={formData.subDomain}
                          onChange={e => setFormData({...formData, subDomain: e.target.value})}
                        />
                      </div>
                      <p className="extra-small text-muted mt-1">Dùng làm định danh duy nhất cho hệ thống của khách hàng này (VD: abc-group)</p>
                    </div>
                  </div>
                  <div className="col-md-5">
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark mb-3">Logo thương hiệu</label>
                      <div
                        className="bg-light rounded-4 border border-dashed d-flex flex-column align-items-center justify-content-center position-relative overflow-hidden mt-2 mx-auto hover-shadow transition-all"
                        style={{ width: '180px', height: '180px', cursor: 'pointer' }}
                        onClick={() => fileInputRef.current.click()}
                      >
                        {previewUrl ? (
                          <img src={previewUrl} alt="Logo preview" className="w-100 h-100 object-fit-contain p-3" />
                        ) : (
                          <div className="text-center p-4">
                             <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                               <Upload size={28} className="text-primary" />
                             </div>
                             <div className="fw-semibold text-dark mb-1">Tải logo lên</div>
                             <div className="small text-muted">PNG, JPG tối đa 2MB</div>
                          </div>
                        )}
                        {previewUrl && (
                          <div className="position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-75 text-white small py-2 text-center fw-semibold">
                            Thay đổi logo
                          </div>
                        )}
                      </div>
                      <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={handleFileChange} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Service Plan */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 position-relative">
              <div className="card-header bg-light text-dark py-3 border-bottom">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white border rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <Calendar size={20} className="text-primary" />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold">2. Gói Dịch vụ</h5>
                    <small className="text-muted">Chọn thời hạn dùng thử miễn phí</small>
                  </div>
                </div>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-8">
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark">Thời hạn dùng thử *</label>
                      <select 
                        className="form-select form-select-lg bg-white rounded-3" 
                        required 
                        value={formData.trialDays} 
                        onChange={e => setFormData({...formData, trialDays: e.target.value})}
                      >
                        <option value="">-- Chọn thời hạn --</option>
                        <option value="3">3 ngày miễn phí</option>
                        <option value="7">7 ngày miễn phí</option>
                        <option value="30">30 ngày miễn phí</option>
                      </select>
                      <div className="form-text text-muted">Khách hàng có thể nâng cấp gói bất cứ lúc nào trong thời gian dùng thử</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Admin Account */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden position-relative">
              <div className="card-header bg-light text-dark py-3 border-bottom">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white border rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <Shield size={20} className="text-primary" />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold">3. Tài khoản Quản trị</h5>
                    <small className="text-muted">Thiết lập tài khoản admin cho khách hàng</small>
                  </div>
                </div>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                   <div className="col-md-6">
                     <div className="mb-3">
                        <label className="form-label small fw-bold text-secondary">Username đăng nhập *</label>
                        <div className="input-group">
                           <span className="input-group-text bg-white"><Mail size={18} className="text-muted" /></span>
                           <input
                            type="text" required className="form-control form-control-lg bg-white"
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
                            type={showPassword ? "text" : "password"} required className="form-control form-control-lg bg-white"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                          />
                          <button type="button" className="btn btn-light px-3" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                   </div>
                </div>
                <div className="mt-4 p-4 bg-light rounded-4 border">
                   <div className="d-flex gap-3 align-items-start">
                     <CheckCircle2 size={24} className="text-success shrink-0 mt-1" />
                     <div>
                       <h6 className="fw-bold text-dark mb-2">Thông tin quan trọng</h6>
                       <p className="mb-0 text-muted small">
                         Hệ thống sẽ tự động gán quyền Super Admin cho tài khoản này đối với tenant vừa tạo và gửi email hướng dẫn đăng nhập.
                       </p>
                     </div>
                   </div>
                </div>
               </div>
            </div>
          </div>

          {/* Right Column: Enhanced Summary */}
          <div className="col-lg-4">
             <div className="sticky-top" style={{ top: '2rem', zIndex: 10 }}>
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                  <div className="card-header bg-light text-dark py-3 border-bottom">
                    <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                      <CheckCircle2 size={18} />
                      Tổng quan Thiết lập
                    </h6>
                  </div>
                  <div className="card-body p-4">
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                        <span className="text-muted fw-medium">Tên công ty:</span>
                        <span className="fw-bold text-dark">{formData.companyName || '—'}</span>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                        <span className="text-muted fw-medium">Subdomain:</span>
                        <span className="fw-bold text-dark">{formData.subDomain || '—'}</span>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                        <span className="text-muted fw-medium">Gói dịch vụ:</span>
                        <span className="fw-bold text-dark">{formData.trialDays ? `${formData.trialDays} ngày miễn phí` : 'Chưa chọn'}</span>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-light rounded-4 border mb-4">
                       <Calendar size={32} className="text-primary mb-2" />
                       <div className="text-muted fw-bold text-uppercase small mb-1">Thời hạn dùng thử</div>
                       <div className="h2 fw-bold text-dark mb-0">{formData.trialDays ? `${formData.trialDays}` : '—'}</div>
                       <div className="text-muted small">ngày</div>
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary w-100 py-3 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 hover-shadow transition-all"
                      disabled={submitting || !formData.companyName || !formData.contactEmail || !formData.subDomain || !formData.trialDays || !formData.account || !formData.password}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <ArrowRight size={18} />
                          Kích hoạt hệ thống
                        </>
                      )}
                    </button>
                    
                    <div className="text-center mt-3">
                      <small className="text-muted">
                        Bằng việc nhấn kích hoạt, bạn đồng ý khởi tạo môi trường riêng biệt cho khách hàng này.
                      </small>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </form>
    </div>

      <style>{`
        .extra-small { font-size: 0.75rem; }
        .hover-shadow:hover { box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15) !important; }
        .cursor-pointer { cursor: pointer; }
        .form-control:focus, .form-select:focus {
          border-color: rgba(13,110,253,.35);
          box-shadow: 0 0 0 0.2rem rgba(13,110,253,.12);
        }
        .card-header {
          border-bottom: 1px solid rgba(0,0,0,.06);
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AdminLayout>
  );
};

export default CreateCompany;
