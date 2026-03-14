import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useNotify } from '../../context/NotifyContext';
import {
  CheckCircle2, Circle, PlayCircle, FileText,
  ArrowLeft, Loader2, ChevronRight, ChevronLeft,
  Menu, X, Award, Video, Info, BookOpen, RefreshCw, HelpCircle, Bookmark, Minus, Plus, ClipboardCheck, Calendar, MessageSquare, StickyNote, Hash, FileStack
} from 'lucide-react';
import VideoPlayer from '../../components/common/VideoPlayer';

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

const QuizSection = ({ courseId, lessonId, section, onComplete, onToast }) => {
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
      onToast?.('Vui lòng trả lời tất cả các câu hỏi!', 'warning');
      return;
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
    } catch { onToast?.('Lỗi khi nộp bài.', 'error'); }
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
  const { toast } = useNotify();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeSection, setActiveSection] = useState(1);
  const [expandedLessonId, setExpandedLessonId] = useState(null);
  const [expandedIntro, setExpandedIntro] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [bookmarked, setBookmarked] = useState(new Set());
  const [finishedVideos, setFinishedVideos] = useState(new Set());
  const [sectionProgress, setSectionProgress] = useState({});
  const [initialised, setInitialised] = useState(false);
  const [headerTab, setHeaderTab] = useState('content');
  const introFromUrlRef = useRef(false);

  const headerTabs = [
    { id: 'content', label: 'Nội dung', icon: BookOpen },
    { id: 'progress', label: 'Tiến độ', icon: Award },
    { id: 'dates', label: 'Ngày quan trọng', icon: Calendar },
    { id: 'discussion', label: 'Thảo luận', icon: MessageSquare },
    { id: 'notes', label: 'Ghi chú', icon: StickyNote }
  ];

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
    if (lesson.sections && Array.isArray(lesson.sections) && lesson.sections.length > 0) {
      return lesson.sections.map((s, i) => ({
        num: i + 1,
        title: s.title ?? s.Title,
        hasVideo: s.showVideo ?? s.ShowVideo,
        hasQuiz: s.showQuiz ?? s.ShowQuiz
      }));
    }
    const contents = [lesson.overview, lesson.content, lesson.reviewContent, lesson.essayQuestion, null];
    const videos = [lesson.showVideo1, lesson.showVideo2, lesson.showVideo3, lesson.showVideo4, lesson.showVideo5];
    const quizzes = [lesson.showQuiz1, lesson.showQuiz2, lesson.showQuiz3, lesson.showQuiz4, lesson.showQuiz5];
    const titles = [lesson.section1Title, lesson.section2Title, lesson.section3Title, lesson.section4Title, lesson.section5Title];
    const out = [];
    const hasAny = contents.some((c, i) => c || videos[i] || quizzes[i]);
    for (let i = 0; i < 5; i++) {
      if (i === 0 && hasAny) {
        out.push({ num: 1, title: titles[0], hasVideo: videos[0], hasQuiz: quizzes[0] });
      } else if (i > 0 && (contents[i] || videos[i] || quizzes[i])) {
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
    introFromUrlRef.current = false;
    fetchProgress().then(d => {
      if (!d) return;
      const introP = searchParams.get('intro');
      const lessonP = searchParams.get('lesson');
      const sectionP = searchParams.get('section');

      if (introP === '1') {
        introFromUrlRef.current = true;
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

  const getContent = (lesson, num) => {
    if (lesson.sections && lesson.sections[num - 1]) return lesson.sections[num - 1].content;
    return [lesson.overview, lesson.content, lesson.reviewContent, lesson.essayQuestion, null][num - 1];
  };
  const getVideo = (lesson, num) => {
    if (lesson.sections && lesson.sections[num - 1]) {
      const s = lesson.sections[num - 1];
      return { url: s.videoUrl, ext: null, show: s.showVideo };
    }
    const map = {
      1: { url: lesson.videoUrl1, ext: lesson.externalVideoUrl1, show: lesson.showVideo1 },
      2: { url: lesson.videoUrl2, ext: lesson.externalVideoUrl2, show: lesson.showVideo2 },
      3: { url: lesson.videoUrl3, ext: lesson.externalVideoUrl3, show: lesson.showVideo3 },
      4: { url: lesson.videoUrl4, ext: lesson.externalVideoUrl4, show: lesson.showVideo4 },
      5: { url: lesson.videoUrl5, ext: lesson.externalVideoUrl5, show: lesson.showVideo5 },
    };
    return map[num] || { url: null, ext: null, show: false };
  };
  const getQuiz = (lesson, num) => {
    if (lesson.sections && lesson.sections[num - 1]) return lesson.sections[num - 1].showQuiz;
    return [lesson.showQuiz1, lesson.showQuiz2, lesson.showQuiz3, lesson.showQuiz4, lesson.showQuiz5][num - 1];
  };

  const handleSelectLesson = (lesson) => {
    if (expandedLessonId === lesson.lessonId) {
      setExpandedLessonId(null);
      return;
    }
    setExpandedLessonId(lesson.lessonId);
  };

  const toggleBookmark = () => {
    const key = showIntro ? 'intro' : (activeLesson ? `${activeLesson.lessonId}_${activeSection}` : null);
    if (!key) return;
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isBookmarked = () => {
    const key = showIntro ? 'intro' : (activeLesson ? `${activeLesson.lessonId}_${activeSection}` : null);
    return key ? bookmarked.has(key) : false;
  };

  const handleSelectSection = (lesson, sectionNum) => {
    introFromUrlRef.current = false;
    setActiveLesson(lesson);
    setActiveSection(sectionNum);
    setShowIntro(false);
    setFinishedVideos(new Set());
    const savedVids = localStorage.getItem(`sp_${courseId}`);
    if (savedVids) {
      try {
        const sp = JSON.parse(savedVids);
        const vids = new Set();
        const secs = getSections(lesson);
        secs.forEach(s => {
          if (sp[`${lesson.lessonId}_video_${s.num}`]) vids.add(s.num);
        });
        setFinishedVideos(vids);
      } catch { /* ignore */ }
    }
    const secs = getSections(lesson);
    const sec = secs.find(s => s.num === sectionNum);
    if (sec && !sec.hasVideo && !sec.hasQuiz) {
      markSectionDone(lesson.lessonId, sectionNum);
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

  const introVideoWatched = sectionProgress['0_video_intro'];
  const introContentViewed = sectionProgress['intro_content'];

  useEffect(() => {
    if (showIntro) {
      setSectionProgress(prev => {
        if (prev['intro_content']) return prev;
        const next = { ...prev, 'intro_content': true };
        saveSP(next);
        return next;
      });
    }
  }, [showIntro, saveSP]);

  const renderIntro = () => (
    <div className="mx-auto bg-white rounded-3 border shadow-sm overflow-hidden" style={{ maxWidth: '900px', borderColor: '#e9ecef' }}>
      <div className="d-flex align-items-start justify-content-between gap-4 p-4 pb-3 border-bottom" style={{ borderColor: '#e9ecef' }}>
        <div className="flex-grow-1">
          <h2 className="fw-bold mb-2" style={{ color: '#1a1a2e', fontSize: '1.5rem' }}>Giới thiệu học phần</h2>
          <button type="button" className="btn btn-link p-0 text-body-secondary d-inline-flex align-items-center gap-2 small" onClick={toggleBookmark}>
            <Bookmark size={16} fill={isBookmarked() ? 'currentColor' : 'none'} />
            Đánh dấu trang này
          </button>
        </div>
      </div>

      <div className="p-4 p-md-5">
        {data.description ? (
          <div className="lesson-content mb-4" style={{ color: '#4a5568', lineHeight: 1.7, fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: data.description }} />
        ) : (
          <p className="text-secondary mb-4" style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>
            Chào mừng bạn đến với khóa học! Hãy xem tổng quan nội dung bên dưới.
          </p>
        )}

        {data.showIntroVideo && (data.introVideoUrl || data.introExternalVideoUrl) && (
          <div className="mb-4">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#1a1a2e', fontSize: '1rem' }}>
              <Video size={18} className="text-primary" />
              Video giới thiệu khóa học
              {introVideoWatched && <span className="badge bg-success rounded-pill ms-2 small">Đã xem ✓</span>}
            </h6>
            <div className="ratio ratio-16x9 rounded-3 overflow-hidden bg-dark">
              {data.introVideoUrl ? (
                <VideoPlayer
                  key={data.introVideoUrl}
                  src={data.introVideoUrl}
                  onEnded={() => {
                    setSectionProgress(prev => {
                      if (prev['0_video_intro']) return prev;
                      const next = { ...prev, '0_video_intro': true };
                      saveSP(next);
                      return next;
                    });
                  }}
                />
              ) : (
                <div className="position-relative w-100 h-100">
                  <iframe className="w-100 h-100 border-0" src={data.introExternalVideoUrl} title="Intro" allowFullScreen />
                  {!introVideoWatched && (
                    <button className="btn btn-primary btn-sm position-absolute bottom-0 end-0 m-3 shadow rounded-pill px-3 py-2 fw-bold"
                      onClick={() => {
                        setSectionProgress(prev => {
                          if (prev['0_video_intro']) return prev;
                          const next = { ...prev, '0_video_intro': true };
                          saveSP(next);
                          return next;
                        });
                      }}>
                      Đã xem xong video <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mb-4">
          <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#1a1a2e', fontSize: '1rem' }}>
            <BookOpen size={18} className="text-primary" />
            Tổng quan khóa học
          </h6>
          {(() => {
            const totalSections = data.lessons.reduce((acc, l) => acc + getSections(l).length, 0) + (data.description ? 1 : 0) + (data.showIntroVideo && (data.introVideoUrl || data.introExternalVideoUrl) ? 1 : 0);
            const completedLessons = data.lessons.filter(l => l.isCompleted).length;
            return (
              <>
                <div className="row g-3 mb-4">
                  <div className="col-4">
                    <div className="text-center p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e9ecef' }}>
                      <div className="fw-bold fs-5 text-primary">{data.lessons.length}</div>
                      <div className="text-muted small">Bài học</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e9ecef' }}>
                      <div className="fw-bold fs-5 text-success">{completedLessons}</div>
                      <div className="text-muted small">Bài đã hoàn thành</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e9ecef' }}>
                      <div className="fw-bold fs-5" style={{ color: '#6366f1' }}>{totalSections}</div>
                      <div className="text-muted small">Phần nội dung</div>
                    </div>
                  </div>
                </div>
                <div className="d-flex flex-column gap-2">
                  {data.lessons.map((l, i) => {
                    const secs = getSections(l);
                    return (
                      <div key={l.lessonId} className="rounded-3 border overflow-hidden" style={{ backgroundColor: '#f8fafc', borderColor: '#e9ecef' }}>
                        <div className="d-flex align-items-center gap-3 p-2 px-3">
                          {l.isCompleted ? <CheckCircle2 size={18} className="text-success flex-shrink-0" /> : <Circle size={18} className="flex-shrink-0" style={{ color: '#adb5bd' }} />}
                          <span className="small fw-semibold">{i + 1}. {l.title}</span>
                        </div>
                        {secs.length > 0 && (
                          <div className="ps-4 pb-2 pt-0">
                            {secs.map((sec) => {
                              const isDone = sectionProgress[`${l.lessonId}_${sec.num}`] || sectionProgress[`${l.lessonId}_video_${sec.num}`] || sectionProgress[`${l.lessonId}_quiz_${sec.num}`];
                              return (
                                <div key={sec.num} className="d-flex align-items-center justify-content-between gap-2 py-1">
                                  <div className="d-flex align-items-center gap-2">
                                    {isDone ? <CheckCircle2 size={14} className="text-success flex-shrink-0" /> : <Circle size={14} className="flex-shrink-0" style={{ color: '#adb5bd' }} />}
                                    <span className="small" style={{ color: '#64748b', fontSize: '0.85rem' }}>{sec.title || `Phần ${sec.num}`}</span>
                                  </div>
                                  <div className="d-flex gap-1">
                                    {sec.hasVideo && <span className="badge rounded-pill small" style={{ backgroundColor: 'rgba(13,110,253,0.12)', color: '#0d6efd', fontSize: '0.7rem' }}><Video size={10} className="me-1" />Video</span>}
                                    {sec.hasQuiz && <span className="badge rounded-pill small" style={{ backgroundColor: 'rgba(25,135,84,0.12)', color: '#198754', fontSize: '0.7rem' }}><ClipboardCheck size={10} className="me-1" />Quiz</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>

        <div className="text-center pt-3">
          <button className="btn btn-primary px-5 py-2 rounded-3 fw-semibold d-inline-flex align-items-center gap-2"
            onClick={() => {
              introFromUrlRef.current = false;
              setShowIntro(false);
              const first = data.lessons.find(l => !l.isCompleted) || data.lessons[0];
              if (first) {
                setActiveLesson(first);
                setExpandedLessonId(first.lessonId);
                const secs = getSections(first);
                setActiveSection(secs.length > 0 ? secs[0].num : 1);
              }
            }}>
            Bắt đầu học <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    if (!activeLesson) return (
      <div className="h-100 d-flex align-items-center justify-content-center text-muted">
        Chọn bài học từ mục lục bên trái
      </div>
    );

    const content = getContent(activeLesson, activeSection);
    const video = getVideo(activeLesson, activeSection);
    const showQuiz = getQuiz(activeLesson, activeSection);
    const sectionTitle = activeLesson.sections?.[activeSection - 1]?.title ?? [activeLesson.section1Title, activeLesson.section2Title, activeLesson.section3Title, activeLesson.section4Title, activeLesson.section5Title][activeSection - 1] ?? 'Giới thiệu bài học';
    const lessonIdx = data.lessons.findIndex(l => l.lessonId === activeLesson.lessonId);
    const videoWatched = finishedVideos.has(activeSection);

    return (
      <div className="mx-auto bg-white rounded-3 border shadow-sm overflow-hidden" style={{ maxWidth: '900px', borderColor: '#e9ecef' }}>
        {/* Header + Nav arrows + Bookmark */}
        <div className="d-flex align-items-start justify-content-between gap-4 p-4 pb-3 border-bottom" style={{ borderColor: '#e9ecef' }}>
          <div className="flex-grow-1">
            <h2 className="fw-bold mb-2" style={{ color: '#1a1a2e', fontSize: '1.5rem' }}>{sectionTitle}</h2>
            <button type="button" className="btn btn-link p-0 text-body-secondary d-inline-flex align-items-center gap-2 small" onClick={toggleBookmark}>
              <Bookmark size={16} fill={isBookmarked() ? 'currentColor' : 'none'} />
              Đánh dấu trang này
            </button>
          </div>
          <div className="d-flex align-items-center gap-1 flex-shrink-0">
            <button type="button" className="btn btn-outline-secondary btn-sm rounded-circle p-2" onClick={goPrev} title="Bài trước">
              <ChevronLeft size={20} />
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm rounded-circle p-2" onClick={goNext} title="Bài tiếp">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 p-md-5">
          {/* Mục tiêu bài học - overview (phần giới thiệu) khi có */}
          {activeLesson.overview && activeSection === 1 && (
            <div className="mb-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#1a1a2e', fontSize: '1rem' }}>
                <FileText size={18} className="text-primary" />
                Mục tiêu bài học
              </h6>
              <div className="lesson-content" style={{ color: '#4a5568', lineHeight: 1.7, fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: activeLesson.overview }} />
            </div>
          )}

          {/* Nội dung bài học */}
          {content ? (
            <div className="mb-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#1a1a2e', fontSize: '1rem' }}>
                <BookOpen size={18} className="text-primary" />
                Nội dung bài học
              </h6>
              <div className="lesson-content" style={{ color: '#4a5568', lineHeight: 1.7, fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          ) : !video.show && (
            <p className="text-secondary mb-4" style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>
              Để học tốt bài học này, người học cần xem video bài giảng, đọc tài liệu kèm theo, thực hành và tham gia thảo luận.
            </p>
          )}

          {/* Video */}
          {video.show && (video.url || video.ext) && (
            <div className="mb-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#1a1a2e', fontSize: '1rem' }}>
                <Video size={18} className="text-primary" />
                Video giới thiệu bài học
                {video.url && <span className="text-muted small fw-normal">[Video]</span>}
              </h6>
              <div className="ratio ratio-16x9 rounded-3 overflow-hidden bg-dark">
                {video.url ? (
                  <VideoPlayer
                    key={video.url}
                    src={video.url}
                    onEnded={() => {
                      setFinishedVideos(p => new Set([...p, activeSection]));
                      markSectionDone(activeLesson.lessonId, `video_${activeSection}`);
                    }}
                  />
                ) : (
                  <div className="position-relative w-100 h-100">
                    <iframe className="w-100 h-100 border-0" src={video.ext} title="Video" allowFullScreen />
                    {!videoWatched && (
                      <button className="btn btn-primary btn-sm position-absolute bottom-0 end-0 m-3 shadow rounded-pill px-3 py-2 fw-bold"
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
              {videoWatched && <span className="badge bg-success rounded-pill mt-2 small">Đã xem ✓</span>}
            </div>
          )}

          {/* Quiz */}
          {showQuiz && (!video.show || videoWatched) && (
            <div className="mb-4">
              <QuizSection courseId={courseId} lessonId={activeLesson.lessonId} section={activeSection}
                onComplete={(passed) => { if (passed) markSectionDone(activeLesson.lessonId, `quiz_${activeSection}`); }} onToast={toast} />
            </div>
          )}
        </div>

        {/* Nav buttons dưới */}
        <div className="d-flex justify-content-between align-items-center p-4 border-top" style={{ borderColor: '#e9ecef' }}>
          <button className="btn btn-outline-secondary px-4 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2" onClick={goPrev}>
            <ChevronLeft size={20} /> Trước
          </button>
          <button className="btn btn-primary px-5 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2" onClick={goNext}>
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
    <div className="min-vh-100 d-flex flex-column overflow-hidden" style={{ backgroundColor: '#f8fafc' }}>
      {/* Header - Nút quay lại, Mã khóa, Tên khóa (theo hình tham chiếu) */}
      <header 
        className="bg-white sticky-top" 
        style={{ zIndex: 1000, borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div className="px-4 px-md-5 py-3">
          <div className="d-flex flex-wrap align-items-flex-start justify-content-between gap-3">
            <div className="d-flex align-items-flex-start gap-3 min-width-0 flex-grow-1">
              <button 
                className="btn btn-link p-2 d-inline-flex align-items-center justify-content-center rounded-circle text-decoration-none flex-shrink-0 mt-1" 
                style={{ color: '#64748b', marginLeft: '-0.5rem' }}
                onClick={() => navigate(`/course/${courseId}`)}
                title="Quay lại khóa học"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="min-width-0 flex-grow-1" style={{ minWidth: 0 }}>
                <div className="mb-1" style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>{data.courseCode || '—'}</div>
                <h1 className="fw-bold mb-0" style={{ color: '#0f172a', fontSize: '1.25rem', lineHeight: 1.35, letterSpacing: '-0.02em', wordBreak: 'break-word' }}>{data.courseTitle}</h1>
                {activeLesson && !showIntro && (
                  <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                    <span className="text-muted small">Bài {data.lessons.findIndex(l => l.lessonId === activeLesson.lessonId) + 1}:</span>
                    <span className="fw-semibold small" style={{ color: '#475569', wordBreak: 'break-word' }}>{activeLesson.title}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <button 
                className="btn btn-light rounded-circle p-2 border" 
                style={{ borderColor: '#e2e8f0' }}
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                title={isSidebarOpen ? 'Thu gọn mục lục' : 'Mở mục lục'}
              >
                {isSidebarOpen ? <X size={20} style={{ color: '#475569' }} /> : <Menu size={20} style={{ color: '#475569' }} />}
              </button>
            </div>
          </div>
        </div>
        <nav className="nav border-0 px-4 px-md-5 gap-1 pb-2" style={{ borderTop: '1px solid #f1f5f9' }}>
          {headerTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`nav-link fw-semibold rounded-3 px-3 py-2 border-0 d-inline-flex align-items-center gap-2 ${headerTab === tab.id ? 'bg-primary text-white shadow-sm' : 'text-body-secondary'}`}
                style={{ fontSize: '0.9rem' }}
                onClick={() => setHeaderTab(tab.id)}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="flex-grow-1 d-flex overflow-hidden">
        {/* Sidebar trái - Mục lục */}
        <aside className={`bg-white border-end flex-shrink-0 d-flex flex-column overflow-hidden ${!isSidebarOpen ? 'toc-collapsed' : ''}`} style={{ width: isSidebarOpen ? '320px' : 0, minWidth: isSidebarOpen ? '320px' : 0, borderColor: '#dee2e6', zIndex: 10, transition: 'width 0.25s ease, min-width 0.25s ease' }}>
          <div className="p-3 border-bottom flex-shrink-0 d-flex align-items-center gap-2" style={{ borderColor: '#dee2e6' }}>
            <FileStack size={20} style={{ color: '#0f172a' }} />
            <h6 className="fw-bold mb-0" style={{ color: '#0f172a', fontSize: '1rem', fontWeight: 600 }}>Nội dung chương trình học</h6>
          </div>
          <div className="overflow-auto flex-grow-1 py-2">
            {/* Giới thiệu khóa học - accordion */}
            <div className="border-bottom" style={{ borderColor: '#dee2e6' }}>
              <div
                className="d-flex align-items-center justify-content-between py-3 px-4 cursor-pointer toc-header"
                style={{ backgroundColor: showIntro ? '#f8fafc' : '#fff' }}
                onClick={() => { setExpandedIntro(!expandedIntro); setShowIntro(true); setExpandedLessonId(null); }}
              >
                <div className="d-flex align-items-center gap-3">
                  {(introContentViewed || introVideoWatched) ? <CheckCircle2 size={20} className="text-success flex-shrink-0" /> : <Circle size={20} className="flex-shrink-0" style={{ color: '#adb5bd' }} />}
                  <span className="fw-semibold" style={{ color: showIntro ? '#6366f1' : '#0f172a', fontSize: '1rem' }}>Giới thiệu khóa học</span>
                </div>
                {expandedIntro ? <Minus size={20} className="text-secondary flex-shrink-0" /> : <Plus size={20} className="text-secondary flex-shrink-0" />}
              </div>
              {expandedIntro && (
                <div className="px-4 pb-3 pt-0" style={{ backgroundColor: '#fff', borderTop: '1px solid #e2e8f0' }}>
                  <div 
                    className="d-flex align-items-center gap-3 py-2 border-bottom cursor-pointer"
                    style={{ borderColor: 'rgba(0,0,0,0.06)' }}
                    onClick={() => setShowIntro(true)}
                  >
                    {introContentViewed ? <CheckCircle2 size={18} className="text-success flex-shrink-0" /> : <Circle size={18} className="flex-shrink-0" style={{ color: '#adb5bd' }} />}
                    <span style={{ color: '#1e293b', fontSize: '0.9rem', fontWeight: 500 }}>Giới thiệu học phần</span>
                  </div>
                  {data.showIntroVideo && (data.introVideoUrl || data.introExternalVideoUrl) && (
                    <div 
                      className="d-flex align-items-center gap-3 py-2 cursor-pointer"
                      onClick={() => setShowIntro(true)}
                    >
                      {introVideoWatched ? <CheckCircle2 size={18} className="text-success flex-shrink-0" /> : <Circle size={18} className="flex-shrink-0" style={{ color: '#adb5bd' }} />}
                      <span style={{ color: '#1e293b', fontSize: '0.9rem', fontWeight: 500 }}>Video giới thiệu</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Các bài học - accordion, đồng bộ với bài học đã tạo, tiền tố Bài X: */}
            {(data.lessons || []).map((lesson, idx) => {
              const sections = getSections(lesson);
              const isExpanded = expandedLessonId === lesson.lessonId;
              const isActiveLesson = activeLesson?.lessonId === lesson.lessonId && !showIntro;
              const lessonNum = idx + 1;
              const lessonTitle = (lesson.title || '').replace(/^Bài\s*\d+\s*:\s*/i, '').trim() || lesson.title || '';

              return (
                <div key={lesson.lessonId} className="border-bottom" style={{ borderColor: '#dee2e6' }}>
                  <div
                    className="d-flex align-items-center justify-content-between py-3 px-4 cursor-pointer toc-header"
                    style={{ backgroundColor: isActiveLesson || isExpanded ? '#f8fafc' : '#fff' }}
                    onClick={() => {
                      if (expandedLessonId === lesson.lessonId) {
                        setExpandedLessonId(null);
                      } else {
                        setExpandedLessonId(lesson.lessonId);
                        handleSelectSection(lesson, sections[0]?.num || 1);
                      }
                      setShowIntro(false);
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      {lesson.isCompleted ? <CheckCircle2 size={20} className="text-success flex-shrink-0" /> : <Circle size={20} className="flex-shrink-0" style={{ color: '#adb5bd' }} />}
                      <span className="fw-semibold" style={{ color: isActiveLesson ? '#6366f1' : '#0f172a', fontSize: '1rem' }}>Bài {lessonNum}: {lessonTitle}</span>
                    </div>
                    {isExpanded ? <Minus size={20} className="text-secondary flex-shrink-0" /> : <Plus size={20} className="text-secondary flex-shrink-0" />}
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-3 pt-0" style={{ backgroundColor: '#fff', borderTop: '1px solid #e2e8f0' }}>
                      {sections.map(sec => {
                        const isActiveSec = isActiveLesson && activeSection === sec.num;
                        const isDone = sectionProgress[`${lesson.lessonId}_${sec.num}`] || sectionProgress[`${lesson.lessonId}_video_${sec.num}`] || sectionProgress[`${lesson.lessonId}_quiz_${sec.num}`];

                        return (
                          <div
                            key={sec.num}
                            className={`d-flex align-items-center justify-content-between gap-2 py-2 border-bottom cursor-pointer ${isActiveSec ? 'toc-active' : ''}`}
                            style={{ borderColor: 'rgba(0,0,0,0.06)' }}
                            onClick={(e) => { e.stopPropagation(); handleSelectSection(lesson, sec.num); setShowIntro(false); }}
                          >
                            <div className="d-flex align-items-center gap-3 flex-grow-1 min-width-0">
                              {isDone ? <CheckCircle2 size={18} className="text-success flex-shrink-0" /> : <Circle size={18} className="flex-shrink-0" style={{ color: '#adb5bd' }} />}
                              <span className={`small text-truncate ${isActiveSec ? 'fw-semibold' : ''}`} style={{ color: isActiveSec ? '#6366f1' : '#1e293b', fontSize: '0.9rem' }}>{(sec.title || '').replace(/^\d+\.\s*/, '').trim() || sec.title || `Phần ${sec.num}`}</span>
                            </div>
                            <div className="d-flex gap-1 flex-shrink-0">
                              {sec.hasVideo && <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(13,110,253,0.12)', color: '#0d6efd', fontSize: '0.65rem' }}><Video size={10} /></span>}
                              {sec.hasQuiz && <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(25,135,84,0.12)', color: '#198754', fontSize: '0.65rem' }}><ClipboardCheck size={10} /></span>}
                            </div>
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

        {/* Nội dung chính bên phải */}
        <main className="flex-grow-1 overflow-auto p-4 p-md-5" style={{ backgroundColor: '#fafafa' }}>
          {headerTab === 'content' && (showIntro ? renderIntro() : renderSectionContent())}
          {headerTab === 'progress' && (
            <div className="mx-auto bg-white rounded-3 border shadow-sm p-5" style={{ maxWidth: '900px', borderColor: '#e9ecef' }}>
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#1a1a2e' }}><Award size={22} className="text-primary" /> Tiến độ học tập</h5>
              <div className="progress mb-3" style={{ height: '14px' }}>
                <div className="progress-bar" style={{ width: `${data.progressPercentage}%`, backgroundColor: data.progressPercentage >= 100 ? '#10b981' : '#6366f1' }} />
              </div>
              <p className="mb-4 fw-semibold" style={{ color: '#334155' }}>{Math.round(data.progressPercentage)}% đã hoàn thành</p>
              <div className="d-flex flex-column gap-2">
                {(data.lessons || []).map((l, i) => (
                  <div key={l.lessonId} className="d-flex align-items-center gap-3 p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e9ecef' }}>
                    {l.isCompleted ? <CheckCircle2 size={20} className="text-success" /> : <Circle size={20} style={{ color: '#adb5bd' }} />}
                    <span className="fw-medium">Bài {i + 1}: {l.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {headerTab === 'dates' && (
            <div className="mx-auto bg-white rounded-3 border shadow-sm p-5" style={{ maxWidth: '900px', borderColor: '#e9ecef' }}>
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#1a1a2e' }}><Calendar size={22} className="text-primary" /> Ngày quan trọng</h5>
              <div className="d-flex flex-column gap-3">
                <div className="p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e9ecef' }}>
                  <span className="text-muted small">Ngày khai giảng</span>
                  <div className="fw-bold" style={{ color: '#0f172a' }}>{data.startDate ? new Date(data.startDate).toLocaleDateString('vi-VN') : '—'}</div>
                </div>
              </div>
            </div>
          )}
          {headerTab === 'discussion' && (
            <div className="mx-auto bg-white rounded-3 border shadow-sm p-5" style={{ maxWidth: '900px', borderColor: '#e9ecef' }}>
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#1a1a2e' }}><MessageSquare size={22} className="text-primary" /> Thảo luận</h5>
              <p className="text-secondary mb-0">Chức năng thảo luận đang được phát triển.</p>
            </div>
          )}
          {headerTab === 'notes' && (
            <div className="mx-auto bg-white rounded-3 border shadow-sm p-5" style={{ maxWidth: '900px', borderColor: '#e9ecef' }}>
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#1a1a2e' }}><StickyNote size={22} className="text-primary" /> Ghi chú</h5>
              <p className="text-secondary mb-0">Chức năng ghi chú đang được phát triển.</p>
            </div>
          )}
        </main>
      </div>

      <style>{`
        .btn-white { background: white; }
        .btn-link.rounded-circle:hover { background-color: rgba(0,0,0,0.05); color: #6366f1 !important; }
        .hover-bg-light:hover { background-color: #f8f9fa; }
        .hover-bg-white:hover { background-color: white; }
        .transition-all { transition: all 0.2s ease; }
        .lesson-content img { max-width: 100%; height: auto; border-radius: 12px; margin: 20px 0; }
        .lesson-content ul, .lesson-content ol { padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .lesson-content p { line-height: 1.8; margin-bottom: 0.75rem; }
        .quiz-question:hover { border-color: #0d6efd !important; }
        .rotate-minus-90 { transform: rotate(-90deg); }
        .min-width-0 { min-width: 0; }
        .cursor-pointer { cursor: pointer; }
        .scale-in { animation: scaleIn 0.3s ease-out; }
        @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .toc-header:hover { background-color: #f8fafc !important; }
        .toc-item:hover { background-color: #f8fafc !important; }
        .toc-active { background-color: rgba(99,102,241,0.08) !important; }
        .toc-collapsed { overflow: hidden; }
      `}</style>
    </div>
  );
};

export default LearningView;
