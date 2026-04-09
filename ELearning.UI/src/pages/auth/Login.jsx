import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { getUploadUrl } from '../../api/axios';
import { LogIn, Loader2, Eye, EyeOff } from 'lucide-react';

const setFavicon = (url) => {
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    document.head.appendChild(link);
  }
  link.href = url || '/h_logo.png';
};

const Login = () => {
  const [formData, setFormData] = useState({ account: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorAccount, setErrorAccount] = useState(false);
  const [errorPassword, setErrorPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (token && user && user.roles) {
      redirectUser(user.roles);
    }
  }, []);

  const redirectUser = (roles) => {
    if (roles.includes('SuperAdmin') || roles.includes('Admin')) navigate('/admin/dashboard');
    else navigate('/dashboard');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('auth/login', formData);
      const {
        token,
        fullName,
        account,
        roles,
        companyId,
        subDomain,
        companyLogoUrl,
        email,
        phoneNumber,
        companyName,
      } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem(
        'user',
        JSON.stringify({
          fullName,
          account,
          roles,
          companyId,
          subDomain,
          companyLogoUrl,
          email,
          phoneNumber,
          companyName,
        })
      );

      if (companyLogoUrl) {
        setFavicon(getUploadUrl(companyLogoUrl));
      }

      redirectUser(roles);
    } catch (err) {
      const data = err.response?.data;
      const errType = typeof data === 'object' && data?.error;
      const errMsg = typeof data === 'object' && data?.message ? data.message : (typeof data === 'string' ? data : 'Đăng nhập thất bại. Vui lòng thử lại.');

      if (errType === 'invalid_credentials') {
        setFormData(prev => ({ ...prev, password: '' }));
        setErrorAccount(true);
        setErrorPassword(false);
        setError(errMsg);
      } else if (errType === 'invalid_password') {
        setFormData(prev => ({ ...prev, password: '' }));
        setErrorAccount(false);
        setErrorPassword(true);
        setError(errMsg);
      } else {
        setError(errMsg);
        setErrorAccount(false);
        setErrorPassword(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-4"
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #4a90c7 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}
    >
      <div
        className="card border-0 shadow-lg rounded-4 login-card"
        style={{ maxWidth: '420px', width: '100%' }}
      >
        <div className="card-body p-5">
          {/* Logo & Branding */}
          <div className="text-center mb-4">
            <div className="d-flex align-items-center justify-content-center mb-3">
              <div className="d-flex align-items-center justify-content-center rounded-2 overflow-hidden bg-white border" style={{ width: 56, height: 56, padding: 8, borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <img src="/h_logo.png" alt="Logo" className="w-100 h-100 object-fit-contain" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            </div>
            <h2 className="mb-1 login-brand" style={{ color: '#0f172a', fontSize: '1.85rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2 }}>E-Learning</h2>
            <p className="mb-0" style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.01em' }}>Hệ thống đào tạo trực tuyến</p>
          </div>

          <p className="mb-4 text-center" style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 400 }}>Chào mừng trở lại, đăng nhập để tiếp tục truy{'\u00A0'}cập</p>

          {error && <div className="alert alert-danger py-2 mb-3 login-error" style={{ fontSize: '0.875rem', fontWeight: 500 }}>{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label mb-2" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', letterSpacing: '0.01em' }}>Tài khoản *</label>
              <input
                type="text"
                required
                className={`form-control border py-2 px-3 login-input ${errorAccount ? 'border-danger' : ''}`}
                placeholder="Nhập tài khoản hoặc email"
                value={formData.account}
                onChange={e => { setFormData({ ...formData, account: e.target.value }); setErrorAccount(false); setError(''); }}
                style={{ fontSize: '0.95rem', borderRadius: '10px', borderColor: errorAccount ? '#dc3545' : undefined }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-2" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', letterSpacing: '0.01em' }}>Mật khẩu *</label>
              <div className="input-group" style={{ borderRadius: '10px', overflow: 'hidden', border: errorPassword ? '1px solid #dc3545' : undefined }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`form-control border border-end-0 py-2 px-3 login-input ${errorPassword ? 'border-danger' : ''}`}
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={e => { setFormData({ ...formData, password: e.target.value }); setErrorPassword(false); setError(''); }}
                  style={{ fontSize: '0.95rem', borderColor: errorPassword ? '#dc3545' : undefined }}
                />
                <span
                  className="input-group-text bg-white border"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: 'pointer', borderLeft: 'none' }}
                >
                  {showPassword ? <EyeOff size={20} className="text-muted" /> : <Eye size={20} className="text-muted" />}
                </span>
              </div>
              <div className="mt-2 text-end">
                <Link to="/forgot-password" className="text-primary text-decoration-none" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            <button
              className="btn btn-primary w-100 py-2 fw-semibold rounded-3 d-flex align-items-center justify-content-center gap-2 login-btn"
              disabled={loading}
              style={{ fontSize: '1rem', letterSpacing: '0.02em' }}
            >
              {loading ? <Loader2 className="animate-spin" size={22} /> : <><LogIn size={20} /> Đăng nhập</>}
            </button>
          </form>

          <div className="mt-4 pt-3 border-top text-center" style={{ borderColor: '#f1f5f9' }}>
            <p className="mb-1" style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500 }}>Version 1.0</p>
            <p className="mb-0" style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 400 }}>© {new Date().getFullYear()} E-Learning. Bản quyền thuộc về dự án.</p>
          </div>
        </div>
      </div>

      <style>{`
        .login-card { font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif; }
        .login-brand { font-family: 'Plus Jakarta Sans', sans-serif; }
        .login-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
        .login-input::placeholder { color: #94a3b8; font-weight: 400; }
        .login-btn { transition: all 0.2s ease; }
        .login-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,0.35); }
        .login-error { font-family: inherit; }
      `}</style>
    </div>
  );
};

export default Login;
