import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import {
  CheckCircle2, Circle, PlayCircle, FileText,
  ArrowLeft, Loader2, ChevronRight, ChevronLeft, ChevronDown,
  Menu, X, Award, Video, Info, BookOpen, RefreshCw, HelpCircle
} from 'lucide-react';

const ProgressCircle = ({ percentage, size = 36 }) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={percentage >= 100 ? '#10b981' : '#6366f1'}
        strokeWidth="4" strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
      <text x="50%" y="50%" textAnchor="middle" dy=".35em" fontSize={size * 0.26} fontWeight="bold"
        fill={percentage >= 100 ? '#10b981' : '#6366f1'}>{Math.round(percentage)}%</text>
    </svg>
  );
};

const QuizSection = ({ courseId, lessonId, section, onComplete }) => {
  const [quiz, setQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setQuiz(null); setResult(null); setSelectedAnswers({});
    const load = async () => {
      try {
        const res = await api.get(`/quiz/${courseId}?section=${section}&lessonId=${lessonId}`);
        setQuiz(res.data);
      } catch { /* no quiz */ }
    };
    load();
  }, [courseId, lessonId, section]);

  const handleSubmit = async () => {
    if (!quiz || Object.keys(selectedAnswers).length < quiz.questions.length) {
      alert('Vui lòng trả lời tất cả các câu hỏi!'); return;
    }
    setSubmitting(true);
    try {
      let correct = 0;
      quiz.questions.forEach(q => {
        const ans = q.answers.find(a => a.isCorrect);
        if (ans && selectedAnswers[q.id] === ans.id) correct++;
      });
      const score = Math.round((correct / quiz.questions.length) * 100);
      const passed = score >= (quiz.passingScore || 80);
      setResult({ score, isPassed: passed, correctCount: correct, total: quiz.questions.length });
      if (onComplete) onComplete(passed);
    } catch { alert('Lỗi khi nộp bài.'); }
    finally { setSubmitting(false); }
  };

  if (!quiz || !quiz.questions || quiz.questions.length === 0) return null;

  if (result) {
    return (
      <div className={`p-4 rounded-4 border ${result.isPassed ? 'bg-success bg-opacity-10 border-success' : 'bg-danger bg-opacity-10 border-danger'}`}>
        <div className="text-center">
          <div className={`display-4 fw-bold mb-2 ${result.isPassed ? 'text-success' : 'text-danger'}`}>{result.score}%</div>
          <h5 className="fw-bold">{result.isPassed ? 'Chúc mừng! Bạn đã đạt.' : 'Rất tiếc! Bạn cần cố gắng hơn.'}</h5>
          <p className="mb-3 text-secondary">Số câu đúng: {result.correctCount}/{result.total}</p>
          {!result.isPassed && (
            <button className="btn btn-outline-danger btn-sm rounded-pill px-4" onClick={() => { setResult(null); setSelectedAnswers({}); }}>Làm lại</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <HelpCircle className="text-primary" size={24} />
        <h5 className="fw-bold mb-0">Bài tập trắc nghiệm</h5>
      </div>
      <div className="d-flex flex-column gap-4">
        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="quiz-question shadow-sm p-3 rounded-3 bg-white border">
            <div className="fw-bold mb-3 text-dark">{idx + 1}. {q.content}</div>
            <div className="row g-2">
              {q.answers.map(ans => (
                <div key={ans.id} className="col-md-6">
                  <div
                    className={`p-3 rounded-3 border cursor-pointer transition-all ${selectedAnswers[q.id] === ans.id ? 'bg-primary text-white border-primary shadow-sm' : 'bg-light hover-bg-white'}`}
                    onClick={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: ans.id })}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      {selectedAnswers[q.id] === ans.id ? <CheckCircle2 size={18} /> : <Circle size={18} className="opacity-30" />}
                      <span className="small">{ans.content}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 text-center">
        <button className="btn btn-primary px-5 py-2 rounded-pill fw-bold shadow-lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="animate-spin me-2" size={18} /> : <FileText className="me-2" size={18} />} Nộp bài
        </button>
      </div>
    </div>
  );
};

const sectionIcons = [
  <Info size={18} />,
  <BookOpen size={18} />,
  <RefreshCw size={18} />,
  <HelpCircle size={18} />,
  <Award size={18} />
];

const LearningView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeSection, setActiveSection] = useState(1);
  const [expandedLessonId, setExpandedLessonId] = useState(null);
  const [showIntro, setShowIntro] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [finishedVideos, setFinishedVideos] = useState(new Set());
  const [sectionProgress, setSectionProgress] = useState({});
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`sp_${courseId}`);
    if (saved) {
      try { setSectionProgress(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, [courseId]);

  const saveSP = useCallback((next) => {
    localStorage.setItem(`sp_${courseId}`, JSON.stringify(next));
  }, [courseId]);

  const markSectionDone = useCallback((lessonId, key) => {
    setSectionProgress(prev => {
      const k = `${lessonId}_${key}`;
      if (prev[k]) return prev;
      const next = { ...prev, [k]: true };
      saveSP(next);
      return next;
    });
  }, [saveSP]);

  const getSections = useCallback((lesson) => {
    if (!lesson) return [];
    const contents = [lesson.overview, lesson.content, lesson.reviewContent, lesson.essayQuestion, null];
    const videos = [lesson.showVideo1, lesson.showVideo2, lesson.showVideo3, lesson.showVideo4, lesson.showVideo5];
    const quizzes = [lesson.showQuiz1, lesson.showQuiz2, lesson.showQuiz3, lesson.showQuiz4, lesson.showQuiz5];
    const titles = [lesson.section1Title, lesson.section2Title, lesson.section3Title, lesson.section4Title, lesson.section5Title];
    const out = [];
    for (let i = 0; i < 5; i++) {
      if (contents[i] || videos[i] || quizzes[i]) {
        out.push({ num: i + 1, title: titles[i], hasVideo: videos[i], hasQuiz: quizzes[i] });
      }
    }
    return out;
  }, []);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await api.get(`/learning/progress/${courseId}`);
      setData(res.data);
      return res.data;
    } catch (err) { console.error(err); return null; }
    finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => {
    fetchProgress().then(d => {
      if (!d) return;
      const introP = searchParams.get('intro');
      const lessonP = searchParams.get('lesson');
      const sectionP = searchParams.get('section');

      if (introP === '1') {
        setShowIntro(true);
      } else if (lessonP) {
        const lesson = d.lessons.find(l => l.lessonId === parseInt(lessonP));
        if (lesson) {
          setActiveLesson(lesson);
          setExpandedLessonId(lesson.lessonId);
          setActiveSection(sectionP ? parseInt(sectionP) : 1);
        }
      } else {
        const first = d.lessons.find(l => !l.isCompleted) || d.lessons[0];
        if (first) {
          setActiveLesson(first);
          setExpandedLessonId(first.lessonId);
          const secs = getSections(first);
          setActiveSection(secs.length > 0 ? secs[0].num : 1);
        }
      }
      setInitialised(true);
    });
  }, [courseId]);

  useEffect(() => {
    if (!initialised) return;
    if (showIntro) {
      setSearchParams({ intro: '1' }, { replace: true });
    } else if (activeLesson) {
      setSearchParams({ lesson: String(activeLesson.lessonId), section: String(activeSection) }, { replace: true });
    }
  }, [activeLesson, activeSection, showIntro, initialised]);

  const getContent = (lesson, num) => [lesson.overview, lesson.content, lesson.reviewContent, lesson.essayQuestion, null][num - 1];
  const getVideo = (lesson, num) => {
    const map = {
      1: { url: lesson.videoUrl1, ext: lesson.externalVideoUrl1, show: lesson.showVideo1 },
      2: { url: lesson.videoUrl2, ext: lesson.externalVideoUrl2, show: lesson.showVideo2 },
      3: { url: lesson.videoUrl3, ext: lesson.externalVideoUrl3, show: lesson.showVideo3 },
      4: { url: lesson.videoUrl4, ext: lesson.externalVideoUrl4, show: lesson.showVideo4 },
      5: { url: lesson.videoUrl5, ext: lesson.externalVideoUrl5, show: lesson.showVideo5 },
    };
    return map[num] || { url: null, ext: null, show: false };
  };
  const getQuiz = (lesson, num) => [lesson.showQuiz1, lesson.showQuiz2, lesson.showQuiz3, lesson.showQuiz4, lesson.showQuiz5][num - 1];

  const handleSelectLesson = (lesson) => {
    if (expandedLessonId === lesson.lessonId) {
      setExpandedLessonId(null);
      return;
    }
    setExpandedLessonId(lesson.lessonId);
  };

  const handleSelectSection = (lesson, sectionNum) => {
    setActiveLesson(lesson);
    setActiveSection(sectionNum);
    setShowIntro(false);
    setFinishedVideos(new Set());
    const savedVids = localStorage.getItem(`sp_${courseId}`);
    if (savedVids) {
      try {
        const sp = JSON.parse(savedVids);
        const vids = new Set();
        for (let i = 1; i <= 5; i++) {
          if (sp[`${lesson.lessonId}_video_${i}`]) vids.add(i);
        }
        setFinishedVideos(vids);
      } catch { /* ignore */ }
    }
  };

  const goNext = async () => {
    if (!activeLesson || !data) return;
    markSectionDone(activeLesson.lessonId, activeSection);
    const sections = getSections(activeLesson);
    const idx = sections.findIndex(s => s.num === activeSection);

    if (idx < sections.length - 1) {
      setActiveSection(sections[idx + 1].num);
    } else {
      try {
        if (!activeLesson.isCompleted) {
          await api.post('/learning/complete-lesson', { lessonId: activeLesson.lessonId });
        }
      } catch { /* ignore */ }
      const li = data.lessons.findIndex(l => l.lessonId === activeLesson.lessonId);
      if (li < data.lessons.length - 1) {
        const next = data.lessons[li + 1];
        setActiveLesson(next);
        setExpandedLessonId(next.lessonId);
        const ns = getSections(next);
        setActiveSection(ns.length > 0 ? ns[0].num : 1);
        setFinishedVideos(new Set());
      }
      fetchProgress().then(d => {
        if (d && activeLesson) {
          const updated = d.lessons.find(l => l.lessonId === activeLesson.lessonId);
          if (updated) setActiveLesson(updated);
        }
      });
    }
  };

  const goPrev = () => {
    if (!activeLesson || !data) return;
    const sections = getSections(activeLesson);
    const idx = sections.findIndex(s => s.num === activeSection);

    if (idx > 0) {
      setActiveSection(sections[idx - 1].num);
    } else {
      const li = data.lessons.findIndex(l => l.lessonId === activeLesson.lessonId);
      if (li > 0) {
        const prev = data.lessons[li - 1];
        setActiveLesson(prev);
        setExpandedLessonId(prev.lessonId);
        const ps = getSections(prev);
        setActiveSection(ps.length > 0 ? ps[ps.length - 1].num : 1);
        setFinishedVideos(new Set());
      }
    }
  };

  const renderIntro = () => (
    <div className="mx-auto py-5" style={{ maxWidth: '800px' }}>
      <div className="text-center mb-5">
        <div className="badge bg-primary-subtle text-primary px-4 py-2 rounded-pill mb-4 fs-6 fw-bold">Giới thiệu khóa học</div>
        <h1 className="display-5 fw-bold text-dark mb-3">{data.courseTitle}</h1>
        <p className="text-muted fs-5">Chào mừng bạn đến với khóa học! Hãy xem tổng quan nội dung bên dưới.</p>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-5 mb-5">
        <h5 className="fw-bold mb-4 d-flex align-items-center gap-2"><BookOpen size={22} className="text-primary" /> Tổng quan khóa học</h5>
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="text-center p-3 bg-light rounded-3">
              <div className="fw-bold fs-4 text-primary">{data.lessons.length}</div>
              <div className="text-muted small">Bài học</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-center p-3 bg-light rounded-3">
              <div className="fw-bold fs-4 text-success">{data.lessons.filter(l => l.isCompleted).length}</div>
              <div className="text-muted small">Đã hoàn thành</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-center p-3 bg-light rounded-3">
              <div className="fw-bold fs-4 text-info">{Math.round(data.progressPercentage)}%</div>
              <div className="text-muted small">Tiến độ</div>
            </div>
          </div>
        </div>

        <h6 className="fw-bold mb-3">Danh sách bài học:</h6>
        <div className="d-flex flex-column gap-2">
          {data.lessons.map((l, i) => (
            <div key={l.lessonId} className="d-flex align-items-center gap-3 p-2 rounded-3 bg-light">
              {l.isCompleted ? <CheckCircle2 size={18} className="text-success" /> : <Circle size={18} className="text-muted opacity-40" />}
              <span className="small fw-medium">{i + 1}. {l.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <button className="btn btn-primary btn-lg px-5 py-3 rounded-3 fw-bold shadow-lg d-inline-flex align-items-center gap-2"
          onClick={() => {
            setShowIntro(false);
            const first = data.lessons.find(l => !l.isCompleted) || data.lessons[0];
            if (first) {
              setActiveLesson(first);
              setExpandedLessonId(first.lessonId);
              const secs = getSections(first);
              setActiveSection(secs.length > 0 ? secs[0].num : 1);
            }
          }}>
          Bắt đầu học <ChevronRight size={22} />
        </button>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    if (!activeLesson) return (
      <div className="h-100 d-flex align-items-center justify-content-center text-muted">
        Chọn bài học từ danh sách bên phải
      </div>
    );

    const content = getContent(activeLesson, activeSection);
    const video = getVideo(activeLesson, activeSection);
    const showQuiz = getQuiz(activeLesson, activeSection);
    const titles = [activeLesson.section1Title, activeLesson.section2Title, activeLesson.section3Title, activeLesson.section4Title, activeLesson.section5Title];
    const sectionTitle = titles[activeSection - 1];
    const lessonIdx = data.lessons.findIndex(l => l.lessonId === activeLesson.lessonId);
    const videoWatched = finishedVideos.has(activeSection);

    return (
      <div className="mx-auto" style={{ maxWidth: '1000px' }}>
        <div className="mb-4">
          <div className="badge bg-primary px-3 py-2 rounded-pill mb-3 text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>
            BÀI {lessonIdx + 1} &mdash; MỤC {activeSection}
          </div>
          <h2 className="fw-bold text-dark mb-1">{activeLesson.title}</h2>
          <h5 className="text-muted">{sectionTitle}</h5>
        </div>

        {/* Content + Video card */}
        <div className="bg-white rounded-4 border shadow-sm overflow-hidden mb-4">
          <div className="p-4 p-md-5">
            {content && (
              <div className="lesson-content fs-5 text-secondary" dangerouslySetInnerHTML={{ __html: content }} />
            )}

            {video.show && (video.url || video.ext) && (
              <div className={content ? 'mt-4 pt-4 border-top' : ''}>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Video size={20} className="text-primary" />
                  <h6 className="fw-bold mb-0">Video bài giảng</h6>
                  {videoWatched && <span className="badge bg-success rounded-pill ms-2 small">Đã xem ✓</span>}
                </div>

                {showQuiz && !videoWatched && (
                  <div className="alert alert-primary d-flex align-items-center gap-2 rounded-3 border-0 bg-primary bg-opacity-10 text-primary mb-3">
                    <Info size={18} />
                    <span className="small fw-bold">Xem hết video để mở bài tập trắc nghiệm.</span>
                  </div>
                )}

                <div className="ratio ratio-16x9 rounded-4 overflow-hidden bg-black shadow-lg">
                  {video.url ? (
                    <video key={video.url} controls controlsList="nodownload"
                      onEnded={() => {
                        setFinishedVideos(p => new Set([...p, activeSection]));
                        markSectionDone(activeLesson.lessonId, `video_${activeSection}`);
                      }}>
                      <source src={video.url} type="video/mp4" />
                    </video>
                  ) : (
                    <div className="position-relative w-100 h-100">
                      <iframe className="w-100 h-100 border-0" src={video.ext} title="Video" allowFullScreen />
                      {!videoWatched && (
                        <button className="btn btn-primary btn-sm position-absolute bottom-0 end-0 m-3 shadow-lg rounded-pill px-3 py-2 fw-bold"
                          onClick={() => {
                            setFinishedVideos(p => new Set([...p, activeSection]));
                            markSectionDone(activeLesson.lessonId, `video_${activeSection}`);
                          }}>
                          Đã xem xong video <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quiz card - separate from content */}
        {showQuiz && (!video.show || videoWatched) && (
          <div className="bg-white rounded-4 border shadow-sm overflow-hidden mb-4">
            <div className="p-4 p-md-5">
              <QuizSection courseId={courseId} lessonId={activeLesson.lessonId} section={activeSection}
                onComplete={(passed) => { if (passed) markSectionDone(activeLesson.lessonId, `quiz_${activeSection}`); }} />
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div className="d-flex justify-content-between align-items-center pt-4 pb-5">
          <button className="btn btn-white border px-4 py-2 rounded-3 fw-bold d-flex align-items-center gap-2 shadow-sm" onClick={goPrev}>
            <ChevronLeft size={20} /> Trước
          </button>
          <button className="btn btn-primary px-5 py-2 rounded-3 fw-bold shadow-lg d-flex align-items-center gap-2" onClick={goNext}>
            Tiếp theo <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-white">
      <Loader2 className="animate-spin text-primary mb-3" size={48} />
      <h5 className="fw-bold text-secondary">Đang chuẩn bị nội dung học tập...</h5>
    </div>
  );

  if (!data) return (
    <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-white">
      <h5 className="fw-bold text-danger">Không tìm thấy dữ liệu khóa học.</h5>
      <button className="btn btn-primary mt-3" onClick={() => navigate('/dashboard')}>Quay lại Dashboard</button>
    </div>
  );

  return (
    <div className="min-vh-100 bg-light d-flex flex-column overflow-hidden">
      {/* Header */}
      <header className="bg-dark text-white px-4 py-2 d-flex align-items-center justify-content-between sticky-top shadow-sm" style={{ height: '60px', zIndex: 1000 }}>
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-link text-white p-0" onClick={() => navigate('/dashboard')}><ArrowLeft size={20} /></button>
          <div className="vr opacity-25 my-2" />
          <h6 className="mb-0 fw-bold text-truncate d-none d-md-block" style={{ maxWidth: '400px' }}>{data.courseTitle}</h6>
        </div>
        <div className="d-flex align-items-center gap-4">
          <div className="d-flex align-items-center gap-3">
            <div className="text-end d-none d-sm-block">
              <div className="fw-bold text-success small">{Math.round(data.progressPercentage)}%</div>
            </div>
            <div className="progress" style={{ width: '100px', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <div className="progress-bar bg-success" style={{ width: `${data.progressPercentage}%`, transition: 'width 0.4s' }} />
            </div>
          </div>
          <button className="btn btn-outline-light btn-sm rounded-circle p-2 border-0" onClick={() => setSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <div className="flex-grow-1 d-flex overflow-hidden">
        {/* Main content */}
        <main className="flex-grow-1 overflow-auto bg-light p-3 p-md-5">
          {showIntro ? renderIntro() : renderSectionContent()}
        </main>

        {/* Sidebar */}
        <aside className={`bg-white border-start shadow-sm flex-shrink-0 ${isSidebarOpen ? 'd-flex flex-column' : 'd-none'}`} style={{ width: '340px', zIndex: 10 }}>
          <div className="p-3 border-bottom bg-white sticky-top">
            <h6 className="fw-bold mb-0 text-uppercase small text-secondary" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Nội dung khóa học</h6>
          </div>
          <div className="overflow-auto flex-grow-1">
            {/* Intro item */}
            <div
              className={`p-3 border-bottom d-flex align-items-center gap-3 ${showIntro ? 'bg-primary bg-opacity-10 border-start border-primary border-4' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => { setShowIntro(true); }}
            >
              <Info size={18} className={showIntro ? 'text-primary' : 'text-muted'} />
              <span className={`small fw-bold ${showIntro ? 'text-primary' : 'text-dark'}`}>Giới thiệu khóa học</span>
            </div>

            {/* Lessons */}
            {data.lessons.map((lesson, idx) => {
              const sections = getSections(lesson);
              const isExpanded = expandedLessonId === lesson.lessonId;
              const isActiveLesson = activeLesson?.lessonId === lesson.lessonId && !showIntro;
              const completedSections = sections.filter(s => sectionProgress[`${lesson.lessonId}_${s.num}`]).length;

              return (
                <div key={lesson.lessonId}>
                  {/* Lesson header */}
                  <div
                    className={`p-3 border-bottom d-flex align-items-center gap-2 ${isActiveLesson && !isExpanded ? 'bg-primary bg-opacity-5' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSelectLesson(lesson)}
                  >
                    <div className="flex-shrink-0">
                      {lesson.isCompleted
                        ? <CheckCircle2 size={20} className="text-success" />
                        : <Circle size={20} className="text-muted opacity-30" />}
                    </div>
                    <div className="flex-grow-1 min-width-0">
                      <div className={`small fw-bold ${isActiveLesson ? 'text-primary' : 'text-dark'}`} style={{ lineHeight: 1.3 }}>
                        {idx + 1}. {lesson.title}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                        {lesson.isCompleted ? 'Đã hoàn thành' : sections.length > 0 ? `${completedSections}/${sections.length} mục` : 'Chưa học'}
                      </div>
                    </div>
                    <ChevronDown size={16} className={`text-muted transition-all ${isExpanded ? '' : 'rotate-minus-90'}`} />
                  </div>

                  {/* Sections dropdown */}
                  {isExpanded && (
                    <div className="bg-light bg-opacity-50">
                      {sections.map(sec => {
                        const isActiveSec = isActiveLesson && activeSection === sec.num;
                        const isDone = sectionProgress[`${lesson.lessonId}_${sec.num}`];
                        const videoSeen = sectionProgress[`${lesson.lessonId}_video_${sec.num}`];

                        return (
                          <div key={sec.num}>
                            {/* Section content item */}
                            <div
                              className={`ps-5 pe-3 py-2 border-bottom d-flex align-items-center gap-2 ${isActiveSec ? 'bg-primary bg-opacity-10 border-start border-primary border-3' : ''}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleSelectSection(lesson, sec.num)}
                            >
                              <div className="flex-shrink-0">
                                {isDone
                                  ? <CheckCircle2 size={16} className="text-success" />
                                  : <Circle size={16} className="text-muted opacity-30" />}
                              </div>
                              <div className="flex-grow-1">
                                <span className={`small ${isActiveSec ? 'fw-bold text-primary' : 'text-dark'}`}>{sec.title}</span>
                              </div>
                              {sectionIcons[sec.num - 1]}
                            </div>

                            {/* Video sub-item */}
                            {sec.hasVideo && (
                              <div
                                className="ps-5 pe-3 py-2 border-bottom d-flex align-items-center gap-2"
                                style={{ paddingLeft: '3.5rem', cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.01)' }}
                                onClick={() => handleSelectSection(lesson, sec.num)}
                              >
                                <div className="flex-shrink-0">
                                  {videoSeen
                                    ? <CheckCircle2 size={14} className="text-success" />
                                    : <PlayCircle size={14} className="text-muted opacity-40" />}
                                </div>
                                <span className="small text-muted">Video bài giảng</span>
                                {videoSeen && <span className="badge bg-success-subtle text-success rounded-pill" style={{ fontSize: '0.6rem' }}>Đã xem</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      <style>{`
        .btn-white { background: white; }
        .hover-bg-light:hover { background-color: #f8f9fa; }
        .hover-bg-white:hover { background-color: white; }
        .transition-all { transition: all 0.2s ease; }
        .lesson-content img { max-width: 100%; height: auto; border-radius: 12px; margin: 20px 0; }
        .lesson-content p { line-height: 1.8; }
        .quiz-question:hover { border-color: #0d6efd !important; }
        .rotate-minus-90 { transform: rotate(-90deg); }
        .min-width-0 { min-width: 0; }
        .cursor-pointer { cursor: pointer; }
        .scale-in { animation: scaleIn 0.3s ease-out; }
        @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default LearningView;
