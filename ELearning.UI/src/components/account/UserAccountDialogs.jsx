import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

function parseApiError(data) {
  if (data == null) return 'Có lỗi xảy ra.';
  if (typeof data === 'string') return data;
  if (typeof data === 'object' && data.message) return String(data.message);
  return 'Có lỗi xảy ra.';
}

export default function UserAccountDialogs({ passwordOpen, onClosePassword }) {
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [pwSubmit, setPwSubmit] = useState(false);

  useEffect(() => {
    if (!passwordOpen) return;
    setPw({ currentPassword: '', newPassword: '', confirm: '' });
    setPwMsg('');
    setPwErr('');
  }, [passwordOpen]);

  const submitPw = async (e) => {
    e.preventDefault();
    setPwErr('');
    setPwMsg('');
    if (pw.newPassword !== pw.confirm) {
      setPwErr('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (pw.newPassword.length < 6) {
      setPwErr('Mật khẩu mới tối thiểu 6 ký tự.');
      return;
    }
    setPwSubmit(true);
    try {
      await api.post('auth/change-password', {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      setPwMsg('Đổi mật khẩu thành công!');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      setTimeout(() => onClosePassword?.(), 1000);
    } catch (err) {
      setPwErr(parseApiError(err.response?.data));
    } finally {
      setPwSubmit(false);
    }
  };

  return (
    <>
      {passwordOpen && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom">
                <h5 className="modal-title">Đổi mật khẩu</h5>
                <button type="button" className="btn-close" onClick={onClosePassword} aria-label="Đóng" />
              </div>
              <form onSubmit={submitPw}>
                <div className="modal-body">
                  {pwMsg && <div className="alert alert-success py-2 small">{pwMsg}</div>}
                  {pwErr && <div className="alert alert-danger py-2 small">{pwErr}</div>}
                  <div className="mb-3">
                    <label className="form-label small">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      className="form-control"
                      autoComplete="current-password"
                      value={pw.currentPassword}
                      onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Mật khẩu mới</label>
                    <input
                      type="password"
                      className="form-control"
                      autoComplete="new-password"
                      value={pw.newPassword}
                      onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="mb-0">
                    <label className="form-label small">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      className="form-control"
                      autoComplete="new-password"
                      value={pw.confirm}
                      onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-light" onClick={onClosePassword}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={pwSubmit}>
                    {pwSubmit ? 'Đang lưu…' : 'Lưu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
