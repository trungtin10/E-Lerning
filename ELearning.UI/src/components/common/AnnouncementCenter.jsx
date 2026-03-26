import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';

const severityStyle = (sev) => {
  switch ((sev || 'Info').toLowerCase()) {
    case 'critical':
      return { bg: 'linear-gradient(90deg, #7f1d1d, #dc2626)', badge: 'bg-danger' };
    case 'warning':
      return { bg: 'linear-gradient(90deg, #92400e, #f59e0b)', badge: 'bg-warning text-dark' };
    default:
      return { bg: 'linear-gradient(90deg, #1e3a5f, #4a90c7)', badge: 'bg-info text-dark' };
  }
};

const AnnouncementCenter = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedAnon, setDismissedAnon] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('announcementDismissed') || '[]'); }
    catch { return []; }
  });
  const [ackPopupId, setAckPopupId] = useState(null);

  const reload = async () => {
    try {
      const r = await api.get('/announcement/active');
      setAnnouncements(r.data || []);
    } catch {
      setAnnouncements([]);
    }
  };

  useEffect(() => { reload(); }, []);

  const banners = useMemo(() => {
    return (announcements || [])
      .filter(a => a.displayType === 'Banner')
      .filter(a => !dismissedAnon.includes(a.id))
      .sort((x, y) => (y.priority ?? 0) - (x.priority ?? 0));
  }, [announcements, dismissedAnon]);

  const popups = useMemo(() => {
    return (announcements || [])
      .filter(a => a.displayType === 'Popup')
      .sort((x, y) => (y.priority ?? 0) - (x.priority ?? 0));
  }, [announcements]);

  // auto show highest priority popup if any
  useEffect(() => {
    if (ackPopupId != null) return;
    if (popups.length > 0) setAckPopupId(popups[0].id);
  }, [popups, ackPopupId]);

  const dismissBanner = async (a) => {
    setDismissedAnon(prev => {
      const next = [...prev, a.id];
      sessionStorage.setItem('announcementDismissed', JSON.stringify(next));
      return next;
    });
    try { await api.post(`/announcement/${a.id}/dismiss`); } catch { /* ignore (anon) */ }
  };

  const acknowledgePopup = async (a) => {
    setAckPopupId(null);
    try { await api.post(`/announcement/${a.id}/ack`); } catch { /* ignore */ }
    reload();
  };

  const activePopup = ackPopupId != null ? popups.find(p => p.id === ackPopupId) : null;

  return (
    <>
      {banners.length > 0 && (
        <div className="position-fixed top-0 start-0 end-0 z-1050" style={{ zIndex: 1050 }}>
          {banners.map(a => {
            const st = severityStyle(a.severity);
            return (
              <div
                key={a.id}
                className="d-flex align-items-center justify-content-between px-4 py-2 text-white"
                style={{ background: st.bg }}
              >
                <div className="d-flex align-items-center gap-2 min-w-0">
                  <span className={`badge rounded-pill ${st.badge}`} style={{ fontSize: '0.7rem' }}>{a.severity || 'Info'}</span>
                  <span className="small text-truncate">
                    <span className="fw-bold">{a.title}</span>
                    {a.content ? `: ${String(a.content).slice(0, 120)}${String(a.content).length > 120 ? '...' : ''}` : ''}
                  </span>
                  {a.linkUrl && (
                    <a className="small text-white-50 text-decoration-underline flex-shrink-0" href={a.linkUrl}>
                      Xem thêm
                    </a>
                  )}
                </div>
                <button className="btn btn-link text-white p-0 ms-2" onClick={() => dismissBanner(a)} title="Ẩn thông báo">×</button>
              </div>
            );
          })}
        </div>
      )}

      {activePopup && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header">
                <div className="d-flex flex-column">
                  <h5 className="modal-title fw-bold mb-0">{activePopup.title}</h5>
                  <div className="small text-muted">{activePopup.severity || 'Info'} · Priority {activePopup.priority ?? 0}</div>
                </div>
                <button type="button" className="btn-close" onClick={() => setAckPopupId(null)} />
              </div>
              <div className="modal-body">
                <div className="text-secondary" style={{ whiteSpace: 'pre-wrap' }}>{activePopup.content}</div>
                {activePopup.linkUrl && (
                  <div className="mt-3">
                    <a className="btn btn-outline-primary btn-sm" href={activePopup.linkUrl}>Mở liên kết</a>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setAckPopupId(null)}>Đóng</button>
                <button className="btn btn-primary" onClick={() => acknowledgePopup(activePopup)}>Đã hiểu</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AnnouncementCenter;

