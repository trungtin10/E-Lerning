import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Bell, Check } from 'lucide-react';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const refreshUnread = async () => {
    try {
      const r = await api.get('/notification/unread-count');
      if (r && r.data) {
        setUnread(r.data.unread ?? 0);
      }
    } catch (err) {
      console.warn('NotificationBell: Failed to refresh unread count', err.message);
    }
  };

  const loadList = async () => {
    setLoading(true);
    try {
      const r = await api.get('/notification?page=1&pageSize=10');
      setItems(r.data?.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notification/read-all');
      await refreshUnread();
      await loadList();
    } catch { /* ignore */ }
  };

  const markRead = async (id) => {
    try {
      await api.post(`/notification/${id}/read`, { isRead: true });
      await refreshUnread();
      await loadList();
    } catch { /* ignore */ }
  };

  useEffect(() => {
    refreshUnread();
    const t = setInterval(refreshUnread, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (open) loadList();
  }, [open]);

  return (
    <div className="position-relative">
      <button
        type="button"
        className="btn btn-link p-2 text-secondary position-relative hover-bg-light rounded-circle transition-all border-0 shadow-none d-flex align-items-center justify-content-center"
        onClick={() => setOpen(v => !v)}
        title="Thông báo"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.65rem' }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1200 }} onClick={() => setOpen(false)} />
          <div className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg border overflow-hidden" style={{ width: 360, zIndex: 1201 }}>
            <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom bg-light">
              <div className="fw-bold small">Thông báo</div>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={markAllRead} disabled={unread === 0}>
                <Check size={14} className="me-1" /> Đã đọc hết
              </button>
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {loading ? (
                <div className="p-3 text-center text-muted small">Đang tải...</div>
              ) : items.length === 0 ? (
                <div className="p-3 text-center text-muted small">Chưa có thông báo.</div>
              ) : (
                items.map(n => (
                  <div key={n.id} className={`px-3 py-2 border-bottom ${n.isRead ? 'bg-white' : 'bg-warning bg-opacity-10'}`}>
                    <div className="d-flex align-items-start justify-content-between gap-2">
                      <div className="min-w-0">
                        <div className="fw-bold small text-dark text-truncate">{n.title}</div>
                        {n.content && <div className="small text-muted text-truncate">{n.content}</div>}
                        <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                          {n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                        </div>
                      </div>
                      {!n.isRead && (
                        <button type="button" className="btn btn-sm btn-light border" onClick={() => markRead(n.id)} title="Đánh dấu đã đọc">
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;

