import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Trash2, Save, HelpCircle, X, CheckCircle2, Circle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const QuizSectionInline = ({ courseId, section, lessonId, onToast }) => {
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

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Xóa câu hỏi này?')) return;
    try {
      await api.delete(`/quiz/questions/${qId}`);
      fetchQuiz();
      if (onToast) onToast('Đã xóa câu hỏi.');
    } catch (err) { if (onToast) onToast('Lỗi khi xóa.', 'error'); }
  };

  const handleSaveQuiz = async () => {
    if (!quiz?.id) return;
    setSubmitting(true);
    try {
      await api.put(`/quiz/update/${quiz.id}`, { passingScore: passingScore, timeLimitMinutes: timeLimitMinutes || null });
      fetchQuiz();
      if (onToast) onToast('Đã lưu bài trắc nghiệm!');
    } catch (err) { if (onToast) onToast('Lỗi khi lưu.', 'error'); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="text-center py-3"><Loader2 className="animate-spin text-primary" size={24} /></div>;

  const questionCount = quiz?.questions?.length ?? 0;

  return (
    <div className="quiz-section-inline">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 mb-md-0">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm rounded-pill d-flex align-items-center gap-1"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          {collapsed ? 'Mở rộng' : 'Thu gọn'} bài trắc nghiệm
          {questionCount > 0 && <span className="badge bg-primary rounded-pill ms-1">{questionCount}</span>}
        </button>
        {!collapsed && (
        <>
        <div className="d-flex align-items-center gap-2">
          <label className="small fw-bold text-muted mb-0">Điểm đạt:</label>
          <input type="number" min="0" max="100" className="form-control form-control-sm" style={{ width: '60px' }} value={passingScore} onChange={e => setPassingScore(parseInt(e.target.value, 10) || 80)} />
          <span className="small">%</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <label className="small fw-bold text-muted mb-0">Thời gian:</label>
          <input type="number" min="1" max="120" className="form-control form-control-sm" style={{ width: '60px' }} value={timeLimitMinutes ?? ''} onChange={e => setTimeLimitMinutes(e.target.value ? parseInt(e.target.value, 10) : null)} placeholder="phút" />
          <span className="small">phút</span>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-success btn-sm fw-bold rounded-pill d-flex align-items-center gap-1" onClick={handleSaveQuiz} disabled={submitting}>
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Lưu bài trắc nghiệm
          </button>
          <button className="btn btn-primary btn-sm fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => { setEditingQuestion(null); setShowForm(true); }}>
            <Plus size={14} /> Thêm câu hỏi
          </button>
        </div>
        </>
        )}
      </div>

      {!collapsed && (
      <div className="row g-3 mt-2">
        <div className="col-12 col-md-7">
          <div className="d-flex flex-column gap-2">
            {(quiz?.questions || []).map((q, idx) => (
              <div key={q.id} className="card border-0 shadow-sm rounded-3 p-3 bg-white">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="fw-bold small text-dark">Câu {idx + 1}: {q.content}</div>
                  <button className="btn btn-link p-0 text-danger" onClick={() => handleDeleteQuestion(q.id)}><Trash2 size={14} /></button>
                </div>
                <div className="row g-1">
                  {q.answers.map(ans => (
                    <div key={ans.id} className={`col-6 p-2 rounded-2 border small d-flex align-items-center gap-2 ${ans.isCorrect ? 'bg-success-subtle border-success text-success fw-bold' : 'bg-light text-muted'}`}>
                      {ans.isCorrect ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                      {ans.content}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {(!quiz?.questions || quiz.questions.length === 0) && (
              <div className="text-center py-4 bg-white rounded-3 border border-dashed">
                <HelpCircle size={32} className="text-muted opacity-40 mb-2" />
                <p className="text-muted small mb-0">Chưa có câu hỏi. Nhấn "Thêm câu hỏi" để bắt đầu.</p>
              </div>
            )}
          </div>
        </div>
        <div className="col-12 col-md-5">
          {showForm ? (
            <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
              <h6 className="fw-bold mb-3">{editingQuestion ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h6>
              <form onSubmit={handleSaveQuestion}>
                <div className="mb-2">
                  <label className="form-label small fw-bold">Nội dung câu hỏi *</label>
                  <textarea required className="form-control form-control-sm rounded-3" rows="2" value={questionData.content} onChange={e => setQuestionData({...questionData, content: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold d-flex justify-content-between">
                    Đáp án
                    <button type="button" className="btn btn-link p-0 text-primary small text-decoration-none" onClick={handleAddAnswer}>+ Thêm</button>
                  </label>
                  <div className="d-flex flex-column gap-1">
                    {questionData.answers.map((ans, index) => (
                      <div key={index} className="input-group input-group-sm">
                        <div className="input-group-text bg-white border-end-0 py-0">
                          <input
                            className="form-check-input mt-0"
                            type="radio"
                            checked={ans.isCorrect}
                            onChange={() => handleAnswerChange(index, 'isCorrect', true)}
                          />
                        </div>
                        <input type="text" required className="form-control border-start-0" placeholder={`Đáp án ${index + 1}`} value={ans.content} onChange={e => handleAnswerChange(index, 'content', e.target.value)} />
                        {questionData.answers.length > 2 && (
                          <button className="btn btn-outline-danger" type="button" onClick={() => handleRemoveAnswer(index)}><X size={12} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-light btn-sm flex-grow-1" onClick={() => setShowForm(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary btn-sm flex-grow-1" disabled={submitting}>
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} className="me-1" /> Lưu</>}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card border-0 rounded-3 p-3 bg-light border">
              <p className="small text-muted mb-0">Nhấn "Thêm câu hỏi" để tạo câu hỏi trắc nghiệm.</p>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default QuizSectionInline;
