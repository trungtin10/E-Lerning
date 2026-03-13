import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserLayout from '../../components/layout/UserLayout';
import api from '../../api/axios';
import {
  BookOpen, Clock, Users, Star, ChevronDown,
  PlayCircle, FileText, CheckCircle2, ArrowLeft, Loader2,
  Calendar, Layers, Hash, Video, Info, RefreshCw, HelpCircle
} from 'lucide-react';

const CourseOverview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseDetail();
  }, [id]);

  const fetchCourseDetail = async () => {
    try {
      const response = await api.get(`/course/${id}`);
      setCourse(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      await api.post('/learning/enroll', { courseId: parseInt(id) });
      navigate(`/learning/${id}?intro=1`);
    } catch (err) {
      alert('Lỗi khi đăng ký khóa học.');
    }
  };

  if (loading) return <div className="vh-100 d-flex align-items-center justify-content-center bg-white"><Loader2 className="animate-spin text-primary" size={48} /></div>;

  return (
    <UserLayout>
      <div className="container py-5">
        <button className="btn btn-link text-muted p-0 mb-4 d-flex align-items-center gap-2 text-decoration-none fw-bold" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} /> Quay lại danh sách
        </button>

        <div className="row g-5">
          {/* Cột trái: Thông tin chi tiết */}
          <div className="col-lg-8">
            <div className="mb-5">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="badge bg-primary px-3 py-2 rounded-pill fw-bold small shadow-sm">
                  <Hash size={14} className="me-1" /> {course.courseCode}
                </span>
                <span className="badge bg-dark px-3 py-2 rounded-pill fw-bold small shadow-sm">
                  <Layers size={14} className="me-1" /> {course.categoryName || 'Chuyên ngành'}
                </span>
              </div>
              <h1 className="fw-bold text-dark mb-4 display-4">{course.title}</h1>
              <div
                className="text-secondary fs-5 leading-relaxed course-description-content border-start border-4 ps-4 py-2"
                dangerouslySetInnerHTML={{ __html: course.description || 'Chưa có mô tả cho khóa học này.' }}
              />
            </div>

            <div className="row g-4 mb-5">
              <div className="col-6 col-md-4">
                <div className="d-flex align-items-center gap-3 p-3 bg-white rounded-4 shadow-sm border">
                  <div className="p-3 bg-primary bg-opacity-10 rounded-3 text-primary"><BookOpen size={24} /></div>
                  <div>
                    <div className="fw-bold fs-5">{course.lessons?.length || 0}</div>
                    <div className="text-muted small">Bài học chính</div>
                  </div>
                </div>
              </div>
              <div className="col-6 col-md-4">
                <div className="d-flex align-items-center gap-3 p-3 bg-white rounded-4 shadow-sm border">
                  <div className="p-3 bg-success bg-opacity-10 rounded-3 text-success"><Calendar size={24} /></div>
                  <div>
                    <div className="fw-bold small">{new Date(course.startDate).toLocaleDateString('vi-VN')}</div>
                    <div className="text-muted small">Ngày khai giảng</div>
                  </div>
                </div>
              </div>
            </div>

            <h4 className="fw-bold mb-4 d-flex align-items-center gap-2">
                <Layers size={24} className="text-primary" /> Nội dung chương trình học
            </h4>

            <div className="accordion border-0 shadow-sm rounded-4 overflow-hidden" id="courseLessonsAccordion">
              {(course.lessons || []).map((lesson, index) => (
                <div key={lesson.id} className="accordion-item border-0 border-bottom">
                  <h2 className="accordion-header">
                    <button
                        className={`accordion-button bg-white fw-bold py-4 px-4 ${index !== 0 ? 'collapsed' : ''}`}
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#lessonCollapse${lesson.id}`}
                    >
                      <div className="d-flex align-items-center gap-3 w-100">
                        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center fw-bold text-primary shadow-sm" style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}>
                            {index + 1}
                        </div>
                        <div className="flex-grow-1">
                            <div className="text-dark">{lesson.title}</div>
                            <div className="text-muted small fw-normal mt-1 d-flex align-items-center gap-2">
                                <PlayCircle size={12} /> {lesson.durationInMinutes || 0} phút học tập
                            </div>
                        </div>
                      </div>
                    </button>
                  </h2>
                  <div
                    id={`lessonCollapse${lesson.id}`}
                    className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
                    data-bs-parent="#courseLessonsAccordion"
                  >
                    <div className="accordion-body bg-light bg-opacity-50 p-0 border-top">
                      <div className="p-3 px-4">
                        <h6 className="text-uppercase small fw-bold text-secondary mb-3 tracking-widest" style={{ fontSize: '0.65rem' }}>Các phần nội dung bài học:</h6>

                        {/* Mục 1 */}
                        <div className="d-flex align-items-center justify-content-between py-2 border-bottom border-white">
                            <div className="d-flex align-items-center gap-3">
                                <Info size={16} className="text-info" />
                                <span className="small text-dark">{lesson.section1Title || '1. Nội dung tổng quát'}</span>
                            </div>
                            {lesson.showVideo1 && <span className="badge bg-primary-subtle text-primary rounded-pill small"><Video size={12} className="me-1" /> Video</span>}
                        </div>

                        {/* Mục 2 */}
                        <div className="d-flex align-items-center justify-content-between py-2 border-bottom border-white">
                            <div className="d-flex align-items-center gap-3">
                                <BookOpen size={16} className="text-primary" />
                                <span className="small text-dark">{lesson.section2Title || '2. Bài giảng chi tiết'}</span>
                            </div>
                            {lesson.showVideo2 && <span className="badge bg-primary-subtle text-primary rounded-pill small"><Video size={12} className="me-1" /> Video</span>}
                        </div>

                        {/* Mục 3 */}
                        <div className="d-flex align-items-center justify-content-between py-2 border-bottom border-white">
                            <div className="d-flex align-items-center gap-3">
                                <RefreshCw size={16} className="text-success" />
                                <span className="small text-dark">{lesson.section3Title || '3. Phần ôn tập'}</span>
                            </div>
                            {lesson.showVideo3 && <span className="badge bg-primary-subtle text-primary rounded-pill small"><Video size={12} className="me-1" /> Video</span>}
                        </div>

                        {/* Mục 4 */}
                        <div className="d-flex align-items-center justify-content-between py-2">
                            <div className="d-flex align-items-center gap-3">
                                <HelpCircle size={16} className="text-warning" />
                                <span className="small text-dark">{lesson.section4Title || '4. Câu hỏi tự luận'}</span>
                            </div>
                            {lesson.showVideo4 && <span className="badge bg-primary-subtle text-primary rounded-pill small"><Video size={12} className="me-1" /> Video</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: Card Đăng ký */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-lg rounded-4 p-4 sticky-top" style={{ top: '100px' }}>
              <div className="bg-light rounded-4 mb-4 d-flex align-items-center justify-content-center overflow-hidden border shadow-sm" style={{ aspectRatio: '16/9' }}>
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                ) : (
                  <PlayCircle size={64} className="text-primary opacity-20" />
                )}
              </div>
              <div className="mb-4">
                <div className="d-flex align-items-end gap-2 mb-1">
                    <h3 className="fw-bold text-dark mb-0">Miễn phí</h3>
                    <span className="text-muted text-decoration-line-through small mb-1">1.200.000đ</span>
                </div>
                <p className="text-muted small fw-medium">Dành riêng cho nhân sự nội bộ công ty</p>
              </div>

              <button className="btn btn-primary w-100 py-3 rounded-3 fw-bold shadow-sm mb-3 btn-lg transition-all hover-scale" onClick={handleEnroll}>
                ĐĂNG KÝ HỌC NGAY
              </button>

              <div className="small text-muted mb-4 text-center fw-medium">
                <Users size={14} className="me-1" /> 1,240 học viên đã tham gia
              </div>

              <h6 className="fw-bold mb-3 border-bottom pb-2">Khóa học này có gì?</h6>
              <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
                <li className="d-flex align-items-start gap-2 small">
                  <CheckCircle2 size={18} className="text-success flex-shrink-0" />
                  <span>Truy cập toàn bộ video bài giảng & tài liệu</span>
                </li>
                <li className="d-flex align-items-start gap-2 small">
                  <CheckCircle2 size={18} className="text-success flex-shrink-0" />
                  <span>Hỗ trợ giải đáp thắc mắc từ giảng viên</span>
                </li>
                <li className="d-flex align-items-start gap-2 small">
                  <CheckCircle2 size={18} className="text-success flex-shrink-0" />
                  <span>Hệ thống bài tập tự luận & trắc nghiệm</span>
                </li>
                <li className="d-flex align-items-start gap-2 small">
                  <CheckCircle2 size={18} className="text-success flex-shrink-0" />
                  <span>Cấp chứng chỉ điện tử sau khi hoàn thành</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .hover-bg-white:hover { background-color: white; }
        .accordion-button:not(.collapsed) { color: #0d6efd; background-color: #f8f9fa; box-shadow: none; }
        .accordion-button::after { background-size: 1rem; }
        .accordion-button:focus { border-color: rgba(0,0,0,.125); box-shadow: none; }
        .course-description-content img { max-width: 100%; height: auto; border-radius: 12px; margin: 15px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .hover-scale:hover { transform: translateY(-2px); }
        .leading-relaxed { line-height: 1.8; }
      `}</style>
    </UserLayout>
  );
};

export default CourseOverview;
