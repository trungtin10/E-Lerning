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
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
    const user = JSON.parse(userStr || '{}');
    if (token && user && user.roles) {
      redirectUser(user.roles);
    }
  }, []);

  const redirectUser = (roles) => {
    if (roles.includes('SuperAdmin') || roles.includes('Admin') || roles.includes('Editor')) navigate('/admin/dashboard');
    else navigate('/dashboard');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const loginData = {
      account: formData.account.trim(),
      password: formData.password.trim()
    };

    try {
      const response = await api.post('auth/login', loginData);
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
      sessionStorage.setItem('token', token);
      const userData = JSON.stringify({
        fullName,
        account,
        roles,
        companyId,
        subDomain,
        companyLogoUrl,
        email,
        phoneNumber,
        companyName,
      });
      localStorage.setItem('user', userData);
      sessionStorage.setItem('user', userData);

      if (companyLogoUrl) {
        setFavicon(getUploadUrl(companyLogoUrl));
      }

      redirectUser(roles);
    } catch (err) {
      const data = err.response?.data;
      const errType = typeof data === 'object' && data?.error;
      const errMsg = typeof data === 'object' && data?.message ? data.message : (typeof data === 'string' ? data : 'Đăng nhập thất bại. Vui lòng thử lại.');

      if (errType === 'invalid_credentials') {
        setErrorAccount(true);
        setErrorPassword(true);
        setError(errMsg);
      } else if (errType === 'invalid_password') {
        setErrorPassword(true);
        setError(errMsg);
      } else {
        setError(errMsg);
        setErrorAccount(true);
        setErrorPassword(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-4 bg-light"
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #4a90c7 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}
    >
      <div
        className="card border-0 shadow-lg rounded-4 login-card"
        style={{ maxWidth: '420px', width: '100%' }}
      >
        <div className="card-body p-4 p-md-5">
          {/* Logo & Branding */}
          <div className="text-center mb-4">
            <div className="d-flex align-items-center justify-content-center mb-3">
              <div className="d-flex align-items-center justify-content-center rounded-2 overflow-hidden bg-white border" style={{ width: 56, height: 56, padding: 8, borderColor: '#e2e8f0' }}>
                <img src="/h_logo.png" alt="Logo" className="w-100 h-100 object-fit-contain" />
              </div>
            </div>
            <h2 className="mb-1 text-dark fw-bold" style={{ fontSize: '1.85rem' }}>E-Learning</h2>
            <p className="mb-0 text-muted small">Hệ thống đào tạo trực tuyến</p>
          </div>

          <p className="mb-4 text-center text-muted small">Chào mừng trở lại, đăng nhập để tiếp tục truy cập</p>

          {error && <div className="alert alert-danger py-2 mb-3 small fw-medium">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label mb-2 fw-semibold text-secondary small">Tài khoản *</label>
              <input
                type="text"
                required
                className={`form-control border py-2 px-3 ${errorAccount ? 'is-invalid' : ''}`}
                placeholder="Nhập tài khoản hoặc email"
                value={formData.account}
                onChange={e => { setFormData({ ...formData, account: e.target.value }); setErrorAccount(false); setError(''); }}
                style={{ borderRadius: '10px' }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-2 fw-semibold text-secondary small">Mật khẩu *</label>
              <div className="input-group" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`form-control border border-end-0 py-2 px-3 ${errorPassword ? 'is-invalid' : ''}`}
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={e => { setFormData({ ...formData, password: e.target.value }); setErrorPassword(false); setError(''); }}
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
                <Link to="/forgot-password" size="sm" className="text-primary text-decoration-none small fw-medium">
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold rounded-3 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={22} /> : <><LogIn size={20} /> Đăng nhập</>}
            </button>
          </form>

          <div className="mt-4 pt-3 border-top text-center text-muted" style={{ fontSize: '0.8rem' }}>
            <p className="mb-1">Version 1.0</p>
            <p className="mb-0">© {new Date().getFullYear()} E-Learning. Bản quyền thuộc về dự án.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
