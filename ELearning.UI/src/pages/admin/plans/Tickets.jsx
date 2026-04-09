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
  const [submitting, setSubmitting] = useState(false);

  const [replyBody, setReplyBody] = useState('');
  const [replyFiles, setReplyFiles] = useState([]);
  const [replyPreviews, setReplyPreviews] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roles = Array.isArray(user?.roles)
    ? user.roles
    : String(user?.roles ?? user?.role ?? '')
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  const isSuperAdmin = roles.includes('SuperAdmin');
  const isCompanyAdmin = roles.includes('Admin');

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
    } catch (err) {
      setTickets([]);
      setTotal(0);
      const msg = err?.response?.data;
      alert(typeof msg === 'string' ? msg : (msg?.message || 'Không tải được danh sách ticket.'));
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

  const isImageFile = (file) => {
    const t = (file?.type || '').toLowerCase();
    return t.startsWith('image/');
  };

  const addFiles = (filesSetter, previewsSetter, incoming) => {
    const arr = Array.from(incoming || []);
    filesSetter((prev) => [...prev, ...arr].slice(0, 8));
    previewsSetter((prev) => {
      const next = [...prev];
      for (const f of arr) {
        if (next.length >= 8) break;
        const img = isImageFile(f);
        next.push({ name: f.name, isImage: img, url: img ? URL.createObjectURL(f) : null });
      }
      return next.slice(0, 8);
    });
  };

  const removeFileAt = (idx, filesSetter, previewsSetter) => {
    filesSetter((prev) => prev.filter((_, i) => i !== idx));
    previewsSetter((prev) => {
      const item = prev[idx];
      if (item?.url) URL.revokeObjectURL(item.url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleReplyFiles = (e) => {
    addFiles(setReplyFiles, setReplyPreviews, e.target.files);
    e.target.value = '';
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
      setReplyPreviews((prev) => {
        prev.forEach((p) => p.url && URL.revokeObjectURL(p.url));
        return [];
      });
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
        <div className="mb-3 d-flex align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <MessageCircle size={18} className="text-muted" />
            <h2 className="fw-bold mb-0">{isSuperAdmin ? 'Hỗ trợ từ công ty' : 'Gửi hỗ trợ'}</h2>
            <span className="text-muted small">({total})</span>
          </div>
          {isCompanyAdmin && !isSuperAdmin && (
            <button type="button" className="btn btn-sm btn-primary d-flex align-items-center gap-2 px-3" onClick={() => navigate('/admin/tickets/new')}>
              <Plus size={16} />
              Tạo yêu cầu hỗ trợ
            </button>
          )}
        </div>

        <div className="ticket-forum d-flex flex-column flex-lg-row gap-3" style={{ minHeight: '70vh' }}>
        {/* Enhanced Ticket List Sidebar */}
        <aside
          className={`ticket-forum-list flex-shrink-0 rounded-4 border bg-white shadow-sm overflow-hidden ${
            ticketId ? 'd-none d-lg-block' : ''
          }`}
          style={{ width: '100%', maxWidth: '420px' }}
        >
          <div className="p-3 border-bottom bg-light">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="h6 fw-bold mb-1 text-dark">Danh sách ticket</h3>
                <p className="small text-muted mb-0" style={{ fontSize: '0.8rem' }}>
                  {isSuperAdmin ? `${total} yêu cầu hỗ trợ từ tất cả công ty` : `${total} yêu cầu hỗ trợ của công ty bạn`}
                </p>
              </div>
            </div>

            <div className="text-muted small" style={{ fontSize: '0.8rem' }}>
              Mở: <strong className="text-dark">{list.filter(t => t.status === 'Open').length}</strong> · Đang xử lý:{' '}
              <strong className="text-dark">{list.filter(t => t.status === 'InProgress').length}</strong> · Đã xử lý:{' '}
              <strong className="text-dark">{list.filter(t => t.status === 'Resolved').length}</strong>
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
                  {isCompanyAdmin && !isSuperAdmin && 'Hãy tạo ticket đầu tiên để được hỗ trợ từ SuperAdmin.'}
                </p>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {list.map((t) => (
                  <div
                    key={t.id}
                    className={`list-group-item list-group-item-action border-0 border-bottom px-4 py-3 hover-bg-light cursor-pointer ${
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
          className={`ticket-forum-thread flex-grow-1 rounded-4 border bg-white shadow-sm d-flex flex-column min-h-0 ${
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
              <div className="p-3 border-bottom bg-light">
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
                        <h2 className="h5 fw-bold mb-1 text-dark" style={{ fontSize: '1.05rem' }}>{thread.subject}</h2>
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
              <div className="flex-grow-1 overflow-auto p-3" style={{ background: '#f8fafc' }}>
                {threadLoading ? (
                  <div className="text-center py-5">
                    <Loader2 className="animate-spin text-primary mb-3" size={32} />
                    <div className="text-muted">Đang tải cuộc trò chuyện...</div>
                  </div>
                ) : thread ? (
                  <div className="d-flex flex-column gap-3">
                    {thread.posts?.map((p, index) => {
                      const isStaff = p.authorRole === 'SuperAdmin';
                      const isFirst = index === 0;
                      return (
                        <article
                          key={`${p.id}-${p.createdAt}`}
                          className={`rounded-4 p-3 border ${
                            isStaff ? 'ms-0 me-lg-5 bg-white' : 'me-0 ms-lg-5 bg-white'
                          }`}
                          style={isStaff ? { borderColor: 'rgba(37,99,235,0.22)', background: 'rgba(37,99,235,0.06)' } : { borderColor: 'rgba(17,24,39,0.10)' }}
                        >
                          <header className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                                style={{
                                  width: 34,
                                  height: 34,
                                  background: isStaff ? 'rgba(37,99,235,0.18)' : 'rgba(17,24,39,0.10)',
                                  color: isStaff ? '#1d4ed8' : '#111827',
                                }}
                              >
                                {p.authorName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong className="text-dark" style={{ fontSize: '0.92rem' }}>{p.authorName}</strong>
                                <div className="small text-muted" style={{ fontSize: '0.78rem' }}>
                                  {isStaff ? 'Super Admin' : 'Khách hàng'}
                                  {isFirst && <span className="ms-2">• Người tạo ticket</span>}
                                </div>
                              </div>
                            </div>
                            <time dateTime={p.createdAt} className="small text-muted" style={{ fontSize: '0.78rem' }}>
                              {formatVnDateTime(p.createdAt)}
                            </time>
                          </header>

                          <div className="text-break mb-2 text-dark" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, fontSize: '0.9rem' }}>
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
                                      className="d-block rounded-4 overflow-hidden border shadow-sm"
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
              <footer className="p-3 border-top bg-white rounded-bottom-4">
                <form onSubmit={handleReply} className="d-flex flex-column gap-3">
                  <div className="bg-light rounded-4 p-2 border">
                    <textarea
                      className="form-control border-0 bg-transparent shadow-none"
                      rows={3}
                      placeholder={isSuperAdmin ? 'Nhập phản hồi cho khách hàng...' : 'Nhập nội dung bổ sung hoặc đính kèm ảnh...'}
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      style={{ resize: 'none' }}
                    />
                  </div>

                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <label className="btn btn-sm btn-outline-secondary rounded-3 mb-0 d-flex align-items-center gap-2">
                        <ImagePlus size={16} />
                        Thêm hình / file
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                          multiple
                          className="d-none"
                          onChange={handleReplyFiles}
                        />
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-sm btn-primary rounded-3 px-3 d-flex align-items-center gap-2"
                      disabled={submitting || (!replyBody.trim() && replyFiles.length === 0)}
                    >
                      {submitting ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Send size={16} />
                      )}
                      {submitting ? 'Đang gửi...' : 'Gửi'}
                    </button>
                  </div>

                  {replyPreviews.length > 0 && (
                    <div className="d-flex flex-wrap gap-2">
                      {replyPreviews.map((p, idx) => (
                        <div key={p.name + idx} className="border rounded-3 bg-white p-2 d-flex align-items-center gap-2" style={{ maxWidth: 260 }}>
                          {p.isImage && p.url ? (
                            <img src={p.url} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 8 }} />
                          ) : (
                            <Paperclip size={16} className="text-muted flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="small text-truncate" title={p.name} style={{ maxWidth: 180 }}>{p.name}</div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm p-0 border-0 ms-auto"
                            onClick={() => removeFileAt(idx, setReplyFiles, setReplyPreviews)}
                            aria-label="Remove"
                          >
                            <X size={14} />
                          </button>
                        </div>
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

    </AdminLayout>
  );
};

export default Tickets;
