import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
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

const QuizSection = ({ courseId, lessonId, section, onComplete, onQuizSubmitted, onToast }) => {
  const { t } = useLanguage();
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
      const selectedAnswersList = Object.entries(selectedAnswers).map(([questionId, answerId]) => ({
        questionId: parseInt(questionId, 10),
        answerId
      }));
      const res = await api.post('/quiz/submit', {
        quizId: quiz.id,
        selectedAnswers: selectedAnswersList
      });
      const { score, isPassed, correctAnswers, totalQuestions } = res.data;
      setResult({
        score,
        isPassed,
        correctCount: correctAnswers,
        total: totalQuestions
      });
      if (onComplete) onComplete(isPassed);
      if (onQuizSubmitted) onQuizSubmitted({ quizId: quiz.id, score, isPassed, correctAnswers, totalQuestions });
    } catch (err) {
      onToast?.(err.response?.data?.error ?? 'Lỗi khi nộp bài.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!quiz || !quiz.questions || quiz.questions.length === 0) return null;

  if (result) {
    return (
      <div className={`p-4 rounded-4 border ${result.isPassed ? 'bg-success bg-opacity-10 border-success' : 'bg-danger bg-opacity-10 border-danger'}`}>
        <div className="text-center">
          <div className={`display-4 fw-bold mb-2 ${result.isPassed ? 'text-success' : 'text-danger'}`}>{result.score}%</div>
          <h5 className="fw-bold">{result.isPassed ? t('quizPassed') : t('quizFailed')}</h5>
          <p className="mb-3 text-secondary">{t('correctCount')}: {result.correctCount}/{result.total}</p>
          {!result.isPassed && (
            <button className="btn btn-outline-danger btn-sm rounded-pill px-4" onClick={() => { setResult(null); setSelectedAnswers({}); }}>{t('retry')}</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <HelpCircle className="text-primary" size={24} />
        <h5 className="fw-bold mb-0">{t('quiz')}</h5>
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
          {submitting ? <Loader2 className="animate-spin me-2" size={18} /> : <FileText className="me-2" size={18} />} {t('submitQuiz')}
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
  const sessionStartRef = useRef(null);
  const activeMsRef = useRef(0);
  const lastTickRef = useRef(null);
  const lastActivityRef = useRef(null);

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
  const [sectionViewMode, setSectionViewMode] = useState('content'); // 'content' | 'video' | 'quiz'
  const introFromUrlRef = useRef(false);

  const { lang, t } = useLanguage();

  const trackEvent = useCallback((eventType, entityType, entityId, metadata) => {
    if (!courseId) return;
    api.post('/learning/track-event', {
      courseId: parseInt(courseId, 10),
      eventType,
      entityType: entityType || null,
      entityId: entityId != null ? String(entityId) : null,
      metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)).slice(0, 500) : null
    }).catch(() => {});
  }, [courseId]);

  const headerTabs = [
    { id: 'content', labelKey: 'tabContent', icon: BookOpen },
    { id: 'progress', labelKey: 'tabProgress', icon: Award },
    { id: 'dates', labelKey: 'tabDates', icon: Calendar },
    { id: 'discussion', labelKey: 'tabDiscussion', icon: MessageSquare },
    { id: 'notes', labelKey: 'tabNotes', icon: StickyNote }
  ];

  useEffect(() => {
    const saved = localStorage.getItem(`sp_${courseId}`);
    if (saved) {
      try { setSectionProgress(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, [courseId]);

  // Track thời gian học thực tế (active time): chỉ cộng khi tab visible và có hoạt động gần đây.
  useEffect(() => {
    if (!courseId) return;
    const now = Date.now();
    sessionStartRef.current = now;
    lastTickRef.current = now;
    lastActivityRef.current = now;
    activeMsRef.current = 0;

    const IDLE_THRESHOLD_MS = 2 * 60 * 1000; // 2 phút không tương tác thì không tính thời gian học

    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const sendSession = (minutes) => {
      if (minutes < 1) return;
      const token = localStorage.getItem('token');
      const base = api.defaults.baseURL || '/api';
      const url = base.startsWith('http') ? `${base.replace(/\/$/, '')}/learning/record-session` : `${window.location.origin}/api/learning/record-session`;
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ courseId: parseInt(courseId, 10), minutes }),
        keepalive: true
      }).catch(() => {});
    };

    const flushActiveTime = () => {
      const t = Date.now();
      const minutes = Math.floor(activeMsRef.current / 60000);
      if (minutes >= 1) {
        sendSession(minutes);
        activeMsRef.current = activeMsRef.current - (minutes * 60000);
      }
      lastTickRef.current = t;
    };

    const tick = () => {
      const t = Date.now();
      const lastTick = lastTickRef.current ?? t;
      const delta = Math.max(0, t - lastTick);
      lastTickRef.current = t;

      if (document.visibilityState !== 'visible') return;
      const lastActivity = lastActivityRef.current ?? t;
      const idleFor = t - lastActivity;
      if (idleFor <= IDLE_THRESHOLD_MS) {
        activeMsRef.current += delta;
      }

      const minutes = Math.floor(activeMsRef.current / 60000);
      if (minutes >= 5) {
        sendSession(minutes);
        activeMsRef.current = activeMsRef.current - (minutes * 60000);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        tick();
        flushActiveTime();
      } else {
        markActivity();
        lastTickRef.current = Date.now();
      }
    };

    const handleBeforeUnload = () => {
      tick();
      flushActiveTime();
    };

    const interval = setInterval(tick, 30000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('mousemove', markActivity, { passive: true });
    window.addEventListener('mousedown', markActivity, { passive: true });
    window.addEventListener('keydown', markActivity);
    window.addEventListener('scroll', markActivity, { passive: true });
    window.addEventListener('touchstart', markActivity, { passive: true });

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('mousemove', markActivity);
      window.removeEventListener('mousedown', markActivity);
      window.removeEventListener('keydown', markActivity);
      window.removeEventListener('scroll', markActivity);
      window.removeEventListener('touchstart', markActivity);

      tick();
      flushActiveTime();
    };
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
      trackEvent('PageEnter', 'Course', String(courseId), null);
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
          trackEvent('LessonViewed', 'Lesson', String(lesson.lessonId), JSON.stringify({ lessonTitle: lesson.title }));
          if (sectionP) trackEvent('SectionViewed', 'Section', `${lesson.lessonId}_${sectionP}`, JSON.stringify({ lessonTitle: lesson.title, sectionNum: parseInt(sectionP) }));
        }
      } else {
        const hasIntro = d.description || (d.showIntroVideo && (d.introVideoUrl || d.introExternalVideoUrl));
        if (hasIntro) {
          introFromUrlRef.current = true;
          setShowIntro(true);
        } else {
          const first = d.lessons.find(l => !l.isCompleted) || d.lessons[0];
          if (first) {
            setActiveLesson(first);
            setExpandedLessonId(first.lessonId);
            const secs = getSections(first);
            const secNum = secs.length > 0 ? secs[0].num : 1;
            setActiveSection(secNum);
            trackEvent('LessonViewed', 'Lesson', String(first.lessonId), JSON.stringify({ lessonTitle: first.title }));
            trackEvent('SectionViewed', 'Section', `${first.lessonId}_${secNum}`, JSON.stringify({ lessonTitle: first.title, sectionNum: secNum }));
          }
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
      const urls = (s.videoUrls ?? s.VideoUrls) ?? [];
      const single = (s.videoUrl ?? s.VideoUrl) || '';
      const urlList = (Array.isArray(urls) && urls.length > 0) ? urls : (single ? [single] : []);
      return { urls: urlList, ext: null, show: s.showVideo ?? s.ShowVideo };
    }
    const map = {
      1: { url: lesson.videoUrl1, ext: lesson.externalVideoUrl1, show: lesson.showVideo1 },
      2: { url: lesson.videoUrl2, ext: lesson.externalVideoUrl2, show: lesson.showVideo2 },
      3: { url: lesson.videoUrl3, ext: lesson.externalVideoUrl3, show: lesson.showVideo3 },
      4: { url: lesson.videoUrl4, ext: lesson.externalVideoUrl4, show: lesson.showVideo4 },
      5: { url: lesson.videoUrl5, ext: lesson.externalVideoUrl5, show: lesson.showVideo5 },
    };
    const m = map[num] || { url: null, ext: null, show: false };
    return { urls: m.url ? [m.url] : [], ext: m.ext, show: m.show };
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
    if (lesson?.lessonId) {
      trackEvent('LessonViewed', 'Lesson', String(lesson.lessonId), JSON.stringify({ lessonTitle: lesson.title }));
    }
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
    const suffix = sectionViewMode !== 'content' ? `_${sectionViewMode}` : '';
    const key = showIntro ? 'intro' : (activeLesson ? `${activeLesson.lessonId}_${activeSection}${suffix}` : null);
    return key ? bookmarked.has(key) : false;
  };

  const handleSelectSection = (lesson, sectionNum, viewMode = 'content') => {
    introFromUrlRef.current = false;
    setActiveLesson(lesson);
    setActiveSection(sectionNum);
    setSectionViewMode(viewMode);
    setShowIntro(false);
    setFinishedVideos(new Set());
    if (lesson?.lessonId) {
      trackEvent('SectionViewed', 'Section', `${lesson.lessonId}_${sectionNum}`, JSON.stringify({ lessonTitle: lesson.title, sectionNum }));
    }
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
    const sections = getSections(activeLesson);
    const sec = sections.find(s => s.num === activeSection);

    if (sectionViewMode === 'content') {
      if (sec?.hasVideo) {
        setSectionViewMode('video');
        markSectionDone(activeLesson.lessonId, activeSection);
        return;
      }
      if (sec?.hasQuiz) {
        setSectionViewMode('quiz');
        markSectionDone(activeLesson.lessonId, activeSection);
        return;
      }
    } else if (sectionViewMode === 'video') {
      if (sec?.hasQuiz) {
        setSectionViewMode('quiz');
        markSectionDone(activeLesson.lessonId, `video_${activeSection}`);
        return;
      }
    }
    markSectionDone(activeLesson.lessonId, sectionViewMode === 'video' ? `video_${activeSection}` : sectionViewMode === 'quiz' ? `quiz_${activeSection}` : activeSection);
    const idx = sections.findIndex(s => s.num === activeSection);
    if (idx < sections.length - 1) {
      setActiveSection(sections[idx + 1].num);
      setSectionViewMode('content');
    } else {
      try {
        if (!activeLesson.isCompleted) {
          await api.post('/learning/complete-lesson', { lessonId: activeLesson.lessonId });
          trackEvent('LessonCompleted', 'Lesson', String(activeLesson.lessonId), JSON.stringify({ lessonTitle: activeLesson.title }));
        }
      } catch { /* ignore */ }
      const li = data.lessons.findIndex(l => l.lessonId === activeLesson.lessonId);
      if (li < data.lessons.length - 1) {
        const next = data.lessons[li + 1];
        setActiveLesson(next);
        setExpandedLessonId(next.lessonId);
        const ns = getSections(next);
        setActiveSection(ns.length > 0 ? ns[0].num : 1);
        setSectionViewMode('content');
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
    const sec = sections.find(s => s.num === activeSection);

    if (sectionViewMode === 'quiz') {
      if (sec?.hasVideo) {
        setSectionViewMode('video');
        return;
      }
      setSectionViewMode('content');
      return;
    }
    if (sectionViewMode === 'video') {
      setSectionViewMode('content');
      return;
    }
    const idx = sections.findIndex(s => s.num === activeSection);
    if (idx > 0) {
      const prevSec = sections[idx - 1];
      setActiveSection(prevSec.num);
      if (prevSec.hasQuiz) setSectionViewMode('quiz');
      else if (prevSec.hasVideo) setSectionViewMode('video');
      else setSectionViewMode('content');
    } else {
      const li = data.lessons.findIndex(l => l.lessonId === activeLesson.lessonId);
      if (li > 0) {
        const prev = data.lessons[li - 1];
        setActiveLesson(prev);
        setExpandedLessonId(prev.lessonId);
        const ps = getSections(prev);
        const lastSec = ps.length > 0 ? ps[ps.length - 1] : null;
        setActiveSection(lastSec ? lastSec.num : 1);
        if (lastSec?.hasQuiz) setSectionViewMode('quiz');
        else if (lastSec?.hasVideo) setSectionViewMode('video');
        else setSectionViewMode('content');
        setFinishedVideos(new Set());
      } else {
        const hasIntro = data.description || (data.showIntroVideo && (data.introVideoUrl || data.introExternalVideoUrl));
        if (hasIntro) {
          setShowIntro(true);
        }
      }
    }
  };

  const introVideoWatched = sectionProgress['0_video_intro'];
  const introContentViewed = sectionProgress['intro_content'];

  /* Tính tiến độ dựa trên tổng số mục (content + video + quiz) và phân chia % đều */
  const computedProgress = React.useMemo(() => {
    if (!data?.lessons) return data?.progressPercentage ?? 0;
    let total = 0;
    let completed = 0;
    if (data.description || data.showIntroVideo) {
      total += 1;
      if (sectionProgress['intro_content']) completed += 1;
    }
    if (data.showIntroVideo && (data.introVideoUrl || data.introExternalVideoUrl)) {
      total += 1;
      if (sectionProgress['0_video_intro']) completed += 1;
    }
    (data.lessons || []).forEach((l) => {
      const secs = getSections(l);
      secs.forEach((sec) => {
        total += 1;
        if (sectionProgress[`${l.lessonId}_${sec.num}`]) completed += 1;
        if (sec.hasVideo) {
          total += 1;
          if (sectionProgress[`${l.lessonId}_video_${sec.num}`]) completed += 1;
        }
        if (sec.hasQuiz) {
          total += 1;
          if (sectionProgress[`${l.lessonId}_quiz_${sec.num}`]) completed += 1;
        }
      });
    });
    if (total === 0) return data.progressPercentage ?? 0;
    return Math.round((completed / total) * 1000) / 10;
  }, [data, sectionProgress, getSections]);

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
          <h2 className="fw-bold mb-2" style={{ color: '#1a1a2e', fontSize: '1.5rem' }}>{t('sectionIntro')}</h2>
          <button type="button" className="btn btn-link p-0 text-body-secondary d-inline-flex align-items-center gap-2 small" onClick={toggleBookmark}>
            <Bookmark size={16} fill={isBookmarked() ? 'currentColor' : 'none'} />
            {t('bookmark')}
          </button>
        </div>
      </div>

      <div className="p-4 p-md-5">
        {data.description ? (
          <div className="lesson-content mb-4" style={{ color: '#4a5568', lineHeight: 1.7, fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: data.description }} />
        ) : (
          <p className="text-secondary mb-4" style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>
            {t('welcomeCourse')}
          </p>
        )}

        {data.showIntroVideo && (data.introVideoUrl || data.introExternalVideoUrl) && (
          <div className="mb-4">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#1a1a2e', fontSize: '1rem' }}>
              <Video size={18} className="text-primary" />
              {t('introVideo')}
              {introVideoWatched && <span className="badge bg-success rounded-pill ms-2 small">{t('watched')} ✓</span>}
            </h6>
            <div className="ratio ratio-16x9 rounded-3 overflow-hidden bg-dark">
              {data.introVideoUrl ? (
                <VideoPlayer
                  key={data.introVideoUrl}
                  src={data.introVideoUrl}
                  onPlay={() => { lastActivityRef.current = Date.now(); }}
                  onTimeUpdate={() => { lastActivityRef.current = Date.now(); }}
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
            {t('courseOverview')}
          </h6>
          {(() => {
            const totalSections = data.lessons.reduce((acc, l) => acc + getSections(l).length, 0) + (data.description ? 1 : 0) + (data.showIntroVideo && (data.introVideoUrl || data.introExternalVideoUrl) ? 1 : 0);
            const completedLessons = data.lessons.filter(l => l.isCompleted).length;
            return (
              <>
                <div className="row g-3 mb-3">
                  <div className="col-4">
                    <div className="text-center p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e9ecef' }}>
                      <div className="fw-bold fs-5 text-primary">{data.lessons.length}</div>
                      <div className="text-muted small">{t('lessonCount')}</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e9ecef' }}>
                      <div className="fw-bold fs-5 text-success">{completedLessons}</div>
                      <div className="text-muted small">{t('lessonsCompleted')}</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e9ecef' }}>
                      <div className="fw-bold fs-5" style={{ color: '#6366f1' }}>{totalSections}</div>
                      <div className="text-muted small">{t('contentParts')}</div>
                    </div>
                  </div>
                </div>
                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <div className="text-center p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e9ecef' }}>
                      <div className="fw-bold small text-muted">{t('startDate')}</div>
                      <div className="fw-bold" style={{ color: '#0f172a' }}>{data.startDate ? new Date(data.startDate).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US') : '—'}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e9ecef' }}>
                      <div className="fw-bold small text-muted">{t('endDate')}</div>
                      <div className="fw-bold" style={{ color: '#0f172a' }}>{data.endDate ? new Date(data.endDate).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US') : '—'}</div>
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
                              const isContentDone = sectionProgress[`${l.lessonId}_${sec.num}`];
                              const isVideoDone = sectionProgress[`${l.lessonId}_video_${sec.num}`];
                              const isQuizDone = sectionProgress[`${l.lessonId}_quiz_${sec.num}`];
                              return (
                                <React.Fragment key={sec.num}>
                                  <div className="d-flex align-items-center justify-content-between gap-2 py-1">
                                    <div className="d-flex align-items-center gap-2">
                                      {isContentDone ? <CheckCircle2 size={14} className="text-success flex-shrink-0" /> : <Circle size={14} className="flex-shrink-0" style={{ color: '#adb5bd' }} />}
                                      <span className="small" style={{ color: '#64748b', fontSize: '0.85rem' }}>{sec.title || `Phần ${sec.num}`}</span>
                                    </div>
                                  </div>
                                  {sec.hasVideo && (
                                    <div className="d-flex align-items-center justify-content-between gap-2 py-1">
                                      <div className="d-flex align-items-center gap-2">
                                        {isVideoDone ? <CheckCircle2 size={14} className="text-success flex-shrink-0" /> : <Circle size={14} className="flex-shrink-0" style={{ color: '#adb5bd' }} />}
                                        <span className="small" style={{ color: '#64748b', fontSize: '0.85rem' }}>{t('video')}</span>
                                      </div>
                                      <span className="badge rounded-pill small" style={{ backgroundColor: 'rgba(13,110,253,0.12)', color: '#0d6efd', fontSize: '0.7rem' }}><Video size={10} className="me-1" />Video</span>
                                    </div>
                                  )}
                                  {sec.hasQuiz && (
                                    <div className="d-flex align-items-center justify-content-between gap-2 py-1">
                                      <div className="d-flex align-items-center gap-2">
                                        {isQuizDone ? <CheckCircle2 size={14} className="text-success flex-shrink-0" /> : <Circle size={14} className="flex-shrink-0" style={{ color: '#adb5bd' }} />}
                                        <span className="small" style={{ color: '#64748b', fontSize: '0.85rem' }}>{t('quiz')}</span>
                                      </div>
                                      <span className="badge rounded-pill small" style={{ backgroundColor: 'rgba(25,135,84,0.12)', color: '#198754', fontSize: '0.7rem' }}><ClipboardCheck size={10} className="me-1" />Quiz</span>
                                    </div>
                                  )}
                                </React.Fragment>
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
            {t('startLearning')} <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    if (!activeLesson) return (
      <div className="h-100 d-flex align-items-center justify-content-center text-muted">
        {t('selectLesson')}
      </div>
    );

    const content = getContent(activeLesson, activeSection);
    const video = getVideo(activeLesson, activeSection);
    const showQuiz = getQuiz(activeLesson, activeSection);
    const sectionTitle = activeLesson.sections?.[activeSection - 1]?.title ?? [activeLesson.section1Title, activeLesson.section2Title, activeLesson.section3Title, activeLesson.section4Title, activeLesson.section5Title][activeSection - 1] ?? 'Giới thiệu bài học';
    const lessonIdx = data.lessons.findIndex(l => l.lessonId === activeLesson.lessonId);
    const videoWatched = finishedVideos.has(activeSection);

    /* Trang riêng bài tập trắc nghiệm khi click từ sidebar */
    if (sectionViewMode === 'quiz' && showQuiz) {
      return (
        <div className="mx-auto bg-white rounded-3 border shadow-sm overflow-hidden" style={{ maxWidth: '900px', borderColor: '#e9ecef' }}>
          <div className="d-flex align-items-start justify-content-between gap-4 p-4 pb-3 border-bottom" style={{ borderColor: '#e9ecef' }}>
            <div className="flex-grow-1">
              <h2 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ color: '#1a1a2e', fontSize: '1.5rem' }}>
                <ClipboardCheck size={24} className="text-success" />
                {t('quiz')}
              </h2>
              <p className="text-muted small mb-0">{sectionTitle}</p>
            </div>
            <div className="d-flex align-items-center gap-1 flex-shrink-0">
              <button type="button" className="btn btn-outline-secondary btn-sm rounded-circle p-2" onClick={goPrev} title="Quay lại nội dung">
                <ChevronLeft size={20} />
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm rounded-circle p-2" onClick={goNext} title="Bài tiếp">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className="p-4 p-md-5">
            <QuizSection courseId={courseId} lessonId={activeLesson.lessonId} section={activeSection}
              onComplete={(passed) => { if (passed) markSectionDone(activeLesson.lessonId, `quiz_${activeSection}`); }}
              onQuizSubmitted={(data) => trackEvent('QuizSubmitted', 'Quiz', String(data.quizId), JSON.stringify({ score: data.score, isPassed: data.isPassed, correctAnswers: data.correctAnswers, totalQuestions: data.totalQuestions }))}
              onToast={toast} />
          </div>
          <div className="d-flex justify-content-between align-items-center p-4 border-top" style={{ borderColor: '#e9ecef' }}>
            <button className="btn btn-outline-secondary px-4 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2" onClick={goPrev}>
              <ChevronLeft size={20} /> {t('backToContent')}
            </button>
            <button className="btn btn-primary px-5 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2" onClick={goNext}>
              {t('next')} <ChevronRight size={20} />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto bg-white rounded-3 border shadow-sm overflow-hidden" style={{ maxWidth: '900px', borderColor: '#e9ecef' }}>
        {/* Header + Nav arrows + Bookmark */}
        <div className="d-flex align-items-start justify-content-between gap-4 p-4 pb-3 border-bottom" style={{ borderColor: '#e9ecef' }}>
          <div className="flex-grow-1">
            <h2 className="fw-bold mb-2" style={{ color: '#1a1a2e', fontSize: '1.5rem' }}>{sectionTitle}</h2>
            <button type="button" className="btn btn-link p-0 text-body-secondary d-inline-flex align-items-center gap-2 small" onClick={toggleBookmark}>
              <Bookmark size={16} fill={isBookmarked() ? 'currentColor' : 'none'} />
              {t('bookmark')}
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
          {/* Mục tiêu bài học - chỉ hiện khi khác với nội dung (tránh lặp) */}
          {activeLesson.overview && activeSection === 1 && content !== activeLesson.overview && (
            <div className="mb-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#1a1a2e', fontSize: '1rem' }}>
                <FileText size={18} className="text-primary" />
                {t('lessonObjectives')}
              </h6>
              <div className="lesson-content" style={{ color: '#4a5568', lineHeight: 1.7, fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: activeLesson.overview }} />
            </div>
          )}

          {/* Nội dung bài học */}
          {content ? (
            <div className="mb-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#1a1a2e', fontSize: '1rem' }}>
                <BookOpen size={18} className="text-primary" />
                {t('lessonContent')}
              </h6>
              <div className="lesson-content" style={{ color: '#4a5568', lineHeight: 1.7, fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          ) : !video.show && (
            <p className="text-secondary mb-4" style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>
              Để học tốt bài học này, người học cần xem video bài giảng, đọc tài liệu kèm theo, thực hành và tham gia thảo luận.
            </p>
          )}

          {/* Video nhúng trực tiếp trên trang */}
          {video.show && ((video.urls?.length > 0) || video.ext) && (
            <div className="mb-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#1a1a2e', fontSize: '1rem' }}>
                <Video size={18} className="text-primary" />
                {t('videoLecture')}
              </h6>
              <div className="d-flex flex-column gap-4">
                {(video.urls || []).map((url, vi) => (
                  <div key={url} className="ratio ratio-16x9 rounded-3 overflow-hidden bg-dark">
                    <VideoPlayer
                      src={url}
                      onPlay={() => { lastActivityRef.current = Date.now(); }}
                      onTimeUpdate={() => { lastActivityRef.current = Date.now(); }}
                      onEnded={() => {
                        setFinishedVideos(p => new Set([...p, activeSection]));
                        markSectionDone(activeLesson.lessonId, `video_${activeSection}`);
                        trackEvent('VideoCompleted', 'Section', `${activeLesson.lessonId}_${activeSection}`, JSON.stringify({ lessonTitle: activeLesson.title, sectionNum: activeSection }));
                      }}
                    />
                  </div>
                ))}
                {video.ext && (
                  <div className="ratio ratio-16x9 rounded-3 overflow-hidden bg-dark position-relative">
                    <iframe className="w-100 h-100 border-0" src={video.ext} title="Video" allowFullScreen />
                    {!videoWatched && (
                      <button className="btn btn-primary btn-sm position-absolute bottom-0 end-0 m-3 shadow rounded-pill px-3 py-2 fw-bold"
                        onClick={() => {
                          setFinishedVideos(p => new Set([...p, activeSection]));
                          markSectionDone(activeLesson.lessonId, `video_${activeSection}`);
                          trackEvent('VideoCompleted', 'Section', `${activeLesson.lessonId}_${activeSection}`, JSON.stringify({ lessonTitle: activeLesson.title, sectionNum: activeSection, skipped: true }));
                        }}>
                        {t('videoWatched')} <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              {videoWatched && <span className="badge bg-success rounded-pill mt-2 small">{t('watched')} ✓</span>}
            </div>
          )}
        </div>

        {/* Nav buttons dưới */}
        <div className="d-flex justify-content-between align-items-center p-4 border-top" style={{ borderColor: '#e9ecef' }}>
          <button className="btn btn-outline-secondary px-4 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2" onClick={goPrev}>
            <ChevronLeft size={20} /> {t('prev')}
          </button>
          <button className="btn btn-primary px-5 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2" onClick={goNext}>
            {t('next')} <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-white">
      <Loader2 className="animate-spin text-primary mb-3" size={48} />
      <h5 className="fw-bold text-secondary">{t('preparingContent')}</h5>
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
                {t(tab.labelKey)}
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
                      <span style={{ color: '#1e293b', fontSize: '0.9rem', fontWeight: 500 }}>{t('introVideoShort')}</span>
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
                        const isActiveContent = isActiveLesson && activeSection === sec.num && sectionViewMode === 'content';
                        const isActiveVideo = isActiveLesson && activeSection === sec.num && sectionViewMode === 'video';
                        const isActiveQuiz = isActiveLesson && activeSection === sec.num && sectionViewMode === 'quiz';
                        const isContentDone = sectionProgress[`${lesson.lessonId}_${sec.num}`];
                        const isVideoDone = sectionProgress[`${lesson.lessonId}_video_${sec.num}`];
                        const isQuizDone = sectionProgress[`${lesson.lessonId}_quiz_${sec.num}`];

                        return (
                          <React.Fragment key={sec.num}>
                            {/* Dòng nội dung (chỉ text, không video) */}
                            <div
                              className={`d-flex align-items-center justify-content-between gap-2 py-2 border-bottom cursor-pointer ${isActiveContent ? 'toc-active' : ''}`}
                              style={{ borderColor: 'rgba(0,0,0,0.06)' }}
                              onClick={(e) => { e.stopPropagation(); handleSelectSection(lesson, sec.num, 'content'); setShowIntro(false); }}
                            >
                              <div className="d-flex align-items-center gap-3 flex-grow-1 min-width-0">
                                {isContentDone ? <CheckCircle2 size={18} className="text-success flex-shrink-0" /> : <Circle size={18} className="flex-shrink-0" style={{ color: '#adb5bd' }} />}
                                <span className={`small text-truncate ${isActiveContent ? 'fw-semibold' : ''}`} style={{ color: isActiveContent ? '#6366f1' : '#1e293b', fontSize: '0.9rem' }}>{(sec.title || '').replace(/^\d+\.\s*/, '').trim() || sec.title || `Phần ${sec.num}`}</span>
                              </div>
                            </div>
                            {/* Dòng riêng Video - mở trang riêng khi click */}
                            {sec.hasVideo && (
                              <div
                                className={`d-flex align-items-center justify-content-between gap-2 py-2 border-bottom cursor-pointer ${isActiveVideo ? 'toc-active' : ''}`}
                                style={{ borderColor: 'rgba(0,0,0,0.06)' }}
                                onClick={(e) => { e.stopPropagation(); handleSelectSection(lesson, sec.num, 'video'); setShowIntro(false); }}
                              >
                                <div className="d-flex align-items-center gap-3 flex-grow-1 min-width-0">
                                  {isVideoDone ? <CheckCircle2 size={18} className="text-success flex-shrink-0" /> : <Circle size={18} className="flex-shrink-0" style={{ color: '#adb5bd' }} />}
                                  <span className={`small text-truncate ${isActiveVideo ? 'fw-semibold' : ''}`} style={{ color: isActiveVideo ? '#6366f1' : '#1e293b', fontSize: '0.9rem' }}>{t('video')}</span>
                                </div>
                                <div className="d-flex gap-1 flex-shrink-0">
                                  <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(13,110,253,0.12)', color: '#0d6efd', fontSize: '0.65rem' }}><Video size={10} /></span>
                                </div>
                              </div>
                            )}
                            {/* Dòng riêng bài tập trắc nghiệm - mở trang riêng khi click */}
                            {sec.hasQuiz && (
                              <div
                                className={`d-flex align-items-center justify-content-between gap-2 py-2 border-bottom cursor-pointer ${isActiveQuiz ? 'toc-active' : ''}`}
                                style={{ borderColor: 'rgba(0,0,0,0.06)' }}
                                onClick={(e) => { e.stopPropagation(); handleSelectSection(lesson, sec.num, 'quiz'); setShowIntro(false); }}
                              >
                                <div className="d-flex align-items-center gap-3 flex-grow-1 min-width-0">
                                  {isQuizDone ? <CheckCircle2 size={18} className="text-success flex-shrink-0" /> : <Circle size={18} className="flex-shrink-0" style={{ color: '#adb5bd' }} />}
                                  <span className={`small text-truncate ${isActiveQuiz ? 'fw-semibold' : ''}`} style={{ color: isActiveQuiz ? '#6366f1' : '#1e293b', fontSize: '0.9rem' }}>{t('quiz')}</span>
                                </div>
                                <div className="d-flex gap-1 flex-shrink-0">
                                  <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(25,135,84,0.12)', color: '#198754', fontSize: '0.65rem' }}><ClipboardCheck size={10} /></span>
                                </div>
                              </div>
                            )}
                          </React.Fragment>
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
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#1a1a2e' }}><Award size={22} className="text-primary" /> {t('progressTitle')}</h5>
              <div className="progress mb-3" style={{ height: '14px' }}>
                <div className="progress-bar" style={{ width: `${computedProgress}%`, backgroundColor: computedProgress >= 100 ? '#10b981' : '#6366f1' }} />
              </div>
              <p className="mb-4 fw-semibold" style={{ color: '#334155' }}>{Math.round(computedProgress)}% {t('completedPercent')}</p>
              <div className="d-flex flex-column gap-2">
                {(data.lessons || []).map((l, i) => (
                  <div key={l.lessonId} className="d-flex align-items-center gap-3 p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e9ecef' }}>
                    {l.isCompleted ? <CheckCircle2 size={20} className="text-success" /> : <Circle size={20} style={{ color: '#adb5bd' }} />}
                    <span className="fw-medium">{t('lesson')} {i + 1}: {l.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {headerTab === 'dates' && (
            <div className="mx-auto bg-white rounded-3 border shadow-sm p-5" style={{ maxWidth: '900px', borderColor: '#e9ecef' }}>
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#1a1a2e' }}><Calendar size={22} className="text-primary" /> {t('importantDates')}</h5>
              <div className="d-flex flex-column gap-3">
                <div className="p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e9ecef' }}>
                  <span className="text-muted small">{t('startDate')}</span>
                  <div className="fw-bold" style={{ color: '#0f172a' }}>{data.startDate ? new Date(data.startDate).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US') : '—'}</div>
                </div>
                <div className="p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e9ecef' }}>
                  <span className="text-muted small">{t('endDate')}</span>
                  <div className="fw-bold" style={{ color: '#0f172a' }}>{data.endDate ? new Date(data.endDate).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US') : '—'}</div>
                </div>
              </div>
            </div>
          )}
          {headerTab === 'discussion' && (
            <div className="mx-auto bg-white rounded-3 border shadow-sm p-5" style={{ maxWidth: '900px', borderColor: '#e9ecef' }}>
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#1a1a2e' }}><MessageSquare size={22} className="text-primary" /> Thảo luận</h5>
              <p className="text-secondary mb-0">{t('discussionDev')}</p>
            </div>
          )}
          {headerTab === 'notes' && (
            <div className="mx-auto bg-white rounded-3 border shadow-sm p-5" style={{ maxWidth: '900px', borderColor: '#e9ecef' }}>
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#1a1a2e' }}><StickyNote size={22} className="text-primary" /> Ghi chú</h5>
              <p className="text-secondary mb-0">{t('notesDev')}</p>
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
