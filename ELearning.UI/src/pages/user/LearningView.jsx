import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api, { getUploadUrl } from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";
import { useNotify } from "../../context/NotifyContext";
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  FileText,
  ArrowLeft,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Award,
  Video,
  Info,
  BookOpen,
  RefreshCw,
  HelpCircle,
  Bookmark,
  Minus,
  Plus,
  ClipboardCheck,
  Calendar,
  MessageSquare,
  StickyNote,
  Hash,
  FileStack,
  MonitorCheck,
  AlignRight,
  ChevronUp,
  ChevronDown,
  Monitor,
  PlaySquare,
  BookText,
  PenTool,
  Save,
} from "lucide-react";
import VideoPlayer from "../../components/common/VideoPlayer";

const ProgressCircle = ({ percentage, size = 36 }) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="4"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={percentage >= 100 ? "#10b981" : "#6366f1"}
        strokeWidth="4"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".35em"
        fontSize={size * 0.26}
        fontWeight="bold"
        fill={percentage >= 100 ? "#10b981" : "#6366f1"}
      >
        {Math.round(percentage)}%
      </text>
    </svg>
  );
};

const QuizSection = ({
  courseId,
  lessonId,
  section,
  onComplete,
  onQuizSubmitted,
  onToast,
}) => {
  const [quiz, setQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);

  useEffect(() => {
    setQuiz(null);
    setResult(null);
    setSelectedAnswers({});
    setShowCorrect(false);
    const load = async () => {
      try {
        const res = await api.get(
          `/quiz/${courseId}?section=${section}&lessonId=${lessonId}`,
        );
        setQuiz(res.data);
      } catch {
        /* no quiz */
      }
    };
    load();
  }, [courseId, lessonId, section]);

  const handleSubmit = async () => {
    if (!quiz || Object.keys(selectedAnswers).length < quiz.questions.length) {
      onToast?.("Vui lòng trả lời tất cả các câu hỏi!", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const selectedAnswersList = Object.entries(selectedAnswers).map(
        ([questionId, answerId]) => ({
          questionId: parseInt(questionId, 10),
          answerId,
        }),
      );
      const res = await api.post("/quiz/submit", {
        quizId: quiz.id,
        selectedAnswers: selectedAnswersList,
      });
      const { score, isPassed, correctAnswers, totalQuestions } = res.data;
      setResult({
        score,
        isPassed,
        correctCount: correctAnswers,
        total: totalQuestions,
      });
      setShowCorrect(true);
      if (onComplete) onComplete(isPassed);
      if (onQuizSubmitted)
        onQuizSubmitted({
          quizId: quiz.id,
          score,
          isPassed,
          correctAnswers,
          totalQuestions,
        });
    } catch (err) {
      onToast?.(err.response?.data?.error ?? "Lỗi khi nộp bài.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!quiz || !quiz.questions || quiz.questions.length === 0) return null;

  return (
    <div className="quiz-container">
      {result && (
        <div
          className={`p-3 rounded-3 mb-4 border d-flex align-items-center justify-content-between ${result.isPassed ? "bg-success bg-opacity-10 border-success" : "bg-warning bg-opacity-10 border-warning"}`}
        >
          <div>
            <div className="fw-bold mb-1" style={{ fontSize: "0.9rem" }}>
              Kết quả bài làm:
            </div>
            <div className="small text-secondary">
              <span
                className="fw-bold text-primary"
                style={{ fontSize: "1.1rem" }}
              >
                {(result.score / 10).toFixed(1)}
              </span>
              /10 điểm (
              {result.isPassed ? (
                <span className="text-success">Đạt</span>
              ) : (
                <span className="text-danger">Chưa đạt</span>
              )}
              )
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">
              Đúng {result.correctCount}/{result.total} câu
            </span>
            {!result.isPassed && (
              <button
                className="btn btn-xs btn-outline-dark rounded-pill px-3"
                onClick={() => {
                  setResult(null);
                  setSelectedAnswers({});
                  setShowCorrect(false);
                }}
              >
                Làm lại
              </button>
            )}
          </div>
        </div>
      )}

      <div className="d-flex flex-column gap-5">
        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="quiz-item">
            <div
              className="fw-medium mb-3 text-dark"
              style={{ fontSize: "1.05rem", color: "#333" }}
            >
              Câu {idx + 1}: {q.content?.replace(/^Câu\s*\d+\s*:\s*/i, "")}
            </div>
            <div className="d-flex flex-column gap-2">
              {q.answers.map((ans, aIdx) => {
                const isSelected = selectedAnswers[q.id] === ans.id;
                const isCorrect = showCorrect && ans.isCorrect;
                const isWrongSelected =
                  showCorrect && isSelected && !ans.isCorrect;

                let borderStyle = "1px solid #e9ecef";
                let bgColor = "#fff";
                if (isSelected) {
                  borderStyle = "2px solid #2563eb";
                  bgColor = "#f8faff";
                }
                if (isCorrect) {
                  borderStyle = "2px solid #198754";
                  bgColor = "#f0fff4";
                }
                if (isWrongSelected) {
                  borderStyle = "2px solid #dc3545";
                  bgColor = "#fff5f5";
                }

                return (
                  <div key={ans.id}>
                    <div
                      className="p-3 rounded-2 border d-flex align-items-center gap-3 transition-all answer-card"
                      onClick={() =>
                        !showCorrect &&
                        setSelectedAnswers({
                          ...selectedAnswers,
                          [q.id]: ans.id,
                        })
                      }
                      style={{
                        cursor: showCorrect ? "default" : "pointer",
                        border: borderStyle,
                        backgroundColor: bgColor,
                      }}
                    >
                      <div className="flex-shrink-0">
                        <div
                          className={`rounded-circle d-flex align-items-center justify-content-center border ${isSelected ? "border-primary" : "border-secondary-subtle"}`}
                          style={{ width: 22, height: 22 }}
                        >
                          {isSelected && (
                            <div
                              className="rounded-circle bg-primary"
                              style={{ width: 12, height: 12 }}
                            />
                          )}
                        </div>
                      </div>
                      <div
                        className="flex-grow-1"
                        style={{ fontSize: "0.96rem" }}
                      >
                        <span
                          className="fw-bold text-secondary text-uppercase me-2"
                          style={{ fontSize: "0.85rem" }}
                        >
                          {String.fromCharCode(97 + aIdx)}.
                        </span>
                        {ans.content?.replace(/^[a-z]\.\s*/i, "")}
                      </div>
                    </div>
                    {isCorrect && (
                      <div className="mt-1 ms-2 text-success">
                        <MonitorCheck size={18} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-top">
        {!showCorrect ? (
          <div className="d-flex align-items-center gap-3">
            <button
              className={`btn ${Object.keys(selectedAnswers).length > 0 ? "btn-primary shadow-sm" : "btn-light border text-muted"} px-5 py-2 rounded-2 fw-bold transition-all`}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Gửi"
              )}
            </button>
            <div className="small text-muted">
              {Object.keys(selectedAnswers).length}/{quiz.questions.length} câu
              đã chọn
            </div>
          </div>
        ) : (
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-outline-primary px-4 py-2 rounded-2 fw-bold"
              onClick={() => {
                setResult(null);
                setSelectedAnswers({});
                setShowCorrect(false);
              }}
            >
              Làm lại bài tập
            </button>
            <div className="small text-muted font-italic">
              Đã nộp bài - Xem kết quả và đáp án phía trên
            </div>
          </div>
        )}
      </div>

      <style>{`
        .answer-card:hover {
          background-color: #f8f9fa;
        }
        .quiz-item {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

const sectionIcons = [
  <Info size={18} />,
  <BookOpen size={18} />,
  <RefreshCw size={18} />,
  <HelpCircle size={18} />,
  <Award size={18} />,
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
  const [headerTab, setHeaderTab] = useState("content");
  const [sectionViewMode, setSectionViewMode] = useState("content"); // 'content' | 'video' | 'quiz'
  const [activeIntroIdx, setActiveIntroIdx] = useState(null);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [showFinishModal, setShowFinishModal] = useState(false);
  
  // Discussion & Notes states
  const [discussions, setDiscussions] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  
  const introFromUrlRef = useRef(false);

  const { lang, t } = useLanguage();

  const trackEvent = useCallback(
    (eventType, entityType, entityId, metadata) => {
      if (!courseId) return;
      api
        .post("/learning/track-event", {
          courseId: parseInt(courseId, 10),
          eventType,
          entityType: entityType || null,
          entityId: entityId != null ? String(entityId) : null,
          metadata: metadata
            ? (typeof metadata === "string"
                ? metadata
                : JSON.stringify(metadata)
              ).slice(0, 500)
            : null,
        })
        .catch(() => {});
    },
    [courseId],
  );

  const headerTabs = [
    { id: "content", labelKey: "tabContent", icon: BookOpen },

    { id: "dates", labelKey: "tabDates", icon: Calendar },
    { id: "discussion", labelKey: "tabDiscussion", icon: MessageSquare },
    { id: "notes", labelKey: "tabNotes", icon: StickyNote },
  ];

  useEffect(() => {
    const saved = localStorage.getItem(`sp_${courseId}`);
    if (saved) {
      try {
        setSectionProgress(JSON.parse(saved));
      } catch {
        /* ignore */
      }
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
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const base = api.defaults.baseURL || "/api";
      const url = base.startsWith("http")
        ? `${base.replace(/\/$/, "")}/learning/record-session`
        : `${window.location.origin}/api/learning/record-session`;
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ courseId: parseInt(courseId, 10), minutes }),
        keepalive: true,
      }).then(res => {
        if (res.status === 401) {
          console.warn("Session record failed: Unauthorized");
        }
      }).catch(() => {});
    };

    const flushActiveTime = () => {
      const t = Date.now();
      const minutes = Math.floor(activeMsRef.current / 60000);
      if (minutes >= 1) {
        sendSession(minutes);
        activeMsRef.current = activeMsRef.current - minutes * 60000;
      }
      lastTickRef.current = t;
    };

    const tick = () => {
      const t = Date.now();
      const lastTick = lastTickRef.current ?? t;
      const delta = Math.max(0, t - lastTick);
      lastTickRef.current = t;

      if (document.visibilityState !== "visible") return;
      const lastActivity = lastActivityRef.current ?? t;
      const idleFor = t - lastActivity;
      if (idleFor <= IDLE_THRESHOLD_MS) {
        activeMsRef.current += delta;
      }

      const minutes = Math.floor(activeMsRef.current / 60000);
      if (minutes >= 5) {
        sendSession(minutes);
        activeMsRef.current = activeMsRef.current - minutes * 60000;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
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

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("mousemove", markActivity, { passive: true });
    window.addEventListener("mousedown", markActivity, { passive: true });
    window.addEventListener("keydown", markActivity);
    window.addEventListener("scroll", markActivity, { passive: true });
    window.addEventListener("touchstart", markActivity, { passive: true });

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("mousemove", markActivity);
      window.removeEventListener("mousedown", markActivity);
      window.removeEventListener("keydown", markActivity);
      window.removeEventListener("scroll", markActivity);
      window.removeEventListener("touchstart", markActivity);

      tick();
      flushActiveTime();
    };
  }, [courseId]);

  const saveSP = useCallback(
    (next) => {
      localStorage.setItem(`sp_${courseId}`, JSON.stringify(next));
    },
    [courseId],
  );

  const markSectionDone = useCallback(
    (lessonId, key) => {
      setSectionProgress((prev) => {
        const k = `${lessonId}_${key}`;
        if (prev[k]) return prev;
        const next = { ...prev, [k]: true };
        saveSP(next);
        return next;
      });
    },
    [saveSP],
  );

  const getSections = useCallback((lesson) => {
    if (!lesson) return [];
    if (
      lesson.sections &&
      Array.isArray(lesson.sections) &&
      lesson.sections.length > 0
    ) {
      return lesson.sections.map((s, i) => ({
        num: i + 1,
        title: s.title ?? s.Title,
        hasVideo: s.showVideo ?? s.ShowVideo,
        hasQuiz: s.showQuiz ?? s.ShowQuiz,
        hasDocs: s.showDocs ?? s.ShowDocs,
      }));
    }
    const contents = [
      lesson.overview,
      lesson.content,
      lesson.reviewContent,
      lesson.essayQuestion,
      null,
    ];
    const videos = [
      lesson.showVideo1,
      lesson.showVideo2,
      lesson.showVideo3,
      lesson.showVideo4,
      lesson.showVideo5,
    ];
    const quizzes = [
      lesson.showQuiz1,
      lesson.showQuiz2,
      lesson.showQuiz3,
      lesson.showQuiz4,
      lesson.showQuiz5,
    ];
    const titles = [
      lesson.section1Title,
      lesson.section2Title,
      lesson.section3Title,
      lesson.section4Title,
      lesson.section5Title,
    ];
    const out = [];
    const hasAny = contents.some((c, i) => c || videos[i] || quizzes[i]);
    for (let i = 0; i < 5; i++) {
      if (i === 0 && hasAny) {
        out.push({
          num: 1,
          title: titles[0],
          hasVideo: videos[0],
          hasQuiz: quizzes[0],
          hasDocs: false,
        });
      } else if (i > 0 && (contents[i] || videos[i] || quizzes[i])) {
        out.push({
          num: i + 1,
          title: titles[i],
          hasVideo: videos[i],
          hasQuiz: quizzes[i],
          hasDocs: false,
        });
      }
    }
    return out;
  }, []);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await api.get(`/learning/progress/${courseId}`);
      const resData = res.data;
      if (resData.introSectionsJson) {
        try {
          resData.introSections = JSON.parse(resData.introSectionsJson);
        } catch {
          resData.introSections = [];
        }
      } else {
        resData.introSections = [];
      }
      setData(resData);
      return resData;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    introFromUrlRef.current = false;
    fetchProgress().then((d) => {
      if (!d) return;
      trackEvent("PageEnter", "Course", String(courseId), null);
      const introP = searchParams.get("intro");
      const lessonP = searchParams.get("lesson");
      const sectionP = searchParams.get("section");

      if (introP === "1") {
        introFromUrlRef.current = true;
        const sidx = searchParams.get("sidx");
        if (sidx !== null) setActiveIntroIdx(parseInt(sidx, 10));
        setShowIntro(true);
      } else if (lessonP) {
        const lesson = d.lessons.find((l) => l.lessonId === parseInt(lessonP));
        if (lesson) {
          setActiveLesson(lesson);
          setExpandedLessonId(lesson.lessonId);
          const sNum = sectionP ? parseInt(sectionP) : 1;
          setActiveSection(sNum);
          setExpandedSections(new Set([`${lesson.lessonId}_${sNum}`]));
          trackEvent(
            "LessonViewed",
            "Lesson",
            String(lesson.lessonId),
            JSON.stringify({ lessonTitle: lesson.title }),
          );
          if (sectionP)
            trackEvent(
              "SectionViewed",
              "Section",
              `${lesson.lessonId}_${sectionP}`,
              JSON.stringify({
                lessonTitle: lesson.title,
                sectionNum: parseInt(sectionP),
              }),
            );
        }
      } else {
        const hasIntro =
          d.description ||
          (d.showIntroVideo && (d.introVideoUrl || d.introExternalVideoUrl));
        if (hasIntro) {
          introFromUrlRef.current = true;
          setShowIntro(true);
        } else {
          const first = d.lessons.find((l) => !l.isCompleted) || d.lessons[0];
          if (first) {
            setActiveLesson(first);
            setExpandedLessonId(first.lessonId);
            const secs = getSections(first);
            const secNum = secs.length > 0 ? secs[0].num : 1;
            setActiveSection(secNum);
            setExpandedSections(new Set([`${first.lessonId}_${secNum}`]));
            trackEvent(
              "LessonViewed",
              "Lesson",
              String(first.lessonId),
              JSON.stringify({ lessonTitle: first.title }),
            );
            trackEvent(
              "SectionViewed",
              "Section",
              `${first.lessonId}_${secNum}`,
              JSON.stringify({ lessonTitle: first.title, sectionNum: secNum }),
            );
          }
        }
      }
      setInitialised(true);
    });
  }, [courseId]);

  useEffect(() => {
    if (!initialised) return;
    if (showIntro) {
      const params = { intro: "1" };
      if (activeIntroIdx !== null) params.sidx = String(activeIntroIdx);
      if (headerTab !== "content") params.tab = headerTab;
      setSearchParams(params, { replace: true });
    } else if (activeLesson) {
      const params = {
        lesson: String(activeLesson.lessonId),
        section: String(activeSection),
      };
      if (headerTab !== "content") params.tab = headerTab;
      setSearchParams(params, { replace: true });
    }
  }, [activeLesson, activeSection, showIntro, initialised, headerTab]);

  // Fetch Discussions
  useEffect(() => {
    if (headerTab === "discussion" && data) {
      fetchDiscussions();
    }
  }, [headerTab, activeLesson, activeSection, data]);

  // Fetch Notes
  useEffect(() => {
    if (headerTab === "notes" && data && activeLesson && !showIntro) {
      fetchNote();
    }
  }, [headerTab, activeLesson, activeSection, showIntro, data]);

  const fetchDiscussions = async () => {
    try {
      const lessonId = showIntro ? null : activeLesson?.lessonId;
      const res = await api.get(`/discussion/${courseId}${lessonId ? `?lessonId=${lessonId}` : ""}`);
      setDiscussions(res.data || []);
    } catch (err) {
      console.error("Lỗi tải thảo luận", err);
    }
  };

  const handlePostComment = async () => {
    if (!commentInput.trim()) return;
    setIsPostingComment(true);
    try {
      await api.post("/discussion", {
        courseId: parseInt(courseId),
        lessonId: showIntro ? null : activeLesson?.lessonId,
        content: commentInput
      });
      setCommentInput("");
      fetchDiscussions();
      toast("Đã gửi bình luận!", "success");
    } catch (err) {
      toast("Không thể gửi bình luận.", "error");
    } finally {
      setIsPostingComment(false);
    }
  };

  const fetchNote = async () => {
    if (showIntro || !activeLesson) return;
    setNoteLoading(true);
    try {
      const res = await api.get(`/note/${courseId}/${activeLesson.lessonId}`);
      setNoteText(res.data?.content || "");
    } catch (err) {
      console.error("Lỗi tải ghi chú", err);
    } finally {
      setNoteLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (showIntro || !activeLesson) return;
    setIsSavingNote(true);
    try {
      await api.post("/note", {
        courseId: parseInt(courseId),
        lessonId: activeLesson.lessonId,
        content: noteText
      });
      toast("Đã lưu ghi chú!", "success");
    } catch (err) {
      toast("Lỗi khi lưu ghi chú.", "error");
    } finally {
      setIsSavingNote(false);
    }
  };

  const getContent = (lesson, num) => {
    if (lesson.sections && lesson.sections[num - 1])
      return lesson.sections[num - 1].content;
    return [
      lesson.overview,
      lesson.content,
      lesson.reviewContent,
      lesson.essayQuestion,
      null,
    ][num - 1];
  };
  const getVideo = (lesson, num) => {
    if (lesson.sections && lesson.sections[num - 1]) {
      const s = lesson.sections[num - 1];
      const urls = s.videoUrls ?? s.VideoUrls ?? [];
      const single = (s.videoUrl ?? s.VideoUrl) || "";
      const urlList =
        Array.isArray(urls) && urls.length > 0 ? urls : single ? [single] : [];
      return { urls: urlList, ext: null, show: s.showVideo ?? s.ShowVideo };
    }
    const map = {
      1: {
        url: lesson.videoUrl1,
        ext: lesson.externalVideoUrl1,
        show: lesson.showVideo1,
      },
      2: {
        url: lesson.videoUrl2,
        ext: lesson.externalVideoUrl2,
        show: lesson.showVideo2,
      },
      3: {
        url: lesson.videoUrl3,
        ext: lesson.externalVideoUrl3,
        show: lesson.showVideo3,
      },
      4: {
        url: lesson.videoUrl4,
        ext: lesson.externalVideoUrl4,
        show: lesson.showVideo4,
      },
      5: {
        url: lesson.videoUrl5,
        ext: lesson.externalVideoUrl5,
        show: lesson.showVideo5,
      },
    };
    const m = map[num] || { url: null, ext: null, show: false };
    return { urls: m.url ? [m.url] : [], ext: m.ext, show: m.show };
  };
  const getQuiz = (lesson, num) => {
    if (lesson.sections && lesson.sections[num - 1])
      return lesson.sections[num - 1].showQuiz;
    return [
      lesson.showQuiz1,
      lesson.showQuiz2,
      lesson.showQuiz3,
      lesson.showQuiz4,
      lesson.showQuiz5,
    ][num - 1];
  };
  const getDocs = (lesson, num) => {
    if (lesson.sections && lesson.sections[num - 1]) {
      const s = lesson.sections[num - 1];
      return {
        urls: s.docUrls ?? s.DocUrls ?? [],
        show: s.showDocs ?? s.ShowDocs,
      };
    }
    return { urls: [], show: false };
  };

  const handleSelectLesson = (lesson) => {
    if (expandedLessonId === lesson.lessonId) {
      setExpandedLessonId(null);
      return;
    }
    setExpandedLessonId(lesson.lessonId);
    if (lesson?.lessonId) {
      trackEvent(
        "LessonViewed",
        "Lesson",
        String(lesson.lessonId),
        JSON.stringify({ lessonTitle: lesson.title }),
      );
    }
  };

  const toggleBookmark = () => {
    const key = showIntro
      ? "intro"
      : activeLesson
        ? `${activeLesson.lessonId}_${activeSection}`
        : null;
    if (!key) return;
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isBookmarked = () => {
    const suffix = sectionViewMode !== "content" ? `_${sectionViewMode}` : "";
    const key = showIntro
      ? "intro"
      : activeLesson
        ? `${activeLesson.lessonId}_${activeSection}${suffix}`
        : null;
    return key ? bookmarked.has(key) : false;
  };

  const handleSelectSection = (lesson, sectionNum, viewMode = "content") => {
    introFromUrlRef.current = false;
    setActiveLesson(lesson);
    setActiveSection(sectionNum);
    setSectionViewMode(viewMode);
    setShowIntro(false);
    setFinishedVideos(new Set());
    if (lesson?.lessonId) {
      trackEvent(
        "SectionViewed",
        "Section",
        `${lesson.lessonId}_${sectionNum}`,
        JSON.stringify({ lessonTitle: lesson.title, sectionNum }),
      );
    }
    const savedVids = localStorage.getItem(`sp_${courseId}`);
    if (savedVids) {
      try {
        const sp = JSON.parse(savedVids);
        const vids = new Set();
        const secs = getSections(lesson);
        secs.forEach((s) => {
          if (sp[`${lesson.lessonId}_video_${s.num}`]) vids.add(s.num);
        });
        setFinishedVideos(vids);
      } catch {
        /* ignore */
      }
    }
    const secs = getSections(lesson);
    const sec = secs.find((s) => s.num === sectionNum);
    if (sec && !sec.hasVideo && !sec.hasQuiz) {
      markSectionDone(lesson.lessonId, sectionNum);
    }
  };

  const goNext = async () => {
    if (!activeLesson || !data) return;
    const sections = getSections(activeLesson);
    const sec = sections.find((s) => s.num === activeSection);

    if (sectionViewMode === "content") {
      if (sec?.hasVideo) {
        setSectionViewMode("video");
        markSectionDone(activeLesson.lessonId, activeSection);
        return;
      }
      if (sec?.hasQuiz) {
        setSectionViewMode("quiz");
        markSectionDone(activeLesson.lessonId, activeSection);
        return;
      }
    } else if (sectionViewMode === "video") {
      if (sec?.hasQuiz) {
        setSectionViewMode("quiz");
        markSectionDone(activeLesson.lessonId, `video_${activeSection}`);
        return;
      }
    }
    markSectionDone(
      activeLesson.lessonId,
      sectionViewMode === "video"
        ? `video_${activeSection}`
        : sectionViewMode === "quiz"
          ? `quiz_${activeSection}`
          : activeSection,
    );
    const idx = sections.findIndex((s) => s.num === activeSection);
    if (idx < sections.length - 1) {
      setActiveSection(sections[idx + 1].num);
      setSectionViewMode("content");
    } else {
      try {
        if (!activeLesson.isCompleted) {
          await api.post("/learning/complete-lesson", {
            lessonId: activeLesson.lessonId,
          });
          trackEvent(
            "LessonCompleted",
            "Lesson",
            String(activeLesson.lessonId),
            JSON.stringify({ lessonTitle: activeLesson.title }),
          );
        }
      } catch {
        /* ignore */
      }
      const li = data.lessons.findIndex(
        (l) => l.lessonId === activeLesson.lessonId,
      );
      if (li < data.lessons.length - 1) {
        const next = data.lessons[li + 1];
        setActiveLesson(next);
        setExpandedLessonId(next.lessonId);
        const ns = getSections(next);
        setActiveSection(ns.length > 0 ? ns[0].num : 1);
        setSectionViewMode("content");
        setFinishedVideos(new Set());
      } else {
        // Hết khóa học
        setShowFinishModal(true);
        trackEvent("CourseCompleted", "Course", String(courseId), null);
      }
      fetchProgress().then((d) => {
        if (d && activeLesson) {
          const updated = d.lessons.find(
            (l) => l.lessonId === activeLesson.lessonId,
          );
          if (updated) setActiveLesson(updated);
        }
      });
    }
  };

  const goPrev = () => {
    if (!activeLesson || !data) return;
    const sections = getSections(activeLesson);
    const sec = sections.find((s) => s.num === activeSection);

    if (sectionViewMode === "quiz") {
      if (sec?.hasVideo) {
        setSectionViewMode("video");
        return;
      }
      setSectionViewMode("content");
      return;
    }
    if (sectionViewMode === "video") {
      setSectionViewMode("content");
      return;
    }
    const idx = sections.findIndex((s) => s.num === activeSection);
    if (idx > 0) {
      const prevSec = sections[idx - 1];
      setActiveSection(prevSec.num);
      if (prevSec.hasQuiz) setSectionViewMode("quiz");
      else if (prevSec.hasVideo) setSectionViewMode("video");
      else setSectionViewMode("content");
    } else {
      const li = data.lessons.findIndex(
        (l) => l.lessonId === activeLesson.lessonId,
      );
      if (li > 0) {
        const prev = data.lessons[li - 1];
        setActiveLesson(prev);
        setExpandedLessonId(prev.lessonId);
        const ps = getSections(prev);
        const lastSec = ps.length > 0 ? ps[ps.length - 1] : null;
        setActiveSection(lastSec ? lastSec.num : 1);
        if (lastSec?.hasQuiz) setSectionViewMode("quiz");
        else if (lastSec?.hasVideo) setSectionViewMode("video");
        else setSectionViewMode("content");
        setFinishedVideos(new Set());
      } else {
        const hasIntro =
          data.description ||
          (data.showIntroVideo &&
            (data.introVideoUrl || data.introExternalVideoUrl));
        if (hasIntro) {
          setShowIntro(true);
        }
      }
    }
  };

  const introVideoWatched = sectionProgress["0_video_intro"];
  const introContentViewed = sectionProgress["intro_content"];

  /* Tính tiến độ dựa trên tổng số mục (content + video + quiz) và phân chia % đều */
  const computedProgress = React.useMemo(() => {
    if (!data?.lessons) return data?.progressPercentage ?? 0;
    let total = 0;
    let completed = 0;
    if (data.description || data.showIntroVideo) {
      total += 1;
      if (sectionProgress["intro_content"]) completed += 1;
    }
    if (
      data.showIntroVideo &&
      (data.introVideoUrl || data.introExternalVideoUrl)
    ) {
      total += 1;
      if (sectionProgress["0_video_intro"]) completed += 1;
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
      setSectionProgress((prev) => {
        if (prev["intro_content"]) return prev;
        const next = { ...prev, intro_content: true };
        saveSP(next);
        return next;
      });
    }
  }, [showIntro, saveSP]);

  const renderIntro = () => {
    const isMain = activeIntroIdx === null;
    const currentSection =
      activeIntroIdx !== null && data.introSections
        ? data.introSections[activeIntroIdx]
        : null;
    const title = currentSection ? currentSection.title : t("sectionIntro");
    const content = currentSection ? currentSection.content : data.description;

    return (
      <div
        className="mx-auto bg-white rounded-3 border shadow-sm overflow-hidden"
        style={{ maxWidth: "900px", borderColor: "#e9ecef" }}
      >
        <div
          className="d-flex align-items-start justify-content-between gap-4 p-4 pb-3 border-bottom"
          style={{ borderColor: "#e9ecef" }}
        >
          <div className="flex-grow-1">
            <h2
              className="fw-bold mb-2"
              style={{ color: "#1a1a2e", fontSize: "1.5rem" }}
            >
              {title}
            </h2>
            <button
              type="button"
              className="btn btn-link p-0 text-body-secondary d-inline-flex align-items-center gap-2 small"
              onClick={toggleBookmark}
            >
              <Bookmark
                size={16}
                fill={isBookmarked() ? "currentColor" : "none"}
              />
              {t("bookmark")}
            </button>
          </div>
        </div>

        <div className="p-4 p-md-5">
          {content ? (
            <div
              className="lesson-content mb-4"
              style={{ color: "#4a5568", lineHeight: 1.7, fontSize: "0.95rem" }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <p
              className="text-secondary mb-4"
              style={{ fontSize: "0.95rem", lineHeight: 1.7 }}
            >
              {isMain
                ? t("welcomeCourse")
                : "Nội dung mục này đang được cập nhật."}
            </p>
          )}

          {/* Video cho mục giới thiệu (nếu có) */}
          {((isMain &&
            data.showIntroVideo &&
            (data.introVideoUrl || data.introExternalVideoUrl)) ||
            (currentSection?.showVideo &&
              (currentSection?.videoUrl ||
                currentSection?.videoUrls?.length > 0))) && (
            <div className="mb-4">
              <h6
                className="fw-bold mb-3 d-flex align-items-center gap-2"
                style={{ color: "#1a1a2e", fontSize: "1rem" }}
              >
                <Video size={18} className="text-primary" />
                {t("videoLecture")}
              </h6>
              <div className="ratio ratio-16x9 rounded-3 overflow-hidden bg-dark shadow-sm">
                {isMain ? (
                  data.introVideoUrl ? (
                    <VideoPlayer
                      src={data.introVideoUrl}
                      onEnded={() => markSectionDone(0, "video_intro")}
                    />
                  ) : (
                    <iframe
                      className="w-100 h-100 border-0"
                      src={data.introExternalVideoUrl}
                      allowFullScreen
                    />
                  )
                ) : currentSection.videoUrl ? (
                  <VideoPlayer src={currentSection.videoUrl} />
                ) : currentSection.videoUrls?.[0] ? (
                  <VideoPlayer src={currentSection.videoUrls[0]} />
                ) : null}
              </div>
            </div>
          )}

          {/* Tài liệu cho từng mục giới thiệu (nếu có) */}
          {currentSection?.showDocs &&
            (currentSection?.Documents || []).length > 0 && (
              <div className="mb-4 pt-3 border-top">
                <h6
                  className="fw-bold mb-3 d-flex align-items-center gap-2"
                  style={{ color: "#1a5276", fontSize: "1.1rem" }}
                >
                  <MonitorCheck size={22} className="text-primary" />
                  Tài liệu tham khảo:
                </h6>
                <ul className="list-unstyled ps-4">
                  {currentSection.Documents.map((doc, di) => (
                    <li
                      key={`intro-sec-doc-${di}`}
                      className="mb-2 d-flex align-items-center gap-2"
                      style={{ fontSize: "1.05rem" }}
                    >
                      <span className="text-dark">• Tài liệu {di + 1}:</span>
                      <a
                        href={getUploadUrl(doc.FileName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary fw-medium text-decoration-none"
                        style={{ borderBottom: "1px solid transparent" }}
                        onMouseOver={(e) =>
                          (e.target.style.borderBottom = "1px solid #2563eb")
                        }
                        onMouseOut={(e) =>
                          (e.target.style.borderBottom =
                            "1px solid transparent")
                        }
                      >
                        tại đây
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {isMain && data.introDocUrls && data.introDocUrls.length > 0 && (
            <div className="mb-4 pt-3 border-top">
              <h6
                className="fw-bold mb-3 d-flex align-items-center gap-2"
                style={{ color: "#1a5276", fontSize: "1.1rem" }}
              >
                <MonitorCheck size={22} className="text-primary" />
                Tài liệu tham khảo:
              </h6>
              <ul className="list-unstyled ps-4">
                {data.introDocUrls.map((url, di) => (
                  <li
                    key={`intro-doc-${di}`}
                    className="mb-2 d-flex align-items-center gap-2"
                    style={{ fontSize: "1.05rem" }}
                  >
                    <span className="text-dark">• Tài liệu {di + 1}:</span>
                    <a
                      href={getUploadUrl(url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary fw-medium text-decoration-none"
                    >
                      tại đây
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isMain && (
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-4 mt-2">
                <h5
                  className="fw-bold mb-0 d-flex align-items-center gap-2"
                  style={{ color: "#0f172a", fontSize: "1.25rem" }}
                >
                  <FileStack size={24} className="text-dark" />
                  Nội dung chương trình học
                </h5>
                <button
                  className="btn btn-outline-secondary btn-sm rounded-3 px-3 py-1 fw-medium"
                  onClick={() => {
                    const allKeys = new Set();
                    if (expandedSections.size > 0) {
                      setExpandedSections(new Set());
                    } else {
                      data.lessons.forEach((l) => {
                        getSections(l).forEach((s) =>
                          allKeys.add(`${l.lessonId}_${s.num}`),
                        );
                      });
                      setExpandedSections(allKeys);
                    }
                  }}
                >
                  {expandedSections.size > 0
                    ? t("collapseAll")
                    : t("expandAll")}
                </button>
              </div>

              <div className="d-flex flex-column gap-3">
                {/* PHẦN GIỚI THIỆU KHÓA HỌC */}
                <div
                  className="card border-0 shadow-sm rounded-3 overflow-hidden"
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #eef2f6 !important",
                  }}
                >
                  <div
                    className="card-header bg-white py-3 px-4 border-0 d-flex align-items-center justify-content-between cursor-pointer"
                    onClick={() => setExpandedIntro(!expandedIntro)}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <Circle size={22} className="text-secondary" />
                      <span
                        className="fw-bold text-dark"
                        style={{ fontSize: "1rem" }}
                      >
                        Giới thiệu khóa học
                      </span>
                    </div>
                    <Minus size={20} className="text-secondary opacity-50" />
                  </div>
                  {expandedIntro && (
                    <div className="card-body p-0 border-top">
                      <div className="d-flex align-items-center gap-3 py-3 px-5 hover-bg-light transition-all cursor-pointer">
                        <Circle
                          size={20}
                          className="text-secondary opacity-50"
                        />
                        <span
                          className="fw-medium text-dark"
                          style={{ fontSize: "0.95rem" }}
                        >
                          Giới thiệu học phần
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* DANH SÁCH BÀI HỌC */}
                {data.lessons.map((l, i) => {
                  const secs = getSections(l);
                  const firstSecKey = `${l.lessonId}_${secs[0]?.num || 1}`;
                  const isItemExpanded = expandedSections.has(firstSecKey);

                  return (
                    <div
                      key={l.lessonId}
                      className="card border-0 shadow-sm rounded-3 overflow-hidden"
                      style={{
                        backgroundColor: "#fff",
                        border: "1px solid #eef2f6 !important",
                      }}
                    >
                      <div
                        className="card-header bg-white py-3 px-4 border-0 d-flex align-items-center justify-content-between cursor-pointer"
                        onClick={() => {
                          const next = new Set(expandedSections);
                          secs.forEach((s) => {
                            const k = `${l.lessonId}_${s.num}`;
                            if (isItemExpanded) next.delete(k);
                            else next.add(k);
                          });
                          setExpandedSections(next);
                        }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          {l.isCompleted ? (
                            <CheckCircle2 size={22} className="text-success" />
                          ) : (
                            <Circle size={22} className="text-secondary" />
                          )}
                          <span
                            className="fw-bold text-dark"
                            style={{ fontSize: "1rem" }}
                          >
                            Bài {i + 1}: {l.title}
                          </span>
                        </div>
                        <Minus
                          size={20}
                          className="text-secondary opacity-50"
                        />
                      </div>

                      {isItemExpanded && (
                        <div className="card-body p-0 border-top">
                          {secs.map((sec) => {
                            const isContentDone =
                              sectionProgress[`${l.lessonId}_${sec.num}`];
                            const isVideoDone =
                              sectionProgress[`${l.lessonId}_video_${sec.num}`];
                            const isQuizDone =
                              sectionProgress[`${l.lessonId}_quiz_${sec.num}`];

                            return (
                              <div
                                key={sec.num}
                                className="py-3 px-5 border-bottom d-flex align-items-center justify-content-between hover-bg-light transition-all cursor-pointer last-child-no-border"
                              >
                                <div className="d-flex align-items-center gap-3 overflow-hidden">
                                  {isContentDone ? (
                                    <CheckCircle2
                                      size={20}
                                      className="text-success"
                                    />
                                  ) : (
                                    <Circle
                                      size={20}
                                      className="text-secondary opacity-50"
                                    />
                                  )}
                                  <span
                                    className="fw-medium text-uppercase text-truncate"
                                    style={{
                                      fontSize: "0.9rem",
                                      color: "#334155",
                                      letterSpacing: "0.01em",
                                    }}
                                  >
                                    {sec.title || `PHẦN ${sec.num}`}
                                  </span>
                                </div>
                                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                  {sec.hasVideo && (
                                    <span
                                      className="badge d-inline-flex align-items-center gap-1 py-1 px-2 rounded-2 fw-medium border-0"
                                      style={{
                                        backgroundColor: "#eff6ff",
                                        color: "#2563eb",
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      <Video size={12} strokeWidth={2.5} />{" "}
                                      Video
                                    </span>
                                  )}
                                  {sec.hasQuiz && (
                                    <span
                                      className="badge d-inline-flex align-items-center gap-1 py-1 px-2 rounded-2 fw-medium border-0"
                                      style={{
                                        backgroundColor: "#f0fdf4",
                                        color: "#16a34a",
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      <ClipboardCheck
                                        size={12}
                                        strokeWidth={2.5}
                                      />{" "}
                                      Quiz
                                    </span>
                                  )}
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

              <style>{`
               .last-child-no-border:last-child { border-bottom: 0 !important; }
               .hover-bg-light:hover { background-color: #f8fafc; }
            `}</style>
            </div>
          )}
          {isMain && (
            <div className="text-center pt-3">
              <button
                className="btn btn-primary px-5 py-2 rounded-3 fw-semibold d-inline-flex align-items-center gap-2"
                onClick={() => {
                  introFromUrlRef.current = false;
                  setShowIntro(false);
                  const first =
                    data.lessons.find((l) => !l.isCompleted) || data.lessons[0];
                  if (first) {
                    setActiveLesson(first);
                    setExpandedLessonId(first.lessonId);
                    const secs = getSections(first);
                    setActiveSection(secs.length > 0 ? secs[0].num : 1);
                  }
                }}
              >
                {t("startLearning")} <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSectionContent = () => {
    if (!activeLesson)
      return (
        <div className="h-100 d-flex align-items-center justify-content-center text-muted">
          {t("selectLesson")}
        </div>
      );

    const content = getContent(activeLesson, activeSection);
    const video = getVideo(activeLesson, activeSection);
    const showQuiz = getQuiz(activeLesson, activeSection);
    const sectionTitle =
      activeLesson.sections?.[activeSection - 1]?.title ??
      [
        activeLesson.section1Title,
        activeLesson.section2Title,
        activeLesson.section3Title,
        activeLesson.section4Title,
        activeLesson.section5Title,
      ][activeSection - 1] ??
      "Giới thiệu bài học";
    const lessonIdx = data.lessons.findIndex(
      (l) => l.lessonId === activeLesson.lessonId,
    );
    const videoWatched = finishedVideos.has(activeSection);

    /* Trang riêng bài tập trắc nghiệm khi click từ sidebar */
    if (sectionViewMode === "quiz" && showQuiz) {
      return (
        <div
          className="mx-auto bg-white rounded-3 border shadow-sm overflow-hidden"
          style={{ maxWidth: "900px", borderColor: "#e9ecef" }}
        >
          <div
            className="d-flex align-items-start justify-content-between gap-4 p-4 pb-3 border-bottom"
            style={{ borderColor: "#e9ecef" }}
          >
            <div className="flex-grow-1">
              <h2
                className="fw-bold mb-2 d-flex align-items-center gap-2"
                style={{ color: "#1a1a2e", fontSize: "1.5rem" }}
              >
                <ClipboardCheck size={24} className="text-success" />
                {t("quiz")}
              </h2>
              <p className="text-muted small mb-0">{sectionTitle}</p>
            </div>
            <div className="d-flex align-items-center gap-1 flex-shrink-0">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm rounded-circle p-2"
                onClick={goPrev}
                title="Quay lại nội dung"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm rounded-circle p-2"
                onClick={goNext}
                title="Bài tiếp"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className="p-4 p-md-5">
            <QuizSection
              courseId={courseId}
              lessonId={activeLesson.lessonId}
              section={activeSection}
              onComplete={(passed) => {
                if (passed)
                  markSectionDone(
                    activeLesson.lessonId,
                    `quiz_${activeSection}`,
                  );
              }}
              onQuizSubmitted={(data) =>
                trackEvent(
                  "QuizSubmitted",
                  "Quiz",
                  String(data.quizId),
                  JSON.stringify({
                    score: data.score,
                    isPassed: data.isPassed,
                    correctAnswers: data.correctAnswers,
                    totalQuestions: data.totalQuestions,
                  }),
                )
              }
              onToast={toast}
            />
          </div>
          <div
            className="d-flex justify-content-between align-items-center p-4 border-top"
            style={{ borderColor: "#e9ecef" }}
          >
            <button
              className="btn btn-outline-secondary px-4 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2"
              onClick={goPrev}
            >
              <ChevronLeft size={20} /> {t("backToContent")}
            </button>
            {(() => {
              const sections = getSections(activeLesson);
              const isLastSec = sections.findIndex(s => s.num === activeSection) === sections.length - 1;
              const isLastLesson = data.lessons.findIndex(l => l.lessonId === activeLesson.lessonId) === data.lessons.length - 1;
              const isLastStep = isLastSec && isLastLesson && sectionViewMode === "quiz";
              
              if (isLastStep) {
                return (
                  <button className="btn btn-success px-5 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2 shadow-sm" onClick={goNext}>
                    <CheckCircle2 size={20} /> Hoàn thành khóa học
                  </button>
                );
              }
              return (
                <button
                  className="btn btn-primary px-5 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2"
                  onClick={goNext}
                >
                  {t("next")} <ChevronRight size={20} />
                </button>
              );
            })()}
          </div>
        </div>
      );
    }

    return (
      <div
        className="mx-auto bg-white rounded-3 border shadow-sm overflow-hidden"
        style={{ maxWidth: "900px", borderColor: "#e9ecef" }}
      >
        {/* Header + Nav arrows + Bookmark */}
        <div
          className="d-flex align-items-start justify-content-between gap-4 p-4 pb-3 border-bottom"
          style={{ borderColor: "#e9ecef" }}
        >
          <div className="flex-grow-1">
            <h2
              className="fw-bold mb-2"
              style={{ color: "#1a1a2e", fontSize: "1.5rem" }}
            >
              {sectionTitle}
            </h2>
            <button
              type="button"
              className="btn btn-link p-0 text-body-secondary d-inline-flex align-items-center gap-2 small"
              onClick={toggleBookmark}
            >
              <Bookmark
                size={16}
                fill={isBookmarked() ? "currentColor" : "none"}
              />
              {t("bookmark")}
            </button>
          </div>
          <div className="d-flex align-items-center gap-1 flex-shrink-0">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm rounded-circle p-2"
              onClick={goPrev}
              title="Bài trước"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm rounded-circle p-2"
              onClick={goNext}
              title="Bài tiếp"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 p-md-5">
          {/* Mục tiêu bài học - chỉ hiện khi khác với nội dung (tránh lặp) */}
          {activeLesson.overview &&
            activeSection === 1 &&
            content !== activeLesson.overview && (
              <div className="mb-4">
                <h6
                  className="fw-bold mb-3 d-flex align-items-center gap-2"
                  style={{ color: "#1a1a2e", fontSize: "1rem" }}
                >
                  <FileText size={18} className="text-primary" />
                  {t("lessonObjectives")}
                </h6>
                <div
                  className="lesson-content"
                  style={{
                    color: "#4a5568",
                    lineHeight: 1.7,
                    fontSize: "0.95rem",
                  }}
                  dangerouslySetInnerHTML={{ __html: activeLesson.overview }}
                />
              </div>
            )}

          {/* Nội dung bài học */}
          {content ? (
            <div className="mb-4">
              <h6
                className="fw-bold mb-3 d-flex align-items-center gap-2"
                style={{ color: "#1a1a2e", fontSize: "1rem" }}
              >
                <BookOpen size={18} className="text-primary" />
                {t("lessonContent")}
              </h6>
              <div
                className="lesson-content"
                style={{
                  color: "#4a5568",
                  lineHeight: 1.7,
                  fontSize: "0.95rem",
                }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          ) : (
            !video.show && (
              <p
                className="text-secondary mb-4"
                style={{ fontSize: "0.95rem", lineHeight: 1.7 }}
              >
                Để học tốt bài học này, người học cần xem video bài giảng, đọc
                tài liệu kèm theo, thực hành và tham gia thảo luận.
              </p>
            )
          )}

          {/* Video nhúng trực tiếp trên trang */}
          {video.show && (video.urls?.length > 0 || video.ext) && (
            <div className="mb-4">
              <h6
                className="fw-bold mb-3 d-flex align-items-center gap-2"
                style={{ color: "#1a1a2e", fontSize: "1rem" }}
              >
                <Video size={18} className="text-primary" />
                {t("videoLecture")}
              </h6>
              <div className="d-flex flex-column gap-4">
                {(video.urls || []).map((url, vi) => (
                  <div
                    key={url}
                    className="ratio ratio-16x9 rounded-3 overflow-hidden bg-dark"
                  >
                    <VideoPlayer
                      src={url}
                      onPlay={() => {
                        lastActivityRef.current = Date.now();
                      }}
                      onTimeUpdate={() => {
                        lastActivityRef.current = Date.now();
                      }}
                      onEnded={() => {
                        setFinishedVideos(
                          (p) => new Set([...p, activeSection]),
                        );
                        markSectionDone(
                          activeLesson.lessonId,
                          `video_${activeSection}`,
                        );
                        trackEvent(
                          "VideoCompleted",
                          "Section",
                          `${activeLesson.lessonId}_${activeSection}`,
                          JSON.stringify({
                            lessonTitle: activeLesson.title,
                            sectionNum: activeSection,
                          }),
                        );
                      }}
                    />
                  </div>
                ))}
                {video.ext && (
                  <div className="ratio ratio-16x9 rounded-3 overflow-hidden bg-dark position-relative">
                    <iframe
                      className="w-100 h-100 border-0"
                      src={video.ext}
                      title="Video"
                      allowFullScreen
                    />
                    {!videoWatched && (
                      <button
                        className="btn btn-primary btn-sm position-absolute bottom-0 end-0 m-3 shadow rounded-pill px-3 py-2 fw-bold"
                        onClick={() => {
                          setFinishedVideos(
                            (p) => new Set([...p, activeSection]),
                          );
                          markSectionDone(
                            activeLesson.lessonId,
                            `video_${activeSection}`,
                          );
                          trackEvent(
                            "VideoCompleted",
                            "Section",
                            `${activeLesson.lessonId}_${activeSection}`,
                            JSON.stringify({
                              lessonTitle: activeLesson.title,
                              sectionNum: activeSection,
                              skipped: true,
                            }),
                          );
                        }}
                      >
                        {t("videoWatched")} <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              {videoWatched && (
                <span className="badge bg-success rounded-pill mt-2 small">
                  {t("watched")} ✓
                </span>
              )}
            </div>
          )}

          {/* Tài liệu bài học */}
          {getDocs(activeLesson, activeSection).show &&
            getDocs(activeLesson, activeSection).urls?.length > 0 && (
              <div className="mb-4">
                <h6
                  className="fw-bold mb-3 d-flex align-items-center gap-2"
                  style={{ color: "#1a1a2e", fontSize: "1rem" }}
                >
                  <FileText size={18} className="text-info" />
                  Tài liệu bài học
                </h6>
                <div className="list-group list-group-flush rounded-3 border">
                  {getDocs(activeLesson, activeSection).urls.map((url, di) => (
                    <a
                      key={url}
                      href={getUploadUrl(url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="list-group-item list-group-item-action d-flex align-items-center justify-content-between py-3 px-4 bg-light bg-opacity-50"
                    >
                      <div className="d-flex align-items-center gap-3 overflow-hidden">
                        <div className="bg-info bg-opacity-10 p-2 rounded-2 text-info">
                          <FileText size={20} />
                        </div>
                        <div className="overflow-hidden">
                          <div className="fw-bold text-dark text-truncate small">
                            {url.split("/").pop()?.split("?")[0] ||
                              "Tai_lieu_hoc_tap"}
                          </div>
                          <div className="extra-small text-muted text-uppercase">
                            Bấm để xem hoặc tải về
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-muted" />
                    </a>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Nav buttons dưới */}
        <div
          className="d-flex justify-content-between align-items-center p-4 border-top"
          style={{ borderColor: "#e9ecef" }}
        >
          <button
            className="btn btn-outline-secondary px-4 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2"
            onClick={goPrev}
          >
            <ChevronLeft size={20} /> {t("prev")}
          </button>
          {(() => {
              const sections = getSections(activeLesson);
              const isLastSec = sections.findIndex(s => s.num === activeSection) === sections.length - 1;
              const isLastLesson = data.lessons.findIndex(l => l.lessonId === activeLesson.lessonId) === data.lessons.length - 1;
              
              const hasVideo = getVideo(activeLesson, activeSection).show;
              const hasQuiz = getQuiz(activeLesson, activeSection);
              const isLastMode = (sectionViewMode === "quiz") || (sectionViewMode === "video" && !hasQuiz) || (sectionViewMode === "content" && !hasVideo && !hasQuiz);

              const isLastStep = isLastSec && isLastLesson && isLastMode;
              
              if (isLastStep) {
                return (
                  <button className="btn btn-success px-5 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2 shadow-sm" onClick={goNext}>
                    <CheckCircle2 size={20} /> Hoàn thành khóa học
                  </button>
                );
              }
              return (
                <button
                  className="btn btn-primary px-5 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2"
                  onClick={goNext}
                >
                  {t("next")} <ChevronRight size={20} />
                </button>
              );
            })()}
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-white">
        <Loader2 className="animate-spin text-primary mb-3" size={48} />
        <h5 className="fw-bold text-secondary">{t("preparingContent")}</h5>
      </div>
    );

  if (!data)
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-white">
        <h5 className="fw-bold text-danger">
          Không tìm thấy dữ liệu khóa học.
        </h5>
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate("/dashboard")}
        >
          Quay lại Dashboard
        </button>
      </div>
    );

  return (
    <div
      className="min-vh-100 d-flex flex-column overflow-hidden"
      style={{ backgroundColor: "#f8fafc" }}
    >
      {/* Header - Nút quay lại, Mã khóa, Tên khóa (theo hình tham chiếu) */}
      <header
        className="bg-white sticky-top"
        style={{
          zIndex: 1000,
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div className="px-4 px-md-5 py-3">
          <div className="d-flex flex-wrap align-items-flex-start justify-content-between gap-3">
            <div className="d-flex align-items-flex-start gap-3 min-width-0 flex-grow-1">
              {/* Removed back button as requested */}
              <div className="min-width-0 flex-grow-1" style={{ minWidth: 0 }}>
                <div
                  className="mb-1"
                  style={{
                    fontSize: "0.875rem",
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  {data.courseCode || "—"}
                </div>
                <h1
                  className="fw-bold mb-0"
                  style={{
                    color: "#0f172a",
                    fontSize: "1.25rem",
                    lineHeight: 1.35,
                    letterSpacing: "-0.02em",
                    wordBreak: "break-word",
                  }}
                >
                  {data.courseTitle}
                </h1>
                {activeLesson && !showIntro && (
                  <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                    <span className="text-muted small">
                      Bài{" "}
                      {data.lessons.findIndex(
                        (l) => l.lessonId === activeLesson.lessonId,
                      ) + 1}
                      :
                    </span>
                    <span
                      className="fw-semibold small"
                      style={{ color: "#475569", wordBreak: "break-word" }}
                    >
                      {activeLesson.title}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="d-flex align-items-center gap-3 flex-shrink-0">
              <button
                className="btn btn-outline-secondary rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-2 transition-all hover-bg-light"
                style={{ fontSize: '0.85rem' }}
                onClick={() => navigate(`/course/${courseId}`)}
              >
                <X size={18} /> Quay về trang khóa học
              </button>
              <button
                className="btn btn-light rounded-circle p-2 border"
                style={{ borderColor: "#e2e8f0" }}
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                title={isSidebarOpen ? "Thu gọn mục lục" : "Mở mục lục"}
              >
                {isSidebarOpen ? (
                  <X size={20} style={{ color: "#475569" }} />
                ) : (
                  <Menu size={20} style={{ color: "#475569" }} />
                )}
              </button>
            </div>
          </div>
        </div>
        <nav
          className="nav border-0 px-4 px-md-5 gap-1 pb-2"
          style={{ borderTop: "1px solid #f1f5f9" }}
        >
          {headerTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`nav-link fw-semibold rounded-3 px-3 py-2 border-0 d-inline-flex align-items-center gap-2 ${headerTab === tab.id ? "bg-primary text-white shadow-sm" : "text-body-secondary"}`}
                style={{ fontSize: "0.9rem" }}
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
        {/* Sidebar trái - Mục lục chuẩn giáo án hiện đại */}
        <aside
          className={`bg-white border-end flex-shrink-0 d-flex flex-column overflow-hidden ${!isSidebarOpen ? "toc-collapsed" : ""}`}
          style={{
            width: isSidebarOpen ? "360px" : 0,
            minWidth: isSidebarOpen ? "360px" : 0,
            borderColor: "#e2e8f0",
            zIndex: 10,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Header Sidebar: Bài đang học & Navigation */}
          <div className="p-3 border-bottom flex-shrink-0 d-flex align-items-center justify-content-between bg-white sticky-top">
            <div className="d-flex align-items-center gap-2 overflow-hidden">
              {/* Removed back button as requested */}
              <h6
                className="fw-bold mb-0 text-truncate"
                style={{ fontSize: "1rem", color: "#111827" }}
              >
                {activeLesson
                  ? `Bài ${data.lessons.indexOf(activeLesson) + 1}: ${activeLesson.title}`
                  : data.title}
              </h6>
            </div>
            <button className="btn btn-light btn-sm rounded-2 p-1 border-0">
              <AlignRight size={18} className="text-secondary" />
            </button>
          </div>

          <div className="overflow-auto flex-grow-1 p-3 bg-light bg-opacity-10">
            {/* 1. Phần Giới thiệu - Card Style */}
            <div className="card border-0 shadow-sm rounded-3 mb-3 overflow-hidden">
              <div
                className="card-header bg-white py-3 px-4 border-0 d-flex align-items-center justify-content-between cursor-pointer"
                onClick={() => setExpandedIntro(!expandedIntro)}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="status-icon">
                    {introContentViewed || introVideoWatched ? (
                      <CheckCircle2
                        size={24}
                        className="text-success fill-success bg-white rounded-circle"
                      />
                    ) : (
                      <Circle size={24} style={{ color: "#d1d5db" }} />
                    )}
                  </div>
                  <span
                    className="fw-bold text-dark"
                    style={{ fontSize: "0.95rem" }}
                  >
                    Giới thiệu học phần
                  </span>
                </div>
                {expandedIntro ? (
                  <ChevronUp size={20} className="text-muted" />
                ) : (
                  <ChevronDown size={20} className="text-muted" />
                )}
              </div>

              {expandedIntro && (
                <div
                  className="card-body p-0 border-top mt-0"
                  style={{ backgroundColor: "#fff" }}
                >
                  <div
                    className={`d-flex align-items-center gap-3 py-3 px-4 border-bottom cursor-pointer transition-all ${showIntro && activeIntroIdx === null ? "bg-primary text-white shadow-sm" : "hover-bg-light"}`}
                    onClick={() => {
                      setShowIntro(true);
                      setActiveIntroIdx(null);
                      setExpandedLessonId(null);
                    }}
                  >
                    <Monitor 
                      size={20} 
                      className={showIntro && activeIntroIdx === null ? "text-white" : introContentViewed ? "text-success" : "text-secondary"} 
                    />
                    <span
                      className="flex-grow-1"
                      style={{
                        fontSize: "0.9rem",
                        color: showIntro && activeIntroIdx === null ? "#fff" : "#374151",
                        fontWeight: showIntro && activeIntroIdx === null ? 700 : 500,
                      }}
                    >
                      Nội dung giới thiệu
                    </span>
                    {introContentViewed && (
                      <CheckCircle2 size={16} className="text-success" />
                    )}
                  </div>

                  {data.showIntroVideo &&
                    (data.introVideoUrl || data.introExternalVideoUrl) && (
                      <div
                        className={`d-flex align-items-center gap-3 py-3 px-4 cursor-pointer transition-all ${showIntro && activeIntroIdx === -1 ? "bg-primary bg-opacity-5" : "hover-bg-light"}`}
                        onClick={() => {
                          setShowIntro(true);
                          setActiveIntroIdx(null);
                          setExpandedLessonId(null);
                        }}
                      >
                        <PlayCircle size={20} className="text-success" />
                        <span
                          className="flex-grow-1"
                          style={{
                            fontSize: "0.9rem",
                            color: "#374151",
                            fontWeight: 500,
                          }}
                        >
                          {t("introVideoShort")}
                        </span>
                        {introVideoWatched && (
                          <CheckCircle2 size={16} className="text-success" />
                        )}
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* 2. Danh sách Bài học & Chương mục */}
            {(data.lessons || []).map((lesson, idx) => {
              const sections = getSections(lesson);
              return (sections || []).map((sec, sIdx) => {
                const isActiveSection =
                  activeLesson?.lessonId === lesson.lessonId &&
                  activeSection === sec.num &&
                  !showIntro;
                const isContentDone =
                  sectionProgress[`${lesson.lessonId}_${sec.num}`];
                const isVideoDone =
                  sectionProgress[`${lesson.lessonId}_video_${sec.num}`];
                const isQuizDone =
                  sectionProgress[`${lesson.lessonId}_quiz_${sec.num}`];
                const totalItems =
                  1 + (sec.hasVideo ? 1 : 0) + (sec.hasQuiz ? 1 : 0);
                const doneItems =
                  (isContentDone ? 1 : 0) +
                  (isVideoDone ? 1 : 0) +
                  (isQuizDone ? 1 : 0);
                const isAllDone = totalItems === doneItems;

                // Unique key for each section card
                const secKey = `${lesson.lessonId}_${sec.num}`;
                const isExpanded = expandedSections.has(secKey);

                return (
                  <div
                    key={secKey}
                    className={`card border-0 shadow-sm rounded-3 mb-3 overflow-hidden ${isActiveSection ? "ring-primary" : ""}`}
                  >
                    <div
                      className="card-header bg-white py-3 px-4 border-0 d-flex align-items-center justify-content-between cursor-pointer"
                      onClick={() => {
                        const next = new Set(expandedSections);
                        if (next.has(secKey)) {
                          next.delete(secKey);
                        } else {
                          next.add(secKey);
                          // Nếu đang không học bài này thì chuyển sang học bài này khi mở card
                          if (!isActiveSection) {
                            setExpandedLessonId(lesson.lessonId);
                            handleSelectSection(lesson, sec.num);
                            setShowIntro(false);
                          }
                        }
                        setExpandedSections(next);
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div className="status-icon">
                          {isAllDone ? (
                            <CheckCircle2
                              size={24}
                              className="text-success"
                              strokeWidth={2.5}
                            />
                          ) : doneItems > 0 ? (
                            <Loader2
                              size={24}
                              className="text-primary spin-slow"
                              strokeWidth={2.5}
                            />
                          ) : (
                            <Circle
                              size={24}
                              style={{ color: "#d1d5db" }}
                              strokeWidth={2.5}
                            />
                          )}
                        </div>
                        <span
                          className={`fw-bold ${isActiveSection ? "text-primary" : "text-dark"}`}
                          style={{ fontSize: "0.95rem" }}
                        >
                          {sec.title || `Học phần ${sec.num}`}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={20} className="text-muted" />
                      ) : (
                        <ChevronDown size={20} className="text-muted" />
                      )}
                    </div>

                    {isExpanded && (
                      <div
                        className="card-body p-0 border-top mt-0"
                        style={{ backgroundColor: "#fff" }}
                      >
                        <div
                          className={`d-flex align-items-center gap-3 py-3 px-4 border-bottom cursor-pointer transition-all ${isActiveSection && sectionViewMode === "content" ? "bg-primary text-white shadow-sm" : "hover-bg-light"}`}
                          onClick={() =>
                            handleSelectSection(lesson, sec.num, "content")
                          }
                        >
                          <BookText
                            size={20}
                            className={
                              isActiveSection && sectionViewMode === "content"
                                ? "text-white"
                                : isContentDone
                                  ? "text-success"
                                  : "text-secondary"
                            }
                          />
                          <span
                            className="flex-grow-1"
                            style={{
                              fontSize: "0.9rem",
                              color: isActiveSection && sectionViewMode === "content" ? "#fff" : "#374151",
                              fontWeight:
                                isActiveSection && sectionViewMode === "content"
                                  ? 700
                                  : 500,
                            }}
                          >
                            Tài liệu học tập bài học
                          </span>
                          {isContentDone && (
                            <CheckCircle2
                              size={16}
                              className={
                                isActiveSection && sectionViewMode === "content"
                                  ? "text-white opacity-75"
                                  : "text-success"
                              }
                            />
                          )}
                        </div>

                        {/* 2. Video bài học */}
                        {sec.hasVideo && (
                          <div
                            className={`d-flex align-items-center gap-3 py-3 px-4 border-bottom cursor-pointer transition-all ${isActiveSection && sectionViewMode === "video" ? "bg-primary text-white shadow-sm" : "hover-bg-light"}`}
                            onClick={() =>
                              handleSelectSection(lesson, sec.num, "video")
                            }
                          >
                            <PlaySquare
                              size={20}
                              className={
                                isActiveSection && sectionViewMode === "video"
                                  ? "text-white"
                                  : isVideoDone
                                    ? "text-success"
                                    : "text-secondary"
                              }
                            />
                            <span
                              className="flex-grow-1"
                              style={{
                                fontSize: "0.9rem",
                                color: isActiveSection && sectionViewMode === "video" ? "#fff" : "#374151",
                                fontWeight:
                                  isActiveSection && sectionViewMode === "video"
                                    ? 700
                                    : 500,
                              }}
                            >
                              Video bài học
                            </span>
                            {isVideoDone && (
                              <CheckCircle2
                                size={16}
                                className={
                                  isActiveSection && sectionViewMode === "video"
                                    ? "text-white opacity-75"
                                    : "text-success"
                                }
                              />
                            )}
                          </div>
                        )}

                        {/* 3. Bài tập trắc nghiệm */}
                        {sec.hasQuiz && (
                          <div
                            className={`d-flex align-items-center gap-3 py-3 px-4 cursor-pointer transition-all ${isActiveSection && sectionViewMode === "quiz" ? "bg-primary text-white shadow-sm" : "hover-bg-light"}`}
                            onClick={() =>
                              handleSelectSection(lesson, sec.num, "quiz")
                            }
                          >
                            <PenTool
                              size={20}
                              className={
                                isActiveSection && sectionViewMode === "quiz"
                                  ? "text-white"
                                  : isQuizDone
                                    ? "text-success"
                                    : "text-secondary"
                              }
                            />
                            <span
                              className="flex-grow-1"
                              style={{
                                fontSize: "0.9rem",
                                color: isActiveSection && sectionViewMode === "quiz" ? "#fff" : "#374151",
                                fontWeight:
                                  isActiveSection && sectionViewMode === "quiz"
                                    ? 700
                                    : 500,
                              }}
                            >
                              Bài tập trắc nghiệm
                            </span>
                            {isQuizDone && (
                              <CheckCircle2
                                size={16}
                                className={
                                  isActiveSection && sectionViewMode === "quiz"
                                    ? "text-white opacity-75"
                                    : "text-success"
                                }
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              });
            })}
          </div>

          <style>{`
            .hover-bg-light:hover { background-color: #f9fafb; }
            .toc-active-item { background-color: rgba(99, 102, 241, 0.08); }
            .ring-primary { ring: 2px solid #6366f1; border: 1px solid #6366f1 !important; }
            .spin-slow { animation: spin 3s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .status-icon svg { transition: all 0.2s ease; }
          `}</style>
        </aside>

        {/* Nội dung chính bên phải */}
        <main
          className="flex-grow-1 overflow-auto p-4 p-md-5"
          style={{ backgroundColor: "#fafafa" }}
        >
          {headerTab === "content" &&
            (showIntro ? renderIntro() : renderSectionContent())}

          {headerTab === "dates" && (
            <div
              className="mx-auto bg-white rounded-3 border shadow-sm p-5"
              style={{ maxWidth: "900px", borderColor: "#e9ecef" }}
            >
              <h5
                className="fw-bold mb-4 d-flex align-items-center gap-2"
                style={{ color: "#1a1a2e" }}
              >
                <Calendar size={22} className="text-primary" />{" "}
                {t("importantDates")}
              </h5>
              <div className="d-flex flex-column gap-3">
                <div
                  className="p-3 rounded-3 border"
                  style={{ backgroundColor: "#f8fafc", borderColor: "#e9ecef" }}
                >
                  <span className="text-muted small">{t("startDate")}</span>
                  <div className="fw-bold" style={{ color: "#0f172a" }}>
                    {data.startDate
                      ? new Date(data.startDate).toLocaleDateString(
                          lang === "vi" ? "vi-VN" : "en-US",
                        )
                      : "—"}
                  </div>
                </div>
                <div
                  className="p-3 rounded-3 border"
                  style={{ backgroundColor: "#f8fafc", borderColor: "#e9ecef" }}
                >
                  <span className="text-muted small">{t("endDate")}</span>
                  <div className="fw-bold" style={{ color: "#0f172a" }}>
                    {data.endDate
                      ? new Date(data.endDate).toLocaleDateString(
                          lang === "vi" ? "vi-VN" : "en-US",
                        )
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
          )}
          {headerTab === "discussion" && (
            <div
              className="mx-auto bg-white rounded-4 border shadow-sm p-4 p-md-5"
              style={{ maxWidth: "900px", borderColor: "#f1f5f9" }}
            >
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold m-0 d-flex align-items-center gap-2" style={{ color: "#0f172a" }}>
                  <MessageSquare size={24} className="text-primary" /> Thảo luận bài học
                </h5>
                <button className="btn btn-light btn-sm rounded-pill px-3" onClick={fetchDiscussions}>
                  Tải lại
                </button>
              </div>

              {/* Comment Input */}
              <div className="mb-5 bg-light p-3 rounded-4 border">
                <textarea 
                  className="form-control border-0 bg-transparent shadow-none" 
                  rows="3" 
                  placeholder="Chia sẻ suy nghĩ hoặc đặt câu hỏi của bạn..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  style={{ resize: "none" }}
                ></textarea>
                <div className="d-flex justify-content-end mt-2">
                  <button 
                    className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                    onClick={handlePostComment}
                    disabled={isPostingComment || !commentInput.trim()}
                  >
                    {isPostingComment ? <Loader2 className="animate-spin" size={18} /> : "Gửi thảo luận"}
                  </button>
                </div>
              </div>

              {/* Discussion List */}
              <div className="d-flex flex-column gap-4">
                {discussions.length === 0 ? (
                  <div className="text-center py-5">
                    <MessageSquare className="text-muted opacity-25 mb-2 mx-auto" size={48} />
                    <p className="text-secondary small">Chưa có thảo luận nào. Hãy là người đầu tiên!</p>
                  </div>
                ) : (
                  discussions.map((d) => (
                    <div key={d.id} className="d-flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: 40, height: 40 }}>
                          {d.user?.fullName?.[0] || "U"}
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <div className="bg-light p-3 rounded-4 border">
                          <div className="d-flex justify-content-between mb-1">
                            <span className="fw-bold small text-dark">{d.user?.fullName}</span>
                            <span className="text-muted" style={{ fontSize: "0.75rem" }}>{new Date(d.createdAt).toLocaleString("vi-VN")}</span>
                          </div>
                          <p className="mb-0 text-secondary" style={{ fontSize: "0.95rem", lineHeight: 1.5 }}>{d.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {headerTab === "notes" && (
            <div
              className="mx-auto bg-white rounded-4 border shadow-sm p-4 p-md-5"
              style={{ maxWidth: "900px", borderColor: "#f1f5f9" }}
            >
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold m-0 d-flex align-items-center gap-2" style={{ color: "#0f172a" }}>
                  <StickyNote size={24} className="text-primary" /> Ghi chú học tập
                </h5>
                <button 
                  className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
                  onClick={handleSaveNote}
                  disabled={isSavingNote || showIntro}
                >
                  {isSavingNote ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Lưu ghi chú
                </button>
              </div>

              {showIntro ? (
                <div className="text-center py-5 bg-light rounded-4 border border-dashed">
                  <StickyNote className="text-muted opacity-25 mb-2 mx-auto" size={48} />
                  <p className="text-secondary">Bạn chỉ có thể ghi chú cho từng bài học cụ thể.</p>
                </div>
              ) : noteLoading ? (
                <div className="text-center py-5">
                  <Loader2 className="animate-spin text-primary mx-auto" size={32} />
                </div>
              ) : (
                <div className="position-relative">
                  <textarea 
                    className="form-control border-0 p-4 rounded-4 shadow-sm" 
                    rows="15" 
                    placeholder="Viết ghi chú của bạn tại đây... Hệ thống sẽ lưu lại cho từng bài học."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    style={{ 
                      backgroundColor: "#fffdf0", 
                      fontSize: "1rem", 
                      lineHeight: 1.6,
                      border: "1px solid #fef3c7 !important"
                    }}
                  ></textarea>
                  <div className="position-absolute bottom-0 end-0 m-3 px-3 py-1 bg-warning bg-opacity-10 text-warning rounded-pill small fw-bold">
                    Tự động lưu...
                  </div>
                </div>
              )}
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

      {showFinishModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 2000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden text-center p-5">
              <div className="mb-4">
                <div 
                  className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 mb-4"
                  style={{ width: 80, height: 80 }}
                >
                  <Award size={48} className="text-success" />
                </div>
                <h3 className="fw-bold text-dark mb-2">Chúc mừng bạn!</h3>
                <p className="text-muted">Bạn đã hoàn thành toàn bộ khóa học <strong>{data?.courseTitle}</strong></p>
              </div>

              <div className="bg-light p-4 rounded-3 mb-4">
                <div className="d-flex align-items-center justify-content-center gap-3 mb-2">
                   <ProgressCircle percentage={100} size={60} />
                   <div className="text-start">
                      <div className="fw-bold text-dark">Hoàn tất 100%</div>
                      <div className="small text-muted">Tất cả bài học đã được chinh phục</div>
                   </div>
                </div>
              </div>

              <div className="d-grid gap-3">
                <button 
                  className="btn btn-primary py-3 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                  onClick={() => navigate(`/course/${courseId}`)}
                >
                   <CheckCircle2 size={18} /> Xem chứng chỉ & Đánh giá
                </button>
                <button 
                  className="btn btn-outline-secondary py-3 rounded-3 fw-bold"
                  onClick={() => setShowFinishModal(false)}
                >
                  Tiếp tục xem lại bài học
                </button>
                <button 
                  className="btn btn-link text-decoration-none text-muted small"
                  onClick={() => navigate("/dashboard")}
                >
                  Quay về trang chủ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningView;
