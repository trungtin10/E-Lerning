import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import api, { getUploadUrl } from '../../../api/axios';
import {
  MessageCircle, Plus, Loader2, Send, ImagePlus, ChevronLeft, Building2, Pin
} from 'lucide-react';

const statusLabel = (s) => {
  const m = { Open: 'Mở', InProgress: 'Đang xử lý', Resolved: 'Đã xử lý', Closed: 'Đóng' };
  return m[s] || s;
};

const statusBadgeClass = (s) => {
  if (s === 'Resolved') return 'bg-success-subtle text-success-emphasis';
  if (s === 'Closed') return 'bg-secondary-subtle text-secondary-emphasis';
  if (s === 'InProgress') return 'bg-primary-subtle text-primary-emphasis';
  return 'bg-warning-subtle text-dark';
};

/** Hiển thị giờ theo múi Việt Nam (API trả UTC có hậu tố Z). */
const formatVnDateTime = (value) => {
  if (value == null) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

const Tickets = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [thread, setThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ subject: '', content: '', priority: 'Normal' });
  const [createFiles, setCreateFiles] = useState([]);
  const [replyBody, setReplyBody] = useState('');
  const [replyFiles, setReplyFiles] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user?.roles?.includes('SuperAdmin');

  const fetchList = useCallback(async () => {
    setListLoading(true);
    try {
      if (isSuperAdmin) {
        const r = await api.get('/ticket', { params: { page: 1, pageSize: 100 } });
        setTickets(r.data?.items || []);
        setTotal(r.data?.total ?? 0);
      } else {
        const r = await api.get('/ticket/my');
        setTickets(Array.isArray(r.data) ? r.data : []);
        setTotal(Array.isArray(r.data) ? r.data.length : 0);
      }
    } catch {
      setTickets([]);
    } finally {
      setListLoading(false);
    }
  }, [isSuperAdmin]);

  const fetchThread = useCallback(async (id) => {
    if (!id) {
      setThread(null);
      return;
    }
    setThreadLoading(true);
    try {
      const r = await api.get(`/ticket/${id}`);
      setThread(r.data);
    } catch {
      setThread(null);
      navigate('/admin/tickets', { replace: true });
    } finally {
      setThreadLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (ticketId) fetchThread(ticketId);
    else setThread(null);
  }, [ticketId, fetchThread]);

  const openThread = (id) => navigate(`/admin/tickets/${id}`);

  const handleCreateFiles = (e) => {
    const arr = Array.from(e.target.files || []);
    setCreateFiles((prev) => [...prev, ...arr].slice(0, 8));
    e.target.value = '';
  };

  const handleReplyFiles = (e) => {
    const arr = Array.from(e.target.files || []);
    setReplyFiles((prev) => [...prev, ...arr].slice(0, 8));
    e.target.value = '';
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('subject', form.subject);
      fd.append('content', form.content);
      fd.append('priority', form.priority);
      createFiles.forEach((f) => fd.append('files', f));
      const r = await api.post('/ticket', fd);
      setCreateOpen(false);
      setForm({ subject: '', content: '', priority: 'Normal' });
      setCreateFiles([]);
      await fetchList();
      const newId = r.data?.id;
      if (newId) navigate(`/admin/tickets/${newId}`);
      else navigate('/admin/tickets');
    } catch (err) {
      const msg = err.response?.data;
      alert(typeof msg === 'string' ? msg : (msg?.message || 'Không tạo được ticket'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!ticketId) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('body', replyBody);
      if (isSuperAdmin && thread?.status === 'Open') {
        fd.append('status', 'InProgress');
      }
      replyFiles.forEach((f) => fd.append('files', f));
      const r = await api.post(`/ticket/${ticketId}/posts`, fd);
      setThread(r.data);
      setReplyBody('');
      setReplyFiles([]);
      fetchList();
    } catch (err) {
      const msg = err.response?.data;
      alert(typeof msg === 'string' ? msg : (msg?.message || 'Không gửi được'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (e) => {
    const next = e.target.value;
    if (!ticketId || !next) return;
    try {
      await api.patch(`/ticket/${ticketId}/status`, { status: next });
      await fetchThread(ticketId);
      fetchList();
    } catch {
      alert('Không cập nhật được trạng thái');
    }
  };

  const list = Array.isArray(tickets) ? tickets : [];

  return (
    <AdminLayout>
      <div className="ticket-forum d-flex flex-column flex-lg-row gap-3 gap-lg-4" style={{ minHeight: '70vh' }}>
        {/* Danh sách chủ đề */}
        <aside
          className={`ticket-forum-list flex-shrink-0 rounded-4 border bg-white shadow-sm overflow-hidden ${
            ticketId ? 'd-none d-lg-block' : ''
          }`}
          style={{ width: '100%', maxWidth: '380px' }}
        >
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light bg-opacity-50">
            <div>
              <h2 className="h5 fw-bold mb-0 d-flex align-items-center gap-2">
                <MessageCircle size={22} className="text-primary" />
                Diễn đàn hỗ trợ
              </h2>
              <p className="small text-muted mb-0 mt-1">
                {isSuperAdmin ? `${total} ticket từ các công ty` : 'Ticket của công ty bạn'}
              </p>
            </div>
            {!isSuperAdmin && (
              <button
                type="button"
                className="btn btn-primary btn-sm rounded-3 d-flex align-items-center gap-1"
                onClick={() => setCreateOpen(true)}
              >
                <Plus size={16} /> Mới
              </button>
            )}
          </div>
          <div className="overflow-auto" style={{ maxHeight: 'calc(70vh - 80px)' }}>
            {listLoading ? (
              <div className="text-center py-5 text-muted">
                <Loader2 className="animate-spin d-inline mb-2" size={28} />
                <div>Đang tải…</div>
              </div>
            ) : list.length === 0 ? (
              <div className="p-4 text-center text-muted small">
                Chưa có chủ đề nào. {!isSuperAdmin && 'Nhấn «Mới» để gửi yêu cầu tới SuperAdmin.'}
              </div>
            ) : (
              <ul className="list-group list-group-flush">
                {list.map((t) => (
                  <li key={t.id} className="list-group-item list-group-item-action border-0 border-bottom py-3 px-3">
                    <button
                      type="button"
                      className={`btn btn-link text-start text-decoration-none p-0 w-100 ${
                        String(ticketId) === String(t.id) ? 'fw-semibold' : ''
                      }`}
                      onClick={() => openThread(t.id)}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <span className="text-dark text-truncate">{t.subject}</span>
                        <span className={`badge rounded-pill small flex-shrink-0 ${statusBadgeClass(t.status)}`}>
                          {statusLabel(t.status)}
                        </span>
                      </div>
                      {isSuperAdmin && (
                        <div className="small text-muted mt-1 d-flex align-items-center gap-1">
                          <Building2 size={12} /> {t.companyName}
                        </div>
                      )}
                      <div className="small text-muted mt-1">
                        {t.postCount || 0} bài · cập nhật {formatVnDateTime(t.lastActivityAt || t.createdAt)}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Luồng hội thoại */}
        <main
          className={`ticket-forum-thread flex-grow-1 rounded-4 border bg-white shadow-sm d-flex flex-column min-h-0 ${
            !ticketId ? 'd-none d-lg-flex' : 'd-flex'
          }`}
          style={{ minHeight: '420px' }}
        >
          {!ticketId ? (
            <div className="d-none d-lg-flex flex-grow-1 align-items-center justify-content-center text-muted p-5">
              <div className="text-center">
                <Pin size={40} className="mb-3 opacity-25" />
                <p className="mb-0">Chọn một chủ đề bên trái để xem hội thoại.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 border-bottom d-flex flex-wrap align-items-center gap-2 bg-light bg-opacity-50">
                <button
                  type="button"
                  className="btn btn-light btn-sm rounded-3 d-lg-none"
                  onClick={() => navigate('/admin/tickets')}
                >
                  <ChevronLeft size={18} /> Danh sách
                </button>
                <Link to="/admin/tickets" className="btn btn-light btn-sm rounded-3 d-none d-lg-inline-flex align-items-center gap-1">
                  <ChevronLeft size={16} /> Quay lại
                </Link>
                {threadLoading ? (
                  <Loader2 className="animate-spin ms-2" size={20} />
                ) : thread ? (
                  <>
                    <h1 className="h5 fw-bold mb-0 flex-grow-1 text-truncate">{thread.subject}</h1>
                    {isSuperAdmin && (
                      <select
                        className="form-select form-select-sm rounded-3"
                        style={{ width: 'auto', minWidth: '140px' }}
                        value={thread.status}
                        onChange={handleStatusChange}
                      >
                        <option value="Open">Mở</option>
                        <option value="InProgress">Đang xử lý</option>
                        <option value="Resolved">Đã xử lý</option>
                        <option value="Closed">Đóng</option>
                      </select>
                    )}
                    {!isSuperAdmin && (
                      <span className={`badge rounded-pill ${statusBadgeClass(thread.status)}`}>
                        {statusLabel(thread.status)}
                      </span>
                    )}
                  </>
                ) : null}
              </div>

              <div className="flex-grow-1 overflow-auto p-3 p-md-4" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #fff 12%)' }}>
                {threadLoading ? (
                  <div className="text-center py-5 text-muted">
                    <Loader2 className="animate-spin" size={28} />
                  </div>
                ) : thread ? (
                  <div className="d-flex flex-column gap-3">
                    {thread.posts?.map((p) => {
                      const isStaff = p.authorRole === 'SuperAdmin';
                      return (
                        <article
                          key={`${p.id}-${p.createdAt}`}
                          className={`rounded-4 p-3 shadow-sm border ${
                            isStaff ? 'border-primary-subtle bg-primary-subtle ms-0 me-md-4' : 'border-secondary-subtle bg-white me-0 ms-md-4'
                          }`}
                        >
                          <header className="d-flex flex-wrap justify-content-between align-items-baseline gap-2 mb-2">
                            <div>
                              <strong className="text-dark">{p.authorName}</strong>
                              <span className={`badge ms-2 small ${isStaff ? 'text-bg-primary' : 'text-bg-secondary'}`}>
                                {p.authorRole}
                              </span>
                            </div>
                            <time dateTime={p.createdAt} className="small text-muted">{formatVnDateTime(p.createdAt)}</time>
                          </header>
                          <div className="text-break" style={{ whiteSpace: 'pre-wrap' }}>{p.body}</div>
                          {p.attachmentUrls?.length > 0 && (
                            <div className="d-flex flex-wrap gap-2 mt-3">
                              {p.attachmentUrls.map((url) => (
                                <a
                                  key={url}
                                  href={getUploadUrl(url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="d-block rounded-3 overflow-hidden border"
                                  style={{ maxWidth: '200px' }}
                                >
                                  <img src={getUploadUrl(url)} alt="" className="w-100 h-auto d-block" style={{ maxHeight: '180px', objectFit: 'cover' }} />
                                </a>
                              ))}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <footer className="p-3 border-top bg-white rounded-bottom-4">
                <form onSubmit={handleReply} className="d-flex flex-column gap-2">
                  <textarea
                    className="form-control rounded-3"
                    rows={3}
                    placeholder={isSuperAdmin ? 'Trả lời admin công ty…' : 'Nhập nội dung bổ sung hoặc đính kèm ảnh…'}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                  />
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <label className="btn btn-outline-secondary btn-sm rounded-3 mb-0 d-flex align-items-center gap-1">
                      <ImagePlus size={16} /> Ảnh
                      <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple className="d-none" onChange={handleReplyFiles} />
                    </label>
                    {replyFiles.length > 0 && (
                      <span className="small text-muted">{replyFiles.length} ảnh đã chọn</span>
                    )}
                    <button
                      type="submit"
                      className="btn btn-primary rounded-3 ms-auto d-flex align-items-center gap-2"
                      disabled={submitting}
                    >
                      {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                      Gửi bài
                    </button>
                  </div>
                </form>
              </footer>
            </>
          )}
        </main>
      </div>

      {createOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Tạo chủ đề hỗ trợ</h5>
                <button type="button" className="btn-close" onClick={() => setCreateOpen(false)} aria-label="Đóng" />
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <p className="small text-muted">SuperAdmin sẽ thấy chủ đề và có thể trả lời trực tiếp tại đây. Bạn có thể đính kèm ảnh minh họa (tối đa 8 ảnh).</p>
                  <div className="mb-3">
                    <label className="form-label">Tiêu đề</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nội dung cần hỗ trợ</label>
                    <textarea
                      className="form-control rounded-3"
                      rows={5}
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ưu tiên</label>
                    <select
                      className="form-select rounded-3"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    >
                      <option value="Low">Thấp</option>
                      <option value="Normal">Bình thường</option>
                      <option value="High">Cao</option>
                      <option value="Urgent">Khẩn cấp</option>
                    </select>
                  </div>
                  <div className="mb-0">
                    <label className="form-label d-flex align-items-center gap-2">
                      <ImagePlus size={18} /> Hình ảnh đính kèm
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      className="form-control rounded-3"
                      onChange={handleCreateFiles}
                    />
                    {createFiles.length > 0 && (
                      <div className="small text-muted mt-1">{createFiles.length} tệp đã chọn (tối đa 8)</div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light rounded-3" onClick={() => setCreateOpen(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary rounded-3" disabled={submitting}>
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Gửi chủ đề'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Tickets;
