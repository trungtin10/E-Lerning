import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Trash2, Save, HelpCircle, X, CheckCircle2, Circle, Loader2, ChevronDown, ChevronUp, Settings, BookOpen, PlusCircle, Edit3, Check } from 'lucide-react';
import { useNotify } from '../../context/NotifyContext';

const QuizSectionInline = ({ courseId, section, lessonId, onToast }) => {
  const { toast, confirm } = useNotify();
  const notify = onToast || toast;
  const [collapsed, setCollapsed] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [passingScore, setPassingScore] = useState(80);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionData, setQuestionData] = useState({
    content: '',
    questionType: 'SingleChoice',
    answers: [
      { content: '', isCorrect: true },
      { content: '', isCorrect: false },
      { content: '', isCorrect: false },
      { content: '', isCorrect: false }
    ]
  });

  const fetchQuiz = () => {
    setLoading(true);
    const url = `/quiz/${courseId}?section=${section}${lessonId ? `&lessonId=${lessonId}` : ''}`;
    api.get(url)
      .then(res => {
        setQuiz(res.data);
        setPassingScore(res.data?.passingScore ?? 80);
        setTimeLimitMinutes(res.data?.timeLimitMinutes ?? 15);
      })
      .catch(() => setQuiz(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQuiz(); }, [courseId, section, lessonId]);

  // Add Escape key listener to close the form
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setShowForm(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleAddAnswer = () => {
    setQuestionData({ ...questionData, answers: [...questionData.answers, { content: '', isCorrect: false }] });
  };
  const handleRemoveAnswer = (index) => {
    const newAnswers = questionData.answers.filter((_, i) => i !== index);
    setQuestionData({ ...questionData, answers: newAnswers });
  };
  const handleAnswerChange = (index, field, value) => {
    const newAnswers = [...questionData.answers];
    if (field === 'isCorrect' && questionData.questionType === 'SingleChoice') {
      newAnswers.forEach((ans, i) => ans.isCorrect = i === index);
    } else {
      newAnswers[index][field] = value;
    }
    setQuestionData({ ...questionData, answers: newAnswers });
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!quiz?.id) return;
    setSubmitting(true);
    try {
      await api.post('/quiz/questions', { id: editingQuestion?.id, quizId: quiz.id, ...questionData });
      setShowForm(false);
      setEditingQuestion(null);
      setQuestionData({ content: '', questionType: 'SingleChoice', answers: [{ content: '', isCorrect: true }, { content: '', isCorrect: false }, { content: '', isCorrect: false }, { content: '', isCorrect: false }] });
      fetchQuiz();
      if (onToast) onToast('Đã lưu câu hỏi!');
    } catch (err) { if (onToast) onToast('Lỗi khi lưu câu hỏi.', 'error'); } finally { setSubmitting(false); }
  };

  const handleEditQuestion = (q) => {
    setEditingQuestion(q);
    setQuestionData({
      content: q.content,
      questionType: q.questionType ?? 'SingleChoice',
      answers: (q.answers || []).length > 0
        ? q.answers.map(a => ({ content: a.content, isCorrect: a.isCorrect }))
        : [{ content: '', isCorrect: true }, { content: '', isCorrect: false }, { content: '', isCorrect: false }, { content: '', isCorrect: false }]
    });
    setShowForm(true);
  };

  const handleDeleteQuestion = async (qId) => {
    const ok = await confirm({ title: 'Xóa câu hỏi', message: 'Xóa câu hỏi này?', confirmText: 'Xóa' });
    if (!ok) return;
    try {
      await api.delete(`/quiz/questions/${qId}`);
      fetchQuiz();
      notify('Đã xóa câu hỏi.', 'success');
    } catch (err) { notify('Lỗi khi xóa.', 'error'); }
  };

  const handleSaveQuiz = async () => {
    if (!quiz?.id) return;
    setSubmitting(true);
    try {
      await api.put(`/quiz/update/${quiz.id}`, { passingScore: passingScore, timeLimitMinutes: timeLimitMinutes || null });
      fetchQuiz();
      notify('Đã lưu bài trắc nghiệm!', 'success');
    } catch (err) { notify('Lỗi khi lưu.', 'error'); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="text-center py-3"><Loader2 className="animate-spin text-primary" size={24} /></div>;

  const questionCount = quiz?.questions?.length ?? 0;

  return (
    <div className="quiz-section-inline pt-2">
      <div className="bg-white border rounded-4 p-4 shadow-sm mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-4">
          <div className="d-flex align-items-center gap-3">
             <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                <Settings size={20} />
             </div>
             <div>
                <h6 className="fw-bold mb-0">Cấu hình bài tập</h6>
                <p className="text-muted small mb-0">Thiết lập điều kiện đạt và thời gian làm bài</p>
             </div>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-4">
            <div className="setting-item">
              <label className="d-block small fw-bold text-secondary mb-1">Điểm đạt (%)</label>
              <input 
                type="number" 
                min="0" max="100" 
                className="form-control form-control-sm fw-bold border-2 focus-ring-primary" 
                style={{ width: '80px', borderRadius: '8px' }}
                value={passingScore ?? ''} 
                onChange={e => setPassingScore(e.target.value === '' ? '' : parseInt(e.target.value, 10))} 
              />
            </div>

            <div className="setting-item">
              <label className="d-block small fw-bold text-secondary mb-1">Thời gian (phút)</label>
              <input 
                type="number" 
                min="1" max="120" 
                className="form-control form-control-sm fw-bold border-2 focus-ring-primary" 
                style={{ width: '100px', borderRadius: '8px' }}
                placeholder="Vô hạn"
                value={timeLimitMinutes ?? ''} 
                onChange={e => setTimeLimitMinutes(e.target.value === '' ? null : parseInt(e.target.value, 10))} 
              />
            </div>

            <div className="d-flex gap-2 mt-md-3">
              <button 
                className="btn btn-dark btn-sm px-3 rounded-3 fw-bold d-flex align-items-center gap-2" 
                onClick={handleSaveQuiz} 
                disabled={submitting}
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Lưu cài đặt
              </button>
              <button
                className="btn btn-outline-secondary btn-sm rounded-circle p-2"
                onClick={() => setCollapsed(!collapsed)}
                title={collapsed ? "Mở danh sách" : "Thu gọn"}
              >
                {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {!collapsed && (
        <div className="row g-4 mt-1">
          <div className="col-lg-7">
            <div className="d-flex align-items-center justify-content-between mb-3 px-2">
               <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <BookOpen size={18} className="text-primary" /> Danh sách câu hỏi ({questionCount})
               </h6>
               <button 
                  className="btn btn-sm btn-primary rounded-pill px-3 fw-bold d-flex d-lg-none align-items-center gap-2"
                  onClick={() => { setEditingQuestion(null); setShowForm(true); }}
               >
                  <Plus size={16} /> Thêm câu
               </button>
            </div>

            <div className="d-flex flex-column gap-3">
              {(quiz?.questions || []).map((q, idx) => (
                <div key={q.id} className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white hover-shadow transition-all">
                  <div className="card-header border-0 bg-white py-3 px-4 d-flex justify-content-between align-items-start border-bottom-dashed">
                    <div className="d-flex gap-3">
                      <span className="badge rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm flex-shrink-0" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                        {idx + 1}
                      </span>
                      <div className="fw-bold text-dark pt-1" style={{ lineHeight: '1.4' }}>{q.content || 'Câu hỏi chưa có nội dung'}</div>
                    </div>
                    <div className="d-flex gap-1 ms-3">
                      <button className="btn btn-sm btn-light rounded-3 p-2 text-primary border" onClick={() => handleEditQuestion(q)} title="Sửa">
                        <Edit3 size={16} />
                      </button>
                      <button className="btn btn-sm btn-light rounded-3 p-2 text-danger border" onClick={() => handleDeleteQuestion(q.id)} title="Xóa">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="card-body p-4 pt-3">
                    <div className="row g-3">
                      {q.answers.map((ans, aIdx) => (
                        <div key={ans.id} className="col-md-6">
                          <div className={`p-3 rounded-4 border h-100 d-flex align-items-center gap-3 transition-all ${ans.isCorrect ? 'bg-success bg-opacity-10 border-success-subtle' : 'bg-light border-light-subtle opacity-75'}`}>
                            {ans.isCorrect ? (
                              <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm" style={{ width: '22px', height: '22px' }}>
                                <Check size={14} strokeWidth={4} />
                              </div>
                            ) : (
                              <div className="bg-white border text-muted rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '22px', height: '22px' }}>
                                <div className="bg-secondary bg-opacity-20 rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                              </div>
                            )}
                            <div className={`small ${ans.isCorrect ? 'text-dark fw-bold' : 'text-secondary'}`}>
                              <span className="text-muted small me-1 fw-bold opacity-50">{String.fromCharCode(65 + aIdx)}.</span> {ans.content}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {(!quiz?.questions || quiz.questions.length === 0) && (
                <div className="text-center py-5 bg-white rounded-4 border border-2 border-dashed opacity-75">
                  <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3 text-muted" style={{ width: '64px', height: '64px' }}>
                    <HelpCircle size={32} />
                  </div>
                  <h6 className="fw-bold text-dark">Chưa có câu hỏi nào</h6>
                  <p className="text-muted small mb-0 mx-auto" style={{ maxWidth: '300px' }}>
                    Sử dụng bảng điều khiển bên phải để thêm câu hỏi trắc nghiệm cho khóa học.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-5">
            <div className="sticky-lg-top" style={{ top: '100px', zIndex: 10 }}>
              {showForm ? (
                <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-white animate-in border-top border-4 border-primary">
                  <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom">
                    <h6 className="fw-bold mb-0 d-flex align-items-center gap-2 text-primary">
                       <PlusCircle size={20} /> {editingQuestion ? 'Thay đổi câu hỏi' : 'Tạo câu hỏi trắc nghiệm'}
                    </h6>
                    <button type="button" className="btn-close small" onClick={() => setShowForm(false)}></button>
                  </div>
                  <form onSubmit={handleSaveQuestion}>
                    <div className="card-body p-4">
                      <div className="mb-4">
                        <textarea 
                          autoFocus
                          required 
                          className="form-control form-control-lg rounded-3 border-2 border-light focus-ring-primary" 
                          rows="4" 
                          placeholder="Nhập nội dung câu hỏi ở đây..."
                          value={questionData.content || ''} 
                          onChange={e => setQuestionData({...questionData, content: e.target.value})} 
                          style={{ fontSize: '1.05rem', resize: 'none' }}
                        />
                      </div>

                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <label className="form-label small fw-bold text-dark mb-0">CÁC PHƯƠNG ÁN CHỌN</label>
                          <button type="button" className="btn btn-sm btn-link text-primary fw-bold text-decoration-none p-0" onClick={handleAddAnswer}>
                            + Thêm đáp án
                          </button>
                        </div>

                        <div className="d-flex flex-column gap-2">
                          {questionData.answers.map((ans, index) => (
                            <div 
                              key={index} 
                              className={`p-3 rounded-4 border-2 transition-all position-relative ${ans.isCorrect ? 'border-success' : 'border-light'}`}
                              style={{ 
                                backgroundColor: ans.isCorrect ? '#f0fff4' : '#f8f9fa',
                                transition: 'all 0.2s ease'
                              }}
                            >
                                <div className="d-flex align-items-center gap-3">
                                  <div className="flex-shrink-0">
                                    <div 
                                      className={`m-0 d-flex align-items-center justify-content-center rounded-circle border-2 transition-all ${ans.isCorrect ? 'border-success' : 'border-secondary opacity-30'}`} 
                                      style={{ width: '24px', height: '24px', cursor: 'pointer', position: 'relative' }}
                                      onClick={() => handleAnswerChange(index, 'isCorrect', true)}
                                    >
                                      {ans.isCorrect && <div className="bg-success rounded-circle" style={{ width: '12px', height: '12px' }}></div>}
                                    </div>
                                  </div>
                                  <div className="flex-grow-1">
                                    <input 
                                      type="text" 
                                      required 
                                      className={`form-control form-control-sm border-0 bg-transparent p-0 fw-semibold ${ans.isCorrect ? 'text-success' : 'text-dark'}`} 
                                      placeholder={`Nhập đáp án ${index + 1}...`} 
                                      value={ans.content || ''} 
                                      onChange={e => handleAnswerChange(index, 'content', e.target.value)} 
                                      style={{ boxShadow: 'none' }}
                                    />
                                    {ans.isCorrect && <div className="extra-small text-success fw-bold text-uppercase mt-1" style={{ fontSize: '0.65rem' }}>Đáp án đúng</div>}
                                  </div>
                                  {questionData.answers.length > 2 && (
                                    <button 
                                      type="button" 
                                      className="btn btn-link text-danger p-1 opacity-50 hover-opacity-100" 
                                      onClick={() => handleRemoveAnswer(index)}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="card-footer bg-white border-0 p-4 pt-0">
                      <div className="row g-2">
                        <div className="col-4">
                          <button type="button" className="btn btn-light w-100 fw-bold py-2 rounded-3" onClick={() => setShowForm(false)}>Hủy</button>
                        </div>
                        <div className="col-8">
                          <button type="submit" className="btn btn-primary w-100 fw-bold py-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2" disabled={submitting}>
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> {editingQuestion ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi'}</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              ) : (
                <div 
                  className="card border-2 border-dashed rounded-4 p-5 bg-white text-center cursor-pointer hover-bg-primary-subtle transition-all shadow-sm"
                  style={{ borderColor: '#d1d5db' }}
                  onClick={() => { setEditingQuestion(null); setShowForm(true); }}
                >
                   <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 text-primary" style={{ width: '56px', height: '56px' }}>
                      <Plus size={28} />
                   </div>
                   <h6 className="fw-bold text-dark mb-1">Thêm câu hỏi mới</h6>
                   <p className="small text-muted mb-0">Thiết kế bài trắc nghiệm nhanh chóng bằng cách thêm câu hỏi tại đây.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .border-bottom-dashed { border-bottom: 1px dashed #e5e7eb; }
        .hover-shadow:hover { box-shadow: 0 10px 20px rgba(0,0,0,0.06) !important; transform: translateY(-2px); }
        .focus-ring-primary:focus { border-color: #0d6efd !important; box-shadow: 0 0 0 4px rgba(13,110,253,0.1) !important; outline: none; }
        .extra-small { font-size: 0.65rem; letter-spacing: 0.05em; }
        .animate-in { animation: slideInUp 0.3s ease-out; }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .shadow-lg { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }
        .hidden-check:checked + div { background-color: #198754 !important; }
      `}</style>
    </div>
  );
};

export default QuizSectionInline;
