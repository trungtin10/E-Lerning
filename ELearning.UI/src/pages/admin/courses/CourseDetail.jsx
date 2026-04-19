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
  Save, Upload, ClipboardCheck, FileText,
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
    title: '', description: '',
    sections: defaultSections(),
    showIntroVideo: false, showIntroDocs: false, introVideoUrl: '', introExternalVideoUrl: '',
    introSections: []
  });

  const [videoFiles, setVideoFiles] = useState({ intro: null });
  const [documentFiles, setDocumentFiles] = useState({});
  const [localPreviews, setLocalPreviews] = useState({ intro: '' });
  const [submitting, setSubmitting] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  /** Thu gọn / mở rộng danh sách bài giảng (kiểu Canvas) */
  const [lessonsExpanded, setLessonsExpanded] = useState(true);
  const [expandedLessonIds, setExpandedLessonIds] = useState({});
  const toggleLessonExpand = (lid) => {
    setExpandedLessonIds(prev => ({ ...prev, [lid]: !prev[lid] }));
  };
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
              showDocs: Boolean(s.showDocs ?? s.ShowDocs),
              videoUrls,
              docUrls: (s.docUrls ?? s.DocUrls) ?? []
            };
          });
        } else {
          // Xử lý dữ liệu từ các trường legacy (nếu không có sectionsJson)
          const legacySections = [
            { title: (currentLesson.section1Title || '1. Giới thiệu bài học').trim(), content: (currentLesson.overview || '').trim(), showVideo: Boolean(currentLesson.showVideo1), showQuiz: Boolean(currentLesson.showQuiz1), showDocs: false, videoUrls: currentLesson.videoUrl1 ? [currentLesson.videoUrl1] : [], docUrls: [] },
            { title: (currentLesson.section2Title || '2. Bài giảng chi tiết').trim(), content: (currentLesson.content || '').trim(), showVideo: Boolean(currentLesson.showVideo2), showQuiz: Boolean(currentLesson.showQuiz2), showDocs: false, videoUrls: currentLesson.videoUrl2 ? [currentLesson.videoUrl2] : [], docUrls: [] },
            { title: (currentLesson.section3Title || '3. Phần ôn tập').trim(), content: (currentLesson.reviewContent || '').trim(), showVideo: Boolean(currentLesson.showVideo3), showQuiz: Boolean(currentLesson.showQuiz3), showDocs: false, videoUrls: currentLesson.videoUrl3 ? [currentLesson.videoUrl3] : [], docUrls: [] },
            { title: (currentLesson.section4Title || '4. Câu hỏi tự luận').trim(), content: (currentLesson.essayQuestion || '').trim(), showVideo: Boolean(currentLesson.showVideo4), showQuiz: Boolean(currentLesson.showQuiz4), showDocs: false, videoUrls: currentLesson.videoUrl4 ? [currentLesson.videoUrl4] : [], docUrls: [] },
            { title: (currentLesson.section5Title || '5. Tổng kết bài học').trim(), content: '', showVideo: Boolean(currentLesson.showVideo5), showQuiz: Boolean(currentLesson.showQuiz5), showDocs: false, videoUrls: currentLesson.videoUrl5 ? [currentLesson.videoUrl5] : [], docUrls: [] }
          ];

          // Lọc ra các mục có dữ liệu thực tế (bỏ qua các mục trống)
          // Riêng mục index 0 sẽ được giữ lại nếu chưa có mục nào khác để đảm bảo luôn có ít nhất 1 mục hiển thị
          const filteredSections = legacySections.filter((s, i) => {
             const hasContent = s.content.length > 0;
             const hasMedia = s.videoUrls.length > 0;
             const hasQuiz = s.showQuiz;
             return hasContent || hasMedia || hasQuiz;
          });

          // Nếu không có mục nào có dữ liệu, mặc định hiển thị 1 mục trống thay vì 5 mục trống
          sections = filteredSections.length > 0 ? filteredSections : [legacySections[0]];
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
        showIntroVideo: Boolean(course.showIntroVideo || course.ShowIntroVideo),
        showIntroDocs: Boolean(course.showIntroDocs || course.ShowIntroDocs),
        introVideoUrl: course.introVideoUrl || course.IntroVideoUrl || '',
        introExternalVideoUrl: course.introExternalVideoUrl || course.IntroExternalVideoUrl || '',
        introSections: (() => {
          const raw = course.introSectionsJson || course.IntroSectionsJson;
          if (!raw) return [];
          try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed.map(s => ({
              title: s.title ?? s.Title ?? '',
              content: s.content ?? s.Content ?? '',
              showVideo: Boolean(s.showVideo ?? s.ShowVideo),
              showQuiz: Boolean(s.showQuiz ?? s.ShowQuiz),
              showDocs: Boolean(s.showDocs ?? s.ShowDocs),
              videoUrl: s.videoUrl ?? s.VideoUrl ?? '',
              videoUrls: s.videoUrls ?? s.VideoUrls ?? [],
              docUrls: s.docUrls ?? s.DocUrls ?? []
            }));
          } catch (e) { return []; }
        })(),
        introDocUrls: (course.introDocUrls || course.IntroDocUrls) || []
      }));
    }
  }, [activeItem.data?.id, activeItem.type, course]);

  // Hỗ trợ phím tắt Ctrl + S để lưu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (submitting) return;

        if (activeItem.type === 'intro') {
          showToast('Đang lưu giới thiệu...', 'info');
          handleSaveIntro('content');
        } else if (activeItem.type === 'ls' && activeItem.data?.id) {
          showToast(`Đang lưu nội dung bài học: ${activeItem.data.title}...`, 'info');
          handleSaveLesson(0, 'content');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItem, editData, submitting, videoFiles, documentFiles]);

  const fetchCourseDetail = async () => {
    try {
      const response = await api.get(`/course/${id}`);
      setCourse(response.data);
      setLoading(false);
      return response.data;
    } catch (err) { setError("Lỗi tải dữ liệu."); setLoading(false); return null; }
  };

  const handleSaveIntro = async (saveType = 'all', docUrlsOverride = null, introSectionsOverride = null) => {
    if (!course) return;
    setSubmitting(true);
    const data = new FormData();
    data.append('CourseCode', course.courseCode || '');
    data.append('Title', course.title || '');
    data.append('Description', editData.description || '');
    data.append('CategoryId', course.categoryId || '');
    data.append('StartDate', course.startDate || '');
    data.append('EndDate', course.endDate || '');
    data.append('IsPublished', course.isPublished ? 'true' : 'false');
    if (course.companyId) data.append('CompanyId', course.companyId);
    data.append('ShowIntroVideo', editData.showIntroVideo ? 'true' : 'false');
    data.append('ShowIntroDocs', editData.showIntroDocs ? 'true' : 'false');
    data.append('IntroExternalVideoUrl', editData.introExternalVideoUrl || '');
    data.append('IntroSectionsJson', JSON.stringify(introSectionsOverride || editData.introSections || []));
    data.append('IntroDocUrlsJson', JSON.stringify(docUrlsOverride || editData.introDocUrls || []));
    if (videoFiles.intro) data.append('IntroVideoFile', videoFiles.intro);
    
    // Gửi file tài liệu intro tổng quan
    (documentFiles.intro || []).forEach((f, fi) => f && data.append(`IntroDocFile_${fi}`, f));

    // GỬI FILE THEO TỪNG MỤC INTRO SECTION
    (editData.introSections || []).forEach((sec, sIdx) => {
       if (videoFiles[`introSec_${sIdx}`]) {
          data.append(`IntroSecVideo_${sIdx}`, videoFiles[`introSec_${sIdx}`]);
       }
       if (documentFiles[`introSec_${sIdx}`]) {
          documentFiles[`introSec_${sIdx}`].forEach((f, fIdx) => {
             data.append(`IntroSecDoc_${sIdx}_${fIdx}`, f);
          });
       }
    });

    try {
      const response = await api.put(`/course/${id}`, data);
      const msg = saveType === 'content' ? 'Đã lưu nội dung!' : saveType === 'video' ? 'Đã lưu video!' : 'Đã lưu giới thiệu khóa học!';
      showToast(msg);
      
      if (response.data?.introSectionsJson) {
         const raw = response.data.introSectionsJson;
         const parsed = JSON.parse(raw);
         const normalized = (parsed || []).map(s => ({
            title: s.title ?? s.Title ?? '',
            content: s.content ?? s.Content ?? '',
            showVideo: Boolean(s.showVideo ?? s.ShowVideo),
            showQuiz: Boolean(s.showQuiz ?? s.ShowQuiz),
            showDocs: Boolean(s.showDocs ?? s.ShowDocs),
            videoUrl: s.videoUrl ?? s.VideoUrl ?? '',
            videoUrls: s.videoUrls ?? s.VideoUrls ?? [],
            docUrls: s.docUrls ?? s.DocUrls ?? []
         }));
         setEditData(prev => ({ ...prev, introSections: normalized }));
      }

      // Xoá file tạm (Cập nhật 1 lần duy nhất để tránh lỗi state)
      setDocumentFiles(prev => {
        const next = { ...prev };
        delete next.intro;
        (editData.introSections || []).forEach((_, idx) => {
           delete next[`introSec_${idx}`];
        });
        return next;
      });

      await fetchCourseDetail();
    } catch (err) { showToast('Lỗi khi lưu.', 'error'); } finally { setSubmitting(false); }
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = api.defaults.baseURL.replace(/\/api\/?$/, '');
    return base + (url.startsWith('/') ? url : '/' + url);
  };

  const formatDocName = (url) => {
    if (!url) return '';
    try {
      let name = decodeURIComponent(url.split('/').pop());
      // 1. Check for new format: Name---8hex.ext
      const match = name.match(/^(.*)---[a-f0-9]{8}(\.[a-z0-9]+)$/i);
      if (match) {
        return match[1] + match[2];
      }
      // Khôi phục cho cả format cũ _8hex nếu còn tồn tại
      const matchOld = name.match(/^(.*)_[a-f0-9]{8}(\.[a-z0-9]+)$/i);
      if (matchOld) {
        return matchOld[1] + matchOld[2];
      }
      // 2. legacy format: GUID 36 chars
      if (name.match(/^[a-f0-9-]{36}\.[a-z0-9]+$/i)) {
        return name.substring(0, 8) + '...' + name.substring(name.lastIndexOf('.'));
      }
      return name;
    } catch (e) {
      return url.split('/').pop();
    }
  };

  const handleSaveLesson = async (num, saveType = 'all', sectionsOverride = null) => {
    if (!activeItem.data?.id) return;
    setSubmitting(true);
    const data = new FormData();
    const rawSections = sectionsOverride || editData.sections;
    const sectionsForApi = rawSections.map(s => ({
      title: s.title,
      content: s.content,
      showVideo: s.showVideo,
      showQuiz: s.showQuiz,
      showDocs: s.showDocs,
      videoUrls: s.videoUrls || [],
      docUrls: s.docUrls || [],
      videoUrl: (s.videoUrls && s.videoUrls[0]) || null
    }));
    data.append('Title', editData.title);
    data.append('ScheduledDate', editData.scheduledDate || '');
    data.append('SectionsJson', JSON.stringify(sectionsForApi));

    editData.sections.forEach((_, i) => {
      const files = Array.isArray(videoFiles[i]) ? videoFiles[i] : (videoFiles[i] ? [videoFiles[i]] : []);
      files.forEach((f, fi) => f && data.append(`VideoFile_${i}_${fi}`, f));
      
      const docFiles = Array.isArray(documentFiles[i]) ? documentFiles[i] : (documentFiles[i] ? [documentFiles[i]] : []);
      docFiles.forEach((f, fi) => f && data.append(`DocFile_${i}_${fi}`, f));
    });

    try {
      await api.put(`/course/lessons/${activeItem.data.id}`, data);
      // Luôn tải lại data từ server để đảm bảo đồng bộ
      const freshCourse = await fetchCourseDetail();
      if (freshCourse) {
        const freshLesson = freshCourse.lessons?.find(l => l.id === activeItem.data.id);
        if (freshLesson?.sections && Array.isArray(freshLesson.sections) && freshLesson.sections.length > 0) {
          const parsedSections = freshLesson.sections.map(s => ({
            title: (s.title ?? s.Title) || '',
            content: (s.content ?? s.Content) ?? '',
            showVideo: Boolean(s.showVideo ?? s.ShowVideo),
            showQuiz: Boolean(s.showQuiz ?? s.ShowQuiz),
            showDocs: Boolean(s.showDocs ?? s.ShowDocs),
            videoUrls: (() => {
              const urls = (s.videoUrls ?? s.VideoUrls) ?? [];
              const single = (s.videoUrl ?? s.VideoUrl) || '';
              return Array.isArray(urls) && urls.length > 0 ? urls : (single ? [single] : []);
            })(),
            docUrls: (s.docUrls ?? s.DocUrls) ?? []
          }));
          setEditData(prev => ({ ...prev, sections: parsedSections }));
        }
      }
      // Xoá file tạm sau khi đã lưu thành công
      setVideoFiles(prev => {
        const next = { ...prev };
        editData.sections.forEach((_, i) => delete next[i]);
        return next;
      });
      setDocumentFiles(prev => {
        const next = { ...prev };
        editData.sections.forEach((_, i) => delete next[i]);
        return next;
      });
      setLocalPreviews(prev => {
        const next = { ...prev };
        editData.sections.forEach((_, i) => delete next[i]);
        return next;
      });
      const msg = saveType === 'content' ? 'Đã lưu nội dung!' : saveType === 'video' ? 'Đã lưu video!' : 'Đã lưu!';
      showToast(msg);
    } catch (err) { showToast('Lỗi khi lưu.', 'error'); } finally { setSubmitting(false); }
  };

  const onFileChange = (sectionIndex, files) => {
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      setVideoFiles(prev => ({ ...prev, [sectionIndex]: fileList.length === 1 && typeof sectionIndex === 'string' && sectionIndex.startsWith('introSec') ? fileList[0] : [...(prev[sectionIndex] || []), ...fileList] }));
      setLocalPreviews(prev => ({
        ...prev,
        [sectionIndex]: fileList.length === 1 && typeof sectionIndex === 'string' && sectionIndex.startsWith('introSec') ? URL.createObjectURL(fileList[0]) : [...(prev[sectionIndex] || []), ...fileList.map(f => URL.createObjectURL(f))]
      }));
    }
  };

  const onDocChange = (sectionIndex, files) => {
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      setDocumentFiles(prev => ({ ...prev, [sectionIndex]: [...(prev[sectionIndex] || []), ...fileList] }));
    }
  };

  const handleDeleteDoc = async (sectionIndex, sectionNum, docIndex, isLocal) => {
    if (submitting) return;
    const ok = await confirm({ title: 'Xóa tài liệu', message: 'Bạn có chắc chắn muốn xóa tài liệu này?', confirmText: 'Xóa' });
    if (!ok) return;
    try {
      if (isLocal) {
        if (sectionIndex === 'intro') {
          setDocumentFiles(prev => {
            const arr = [...(prev.intro || [])];
            arr.splice(docIndex, 1);
            return { ...prev, intro: arr.length ? arr : [] };
          });
        } else {
          setDocumentFiles(prev => {
            const arr = [...(prev[sectionIndex] || [])];
            arr.splice(docIndex, 1);
            const next = { ...prev };
            if (arr.length) next[sectionIndex] = arr; else delete next[sectionIndex];
            return next;
          });
        }
      } else {
        if (sectionIndex === 'intro') {
          const newList = editData.introDocUrls.filter((_, di) => di !== docIndex);
          setEditData(prev => ({ ...prev, introDocUrls: newList }));
          await handleSaveIntro('content', newList);
        } else if (sectionIndex === 'introSection') {
          const newIntroSections = editData.introSections.map((s, i) => 
            i === sectionNum 
              ? { ...s, docUrls: (s.docUrls || []).filter((_, di) => di !== docIndex) }
              : s
          );
          setEditData(prev => ({ ...prev, introSections: newIntroSections }));
          // Note: handleSaveIntro normally stringifies editData.introSections. 
          // We need to either pass it as override or let it use updated state.
          // Since it uses editData.introSections, we should pass it or wait.
          // Let's modify handleSaveIntro to accept both overrides.
          await handleSaveIntro('content', null, newIntroSections);
        } else {
          // Xoá doc bài học
          const newLessonSections = editData.sections.map((s, i) => 
            i === sectionIndex 
              ? { ...s, docUrls: s.docUrls.filter((_, di) => di !== docIndex) }
              : s
          );
          setEditData(prev => ({ ...prev, sections: newLessonSections }));
          await handleSaveLesson(sectionNum, 'content', newLessonSections);
        }
      }
      showToast('Đã xóa tài liệu.');
    } catch (err) { showToast('Lỗi khi xóa.', 'error'); }
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
    // Cập nhật view đang hiển thị
    setEditData(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
    // Đồng bộ vào danh sách bài học tổng trong course
    if (activeItem.data?.id) {
      setCourse(prev => prev ? ({
        ...prev,
        lessons: prev.lessons.map(l => 
          l.id === activeItem.data.id 
            ? { ...l, sections: l.sections.map((s, i) => i === index ? { ...s, [field]: value } : s) }
            : l
        )
      }) : null);
    }
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
    <div key={index} id={`section-panel-${index}`} className="mb-3 p-3 border rounded-4 bg-white shadow-sm">
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
            value={section.title || ''}
            onChange={e => updateSection(index, 'title', e.target.value)}
            placeholder="Tiêu đề mục..."
          />
        </div>
        <div className="d-flex align-items-center gap-3 ms-auto">
          <div className="form-check form-switch m-0">
            <input className="form-check-input cursor-pointer" type="checkbox" id={`showVideo${index}`} checked={!!section.showVideo} onChange={e => updateSection(index, 'showVideo', e.target.checked)} />
            <label className="form-check-label small fw-semibold cursor-pointer" htmlFor={`showVideo${index}`}>Video</label>
          </div>
          <div className="form-check form-switch m-0">
            <input className="form-check-input cursor-pointer" type="checkbox" id={`showQuiz${index}`} checked={!!section.showQuiz} onChange={e => updateSection(index, 'showQuiz', e.target.checked)} />
            <label className="form-check-label small fw-semibold cursor-pointer" htmlFor={`showQuiz${index}`}>Quiz</label>
          </div>
          <div className="form-check form-switch m-0">
            <input className="form-check-input cursor-pointer" type="checkbox" id={`showDocs${index}`} checked={!!section.showDocs} onChange={e => updateSection(index, 'showDocs', e.target.checked)} />
            <label className="form-check-label small fw-semibold cursor-pointer" htmlFor={`showDocs${index}`}>Tài liệu</label>
          </div>
          {editData.sections.length > 1 && (
            <button type="button" className="btn btn-sm btn-outline-secondary rounded-3" onClick={() => removeSection(index)} title="Xóa mục">
              <Minus size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="d-flex justify-content-end align-items-center gap-3 mb-2">
          <span className="text-muted small d-none d-md-inline"><kbd>Ctrl</kbd> + <kbd>S</kbd> để lưu nhanh</span>
          <button className="btn btn-sm btn-outline-secondary px-3 rounded-3 d-flex align-items-center gap-2" onClick={() => handleSaveLesson(num, 'content')} disabled={submitting}>
            {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Lưu nội dung
          </button>
        </div>
        <TiptapEditor 
          key={`lesson-${activeItem.data?.id}-${index}`} 
          content={section.content} 
          onChange={(val) => {
            // Cập nhật cả view hiện tại và danh sách bài học tổng
            updateSection(index, 'content', val);
            setCourse(prev => prev ? ({
              ...prev,
              lessons: prev.lessons.map(l => 
                l.id === activeItem.data.id 
                  ? { ...l, sections: l.sections.map((sec, i) => i === index ? { ...sec, content: val } : sec) }
                  : l
              )
            }) : null);
          }} 
        />
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

      {section.showDocs && (
        <div className="doc-section mt-4 p-3 bg-white rounded-4 border border-info border-opacity-25 shadow-sm">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <div className="d-flex align-items-center gap-2 text-dark fw-bold"><FileText size={18} className="text-info" /> Tài liệu đính kèm ({section.docUrls?.length || 0})</div>
            <button className="btn btn-sm btn-outline-info px-3 rounded-pill d-flex align-items-center gap-2" onClick={() => handleSaveLesson(num, 'content')} disabled={submitting}>
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Lưu tài liệu
            </button>
          </div>

          <div className="d-flex justify-content-center mb-3">
            <label className="btn btn-light py-3 px-4 rounded-3 border-2 border-dashed fw-bold d-block hover-bg-info-subtle transition-all cursor-pointer w-100">
              <Upload size={20} className="text-info mb-1 d-block mx-auto" />
              <span className="text-dark small d-block">Chọn Tài liệu (PDF, Word, Excel...)</span>
              <input type="file" className="d-none" multiple onChange={e => onDocChange(index, e.target.files)} />
            </label>
          </div>

          {((section.docUrls && section.docUrls.length > 0) || (documentFiles[index] && documentFiles[index].length > 0)) && (
            <div className="list-group list-group-flush rounded-3 border overflow-hidden">
              {(section.docUrls || []).map((url, di) => (
                <div key={`saved-doc-${di}`} className="list-group-item d-flex align-items-center justify-content-between py-2 px-3 bg-light bg-opacity-50">
                   <div className="d-flex align-items-center gap-2 overflow-hidden">
                      <FileText size={16} className="text-info flex-shrink-0" />
                      <a href={getFullUrl(url)} target="_blank" rel="noreferrer" className="small text-truncate text-decoration-none text-dark hover-text-primary">
                        {formatDocName(url)}
                      </a>
                   </div>
                   <button className="btn btn-link btn-xs text-danger p-0" onClick={() => handleDeleteDoc(index, num, di, false)}>
                      <Trash2 size={14} />
                   </button>
                </div>
              ))}
              {(documentFiles[index] || []).map((file, di) => (
                <div key={`new-doc-${di}`} className="list-group-item d-flex align-items-center justify-content-between py-2 px-3 bg-info bg-opacity-10">
                   <div className="d-flex align-items-center gap-2 overflow-hidden">
                      <FileText size={16} className="text-info flex-shrink-0" />
                      <span className="small text-truncate text-info fw-bold">{file.name} (Chưa lưu)</span>
                   </div>
                   <button className="btn btn-link btn-xs text-danger p-0" onClick={() => handleDeleteDoc(index, num, di, true)}>
                      <Trash2 size={14} />
                   </button>
                </div>
              ))}
            </div>
          )}
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
    if (course.companyId) data.append('CompanyId', course.companyId);
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

              <div className="flex-grow-1 flex-column d-flex overflow-hidden mb-2">
                <div className={`course-outline-item rounded-2 d-flex align-items-center gap-2 py-2 px-3 ${activeItem.type === 'intro' ? 'course-outline-item--active' : 'bg-white'}`}>
                  <button
                    type="button"
                    className="flex-grow-1 text-start border-0 bg-transparent d-flex align-items-center gap-2 py-1 min-w-0"
                    onClick={() => { selectIntro(); toggleLessonExpand('intro'); }}
                  >
                    <Star size={18} className={activeItem.type === 'intro' ? 'text-primary' : 'text-warning'} />
                    <span className="fw-semibold small flex-grow-1 course-outline-title">Giới thiệu khóa học</span>
                    {expandedLessonIds['intro'] ? <ChevronUp size={14} className="ms-auto text-muted" /> : <ChevronDown size={14} className="ms-auto text-muted" />}
                  </button>
                  {course.isPublished ? <CheckCircle2 size={18} className="text-success flex-shrink-0" /> : <span className="small text-muted flex-shrink-0">—</span>}
                </div>

                <AnimatePresence>
                  {expandedLessonIds['intro'] && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="ms-4 my-1 border-start ps-2 d-flex flex-column gap-1">
                        {(editData.introSections || []).map((sec, sIdx) => (
                          <button
                            key={`sidebar-intro-sec-${sIdx}`}
                            type="button"
                            className="btn btn-link p-2 text-start text-decoration-none d-flex align-items-center gap-2 hover-bg-light rounded-2 border-0"
                            style={{ fontSize: '0.78rem', color: '#64748b' }}
                            onClick={() => {
                              selectIntro();
                              setTimeout(() => {
                                // Cuộn đến panel intro section
                                const el = document.getElementById(`intro-section-${sIdx}`);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }, 100);
                            }}
                          >
                            <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
                              <LayoutList size={13} className="text-primary flex-shrink-0" />
                              <span className="text-truncate">{sec.title || `Mục ${sIdx + 1}`}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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
                      <Reorder.Item key={lesson.id} value={lesson} className="d-flex flex-column mb-2 group">
                        <div className="d-flex align-items-stretch gap-1">
                          <div className="cursor-grab text-muted opacity-50 d-flex align-items-center px-1" title="Kéo để sắp xếp">
                            <GripVertical size={14} />
                          </div>
                          <div className={`flex-grow-1 course-outline-item rounded-2 d-flex align-items-center gap-1 py-1 px-2 ${isActive ? 'course-outline-item--active' : 'bg-white'}`}>
                            <button
                              type="button"
                              className="flex-grow-1 text-start border-0 bg-transparent d-flex align-items-center gap-2 py-1 min-w-0"
                              onClick={() => { selectLesson(lesson); toggleLessonExpand(lesson.id); }}
                            >
                              <span className="small fw-bold text-muted flex-shrink-0">{idx + 1}</span>
                              <span className="small fw-semibold text-dark course-outline-title text-truncate">{lesson.title || 'Bài giảng mới'}</span>
                              {expandedLessonIds[lesson.id] ? <ChevronUp size={14} className="ms-auto text-muted" /> : <ChevronDown size={14} className="ms-auto text-muted" />}
                            </button>
                            <CheckCircle2 size={18} className="text-success flex-shrink-0" />
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
                        </div>
                        
                        {/* Chi tiết các mục con (Accordion) */}
                        <AnimatePresence>
                          {expandedLessonIds[lesson.id] && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="ms-4 my-1 border-start ps-2 d-flex flex-column gap-1">
                                {(lesson.sections || []).map((sec, sIdx) => (
                                  <button
                                    key={`sidebar-sec-${lesson.id}-${sIdx}`}
                                    type="button"
                                    className="btn btn-link p-2 text-start text-decoration-none d-flex align-items-center gap-2 hover-bg-light rounded-2 border-0"
                                    style={{ fontSize: '0.78rem', color: '#64748b' }}
                                    onClick={() => {
                                      selectLesson(lesson);
                                      setTimeout(() => {
                                        const el = document.getElementById(`section-panel-${sIdx}`);
                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      }, 100);
                                    }}
                                  >
                                    <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
                                      {sec.showVideo ? <Video size={13} className="text-primary flex-shrink-0" /> : (sec.showDocs ? <FileText size={13} className="text-info flex-shrink-0" /> : <Info size={13} className="text-secondary flex-shrink-0" />)}
                                      <span className="text-truncate">{sec.title || `Mục ${sIdx + 1}`}</span>
                                    </div>
                                    {sec.showQuiz && <CheckCircle2 size={12} className="text-success flex-shrink-0" />}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
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

                <div className="d-flex align-items-center gap-4 mb-4 p-3 bg-light rounded-4 border">
                  <div className="form-check form-switch m-0">
                    <input className="form-check-input cursor-pointer" type="checkbox" id="mainShowIntroVid" checked={!!editData.showIntroVideo} onChange={e => setEditData({...editData, showIntroVideo: e.target.checked})} />
                    <label className="form-check-label fw-bold text-dark cursor-pointer" htmlFor="mainShowIntroVid">Video giới thiệu</label>
                  </div>
                  <div className="form-check form-switch m-0">
                    <input className="form-check-input cursor-pointer" type="checkbox" id="mainShowIntroDoc" checked={!!editData.showIntroDocs} onChange={e => setEditData({...editData, showIntroDocs: e.target.checked})} />
                    <label className="form-check-label fw-bold text-dark cursor-pointer" htmlFor="mainShowIntroDoc">Tài liệu giới thiệu</label>
                  </div>
                  <div className="ms-auto">
                    <button className="btn btn-sm btn-outline-secondary px-3 rounded-3 d-flex align-items-center gap-2" onClick={() => handleSaveIntro('content')} disabled={submitting}>
                      {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Lưu thiết lập 
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                    <div className="d-flex justify-content-end mb-2">
                      <button className="btn btn-sm btn-outline-secondary px-3 rounded-3 d-flex align-items-center gap-2" onClick={() => handleSaveIntro('content')} disabled={submitting}>
                        {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Lưu nội dung
                      </button>
                    </div>
                    <label className="form-label small fw-bold text-secondary mb-3">Nội dung văn bản giới thiệu</label>
                    <TiptapEditor key="course-intro-main" content={editData.description} onChange={(val) => setEditData({...editData, description: val})} />
                </div>

                {/* Video giới thiệu tổng quan */}
                {editData.showIntroVideo && (
                  <div className="mb-4 p-4 bg-white border rounded-4 shadow-sm">
                  <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
                    <div className="d-flex align-items-center gap-2 text-dark fw-bold">
                       <Video size={20} className="text-primary" /> Video giới thiệu khóa học
                    </div>
                    <button className="btn btn-sm btn-outline-secondary px-3 rounded-3 d-flex align-items-center gap-2" onClick={() => handleSaveIntro('video')} disabled={submitting}>
                      {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Lưu video
                    </button>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label small fw-bold text-muted">Tải video giới thiệu lên từ máy tính</label>
                      <div className="d-flex justify-content-center">
                        <label className="btn btn-light py-4 px-4 rounded-3 border-2 border-dashed fw-bold d-block hover-bg-primary-subtle transition-all cursor-pointer w-100">
                          <Upload size={24} className="text-primary mb-2 d-block mx-auto" />
                          <span className="text-dark small d-block">Chọn tệp Video (.mp4, .mov...)</span>
                          <input type="file" className="d-none" accept="video/*" onChange={e => {
                            const file = e.target.files[0];
                            if (file) {
                              setVideoFiles(prev => ({ ...prev, intro: file }));
                              setLocalPreviews(prev => ({ ...prev, intro: URL.createObjectURL(file) }));
                            }
                          }} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {(editData.introVideoUrl || localPreviews.intro) && (
                    <div className="mt-4 pt-3 border-top">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="small text-muted fw-bold">Xem trước Video:</span>
                        {(editData.introVideoUrl || videoFiles.intro) && (
                          <button className="btn btn-sm btn-link text-danger p-0 d-flex align-items-center gap-1" onClick={() => handleDeleteVideo('intro')}>
                            <Trash2 size={14} /> Xóa tệp video đã tải
                          </button>
                        )}
                      </div>
                      <div className="ratio ratio-16x9 rounded-3 overflow-hidden border bg-black shadow-lg">
                        {localPreviews.intro ? (
                          <video controls src={localPreviews.intro} />
                        ) : (
                          <VideoPlayer src={editData.introVideoUrl} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

                {/* Tài liệu giới thiệu tổng quan */}
                {editData.showIntroDocs && (
                  <div className="mb-5 p-4 bg-white border rounded-4 shadow-sm">
                  <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
                    <div className="d-flex align-items-center gap-2 text-dark fw-bold">
                       <FileText size={20} className="text-info" /> Tài liệu khóa học (Tổng quan)
                    </div>
                    <button className="btn btn-sm btn-outline-info px-3 rounded-pill d-flex align-items-center gap-2" onClick={() => handleSaveIntro('content')} disabled={submitting}>
                      {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Lưu tài liệu
                    </button>
                  </div>

                  <div className="d-flex justify-content-center mb-3">
                    <label className="btn btn-light py-3 px-4 rounded-3 border-2 border-dashed fw-bold d-block hover-bg-info-subtle transition-all cursor-pointer w-100">
                      <Upload size={20} className="text-info mb-1 d-block mx-auto" />
                      <span className="text-dark small d-block">Chọn tài liệu cho khóa học (PDF, Word, Excel...)</span>
                      <input type="file" className="d-none" multiple onChange={e => {
                        const fileList = Array.from(e.target.files);
                        setDocumentFiles(prev => ({ ...prev, intro: [...(prev.intro || []), ...fileList] }));
                      }} />
                    </label>
                  </div>

                  {((editData.introDocUrls && editData.introDocUrls.length > 0) || (documentFiles.intro && documentFiles.intro.length > 0)) && (
                    <div className="list-group list-group-flush rounded-3 border overflow-hidden">
                      {(editData.introDocUrls || []).map((url, di) => (
                        <div key={`intro-saved-${di}`} className="list-group-item d-flex align-items-center justify-content-between py-2 px-3 bg-light bg-opacity-50">
                           <div className="d-flex align-items-center gap-2 overflow-hidden">
                              <FileText size={16} className="text-info flex-shrink-0" />
                              <a href={getFullUrl(url)} target="_blank" rel="noreferrer" className="small text-truncate text-decoration-none text-dark hover-text-primary">
                                {formatDocName(url)}
                              </a>
                           </div>
                           <button className="btn btn-link btn-xs text-danger p-0" onClick={() => handleDeleteDoc('intro', 0, di, false)}>
                              <Trash2 size={14} />
                           </button>
                        </div>
                      ))}
                      {(documentFiles.intro || []).map((file, di) => (
                        <div key={`intro-new-${di}`} className="list-group-item d-flex align-items-center justify-content-between py-2 px-3 bg-info bg-opacity-10">
                           <div className="d-flex align-items-center gap-2 overflow-hidden">
                              <FileText size={16} className="text-info flex-shrink-0" />
                              <span className="small text-truncate text-info fw-bold">{file.name} (Chưa lưu)</span>
                           </div>
                           <button className="btn btn-link btn-xs text-danger p-0" onClick={() => handleDeleteDoc('intro', 0, di, true)}>
                              <Trash2 size={14} />
                           </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
                
                {/* Cấu trúc mục giới thiệu bổ sung */}
                <div className="mt-4 p-4 bg-white border rounded-4 shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                       <LayoutList size={20} className="text-primary" /> Các mục giới thiệu khác 
                    </h5>
                    <div className="d-flex align-items-center gap-2">
                    <div className="d-flex align-items-center gap-3">
                      <span className="text-muted small d-none d-md-inline"><kbd>Ctrl</kbd> + <kbd>S</kbd> để lưu nhanh</span>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-secondary px-3 rounded-3 d-flex align-items-center gap-2" 
                        onClick={() => handleSaveIntro('content')} 
                        disabled={submitting}
                      >
                        {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Lưu nội dung
                      </button>
                    </div>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-primary fw-bold" 
                        onClick={() => setEditData({...editData, introSections: [...(editData.introSections || []), { title: '', content: '' }]})}
                      >
                        <Plus size={16} /> Thêm mục
                      </button>
                    </div>
                  </div>
                  
                  {(editData.introSections || []).length === 0 ? (
                    <div className="text-center py-4 bg-light rounded-3 border border-dashed">
                      <p className="text-muted small mb-0">Chưa có mục bổ sung nào. Nhấn "Thêm mục" để bắt đầu.</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {editData.introSections.map((section, idx) => (
                        <div key={idx} id={`intro-section-${idx}`} className="p-3 border rounded-3 bg-light position-relative">
                          <button 
                            type="button" 
                            className="btn btn-link link-danger p-1 position-absolute top-0 end-0 m-2"
                            onClick={() => {
                              const next = [...editData.introSections];
                              next.splice(idx, 1);
                              setEditData({...editData, introSections: next});
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-2 border-bottom">
                            <div className="flex-grow-1 me-4">
                              <label className="form-label small fw-bold">Tiêu đề mục</label>
                              <input 
                                type="text" 
                                className="form-control form-control-sm rounded-2 fw-bold" 
                                value={section.title || ''} 
                                onChange={e => {
                                  const newVal = e.target.value;
                                  setEditData(prev => ({
                                    ...prev,
                                    introSections: prev.introSections.map((s, i) => 
                                      i === idx ? { ...s, title: newVal } : s
                                    )
                                  }));
                                }} 
                                placeholder="Ví dụ: Lợi ích khóa học..."
                              />
                            </div>
                            <div className="d-flex align-items-center gap-3 pt-4">
                              <div className="form-check form-switch m-0">
                                <input className="form-check-input cursor-pointer" type="checkbox" id={`introVid${idx}`} checked={!!section.showVideo} onChange={e => {
                                  const newVal = e.target.checked;
                                  setEditData(prev => ({
                                    ...prev,
                                    introSections: prev.introSections.map((s, i) => i === idx ? { ...s, showVideo: newVal } : s)
                                  }));
                                }} />
                                <label className="form-check-label small fw-semibold cursor-pointer" htmlFor={`introVid${idx}`}>Video</label>
                              </div>
                              <div className="form-check form-switch m-0">
                                <input className="form-check-input cursor-pointer" type="checkbox" id={`introDoc${idx}`} checked={!!section.showDocs} onChange={e => {
                                  const newVal = e.target.checked;
                                  setEditData(prev => ({
                                    ...prev,
                                    introSections: prev.introSections.map((s, i) => i === idx ? { ...s, showDocs: newVal } : s)
                                  }));
                                }} />
                                <label className="form-check-label small fw-semibold cursor-pointer" htmlFor={`introDoc${idx}`}>Tài liệu</label>
                               </div>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <label className="form-label small fw-bold">Nội dung chi tiết</label>
                            <TiptapEditor 
                              key={`intro-sec-${idx}`}
                              content={section.content} 
                              onChange={val => {
                                setEditData(prev => ({
                                  ...prev,
                                  introSections: prev.introSections.map((s, i) => i === idx ? { ...s, content: val } : s)
                                }));
                              }} 
                            />
                          </div>

                          {section.showVideo && (
                            <div className="mb-3 p-3 bg-light rounded-3 border">
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <label className="form-label small fw-bold d-block mb-0 text-primary"><Video size={14} className="me-1" /> Video cho mục này</label>
                                <button className="btn btn-sm btn-outline-primary px-3 rounded-pill d-flex align-items-center gap-2" style={{ fontSize: '11px' }} onClick={() => handleSaveIntro('video')} disabled={submitting}>
                                  {submitting ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />} Lưu video
                                </button>
                              </div>
                              <input type="file" className="form-control form-control-sm mb-2" accept="video/*" onChange={e => onFileChange(`introSec_${idx}`, e.target.files)} />
                              {(section.videoUrl || section.VideoUrl || localPreviews[`introSec_${idx}`]) && (
                                <div className="ratio ratio-16x9 rounded-2 overflow-hidden border bg-black mt-2">
                                  {localPreviews[`introSec_${idx}`] ? <video controls src={localPreviews[`introSec_${idx}`]} /> : <VideoPlayer src={section.videoUrl || section.VideoUrl} />}
                                </div>
                              )}
                            </div>
                          )}

                          {section.showDocs && (
                            <div className="mt-3 p-3 bg-white rounded-3 border border-info border-opacity-25 shadow-sm">
                              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                                <div className="d-flex align-items-center gap-2 fw-bold small text-info">
                                  <FileText size={16} /> Tài liệu cho mục này ({(section.docUrls || []).length})
                                </div>
                                <button className="btn btn-sm btn-outline-info px-3 rounded-pill d-flex align-items-center gap-2" onClick={() => handleSaveIntro('content')} disabled={submitting}>
                                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Lưu tài liệu
                                </button>
                              </div>

                              <label className="btn btn-light py-3 px-4 rounded-3 border-2 border-dashed fw-bold d-block hover-bg-info-subtle transition-all cursor-pointer w-100 mb-2">
                                <Upload size={20} className="text-info mb-1 d-block mx-auto" />
                                <span className="text-dark small d-block text-center">Chọn tài liệu (PDF, Word, Excel...)</span>
                                <input type="file" className="d-none" multiple onChange={e => onDocChange(`introSec_${idx}`, e.target.files)} />
                              </label>

                              {((section.docUrls || section.DocUrls || []).length > 0 || (documentFiles[`introSec_${idx}`] && documentFiles[`introSec_${idx}`].length > 0)) && (
                                <div className="list-group list-group-flush rounded-3 border overflow-hidden mt-2">
                                  {(section.docUrls || section.DocUrls || []).map((url, di) => (
                                    <div key={di} className="list-group-item d-flex align-items-center justify-content-between py-2 px-3 bg-light bg-opacity-50">
                                      <div className="d-flex align-items-center gap-2 overflow-hidden">
                                        <FileText size={16} className="text-info flex-shrink-0" />
                                        <a href={getFullUrl(url)} target="_blank" rel="noreferrer" className="small text-truncate text-decoration-none text-dark hover-text-primary">
                                          {formatDocName(url)}
                                        </a>
                                      </div>
                                      <button className="btn btn-link btn-xs text-danger p-0" onClick={() => handleDeleteDoc('introSection', idx, di, false)}>
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}
                                  {(documentFiles[`introSec_${idx}`] || []).map((file, di) => (
                                    <div key={`new-${di}`} className="list-group-item d-flex align-items-center justify-content-between py-2 px-3 bg-info bg-opacity-10">
                                      <div className="d-flex align-items-center gap-2 overflow-hidden">
                                        <FileText size={16} className="text-info flex-shrink-0" />
                                        <span className="small text-truncate text-info fw-bold">{file.name} (Chưa lưu)</span>
                                      </div>
                                      <button className="btn btn-link btn-xs text-danger p-0" onClick={() => handleDeleteDoc('introSection', idx, di, true)}>
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="lesson-editor">
                <div className="d-flex justify-content-between align-items-center mb-3 bg-white p-3 rounded-4 shadow-sm border">
                  <h4 className="fw-bold mb-0 text-dark">{editData.title}</h4>
                </div>

                <div className="row mb-4 bg-white p-3 mx-0 rounded-3 shadow-sm border">
                  <div className="col-12">
                    <label className="form-label small fw-bold text-secondary">Tiêu đề bài học</label>
                    <input 
                      type="text" 
                      className="form-control form-control-lg rounded-3 fw-bold" 
                      value={editData.title || ''} 
                      onChange={e => {
                        const newVal = e.target.value;
                        setEditData(prev => ({ ...prev, title: newVal }));
                        // Đồng bộ với danh sách bài học tổng
                        setCourse(prev => prev ? ({
                          ...prev,
                          lessons: prev.lessons.map(l => l.id === activeItem.data?.id ? { ...l, title: newVal } : l)
                        }) : null);
                      }} 
                    />
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
