import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserLayout from '../../components/layout/UserLayout';
import api from '../../api/axios';
import { useNotify } from '../../context/NotifyContext';
import {
  BookOpen, PlayCircle, CheckCircle2, ArrowLeft, Loader2, Circle,
  Calendar, Layers, Hash, Video, Info, RefreshCw, HelpCircle, Minus, Plus, ClipboardCheck, FileStack
} from 'lucide-react';
const CourseOverview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useNotify();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [progressLessons, setProgressLessons] = useState([]);
  const [activeTab, setActiveTab] = useState('course');
  const [expandedSections, setExpandedSections] = useState(new Set());

  useEffect(() => {
    fetchCourseDetail();
    checkEnrollment();
  }, [id]);

  useEffect(() => {
    if (!course) return;
    const hasIntroContent = (course.description && String(course.description).trim());
    const hasIntroVideo = course.showIntroVideo && (course.introVideoUrl || course.introExternalVideoUrl);
    const hasIntro = hasIntroContent || hasIntroVideo;
    const allLessons = course.lessons || [];
    const initial = new Set();
    if (hasIntro) initial.add('intro');
    if (allLessons.length > 0) initial.add(allLessons[0].id);
    setExpandedSections(initial);
  }, [course?.id, course?.description, course?.showIntroVideo, course?.introVideoUrl, course?.introExternalVideoUrl, course?.lessons]);

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

  const checkEnrollment = async () => {
    try {
      const res = await api.get(`/learning/progress/${id}`);
      setIsEnrolled(true);
      setProgressPercentage(res.data?.progressPercentage ?? 0);
      setProgressLessons(res.data?.lessons ?? []);
    } catch {
      setIsEnrolled(false);
      setProgressLessons([]);
    }
  };

  const isLessonCompleted = (lessonId) => progressLessons.find(p => p.lessonId === lessonId)?.isCompleted ?? false;

  const toggleSection = (id) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { hasIntro, displayLessons } = useMemo(() => {
    if (!course) return { hasIntro: false, displayLessons: [] };
    const hasIntroContent = (course.description && String(course.description).trim());
    const hasIntroVideo = course.showIntroVideo && (course.introVideoUrl || course.introExternalVideoUrl);
    const hasIntro = hasIntroContent || hasIntroVideo;
    const displayLessons = (course.lessons || []).slice().sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    return { hasIntro, displayLessons };
  }, [course]);

  const totalSections = displayLessons.length + (hasIntro ? 1 : 0);
  const isAllExpanded = totalSections > 0 && expandedSections.size >= totalSections;

  const expandAll = () => {
    const lessonIds = displayLessons.map(l => l.id);
    if (isAllExpanded) {
      setExpandedSections(new Set());
    } else {
      const all = new Set(lessonIds);
      if (hasIntro) all.add('intro');
      setExpandedSections(all);
    }
  };

  const getLessonSections = (lesson) => {
    const apiSections = lesson.sections || lesson.Sections;
    if (apiSections && Array.isArray(apiSections) && apiSections.length > 0) {
      return apiSections.map(s => ({
        title: s.title ?? s.Title ?? '',
        content: s.content ?? s.Content,
        showVideo: s.showVideo ?? s.ShowVideo,
        showQuiz: s.showQuiz ?? s.ShowQuiz
      }));
    }
    return [
      { title: lesson.section1Title || '1. Giới thiệu bài học', content: lesson.overview, showVideo: lesson.showVideo1, showQuiz: lesson.showQuiz1 },
      { title: lesson.section2Title || '2. Bài giảng chi tiết', content: lesson.content, showVideo: lesson.showVideo2, showQuiz: lesson.showQuiz2 },
      { title: lesson.section3Title || '3. Phần ôn tập', content: lesson.reviewContent, showVideo: lesson.showVideo3, showQuiz: lesson.showQuiz3 },
      { title: lesson.section4Title || '4. Câu hỏi tự luận', content: lesson.essayQuestion, showVideo: lesson.showVideo4, showQuiz: lesson.showQuiz4 },
      { title: lesson.section5Title || '5. Tổng kết bài học', content: null, showVideo: lesson.showVideo5, showQuiz: lesson.showQuiz5 }
    ].filter(s => s.title != null && s.title !== '');
  };

  const handleEnroll = async () => {
    try {
      await api.post('/learning/enroll', { courseId: parseInt(id) });
      navigate(`/learning/${id}?intro=1`);
    } catch (err) {
      toast('Lỗi khi đăng ký khóa học.', 'error');
    }
  };

  const handleGoToLearning = () => {
    if (progressPercentage === 0) {
      navigate(`/learning/${id}?intro=1`);
    } else {
      navigate(`/learning/${id}`);
    }
  };

  if (loading) return <div className="vh-100 d-flex align-items-center justify-content-center bg-white"><Loader2 className="animate-spin text-primary" size={48} /></div>;

  const tabs = [
    { id: 'course', label: 'Khóa Học' },
    { id: 'progress', label: 'Tiến độ' },
    { id: 'dates', label: 'Ngày quan trọng' },
    { id: 'discussion', label: 'Thảo luận' },
    { id: 'notes', label: 'Ghi chú' }
  ];

  return (
    <UserLayout hideSidebar hideHeader>
      <div className="container-fluid px-4 px-md-5 pt-3 pb-5" style={{ maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}>
        {/* Header: Nút quay lại, Mã khóa, Tên khóa (theo hình tham chiếu) */}
        <div className="d-flex align-items-flex-start gap-3 mb-3">
          <button className="btn btn-link text-body-secondary p-2 mt-0 d-inline-flex align-items-center justify-content-center rounded-circle text-decoration-none back-arrow-btn flex-shrink-0" style={{ marginLeft: '-0.5rem' }} onClick={() => navigate('/dashboard')} title="Quay lại">
            <ArrowLeft size={24} />
          </button>
          <div className="min-width-0 flex-grow-1">
            <div className="mb-1" style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>{course.courseCode || '—'}</div>
            <h1 className="fw-bold mb-3" style={{ fontSize: '1.75rem', lineHeight: 1.35, color: '#0f172a', letterSpacing: '-0.02em', fontWeight: 700, wordBreak: 'break-word' }}>{course.title}</h1>
          </div>
        </div>
        <div className="mb-3">
          <div className="row g-3 mb-0">
            <div className="col-auto">
              <div className="d-flex align-items-center gap-3 p-3 bg-white rounded-3 shadow-sm border">
                <div className="p-2 rounded-3" style={{ backgroundColor: 'rgba(13,110,253,0.1)' }}><BookOpen size={22} /></div>
                <div>
                  <div className="fw-bold fs-5" style={{ color: '#0f172a', fontWeight: 600 }}>{course.lessons?.length || 0}</div>
                  <div className="small" style={{ color: '#64748b', fontWeight: 500 }}>Bài học chính</div>
                </div>
              </div>
            </div>
            <div className="col-auto">
              <div className="d-flex align-items-center gap-3 p-3 bg-white rounded-3 shadow-sm border">
                <div className="p-2 rounded-3" style={{ backgroundColor: 'rgba(25,135,84,0.1)' }}><Calendar size={22} /></div>
                <div>
                  <div className="fw-bold small" style={{ color: '#0f172a', fontWeight: 600 }}>{course.startDate ? new Date(course.startDate).toLocaleDateString('vi-VN') : '—'}</div>
                  <div className="small" style={{ color: '#64748b', fontWeight: 500 }}>Ngày khai giảng</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs cố định */}
        <nav className="nav border-0 mb-3 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`nav-link fw-semibold rounded-3 px-4 py-2 border-0 ${activeTab === tab.id ? 'bg-primary text-white shadow-sm' : 'text-body-secondary'} `}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="row g-5 align-items-start">
          {/* Cột trái: Thông tin chi tiết */}
          <div className="col-lg-8 mb-5">
            {activeTab === 'course' && (
            <>
            {/* Banner Tiếp tục khi đã đăng ký */}
            {isEnrolled && (
              <div className="d-flex align-items-center justify-content-between p-4 mb-4 rounded-3 border bg-white shadow-sm">
                <span className="fw-medium" style={{ color: '#0f172a', fontSize: '1rem', fontWeight: 600 }}>Tiếp tục nơi bạn đã dừng lại</span>
                <button className="btn btn-danger rounded-3 fw-semibold px-4 py-2" onClick={handleGoToLearning}>
                  Tiếp tục khóa học
                </button>
              </div>
            )}

            <div className="mb-5">
              <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                <span className="badge px-3 py-2 rounded-pill fw-semibold small shadow-sm" style={{ backgroundColor: 'rgba(13,110,253,0.12)', color: '#0d6efd' }}>
                  <Hash size={14} className="me-1" /> {course.courseCode}
                </span>
                <span className="badge bg-dark px-3 py-2 rounded-pill fw-semibold small shadow-sm">
                  <Layers size={14} className="me-1" /> {course.categoryName || 'Chuyên ngành'}
                </span>
              </div>
              <div
                className="course-description-content border-start border-4 ps-4 py-3 px-3 rounded-end bg-white shadow-sm"
                style={{ lineHeight: 1.85, fontSize: '1rem', color: '#2d3748', fontWeight: 450 }}
                dangerouslySetInnerHTML={{ __html: course.description || 'Chưa có mô tả cho khóa học này.' }}
              />
            </div>

            <div className="d-flex align-items-center justify-content-between mb-3">
              <h4 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 600 }}>
                <FileStack size={22} /> Nội dung chương trình học
              </h4>
              <button type="button" className="btn btn-outline-secondary btn-sm rounded-3" onClick={expandAll}>
                {isAllExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
              </button>
            </div>

            <div className="border rounded-3 overflow-hidden bg-white" style={{ borderColor: '#dee2e6' }} id="courseLessonsAccordion">
              {hasIntro && (() => {
                const hasIntroContent = (course.description && String(course.description).trim());
                const hasIntroVideo = course.showIntroVideo && (course.introVideoUrl || course.introExternalVideoUrl);
                const introItems = [];
                if (hasIntroContent) introItems.push({ title: 'Giới thiệu học phần', done: false });
                if (hasIntroVideo) introItems.push({ title: 'Video giới thiệu', done: false });
                return introItems.length > 0 ? (
                  <div className="border-bottom" style={{ borderColor: '#dee2e6' }}>
                    <div
                      className="d-flex align-items-center justify-content-between py-3 px-4 cursor-pointer"
                      style={{ backgroundColor: expandedSections.has('intro') ? '#f8fafc' : '#fff', cursor: 'pointer' }}
                      onClick={() => toggleSection('intro')}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <Circle size={20} className="text-secondary flex-shrink-0" style={{ color: '#adb5bd' }} />
                        <span className="fw-semibold" style={{ color: '#0f172a', fontSize: '1rem', fontWeight: 600 }}>Giới thiệu khóa học</span>
                      </div>
                      {expandedSections.has('intro') ? <Minus size={20} className="text-secondary" /> : <Plus size={20} className="text-secondary" />}
                    </div>
                    <div id="introCollapse" className={expandedSections.has('intro') ? '' : 'd-none'}>
                      <div className="px-4 pb-4 pt-0" style={{ backgroundColor: '#fff', borderTop: '1px solid #dee2e6' }}>
                        <div className="ps-5">
                          {introItems.map((item, i) => (
                            <div 
                              key={i} 
                              className="d-flex align-items-center gap-3 py-2 border-bottom cursor-pointer" 
                              style={{ borderColor: 'rgba(0,0,0,0.06)' }}
                              onClick={() => isEnrolled && navigate(`/learning/${id}?intro=1`)}
                            >
                              {item.done ? <CheckCircle2 size={20} className="text-success flex-shrink-0" /> : <Circle size={20} className="flex-shrink-0" style={{ color: '#adb5bd' }} />}
                              <span style={{ color: '#1e293b', fontSize: '0.95rem', fontWeight: 500 }}>{item.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {displayLessons.length === 0 && !hasIntro ? (
                  <div className="p-5 text-center">
                    <BookOpen size={40} className="mb-2 opacity-50" />
                    <p className="mb-0" style={{ color: '#475569', fontSize: '0.95rem', fontWeight: 500 }}>Chưa có bài học nào. Nội dung sẽ được cập nhật khi giảng viên thêm bài học.</p>
                  </div>
                ) : displayLessons.map((lesson, index) => {
                  const isExpanded = expandedSections.has(lesson.id);
                  const lessonDone = isLessonCompleted(lesson.id);
                  const sections = getLessonSections(lesson);
                  const lessonTitle = (lesson.title || '').replace(/^Bài\s*\d+\s*:\s*/i, '').trim() || lesson.title || '';
                  return (
                    <div key={lesson.id} className="border-bottom" style={{ borderColor: '#dee2e6' }}>
                      <div
                        className="d-flex align-items-center justify-content-between py-3 px-4 cursor-pointer"
                        style={{ backgroundColor: isExpanded ? '#f8fafc' : '#fff', cursor: 'pointer' }}
                        onClick={() => toggleSection(lesson.id)}
                      >
                        <div className="d-flex align-items-center gap-3">
                          {lessonDone ? <CheckCircle2 size={20} className="text-success flex-shrink-0" /> : <Circle size={20} className="flex-shrink-0" style={{ color: '#adb5bd' }} />}
                          <span className="fw-semibold" style={{ color: '#0f172a', fontSize: '1rem', fontWeight: 600 }}>Bài {index + 1}: {lessonTitle}</span>
                        </div>
                        {isExpanded ? <Minus size={20} className="text-secondary" /> : <Plus size={20} className="text-secondary" />}
                      </div>
                      <div className={isExpanded ? '' : 'd-none'}>
                        <div className="px-4 pb-4 pt-0" style={{ backgroundColor: '#fff', borderTop: '1px solid #dee2e6' }}>
                          <div className="ps-5">
                            {sections.length > 0 ? sections.map((sec, i) => {
                              const secTitle = (sec.title || '').replace(/^\d+\.\s*/, '').trim() || sec.title || `Phần ${i + 1}`;
                              return (
                              <div 
                                key={i} 
                                className="d-flex align-items-center justify-content-between py-2 border-bottom cursor-pointer" 
                                style={{ borderColor: 'rgba(0,0,0,0.06)' }}
                                onClick={() => isEnrolled && navigate(`/learning/${id}?lesson=${lesson.id}&section=${i + 1}`)}
                              >
                                <div className="d-flex align-items-center gap-3">
                                  <Circle size={20} className="flex-shrink-0" style={{ color: '#adb5bd' }} />
                                  <span style={{ color: '#1e293b', fontSize: '0.95rem', fontWeight: 500 }}>{secTitle}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  {sec.showVideo && <span className="badge rounded-pill small" style={{ backgroundColor: 'rgba(13,110,253,0.12)', color: '#0d6efd' }}><Video size={10} className="me-1" /> Video</span>}
                                  {sec.showQuiz && <span className="badge rounded-pill small" style={{ backgroundColor: 'rgba(25,135,84,0.12)', color: '#198754' }}><ClipboardCheck size={10} className="me-1" /> Quiz</span>}
                                </div>
                              </div>
                              );
                            }) : (
                              <div className="py-2 text-muted small">Chưa có phần nội dung</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
            </>
            )}
            {activeTab === 'dates' && (
              <div className="bg-white rounded-4 border shadow-sm p-5 mb-5">
                <h5 className="fw-bold mb-4" style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: 600 }}>Ngày quan trọng</h5>
                <p className="mb-0" style={{ fontSize: '0.95rem', color: '#475569', fontWeight: 500 }}>Chức năng đang được phát triển.</p>
              </div>
            )}
            {activeTab === 'progress' && (
              <div className="bg-white rounded-4 border shadow-sm p-5 mb-5">
                <h5 className="fw-bold mb-4" style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: 600 }}>Tiến độ học tập</h5>
                <div className="progress" style={{ height: '12px' }}>
                  <div className="progress-bar bg-success" style={{ width: `${progressPercentage}%` }} />
                </div>
                <p className="mt-2 mb-0" style={{ fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>{Math.round(progressPercentage)}% đã hoàn thành</p>
              </div>
            )}
            {activeTab === 'discussion' && (
              <div className="bg-white rounded-4 border shadow-sm p-5 mb-5">
                <h5 className="fw-bold mb-4" style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: 600 }}>Thảo luận</h5>
                <p className="mb-0" style={{ fontSize: '0.95rem', color: '#475569', fontWeight: 500 }}>Chức năng thảo luận đang được phát triển.</p>
              </div>
            )}
            {activeTab === 'notes' && (
              <div className="bg-white rounded-4 border shadow-sm p-5 mb-5">
                <h5 className="fw-bold mb-4" style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: 600 }}>Ghi chú</h5>
                <p className="mb-0" style={{ fontSize: '0.95rem', color: '#475569', fontWeight: 500 }}>Chức năng ghi chú đang được phát triển.</p>
              </div>
            )}
          </div>

          {/* Cột phải */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden sticky-top bg-white" style={{ top: '24px' }}>
              <div className="rounded-top-4 overflow-hidden position-relative video-preview-wrapper" style={{ aspectRatio: '16/9' }}>
                {course.thumbnailUrl ? (
                  <>
                    <img src={course.thumbnailUrl} alt={course.title} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center video-play-overlay">
                      <div className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow" style={{ width: '56px', height: '56px' }}>
                        <PlayCircle size={28} className="text-primary" style={{ marginLeft: '4px' }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)' }}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '72px', height: '72px', backgroundColor: 'rgba(13,110,253,0.12)' }}>
                      <PlayCircle size={36} className="text-primary" style={{ marginLeft: '4px', opacity: 0.9 }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4">
                {isEnrolled ? (
                  <button className="btn btn-success w-100 py-3 rounded-3 fw-bold shadow-sm mb-4 btn-lg transition-all hover-scale d-flex align-items-center justify-content-center gap-2" onClick={handleGoToLearning}>
                    Vào khoá học
                  </button>
                ) : (
                  <button className="btn btn-primary w-100 py-3 rounded-3 fw-bold shadow-sm mb-4 btn-lg transition-all hover-scale d-flex align-items-center justify-content-center gap-2" onClick={handleEnroll}>
                    Đăng ký học
                  </button>
                )}

                <div className="border-top pt-3 mt-2">
                  <h6 className="fw-bold mb-3" style={{ color: '#0f172a', fontSize: '1rem', fontWeight: 600 }}>Bạn sẽ nhận được</h6>
                  <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                    <li className="d-flex align-items-start gap-2" style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, fontWeight: 500 }}>
                      <CheckCircle2 size={18} className="text-success flex-shrink-0 mt-1" />
                      <span>Video bài giảng & tài liệu đầy đủ</span>
                    </li>
                    <li className="d-flex align-items-start gap-2" style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, fontWeight: 500 }}>
                      <CheckCircle2 size={18} className="text-success flex-shrink-0 mt-1" />
                      <span>Bài tập trắc nghiệm & tự luận</span>
                    </li>
                    <li className="d-flex align-items-start gap-2" style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, fontWeight: 500 }}>
                      <CheckCircle2 size={18} className="text-success flex-shrink-0 mt-1" />
                      <span>Chứng chỉ điện tử khi hoàn thành</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .video-play-overlay { background: rgba(0,0,0,0.2); opacity: 0; transition: opacity 0.25s ease; }
        .video-preview-wrapper:hover .video-play-overlay { opacity: 1; }
        .back-arrow-btn:hover { background-color: rgba(0,0,0,0.05); color: #0d6efd !important; }
        .accordion-button:not(.collapsed) { color: #0d6efd !important; background-color: #f8fafc !important; box-shadow: none; }
        .accordion-button::after { background-size: 1rem; }
        .accordion-button:focus { border-color: rgba(0,0,0,.08); box-shadow: none; }
        .course-description-content img { max-width: 100%; height: auto; border-radius: 12px; margin: 15px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .course-description-content p { margin-bottom: 0.75rem; font-weight: 450; color: #2d3748; }
        .course-description-content h1, .course-description-content h2, .course-description-content h3 { margin-top: 1rem; margin-bottom: 0.5rem; font-weight: 600; color: #0f172a; }
        .course-description-content ul, .course-description-content ol { padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .hover-scale:hover { transform: translateY(-2px); }
      `}</style>
    </UserLayout>
  );
};

export default CourseOverview;
