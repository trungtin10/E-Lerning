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
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  });
  const userId = user?.id || 'anon';

  const [dismissedAnon, setDismissedAnon] = useState([]);
  const [dismissedPopups, setDismissedPopups] = useState([]);
  const [ackPopupId, setAckPopupId] = useState(null);

  useEffect(() => {
    const savedAnon = sessionStorage.getItem(`announcementDismissed_${userId}`);
    const savedPopups = sessionStorage.getItem(`popupDismissed_${userId}`);
    setDismissedAnon(savedAnon ? JSON.parse(savedAnon) : []);
    setDismissedPopups(savedPopups ? JSON.parse(savedPopups) : []);
  }, [userId]);

  const reload = async () => {
    try {
      const r = await api.get('/announcement/active');
      setAnnouncements(r.data || []);
    } catch {
      setAnnouncements([]);
    }
  };

  useEffect(() => { reload(); }, []);

  const stripHtml = (html) => {
    if (!html) return '';
    const decoded = unescapeHtml(html);
    const doc = new DOMParser().parseFromString(decoded, 'text/html');
    return doc.body.textContent || "";
  };

  const unescapeHtml = (safe) => {
    if (!safe) return '';
    return safe.replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#039;/g, "'")
               .replace(/&nbsp;/g, ' ');
  };

  const banners = useMemo(() => {
    return (announcements || [])
      .filter(a => a.displayType === 'Banner')
      .filter(a => !dismissedAnon.includes(a.id))
      .sort((x, y) => (y.priority ?? 0) - (x.priority ?? 0));
  }, [announcements, dismissedAnon]);

  const popups = useMemo(() => {
    return (announcements || [])
      .filter(a => a.displayType === 'Popup')
      .filter(a => !dismissedPopups.includes(a.id))
      .sort((x, y) => (y.priority ?? 0) - (x.priority ?? 0));
  }, [announcements, dismissedPopups]);

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

  const closePopup = (id) => {
    setDismissedPopups(prev => {
      const next = [...prev, id];
      sessionStorage.setItem(`popupDismissed_${userId}`, JSON.stringify(next));
      return next;
    });
    setAckPopupId(null);
  };

  const acknowledgePopup = async (a) => {
    closePopup(a.id);
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
            const plainContent = stripHtml(a.content);
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
                    {plainContent ? `: ${plainContent.slice(0, 120)}${plainContent.length > 120 ? '...' : ''}` : ''}
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
                <button type="button" className="btn-close" onClick={() => closePopup(activePopup.id)} />
              </div>
              <div className="modal-body">
                <div 
                   className="text-secondary notification-content-html" 
                   style={{ whiteSpace: 'pre-wrap' }}
                   dangerouslySetInnerHTML={{ __html: unescapeHtml(activePopup.content) }}
                />
                {activePopup.linkUrl && (
                  <div className="mt-3">
                    <a className="btn btn-outline-primary btn-sm" href={activePopup.linkUrl}>Mở liên kết</a>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => closePopup(activePopup.id)}>Đóng</button>
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

