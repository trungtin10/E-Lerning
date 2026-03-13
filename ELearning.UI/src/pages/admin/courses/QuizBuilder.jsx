import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import {
  Plus, Trash2, Save, ArrowLeft, HelpCircle, X,
  CheckCircle2, Circle, Loader2, AlertCircle, Settings
} from 'lucide-react';

const QuizBuilder = () => {
  const { id } = useParams(); // CourseId
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Question Form State
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

  const [searchParams, setSearchParams] = useSearchParams();
  const section = searchParams.get('section') || '0';
  const lessonId = searchParams.get('lessonId');
  const [passingScore, setPassingScore] = useState(80);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);

  useEffect(() => {
    fetchQuiz();
  }, [id, section, lessonId]);

  const fetchQuiz = async () => {
    try {
      const url = `/quiz/${id}?section=${section}${lessonId ? `&lessonId=${lessonId}` : ''}`;
      const response = await api.get(url);
      setQuiz(response.data);
      if (response.data) {
        setPassingScore(response.data.passingScore ?? 80);
        setTimeLimitMinutes(response.data.timeLimitMinutes ?? 15);
      }
    } catch (err) {
      console.error("Lỗi khi tải bài kiểm tra:", err);
      const errorMsg = err.response?.data;
      alert("LỖI: " + (typeof errorMsg === 'string' ? errorMsg : "Không thể kết nối đến máy chủ."));
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnswer = () => {
    setQuestionData({
      ...questionData,
      answers: [...questionData.answers, { content: '', isCorrect: false }]
    });
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
    setSubmitting(true);
    try {
      await api.post('/quiz/questions', {
        id: editingQuestion?.id,
        quizId: quiz.id,
        ...questionData
      });
      setShowForm(false);
      setEditingQuestion(null);
      setQuestionData({ content: '', questionType: 'SingleChoice', answers: [{ content: '', isCorrect: true }, { content: '', isCorrect: false }, { content: '', isCorrect: false }, { content: '', isCorrect: false }] });
      fetchQuiz();
    } catch (err) { alert('Lỗi khi lưu câu hỏi.'); } finally { setSubmitting(false); }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Xóa câu hỏi này?')) return;
    try {
      await api.delete(`/quiz/questions/${qId}`);
      fetchQuiz();
    } catch (err) { alert('Lỗi khi xóa.'); }
  };

  const handleSaveQuiz = async () => {
    if (!quiz?.id) return;
    setSubmitting(true);
    try {
      await api.put(`/quiz/update/${quiz.id}`, { passingScore: passingScore, timeLimitMinutes: timeLimitMinutes || null });
      alert('Đã lưu bài trắc nghiệm!');
      fetchQuiz();
    } catch (err) { alert('Lỗi khi lưu.'); } finally { setSubmitting(false); }
  };

  if (loading) return <AdminLayout><div className="text-center py-5"><Loader2 className="animate-spin text-primary" size={48} /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-light rounded-circle p-2 shadow-sm" onClick={() => navigate(`/admin/courses/${id}`)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="fw-bold tracking-tight mb-0">Bài trắc nghiệm {section !== '0' && lessonId ? `- Mục ${section}` : ''}</h2>
            <p className="text-muted small mb-0">Khóa học: <span className="fw-bold text-primary">{quiz?.title}</span></p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="d-flex align-items-center gap-2 bg-light rounded-3 px-3 py-2">
            <label className="small fw-bold text-muted mb-0">Điểm đạt:</label>
            <input type="number" min="0" max="100" className="form-control form-control-sm" style={{ width: '60px' }} value={passingScore} onChange={e => setPassingScore(parseInt(e.target.value, 10) || 80)} />
            <span className="small">%</span>
          </div>
          <div className="d-flex align-items-center gap-2 bg-light rounded-3 px-3 py-2">
            <label className="small fw-bold text-muted mb-0">Thời gian:</label>
            <input type="number" min="1" max="120" className="form-control form-control-sm" style={{ width: '60px' }} value={timeLimitMinutes ?? ''} onChange={e => setTimeLimitMinutes(e.target.value ? parseInt(e.target.value, 10) : null)} placeholder="phút" />
            <span className="small">phút</span>
          </div>
          <button className="btn btn-success fw-bold rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={handleSaveQuiz} disabled={submitting}>
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Lưu bài trắc nghiệm
          </button>
          <button className="btn btn-primary fw-bold rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => { setEditingQuestion(null); setShowForm(true); }}>
            <Plus size={18} /> Thêm câu hỏi
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Danh sách câu hỏi hiện có */}
        <div className="col-md-7">
          <div className="d-flex flex-column gap-3">
            {quiz?.questions.map((q, index) => (
              <div key={q.id} className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="fw-bold text-dark">Câu {index + 1}: {q.content}</div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-light btn-sm p-2 rounded-3 text-danger border" onClick={() => handleDeleteQuestion(q.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="row g-2">
                  {q.answers.map((ans) => (
                    <div key={ans.id} className={`col-6 p-2 rounded-3 border small d-flex align-items-center gap-2 ${ans.isCorrect ? 'bg-success-subtle border-success text-success fw-bold' : 'bg-light text-muted'}`}>
                      {ans.isCorrect ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                      {ans.content}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {quiz?.questions.length === 0 && (
              <div className="text-center py-5 bg-white rounded-4 border border-dashed">
                <HelpCircle size={48} className="text-muted opacity-20 mb-2" />
                <p className="text-muted">Chưa có câu hỏi nào. Hãy nhấn nút "Thêm câu hỏi" để bắt đầu.</p>
              </div>
            )}
          </div>
        </div>

        {/* Form soạn thảo câu hỏi */}
        <div className="col-md-5">
          {showForm ? (
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '100px' }}>
              <h5 className="fw-bold mb-4">{editingQuestion ? 'Sửa câu hỏi' : 'Soạn câu hỏi mới'}</h5>
              <form onSubmit={handleSaveQuestion}>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Nội dung câu hỏi *</label>
                  <textarea required className="form-control rounded-3" rows="3" value={questionData.content} onChange={e => setQuestionData({...questionData, content: e.target.value})}></textarea>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold d-flex justify-content-between">
                    Các phương án trả lời
                    <button type="button" className="btn btn-link p-0 text-primary small text-decoration-none fw-bold" onClick={handleAddAnswer}>+ Thêm đáp án</button>
                  </label>
                  <div className="d-flex flex-column gap-2">
                    {questionData.answers.map((ans, index) => (
                      <div key={index} className="input-group input-group-sm">
                        <div className="input-group-text bg-white border-end-0">
                          <input
                            className="form-check-input mt-0"
                            type="radio"
                            checked={ans.isCorrect}
                            onChange={() => handleAnswerChange(index, 'isCorrect', true)}
                          />
                        </div>
                        <input
                          type="text"
                          required
                          className="form-control border-start-0"
                          placeholder={`Đáp án ${index + 1}`}
                          value={ans.content}
                          onChange={e => handleAnswerChange(index, 'content', e.target.value)}
                        />
                        {questionData.answers.length > 2 && (
                          <button className="btn btn-outline-danger" type="button" onClick={() => handleRemoveAnswer(index)}><X size={14} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="d-flex gap-2 pt-3 border-top">
                  <button type="button" className="btn btn-light flex-grow-1 fw-bold rounded-3" onClick={() => setShowForm(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary flex-grow-1 fw-bold rounded-3 shadow-sm" disabled={submitting}>
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} className="me-2" /> Lưu câu hỏi</>}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border">
              <Settings size={28} className="mb-2 text-primary" />
              <h5 className="fw-bold text-dark">Soạn câu hỏi</h5>
              <p className="small text-muted mb-0">Nhấn "Thêm câu hỏi" để tạo câu hỏi trắc nghiệm cho mục này.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default QuizBuilder;
