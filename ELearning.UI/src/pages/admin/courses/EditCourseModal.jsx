import React, { useState, useEffect } from 'react';
import { X, BookOpen, Layers, Globe, Loader2, Hash, Calendar, Building2 } from 'lucide-react';
import api from '../../../api/axios';
import { useNotify } from '../../../context/NotifyContext';

const EditCourseModal = ({ isOpen, onClose, onSuccess, course }) => {
  const { toast } = useNotify();
  const [formData, setFormData] = useState({
    courseCode: '',
    title: '',
    categoryId: '',
    companyId: '',
    isPublished: false,
    startDate: '',
    endDate: ''
  });
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.roles?.includes('SuperAdmin');

  useEffect(() => {
    if (isOpen && course) {
      setFormData({
        courseCode: course.courseCode || '',
        title: course.title || '',
        categoryId: course.categoryId?.toString() || '',
        companyId: course.companyId?.toString() || '',
        isPublished: !!course.isPublished,
        startDate: course.startDate ? new Date(course.startDate).toISOString().split('T')[0] : '',
        endDate: course.endDate ? new Date(course.endDate).toISOString().split('T')[0] : ''
      });
      fetchInitialData();
    }
  }, [isOpen, course]);

  const fetchInitialData = async () => {
    setLoadingData(true);
    try {
      const [catRes, compRes] = await Promise.all([
        api.get('/course/categories'),
        isSuperAdmin ? api.get('/superadmin/companies') : Promise.resolve({ data: [] })
      ]);
      setCategories(catRes.data);
      if (isSuperAdmin) setCompanies(compRes.data);
    } catch (err) {
      console.error('Error fetching categories/companies:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const data = new FormData();
    data.append('CourseCode', formData.courseCode);
    data.append('Title', formData.title);
    data.append('CategoryId', formData.categoryId);
    data.append('IsPublished', formData.isPublished);
    data.append('StartDate', formData.startDate);

    if (formData.endDate) data.append('EndDate', formData.endDate);

    data.append('CompanyId', formData.companyId || '0');

    try {
      await api.put(`/course/${course.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data || 'Lỗi khi cập nhật khóa học.';
      toast(typeof errorMsg === 'string' ? errorMsg : 'Lỗi khi cập nhật khóa học.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !course) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content border-0 rounded-4 shadow">
          <div className="modal-header border-0 p-4 pb-0">
            <h5 className="fw-bold mb-0 text-primary">Chỉnh sửa khóa học</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {loadingData ? (
            <div className="modal-body p-5 text-center">
              <Loader2 className="animate-spin text-primary mx-auto mb-2" size={32} />
              <p className="text-muted small">Đang tải dữ liệu hiện tại...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="modal-body p-4">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label small fw-bold">Mã khóa học *</label>
                    <input type="text" required className="form-control rounded-3 bg-light" value={formData.courseCode} onChange={e => setFormData({...formData, courseCode: e.target.value})} />
                  </div>
                  <div className="col-md-8 mb-3">
                    <label className="form-label small fw-bold">Tên khóa học *</label>
                    <input type="text" required className="form-control rounded-3" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Danh mục chuyên ngành *</label>
                  <select required className="form-select rounded-3" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                    <option value="">-- Chọn chuyên ngành --</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>)}
                  </select>
                </div>

                {isSuperAdmin && (
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Đơn vị sở hữu</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><Building2 size={16} /></span>
                      <select className="form-select rounded-end-3" value={formData.companyId} onChange={e => setFormData({...formData, companyId: e.target.value})}>
                        <option value="">Hệ thống tổng (Dùng chung)</option>
                        {companies.map(comp => <option key={comp.id} value={comp.id.toString()}>{comp.companyName}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-bold">Ngày bắt đầu *</label>
                    <input type="date" required className="form-control rounded-3" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-bold">Ngày kết thúc</label>
                    <input type="date" className="form-control rounded-3" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                  </div>
                </div>

                <div className="form-check form-switch mt-3">
                  <input className="form-check-input" type="checkbox" checked={formData.isPublished} onChange={e => setFormData({...formData, isPublished: e.target.checked})} />
                  <label className="form-check-label fw-bold small">Công khai khóa học</label>
                </div>
              </div>
              <div className="modal-footer border-0 p-4 pt-0">
                <button type="button" className="btn btn-light px-4 fw-bold" onClick={onClose}>Hủy</button>
                <button type="submit" className="btn btn-primary px-4 fw-bold shadow-sm" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditCourseModal;
