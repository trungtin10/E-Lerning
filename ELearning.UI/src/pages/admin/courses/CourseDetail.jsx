import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import TiptapEditor from '../../../components/common/TiptapEditor';
import {
  Plus, Video, FileText, Loader2, ArrowLeft, Trash2,
  PlayCircle, Save, Upload, X, Settings, ClipboardCheck,
  Info, BookOpen, RefreshCw, HelpCircle, GripVertical, Calendar, Star, Eye, AlertCircle, Link, CheckCircle2, ListChecks, PlusCircle
} from 'lucide-react';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeItem, setActiveItem] = useState({ type: 'intro' });
  const [editData, setEditData] = useState({
    title: '', overview: '', content: '', reviewContent: '', essayQuestion: '',
    scheduledDate: '', description: '',
    section1Title: '1. Giới thiệu bài học',
    section2Title: '2. Bài giảng chi tiết',
    section3Title: '3. Phần ôn tập',
    section4Title: '4. Câu hỏi tự luận',
    section5Title: '5. Tổng kết bài học',
    showVideo1: false, showVideo2: false, showVideo3: false, showVideo4: false, showVideo5: false,
    showQuiz1: false, showQuiz2: false, showQuiz3: false, showQuiz4: false, showQuiz5: false,
    videoUrl1: '', videoUrl2: '', videoUrl3: '', videoUrl4: '', videoUrl5: '',
    externalVideoUrl1: '', externalVideoUrl2: '', externalVideoUrl3: '', externalVideoUrl4: '', externalVideoUrl5: '',
    showIntroVideo: false, introVideoUrl: '', introExternalVideoUrl: ''
  });

  const [videoFiles, setVideoFiles] = useState({ v1: null, v2: null, v3: null, v4: null, v5: null, intro: null });
  const [localPreviews, setLocalPreviews] = useState({ v1: '', v2: '', v3: '', v4: '', v5: '', intro: '' });
  const [submitting, setSubmitting] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  useEffect(() => {
    fetchCourseDetail();
  }, [id]);

  useEffect(() => {
    if (activeItem.type === 'ls' && course) {
      const currentLesson = course.lessons.find(l => l.id === activeItem.data.id);
      if (currentLesson) {
        setEditData({
          title: currentLesson.title || '',
          overview: currentLesson.overview || '',
          content: currentLesson.content || '',
          reviewContent: currentLesson.reviewContent || '',
          essayQuestion: currentLesson.essayQuestion || '',
          scheduledDate: currentLesson.scheduledDate ? new Date(currentLesson.scheduledDate).toISOString().split('T')[0] : '',
          section1Title: currentLesson.section1Title || '1. Giới thiệu bài học',
          section2Title: currentLesson.section2Title || '2. Bài giảng chi tiết',
          section3Title: currentLesson.section3Title || '3. Phần ôn tập',
          section4Title: currentLesson.section4Title || '4. Câu hỏi tự luận',
          section5Title: currentLesson.section5Title || '5. Tổng kết bài học',
          showVideo1: Boolean(currentLesson.showVideo1),
          showVideo2: Boolean(currentLesson.showVideo2),
          showVideo3: Boolean(currentLesson.showVideo3),
          showVideo4: Boolean(currentLesson.showVideo4),
          showVideo5: Boolean(currentLesson.showVideo5),
          showQuiz1: Boolean(currentLesson.showQuiz1),
          showQuiz2: Boolean(currentLesson.showQuiz2),
          showQuiz3: Boolean(currentLesson.showQuiz3),
          showQuiz4: Boolean(currentLesson.showQuiz4),
          showQuiz5: Boolean(currentLesson.showQuiz5),
          videoUrl1: currentLesson.videoUrl1 || '',
          videoUrl2: currentLesson.videoUrl2 || '',
          videoUrl3: currentLesson.videoUrl3 || '',
          videoUrl4: currentLesson.videoUrl4 || '',
          videoUrl5: currentLesson.videoUrl5 || '',
          externalVideoUrl1: currentLesson.externalVideoUrl1 || '',
          externalVideoUrl2: currentLesson.externalVideoUrl2 || '',
          externalVideoUrl3: currentLesson.externalVideoUrl3 || '',
          externalVideoUrl4: currentLesson.externalVideoUrl4 || '',
          externalVideoUrl5: currentLesson.externalVideoUrl5 || ''
        });
        setVideoFiles({ v1: null, v2: null, v3: null, v4: null, v5: null, intro: null });
        setLocalPreviews({ v1: '', v2: '', v3: '', v4: '', v5: '', intro: '' });
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
    } catch (err) { setError("Lỗi tải dữ liệu."); setLoading(false); }
  };

  const handleSaveIntro = async () => {
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
      alert('Đã lưu giới thiệu khóa học!');
      await fetchCourseDetail();
    } catch (err) { alert('Lỗi khi lưu.'); } finally { setSubmitting(false); }
  };

  const handleSaveLesson = async (num) => {
    if (!activeItem.data?.id) return;
    setSubmitting(true);
    const data = new FormData();
    data.append('Title', editData.title);
    data.append('Overview', editData.overview || '');
    data.append('Content', editData.content || '');
    data.append('ReviewContent', editData.reviewContent || '');
    data.append('EssayQuestion', editData.essayQuestion || '');
    data.append('ScheduledDate', editData.scheduledDate || '');

    data.append('Section1Title', editData.section1Title);
    data.append('Section2Title', editData.section2Title);
    data.append('Section3Title', editData.section3Title);
    data.append('Section4Title', editData.section4Title);
    data.append('Section5Title', editData.section5Title);

    data.append('ShowVideo1', editData.showVideo1 ? 'true' : 'false');
    data.append('ShowVideo2', editData.showVideo2 ? 'true' : 'false');
    data.append('ShowVideo3', editData.showVideo3 ? 'true' : 'false');
    data.append('ShowVideo4', editData.showVideo4 ? 'true' : 'false');
    data.append('ShowVideo5', editData.showVideo5 ? 'true' : 'false');

    data.append('ShowQuiz1', editData.showQuiz1 ? 'true' : 'false');
    data.append('ShowQuiz2', editData.showQuiz2 ? 'true' : 'false');
    data.append('ShowQuiz3', editData.showQuiz3 ? 'true' : 'false');
    data.append('ShowQuiz4', editData.showQuiz4 ? 'true' : 'false');
    data.append('ShowQuiz5', editData.showQuiz5 ? 'true' : 'false');

    data.append('ExternalVideoUrl1', editData.externalVideoUrl1 || '');
    data.append('ExternalVideoUrl2', editData.externalVideoUrl2 || '');
    data.append('ExternalVideoUrl3', editData.externalVideoUrl3 || '');
    data.append('ExternalVideoUrl4', editData.externalVideoUrl4 || '');
    data.append('ExternalVideoUrl5', editData.externalVideoUrl5 || '');

    if (videoFiles.v1) data.append('VideoFile1', videoFiles.v1);
    if (videoFiles.v2) data.append('VideoFile2', videoFiles.v2);
    if (videoFiles.v3) data.append('VideoFile3', videoFiles.v3);
    if (videoFiles.v4) data.append('VideoFile4', videoFiles.v4);
    if (videoFiles.v5) data.append('VideoFile5', videoFiles.v5);

    try {
      await api.put(`/course/lessons/${activeItem.data.id}`, data);
      await fetchCourseDetail();
      alert(`Đã lưu thành công mục ${num}!`);
    } catch (err) { alert('Lỗi khi lưu.'); } finally { setSubmitting(false); }
  };

  const onFileChange = (fileKey, file) => {
    if (file) {
        setVideoFiles(prev => ({...prev, [fileKey]: file}));
        setLocalPreviews(prev => ({...prev, [fileKey]: URL.createObjectURL(file)}));
    }
  };

  const handleDeleteVideo = async (fileKey, videoUrlKey, num) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa video này?')) return;
    try {
      if (fileKey === 'intro') {
        await api.delete(`/course/${id}/video`);
        setEditData(prev => ({ ...prev, introVideoUrl: '' }));
      } else {
        await api.delete(`/course/lessons/${activeItem.data.id}/video/${num}`);
        setEditData(prev => ({ ...prev, [videoUrlKey]: '' }));
      }
      setLocalPreviews(prev => ({ ...prev, [fileKey]: '' }));
      setVideoFiles(prev => ({ ...prev, [fileKey]: null }));
    } catch (err) {
      alert('Lỗi khi xóa video.');
    }
  };

  const renderSection = (num, titleKey, contentKey, showVideoKey, showQuizKey, videoUrlKey, externalUrlKey, fileKey, icon) => (
    <div className="mb-5 p-4 border rounded-4 bg-white shadow-sm">
      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
        <div className="d-flex align-items-center gap-2 flex-grow-1">
            {icon}
            <input type="text" className="form-control form-control-sm border-0 bg-light fw-bold text-dark w-75 rounded-3" value={editData[titleKey]} onChange={e => setEditData({...editData, [titleKey]: e.target.value})} />
        </div>
        <div className="d-flex gap-3 align-items-center">
            <div className="form-check form-switch">
                <input className="form-check-input cursor-pointer" type="checkbox" id={showVideoKey} checked={editData[showVideoKey]} onChange={e => setEditData({...editData, [showVideoKey]: e.target.checked})} />
                <label className="form-check-label small fw-bold cursor-pointer" htmlFor={showVideoKey}>Video</label>
            </div>
            <div className="form-check form-switch">
                <input className="form-check-input cursor-pointer" type="checkbox" id={showQuizKey} checked={editData[showQuizKey]} onChange={e => setEditData({...editData, [showQuizKey]: e.target.checked})} />
                <label className="form-check-label small fw-bold cursor-pointer" htmlFor={showQuizKey}>Trắc nghiệm</label>
            </div>
            <button className="btn btn-primary btn-xs px-3 fw-bold rounded-pill d-flex align-items-center gap-1 shadow-sm ms-2" onClick={() => handleSaveLesson(num)} disabled={submitting}>
                {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Lưu mục {num}
            </button>
        </div>
      </div>

      <div className="mb-4">
        <TiptapEditor content={editData[contentKey]} onChange={(val) => setEditData({...editData, [contentKey]: val})} />
      </div>

      {editData[showQuizKey] && (
        <div className="mb-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between p-4 bg-primary bg-opacity-10 border border-primary border-dashed rounded-4 shadow-sm animate-in fade-in duration-300">
            <div className="d-flex align-items-center gap-3 mb-3 mb-md-0">
                <div className="p-3 bg-primary rounded-circle text-white shadow-lg d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                    <PlusCircle size={28} />
                </div>
                <div>
                    <div className="fw-bold text-dark h5 mb-1">Xem chi tiết</div>
                    <div className="text-secondary small">Xem chi tiết bài kiểm tra được gắn với <strong>Mục {num}</strong>.</div>
                </div>
            </div>
            <button 
                className="btn btn-primary fw-bold px-4 py-2 rounded-3 shadow-lg d-flex align-items-center gap-2 hover-scale transition-all"
                onClick={() => navigate(`/admin/courses/${id}/quiz?section=${num}&lessonId=${activeItem.data.id}`)}
            >
                <Settings size={18} /> Xem chi tiết bài kiểm tra
            </button>
        </div>
      )}

      {editData[showVideoKey] && (
        <div className="video-section mt-4 p-4 bg-light rounded-4 border">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <div className="d-flex align-items-center gap-2 text-dark fw-bold"><Video size={18} className="text-primary" /> Video bài giảng</div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-6 border-end">
                <label className="btn btn-white w-100 py-4 rounded-3 border-2 border-dashed fw-bold shadow-sm d-block hover-bg-primary-subtle transition-all cursor-pointer">
                    <Upload size={24} className="text-primary mb-2 d-block mx-auto" />
                    <span className="text-dark small d-block">Tải file lên</span>
                    <input type="file" className="d-none" accept="video/*" onChange={e => onFileChange(fileKey, e.target.files[0])} />
                </label>
            </div>
            <div className="col-md-6">
                <input type="url" className="form-control form-control-sm shadow-sm" placeholder="Link YouTube..." value={editData[externalUrlKey] || ''} onChange={e => setEditData({...editData, [externalUrlKey]: e.target.value})} />
            </div>
          </div>

          {(editData[videoUrlKey] || editData[externalUrlKey] || localPreviews[fileKey]) && (
            <div className="mt-2 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small text-muted fw-bold">Xem trước video:</span>
                    {(localPreviews[fileKey] || editData[videoUrlKey]) && (
                        <button className="btn btn-outline-danger btn-xs rounded-pill px-3" onClick={() => handleDeleteVideo(fileKey, videoUrlKey, num)}>
                            <Trash2 size={12} className="me-1" /> Xóa Video
                        </button>
                    )}
                </div>
                <div className="ratio ratio-16x9 rounded-3 overflow-hidden border bg-black shadow-lg position-relative">
                    {localPreviews[fileKey] ? ( <video controls src={localPreviews[fileKey]} key={localPreviews[fileKey]}></video> )
                    : editData[videoUrlKey] ? ( <video controls src={editData[videoUrlKey]} key={editData[videoUrlKey]}></video> )
                    : ( <iframe src={editData[externalUrlKey]} title="Video Preview" allowFullScreen></iframe> )}
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
    const data = new FormData();
    data.append('CourseId', parseInt(id));
    data.append('Title', newLessonTitle.trim());
    data.append('OrderIndex', (course?.lessons?.length || 0) + 1);
    try {
      const response = await api.post('/course/lessons', data);
      setNewLessonTitle(''); setIsAdding(false);
      await fetchCourseDetail();
      setActiveItem({ type: 'ls', data: response.data });
    } catch (err) { alert('Lỗi.'); } finally { setSubmitting(false); }
  };

  const handleDeleteLesson = async (e, lessonId) => {
    e.stopPropagation();
    if (!window.confirm('Xóa bài học này?')) return;
    try {
      await api.delete(`/course/lessons/${lessonId}`);
      if (activeItem.type === 'ls' && activeItem.data.id === lessonId) setActiveItem({ type: 'intro' });
      await fetchCourseDetail();
    } catch (err) { alert('Lỗi.'); }
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
      <div className="mb-4 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-light rounded-circle p-2 shadow-sm" onClick={() => navigate('/admin/courses')}><ArrowLeft size={20} /></button>
          <div>
            <h2 className="fw-bold tracking-tight mb-0">{course.title}</h2>
            <p className="text-muted small mb-0">Mã khóa học: <span className="fw-bold text-primary">{course.courseCode}</span></p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary fw-bold rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => window.open(`/course/${id}`, '_blank')}><Eye size={18} /> Xem Demo</button>
          <button className="btn btn-outline-primary fw-bold rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => navigate(`/admin/courses/${id}/quiz`)}><ClipboardCheck size={18} /> Thiết lập Bài thi</button>
        </div>
      </div>

      <div className="row g-4 align-items-start">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '100px' }}>
            <h6 className="fw-bold text-secondary mb-4 text-uppercase tracking-widest" style={{ fontSize: '0.7rem' }}>Cấu trúc khóa học</h6>
            <div className={`d-flex align-items-center gap-3 py-3 px-3 mb-4 rounded-3 cursor-pointer transition-all ${activeItem.type === 'intro' ? 'bg-dark text-white shadow-lg' : 'bg-light text-dark border'}`} onClick={() => setActiveItem({ type: 'intro' })}>
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
                    onClick={() => setActiveItem({ type: 'ls', data: lesson })}
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
                  <button className="btn btn-dark px-4 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={handleSaveIntro} disabled={submitting}>
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Lưu giới thiệu
                  </button>
                </div>

                <div className="mb-4">
                    <label className="form-label small fw-bold text-secondary mb-3">Nội dung văn bản giới thiệu</label>
                    <TiptapEditor content={editData.description} onChange={(val) => setEditData({...editData, description: val})} />
                </div>

                <div className="video-section mt-5 p-4 bg-light rounded-4 border">
                    <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
                        <div className="d-flex align-items-center gap-2 text-dark fw-bold">
                            <Video size={20} className="text-primary" /> Video giới thiệu khóa học
                        </div>
                        <div className="form-check form-switch">
                            <input className="form-check-input cursor-pointer" type="checkbox" id="showIntroVideo" checked={editData.showIntroVideo} onChange={e => setEditData({...editData, showIntroVideo: e.target.checked})} />
                            <label className="form-check-label small fw-bold text-nowrap cursor-pointer" htmlFor="showIntroVideo">Sử dụng Video</label>
                        </div>
                    </div>

                    {editData.showIntroVideo && (
                        <>
                            <div className="row g-4 mb-4">
                                <div className="col-md-6 border-end">
                                    <label className="btn btn-white w-100 py-4 rounded-3 border-2 border-dashed fw-bold shadow-sm d-block hover-bg-primary-subtle transition-all cursor-pointer">
                                        <Upload size={24} className="text-primary mb-2 d-block mx-auto" />
                                        <span className="text-dark small d-block">Chọn tệp giới thiệu</span>
                                        <input type="file" className="d-none" accept="video/*" onChange={e => onFileChange('intro', e.target.files[0])} />
                                    </label>
                                </div>
                                <div className="col-md-6">
                                    <input type="url" className="form-control form-control-sm shadow-sm" placeholder="Link YouTube..." value={editData.introExternalVideoUrl || ''} onChange={e => setEditData({...editData, introExternalVideoUrl: e.target.value})} />
                                </div>
                            </div>

                            {(editData.introVideoUrl || editData.introExternalVideoUrl || localPreviews.intro) && (
                                <div className="mt-2 pt-3 border-top">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="small text-muted fw-bold">Xem trước video giới thiệu:</span>
                                        {(localPreviews.intro || editData.introVideoUrl) && (
                                            <button className="btn btn-outline-danger btn-xs rounded-pill px-3" onClick={() => handleDeleteVideo('intro', 'introVideoUrl', 0)}>
                                                <Trash2 size={12} className="me-1" /> Xóa Video
                                            </button>
                                        )}
                                    </div>
                                    <div className="ratio ratio-16x9 rounded-3 overflow-hidden border bg-black shadow-lg">
                                        {localPreviews.intro ? ( <video controls src={localPreviews.intro}></video> )
                                        : editData.introVideoUrl ? ( <video controls src={editData.introVideoUrl}></video> )
                                        : ( <iframe src={editData.introExternalVideoUrl} title="Intro" allowFullScreen></iframe> )}
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
                  <button className="btn btn-primary px-4 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => handleSaveLesson("Tất cả")} disabled={submitting}>
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Lưu Toàn Bộ
                  </button>
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

                {renderSection(1, 'section1Title', 'overview', 'showVideo1', 'showQuiz1', 'videoUrl1', 'externalVideoUrl1', 'v1', <Info size={20} className="text-info" />)}
                {renderSection(2, 'section2Title', 'content', 'showVideo2', 'showQuiz2', 'videoUrl2', 'externalVideoUrl2', 'v2', <BookOpen size={20} className="text-primary" />)}
                {renderSection(3, 'section3Title', 'reviewContent', 'showVideo3', 'showQuiz3', 'videoUrl3', 'externalVideoUrl3', 'v3', <RefreshCw size={20} className="text-success" />)}
                {renderSection(4, 'section4Title', 'essayQuestion', 'showVideo4', 'showQuiz4', 'videoUrl4', 'externalVideoUrl4', 'v4', <HelpCircle size={20} className="text-warning" />)}
                {renderSection(5, 'section5Title', null, 'showVideo5', 'showQuiz5', 'videoUrl5', 'externalVideoUrl5', 'v5', <CheckCircle2 size={20} className="text-dark" />)}
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
