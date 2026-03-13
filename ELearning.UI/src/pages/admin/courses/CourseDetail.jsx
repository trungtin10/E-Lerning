import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import TiptapEditor from '../../../components/common/TiptapEditor';
import VideoPlayer from '../../../components/common/VideoPlayer';
import Toast from '../../../components/common/Toast';
import QuizSectionInline from '../../../components/admin/QuizSectionInline';
import {
  Plus, Video, FileText, Loader2, ArrowLeft, Trash2, Minus,
  PlayCircle, Save, Upload, X, Settings, ClipboardCheck,
  Info, BookOpen, RefreshCw, HelpCircle, GripVertical, Calendar, Star, Eye, AlertCircle, Link, CheckCircle2, ListChecks
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
    { title: '1. Phần nội dung', content: '', showVideo: false, showQuiz: false, videoUrl: '' }
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
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => setToast({ show: true, message, type });

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
    if (activeItem.type === 'ls' && course) {
      const currentLesson = course.lessons.find(l => l.id === activeItem.data.id);
      if (currentLesson) {
        let sections;
        const apiSections = currentLesson.sections || currentLesson.Sections;
        if (apiSections && Array.isArray(apiSections) && apiSections.length > 0) {
          sections = apiSections.map(s => ({
            title: (s.title ?? s.Title) || '',
            content: (s.content ?? s.Content) ?? '',
            showVideo: Boolean(s.showVideo ?? s.ShowVideo),
            showQuiz: Boolean(s.showQuiz ?? s.ShowQuiz),
            videoUrl: (s.videoUrl ?? s.VideoUrl) || ''
          }));
        } else {
          const hasContent = !!(currentLesson.overview?.trim() || currentLesson.content?.trim() || currentLesson.reviewContent?.trim() || currentLesson.essayQuestion?.trim());
          const hasMedia = !!(currentLesson.videoUrl1 || currentLesson.videoUrl2 || currentLesson.videoUrl3 || currentLesson.videoUrl4 || currentLesson.videoUrl5);
          const hasQuiz = !!(currentLesson.showQuiz1 || currentLesson.showQuiz2 || currentLesson.showQuiz3 || currentLesson.showQuiz4 || currentLesson.showQuiz5);
          if (!hasContent && !hasMedia && !hasQuiz) {
            sections = [{ title: '1. Phần nội dung', content: '', showVideo: false, showQuiz: false, videoUrl: '' }];
          } else {
            sections = [
              { title: currentLesson.section1Title || '1. Giới thiệu bài học', content: currentLesson.overview || '', showVideo: Boolean(currentLesson.showVideo1), showQuiz: Boolean(currentLesson.showQuiz1), videoUrl: currentLesson.videoUrl1 || '' },
              { title: currentLesson.section2Title || '2. Bài giảng chi tiết', content: currentLesson.content || '', showVideo: Boolean(currentLesson.showVideo2), showQuiz: Boolean(currentLesson.showQuiz2), videoUrl: currentLesson.videoUrl2 || '' },
              { title: currentLesson.section3Title || '3. Phần ôn tập', content: currentLesson.reviewContent || '', showVideo: Boolean(currentLesson.showVideo3), showQuiz: Boolean(currentLesson.showQuiz3), videoUrl: currentLesson.videoUrl3 || '' },
              { title: currentLesson.section4Title || '4. Câu hỏi tự luận', content: currentLesson.essayQuestion || '', showVideo: Boolean(currentLesson.showVideo4), showQuiz: Boolean(currentLesson.showQuiz4), videoUrl: currentLesson.videoUrl4 || '' },
              { title: currentLesson.section5Title || '5. Tổng kết bài học', content: '', showVideo: Boolean(currentLesson.showVideo5), showQuiz: Boolean(currentLesson.showQuiz5), videoUrl: currentLesson.videoUrl5 || '' }
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
    data.append('Title', editData.title);
    data.append('ScheduledDate', editData.scheduledDate || '');
    data.append('SectionsJson', JSON.stringify(editData.sections));

    editData.sections.forEach((_, i) => {
      if (videoFiles[i]) data.append(`VideoFile${i}`, videoFiles[i]);
    });

    try {
      await api.put(`/course/lessons/${activeItem.data.id}`, data);
      if (saveType !== 'content') await fetchCourseDetail();
      const msg = saveType === 'content' ? 'Đã lưu nội dung!' : saveType === 'video' ? 'Đã lưu video!' : 'Đã lưu!';
      showToast(msg);
    } catch (err) { showToast('Lỗi khi lưu.', 'error'); } finally { setSubmitting(false); }
  };

  const onFileChange = (fileKey, file) => {
    if (file) {
        setVideoFiles(prev => ({...prev, [fileKey]: file}));
        setLocalPreviews(prev => ({...prev, [fileKey]: URL.createObjectURL(file)}));
    }
  };

  const handleDeleteVideo = async (fileKey, num) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa video này?')) return;
    try {
      if (fileKey === 'intro') {
        await api.delete(`/course/${id}/video`);
        setEditData(prev => ({ ...prev, introVideoUrl: '' }));
      } else {
        await api.delete(`/course/lessons/${activeItem.data.id}/video/${num}`);
        setEditData(prev => ({
          ...prev,
          sections: prev.sections.map((s, i) => i === num - 1 ? { ...s, videoUrl: '' } : s)
        }));
      }
      setLocalPreviews(prev => ({ ...prev, [fileKey]: '' }));
      setVideoFiles(prev => ({ ...prev, [fileKey]: null }));
      showToast('Đã xóa video.');
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
      sections: [...prev.sections, { title: `${n}. Phần mới`, content: '', showVideo: false, showQuiz: false, videoUrl: '' }]
    }));
  };

  const removeSection = (index) => {
    if (editData.sections.length <= 1) return;
    if (!window.confirm('Xóa phần này?')) return;
    setEditData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
    setVideoFiles(prev => { const next = { ...prev }; delete next[index]; return next; });
    setLocalPreviews(prev => { const next = { ...prev }; delete next[index]; return next; });
  };

  const sectionIcons = [<Info size={20} className="text-info" key="i1" />, <BookOpen size={20} className="text-primary" key="i2" />, <RefreshCw size={20} className="text-success" key="i3" />, <HelpCircle size={20} className="text-warning" key="i4" />, <CheckCircle2 size={20} className="text-dark" key="i5" />];

  const renderSection = (index, section, num) => (
    <div key={index} className="mb-5 p-4 border rounded-4 bg-white shadow-sm">
      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
        <div className="d-flex align-items-center gap-2 flex-grow-1">
            {sectionIcons[index % sectionIcons.length]}
            <input type="text" className="form-control form-control-sm border-0 bg-light fw-bold text-dark w-75 rounded-3" value={section.title} onChange={e => updateSection(index, 'title', e.target.value)} />
            {editData.sections.length > 1 && (
              <button type="button" className="btn btn-outline-danger btn-sm rounded-pill px-2" onClick={() => removeSection(index)} title="Xóa phần"><Minus size={14} /></button>
            )}
        </div>
        <div className="d-flex gap-3 align-items-center">
            <div className="form-check form-switch">
                <input className="form-check-input cursor-pointer" type="checkbox" id={`showVideo${index}`} checked={section.showVideo} onChange={e => updateSection(index, 'showVideo', e.target.checked)} />
                <label className="form-check-label small fw-bold cursor-pointer" htmlFor={`showVideo${index}`}>Video</label>
            </div>
            <div className="form-check form-switch">
                <input className="form-check-input cursor-pointer" type="checkbox" id={`showQuiz${index}`} checked={section.showQuiz} onChange={e => updateSection(index, 'showQuiz', e.target.checked)} />
                <label className="form-check-label small fw-bold cursor-pointer" htmlFor={`showQuiz${index}`}>Trắc nghiệm</label>
            </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="d-flex justify-content-end mb-2">
          <button className="btn btn-outline-primary btn-sm px-3 fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => handleSaveLesson(num, 'content')} disabled={submitting}>
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
        <div className="video-section mt-4 p-4 bg-light rounded-4 border">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <div className="d-flex align-items-center gap-2 text-dark fw-bold"><Video size={18} className="text-primary" /> Video bài giảng</div>
            <button className="btn btn-outline-primary btn-sm px-3 fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => handleSaveLesson(num, 'video')} disabled={submitting}>
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Lưu video
            </button>
          </div>

          <div className="d-flex justify-content-center mb-4">
            <label className="btn btn-white py-4 px-5 rounded-3 border-2 border-dashed fw-bold shadow-sm d-block hover-bg-primary-subtle transition-all cursor-pointer">
              <Upload size={24} className="text-primary mb-2 d-block mx-auto" />
              <span className="text-dark small d-block">Chọn tệp video</span>
              <input type="file" className="d-none" accept="video/*" onChange={e => onFileChange(index, e.target.files[0])} />
            </label>
          </div>

          {(section.videoUrl || localPreviews[index]) && (
            <div className="mt-2 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small text-muted fw-bold">Xem chi tiết:</span>
                    {(localPreviews[index] || section.videoUrl) && (
                        <button className="btn btn-outline-danger btn-xs rounded-pill px-3" onClick={() => handleDeleteVideo(index, index + 1)}>
                            <Trash2 size={12} className="me-1" /> Xóa Video
                        </button>
                    )}
                </div>
                <div className="ratio ratio-16x9 rounded-3 overflow-hidden border bg-black shadow-lg position-relative">
                    {localPreviews[index] ? ( <video controls src={localPreviews[index]} key={localPreviews[index]}></video> )
                    : ( <VideoPlayer src={section.videoUrl} key={section.videoUrl} /> )}
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
    if (!window.confirm('Xóa bài học này?')) return;
    try {
      await api.delete(`/course/lessons/${lessonId}`);
      if (activeItem.type === 'ls' && activeItem.data.id === lessonId) setActiveItem({ type: 'intro' });
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

  if (loading) return <AdminLayout><div className="text-center py-5"><Loader2 className="animate-spin text-primary" size={48} /></div></AdminLayout>;

  return (
    <AdminLayout>
      {toast.show && (
        <div className="position-fixed top-0 end-0 p-4" style={{ zIndex: 9999 }}>
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
        </div>
      )}
      <div className="mb-4 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-light rounded-circle p-2 shadow-sm" onClick={() => navigate(location.state?.from || '/admin/courses')}><ArrowLeft size={20} /></button>
          <div>
            <h2 className="fw-bold tracking-tight mb-0">{course.title}</h2>
            <p className="text-muted small mb-0">Mã khóa học: <span className="fw-bold text-primary">{course.courseCode}</span></p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary fw-bold rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => window.open(`/course/${id}`, '_blank')}><Eye size={18} /> Xem chi tiết</button>
          <button className="btn btn-outline-primary fw-bold rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => navigate(`/admin/courses/${id}/quiz`)}><ClipboardCheck size={18} /> Xem chi tiết bài kiểm tra</button>
        </div>
      </div>

      <div className="row g-4 align-items-start">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '100px' }}>
            <h6 className="fw-bold text-secondary mb-4 text-uppercase tracking-widest" style={{ fontSize: '0.7rem' }}>Cấu trúc khóa học</h6>
            <div className={`d-flex align-items-center gap-3 py-3 px-3 mb-4 rounded-3 cursor-pointer transition-all ${activeItem.type === 'intro' ? 'bg-dark text-white shadow-lg' : 'bg-light text-dark border'}`} onClick={() => { setActiveItem({ type: 'intro' }); setSearchParams({ tab: 'intro' }, { replace: true }); }}>
              <div className={`p-2 rounded-2 ${activeItem.type === 'intro' ? 'bg-primary text-white' : 'bg-white text-primary shadow-sm'}`}><Star size={18} /></div>
              <div className="fw-bold small">Giới thiệu khóa học</div>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-secondary mb-0 text-uppercase tracking-widest" style={{ fontSize: '0.6rem' }}>Danh sách bài giảng</h6>
              <button className="btn btn-primary btn-sm rounded-circle p-1" onClick={() => setIsAdding(true)}><Plus size={14} /></button>
            </div>
            <Reorder.Group axis="y" values={course.lessons} onReorder={handleReorder} className="list-unstyled p-0 m-0">
              {course.lessons.map((lesson, idx) => (
                <Reorder.Item key={lesson.id} value={lesson} className="d-flex align-items-center gap-2 mb-2 group">
                  <div className="cursor-grab text-muted opacity-50"><GripVertical size={16} /></div>
                  <div
                    className={`flex-grow-1 d-flex align-items-center gap-3 py-3 px-3 rounded-3 cursor-pointer transition-all position-relative ${activeItem.type === 'ls' && activeItem.data.id === lesson.id ? 'bg-primary text-white shadow-sm' : 'hover-bg-light border'}`}
                    onClick={() => { setActiveItem({ type: 'ls', data: lesson }); setSearchParams({ tab: 'lesson', lesson: String(lesson.id) }, { replace: true }); }}
                  >
                    <div className="fw-bold small flex-grow-1">{idx + 1}. {lesson.title}</div>
                    <button className={`btn btn-link p-0 border-0 ${activeItem.type === 'ls' && activeItem.data.id === lesson.id ? 'text-white-50' : 'text-danger opacity-0 group-hover:opacity-100'}`} onClick={(e) => handleDeleteLesson(e, lesson.id)}><Trash2 size={16} /></button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            {isAdding && (
              <div className="p-2 border-primary border-2 border-dashed rounded-3 mt-2 bg-primary-subtle">
                <input autoFocus type="text" className="form-control form-control-sm border-0 bg-transparent fw-bold" placeholder="Tên bài giảng..." value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleQuickAddLesson()} onBlur={() => !newLessonTitle && setIsAdding(false)} />
              </div>
            )}
          </div>
        </div>

        <div className="col-md-8">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-light">
            {activeItem.type === 'intro' ? (
              <div className="bg-white p-4 rounded-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                  <h4 className="fw-bold mb-0 text-dark">Giới thiệu khóa học</h4>
                  <button className="btn btn-dark px-4 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => handleSaveIntro('all')} disabled={submitting}>
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Lưu giới thiệu
                  </button>
                </div>

                <div className="mb-4">
                    <div className="d-flex justify-content-end mb-2">
                      <button className="btn btn-outline-primary btn-sm px-3 fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => handleSaveIntro('content')} disabled={submitting}>
                        {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Lưu nội dung
                      </button>
                    </div>
                    <label className="form-label small fw-bold text-secondary mb-3">Nội dung văn bản giới thiệu</label>
                    <TiptapEditor content={editData.description} onChange={(val) => setEditData({...editData, description: val})} />
                </div>

                <div className="video-section mt-5 p-4 bg-light rounded-4 border">
                    <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
                        <div className="d-flex align-items-center gap-2 text-dark fw-bold">
                            <Video size={20} className="text-primary" /> Video giới thiệu khóa học
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <button className="btn btn-outline-primary btn-sm px-3 fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => handleSaveIntro('video')} disabled={submitting}>
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
                                            <button className="btn btn-outline-danger btn-xs rounded-pill px-3" onClick={() => handleDeleteVideo('intro', 'introVideoUrl', 0)}>
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
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3 bg-white p-3 rounded-3 shadow-sm">
                  <h4 className="fw-bold mb-0 text-primary">{editData.title}</h4>
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
                <div className="mb-4 d-flex justify-content-center">
                  <button type="button" className="btn btn-outline-primary btn-lg px-5 py-3 rounded-pill d-flex align-items-center gap-2 fw-bold" onClick={addSection}>
                    <Plus size={22} /> Thêm phần
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .hover-bg-light:hover { background-color: #f8f9fa; }
        .cursor-pointer { cursor: pointer; }
        .transition-all { transition: all 0.2s ease; }
        .btn-white { background: white; border: 1px solid #dee2e6; }
        .animate-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .hover-scale:hover { transform: scale(1.02); }
        .btn-xs { padding: 0.25rem 0.5rem; font-size: 0.7rem; }
      `}</style>
    </AdminLayout>
  );
};

export default CourseDetail;
