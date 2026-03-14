import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { Search, Plus, Filter, X } from 'lucide-react';
import { useNotify } from '../../../context/NotifyContext';
import CourseTable from './CourseTable';
import AddCourseModal from './AddCourseModal';
import EditCourseModal from './EditCourseModal';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async (id) => {
    const ok = await confirm({ title: 'Xóa khóa học', message: 'Bạn có chắc chắn muốn xóa khóa học này?', confirmText: 'Xóa' });
    if (!ok) return;
    try {
      await api.delete(`/course/${id}`);
      toast('Đã xóa khóa học thành công.', 'success');
      fetchCourses();
    } catch (err) {
      toast('Lỗi khi xóa khóa học.', 'error');
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold tracking-tight mb-1">Quản lý Khóa học</h2>
          <p className="text-muted small">Quản lý nội dung đào tạo dùng chung và nội bộ công ty.</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 rounded-3 shadow-sm fw-bold" onClick={() => setShowAddModal(true)}>
          <Plus size={20} /> Tạo khóa học
        </button>
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

      <AddCourseModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchCourses} />
      <EditCourseModal isOpen={showEditModal} course={selectedCourse} onClose={() => { setShowEditModal(false); setSelectedCourse(null); }} onSuccess={() => fetchCourses(true)} />
    </AdminLayout>
  );
};

export default Courses;
