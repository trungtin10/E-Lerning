import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { BookOpen, GraduationCap, Loader2, Eye, Edit2, Trash2, Layers, Building2, Calendar, Clock } from 'lucide-react';
import { useNotify } from '../../../context/NotifyContext';
import AddCourseModal from './AddCourseModal';
import EditCourseModal from './EditCourseModal';

const Courses = () => {
  const navigate = useNavigate();
  const { toast, confirm } = useNotify();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedCategoryStatus] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.roles?.includes('SuperAdmin');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  const fetchCourses = async (noCache = false) => {
    setLoading(true);
    try {
      const url = noCache ? `/course?_t=${Date.now()}` : '/course';
      const response = await api.get(url);
      setCourses(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/course/categories');
      setCategories(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, courseTitle) => {
    const ok = await confirm({
      title: 'Xóa khóa học',
      message: `Bạn có chắc chắn muốn xóa khóa học "${courseTitle || 'này'}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy'
    });
    if (!ok) return;
    try {
      await api.delete(`/course/${id}`);
      toast('Đã xóa khóa học thành công.', 'success');
      fetchCourses();
    } catch (err) {
      toast(err.response?.data || 'Lỗi khi xóa khóa học.', 'error');
    }
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setShowEditModal(true);
  };

  const filteredCourses = courses.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.title.toLowerCase().includes(term) ||
      (c.courseCode && c.courseCode.toLowerCase().includes(term)) ||
      (c.companyName && c.companyName.toLowerCase().includes(term));

    const matchesCategory = selectedCategory === '' || c.categoryName === selectedCategory;
    const matchesStatus = selectedStatus === '' || (selectedStatus === 'published' ? c.isPublished : !c.isPublished);
    const matchesCompany = !isSuperAdmin || selectedCompany === '' || (c.companyName ?? c.CompanyName ?? 'Hệ thống tổng') === selectedCompany;

    return matchesSearch && matchesCategory && matchesStatus && matchesCompany;
  });

  const companyOptions = Array.from(new Set(courses.map(c => c.companyName ?? c.CompanyName ?? 'Hệ thống tổng'))).sort();

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedCategoryStatus('');
    setSelectedCompany('');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const day = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time} - ${day}`;
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'Không thời hạn';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <AdminLayout>
      <div className="mb-4 d-flex flex-column flex-md-row align-items-md-start justify-content-md-between gap-3">
        <div>
          <h2 className="fw-bold tracking-tight mb-1 d-flex align-items-center gap-2" style={{ fontFamily: 'Inter, sans-serif', textAlign: 'left' }}>
            <BookOpen size={26} />
            Khóa học
          </h2>
          <p className="text-muted small mb-0">
            Quản lý danh sách khóa học và nội dung đào tạo.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-xs rounded-3 fw-bold d-flex align-items-center gap-1 flex-shrink-0"
          onClick={() => navigate('/admin/learners')}
        >
          <GraduationCap size={14} /> Theo dõi học viên
        </button>
      </div>

      {/* Cùng kiểu thanh lọc như trang Danh sách công ty */}
      <div className="bg-light p-3 border rounded-3 mb-3">
        <div className="row g-3 align-items-center">
          <div className="col-auto">
            <select
              className="form-select form-select-sm border-secondary-subtle"
              style={{ minWidth: 150 }}
              value={selectedStatus}
              onChange={(e) => setSelectedCategoryStatus(e.target.value)}
            >
              <option value="">Chọn trạng thái</option>
              <option value="published">Đã công khai</option>
              <option value="draft">Bản nháp</option>
            </select>
          </div>
          {isSuperAdmin && (
            <div className="col-auto">
              <select
                className="form-select form-select-sm border-secondary-subtle"
                style={{ minWidth: 150 }}
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
              >
                <option value="">Tất cả công ty</option>
                {companyOptions.map((comp) => (
                  <option key={comp} value={comp}>{comp}</option>
                ))}
              </select>
            </div>
          )}
          <div className="col-auto">
            <select
              className="form-select form-select-sm border-secondary-subtle"
              style={{ minWidth: 200 }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Chọn danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col ps-0">
            <div className="d-flex gap-1 justify-content-center flex-wrap">
              <input
                type="text"
                className="form-control form-control-sm border-secondary-subtle"
                style={{ maxWidth: 200 }}
                placeholder="Tìm khóa học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-sm btn-primary px-3 shadow-sm d-flex align-items-center"
                onClick={() => fetchCourses(true)}
                title="Tải lại danh sách từ máy chủ"
              >
                Tìm
              </button>
            </div>
          </div>
          <div className="col-auto d-flex gap-2">
            <button type="button" className="btn btn-sm btn-danger px-3 shadow-sm" onClick={resetFilters}>
              Xóa
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary px-3 shadow-sm fw-bold"
              onClick={() => setShowAddModal(true)}
            >
              Tạo mới
            </button>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div className="card-body p-4">
            {loading ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-5">
                <Loader2 className="animate-spin text-muted mb-2" size={32} />
                <div className="text-muted small">Đang tải danh sách khóa học...</div>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-5 bg-white rounded-4 border border-dashed">
                <BookOpen size={44} className="text-muted mb-3 opacity-25" />
                <p className="text-muted fw-medium mb-0">Chưa có khóa học phù hợp bộ lọc.</p>
              </div>
            ) : (
              <div className="row g-3">
                {filteredCourses.map((course) => (
                  <div key={course.id} className="col-12 col-sm-6 col-lg-4 col-xxl-3">
                    <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden course-card">
                      <div
                        className="position-relative"
                        style={{ height: 100, background: 'rgba(37,99,235,0.06)' }}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/admin/courses/${course.id}`)}
                        onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/admin/courses/${course.id}`); }}
                        title={course.title}
                      >
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="course-card-thumb-placeholder w-100 h-100 d-flex align-items-center justify-content-center position-relative overflow-hidden">
                            <span className="course-card-thumb-placeholder__shine" aria-hidden />
                            <span className="course-card-thumb-placeholder__grid" aria-hidden />
                            <div className="course-card-thumb-placeholder__icon d-flex align-items-center justify-content-center rounded-3" style={{ width: 44, height: 44 }}>
                              <BookOpen size={24} strokeWidth={1.5} aria-hidden />
                            </div>
                          </div>
                        )}
                        <div className="position-absolute top-0 start-0 p-2 d-flex gap-1">
                          <span className="badge rounded-pill px-2 py-1" style={{ background: 'rgba(3)5,255,255,0.95)', border: '1px solid rgba(17,24,39,0.10)', color: '#111827', fontSize: '0.65rem', fontWeight: 700 }}>
                            {course.courseCode}
                          </span>
                          {course.isPublished ? (
                            <span className="badge rounded-pill px-2 py-1" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)', color: '#065f46', fontSize: '0.65rem' }}>
                              Công khai
                            </span>
                          ) : (
                            <span className="badge rounded-pill px-2 py-1" style={{ background: 'rgba(107,114,128,0.15)', border: '1px solid rgba(107,114,128,0.2)', color: '#374151', fontSize: '0.65rem' }}>
                              Bản nháp
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="card-body p-3 d-flex flex-column" style={{ textAlign: 'left' }}>
                        <div className="fw-bold text-dark mb-1" style={{ lineHeight: 1.25, fontSize: '0.86rem', fontFamily: 'Inter, sans-serif' }}>
                          <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {course.title}
                          </span>
                        </div>

                        <div className="d-flex flex-column gap-1 text-muted" style={{ fontSize: '0.82rem' }}>
                          <div className="d-flex align-items-center gap-2">
                            <Layers size={14} className="opacity-60" />
                            <span className="text-truncate">{course.categoryName || '—'}</span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <Building2 size={14} className="opacity-60" />
                            <span className="text-truncate">{course.companyName ?? course.CompanyName ?? 'Hệ thống tổng'}</span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <Calendar size={14} className="opacity-60" />
                            <span className="text-truncate">{formatDateTime(course.startDate)}</span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <Clock size={14} className="opacity-60" />
                            <span className="text-truncate">Hết hạn: {formatDateOnly(course.endDate)}</span>
                          </div>
                        </div>

                        <div className="mt-2 d-flex gap-1 align-items-stretch course-card-actions">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-xs flex-grow-1 d-flex align-items-center justify-content-center gap-1 course-card-actions__view"
                            onClick={() => window.open(`/course/${course.id}?preview=true`, '_blank')}
                            title="Xem giao diện Học viên"
                          >
                            <Eye size={13} /> Xem
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-xs d-flex align-items-center justify-content-center"
                            style={{ width: 32 }}
                            onClick={() => handleEdit(course)}
                            title="Sửa thông tin"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-xs d-flex align-items-center justify-content-center text-danger"
                            style={{ width: 32 }}
                            onClick={() => handleDelete(course.id, course.title)}
                            title="Xóa khóa học"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      <AddCourseModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchCourses} />
      <EditCourseModal isOpen={showEditModal} course={selectedCourse} onClose={() => { setShowEditModal(false); setSelectedCourse(null); }} onSuccess={() => fetchCourses(true)} />
    </AdminLayout>
  );
};

export default Courses;
