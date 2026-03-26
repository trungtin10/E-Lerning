import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { useNotify } from '../../../context/NotifyContext';
import {
  ArrowLeft, Loader2, Users, RefreshCw, ChevronRight, ClipboardCheck, Clock
} from 'lucide-react';

const QuizBuilder = () => {
  const { id } = useParams(); // CourseId
  const navigate = useNavigate();
  const { toast } = useNotify();
  const [searchParams, setSearchParams] = useSearchParams();
  const lessonId = searchParams.get('lessonId') || null;
  const section = searchParams.get('section');

  const [course, setCourse] = useState(null);
  const [quizList, setQuizList] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [showLearningTimes, setShowLearningTimes] = useState(false);
  const [learningTimes, setLearningTimes] = useState([]);
  const [learningTimesLoading, setLearningTimesLoading] = useState(false);
  const [attemptDetail, setAttemptDetail] = useState(null);
  const [attemptDetailLoading, setAttemptDetailLoading] = useState(false);

  const isDetailView = section != null && section !== '';

  useEffect(() => {
    (async () => {
      await fetchCourse();
      await fetchQuizList();
    })();
  }, [id]);

  useEffect(() => {
    if (isDetailView) {
      setResultsLoading(true);
      fetchResults().finally(() => setResultsLoading(false));
    }
  }, [id, lessonId, section]);

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/course/${id}`);
      setCourse(res.data);
      return res.data;
    } catch {
      setCourse(null);
      return null;
    }
  };

  const fetchQuizList = async () => {
    try {
      const res = await api.get(`/quiz/${id}/quizzes-with-results`);
      const list = res.data || [];
      setQuizList(list);
    } catch {
      setQuizList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const url = `/quiz/${id}/results?section=${section}${lessonId != null && lessonId !== '' ? `&lessonId=${lessonId}` : ''}`;
      const res = await api.get(url);
      setResults(res.data || []);
      return res.data || [];
    } catch {
      setResults([]);
      return [];
    }
  };

  const handleSyncResults = async () => {
    setSyncing(true);
    try {
      const data = await fetchResults();
      toast(`Đã đồng bộ: ${data.length} học viên`, 'success');
    } catch {
      toast('Không thể đồng bộ.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSelectQuiz = (item) => {
    const params = { section: String(item.sectionNumber) };
    if (item.lessonId != null) params.lessonId = String(item.lessonId);
    setSearchParams(params);
  };

  const handleBackToList = () => {
    setSearchParams({});
    setResults([]);
  };

  const fetchLearningTimes = async () => {
    setLearningTimesLoading(true);
    try {
      const res = await api.get(`/learning/learning-times/${id}`);
      setLearningTimes(res.data || []);
      setShowLearningTimes(true);
    } catch {
      toast('Không thể tải tổng thời gian học.', 'error');
    } finally {
      setLearningTimesLoading(false);
    }
  };

  const fetchAttemptDetail = async (attemptId) => {
    if (!attemptId) return;
    setAttemptDetailLoading(true);
    setAttemptDetail(null);
    try {
      const res = await api.get(`/quiz/attempt/${attemptId}/detail`);
      setAttemptDetail(res.data);
    } catch {
      toast('Không thể tải chi tiết bài làm.', 'error');
    } finally {
      setAttemptDetailLoading(false);
    }
  };

  if (loading && !isDetailView) {
    return <AdminLayout><div className="text-center py-5"><Loader2 className="animate-spin text-primary" size={48} /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-light rounded-circle p-2 shadow-sm" onClick={() => isDetailView ? handleBackToList() : navigate(`/admin/courses/${id}`)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="fw-bold tracking-tight mb-0">
              {isDetailView ? `Kết quả: ${quizList.find(q => String(q.lessonId || '') === String(lessonId || '') && String(q.sectionNumber) === section)?.displayTitle || 'Bài trắc nghiệm'}` : 'Tổng hợp kết quả trắc nghiệm'}
            </h2>
            <p className="text-muted small mb-0">Khóa học: <span className="fw-bold text-primary">{course?.title || '—'}</span></p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          {isDetailView ? (
            <button className="btn btn-primary btn-sm rounded-3 d-flex align-items-center gap-2" onClick={handleSyncResults} disabled={syncing}>
              {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Đồng bộ kết quả
            </button>
          ) : (
            <button className="btn btn-outline-primary btn-sm rounded-3 d-flex align-items-center gap-2" onClick={() => { setLoading(true); fetchQuizList(); }} disabled={loading} title="Tải lại danh sách bài trắc nghiệm">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Đồng bộ danh sách
            </button>
          )}
        </div>
      </div>

      {!isDetailView ? (
        /* Danh sách các bài trắc nghiệm có học viên đã làm */
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
            <ClipboardCheck size={22} className="text-primary" />
            Chọn bài trắc nghiệm để xem kết quả
          </h5>
          {quizList.length > 0 ? (
            <div className="list-group list-group-flush">
              {quizList.map((item) => (
                <button
                  key={`${item.lessonId ?? 'f'}-${item.sectionNumber}`}
                  type="button"
                  className="list-group-item list-group-item-action d-flex align-items-center justify-content-between py-3 px-4 rounded-3 border-0 mb-2 hover-bg-light"
                  style={{ backgroundColor: '#f8fafc' }}
                  onClick={() => handleSelectQuiz(item)}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-2 rounded-3 bg-primary bg-opacity-10">
                      <ClipboardCheck size={20} className="text-primary" />
                    </div>
                    <div className="text-start">
                      <div className="fw-bold text-dark">{item.displayTitle ?? item.DisplayTitle ?? '—'}</div>
                      <div className="small text-muted">{(item.attemptCount ?? item.AttemptCount ?? 0)} học viên đã làm</div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-muted" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <ClipboardCheck size={48} className="text-muted opacity-50 mb-3" />
              <p className="text-muted mb-0">Chưa có bài trắc nghiệm nào trong khóa học. Thêm bài trắc nghiệm trong phần chỉnh sửa bài học.</p>
              <button className="btn btn-outline-primary btn-sm mt-3 rounded-3" onClick={() => navigate(`/admin/courses/${id}`)}>Chỉnh sửa khóa học</button>
            </div>
          )}
        </div>
      ) : (
        /* Chi tiết: trang tổng hợp kết quả làm bài của học viên */
        <>
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
            <Users size={22} className="text-primary" />
            Tổng hợp kết quả làm bài của học viên
          </h5>
          {resultsLoading ? (
            <div className="text-center py-5">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : results.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th className="border-0">#</th>
                    <th className="border-0">Tên học viên</th>
                    <th className="border-0 text-end">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr
                      key={idx}
                      role="button"
                      className="cursor-pointer"
                      onClick={() => r.attemptId && fetchAttemptDetail(r.attemptId)}
                      style={{ cursor: r.attemptId ? 'pointer' : 'default' }}
                    >
                      <td>{idx + 1}</td>
                      <td>{r.userName}</td>
                      <td className="text-end fw-bold">
                        <span className={r.correctAnswers === r.totalQuestions ? 'text-success' : ''}>
                          {r.correctAnswers}/{r.totalQuestions}
                        </span>
                        {r.attemptId && <ChevronRight size={16} className="ms-1 text-muted d-inline-block" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted small mb-0">Chưa có học viên nào làm bài trắc nghiệm này.</p>
          )}
        </div>

        {(attemptDetail || attemptDetailLoading) && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => { if (!attemptDetailLoading) setAttemptDetail(null); }}>
            <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
              <div className="modal-content rounded-4 shadow">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                    <ClipboardCheck size={22} className="text-primary" />
                    Chi tiết bài làm: {attemptDetail?.userName || '...'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setAttemptDetail(null)} disabled={attemptDetailLoading} />
                </div>
                <div className="modal-body pt-2">
                  {attemptDetailLoading ? (
                    <div className="text-center py-5"><Loader2 className="animate-spin text-primary" size={40} /></div>
                  ) : attemptDetail ? (
                    <>
                      <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3" style={{ backgroundColor: attemptDetail.isPassed ? 'rgba(25,135,84,0.1)' : 'rgba(220,53,69,0.1)' }}>
                        <span className={`fw-bold fs-4 ${attemptDetail.isPassed ? 'text-success' : 'text-danger'}`}>
                          {attemptDetail.score}% - {attemptDetail.correctAnswers}/{attemptDetail.totalQuestions} đúng
                        </span>
                        <span className="badge bg-secondary">{attemptDetail.quizTitle}</span>
                        <span className="text-muted small">
                          {new Date(attemptDetail.completedAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="d-flex flex-column gap-4">
                        {(attemptDetail.questions || []).map((q, qIdx) => {
                          const selectedAns = (q.answers || []).find(a => a.id === q.selectedAnswerId);
                          const correctAns = (q.answers || []).find(a => a.isCorrect);
                          const isCorrect = q.isCorrect === true;
                          return (
                            <div key={q.questionId} className="border rounded-3 p-3 bg-white">
                              <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                                <div className="fw-bold text-dark">
                                  Câu {qIdx + 1}: {(q.content || '').replace(/^Câu\s*\d+:\s*/i, '').trim() || q.content}
                                </div>
                                <span className={`badge ${isCorrect === true ? 'bg-success' : isCorrect === false ? 'bg-danger' : 'bg-secondary'}`}>
                                  {isCorrect === true ? 'Đúng' : isCorrect === false ? 'Sai' : '—'}
                                </span>
                              </div>
                              {selectedAns ? (
                                <>
                                  <div className="mb-2 p-2 rounded-2 border" style={{ backgroundColor: isCorrect ? 'rgba(25,135,84,0.1)' : 'rgba(220,53,69,0.1)', borderColor: isCorrect ? 'var(--bs-success)' : 'var(--bs-danger)' }}>
                                    <div className="small text-muted mb-1">Đáp án học viên chọn:</div>
                                    <div className="fw-semibold">{selectedAns.content}</div>
                                  </div>
                                  {correctAns && (
                                    <div className="p-2 rounded-2 border bg-success bg-opacity-10 border-success">
                                      <div className="small text-muted mb-1">Đáp án đúng:</div>
                                      <div className="fw-semibold text-success">{correctAns.content}</div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="mb-2 p-2 rounded-2 border bg-warning bg-opacity-10 border-warning">
                                    <div className="small text-muted">Không có dữ liệu đáp án học viên đã chọn (bài làm cũ hoặc chưa lưu)</div>
                                  </div>
                                  {correctAns && (
                                    <div className="p-2 rounded-2 border bg-success bg-opacity-10 border-success">
                                      <div className="small text-muted mb-1">Đáp án đúng:</div>
                                      <div className="fw-semibold text-success">{correctAns.content}</div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {showLearningTimes && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowLearningTimes(false)}>
            <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
              <div className="modal-content rounded-4 shadow">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                    <Clock size={22} className="text-primary" />
                    Tổng thời gian học (thực tế)
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowLearningTimes(false)} />
                </div>
                <div className="modal-body pt-2">
                  <p className="text-muted small mb-3">Chỉ tính khi học viên đang ở trang học, dừng khi thoát ra.</p>
                  {learningTimes.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-sm mb-0">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Tên học viên</th>
                            <th className="text-end">Thời gian</th>
                          </tr>
                        </thead>
                        <tbody>
                          {learningTimes.map((r, idx) => (
                            <tr key={idx}>
                              <td>{idx + 1}</td>
                              <td>{r.userName}</td>
                              <td className="text-end fw-semibold">
                                {r.totalLearningTimeMinutes >= 60
                                  ? `${Math.floor(r.totalLearningTimeMinutes / 60)}h ${r.totalLearningTimeMinutes % 60}p`
                                  : `${r.totalLearningTimeMinutes} phút`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted small mb-0">Chưa có dữ liệu thời gian học.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </>
      )}

      <style>{`
        .hover-bg-light:hover { background-color: #f1f5f9 !important; }
      `}</style>
    </AdminLayout>
  );
};

export default QuizBuilder;
