import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../../components/layout/UserLayout';
import api from '../../api/axios';
import { BookOpen, ArrowLeft, Loader2, Calendar, Layers, Search } from 'lucide-react';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/course');
      const list = Array.isArray(response.data) ? response.data : [];
      setCourses(list.filter(c => c.isPublished));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = courses.filter(c => {
    const term = searchTerm.toLowerCase();
    return !term ||
      (c.title && c.title.toLowerCase().includes(term)) ||
      (c.courseCode && c.courseCode.toLowerCase().includes(term)) ||
      (c.categoryName && c.categoryName.toLowerCase().includes(term));
  });

  return (
    <UserLayout>
      <div className="mb-5" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
        <button className="btn btn-link text-body-secondary p-0 mb-3 d-flex align-items-center gap-2 text-decoration-none fw-semibold" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={18} /> Quay lại Dashboard
        </button>
        <h1 className="fw-bold mb-2" style={{ fontSize: '1.75rem', color: '#1a1a2e', letterSpacing: '-0.02em' }}>Khám phá khóa học</h1>
        <p className="text-body-secondary mb-0" style={{ fontSize: '1rem' }}>Chọn khóa học phù hợp và bắt đầu học ngay.</p>
      </div>

      <div className="mb-5">
        <div className="input-group rounded-pill border shadow-sm overflow-hidden" style={{ maxWidth: '480px' }}>
          <span className="input-group-text bg-white border-0 text-body-secondary"><Search size={18} /></span>
          <input
            type="text"
            className="form-control border-0 py-3"
            placeholder="Tìm theo tên, mã hoặc danh mục..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><Loader2 className="animate-spin" size={36} style={{ color: '#0d6efd' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 border shadow-sm">
          <BookOpen size={56} className="mb-3 opacity-25" style={{ color: '#6c757d' }} />
          <h5 className="fw-semibold text-body-secondary">Không tìm thấy khóa học nào</h5>
          <p className="text-body-secondary small mb-0">Thử thay đổi từ khóa tìm kiếm hoặc quay lại sau.</p>
        </div>
      ) : (
        <div className="row g-4">
          {filtered.map((course) => (
            <div key={course.id} className="col-12 col-md-6 col-xl-4">
              <div
                className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 transition-all course-card"
                onClick={() => navigate(`/course/${course.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="bg-light d-flex align-items-center justify-content-center overflow-hidden position-relative" style={{ aspectRatio: '16/9', minHeight: '160px' }}>
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                  ) : (
                    <BookOpen size={56} className="opacity-15" style={{ color: '#0d6efd' }} />
                  )}
                  <span className="badge position-absolute top-0 start-0 m-3 rounded-pill fw-semibold" style={{ backgroundColor: 'rgba(13,110,253,0.9)', fontSize: '0.7rem' }}>{course.categoryName}</span>
                </div>
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-2" style={{ fontSize: '1.1rem', color: '#1a1a2e', lineHeight: 1.4 }}>{course.title}</h5>
                  <div className="text-body-secondary small mb-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                    <Layers size={14} /> Mã: {course.courseCode}
                  </div>
                  <div className="text-body-secondary small d-flex align-items-center gap-2 mb-3" style={{ fontSize: '0.85rem' }}>
                    <Calendar size={14} />
                    {course.startDate ? new Date(course.startDate).toLocaleDateString('vi-VN') : '—'}
                  </div>
                  <button className="btn btn-primary w-100 mt-2 rounded-3 fw-semibold py-2 d-flex align-items-center justify-content-center gap-2">
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .course-card:hover { transform: translateY(-6px); box-shadow: 0 12px 40px rgba(0,0,0,.12) !important; }
      `}</style>
    </UserLayout>
  );
};

export default CourseList;
