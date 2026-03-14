import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertCircle, AlertTriangle } from 'lucide-react';

const NotifyContext = createContext(null);

export function NotifyProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const toast = useCallback((message, type = 'success', duration = 3200) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setConfirmState({
        title: options.title || 'Xác nhận',
        message: options.message || 'Bạn có chắc chắn?',
        confirmText: options.confirmText || 'Xác nhận',
        cancelText: options.cancelText || 'Hủy',
        variant: options.variant || 'danger',
        onConfirm: () => { setConfirmState(null); resolve(true); },
        onCancel: () => { setConfirmState(null); resolve(false); },
      });
    });
  }, []);

  return (
    <NotifyContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="position-fixed top-0 end-0 p-4 d-flex flex-column gap-2" style={{ zIndex: 9999, pointerEvents: 'none' }}>
        <div className="d-flex flex-column gap-2" style={{ pointerEvents: 'auto' }}>
          {toasts.map((t) => (
            <ToastItem key={t.id} message={t.message} type={t.type} />
          ))}
        </div>
      </div>
      {confirmState && <ConfirmModal {...confirmState} />}
    </NotifyContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotifyContext);
  if (!ctx) throw new Error('useNotify must be used within NotifyProvider');
  return ctx;
}

function ToastItem({ message, type }) {
  const isSuccess = type === 'success';
  const isError = type === 'error';
  const isWarning = type === 'warning';
  const isInfo = type === 'info';

  const config = {
    success: { icon: CheckCircle2, bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', shadow: '0 8px 32px rgba(16,185,129,0.35)' },
    error: { icon: XCircle, bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', shadow: '0 8px 32px rgba(239,68,68,0.35)' },
    warning: { icon: AlertTriangle, bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', shadow: '0 8px 32px rgba(245,158,11,0.35)' },
    info: { icon: AlertCircle, bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', shadow: '0 8px 32px rgba(59,130,246,0.35)' },
  };
  const { icon: Icon, bg, shadow } = config[type] || config.success;

  return (
    <div
      className="d-flex align-items-center gap-3 px-4 py-3 rounded-4 border-0 toast-item"
      style={{
        background: bg,
        color: 'white',
        minWidth: '320px',
        maxWidth: '420px',
        boxShadow: shadow,
      }}
    >
      <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center p-1.5 flex-shrink-0">
        <Icon size={20} />
      </div>
      <span className="fw-medium" style={{ fontSize: '0.95rem', lineHeight: 1.4 }}>{message}</span>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .toast-item {
          animation: toastIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}

function ConfirmModal({ title, message, confirmText, cancelText, variant, onConfirm, onCancel }) {
  const isDanger = variant === 'danger';

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden" style={{ border: 'none' }}>
          <div className="modal-header border-0 pt-4 px-4 pb-2">
            <h5 className="modal-title fw-bold" style={{ color: '#0f172a', fontSize: '1.15rem' }}>{title}</h5>
            <button type="button" className="btn-close" onClick={onCancel} aria-label="Đóng" />
          </div>
          <div className="modal-body px-4 py-3">
            <p className="mb-0" style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>{message}</p>
          </div>
          <div className="modal-footer border-0 px-4 pb-4 pt-2 d-flex gap-2 justify-content-end">
            <button type="button" className="btn btn-light px-4 py-2 rounded-3 fw-semibold" onClick={onCancel}>
              {cancelText}
            </button>
            <button
              type="button"
              className={`btn px-4 py-2 rounded-3 fw-semibold ${isDanger ? 'btn-danger' : 'btn-primary'}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
