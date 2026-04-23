import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../../components/layout/UserLayout';
import api, { getUploadUrl } from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import { BookOpen, Loader2, Search, SlidersHorizontal, Star, CheckCircle, Trophy, TrendingUp, Users } from 'lucide-react';

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

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

  const filtered = courses.filter((c) => {
    const pct = Math.round(c.progressPercentage || 0);
    if (filter === 'dang-hoc') return pct > 0 && pct < 100;
    if (filter === 'hoan-thanh') return pct >= 100;
    return true;
  });

  return (
    <UserLayout>
      <div className="container-fluid px-md-4 px-lg-5 py-4">
        <div className="mx-auto" style={{ maxWidth: '1400px' }}>
        {/* Header Section */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-5 gap-4">
          <div style={{ maxWidth: '600px' }}>
            <h1 className="fw-bold mb-3" style={{ color: '#0f172a', fontSize: '2.5rem', letterSpacing: '-0.03em' }}>
              Khóa học của tôi
            </h1>
            <p className="text-secondary fs-5 mb-0" style={{ lineHeight: 1.6 }}>
              Tiếp tục hành trình trí thức của bạn. Nơi hội tụ những kiến thức tinh tuyển và trải nghiệm học tập chuyên sâu.
            </p>
          </div>
          <div className="d-flex bg-white rounded-4 p-1 shadow-sm border" style={{ padding: '6px' }}>
            {['all', 'dang-hoc', 'hoan-thanh'].map((f) => (
              <button
                key={f}
                className={`btn btn-sm rounded-3 px-4 py-2 fw-bold transition-all border-0 ${filter === f ? 'bg-primary bg-opacity-10 text-primary' : 'btn-light bg-transparent text-secondary'}`}
                onClick={() => setFilter(f)}
                style={{ fontSize: '0.9rem', minWidth: '100px' }}
              >
                {f === 'all' ? 'Tất cả' : f === 'dang-hoc' ? 'Đang học' : 'Hoàn thành'}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="row g-3 mb-5">
           <div className="col-12 col-md-10">
              <div className="position-relative">
                <Search className="position-absolute top-50 translate-middle-y ms-3 text-muted" size={20} />
                <input 
                  type="text" 
                  className="form-control border-0 shadow-sm rounded-4 ps-5 py-3" 
                  placeholder="Tìm kiếm khóa học của bạn..."
                  style={{ fontSize: '1rem' }}
                  onChange={(e) => {
                    // Simple search logic if needed
                  }}
                />
              </div>
           </div>
           <div className="col-12 col-md-2">
              <button className="btn btn-white w-100 h-100 border-0 shadow-sm rounded-4 d-flex align-items-center justify-content-center gap-2 fw-bold text-dark bg-white transition-all hover-scale">
                <SlidersHorizontal size={20} /> Lọc
              </button>
           </div>
        </div>

        {/* Courses Grid */}
        <div className="row g-4">
          {loading ? (
             <div className="col-12 py-5 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={40} /></div>
          ) : filtered.length === 0 ? (
             <div className="col-12 text-center py-5 card border-0 rounded-4 shadow-sm bg-white">
               <BookOpen className="text-muted mb-3 mx-auto" size={48} />
               <h4 className="text-muted fw-bold">Chưa có khóa học nào trong mục này</h4>
               <p className="text-secondary">Hãy khám phá các khóa học mới để bắt đầu học tập.</p>
             </div>
          ) : (
            <>
              {filtered.map((course, idx) => {
                const pct = Math.round(course.progressPercentage || 0);
                const isCompleted = pct >= 100;
                const category = course.categoryName || 'KHÓA HỌC';

                return (
                  <div className="col-12 col-md-6 col-lg-4 col-xl-3" key={course.id}>
                    <div className="card border-0 rounded-4 shadow-sm h-100 overflow-hidden bg-white hover-shadow transition-all" style={{ border: '1px solid #f1f5f9' }}>
                      {/* Thumbnail container */}
                      <div className="position-relative aspect-video overflow-hidden">
                         <img 
                           src={course.thumbnailUrl ? getUploadUrl(course.thumbnailUrl) : '/h_logo.png'} 
                           className="w-100 h-100 object-fit-cover transition-all" 
                           style={{ minHeight: '160px' }}
                           alt={course.title}
                         />
                         <div className="position-absolute top-0 start-0 m-3">
                            <span className="badge bg-white shadow-sm text-primary fw-bold px-2 py-1 rounded-2" style={{ fontSize: '0.65rem' }}>
                               {category.toUpperCase()}
                            </span>
                         </div>
                      </div>

                      <div className="card-body p-3 d-flex flex-column">
                        <h6 className="fw-bold mb-3" style={{ fontSize: '1rem', minHeight: '3rem' }} title={course.title}>{course.title}</h6>
                        <div className="mt-auto">
                           {isCompleted && (
                             <button 
                               className="btn w-100 rounded-3 py-2 fw-bold transition-all shadow-sm mb-2 d-flex align-items-center justify-content-center gap-2"
                               onClick={async (e) => {
                                 e.stopPropagation();
                                 try {
                                   let certId = course.certificateId;
                                   if (!certId) {
                                     // Nếu chưa có ID, thử lấy từ danh sách chứng chỉ của tôi
                                     const myCerts = await api.get('/certificate/my-certificates');
                                     const found = myCerts.data.find(c => c.courseTitle === course.title);
                                     if (found) {
                                       certId = found.id;
                                     } else {
                                       // Nếu vẫn không thấy, yêu cầu hệ thống khởi tạo
                                       const resp = await api.post(`/certificate/generate/${course.id}`);
                                       certId = resp.data.id;
                                     }
                                   }

                                   if (!certId) throw new Error("Không tìm thấy ID chứng chỉ");

                                   const downloadUrl = `/certificate/download/${certId}`;
                                   const response = await api.get(downloadUrl, { responseType: 'blob' });
                                   
                                   const url = window.URL.createObjectURL(new Blob([response.data]));
                                   const link = document.createElement('a');
                                   link.href = url;
                                   link.setAttribute('download', `Chung_Chi_${course.id}.pdf`);
                                   document.body.appendChild(link);
                                   link.click();
                                   link.parentNode.removeChild(link);
                                   window.URL.revokeObjectURL(url);
                                 } catch (err) {
                                   console.error("Lỗi tải chứng chỉ:", err);
                                   alert("Hệ thống đang chuẩn bị chứng chỉ, vui lòng thử lại sau giây lát.");
                                 }
                               }}
                               style={{ backgroundColor: '#fff', color: '#10b981', border: '1px solid #10b981' }}
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-trophy"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg> Xem chứng chỉ
                             </button>
                           )}
                           <button 
                             className="btn w-100 rounded-3 py-2 fw-bold transition-all shadow-sm"
                             onClick={() => navigate(`/course/${course.id}`)}
                             style={{ backgroundColor: isCompleted ? '#10b981' : '#4c49ed', color: '#fff', border: 'none' }}
                           >
                             {isCompleted ? 'Xem lại bài học' : 'Vào học ngay'}
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Community Banner removed as per request */}
        </div>
      </div>

      <style>{`
        .course-card-v2:hover img { transform: scale(1.05); }
        .course-card-v2:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.08) !important; }
        .btn-white:hover { background-color: #f8f9fa !important; border-color: #e2e8f0 !important; }
      `}</style>
    </UserLayout>
  );
};

export default MyCourses;
