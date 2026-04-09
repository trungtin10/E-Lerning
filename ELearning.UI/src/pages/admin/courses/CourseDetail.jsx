import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import TiptapEditor from '../../../components/common/TiptapEditor';
import VideoPlayer from '../../../components/common/VideoPlayer';
import { useNotify } from '../../../context/NotifyContext';
import QuizSectionInline from '../../../components/admin/QuizSectionInline';
import {
  Plus, Video, Loader2, ArrowLeft, Trash2, Minus,
  Save, Upload, ClipboardCheck,
  Info, BookOpen, RefreshCw, HelpCircle, GripVertical, Star, Eye, AlertCircle, CheckCircle2,
  ChevronDown, ChevronUp, MoreVertical, LayoutList, BarChart3
} from 'lucide-react';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeItem, setActiveItem] = useState({ type: 'intro' });
  const defaultSections = () => [
    { title: '1. Phần nội dung', content: '', showVideo: false, showQuiz: false, videoUrls: [] }
  ];
  const [editData, setEditData] = useState({
    title: '', scheduledDate: '', description: '',
    sections: defaultSections(),
    showIntroVideo: false, introVideoUrl: '', introExternalVideoUrl: ''
  });

  const [videoFiles, setVideoFiles] = useState({ intro: null });
  const [localPreviews, setLocalPreviews] = useState({ intro: '' });
  const [submitting, setSubmitting] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  /** Thu gọn / mở rộng danh sách bài giảng (kiểu Canvas) */
  const [lessonsExpanded, setLessonsExpanded] = useState(true);
  const { toast, confirm } = useNotify();
  const showToast = toast;

  useEffect(() => {
    fetchCourseDetail();
  }, [id]);

  // Khôi phục tab/lesson từ URL khi load lại trang
  useEffect(() => {
    if (!course) return;
    const tab = searchParams.get('tab');
    const lessonId = searchParams.get('lesson');
    if (tab === 'intro' || (!tab && !lessonId)) {
      setActiveItem({ type: 'intro' });
      if (!tab && !lessonId) setSearchParams({ tab: 'intro' }, { replace: true });
    } else if (lessonId) {
      const lid = parseInt(lessonId, 10);
      const lesson = course.lessons?.find(l => l.id === lid);
      if (lesson) setActiveItem({ type: 'ls', data: lesson });
    }
  }, [course?.id, searchParams.get('tab'), searchParams.get('lesson')]);

  useEffect(() => {
    if (activeItem.type === 'ls' && course && activeItem.data) {
      const currentLesson = course.lessons?.find(l => l.id === activeItem.data.id);
      if (currentLesson) {
        let sections;
        const apiSections = currentLesson.sections || currentLesson.Sections;
        if (apiSections && Array.isArray(apiSections) && apiSections.length > 0) {
          sections = apiSections.map(s => {
            const urls = (s.videoUrls ?? s.VideoUrls) ?? [];
            const single = (s.videoUrl ?? s.VideoUrl) || '';
            const videoUrls = Array.isArray(urls) && urls.length > 0 ? urls : (single ? [single] : []);
            return {
              title: (s.title ?? s.Title) || '',
              content: (s.content ?? s.Content) ?? '',
              showVideo: Boolean(s.showVideo ?? s.ShowVideo),
              showQuiz: Boolean(s.showQuiz ?? s.ShowQuiz),
              videoUrls
            };
          });
        } else {
          const hasContent = !!(currentLesson.overview?.trim() || currentLesson.content?.trim() || currentLesson.reviewContent?.trim() || currentLesson.essayQuestion?.trim());
          const hasMedia = !!(currentLesson.videoUrl1 || currentLesson.videoUrl2 || currentLesson.videoUrl3 || currentLesson.videoUrl4 || currentLesson.videoUrl5);
          const hasQuiz = !!(currentLesson.showQuiz1 || currentLesson.showQuiz2 || currentLesson.showQuiz3 || currentLesson.showQuiz4 || currentLesson.showQuiz5);
          if (!hasContent && !hasMedia && !hasQuiz) {
            sections = [{ title: '1. Phần nội dung', content: '', showVideo: false, showQuiz: false, videoUrls: [] }];
          } else {
            sections = [
              { title: currentLesson.section1Title || '1. Giới thiệu bài học', content: currentLesson.overview || '', showVideo: Boolean(currentLesson.showVideo1), showQuiz: Boolean(currentLesson.showQuiz1), videoUrls: currentLesson.videoUrl1 ? [currentLesson.videoUrl1] : [] },
              { title: currentLesson.section2Title || '2. Bài giảng chi tiết', content: currentLesson.content || '', showVideo: Boolean(currentLesson.showVideo2), showQuiz: Boolean(currentLesson.showQuiz2), videoUrls: currentLesson.videoUrl2 ? [currentLesson.videoUrl2] : [] },
              { title: currentLesson.section3Title || '3. Phần ôn tập', content: currentLesson.reviewContent || '', showVideo: Boolean(currentLesson.showVideo3), showQuiz: Boolean(currentLesson.showQuiz3), videoUrls: currentLesson.videoUrl3 ? [currentLesson.videoUrl3] : [] },
              { title: currentLesson.section4Title || '4. Câu hỏi tự luận', content: currentLesson.essayQuestion || '', showVideo: Boolean(currentLesson.showVideo4), showQuiz: Boolean(currentLesson.showQuiz4), videoUrls: currentLesson.videoUrl4 ? [currentLesson.videoUrl4] : [] },
              { title: currentLesson.section5Title || '5. Tổng kết bài học', content: '', showVideo: Boolean(currentLesson.showVideo5), showQuiz: Boolean(currentLesson.showQuiz5), videoUrls: currentLesson.videoUrl5 ? [currentLesson.videoUrl5] : [] }
            ];
          }
        }
        setEditData({
          title: currentLesson.title || '',
          scheduledDate: currentLesson.scheduledDate ? new Date(currentLesson.scheduledDate).toISOString().split('T')[0] : '',
          sections
        });
        setVideoFiles({ intro: null });
        setLocalPreviews({ intro: '' });
      }
    } else if (activeItem.type === 'intro' && course) {
      setEditData(prev => ({
        ...prev,
        description: course.description || '',
        showIntroVideo: Boolean(course.showIntroVideo),
        introVideoUrl: course.introVideoUrl || '',
        introExternalVideoUrl: course.introExternalVideoUrl || ''
      }));
    }
  }, [activeItem.data?.id, activeItem.type, course]);

  const fetchCourseDetail = async () => {
    try {
      const response = await api.get(`/course/${id}`);
      setCourse(response.data);
      setLoading(false);
      return response.data;
    } catch (err) { setError("Lỗi tải dữ liệu."); setLoading(false); return null; }
  };

  const handleSaveIntro = async (saveType = 'all') => {
    if (!course) return;
    setSubmitting(true);
    const data = new FormData();
    data.append('CourseCode', course.courseCode || '');
    data.append('Title', course.title || '');
    data.append('Description', editData.description || '');
    data.append('IsPublished', course.isPublished ? 'true' : 'false');
    data.append('ShowIntroVideo', editData.showIntroVideo ? 'true' : 'false');
    data.append('IntroExternalVideoUrl', editData.introExternalVideoUrl || '');
    if (videoFiles.intro) data.append('IntroVideoFile', videoFiles.intro);

    try {
      await api.put(`/course/${id}`, data);
      const msg = saveType === 'content' ? 'Đã lưu nội dung!' : saveType === 'video' ? 'Đã lưu video!' : 'Đã lưu giới thiệu khóa học!';
      showToast(msg);
      await fetchCourseDetail();
    } catch (err) { showToast('Lỗi khi lưu.', 'error'); } finally { setSubmitting(false); }
  };

  const handleSaveLesson = async (num, saveType = 'all') => {
    if (!activeItem.data?.id) return;
    setSubmitting(true);
    const data = new FormData();
    const sectionsForApi = editData.sections.map(s => ({
      title: s.title,
      content: s.content,
      showVideo: s.showVideo,
      showQuiz: s.showQuiz,
      videoUrls: s.videoUrls || [],
      videoUrl: (s.videoUrls && s.videoUrls[0]) || null
    }));
    data.append('Title', editData.title);
    data.append('ScheduledDate', editData.scheduledDate || '');
    data.append('SectionsJson', JSON.stringify(sectionsForApi));

    editData.sections.forEach((_, i) => {
      const files = Array.isArray(videoFiles[i]) ? videoFiles[i] : (videoFiles[i] ? [videoFiles[i]] : []);
      files.forEach((f, fi) => f && data.append(`VideoFile_${i}_${fi}`, f));
    });

    try {
      const res = await api.put(`/course/lessons/${activeItem.data.id}`, data);
      if (res.data?.sections) {
        setEditData(prev => ({ ...prev, sections: res.data.sections }));
        setVideoFiles(prev => {
          const next = { ...prev };
          editData.sections.forEach((_, i) => delete next[i]);
          return next;
        });
        setLocalPreviews(prev => {
          const next = { ...prev };
          editData.sections.forEach((_, i) => delete next[i]);
          return next;
        });
      } else if (saveType !== 'content') {
        await fetchCourseDetail();
      }
      const msg = saveType === 'content' ? 'Đã lưu nội dung!' : saveType === 'video' ? 'Đã lưu video!' : 'Đã lưu!';
      showToast(msg);
    } catch (err) { showToast('Lỗi khi lưu.', 'error'); } finally { setSubmitting(false); }
  };

  const onFileChange = (sectionIndex, files) => {
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      setVideoFiles(prev => ({ ...prev, [sectionIndex]: [...(prev[sectionIndex] || []), ...fileList] }));
      setLocalPreviews(prev => ({
        ...prev,
        [sectionIndex]: [...(prev[sectionIndex] || []), ...fileList.map(f => URL.createObjectURL(f))]
      }));
    }
  };

  const handleDeleteVideo = async (sectionIndex, sectionNum, videoIndex, isLocalPreview) => {
    const ok = await confirm({ title: 'Xóa video', message: 'Bạn có chắc chắn muốn xóa video này?', confirmText: 'Xóa' });
    if (!ok) return;
    try {
      if (sectionIndex === 'intro') {
        await api.delete(`/course/${id}/video`);
        setEditData(prev => ({ ...prev, introVideoUrl: '' }));
        setLocalPreviews(prev => ({ ...prev, intro: '' }));
        setVideoFiles(prev => ({ ...prev, intro: null }));
      } else if (isLocalPreview) {
        setVideoFiles(prev => {
          const arr = [...(prev[sectionIndex] || [])];
          arr.splice(videoIndex, 1);
          const next = { ...prev };
          if (arr.length) next[sectionIndex] = arr; else delete next[sectionIndex];
          return next;
        });
        setLocalPreviews(prev => {
          const arr = [...(prev[sectionIndex] || [])];
          if (arr[videoIndex]) URL.revokeObjectURL(arr[videoIndex]);
          arr.splice(videoIndex, 1);
          const next = { ...prev };
          if (arr.length) next[sectionIndex] = arr; else delete next[sectionIndex];
          return next;
        });
      } else {
        await api.delete(`/course/lessons/${activeItem.data.id}/video/${sectionNum}`, { params: { videoIndex } });
        await fetchCourseDetail();
      }
      showToast('Đã xóa video.');
      if (!isLocalPreview) await fetchCourseDetail();
    } catch (err) {
      showToast('Lỗi khi xóa video.', 'error');
    }
  };

  const updateSection = (index, field, value) => {
    setEditData(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const addSection = () => {
    const n = editData.sections.length + 1;
    setEditData(prev => ({
      ...prev,
      sections: [...prev.sections, { title: `${n}. Phần mới`, content: '', showVideo: false, showQuiz: false, videoUrls: [] }]
    }));
  };

  const removeSection = async (index) => {
    if (editData.sections.length <= 1) return;
    const ok = await confirm({ title: 'Xóa phần', message: 'Xóa phần này?', confirmText: 'Xóa' });
    if (!ok) return;
    setEditData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
    setVideoFiles(prev => { const next = { ...prev }; delete next[index]; return next; });
    setLocalPreviews(prev => { const next = { ...prev }; delete next[index]; return next; });
  };

  const sectionIcons = [<Info size={20} className="text-info" key="i1" />, <BookOpen size={20} className="text-primary" key="i2" />, <RefreshCw size={20} className="text-success" key="i3" />, <HelpCircle size={20} className="text-warning" key="i4" />, <CheckCircle2 size={20} className="text-dark" key="i5" />];

  const renderSection = (index, section, num) => (
    <div key={index} className="mb-3 p-3 border rounded-4 bg-white shadow-sm">
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <span
          className="badge rounded-pill"
          style={{ background: 'rgba(37,99,235,0.10)', border: '1px solid rgba(37,99,235,0.14)', color: '#2563eb', fontWeight: 800 }}
        >
          Mục {num}
        </span>
        <div className="flex-grow-1 min-w-0">
          <input
            type="text"
            className="form-control form-control-sm bg-light border-0 fw-bold"
            value={section.title}
            onChange={e => updateSection(index, 'title', e.target.value)}
            placeholder="Tiêu đề mục..."
          />
        </div>
        <div className="d-flex align-items-center gap-3 ms-auto">
          <div className="form-check form-switch m-0">
            <input className="form-check-input cursor-pointer" type="checkbox" id={`showVideo${index}`} checked={section.showVideo} onChange={e => updateSection(index, 'showVideo', e.target.checked)} />
            <label className="form-check-label small fw-semibold cursor-pointer" htmlFor={`showVideo${index}`}>Video</label>
          </div>
          <div className="form-check form-switch m-0">
            <input className="form-check-input cursor-pointer" type="checkbox" id={`showQuiz${index}`} checked={section.showQuiz} onChange={e => updateSection(index, 'showQuiz', e.target.checked)} />
            <label className="form-check-label small fw-semibold cursor-pointer" htmlFor={`showQuiz${index}`}>Quiz</label>
          </div>
          {editData.sections.length > 1 && (
            <button type="button" className="btn btn-sm btn-outline-secondary rounded-3" onClick={() => removeSection(index)} title="Xóa mục">
              <Minus size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="d-flex justify-content-end mb-2">
          <button className="btn btn-sm btn-outline-secondary px-3 rounded-3 d-flex align-items-center gap-2" onClick={() => handleSaveLesson(num, 'content')} disabled={submitting}>
            {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Lưu nội dung
          </button>
        </div>
        <TiptapEditor key={`lesson-${activeItem.data?.id}-${index}`} content={section.content} onChange={(val) => updateSection(index, 'content', val)} />
      </div>

      {section.showQuiz && (
        <div className="mb-4 p-4 bg-light rounded-4 border">
            <div className="d-flex align-items-center gap-2 mb-3">
                <ClipboardCheck size={22} className="text-primary" />
                <div>
                    <div className="fw-bold text-dark mb-0">Bài trắc nghiệm Mục {num}</div>
                    <div className="text-secondary small">Thêm và chỉnh sửa câu hỏi trắc nghiệm trực tiếp tại đây.</div>
                </div>
            </div>
            <QuizSectionInline
              courseId={id}
              section={num}
              lessonId={activeItem.data?.id}
              onToast={showToast}
            />
        </div>
      )}

      {section.showVideo && (
                <div className="video-section mt-4 p-3 bg-light rounded-4 border">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <div className="d-flex align-items-center gap-2 text-dark fw-bold"><Video size={18} className="text-primary" /> Video bài giảng</div>
            <button className="btn btn-sm btn-outline-secondary px-3 rounded-3 d-flex align-items-center gap-2" onClick={() => handleSaveLesson(num, 'video')} disabled={submitting}>
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Lưu video
            </button>
          </div>

          <div className="d-flex justify-content-center mb-4">
            <label className="btn btn-white py-4 px-5 rounded-3 border-2 border-dashed fw-bold d-block hover-bg-primary-subtle transition-all cursor-pointer">
              <Upload size={24} className="text-primary mb-2 d-block mx-auto" />
              <span className="text-dark small d-block">Chọn tệp video (có thể chọn nhiều)</span>
              <input type="file" className="d-none" accept="video/*" multiple onChange={e => onFileChange(index, e.target.files)} />
            </label>
          </div>

          {((section.videoUrls && section.videoUrls.length > 0) || (localPreviews[index] && localPreviews[index].length > 0)) && (
            <div className="mt-2 pt-3 border-top">
              <span className="small text-muted fw-bold d-block mb-3">Danh sách video:</span>
              <div className="d-flex flex-column gap-4">
                {(section.videoUrls || []).map((url, vi) => (
                  <div key={`saved-${vi}`} className="position-relative">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small text-muted">Video {vi + 1}</span>
                      <button className="btn btn-sm btn-outline-secondary rounded-3 px-3 text-danger" onClick={() => handleDeleteVideo(index, num, vi, false)}>
                        <Trash2 size={12} className="me-1" /> Xóa
                      </button>
                    </div>
                    <div className="ratio ratio-16x9 rounded-3 overflow-hidden border bg-black shadow-lg">
                      <VideoPlayer src={url} key={url} />
                    </div>
                  </div>
                ))}
                {(localPreviews[index] || []).map((preview, vi) => (
                  <div key={`preview-${vi}`} className="position-relative">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small text-muted">Video mới (chưa lưu)</span>
                      <button className="btn btn-sm btn-outline-secondary rounded-3 px-3 text-danger" onClick={() => handleDeleteVideo(index, num, vi, true)}>
                        <Trash2 size={12} className="me-1" /> Xóa
                      </button>
                    </div>
                    <div className="ratio ratio-16x9 rounded-3 overflow-hidden border bg-black shadow-lg">
                      <video controls src={preview} key={preview} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const handleQuickAddLesson = async () => {
    if (!newLessonTitle.trim()) { setIsAdding(false); return; }
    setSubmitting(true);
    const title = newLessonTitle.trim();
    const data = new FormData();
    data.append('CourseId', parseInt(id));
    data.append('Title', title);
    data.append('OrderIndex', (course?.lessons?.length || 0) + 1);
    try {
      const response = await api.post('/course/lessons', data);
      const newId = response.data?.id ?? response.data?.Id;
      setNewLessonTitle(''); setIsAdding(false);
      const updated = await fetchCourseDetail();
      const newLesson = updated?.lessons?.find(l => l.id === newId);
      setActiveItem({ type: 'ls', data: newLesson || { id: newId, title: response.data?.title || title } });
    } catch (err) { showToast('Lỗi khi tạo bài học.', 'error'); } finally { setSubmitting(false); }
  };

  const handleDeleteLesson = async (e, lessonId) => {
    e.stopPropagation();
    const ok = await confirm({ title: 'Xóa bài học', message: 'Xóa bài học này?', confirmText: 'Xóa' });
    if (!ok) return;
    try {
      await api.delete(`/course/lessons/${lessonId}`);
      if (activeItem.type === 'ls' && activeItem.data?.id === lessonId) setActiveItem({ type: 'intro' });
      await fetchCourseDetail();
      showToast('Đã xóa bài học.');
    } catch (err) {
      const msg = err.response?.data || err.message || 'Lỗi khi xóa.';
      showToast(typeof msg === 'string' ? msg : 'Lỗi khi xóa.', 'error');
    }
  };

  const handleReorder = async (newLessons) => {
    setCourse({ ...course, lessons: newLessons });
    try {
      await api.post('/course/lessons/reorder', { LessonIds: newLessons.map(l => l.id) });
    } catch (err) { console.error(err); }
  };

  const togglePublishCourse = async () => {
    if (!course) return;
    setSubmitting(true);
    const data = new FormData();
    data.append('CourseCode', course.courseCode || '');
    data.append('Title', course.title || '');
    data.append('Description', course.description || '');
    data.append('IsPublished', (!course.isPublished).toString());
    data.append('ShowIntroVideo', course.showIntroVideo ? 'true' : 'false');
    data.append('IntroExternalVideoUrl', course.introExternalVideoUrl || '');
    try {
      await api.put(`/course/${id}`, data);
      showToast(course.isPublished ? 'Đã gỡ công bố khóa học.' : 'Đã công bố khóa học.');
      await fetchCourseDetail();
    } catch (err) {
      showToast('Không thể cập nhật trạng thái công bố.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectIntro = () => {
    setActiveItem({ type: 'intro' });
    setSearchParams({ tab: 'intro' }, { replace: true });
  };

  const selectLesson = (lesson) => {
    setActiveItem({ type: 'ls', data: lesson });
    setSearchParams({ tab: 'lesson', lesson: String(lesson.id) }, { replace: true });
  };

  if (loading) return <AdminLayout><div className="text-center py-5"><Loader2 className="animate-spin text-primary" size={48} /></div></AdminLayout>;

  if (!course) {
    return (
      <AdminLayout>
        <div className="text-center py-5">
          <AlertCircle size={48} className="text-warning mb-3" />
          <p className="text-muted mb-3">{error || 'Không tìm thấy khóa học.'}</p>
          <button className="btn btn-primary rounded-3" onClick={() => navigate('/admin/courses')}>Quay lại danh sách</button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-3">
        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <button type="button" className="btn btn-light rounded-circle p-2 shadow-sm border" onClick={() => navigate(location.state?.from || '/admin/courses')} title="Quay lại">
            <ArrowLeft size={20} />
          </button>
          <nav aria-label="breadcrumb" className="mb-0 flex-grow-1 min-w-0">
            <ol className="breadcrumb mb-0 py-1 small flex-nowrap overflow-hidden">
              <li className="breadcrumb-item flex-shrink-0">
                <button type="button" className="btn btn-link p-0 text-decoration-none text-muted" onClick={() => navigate('/admin/courses')}>Khóa học</button>
              </li>
              <li className="breadcrumb-item text-truncate min-w-0" title={course.title}>
                <span className="text-dark fw-semibold">{course.title}</span>
              </li>
              <li className="breadcrumb-item active text-truncate flex-shrink-0" aria-current="page">Nội dung giảng dạy</li>
            </ol>
          </nav>
        </div>
        <p className="text-muted small mb-0 ms-1 ps-5 ps-md-0 ms-md-0">
          Mã: <span className="fw-bold text-primary font-monospace">{course.courseCode}</span>
        </p>
      </div>

      <div className="row g-3 align-items-start">
        <div className="col-lg-4 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden sticky-lg-top" style={{ top: '84px' }}>
            <div className="px-3 py-2 border-bottom bg-light d-flex align-items-center justify-content-between">
              <span className="small fw-bold text-secondary text-uppercase d-flex align-items-center gap-2" style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                <LayoutList size={16} className="text-primary" /> Nội dung
              </span>
            </div>
            <div className="p-3 bg-white">
              <div className="course-outline-toolbar mb-3">
                <div className="course-outline-toolbar__left">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center justify-content-center"
                    onClick={() => setLessonsExpanded((v) => !v)}
                  >
                    {lessonsExpanded ? <><ChevronUp size={14} className="me-1" /> Thu gọn DS</> : <><ChevronDown size={14} className="me-1" /> Mở rộng DS</>}
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary rounded-3 px-3 fw-bold d-inline-flex align-items-center justify-content-center gap-1 ms-auto flex-shrink-0 course-outline-toolbar__add"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus size={16} /> Bài học
                </button>
              </div>

              <button
                type="button"
                className={`course-outline-item w-100 text-start d-flex align-items-center gap-2 mb-2 border-0 rounded-2 py-2 px-3 ${activeItem.type === 'intro' ? 'course-outline-item--active' : 'bg-white'}`}
                onClick={selectIntro}
              >
                <Star size={18} className={activeItem.type === 'intro' ? 'text-primary' : 'text-warning'} />
                <span className="fw-semibold small flex-grow-1 course-outline-title">Giới thiệu khóa học</span>
                {course.isPublished ? <CheckCircle2 size={18} className="text-success flex-shrink-0" /> : <span className="small text-muted flex-shrink-0">—</span>}
              </button>

              <button
                type="button"
                className="w-100 d-flex align-items-center justify-content-between py-2 px-2 mb-1 rounded-2 border-0 course-module-bar text-start"
                onClick={() => setLessonsExpanded((e) => !e)}
              >
                <span className="small fw-bold text-secondary text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}>
                  Bài giảng ({(course.lessons || []).length})
                </span>
                {lessonsExpanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
              </button>

              {lessonsExpanded && (
                <Reorder.Group axis="y" values={course.lessons || []} onReorder={handleReorder} className="list-unstyled p-0 m-0">
                  {(course.lessons || []).map((lesson, idx) => {
                    const isActive = activeItem.type === 'ls' && activeItem.data?.id === lesson.id;
                    return (
                      <Reorder.Item key={lesson.id} value={lesson} className="d-flex align-items-stretch gap-1 mb-2 group">
                        <div className="cursor-grab text-muted opacity-50 d-flex align-items-center px-1" title="Kéo để sắp xếp">
                          <GripVertical size={14} />
                        </div>
                        <div className={`flex-grow-1 course-outline-item rounded-2 d-flex align-items-center gap-1 py-2 px-2 ${isActive ? 'course-outline-item--active' : 'bg-white'}`}>
                          <button
                            type="button"
                            className="flex-grow-1 text-start border-0 bg-transparent d-flex align-items-center gap-2 py-1 min-w-0"
                            onClick={() => selectLesson(lesson)}
                          >
                            <span className="small fw-bold text-muted flex-shrink-0">{idx + 1}</span>
                            <span className="small fw-semibold text-dark course-outline-title">{lesson.title}</span>
                          </button>
                          <CheckCircle2 size={18} className="text-success flex-shrink-0" aria-hidden />
                          <div className="dropdown">
                            <button
                              type="button"
                              className="btn btn-link p-1 text-secondary d-inline-flex align-items-center"
                              data-bs-toggle="dropdown"
                              data-bs-popper-config={JSON.stringify({ strategy: 'fixed' })}
                              data-bs-offset="0,4"
                              aria-label="Thao tác bài học"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical size={18} />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 py-1 small">
                              <li>
                                <button type="button" className="dropdown-item py-2" onClick={() => selectLesson(lesson)}>Mở chỉnh sửa</button>
                              </li>
                              <li><hr className="dropdown-divider my-0" /></li>
                              <li>
                                <button type="button" className="dropdown-item py-2 text-danger" onClick={(e) => handleDeleteLesson(e, lesson.id)}>Xóa bài học</button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              )}

              {isAdding && (
                <div className="p-2 border border-primary border-2 border-dashed rounded-3 mt-2 bg-primary-subtle">
                  <input
                    autoFocus
                    type="text"
                    className="form-control form-control-sm border-0 bg-transparent fw-bold"
                    placeholder="Tên bài giảng mới..."
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuickAddLesson()}
                    onBlur={() => !newLessonTitle && setIsAdding(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-8 col-xl-9">
          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white">
            {activeItem.type === 'intro' ? (
              <div className="p-0">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 border-bottom pb-3">
                  <h4 className="fw-bold mb-0 text-dark">Giới thiệu khóa học</h4>
                  <button className="btn btn-sm btn-primary px-3 fw-bold rounded-3 d-flex align-items-center gap-2" onClick={() => handleSaveIntro('all')} disabled={submitting}>
                    {submitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Lưu giới thiệu
                  </button>
                </div>

                <div className="mb-4">
                    <div className="d-flex justify-content-end mb-2">
                      <button className="btn btn-sm btn-outline-secondary px-3 rounded-3 d-flex align-items-center gap-2" onClick={() => handleSaveIntro('content')} disabled={submitting}>
                        {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Lưu nội dung
                      </button>
                    </div>
                    <label className="form-label small fw-bold text-secondary mb-3">Nội dung văn bản giới thiệu</label>
                    <TiptapEditor content={editData.description} onChange={(val) => setEditData({...editData, description: val})} />
                </div>

                <div className="video-section mt-4 p-3 bg-light rounded-4 border">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 border-bottom pb-3">
                        <div className="d-flex align-items-center gap-2 text-dark fw-bold">
                            <Video size={20} className="text-primary" /> Video giới thiệu khóa học
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <button className="btn btn-sm btn-outline-secondary px-3 rounded-3 d-flex align-items-center gap-2" onClick={() => handleSaveIntro('video')} disabled={submitting}>
                            {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Lưu video
                          </button>
                          <div className="form-check form-switch">
                            <input className="form-check-input cursor-pointer" type="checkbox" id="showIntroVideo" checked={editData.showIntroVideo} onChange={e => setEditData({...editData, showIntroVideo: e.target.checked})} />
                            <label className="form-check-label small fw-bold text-nowrap cursor-pointer" htmlFor="showIntroVideo">Sử dụng Video</label>
                          </div>
                        </div>
                    </div>

                    {editData.showIntroVideo && (
                        <>
                            <div className="d-flex justify-content-center mb-4">
                                <label className="btn btn-white py-4 px-5 rounded-3 border-2 border-dashed fw-bold shadow-sm d-block hover-bg-primary-subtle transition-all cursor-pointer">
                                    <Upload size={24} className="text-primary mb-2 d-block mx-auto" />
                                    <span className="text-dark small d-block">Chọn tệp video giới thiệu</span>
                                    <input type="file" className="d-none" accept="video/*" onChange={e => onFileChange('intro', e.target.files[0])} />
                                </label>
                            </div>

                            {(editData.introVideoUrl || localPreviews.intro) && (
                                <div className="mt-2 pt-3 border-top">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="small text-muted fw-bold">Xem chi tiết:</span>
                                        {(localPreviews.intro || editData.introVideoUrl) && (
                                            <button className="btn btn-outline-danger btn-xs rounded-pill px-3" onClick={() => handleDeleteVideo('intro', 0, 0, false)}>
                                                <Trash2 size={12} className="me-1" /> Xóa Video
                                            </button>
                                        )}
                                    </div>
                                    <div className="ratio ratio-16x9 rounded-3 overflow-hidden border bg-black shadow-lg">
                                        {localPreviews.intro ? ( <video controls src={localPreviews.intro}></video> )
                                        : ( <VideoPlayer src={editData.introVideoUrl} /> )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
              </div>
            ) : (
              <div className="lesson-editor">
                <div className="d-flex justify-content-between align-items-center mb-3 bg-white p-3 rounded-4 shadow-sm border">
                  <h4 className="fw-bold mb-0 text-dark">{editData.title}</h4>
                </div>

                <div className="row mb-4 bg-white p-3 mx-0 rounded-3 shadow-sm border">
                  <div className="col-md-8">
                    <label className="form-label small fw-bold text-secondary">Tiêu đề bài học</label>
                    <input type="text" className="form-control form-control-lg rounded-3 fw-bold" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-secondary">Ngày hiển thị</label>
                    <input type="date" className="form-control rounded-3" value={editData.scheduledDate} onChange={e => setEditData({...editData, scheduledDate: e.target.value})} />
                  </div>
                </div>

                {editData.sections?.map((section, index) => renderSection(index, section, index + 1))}
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <button type="button" className="btn btn-sm btn-primary d-flex align-items-center gap-2 px-3" onClick={addSection}>
                    <Plus size={16} /> Thêm mục
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2 px-3" onClick={() => handleSaveLesson(0, 'all')} disabled={submitting}>
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Lưu bài học
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* removed: publish + quick actions sidebar */}
      </div>
      <style>{`
        .hover-bg-light:hover { background-color: #f8f9fa; }
        .cursor-pointer { cursor: pointer; }
        .cursor-grab { cursor: grab; }
        .transition-all { transition: all 0.2s ease; }
        .btn-white { background: white; border: 1px solid #dee2e6; }
        .animate-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .hover-scale:hover { transform: scale(1.02); }
        .btn-xs { padding: 0.25rem 0.5rem; font-size: 0.7rem; }
        .course-outline-toolbar { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 10px; }
        .course-outline-toolbar__left { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: center; }
        .course-outline-toolbar .btn { line-height: 1.15; min-height: 34px; }
        .course-outline-toolbar__left .btn { font-size: 0.82rem; padding-top: 6px; padding-bottom: 6px; }
        .course-outline-toolbar__add { min-width: 120px; justify-self: end; }
        @media (max-width: 420px) {
          .course-outline-toolbar__left { grid-template-columns: 1fr; }
          .course-outline-toolbar__add { min-width: 112px; }
        }
        @media (max-width: 520px) {
          .course-outline-toolbar { grid-template-columns: 1fr; }
          .course-outline-toolbar__add {
            order: -1;
            justify-self: stretch;
            width: 100%;
            min-width: 0;
          }
        }
        .course-module-bar {
          background: linear-gradient(180deg, #eef1f4 0%, #e2e6ea 100%);
          color: #495057;
        }
        .course-module-bar:hover { filter: brightness(0.97); }
        .course-outline-title {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          white-space: normal;
          line-height: 1.25;
        }
        .course-outline-item {
          border: 1px solid #dee2e6;
          border-left: 4px solid #198754;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
          transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
          min-height: 52px;
        }
        .course-outline-item:hover { background: #f8fffb !important; }
        .course-outline-item--active {
          border-left-color: #0d6efd !important;
          background: #e7f1ff !important;
          box-shadow: 0 2px 8px rgba(13, 110, 253, 0.12);
        }
      `}</style>
    </AdminLayout>
  );
};

export default CourseDetail;
