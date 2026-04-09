import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import UserLayout from '../../components/layout/UserLayout';
import api from '../../api/axios';

function mergeProfileToStorage(data) {
  const u = JSON.parse(localStorage.getItem('user') || '{}');
  localStorage.setItem(
    'user',
    JSON.stringify({
      ...u,
      fullName: data.fullName,
      account: data.userName,
      email: data.email ?? u.email,
      phoneNumber: data.phoneNumber,
      roles: data.roles ?? u.roles,
      companyId: data.companyId,
      subDomain: data.subDomain ?? u.subDomain,
      companyLogoUrl: data.companyLogoUrl ?? u.companyLogoUrl,
      companyName: data.companyName,
      jobTitle: data.jobTitle,
    })
  );
  window.dispatchEvent(new Event('elearning-user-updated'));
}

function parseApiError(data) {
  if (data == null) return 'Có lỗi xảy ra.';
  if (typeof data === 'string') return data;
  if (typeof data === 'object' && data.message) return String(data.message);
  return 'Có lỗi xảy ra.';
}

function ProfileInner({ isAdmin }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.get('auth/me');
      setProfile(data);
      setFullName(data.fullName || '');
      setPhoneNumber(data.phoneNumber || '');
      setJobTitle(data.jobTitle || '');
      mergeProfileToStorage(data);
    } catch (e) {
      setError(parseApiError(e.response?.data));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setSaving(true);
    try {
      const { data } = await api.put('auth/me', {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || null,
        jobTitle: jobTitle.trim() || null,
      });
      setProfile(data);
      mergeProfileToStorage(data);
      setSuccess('Đã lưu thông tin hồ sơ.');
    } catch (err) {
      setError(parseApiError(err.response?.data));
    } finally {
      setSaving(false);
    }
  };

  const readOnlyCardClass = isAdmin
    ? 'border rounded-3 p-4 mb-4 bg-white'
    : 'card border-0 shadow-sm mb-4';
  const formCardClass = isAdmin
    ? 'border rounded-3 p-4 bg-white'
    : 'card border-0 shadow-sm';
  const userFormHeaderClass = 'card-header bg-white fw-bold border-bottom py-3';
  const labelMuted = 'text-muted small mb-1';

  const readOnlyBlock = (
    <div className={readOnlyCardClass} style={isAdmin ? { borderColor: '#dee2e6' } : undefined}>
      {isAdmin ? (
        <h5 className="fw-bold mb-3" style={{ color: '#1a5276' }}>Thông tin tài khoản</h5>
      ) : (
        <h5 className="fw-bold mb-3 text-primary">Thông tin tài khoản</h5>
      )}
      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải…</span>
          </div>
        </div>
      ) : profile ? (
        <div className="row g-4">
          <div className="col-md-6">
            <div className={labelMuted}>Tên đăng nhập</div>
            <div className="fw-medium text-break">{profile.userName || '—'}</div>
          </div>
          <div className="col-md-6">
            <div className={labelMuted}>Email</div>
            <div className="fw-medium text-break">{profile.email || '—'}</div>
          </div>
          <div className="col-md-6">
            <div className={labelMuted}>Vai trò</div>
            <div className="fw-medium">{profile.roles?.length ? profile.roles.join(', ') : '—'}</div>
          </div>
          <div className="col-md-6">
            <div className={labelMuted}>Công ty</div>
            <div className="fw-medium text-break">{profile.companyName || '—'}</div>
          </div>
          <div className="col-md-6">
            <div className={labelMuted}>Subdomain</div>
            <div className="fw-medium text-break">{profile.subDomain || '—'}</div>
          </div>
        </div>
      ) : (
        <div className="alert alert-danger mb-0 py-2 small">{error || 'Không tải được dữ liệu.'}</div>
      )}
    </div>
  );

  const editForm = (
    <div className={formCardClass}>
      {isAdmin ? (
        <h5 className="fw-bold mb-3" style={{ color: '#1a5276' }}>Cập nhật hồ sơ</h5>
      ) : (
        <div className={userFormHeaderClass}>Chỉnh sửa thông tin</div>
      )}
      <div className={isAdmin ? '' : 'card-body'}>
        {success && <div className="alert alert-success py-2 small mb-3">{success}</div>}
        {error && !loading && profile && <div className="alert alert-danger py-2 small mb-3">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Họ và tên *</label>
            <input
              type="text"
              className="form-control"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              maxLength={100}
              disabled={loading || !profile}
            />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Số điện thoại</label>
            <input
              type="tel"
              className="form-control"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              maxLength={50}
              disabled={loading || !profile}
              placeholder="Nhập số điện thoại"
            />
          </div>
          <div className="mb-4">
            <label className="form-label small fw-semibold">Chức danh</label>
            <input
              type="text"
              className="form-control"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              maxLength={100}
              disabled={loading || !profile}
              placeholder="Ví dụ: Giảng viên, Nhân viên HR…"
            />
          </div>
          <button type="submit" className="btn btn-primary px-4" disabled={saving || loading || !profile}>
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="mx-auto" style={{ maxWidth: 720 }}>
      <h4 className={`fw-bold mb-4 ${isAdmin ? '' : 'text-dark'}`} style={isAdmin ? { color: '#1a5276' } : undefined}>
        Hồ sơ cá nhân
      </h4>
      {readOnlyBlock}
      {!loading && profile ? editForm : null}
    </div>
  );
}

export default function MyProfile() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  const Layout = isAdmin ? AdminLayout : UserLayout;

  return (
    <Layout>
      <ProfileInner isAdmin={isAdmin} />
    </Layout>
  );
}
