import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import UserLayout from '../../components/layout/UserLayout';
import api, { getUploadUrl } from '../../api/axios';
import { useNotify } from '../../context/NotifyContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  BookOpen, PlayCircle, CheckCircle2, ArrowLeft, Loader2, Circle, Activity,
  Calendar, Layers, Hash, Video, Info, RefreshCw, HelpCircle, Minus, Plus, ClipboardCheck, FileStack
} from 'lucide-react';
const CourseOverview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useNotify();
  const { lang, t } = useLanguage();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [progressLessons, setProgressLessons] = useState([]);
  const [activeTab, setActiveTab] = useState('course');
  const [expandedSections, setExpandedSections] = useState(new Set());

  // New States for Features
  const [discussions, setDiscussions] = useState([]);
  const [newDiscussion, setNewDiscussion] = useState('');
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetchCourseDetail();
    
    const params = new URLSearchParams(location.search);
    if (params.get('preview') === 'true') {
      setIsEnrolled(false);
    } else {
      checkEnrollment();
    }
  }, [id, location.search]);

  useEffect(() => {
    if (activeTab === 'discussion') fetchDiscussions();
    if (activeTab === 'notes') fetchNote();
  }, [activeTab]);

  const fetchDiscussions = async () => {
    setLoadingDiscussions(true);
    try {
      const res = await api.get(`/Discussion/${id}`);
      setDiscussions(res.data);
    } catch (err) {
      console.error('Lỗi khi tải thảo luận:', err);
    } finally {
      setLoadingDiscussions(false);
    }
  };

  const handlePostDiscussion = async () => {
    if (!newDiscussion.trim()) return;
    try {
      await api.post('/Discussion', { courseId: parseInt(id), content: newDiscussion });
      setNewDiscussion('');
      fetchDiscussions();
      toast('Đã đăng thảo luận của bạn!');
    } catch (err) {
      toast('Không thể đăng thảo luận.', 'error');
    }
  };

  const fetchNote = async () => {
    try {
      const res = await api.get(`/Note/${id}`);
      setNote(res.data.content || '');
    } catch (err) {
      console.error('Lỗi khi tải ghi chú:', err);
    }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await api.post('/Note', { courseId: parseInt(id), lessonId: null, content: note });
      toast('Đã lưu ghi chú thành công!');
    } catch (err) {
      toast('Không thể lưu ghi chú.', 'error');
    } finally {
      setSavingNote(false);
    }
  };

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

  const [errorStatus, setErrorStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchCourseDetail = async () => {
    try {
      const response = await api.get(`/course/${id}`);
      setCourse(response.data);
      setErrorMessage('');
    } catch (err) {
      console.error(err);
      setErrorStatus(err.response?.status || 500);
      setErrorMessage(err.response?.data?.message || err.response?.data || '');
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
    navigate(`/learning/${id}?intro=1`);
  };

  if (loading) return <div className="vh-100 d-flex align-items-center justify-content-center bg-white"><Loader2 className="animate-spin text-primary" size={48} /></div>;

  if (errorStatus === 404 || !course) {
    return (
      <UserLayout hideSidebar hideHeader>
        <div className="container py-5 text-center" style={{ marginTop: '100px' }}>
          <div className="bg-light d-inline-flex p-4 rounded-circle mb-4">
            <BookOpen size={64} className="text-muted opacity-50" />
          </div>
          <h2 className="fw-bold mb-3">{t('courseNotFound') || 'Khóa học không tồn tại'}</h2>
          <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '400px' }}>
            {errorMessage || 'Khóa học bạn đang tìm kiếm không thể tìm thấy hoặc đã bị gỡ bỏ.'}
          </p>
          <button className="btn btn-primary px-5 py-2 fw-bold rounded-pill shadow-sm" onClick={() => navigate('/dashboard')}>
            {t('backToHome') || 'Quay lại trang chủ'}
          </button>
        </div>
      </UserLayout>
    );
  }

  const tabs = [
    { id: 'course', labelKey: 'tabCourse' },
    { id: 'progress', labelKey: 'tabProgress' },
    { id: 'dates', labelKey: 'tabDates' },
    { id: 'discussion', labelKey: 'tabDiscussion' },
    { id: 'notes', labelKey: 'tabNotes' }
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
                  <div className="small" style={{ color: '#64748b', fontWeight: 500 }}>{t('mainLessons')}</div>
                </div>
              </div>
            </div>
            <div className="col-auto">
              <div className="d-flex align-items-center gap-3 p-3 bg-white rounded-3 shadow-sm border">
                <div className="p-2 rounded-3" style={{ backgroundColor: 'rgba(25,135,84,0.1)' }}><Calendar size={22} /></div>
                <div>
                  <div className="fw-bold small" style={{ color: '#0f172a', fontWeight: 600 }}>{course.startDate ? new Date(course.startDate).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US') : '—'}</div>
                  <div className="small" style={{ color: '#64748b', fontWeight: 500 }}>{t('startDate')}</div>
                </div>
              </div>
            </div>
            <div className="col-auto">
              <div className="d-flex align-items-center gap-3 p-3 bg-white rounded-3 shadow-sm border">
                <div className="p-2 rounded-3" style={{ backgroundColor: 'rgba(220,53,69,0.1)' }}><Calendar size={22} /></div>
                <div>
                  <div className="fw-bold small" style={{ color: '#0f172a', fontWeight: 600 }}>{course.endDate ? new Date(course.endDate).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US') : '—'}</div>
                  <div className="small" style={{ color: '#64748b', fontWeight: 500 }}>{t('endDate')}</div>
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
              {t(tab.labelKey)}
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
                <span className="fw-medium" style={{ color: '#0f172a', fontSize: '1rem', fontWeight: 600 }}>{t('continueWhereLeft')}</span>
                <button className="btn btn-danger rounded-3 fw-semibold px-4 py-2" onClick={handleGoToLearning}>
                  {t('continueCourse')}
                </button>
              </div>
            )}

            <div className="mb-5">
              <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                <span className="badge px-3 py-2 rounded-pill fw-semibold small shadow-sm" style={{ backgroundColor: 'rgba(13,110,253,0.12)', color: '#0d6efd' }}>
                  <Hash size={14} className="me-1" /> {course.courseCode}
                </span>
                <span className="badge bg-dark px-3 py-2 rounded-pill fw-semibold small shadow-sm">
                  <Layers size={14} className="me-1" /> {course.categoryName || t('categoryDefault')}
                </span>
              </div>
              <div
                className="course-description-content border-start border-4 ps-4 py-3 px-3 rounded-end bg-white shadow-sm"
                style={{ lineHeight: 1.85, fontSize: '1rem', color: '#2d3748', fontWeight: 450 }}
                dangerouslySetInnerHTML={{ __html: course.description || t('noDescription') }}
              />
            </div>

            <div className="d-flex align-items-center justify-content-between mb-3">
              <h4 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 600 }}>
                <FileStack size={22} /> {t('curriculumContent')}
              </h4>
              <button type="button" className="btn btn-outline-secondary btn-sm rounded-3" onClick={expandAll}>
                {isAllExpanded ? t('collapseAll') : t('expandAll')}
              </button>
            </div>

            <div className="border rounded-3 overflow-hidden bg-white" style={{ borderColor: '#dee2e6' }} id="courseLessonsAccordion">
              {hasIntro && (() => {
                const hasIntroContent = (course.description && String(course.description).trim());
                const hasIntroVideo = course.showIntroVideo && (course.introVideoUrl || course.introExternalVideoUrl);
                const introItems = [];
                if (hasIntroContent) introItems.push({ title: t('sectionIntro'), done: false });
                if (hasIntroVideo) introItems.push({ title: t('introVideoShort'), done: false });
                return introItems.length > 0 ? (
                  <div className="border-bottom" style={{ borderColor: '#dee2e6' }}>
                    <div
                      className="d-flex align-items-center justify-content-between py-3 px-4 cursor-pointer"
                      style={{ backgroundColor: expandedSections.has('intro') ? '#f8fafc' : '#fff', cursor: 'pointer' }}
                      onClick={() => toggleSection('intro')}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <Circle size={20} className="text-secondary flex-shrink-0" style={{ color: '#adb5bd' }} />
                        <span className="fw-semibold" style={{ color: '#0f172a', fontSize: '1rem', fontWeight: 600 }}>{t('courseIntro')}</span>
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
                    <p className="mb-0" style={{ color: '#475569', fontSize: '0.95rem', fontWeight: 500 }}>{t('noLessonsYet')}</p>
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
                          <span className="fw-semibold" style={{ color: '#0f172a', fontSize: '1rem', fontWeight: 600 }}>{t('lesson')} {index + 1}: {lessonTitle}</span>
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
                              <div className="py-2 text-muted small">{t('noContentYet')}</div>
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
              <div className="bg-white rounded-4 border shadow-sm p-4 mb-5">
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
                  <Calendar size={20} className="text-primary" /> {t('importantDates')}
                </h5>
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-center gap-3 p-3 rounded-3 bg-light border">
                    <div className="p-2 rounded-circle bg-primary bg-opacity-10 text-primary">
                      <Circle size={16} fill="currentColor" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-bold" style={{ color: '#1e293b' }}>Bắt đầu khóa học</div>
                      <div className="small text-muted">{course.startDate ? new Date(course.startDate).toLocaleDateString('vi-VN', { dateStyle: 'full' }) : 'Chưa cập nhật'}</div>
                    </div>
                  </div>
                  
                  {displayLessons.filter(l => l.scheduledDate).map(lesson => (
                    <div key={lesson.id} className="d-flex align-items-center gap-3 p-3 rounded-3 bg-light border">
                      <div className="p-2 rounded-circle bg-info bg-opacity-10 text-info">
                        <Calendar size={16} />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold" style={{ color: '#1e293b' }}>Bài giảng: {lesson.title}</div>
                        <div className="small text-muted">{new Date(lesson.scheduledDate).toLocaleDateString('vi-VN', { dateStyle: 'full' })}</div>
                      </div>
                    </div>
                  ))}

                  <div className="d-flex align-items-center gap-3 p-3 rounded-3 bg-light border">
                    <div className="p-2 rounded-circle bg-danger bg-opacity-10 text-danger">
                      <Circle size={16} fill="currentColor" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-bold" style={{ color: '#1e293b' }}>Kết thúc khóa học</div>
                      <div className="small text-muted">{course.endDate ? new Date(course.endDate).toLocaleDateString('vi-VN', { dateStyle: 'full' }) : 'Không có thời hạn'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'progress' && (
              <div className="mb-5">
                {/* Progress Summary Card */}
                <div className="bg-white rounded-4 border shadow-sm p-4 mb-4">
                  <div className="row align-items-center g-4">
                    <div className="col-md-4 text-center border-md-end">
                      <div className="position-relative d-inline-block mb-2">
                        <svg width="120" height="120" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                          <circle 
                            cx="60" cy="60" r="54" fill="none" stroke="#10b981" strokeWidth="10" 
                            strokeDasharray="339.29" 
                            strokeDashoffset={339.29 - (339.29 * progressPercentage) / 100}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                          />
                        </svg>
                        <div className="position-absolute top-50 start-50 translate-middle text-center">
                          <div className="fw-bold fs-3" style={{ color: '#0f172a' }}>{Math.round(progressPercentage)}%</div>
                          <div className="extra-small text-muted fw-bold text-uppercase" style={{ fontSize: '0.6rem' }}>{t('completed') || 'Hoàn thành'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-8">
                      <div className="row g-3">
                        <div className="col-sm-6">
                          <div className="p-3 rounded-3 bg-light border">
                            <div className="small text-muted mb-1 fw-semibold">{t('totalLessons') || 'Tổng số bài học'}</div>
                            <div className="fs-5 fw-bold text-dark">{displayLessons.length}</div>
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <div className="p-3 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-20">
                            <div className="small text-success mb-1 fw-semibold">{t('completedLessons') || 'Đã hoàn thành'}</div>
                            <div className="fs-5 fw-bold text-success">{progressLessons.filter(l => l.isCompleted).length}</div>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="p-3 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-20">
                             <div className="small text-primary mb-1 fw-semibold">{t('status') || 'Trạng thái'}</div>
                             <div className="fw-bold text-primary">
                                {progressPercentage >= 100 ? (t('courseCompleted') || 'Đã hoàn thành khóa học') : (t('courseInProgress') || 'Đang trong quá trình học')}
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Lesson Progress List */}
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0f172a', fontSize: '1.1rem' }}>
                   <Activity size={20} className="text-primary" /> {t('detailedProgress') || 'Chi tiết từng bài giảng'}
                </h5>
                <div className="bg-white rounded-4 border shadow-sm overflow-hidden">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="px-4 py-3 border-0 small text-muted text-uppercase fw-bold" style={{ width: '60px' }}>#</th>
                          <th className="py-3 border-0 small text-muted text-uppercase fw-bold">{t('lessonTitle') || 'Tiêu đề bài học'}</th>
                          <th className="py-3 border-0 small text-muted text-uppercase fw-bold text-center" style={{ width: '150px' }}>{t('status') || 'Trạng thái'}</th>
                          <th className="px-4 py-3 border-0 small text-muted text-uppercase fw-bold text-end" style={{ width: '180px' }}>{t('completionTime') || 'Thời gian xong'}</th>
                        </tr>
                      </thead>
                      <tbody className="border-top-0">
                        {displayLessons.map((lesson, idx) => {
                          const progress = progressLessons.find(p => p.lessonId === lesson.id);
                          const isDone = progress?.isCompleted;
                          return (
                            <tr key={lesson.id}>
                              <td className="px-4 py-3 fw-bold text-secondary">{idx + 1}</td>
                              <td className="py-3">
                                <div className="fw-semibold text-dark">{lesson.title}</div>
                                <div className="extra-small text-muted">{lesson.courseCode}</div>
                              </td>
                              <td className="py-3 text-center">
                                {isDone ? (
                                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20 px-3 py-2 rounded-pill">
                                    <CheckCircle2 size={12} className="me-1" /> {t('completed') || 'Xong'}
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-20 px-3 py-2 rounded-pill">
                                    <Circle size={12} className="me-1" /> {t('notStarted') || 'Chưa học'}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-end small text-muted">
                                {isDone && progress.completedAt ? new Date(progress.completedAt).toLocaleString('vi-VN') : '—'}
                              </td>
                            </tr>
                          );
                        })}
                        {displayLessons.length === 0 && (
                          <tr>
                            <td colSpan="4" className="text-center py-5 text-muted">
                               <BookOpen size={40} className="mb-2 opacity-20" />
                               <div>{t('noLessonsFound') || 'Không tìm thấy bài giảng nào'}</div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'discussion' && (
              <div className="bg-white rounded-4 border shadow-sm p-4 mb-5">
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
                  <HelpCircle size={20} className="text-primary" /> {t('tabDiscussion')}
                </h5>
                
                <div className="mb-4">
                  <textarea 
                    className="form-control rounded-3 border shadow-sm p-3" 
                    rows="3" 
                    placeholder="Chia sẻ ý kiến hoặc đặt câu hỏi về khóa học..."
                    value={newDiscussion}
                    onChange={(e) => setNewDiscussion(e.target.value)}
                  ></textarea>
                  <div className="text-end mt-2">
                    <button className="btn btn-primary px-4 fw-bold rounded-pill" onClick={handlePostDiscussion} disabled={!newDiscussion.trim()}>
                      Gửi thảo luận
                    </button>
                  </div>
                </div>

                <div className="d-flex flex-column gap-4 mt-4">
                  {loadingDiscussions ? (
                    <div className="text-center py-4"><Loader2 className="animate-spin text-primary" /></div>
                  ) : discussions.length > 0 ? discussions.map(d => (
                    <div key={d.id} className="d-flex gap-3">
                      <img 
                        src={d.user?.avatarUrl ? getUploadUrl(d.user.avatarUrl) : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(d.user?.fullName || 'U')} 
                        className="rounded-circle shadow-sm" 
                        style={{ width: 44, height: 44, objectFit: 'cover' }} 
                        alt="Avatar"
                      />
                      <div className="flex-grow-1">
                        <div className="bg-light p-3 rounded-3 border shadow-sm">
                          <div className="fw-bold small" style={{ color: '#0f172a' }}>{d.user?.fullName}</div>
                          <div className="text-muted mb-2" style={{ fontSize: '0.75rem' }}>{new Date(d.createdAt).toLocaleString('vi-VN')}</div>
                          <div style={{ fontSize: '0.95rem', color: '#334155' }}>{d.content}</div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-5 text-muted">
                      <Info size={32} className="mb-2 opacity-30" />
                      <div>Chưa có thảo luận nào cho khóa học này. Hãy là người đầu tiên!</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'notes' && (
              <div className="bg-white rounded-4 border shadow-sm p-4 mb-5">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
                    <Layers size={20} className="text-primary" /> {t('tabNotes')}
                  </h5>
                  <button className="btn btn-primary btn-sm px-4 fw-bold rounded-pill" onClick={handleSaveNote} disabled={savingNote}>
                    {savingNote ? <Loader2 className="animate-spin" size={14} /> : 'Lưu ghi chú'}
                  </button>
                </div>
                <textarea 
                  className="form-control rounded-4 border shadow-sm p-4" 
                  style={{ minHeight: '300px', fontSize: '1rem', lineHeight: 1.6 }}
                  placeholder="Ghi chú cá nhân của bạn về khóa học này (chỉ bạn mới thấy)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                ></textarea>
              </div>
            )}
          </div>

          {/* Cột phải - Card đăng ký / vào khóa học */}
          <div className="col-lg-4">
            <div className="card border-0 sticky-top overflow-hidden course-enroll-card" style={{ top: '24px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(26,82,118,0.12)' }}>
              <div className="position-relative overflow-hidden" style={{ aspectRatio: '16/10', minHeight: 140 }}>
                {course.thumbnailUrl ? (
                  <>
                    <img src={course.thumbnailUrl} alt={course.title} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center video-play-overlay">
                      <div className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-lg" style={{ width: 52, height: 52 }}>
                        <PlayCircle size={26} className="text-primary" style={{ marginLeft: '3px' }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(160deg, #7ec8e3 0%, #3498db 50%, #1a5276 100%)' }}>
                    <div className="rounded-circle bg-white bg-opacity-20 d-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
                      <PlayCircle size={28} className="text-white" style={{ marginLeft: '3px' }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4">
                {isEnrolled ? (
                  <button className="btn w-100 py-3 rounded-3 fw-bold border-0 mb-4 d-flex align-items-center justify-content-center gap-2 course-enroll-btn" style={{ background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)', color: '#fff', fontSize: '1.05rem', boxShadow: '0 4px 14px rgba(39,174,96,0.35)' }} onClick={handleGoToLearning}>
                    {t('enterCourse')}
                  </button>
                ) : (
                  <button className="btn w-100 py-3 rounded-3 fw-bold border-0 mb-4 d-flex align-items-center justify-content-center gap-2 course-enroll-btn" style={{ background: 'linear-gradient(135deg, #1a5276 0%, #3498db 100%)', color: '#fff', fontSize: '1.05rem', boxShadow: '0 4px 14px rgba(26,82,118,0.35)' }} onClick={handleEnroll}>
                    {t('enrollCourse')}
                  </button>
                )}

                <div className="pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <h6 className="fw-bold mb-3" style={{ color: '#1a5276', fontSize: '1rem', letterSpacing: '-0.01em' }}>{t('youWillGet')}</h6>
                  <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                    <li className="d-flex align-items-center gap-3 py-2 px-3 rounded-3" style={{ backgroundColor: 'rgba(26,82,118,0.04)', fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>
                      <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 28, height: 28, backgroundColor: 'rgba(39,174,96,0.15)' }}><CheckCircle2 size={16} className="text-success" /></div>
                      <span>{t('benefitVideos')}</span>
                    </li>
                    <li className="d-flex align-items-center gap-3 py-2 px-3 rounded-3" style={{ backgroundColor: 'rgba(26,82,118,0.04)', fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>
                      <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 28, height: 28, backgroundColor: 'rgba(39,174,96,0.15)' }}><CheckCircle2 size={16} className="text-success" /></div>
                      <span>{t('benefitQuiz')}</span>
                    </li>
                    <li className="d-flex align-items-center gap-3 py-2 px-3 rounded-3" style={{ backgroundColor: 'rgba(26,82,118,0.04)', fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>
                      <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 28, height: 28, backgroundColor: 'rgba(39,174,96,0.15)' }}><CheckCircle2 size={16} className="text-success" /></div>
                      <span>{t('benefitCert')}</span>
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
        .course-enroll-card { transition: box-shadow 0.3s ease, transform 0.3s ease; }
        .course-enroll-card:hover { box-shadow: 0 8px 32px rgba(26,82,118,0.18) !important; }
        .course-enroll-btn { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .course-enroll-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(26,82,118,0.4) !important; color: #fff !important; }
      `}</style>
    </UserLayout>
  );
};

export default CourseOverview;
