import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import {
  Search, Loader2, BookOpen, Clock, ClipboardCheck, Eye,
  GraduationCap, TrendingUp, CheckCircle2, Activity, Video, PlayCircle, Building2, ChevronRight, ArrowLeft
} from 'lucide-react';

const Learners = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterCompanyId, setFilterCompanyId] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [quizHistoryModal, setQuizHistoryModal] = useState(null); // { enrollmentId, quizId, quizTitle, attempts: [] }
  const [quizHistoryLoading, setQuizHistoryLoading] = useState(false);
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  });
  const isSuperAdmin = user.roles?.includes('SuperAdmin');

  const effectiveCompanyId = isSuperAdmin && selectedCompanyId ? selectedCompanyId : filterCompanyId;
  const showCompanyList = isSuperAdmin && !selectedCompanyId;

  useEffect(() => {
    if (!showCompanyList) fetchEnrollments();
    fetchCourses();
    if (isSuperAdmin) fetchCompanies();
  }, [filterCourseId, effectiveCompanyId, isSuperAdmin, showCompanyList]);

  useEffect(() => {
    if (isSuperAdmin && effectiveCompanyId) {
      setFilterCourseId('');
    }
  }, [effectiveCompanyId, isSuperAdmin]);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCourseId) params.set('courseId', filterCourseId);
      if (isSuperAdmin && effectiveCompanyId) params.set('companyId', effectiveCompanyId);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      const response = await api.get(`/learner/enrollments?${params}`);
      setEnrollments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/course');
      setCourses(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/superadmin/companies');
      setCompanies(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = () => {
    fetchEnrollments();
  };

  const openDetail = async (enrollmentId) => {
    setDetailModal(null);
    setDetailLoading(true);
    try {
      const response = await api.get(`/learner/enrollments/${enrollmentId}`);
      setDetailModal(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const openQuizHistory = async (enrollmentId, quizId, quizTitle) => {
    if (!enrollmentId || !quizId) return;
    setQuizHistoryModal({ enrollmentId, quizId, quizTitle: quizTitle || 'Bài kiểm tra', attempts: [] });
    setQuizHistoryLoading(true);
    try {
      const res = await api.get(`/learner/enrollments/${enrollmentId}/quizzes/${quizId}/attempts`);
      const attempts = Array.isArray(res.data) ? res.data : [];
      setQuizHistoryModal(prev => prev ? { ...prev, attempts } : prev);
    } catch (err) {
      console.error(err);
    } finally {
      setQuizHistoryLoading(false);
    }
  };

  const formatTime = (minutes) => {
    if (!minutes || minutes < 0) return '0 phút';
    if (minutes < 60) return `${minutes} phút`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}p` : `${h} giờ`;
  };

  const getProgressColor = (pct) => {
    if (pct >= 100) return 'success';
    if (pct >= 50) return 'primary';
    if (pct > 0) return 'warning';
    return 'secondary';
  };

  const filteredCourses = isSuperAdmin && effectiveCompanyId
    ? courses.filter(c => c.companyId == null || c.companyId === parseInt(effectiveCompanyId, 10))
    : courses;

  const filteredBySearch = enrollments.filter(e => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (e.fullName && e.fullName.toLowerCase().includes(term)) ||
      (e.email && e.email.toLowerCase().includes(term)) ||
      (e.userName && e.userName.toLowerCase().includes(term)) ||
      (e.courseTitle && e.courseTitle.toLowerCase().includes(term))
    );
  });

  const displayCompanies = companies.filter(c => c.subDomain !== 'admin');

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold tracking-tight mb-1 d-flex align-items-center gap-2">
          <GraduationCap size={28} className="text-primary" />
          Theo dõi học viên
        </h2>
        <p className="text-muted small mb-0">
          {isSuperAdmin ? 'Chọn công ty để xem danh sách học viên và tiến độ.' : 'Xem danh sách học viên và tiến độ học tập.'}
        </p>
      </div>

      {/* 1. Stats cards - trên cùng */}
      {!showCompanyList && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-primary text-white">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="small opacity-75 fw-bold">TỔNG ĐĂNG KÝ</div>
                  <div className="fs-3 fw-bold">{filteredBySearch.length}</div>
                </div>
                <BookOpen size={36} className="opacity-30" />
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-success text-white">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="small opacity-75 fw-bold">ĐÃ HOÀN THÀNH</div>
                  <div className="fs-3 fw-bold">{filteredBySearch.filter(e => e.status === 'Completed').length}</div>
                </div>
                <CheckCircle2 size={36} className="opacity-30" />
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-warning text-dark">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="small opacity-75 fw-bold">ĐANG HỌC</div>
                  <div className="fs-3 fw-bold">{filteredBySearch.filter(e => e.status === 'InProgress').length}</div>
                </div>
                <TrendingUp size={36} className="opacity-30" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Bộ lọc - dưới stats, trên khung nội dung */}
      {!showCompanyList && (
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-3">
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label small fw-bold text-secondary">Khóa học</label>
                <select
                  className="form-select rounded-3"
                  value={filterCourseId}
                  onChange={(e) => setFilterCourseId(e.target.value)}
                >
                  <option value="">Tất cả khóa học</option>
                  {filteredCourses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold text-secondary">Tìm kiếm</label>
                <div className="input-group bg-light border-0 rounded-3">
                  <span className="input-group-text bg-transparent border-0 text-muted"><Search size={18} /></span>
                  <input
                    type="text"
                    className="form-control bg-transparent border-0 py-2"
                    placeholder="Họ tên, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold text-secondary d-block">&nbsp;</label>
                <button className="btn btn-primary w-100 rounded-3 fw-bold" onClick={handleSearch}>
                  Tìm kiếm
                </button>
              </div>
              {isSuperAdmin && selectedCompanyId && (
                <div className="col-md-2 d-flex align-items-end">
                  <button
                    className="btn btn-outline-secondary w-100 rounded-3 fw-bold d-flex align-items-center gap-1"
                    onClick={() => { setSelectedCompanyId(null); setFilterCompanyId(''); }}
                  >
                    <ArrowLeft size={16} /> Quay về
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Khung nội dung: Danh sách công ty HOẶC Bảng học viên */}
      {showCompanyList ? (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-body p-4">
            <h6 className="fw-bold text-secondary mb-3">Chọn công ty để xem danh sách học viên</h6>
            <div className="row g-3">
              {displayCompanies.length === 0 ? (
                <div className="col-12 text-center py-5 text-muted">Chưa có công ty nào.</div>
              ) : (
                displayCompanies.map((c) => (
                  <div key={c.id} className="col-12 col-md-6 col-lg-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 cursor-pointer"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedCompanyId(c.id.toString())}
                    >
                      <div className="card-body d-flex align-items-center gap-3 py-4">
                        <div className="p-3 rounded-3 bg-primary bg-opacity-10">
                          <Building2 size={32} className="text-primary" />
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <div className="fw-bold text-dark">{c.companyName || c.subDomain}</div>
                          <div className="small text-muted">{c.subDomain}</div>
                        </div>
                        <ChevronRight size={20} className="text-muted flex-shrink-0" />
                      </div>
                    </motion.div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-body p-0">
        <div className="table-responsive admin-table-framed-wrapper">
          <table className="table table-hover align-middle mb-0 admin-table-framed">
            <thead className="bg-light border-bottom">
              <tr>
                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase">Học viên</th>
                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Khóa học</th>
                {isSuperAdmin && !selectedCompanyId && <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Công ty</th>}
                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase text-center">Tiến độ</th>
                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase text-center">Thời gian học</th>
                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase text-center">Bài làm</th>
                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase text-end">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isSuperAdmin && !selectedCompanyId ? 7 : 6} className="text-center py-5">
                    <Loader2 className="animate-spin text-primary" size={32} />
                  </td>
                </tr>
              ) : filteredBySearch.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin && !selectedCompanyId ? 7 : 6} className="text-center py-5 text-muted">
                    Chưa có học viên nào đăng ký khóa học.
                  </td>
                </tr>
              ) : (
                filteredBySearch.map((e) => (
                  <tr key={e.enrollmentId}>
                    <td className="px-4 py-3">
                      <motion.div whileHover={{ x: 3 }} className="d-flex flex-column">
                        <span className="fw-bold text-dark">{e.fullName}</span>
                        <span className="text-muted small">{e.email || e.userName || '—'}</span>
                      </motion.div>
                    </td>
                    <td className="py-3">
                      <div className="d-flex align-items-center gap-2">
                        <BookOpen size={16} className="text-primary flex-shrink-0" />
                        <span>{e.courseTitle}</span>
                      </div>
                    </td>
                    {isSuperAdmin && !selectedCompanyId && (
                      <td className="py-3">
                        <span className="badge bg-light text-dark border">{e.companyName || '—'}</span>
                      </td>
                    )}
                    <td className="py-3 text-center">
                      {e.enrollmentId === 0 ? (
                        <span className="text-muted small">—</span>
                      ) : (
                        <>
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <div className="progress flex-grow-1" style={{ maxWidth: 80, height: 8 }}>
                              <div
                                className={`progress-bar bg-${getProgressColor(e.progressPercentage)}`}
                                style={{ width: `${Math.min(100, e.progressPercentage)}%` }}
                              />
                            </div>
                            <span className="small fw-bold" style={{ minWidth: 42 }}>
                              {e.progressPercentage?.toFixed(0) ?? 0}%
                            </span>
                          </div>
                          <div className="small text-muted mt-1">
                            {e.completedLessons}/{e.totalLessons} bài
                          </div>
                        </>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <div className="d-flex align-items-center justify-content-center gap-1">
                        <Clock size={14} className="text-muted" />
                        <span>{formatTime(e.totalLearningTimeMinutes)}</span>
                      </div>
                      {!e.hasStartedLearning && (
                        <span className="badge bg-secondary-subtle text-secondary small mt-1">Chưa bắt đầu</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {e.enrollmentId === 0 ? (
                        <span className="badge bg-secondary-subtle text-secondary">—</span>
                      ) : e.quizAttemptsCount === 0 ? (
                        <span className="badge bg-secondary-subtle text-secondary">Chưa làm</span>
                      ) : (
                        <div className="d-flex align-items-center justify-content-center gap-1 flex-wrap">
                          <ClipboardCheck size={14} className="text-primary" />
                          <span className="small">
                            {e.quizPassedCount}/{e.quizAttemptsCount} đạt
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-end">
                      {e.enrollmentId === 0 ? (
                        <span className="text-muted small">Chưa có dữ liệu</span>
                      ) : (
                        <button
                          className="btn btn-white btn-sm p-2 rounded-3 border shadow-sm text-primary hover-bg-primary-subtle transition-all"
                          onClick={() => openDetail(e.enrollmentId)}
                          title="Xem chi tiết tiến độ"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {(detailModal || detailLoading) && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom">
                <h5 className="fw-bold mb-0">Chi tiết tiến độ học viên</h5>
                <button type="button" className="btn-close" onClick={() => setDetailModal(null)} />
              </div>
              <div className="modal-body">
                {detailLoading ? (
                  <div className="text-center py-5">
                    <Loader2 className="animate-spin text-primary" size={40} />
                  </div>
                ) : detailModal ? (
                  <>
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded-3">
                          <div className="small text-muted fw-bold">Học viên</div>
                          <div className="fw-bold">{detailModal.userName}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded-3">
                          <div className="small text-muted fw-bold">Khóa học</div>
                          <div className="fw-bold">{detailModal.courseTitle}</div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="p-3 bg-primary text-white rounded-3">
                          <div className="small opacity-75">Tiến độ</div>
                          <div className="fs-4 fw-bold">{detailModal.progressPercentage?.toFixed(0) ?? 0}%</div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="p-3 bg-success text-white rounded-3">
                          <div className="small opacity-75">Thời gian học</div>
                          <div className="fs-4 fw-bold">{formatTime(detailModal.totalLearningTimeMinutes)}</div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className={`p-3 rounded-3 ${detailModal.status === 'Completed' ? 'bg-success text-white' : 'bg-warning text-dark'}`}>
                          <div className="small opacity-75">Trạng thái</div>
                          <div className="fw-bold">{detailModal.status === 'Completed' ? 'Hoàn thành' : 'Đang học'}</div>
                        </div>
                      </div>
                    </div>

                    <h6 className="fw-bold text-secondary mb-3 d-flex align-items-center gap-2">
                      <CheckCircle2 size={18} /> Tiến độ bài học
                    </h6>
                    <div className="table-responsive mb-4">
                      <table className="table table-sm table-bordered">
                        <thead className="bg-light">
                          <tr>
                            <th>#</th>
                            <th>Bài học</th>
                            <th className="text-center">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(detailModal.lessonProgress || []).map((lp, i) => (
                            <tr key={lp.lessonId}>
                              <td>{i + 1}</td>
                              <td>{lp.lessonTitle}</td>
                              <td className="text-center">
                                {lp.isCompleted ? (
                                  <span className="badge bg-success">Đã hoàn thành</span>
                                ) : (
                                  <span className="badge bg-secondary">Chưa hoàn thành</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <h6 className="fw-bold text-secondary mb-3 d-flex align-items-center gap-2">
                      <ClipboardCheck size={18} /> Kết quả bài làm
                    </h6>
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered">
                        <thead className="bg-light">
                          <tr>
                            <th>Bài kiểm tra</th>
                            <th className="text-center">Điểm</th>
                            <th className="text-center">Đúng / Tổng</th>
                            <th className="text-center">Kết quả</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(detailModal.quizAttempts || []).length === 0 ? (
                            <tr>
                              <td colSpan="4" className="text-center text-muted py-3">Chưa có bài làm nào</td>
                            </tr>
                          ) : (
                            (detailModal.quizAttempts || []).map((qa) => (
                              <tr key={qa.attemptId}>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-link p-0 text-decoration-none fw-semibold"
                                    onClick={() => openQuizHistory(detailModal.enrollmentId, qa.quizId, qa.quizTitle)}
                                    title="Xem tất cả lần làm"
                                  >
                                    {qa.quizTitle}
                                  </button>
                                </td>
                                <td className="text-center fw-bold">{qa.score}%</td>
                                <td className="text-center">{qa.correctAnswers}/{qa.totalQuestions}</td>
                                <td className="text-center">
                                  {qa.isPassed ? (
                                    <span className="badge bg-success">Đạt</span>
                                  ) : (
                                    <span className="badge bg-danger">Chưa đạt</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <h6 className="fw-bold text-secondary mb-3 mt-4 d-flex align-items-center gap-2">
                      <Activity size={18} /> Lịch sử hành vi học tập
                    </h6>
                    <div className="border rounded-3 overflow-hidden" style={{ maxHeight: 280, overflowY: 'auto' }}>
                      {(detailModal.behaviorEvents || []).length === 0 ? (
                        <div className="p-4 text-center text-muted small">Chưa có dữ liệu hành vi</div>
                      ) : (
                        <div className="list-group list-group-flush">
                          {(detailModal.behaviorEvents || []).map((evt) => {
                            const label = {
                              PageEnter: { icon: PlayCircle, text: 'Vào trang học', color: 'primary' },
                              LessonViewed: { icon: BookOpen, text: 'Xem bài học', color: 'info' },
                              SectionViewed: { icon: BookOpen, text: 'Xem mục nội dung', color: 'info' },
                              LessonCompleted: { icon: CheckCircle2, text: 'Hoàn thành bài học', color: 'success' },
                              VideoCompleted: { icon: Video, text: 'Xem xong video', color: 'primary' },
                              QuizSubmitted: { icon: ClipboardCheck, text: 'Nộp bài kiểm tra', color: 'warning' }
                            }[evt.eventType] || { icon: Activity, text: evt.eventType, color: 'secondary' };
                            const Icon = label.icon;
                            let meta = '';
                            try {
                              if (evt.metadata) {
                                const m = JSON.parse(evt.metadata);
                                if (m.lessonTitle) meta = m.lessonTitle;
                                if (m.sectionNum) meta += meta ? ` - Mục ${m.sectionNum}` : `Mục ${m.sectionNum}`;
                                if (m.score != null) meta += (meta ? ' | ' : '') + `Điểm: ${m.score}%`;
                                if (m.isPassed != null) meta += (meta ? ' ' : '') + (m.isPassed ? '(Đạt)' : '(Chưa đạt)');
                              }
                            } catch { meta = evt.metadata || ''; }
                            return (
                              <div key={evt.id} className="list-group-item d-flex align-items-center gap-3 py-2 px-3 border-0 border-bottom">
                                <div className={`p-1 rounded-2 bg-${label.color} bg-opacity-25`}>
                                  <Icon size={16} className={`text-${label.color}`} />
                                </div>
                                <div className="flex-grow-1 min-w-0">
                                  <div className="small fw-bold text-dark">{label.text}</div>
                                  {meta && <div className="small text-muted text-truncate">{meta}</div>}
                                </div>
                                <div className="small text-muted flex-shrink-0">
                                  {new Date(evt.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz history modal (all attempts of one quiz) */}
      {quizHistoryModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom">
                <div className="d-flex flex-column">
                  <h5 className="fw-bold mb-0">Lịch sử bài làm</h5>
                  <div className="small text-muted">{quizHistoryModal.quizTitle}</div>
                </div>
                <button type="button" className="btn-close" onClick={() => setQuizHistoryModal(null)} />
              </div>
              <div className="modal-body">
                {quizHistoryLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="animate-spin text-primary" size={36} />
                  </div>
                ) : (quizHistoryModal.attempts || []).length === 0 ? (
                  <div className="text-center text-muted py-4">Chưa có lần làm nào.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th style={{ width: 44 }} className="text-center">#</th>
                          <th>Thời gian nộp</th>
                          <th className="text-center">Điểm</th>
                          <th className="text-center">Đúng/Tổng</th>
                          <th className="text-center">KQ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(quizHistoryModal.attempts || []).map((a, idx) => (
                          <tr key={a.attemptId || idx}>
                            <td className="text-center">{idx + 1}</td>
                            <td>{a.completedAt ? new Date(a.completedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                            <td className="text-center fw-bold">{a.score}%</td>
                            <td className="text-center">{a.correctAnswers}/{a.totalQuestions}</td>
                            <td className="text-center">
                              {a.isPassed ? <span className="badge bg-success">Đạt</span> : <span className="badge bg-danger">Chưa đạt</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer border-top">
                <button className="btn btn-secondary rounded-3" onClick={() => setQuizHistoryModal(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Learners;
