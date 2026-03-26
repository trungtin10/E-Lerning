import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { Search, Plus, X, BookOpen, ChevronRight, GraduationCap } from 'lucide-react';
import { useNotify } from '../../../context/NotifyContext';
import CourseTable from './CourseTable';
import AddCourseModal from './AddCourseModal';
import EditCourseModal from './EditCourseModal';

const Courses = () => {
  const navigate = useNavigate();
  const { toast, confirm } = useNotify();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedCategoryStatus] = useState('');

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

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedCategoryStatus('');
  };

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold tracking-tight mb-1 d-flex align-items-center gap-2">
          <BookOpen size={28} className="text-primary" />
          Khóa học
        </h2>
        <p className="text-muted small mb-0">
          Bấm mũi tên để quản lý khóa học hoặc chuyển sang theo dõi học viên.
        </p>
      </div>

      {/* Khóa học - Click mũi tên > để mở/đóng */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div
          className="card-header bg-white border-bottom d-flex align-items-center gap-2 py-3 px-4"
          onClick={() => setCourseDropdownOpen(!courseDropdownOpen)}
          style={{ cursor: 'pointer' }}
        >
          <BookOpen size={22} className="text-primary flex-shrink-0" />
          <span className="fw-bold text-dark">Khóa học</span>
          <ChevronRight
            size={20}
            className={`text-muted ms-auto transition-transform ${courseDropdownOpen ? 'rotate-90' : ''}`}
          />
        </div>

        {courseDropdownOpen && (
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6 className="fw-bold text-secondary mb-0 d-flex align-items-center gap-2">
                <BookOpen size={18} /> Quản lý khóa học
              </h6>
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-outline-primary btn-sm rounded-3 fw-bold d-flex align-items-center gap-1"
                  onClick={() => navigate('/admin/learners')}
                >
                  <GraduationCap size={16} /> Theo dõi học viên
                </button>
                <button
                  className="btn d-flex align-items-center gap-2 px-4 py-2 fw-bold border"
                  style={{
                    background: 'linear-gradient(to bottom, #7ec8e3, #3498db)',
                    borderColor: '#1a5276',
                    color: '#fff',
                    borderRadius: 8,
                    textShadow: '0 1px 1px rgba(255,255,255,0.4)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)'
                  }}
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus size={20} /> Tạo mới
                </button>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-3">
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <div className="input-group bg-light border-0 rounded-3 px-2">
                      <span className="input-group-text bg-transparent border-0 text-muted"><Search size={18} /></span>
                      <input type="text" className="form-control bg-transparent border-0 py-2" placeholder="Tìm theo tên, mã hoặc đơn vị..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 col-md-3">
                    <select className="form-select bg-light border-0 py-2 rounded-3" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                      <option value="">Tất cả danh mục</option>
                      {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div className="col-12 col-sm-6 col-md-3">
                    <select className="form-select bg-light border-0 py-2 rounded-3" value={selectedStatus} onChange={(e) => setSelectedCategoryStatus(e.target.value)}>
                      <option value="">Tất cả trạng thái</option>
                      <option value="published">Đã công khai</option>
                      <option value="draft">Bản nháp</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-2">
                    <button className="btn btn-outline-secondary w-100 py-2 rounded-3 d-flex align-items-center justify-content-center gap-2" onClick={resetFilters}><X size={18} /> Xóa lọc</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
              <CourseTable courses={filteredCourses} loading={loading} onDelete={handleDelete} onEdit={handleEdit} />
            </div>
          </div>
        )}
      </div>

      <AddCourseModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchCourses} />
      <EditCourseModal isOpen={showEditModal} course={selectedCourse} onClose={() => { setShowEditModal(false); setSelectedCourse(null); }} onSuccess={() => fetchCourses(true)} />
    </AdminLayout>
  );
};

export default Courses;
