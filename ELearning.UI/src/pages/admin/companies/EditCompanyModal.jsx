import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Globe, Loader2, Upload, Mail } from 'lucide-react';
import api, { getUploadUrl } from '../../../api/axios';
import { useNotify } from '../../../context/NotifyContext';

const EditCompanyModal = ({ isOpen, onClose, onSuccess, company }) => {
  const { toast } = useNotify();
  const [formData, setFormData] = useState({
    companyName: '',
    contactEmail: '',
    subDomain: '',
    servicePlan: 'Basic'
  });
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (company) {
      setFormData({
        companyName: company.companyName || '',
        contactEmail: company.contactEmail || '',
        subDomain: company.subDomain || '',
        servicePlan: company.servicePlan || 'Basic'
      });
      setPreviewUrl(company.logoUrl ? getUploadUrl(company.logoUrl) : null);
      setLogoFile(null);
    }
  }, [company]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ràng buộc không để trống
    if (!formData.companyName || !formData.subDomain) {
      toast('Vui lòng điền đầy đủ Tên công ty và Domain.', 'warning');
      return;
    }

    setSubmitting(true);

    const data = new FormData();
    data.append('CompanyName', formData.companyName);
    data.append('ContactEmail', formData.contactEmail || '');
    data.append('SubDomain', formData.subDomain);
    data.append('ServicePlan', formData.servicePlan);
    if (logoFile) {
      data.append('LogoFile', logoFile);
    }

    try {
      await api.put(`/superadmin/companies/${company.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess();
      onClose();
      toast('Cập nhật thông tin công ty thành công!', 'success');
    } catch (err) {
      toast(err.response?.data || 'Lỗi không xác định.', 'error');
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
            <h5 className="fw-bold mb-0">Chỉnh sửa Công ty</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="mb-4 text-center">
                <div
                  className="mx-auto bg-light rounded-4 border-2 border-dashed d-flex flex-column align-items-center justify-content-center position-relative overflow-hidden"
                  style={{ width: '100px', height: '100px', cursor: 'pointer' }}
                  onClick={() => fileInputRef.current.click()}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="w-100 h-100 object-fit-cover"
                      onError={() => setPreviewUrl(null)}
                    />
                  ) : (
                    <ImageIcon size={24} className="text-muted" />
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={handleFileChange} />
                <small className="text-muted d-block mt-2">Nhấn để thay đổi Logo</small>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">Tên Công ty *</label>
                <input type="text" required className="form-control rounded-3" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">Email liên hệ</label>
                <div className="input-group">
                  <span className="input-group-text bg-light"><Mail size={16} /></span>
                  <input type="email" className="form-control rounded-3" value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">Domain riêng *</label>
                <div className="input-group">
                  <span className="input-group-text bg-light"><Globe size={16} /></span>
                  <input type="text" required className="form-control rounded-3" value={formData.subDomain} onChange={e => setFormData({...formData, subDomain: e.target.value})} />
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
            <div className="modal-footer border-0 p-4 pt-0">
              <button type="button" className="btn btn-light px-4 fw-bold" onClick={onClose}>Hủy</button>
              <button type="submit" className="btn btn-primary px-4 fw-bold shadow-sm" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCompanyModal;
