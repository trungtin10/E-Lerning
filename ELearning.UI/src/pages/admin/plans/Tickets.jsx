import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import api, { getUploadUrl } from '../../../api/axios';
import {
  MessageCircle, Plus, Loader2, Send, ImagePlus, ChevronLeft, Building2, Pin, Paperclip, X
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

  const isImageUrl = (url) => {
    const u = (url || '').toLowerCase();
    return u.endsWith('.jpg') || u.endsWith('.jpeg') || u.endsWith('.png') || u.endsWith('.gif') || u.endsWith('.webp');
  };

  const removeFileAt = (setter, idx) => setter((prev) => prev.filter((_, i) => i !== idx));

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
      <div className="container-fluid px-4 py-3">
        {/* Enhanced Header */}
        <div className="mb-5">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h1 className="h2 fw-bold text-dark mb-1 d-flex align-items-center gap-3">
                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                  <MessageCircle size={24} className="text-primary" />
                </div>
                Hỗ trợ & Diễn đàn
              </h1>
              <p className="text-muted mb-0">Nơi trao đổi và giải quyết các vấn đề kỹ thuật</p>
            </div>
            {!isSuperAdmin && (
              <button
                type="button"
                className="btn btn-primary btn-lg rounded-3 d-flex align-items-center gap-2 px-4 py-2 shadow-sm hover-shadow transition-all"
                onClick={() => setCreateOpen(true)}
              >
                <Plus size={20} />
                Tạo ticket mới
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 bg-gradient-primary text-white">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                      <MessageCircle size={20} />
                    </div>
                    <div>
                      <div className="h4 mb-0 fw-bold">{total}</div>
                      <small className="opacity-75">Tổng ticket</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 bg-gradient-success text-white">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                      <span className="fw-bold">✓</span>
                    </div>
                    <div>
                      <div className="h4 mb-0 fw-bold">{list.filter(t => t.status === 'Resolved').length}</div>
                      <small className="opacity-75">Đã xử lý</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 bg-gradient-warning text-white">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                      <span className="fw-bold">⏳</span>
                    </div>
                    <div>
                      <div className="h4 mb-0 fw-bold">{list.filter(t => t.status === 'InProgress').length}</div>
                      <small className="opacity-75">Đang xử lý</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 bg-gradient-danger text-white">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                      <span className="fw-bold">!</span>
                    </div>
                    <div>
                      <div className="h4 mb-0 fw-bold">{list.filter(t => t.status === 'Open').length}</div>
                      <small className="opacity-75">Chờ xử lý</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ticket-forum d-flex flex-column flex-lg-row gap-4" style={{ minHeight: '70vh' }}>
        {/* Enhanced Ticket List Sidebar */}
        <aside
          className={`ticket-forum-list flex-shrink-0 rounded-4 border-0 bg-white shadow-lg overflow-hidden ${
            ticketId ? 'd-none d-lg-block' : ''
          }`}
          style={{ width: '100%', maxWidth: '420px' }}
        >
          <div className="p-4 border-bottom bg-gradient-light">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="h5 fw-bold mb-1 text-dark">Danh sách Ticket</h3>
                <p className="small text-muted mb-0">
                  {isSuperAdmin ? `${total} ticket từ tất cả công ty` : `${total} ticket của công ty bạn`}
                </p>
              </div>
              {!isSuperAdmin && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm rounded-3 d-flex align-items-center gap-2 px-3 py-2"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus size={16} />
                  Tạo mới
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-outline-primary btn-sm rounded-pill active">Tất cả</button>
              <button className="btn btn-outline-warning btn-sm rounded-pill">Mở</button>
              <button className="btn btn-outline-info btn-sm rounded-pill">Đang xử lý</button>
              <button className="btn btn-outline-success btn-sm rounded-pill">Đã xử lý</button>
            </div>
          </div>

          <div className="overflow-auto" style={{ maxHeight: 'calc(70vh - 200px)' }}>
            {listLoading ? (
              <div className="text-center py-5">
                <Loader2 className="animate-spin text-primary mb-3" size={32} />
                <div className="text-muted">Đang tải danh sách ticket...</div>
              </div>
            ) : list.length === 0 ? (
              <div className="p-5 text-center">
                <MessageCircle size={48} className="text-muted mb-3 opacity-50" />
                <h6 className="text-muted mb-2">Chưa có ticket nào</h6>
                <p className="small text-muted mb-0">
                  {!isSuperAdmin && 'Hãy tạo ticket đầu tiên để được hỗ trợ từ SuperAdmin.'}
                </p>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {list.map((t) => (
                  <div
                    key={t.id}
                    className={`list-group-item list-group-item-action border-0 border-bottom px-4 py-3 hover-bg-light cursor-pointer transition-all ${
                      String(ticketId) === String(t.id) ? 'bg-primary bg-opacity-5 border-primary border-start border-4' : ''
                    }`}
                    onClick={() => openThread(t.id)}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                      <h6 className="mb-0 text-dark fw-semibold text-truncate flex-grow-1">{t.subject}</h6>
                      <span className={`badge rounded-pill small flex-shrink-0 ${statusBadgeClass(t.status)} fw-medium px-2 py-1`}>
                        {statusLabel(t.status)}
                      </span>
                    </div>

                    {isSuperAdmin && (
                      <div className="d-flex align-items-center gap-1 mb-2">
                        <Building2 size={14} className="text-muted" />
                        <span className="small text-muted fw-medium">{t.companyName}</span>
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center">
                      <span className="small text-muted">
                        {t.postCount || 0} bài viết
                      </span>
                      <span className="small text-muted">
                        {formatVnDateTime(t.lastActivityAt || t.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Enhanced Thread View */}
        <main
          className={`ticket-forum-thread flex-grow-1 rounded-4 border-0 bg-white shadow-lg d-flex flex-column min-h-0 ${
            !ticketId ? 'd-none d-lg-flex' : 'd-flex'
          }`}
          style={{ minHeight: '500px' }}
        >
          {!ticketId ? (
            <div className="d-none d-lg-flex flex-grow-1 align-items-center justify-content-center p-5">
              <div className="text-center">
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px' }}>
                  <MessageCircle size={40} className="text-muted" />
                </div>
                <h4 className="text-muted mb-2">Chọn một ticket để xem</h4>
                <p className="text-muted mb-0">Nhấp vào ticket bên trái để xem chi tiết và trao đổi</p>
              </div>
            </div>
          ) : (
            <>
              {/* Enhanced Thread Header */}
              <div className="p-4 border-bottom bg-gradient-light">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm rounded-3 d-lg-none d-flex align-items-center gap-2"
                      onClick={() => navigate('/admin/tickets')}
                    >
                      <ChevronLeft size={16} />
                      Danh sách
                    </button>
                    <Link
                      to="/admin/tickets"
                      className="btn btn-outline-secondary btn-sm rounded-3 d-none d-lg-inline-flex align-items-center gap-2"
                    >
                      <ChevronLeft size={16} />
                      Quay lại
                    </Link>
                  </div>

                  {threadLoading ? (
                    <div className="d-flex align-items-center gap-2">
                      <Loader2 className="animate-spin text-primary" size={20} />
                      <span className="text-muted">Đang tải...</span>
                    </div>
                  ) : thread ? (
                    <div className="d-flex align-items-center gap-3 flex-grow-1">
                      <div className="flex-grow-1">
                        <h2 className="h4 fw-bold mb-1 text-dark">{thread.subject}</h2>
                        <div className="d-flex align-items-center gap-3">
                          {isSuperAdmin && (
                            <div className="d-flex align-items-center gap-1">
                              <Building2 size={16} className="text-muted" />
                              <span className="small text-muted fw-medium">{thread.companyName}</span>
                            </div>
                          )}
                          <span className={`badge rounded-pill px-3 py-1 ${statusBadgeClass(thread.status)} fw-medium`}>
                            {statusLabel(thread.status)}
                          </span>
                          <span className="small text-muted">
                            {thread.posts?.length || 0} bài viết
                          </span>
                        </div>
                      </div>

                      {isSuperAdmin && (
                        <select
                          className="form-select form-select-sm rounded-3 border-0 bg-light"
                          style={{ width: 'auto', minWidth: '160px' }}
                          value={thread.status}
                          onChange={handleStatusChange}
                        >
                          <option value="Open">🔓 Mở</option>
                          <option value="InProgress">⏳ Đang xử lý</option>
                          <option value="Resolved">✅ Đã xử lý</option>
                          <option value="Closed">🔒 Đóng</option>
                        </select>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Enhanced Messages Area */}
              <div className="flex-grow-1 overflow-auto p-4" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 20px)' }}>
                {threadLoading ? (
                  <div className="text-center py-5">
                    <Loader2 className="animate-spin text-primary mb-3" size={32} />
                    <div className="text-muted">Đang tải cuộc trò chuyện...</div>
                  </div>
                ) : thread ? (
                  <div className="d-flex flex-column gap-4">
                    {thread.posts?.map((p, index) => {
                      const isStaff = p.authorRole === 'SuperAdmin';
                      const isFirst = index === 0;
                      return (
                        <article
                          key={`${p.id}-${p.createdAt}`}
                          className={`rounded-4 p-4 shadow-sm border-0 ${
                            isStaff
                              ? 'bg-gradient-primary text-white ms-0 me-lg-5'
                              : 'bg-white border me-0 ms-lg-5'
                          }`}
                        >
                          <header className="d-flex justify-content-between align-items-center mb-3">
                            <div className="d-flex align-items-center gap-3">
                              <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${
                                isStaff ? 'bg-white bg-opacity-20 text-white' : 'bg-primary text-white'
                              }`} style={{ width: '40px', height: '40px' }}>
                                {p.authorName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong className={isStaff ? 'text-white' : 'text-dark'}>{p.authorName}</strong>
                                <div className="small opacity-75">
                                  {isStaff ? '👨‍💼 Super Admin' : '🏢 Khách hàng'}
                                  {isFirst && <span className="ms-2">• Người tạo ticket</span>}
                                </div>
                              </div>
                            </div>
                            <time dateTime={p.createdAt} className={`small ${isStaff ? 'text-white opacity-75' : 'text-muted'}`}>
                              {formatVnDateTime(p.createdAt)}
                            </time>
                          </header>

                          <div className={`text-break mb-3 ${isStaff ? 'text-white' : 'text-dark'}`} style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                            {p.body}
                          </div>

                          {p.attachmentUrls?.length > 0 && (
                            <div className="d-flex flex-wrap gap-3 mt-3">
                              {p.attachmentUrls.map((url, idx) => {
                                const full = getUploadUrl(url);
                                if (isImageUrl(url)) {
                                  return (
                                    <a
                                      key={idx}
                                      href={full}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="d-block rounded-4 overflow-hidden border shadow-sm hover-shadow transition-all"
                                      style={{ maxWidth: '220px' }}
                                    >
                                      <img
                                        src={full}
                                        alt={`Attachment ${idx + 1}`}
                                        className="w-100 h-auto d-block"
                                        style={{ maxHeight: '200px', objectFit: 'cover' }}
                                      />
                                    </a>
                                  );
                                }

                                const name = (url || '').split('/').pop();
                                return (
                                  <a
                                    key={idx}
                                    href={full}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`btn btn-sm rounded-3 d-inline-flex align-items-center gap-2 ${
                                      isStaff ? 'btn-outline-light' : 'btn-outline-secondary'
                                    }`}
                                  >
                                    <Paperclip size={16} />
                                    <span className="text-truncate" style={{ maxWidth: 220 }}>{name}</span>
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className="text-muted">Không thể tải cuộc trò chuyện này</div>
                  </div>
                )}
              </div>

              {/* Enhanced Reply Form */}
              <footer className="p-4 border-top bg-light rounded-bottom-4">
                <form onSubmit={handleReply} className="d-flex flex-column gap-3">
                  <div className="bg-white rounded-4 p-3 border">
                    <textarea
                      className="form-control border-0 bg-transparent shadow-none"
                      rows={4}
                      placeholder={isSuperAdmin ? 'Nhập phản hồi cho khách hàng...' : 'Nhập nội dung bổ sung hoặc đính kèm ảnh...'}
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      style={{ resize: 'none' }}
                    />
                  </div>

                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <label className="btn btn-outline-primary btn-sm rounded-3 mb-0 d-flex align-items-center gap-2">
                        <Paperclip size={16} />
                        Đính kèm tệp
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                          multiple
                          className="d-none"
                          onChange={handleReplyFiles}
                        />
                      </label>
                      {replyFiles.length > 0 && (
                        <span className="small text-success fw-medium">
                          ✓ {replyFiles.length} tệp đã chọn
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary rounded-3 px-4 py-2 d-flex align-items-center gap-2 shadow-sm hover-shadow transition-all"
                      disabled={submitting || (!replyBody.trim() && replyFiles.length === 0)}
                    >
                      {submitting ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Send size={18} />
                      )}
                      {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                    </button>
                  </div>

                  {replyFiles.length > 0 && (
                    <div className="d-flex flex-wrap gap-2">
                      {replyFiles.map((f, idx) => (
                        <span key={f.name + idx} className="badge text-bg-light border rounded-pill d-inline-flex align-items-center gap-2">
                          <Paperclip size={14} />
                          <span className="text-truncate" style={{ maxWidth: 260 }}>{f.name}</span>
                          <button
                            type="button"
                            className="btn btn-sm p-0 border-0"
                            onClick={() => removeFileAt(setReplyFiles, idx)}
                            aria-label="Remove"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </form>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>

      {/* Enhanced Create Ticket Modal */}
      {createOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header bg-gradient-primary text-white border-0 rounded-top-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                    <Plus size={22} />
                  </div>
                  <div>
                    <h4 className="modal-title mb-0 fw-bold">Tạo Ticket Hỗ trợ Mới</h4>
                    <small className="opacity-75">SuperAdmin sẽ nhận và xử lý yêu cầu của bạn</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setCreateOpen(false)}
                  aria-label="Đóng"
                />
              </div>

              <form onSubmit={handleCreate}>
                <div className="modal-body p-4">
                  <div className="alert alert-info rounded-4 border-0 mb-4">
                    <div className="d-flex gap-3">
                      <div className="flex-shrink-0">
                        <MessageCircle size={20} className="text-info" />
                      </div>
                      <div>
                        <h6 className="alert-heading mb-1">Hướng dẫn tạo ticket</h6>
                        <p className="mb-0 small">
                          Mô tả chi tiết vấn đề bạn gặp phải. Đính kèm ảnh minh họa sẽ giúp SuperAdmin hiểu rõ hơn và hỗ trợ nhanh chóng.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="row g-4">
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label fw-semibold text-dark d-flex align-items-center gap-2">
                          <span className="text-danger">*</span>
                          Tiêu đề ticket
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg rounded-3 border-0 bg-light"
                          placeholder="Ví dụ: Lỗi không thể đăng nhập vào hệ thống"
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          required
                        />
                        <div className="form-text">Tiêu đề ngắn gọn, súc tích để dễ nhận biết</div>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label fw-semibold text-dark d-flex align-items-center gap-2">
                          <span className="text-danger">*</span>
                          Mô tả chi tiết vấn đề
                        </label>
                        <textarea
                          className="form-control rounded-3 border-0 bg-light"
                          rows={6}
                          placeholder="Mô tả chi tiết vấn đề bạn gặp phải, các bước đã thử, lỗi cụ thể..."
                          value={form.content}
                          onChange={(e) => setForm({ ...form, content: e.target.value })}
                          required
                        />
                        <div className="form-text">Càng chi tiết càng tốt để được hỗ trợ nhanh chóng</div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-semibold text-dark">Mức độ ưu tiên</label>
                        <select
                          className="form-select form-select-lg rounded-3 border-0 bg-light"
                          value={form.priority}
                          onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        >
                          <option value="Low">🟢 Thấp - Vấn đề không khẩn cấp</option>
                          <option value="Normal">🟡 Bình thường - Cần hỗ trợ trong thời gian hợp lý</option>
                          <option value="High">🟠 Cao - Ảnh hưởng đến hoạt động kinh doanh</option>
                          <option value="Urgent">🔴 Khẩn cấp - Dừng hoạt động, cần hỗ trợ ngay</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-semibold text-dark d-flex align-items-center gap-2">
                          <Paperclip size={18} />
                          Đính kèm ảnh / file
                        </label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                          multiple
                          className="form-control rounded-3 border-0 bg-light"
                          onChange={handleCreateFiles}
                        />
                        {createFiles.length > 0 && (
                          <div className="mt-2 p-3 bg-success bg-opacity-10 rounded-3 border border-success border-opacity-25">
                            <div className="d-flex align-items-center gap-2 text-success">
                              <span className="fw-medium">✓ {createFiles.length} tệp đã chọn</span>
                              <small className="text-muted">(tối đa 8 tệp)</small>
                            </div>
                          </div>
                        )}
                        {createFiles.length > 0 && (
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {createFiles.map((f, idx) => (
                              <span key={f.name + idx} className="badge text-bg-light border rounded-pill d-inline-flex align-items-center gap-2">
                                <Paperclip size={14} />
                                <span className="text-truncate" style={{ maxWidth: 260 }}>{f.name}</span>
                                <button
                                  type="button"
                                  className="btn btn-sm p-0 border-0"
                                  onClick={() => removeFileAt(setCreateFiles, idx)}
                                  aria-label="Remove"
                                >
                                  <X size={14} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="form-text">Hỗ trợ: ảnh (JPG/PNG/GIF/WebP), PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, ZIP/RAR (tối đa 8 tệp)</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 bg-light rounded-bottom-4 p-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-3 px-4"
                    onClick={() => setCreateOpen(false)}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary rounded-3 px-4 d-flex align-items-center gap-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Send size={18} />
                    )}
                    {submitting ? 'Đang gửi...' : 'Gửi ticket'}
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
