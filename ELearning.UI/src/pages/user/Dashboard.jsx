import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserLayout from '../../components/layout/UserLayout';
import api, { getUploadUrl } from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import { 
  BookOpen, Loader2, ChevronRight, Calendar, Hash, Clock, 
  CheckCircle, GraduationCap, PlayCircle, Star, Bell, 
  Trophy, Medal, Award, ArrowRight, Zap, Flame 
} from 'lucide-react';

const UserDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/learning/my-courses');
      setCourses(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inProgress = courses.filter(c => Math.round(c.progressPercentage || 0) > 0 && Math.round(c.progressPercentage || 0) < 100);
  const completedCount = courses.filter(c => Math.round(c.progressPercentage || 0) >= 100).length;

  return (
    <UserLayout>
      <div className="container-fluid px-0">
        <div className="row g-4">
          
          {/* Main Content Column */}
          <div className="col-12 col-xl-12">
            
            {/* Welcome Banner Card */}
            <div className="card border-0 rounded-5 shadow-sm mb-4 overflow-hidden" style={{ background: '#fff' }}>
              <div className="card-body p-4 p-md-5 d-flex flex-column flex-md-row justify-content-between align-items-center gap-4">
                <div style={{ flex: 1 }}>
                  <h1 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0f172a', fontSize: '2.5rem', letterSpacing: '-0.02em' }}>
                    Chào mừng {user.fullName || ""} trở lại! 👋
                  </h1>
                  <p className="text-secondary fs-5 mb-0" style={{ maxWidth: '600px', lineHeight: 1.6 }}>
                    Hệ thống đã cập nhật những khóa học mới dành cho bạn. Hãy tiếp tục hành trình nâng cao kỹ năng ngay hôm nay.
                  </p>
                </div>
                
                {courses.length > 0 && (
                  <div 
                    className="d-flex flex-column align-items-center justify-content-center p-4 rounded-5 text-white shadow-lg cursor-pointer hover-scale transition-all" 
                    style={{ background: 'linear-gradient(135deg, #4c49ed, #2e1065)', width: '200px', height: '140px' }}
                    onClick={() => navigate(`/course/${courses[0].id}`)}
                  >
                     <div className="fw-bold fs-5 mb-2">Vào học ngay</div>
                     <ArrowRight size={28} />
                  </div>
                )}
              </div>
            </div>

            {/* Stats Row - Real Data */}
            <div className="row g-3 mb-5">
              {[
                { label: 'KHÓA HỌC CỦA TÔI', val: courses.length || 0, icon: <BookOpen className="text-primary" size={20} />, bg: '#f5f3ff' },
                { label: 'ĐANG HỌC', val: inProgress.length, icon: <PlayCircle className="text-info" size={20} />, bg: '#f0f7ff' },
                { label: 'ĐÃ HOÀN THÀNH', val: completedCount, icon: <CheckCircle className="text-success" size={20} />, bg: '#f0fdf4' },
              ].map((s, idx) => (
                <div className="col-4" key={idx}>
                  <div className="card border-0 rounded-4 shadow-sm p-4 h-100 border-start border-4" style={{ borderColor: s.bg }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center justify-content-center rounded-circle shadow-sm" style={{ width: 50, height: 50, backgroundColor: s.bg }}>
                        {s.icon}
                      </div>
                      <div>
                        <div className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>{s.label}</div>
                        <div className="fw-bold fs-3" style={{ color: '#0f172a' }}>{s.val}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Course Section Header */}
            <div className="d-flex justify-content-between align-items-end mb-4">
               <h4 className="fw-bold m-0" style={{ fontSize: '1.6rem', color: '#0f172a' }}>Khóa học đang diễn ra</h4>
               <Link to="/my-courses" className="text-decoration-none fw-bold small text-primary p-2 px-3 bg-primary bg-opacity-10 rounded-pill transition-all hover-bg-primary hover-text-white">Xem tất cả</Link>
            </div>

            {/* Courses Grid */}
            <div className="row g-4 mb-5">
              {loading ? (
                <div className="col-12 py-5 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={40} /></div>
              ) : courses.length === 0 ? (
                <div className="col-12 py-5 text-center text-muted card border-0 rounded-4 shadow-sm">
                   Chưa có khóa học nào được đăng ký. <Link to="/my-courses" className="ms-1 fw-bold">Khám phá ngay</Link>
                </div>
              ) : (
                courses.slice(0, 4).map((course, idx) => {
                  return (
                    <div className="col-12 col-md-6 col-lg-3" key={course.id}>
                      <div className="card border-0 rounded-4 shadow-sm h-100 overflow-hidden bg-white hover-shadow transition-all" style={{ border: '1px solid #f1f5f9' }}>
                        <div className="position-relative aspect-video overflow-hidden">
                           <img 
                              src={course.thumbnailUrl ? getUploadUrl(course.thumbnailUrl) : '/h_logo.png'} 
                              className="w-100 h-100 object-fit-cover transition-all" 
                              style={{ minHeight: '160px' }}
                              alt={course.title} 
                           />
                           <div className="position-absolute top-0 start-0 m-3">
                              <span className="badge bg-white shadow-sm text-primary fw-bold px-2 py-1 rounded-2" style={{ fontSize: '0.65rem' }}>KHÓA HỌC</span>
                           </div>
                        </div>
                        <div className="card-body p-3 d-flex flex-column">
                           <h6 className="fw-bold mb-3" style={{ fontSize: '0.95rem', minHeight: '2.8rem' }} title={course.title}>{course.title}</h6>
                           <div className="mt-auto">
                              {/* Removed progress bar as requested */}
                              <button 
                                className="btn w-100 py-2 rounded-3 fw-bold small transition-all" 
                                style={{ backgroundColor: '#4c49ed', color: '#fff' }}
                                onClick={() => navigate(`/course/${course.id}`)}
                              >
                                Vào học ngay
                              </button>
                           </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      </div>


      <style>{`
        .course-card-v2:hover { transform: translateY(-4px); transition: all 0.3s ease; }
      `}</style>
    </UserLayout>
  );
};

export default UserDashboard;
