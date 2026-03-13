import React, { useState, useEffect } from 'react';
import { X, BookOpen, Layers, Globe, Loader2, Plus, Hash, Calendar } from 'lucide-react';
import api from '../../../api/axios';

const AddCourseModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    courseCode: '',
    title: '',
    categoryId: '',
    companyId: '',
    isPublished: false,
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.roles?.includes('SuperAdmin');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [catRes, compRes] = await Promise.all([
        api.get('/course/categories'),
        isSuperAdmin ? api.get('/superadmin/companies') : Promise.resolve({ data: [] })
      ]);
      setCategories(catRes.data);
      if (isSuperAdmin) setCompanies(compRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleQuickAddCategory = async () => {
    if (!newCategoryName) return;
    try {
      const response = await api.post('/course/categories', { name: newCategoryName });
      setCategories([...categories, response.data]);
      setFormData({ ...formData, categoryId: response.data.id });
      setNewCategoryName('');
      setShowQuickAddCategory(false);
    } catch (err) {
      alert('Lỗi khi thêm danh mục nhanh.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = new FormData();
      data.append('CourseCode', formData.courseCode);
      data.append('Title', formData.title);
      data.append('CategoryId', formData.categoryId);
      if (formData.companyId) data.append('CompanyId', formData.companyId);
      data.append('IsPublished', formData.isPublished);
      data.append('StartDate', formData.startDate);
      if (formData.endDate) data.append('EndDate', formData.endDate);
      // Đã bỏ ThumbnailFile theo yêu cầu

      await api.post('/course', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess();
      onClose();
      setFormData({ courseCode: '', title: '', categoryId: '', companyId: '', isPublished: false, startDate: new Date().toISOString().split('T')[0], endDate: '' });
    } catch (err) {
      const errorMsg = err.response?.data || 'Lỗi khi tạo khóa học.';
      alert('LỖI: ' + (typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 rounded-4 shadow">
          <div className="modal-header border-0 p-4 pb-0">
            <h5 className="fw-bold mb-0">Thiết lập khóa học mới</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label small fw-bold">Mã khóa học *</label>
                <div className="input-group">
                  <span className="input-group-text bg-light"><Hash size={14} /></span>
                  <input type="text" required className="form-control rounded-end-3" value={formData.courseCode} onChange={e => setFormData({...formData, courseCode: e.target.value})} />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">Tên khóa học *</label>
                <input type="text" required className="form-control rounded-3" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold d-flex justify-content-between">
                  Danh mục *
                  <button type="button" className="btn btn-link p-0 text-primary small text-decoration-none fw-bold" onClick={() => setShowQuickAddCategory(!showQuickAddCategory)}>
                    {showQuickAddCategory ? 'Hủy' : '+ Thêm nhanh'}
                  </button>
                </label>
                {showQuickAddCategory ? (
                  <div className="input-group mb-2">
                    <input type="text" className="form-control form-control-sm" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                    <button className="btn btn-primary btn-sm" type="button" onClick={handleQuickAddCategory}>Lưu</button>
                  </div>
                ) : (
                  <select required className="form-select rounded-3" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                    <option value="">-- Chọn chuyên ngành --</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                )}
              </div>

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

              {isSuperAdmin && (
                <div className="mb-3">
                  <label className="form-label small fw-bold">Đơn vị sở hữu</label>
                  <select className="form-select rounded-3" value={formData.companyId} onChange={e => setFormData({...formData, companyId: e.target.value})}>
                    <option value="">Hệ thống tổng (Dùng chung)</option>
                    {companies.map(comp => <option key={comp.id} value={comp.id}>{comp.companyName}</option>)}
                  </select>
                </div>
              )}

              <div className="form-check form-switch mt-3">
                <input className="form-check-input" type="checkbox" checked={formData.isPublished} onChange={e => setFormData({...formData, isPublished: e.target.checked})} />
                <label className="form-check-label fw-bold small">Công khai khóa học ngay</label>
              </div>
            </div>
            <div className="modal-footer border-0 p-4 pt-0">
              <button type="button" className="btn btn-light px-4 fw-bold" onClick={onClose}>Hủy</button>
              <button type="submit" className="btn btn-primary px-4 fw-bold shadow-sm" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Tạo khóa học'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCourseModal;
