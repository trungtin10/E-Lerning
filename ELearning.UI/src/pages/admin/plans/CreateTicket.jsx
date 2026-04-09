import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { MessageCircle, Paperclip, Send, X, Loader2, ChevronLeft } from 'lucide-react';

export default function CreateTicket() {
  const navigate = useNavigate();
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const roles = Array.isArray(user?.roles)
    ? user.roles
    : String(user?.roles ?? user?.role ?? '')
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  const isSuperAdmin = roles.includes('SuperAdmin');
  const isCompanyAdmin = roles.includes('Admin');

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', content: '', priority: 'Normal' });
  const [files, setFiles] = useState([]);

  const handleFiles = (e) => {
    const arr = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...arr].slice(0, 8));
    e.target.value = '';
  };

  const removeFileAt = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.content.trim()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('subject', form.subject);
      fd.append('content', form.content);
      fd.append('priority', form.priority);
      files.forEach((f) => fd.append('files', f));
      const r = await api.post('/ticket', fd);
      const newId = r.data?.id ?? r.data?.Id ?? r.data?.ticketId ?? r.data?.TicketId;
      navigate(newId ? `/admin/tickets/${newId}` : '/admin/tickets');
    } catch (err) {
      const msg = err.response?.data;
      alert(typeof msg === 'string' ? msg : (msg?.message || 'Không tạo được yêu cầu hỗ trợ.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuperAdmin) {
    return (
      <AdminLayout>
        <div className="container-fluid px-4 py-3">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <div className="fw-bold mb-1">Trang này dành cho Admin công ty</div>
              <div className="text-muted small">SuperAdmin không cần tạo yêu cầu hỗ trợ.</div>
              <button className="btn btn-sm btn-outline-secondary mt-3" onClick={() => navigate('/admin/tickets')}>
                Quay lại
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isCompanyAdmin) {
    return (
      <AdminLayout>
        <div className="container-fluid px-4 py-3">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <div className="fw-bold mb-1">Bạn không có quyền tạo hỗ trợ</div>
              <div className="text-muted small">Chỉ Admin công ty mới có thể gửi yêu cầu lên SuperAdmin.</div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-fluid px-4 py-3">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
          <div className="d-flex align-items-center gap-2">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/admin/tickets')}>
              <ChevronLeft size={16} /> Quay lại
            </button>
            <span className="d-inline-flex align-items-center gap-2 ms-1">
              <MessageCircle size={18} className="text-muted" />
              <span className="fw-bold">Tạo yêu cầu hỗ trợ</span>
            </span>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-body p-4">
            <div className="alert alert-info border-0 rounded-4">
              <div className="fw-semibold mb-1">Hướng dẫn</div>
              <div className="small mb-0">
                Mô tả chi tiết vấn đề bạn gặp phải. Đính kèm ảnh minh hoạ sẽ giúp SuperAdmin hỗ trợ nhanh hơn.
              </div>
            </div>

            <form onSubmit={submit} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label fw-semibold">
                  <span className="text-danger">*</span> Tiêu đề ticket
                </label>
                <input
                  className="form-control bg-light border-0"
                  placeholder="Ví dụ: Lỗi không thể đăng nhập vào hệ thống"
                  value={form.subject}
                  onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  required
                />
                <div className="form-text">Tiêu đề ngắn gọn để dễ nhận biết.</div>
              </div>

              <div>
                <label className="form-label fw-semibold">
                  <span className="text-danger">*</span> Mô tả chi tiết vấn đề
                </label>
                <textarea
                  className="form-control bg-light border-0"
                  rows={8}
                  placeholder="Mô tả chi tiết vấn đề bạn gặp phải, các bước đã thử, lỗi cụ thể..."
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  required
                />
                <div className="form-text">Càng chi tiết càng tốt để được hỗ trợ nhanh.</div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Mức độ ưu tiên</label>
                  <select
                    className="form-select bg-light border-0"
                    value={form.priority}
                    onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                  >
                    <option value="Low">Thấp</option>
                    <option value="Normal">Bình thường</option>
                    <option value="High">Cao</option>
                    <option value="Urgent">Khẩn cấp</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold d-flex align-items-center gap-2">
                    <Paperclip size={16} /> Đính kèm tệp
                  </label>
                  <input type="file" className="form-control bg-light border-0" multiple onChange={handleFiles} />
                  <div className="form-text">Tối đa 8 tệp.</div>
                </div>
              </div>

              {files.length > 0 && (
                <div className="d-flex flex-wrap gap-2">
                  {files.map((f, idx) => (
                    <span key={f.name + idx} className="badge text-bg-light border d-inline-flex align-items-center gap-2">
                      <Paperclip size={14} />
                      <span className="text-truncate" style={{ maxWidth: 320 }}>{f.name}</span>
                      <button type="button" className="btn btn-sm p-0 border-0" onClick={() => removeFileAt(idx)} aria-label="Remove">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="d-flex justify-content-end gap-2 pt-2">
                <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/admin/tickets')}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={submitting}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {submitting ? 'Đang gửi...' : 'Gửi ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

