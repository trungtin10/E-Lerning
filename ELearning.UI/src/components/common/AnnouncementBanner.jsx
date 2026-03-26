import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('announcementDismissed') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    api.get('/announcement/active').then(r => setAnnouncements(r.data || [])).catch(() => {});
  }, []);

  const handleDismiss = (id) => {
    setDismissed(prev => {
      const next = [...prev, id];
      sessionStorage.setItem('announcementDismissed', JSON.stringify(next));
      return next;
    });
  };

  const toShow = announcements.filter(a => a.displayType === 'Banner' && !dismissed.includes(a.id));
  if (toShow.length === 0) return null;

  return (
    <div className="position-fixed top-0 start-0 end-0 z-1050" style={{ zIndex: 1050 }}>
      {toShow.map(a => (
        <div
          key={a.id}
          className="d-flex align-items-center justify-content-between px-4 py-2 text-white"
          style={{ background: 'linear-gradient(90deg, #1e3a5f, #4a90c7)' }}
        >
          <span className="small">{a.title}: {a.content?.slice(0, 80)}{a.content?.length > 80 ? '...' : ''}</span>
          <button className="btn btn-link text-white p-0 ms-2" onClick={() => handleDismiss(a.id)}>×</button>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementBanner;
