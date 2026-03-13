import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../../components/layout/UserLayout';
import api from '../../api/axios';
import CircularProgress from '../../components/common/CircularProgress';
import { BookOpen, GraduationCap, Clock, ArrowRight, Loader2, Calendar } from 'lucide-react';

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

  const completedCount = courses.filter(c => c.progressPercentage >= 100).length;
  const inProgressCount = courses.filter(c => c.progressPercentage < 100).length;

  return (
    <UserLayout>
      <div className="mb-4">
        <h2 className="fw-bold tracking-tight mb-1">Chào mừng trở lại!</h2>
        <p className="text-muted">Tiếp tục hành trình học tập của bạn ngay hôm nay.</p>
      </div>

      {/* Stats Grid */}
      <div className="row g-4 mb-5">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-4"><BookOpen size={24} /></div>
              <span className="badge bg-white bg-opacity-20 rounded-pill">Đang học</span>
            </div>
            <h3 className="fw-bold mb-1">{inProgressCount}</h3>
            <span className="small opacity-75 fw-semibold text-uppercase tracking-wider">Khóa học đang học</span>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-success text-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-4"><GraduationCap size={24} /></div>
              <span className="badge bg-white bg-opacity-20 rounded-pill">Hoàn thành</span>
            </div>
            <h3 className="fw-bold mb-1">{completedCount}</h3>
            <span className="small opacity-75 fw-semibold text-uppercase tracking-wider">Khóa học hoàn thành</span>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-info text-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-4"><Clock size={24} /></div>
              <span className="badge bg-white bg-opacity-20 rounded-pill">Tổng</span>
            </div>
            <h3 className="fw-bold mb-1">{courses.length}</h3>
            <span className="small opacity-75 fw-semibold text-uppercase tracking-wider">Tổng khóa học đăng ký</span>
          </div>
        </div>
      </div>

      <h4 className="fw-bold mb-4">Khóa học của tôi</h4>

      {loading ? (
        <div className="text-center py-5"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : courses.length === 0 ? (
        <div className="text-center py-5">
          <BookOpen size={48} className="text-muted mb-3" />
          <h5 className="text-muted">Bạn chưa đăng ký khóa học nào</h5>
          <p className="text-muted mb-3">Hãy khám phá các khóa học và bắt đầu học ngay!</p>
          <button className="btn btn-primary rounded-3" onClick={() => navigate('/courses')}>
            Khám phá khóa học
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {courses.map((course) => (
            <div key={course.id} className="col-12 col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 transition-all hover-shadow">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div className="flex-grow-1">
                      <span className="badge bg-primary-subtle text-primary small fw-bold mb-2">{course.categoryName}</span>
                      <h5 className="fw-bold text-dark mb-1">{course.title}</h5>
                      <div className="text-muted small">Mã: {course.courseCode}</div>
                    </div>
                    <CircularProgress
                      percentage={Math.round(course.progressPercentage)}
                      size={65}
                      color={course.progressPercentage >= 100 ? '#10b981' : '#4f46e5'}
                    />
                  </div>

                  <div className="d-flex align-items-center gap-3 mb-4 text-muted small">
                    <div className="d-flex align-items-center gap-1">
                      <Calendar size={14} />
                      <span>{new Date(course.startDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  <button
                    className={`btn w-100 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2 ${course.progressPercentage >= 100 ? 'btn-outline-success' : 'btn-primary'}`}
                    onClick={() => navigate(`/course/${course.id}`)}
                  >
                    {course.progressPercentage >= 100 ? 'Xem chứng chỉ' : 'Tiếp tục học'}
                    <ArrowRight size={18} />
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
    </UserLayout>
  );
};

export default UserDashboard;
