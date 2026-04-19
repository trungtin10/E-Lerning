import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import UserLayout from '../../components/layout/UserLayout';
import api, { getUploadUrl } from '../../api/axios';
import { Camera, Loader2, Mail, Phone, Shield, Building2 } from 'lucide-react';

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

function ProfileInner() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [uploadingCompanyLogo, setUploadingCompanyLogo] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.get('auth/me');
      setProfile(data);
      setFullName(data.fullName || '');
      setEmail(data.email || '');
      setPhoneNumber(data.phoneNumber || '');
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

  const canEditCompanyLogo =
    Boolean(profile?.roles?.includes('Admin') && profile?.companyId != null && profile.companyId > 0);

  const handleCompanyLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingCompanyLogo(true);
    setError('');
    try {
      const { data } = await api.post('admin/company-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile((prev) => (prev ? { ...prev, companyLogoUrl: data.url } : prev));
      setSuccess('Đã cập nhật logo công ty thành công!');
      setTimeout(() => setSuccess(''), 3000);

      const u = JSON.parse(localStorage.getItem('user') || '{}');
      u.companyLogoUrl = data.url;
      localStorage.setItem('user', JSON.stringify(u));
      window.dispatchEvent(new Event('elearning-user-updated'));
    } catch (err) {
      setError(parseApiError(err.response?.data) || 'Lỗi khi tải lên logo.');
    } finally {
      setUploadingCompanyLogo(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setSaving(true);
    try {
      const { data } = await api.put('auth/me', {
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || null,
      });
      setProfile(data);
      mergeProfileToStorage(data);
      setSuccess('Đã lưu thông tin hồ sơ thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(parseApiError(err.response?.data));
    } finally {
      setSaving(false);
    }
  };

  const labelMuted = 'text-muted small mb-1 fw-semibold text-uppercase';

  const companyLogoSrc = profile?.companyLogoUrl
    ? getUploadUrl(profile.companyLogoUrl)
    : '/h_logo.png';

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5 mt-5">
        <Loader2 className="animate-spin text-primary mb-3" size={48} />
        <div className="text-muted fw-medium fs-5">Đang tải thông tin hồ sơ...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto pb-5" style={{ maxWidth: 900 }}>
      <div className="row g-4">
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <div className="d-flex flex-column align-items-center align-items-lg-start mb-3">
              <div className="position-relative">
                <div
                  className="rounded-4 border shadow-sm d-flex align-items-center justify-content-center bg-white overflow-hidden"
                  style={{ width: 120, height: 120 }}
                >
                  <img
                    src={companyLogoSrc}
                    alt=""
                    className="w-100 h-100 object-fit-contain p-2"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/h_logo.png';
                    }}
                  />
                </div>
                {canEditCompanyLogo ? (
                  <label
                    className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2 shadow-sm border border-2 border-white"
                    style={{ cursor: 'pointer', transform: 'translate(4px, 4px)' }}
                    title="Đổi logo công ty"
                  >
                    <input
                      type="file"
                      className="d-none"
                      accept="image/*"
                      onChange={handleCompanyLogoUpload}
                      disabled={uploadingCompanyLogo}
                    />
                    {uploadingCompanyLogo ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  </label>
                ) : null}
              </div>
            </div>
            <h5 className="fw-bold mb-1">{fullName || profile?.userName}</h5>
            <div className="d-flex flex-wrap gap-2 mb-4">
              {profile?.roles?.map((r) => (
                <span key={r} className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1 fw-bold" style={{ fontSize: '0.7rem' }}>
                  {r.toUpperCase()}
                </span>
              ))}
            </div>
            
            <hr className="opacity-10 mb-4" />
            
            <div className="space-y-3">
              <div className="mb-2">
                <div className={labelMuted}><Shield size={12} className="me-1" /> Tên đăng nhập</div>
                <div className="fw-medium text-dark">{profile?.userName}</div>
              </div>
              <div className="mb-2">
                <div className={labelMuted}><Building2 size={12} className="me-1" /> Đơn vị quản lý</div>
                <div className="fw-medium text-dark">{profile?.companyName || 'Hệ thống tổng'}</div>
              </div>
              <div className="mb-2">
                <div className={labelMuted}><Mail size={12} className="me-1" /> Gmail liên hệ</div>
                <div className="fw-medium text-dark text-break">{profile?.email || 'Chưa cập nhật'}</div>
              </div>
              <div className="mb-0">
                <div className={labelMuted}><Phone size={12} className="me-1" /> Điện thoại</div>
                <div className="fw-medium text-dark">{profile?.phoneNumber || 'Chưa cập nhật'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
            <h5 className="fw-bold mb-4">Chỉnh sửa thông tin chi tiết</h5>
            
            {success && <div className="alert alert-success border-0 shadow-sm rounded-3 py-3 small mb-4 animation-fade-in">{success}</div>}
            {error && <div className="alert alert-danger border-0 shadow-sm rounded-3 py-3 small mb-4 animation-fade-in">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6 mb-3">
                  <label className="form-label small fw-bold text-secondary">HỌ VÀ TÊN</label>
                  <input
                    type="text"
                    className="form-control form-control-lg rounded-3 fs-6"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label small fw-bold text-secondary">EMAIL (GMAIL)</label>
                  <input
                    type="email"
                    className="form-control form-control-lg rounded-3 fs-6"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Nhập email"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-bold text-secondary">SỐ ĐIỆN THOẠI</label>
                <input
                  type="tel"
                  className="form-control form-control-lg rounded-3 fs-6"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="d-flex align-items-center gap-3 pt-2">
                <button type="submit" className="btn btn-primary btn-lg rounded-3 px-5 fs-6 shadow-sm" disabled={saving}>
                  {saving ? (
                    <><Loader2 className="animate-spin me-2" size={18} /> Đang lưu...</>
                  ) : 'Lưu hồ sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyProfile() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  const Layout = isAdmin ? AdminLayout : UserLayout;

  return (
    <Layout>
      <ProfileInner />
    </Layout>
  );
}
