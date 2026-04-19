import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  X, Image as ImageIcon, Globe, Loader2, Upload, Mail, ArrowLeft, CheckCircle2,
  Calendar, Shield, Eye, EyeOff
} from 'lucide-react';
import api from '../../../api/axios';
import { getUploadUrl } from '../../../api/axios';
import { useNotify } from '../../../context/NotifyContext';
import AdminLayout from '../../../components/layout/AdminLayout';

const EditCompany = () => {
  const { toast } = useNotify();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    companyName: '',
    contactEmail: '',
    subDomain: '',
    isActive: false,
    servicePlan: 'Free',
    trialDays: '',
    amountPaid: 0,
    billingCycleMonths: 1,
    paymentMethod: 'BankTransfer',
  });

  useEffect(() => {
    const companyState = location.state?.company;
    if (companyState) {
      const c = companyState;
      setFormData(prev => ({
        ...prev,
        companyName: c.companyName || '',
        contactEmail: c.contactEmail || '',
        subDomain: c.subDomain || '',
        servicePlan: c.servicePlan || 'Free',
        isActive: !!c.isActive,
      }));
      setPreviewUrl(c.logoUrl ? getUploadUrl(c.logoUrl) : null);
      setLoading(false);
      return;
    }

    if (!id) {
      toast('ID công ty không xác định.', 'error');
      navigate('/admin/companies');
      return;
    }

    api.get('/superadmin/companies').then(res => {
      const c = res.data.find(item => item.id === parseInt(id, 10));
      if (!c) {
        toast('Không tìm thấy công ty.', 'error');
        navigate('/admin/companies');
        return;
      }
      setFormData(prev => ({
        ...prev,
        companyName: c.companyName || '',
        contactEmail: c.contactEmail || '',
        subDomain: c.subDomain || '',
        servicePlan: c.servicePlan || 'Free',
        isActive: !!c.isActive,
      }));
      setPreviewUrl(c.logoUrl ? getUploadUrl(c.logoUrl) : null);
    }).catch(err => {
      toast('Không thể tải dữ liệu công ty.', 'error');
      console.error(err);
    }).finally(() => setLoading(false));
  }, [id, location.state, navigate, toast]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const formatVND = (val) => {
    return new Intl.NumberFormat('vi-VN').format(val || 0) + ' VNĐ';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numericId = Number.parseInt(String(id ?? ''), 10);
    if (!Number.isFinite(numericId)) {
      toast('ID công ty không hợp lệ.', 'error');
      return;
    }
    if (!formData.companyName || !formData.subDomain) {
      toast('Vui lòng điền Tên công ty và Địa chỉ định danh.', 'warning');
      return;
    }

    setSubmitting(true);
    const data = new FormData();
    data.append('CompanyName', formData.companyName);
    data.append('ContactEmail', formData.contactEmail || '');
    data.append('SubDomain', formData.subDomain);
    data.append('ServicePlan', formData.servicePlan);
    data.append('IsActive', String(formData.isActive));
    if (formData.trialDays) data.append('TrialDays', String(formData.trialDays));
    if (logoFile) data.append('LogoFile', logoFile);

    try {
      await api.put(`/superadmin/companies/${numericId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast('Cập nhật thông tin công ty thành công!', 'success');
      navigate('/admin/companies');
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        typeof data === 'string' ? data :
        (data?.message || data?.error || 'Cập nhật công ty thất bại.');
      toast(msg, 'error');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-5"><Loader2 className="animate-spin" size={32} /><p>Đang tải...</p></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-4">
        <button
          onClick={() => navigate('/admin/companies')}
          className="btn btn-link p-0 text-decoration-none text-muted d-flex align-items-center gap-2 mb-2"
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>
        <h2 className="fw-bold mb-1">Chỉnh sửa Công ty</h2>
        <p className="text-muted small mb-0">Đồng bộ giao diện với trang thêm công ty, không dùng popup.</p>
      </div>

      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="row g-4">
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
                      <input type="text" required className="form-control form-control-lg bg-light border-0" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-secondary">Email liên hệ</label>
                      <input type="email" className="form-control form-control-lg bg-light border-0" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-secondary">Địa chỉ định danh (ID Hệ thống) *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white border-end-0"><Globe size={18} className="text-muted" /></span>
                        <input type="text" required className="form-control form-control-lg bg-light border-start-0" value={formData.subDomain} onChange={(e) => setFormData({ ...formData, subDomain: e.target.value })} />
                      </div>
                      <p className="extra-small text-muted mt-1">Dùng làm định danh duy nhất cho hệ thống</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-secondary">Gói dịch vụ</label>
                      <select 
                        className="form-select form-select-lg bg-light border-0" 
                        value={formData.servicePlan} 
                        onChange={(e) => {
                          const val = e.target.value;
                          let days = '';
                          if (val.includes('3 ngày')) days = '3';
                          else if (val.includes('7 ngày')) days = '7';
                          else if (val.includes('30 ngày')) days = '30';
                          
                          setFormData({ ...formData, servicePlan: val, trialDays: days });
                        }}
                      >
                        <option value="Free">Giao diện Miễn phí (Free)</option>
                        <option value="Free (3 ngày dùng thử)">Free (3 ngày dùng thử)</option>
                        <option value="Free (7 ngày dùng thử)">Free (7 ngày dùng thử)</option>
                        <option value="Free (30 ngày dùng thử)">Free (30 ngày dùng thử)</option>
                        <option value="Basic">Gói Mở rộng (Basic)</option>
                        <option value="Plus">Gói Nâng cao (Plus)</option>
                        <option value="Pro">Gói Doanh nghiệp (Pro)</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-5">
                    <div className="mb-3 text-center">
                      <label className="form-label small fw-bold text-secondary d-block text-start">Logo thương hiệu</label>
                      <div className="bg-light rounded-4 border-2 border-dashed d-flex flex-column align-items-center justify-content-center position-relative overflow-hidden mt-2 mx-auto" style={{ width: '160px', height: '160px', cursor: 'pointer' }} onClick={() => fileInputRef.current.click()}>
                        {previewUrl ? (
                          <img src={previewUrl} alt="preview" className="w-100 h-100 object-fit-contain p-2" />
                        ) : (
                          <div className="text-center p-3 opacity-50"><Upload size={32} className="mb-2 mx-auto" /><div className="small fw-bold">Tải logo lên</div></div>
                        )}
                        {previewUrl && <div className="position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-50 text-white small py-1">Thay đổi</div>}
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
                <h6 className="fw-bold text-primary mb-4 d-flex align-items-center gap-2"><Shield size={18} /> 2. TRẠNG THÁI</h6>
                <div className="form-check form-switch">
                  <input type="checkbox" className="form-check-input" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} id="isActiveSwitch" />
                  <label className="form-check-label" htmlFor="isActiveSwitch">Kích hoạt công ty</label>
                </div>
                <div className="small text-muted mt-2">Chỉ công ty đã kích hoạt mới có thể đăng nhập.</div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="sticky-top" style={{ top: '2rem', zIndex: 10 }}>
              <div className="card border-0 shadow rounded-4 overflow-hidden mb-4">
                <div className="card-body p-4">
                  <h6 className="fw-bold text-dark mb-4">TỔNG QUAN</h6>
                  <div className="d-flex justify-content-between mb-3 pb-3 border-bottom"><span className="text-muted">Tên doanh nghiệp:</span><span className="fw-bold">{formData.companyName || '—'}</span></div>
                  <div className="d-flex justify-content-between mb-3 pb-3 border-bottom"><span className="text-muted">Domain:</span><span className="fw-bold">{formData.subDomain || '—'}</span></div>
                  <div className="d-flex justify-content-between mb-3 pb-3 border-bottom"><span className="text-muted">Gói cước:</span><span className="fw-bold">{formData.servicePlan || 'Free'}</span></div>
                  <div className="d-flex justify-content-between mb-3 pb-3 border-bottom"><span className="text-muted">Trạng thái:</span><span className="fw-bold">{formData.isActive ? 'Đã kích hoạt' : 'Chưa kích hoạt'}</span></div>
                  <button type="submit" className="btn btn-primary w-100 py-3 rounded-3 fw-bold" disabled={submitting}>{submitting ? <><Loader2 className="animate-spin" size={18} /> Đang lưu...</> : 'Lưu thay đổi'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      <style>{`.extra-small { font-size: 0.75rem; }`}</style>
    </AdminLayout>
  );
};

export default EditCompany;
