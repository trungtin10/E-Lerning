import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { ArrowLeft, BookOpen, Loader2, Calendar, Building2 } from 'lucide-react';

const CategoryCourses = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    fetchCourses();
  }, [categoryId]);

  const fetchCourses = async () => {
    try {
      const response = await api.get(`/course/categories/${categoryId}/courses`);
      setCourses(response.data);
      if (response.data.length > 0) {
        setCategoryName(response.data[0].categoryName);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-4 d-flex align-items-center gap-3">
        <button className="btn btn-light rounded-circle p-2" onClick={() => navigate('/admin/categories')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="fw-bold tracking-tight mb-0">Chuyên ngành: {categoryName || 'Đang tải...'}</h2>
          <p className="text-muted small">Danh sách các khóa học thuộc chuyên ngành này.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><Loader2 className="animate-spin text-primary" size={48} /></div>
      ) : courses.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 border border-dashed">
          <BookOpen size={48} className="text-muted mb-3 opacity-20" />
          <p className="text-muted fw-medium">Chưa có khóa học nào trong chuyên ngành này.</p>
        </div>
      ) : (
        <div className="row g-4">
          {courses.map((course) => (
            <div key={course.id} className="col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 transition-all hover-shadow">
                <div className="position-relative" style={{ height: '180px' }}>
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} className="w-100 h-100 object-fit-cover" alt={course.title} />
                  ) : (
                    <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                      <BookOpen size={48} className="text-muted opacity-20" />
                    </div>
                  )}
                </div>
                <div className="card-body p-4">
                  <h5 className="fw-bold text-dark mb-3">{course.title}</h5>
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex align-items-center gap-2 text-muted small">
                      <Building2 size={14} />
                      <span>{course.companyName}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 text-muted small">
                      <Calendar size={14} />
                      <span>Tạo ngày: {new Date(course.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary w-100 mt-4 fw-bold rounded-3"
                    onClick={() => navigate(`/admin/courses/${course.id}`)}
                  >
                    Quản lý nội dung
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`
        .hover-shadow:hover { transform: translateY(-5px); box-shadow: 0 1rem 3rem rgba(0,0,0,.1) !important; }
      `}</style>
    </AdminLayout>
  );
};

export default CategoryCourses;
