import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../../components/layout/UserLayout';
import api from '../../api/axios';
import CircularProgress from '../../components/common/CircularProgress';
import { BookOpen, ArrowRight, Loader2, Calendar } from 'lucide-react';

const UserDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/learning/my-courses');
      setCourses(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout hideSidebar hideHeader>
      <div className="container-fluid px-4 px-md-5 pt-3 pb-5" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: '#0f172a', fontSize: '1.5rem' }}>Khóa học của tôi</h2>
            <p className="mb-0" style={{ color: '#64748b', fontSize: '0.95rem' }}>Tiếp tục học tập từ nơi bạn đã dừng lại.</p>
          </div>
          {!loading && courses.length > 0 && (
            <button className="btn btn-outline-primary rounded-3 fw-semibold" onClick={() => navigate('/courses')}>
              Khám phá thêm khóa học
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-5"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : courses.length === 0 ? (
          <div className="text-center py-5">
            <BookOpen size={48} className="mb-3" style={{ color: '#94a3b8' }} />
            <h5 className="fw-bold mb-2" style={{ color: '#475569' }}>Bạn chưa đăng ký khóa học nào</h5>
            <p className="mb-4" style={{ color: '#64748b', fontSize: '0.95rem' }}>Hãy khám phá các khóa học và bắt đầu học ngay!</p>
            <button className="btn btn-primary rounded-3 px-4 py-2 fw-semibold" onClick={() => navigate('/courses')}>
              Khám phá khóa học
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {courses.map((course) => (
              <div key={course.id} className="col-12 col-md-6 col-xl-4">
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 transition-all hover-shadow bg-white">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-4">
                      <div className="flex-grow-1 min-w-0">
                        <span className="badge mb-2 small fw-bold" style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>{course.categoryName}</span>
                        <h5 className="fw-bold mb-1 text-truncate" style={{ color: '#0f172a', fontSize: '1.05rem' }}>{course.title}</h5>
                        <div className="small" style={{ color: '#64748b' }}>Mã: {course.courseCode}</div>
                      </div>
                      <CircularProgress
                        percentage={Math.round(course.progressPercentage)}
                        size={65}
                        color={course.progressPercentage >= 100 ? '#10b981' : '#6366f1'}
                      />
                    </div>

                    <div className="d-flex align-items-center gap-3 mb-4 small" style={{ color: '#64748b' }}>
                      <div className="d-flex align-items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(course.startDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <span className="badge rounded-pill" style={{ backgroundColor: course.progressPercentage >= 100 ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)', color: course.progressPercentage >= 100 ? '#059669' : '#6366f1', fontSize: '0.75rem' }}>
                        {Math.round(course.progressPercentage)}% hoàn thành
                      </span>
                    </div>

                    <button
                      className={`btn w-100 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2 py-2 ${course.progressPercentage >= 100 ? 'btn-outline-success' : 'btn-primary'}`}
                      onClick={() => course.progressPercentage >= 100 ? navigate(`/course/${course.id}`) : navigate(`/learning/${course.id}`)}
                    >
                      {course.progressPercentage >= 100 ? 'Xem chi tiết' : 'Tiếp tục học'}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <style>{`
          .hover-shadow:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,.08) !important; }
        `}</style>
      </div>
    </UserLayout>
  );
};

export default UserDashboard;
