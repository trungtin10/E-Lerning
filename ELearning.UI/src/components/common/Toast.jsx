import React, { useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 2800 }) => {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const isSuccess = type === 'success';
  return (
    <div
      className="d-flex align-items-center gap-3 px-4 py-3 rounded-4 shadow-lg border-0 toast-popup"
      style={{
        background: isSuccess ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: 'white',
        minWidth: '300px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)',
      }}
    >
      <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center p-1">
        {isSuccess ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
      </div>
      <span className="fw-semibold" style={{ fontSize: '0.95rem' }}>{message}</span>
      <style>{`
        @keyframes toastSlide {
          from { opacity: 0; transform: translateX(120%) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        .toast-popup {
          animation: toastSlide 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
};

export default Toast;
