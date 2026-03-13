import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import { LogIn, Lock, User, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ account: '', password: '' });
  const [showPassword, setShowPassword] = useState(false); // State quản lý ẩn hiện mật khẩu
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      const { token, fullName, account, roles, companyId, subDomain } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ fullName, account, roles, companyId, subDomain }));

      redirectUser(roles);
    } catch (err) {
      setError(err.response?.data || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card border-0 shadow-lg rounded-4 overflow-hidden d-flex flex-row"
        style={{ maxWidth: '900px', width: '100%', minHeight: '550px' }}
      >
        {/* Left Side: Brand */}
        <div className="col-md-5 bg-primary d-none d-md-flex flex-column align-items-center justify-content-center text-white p-5">
          <ShieldCheck size={80} className="mb-4 opacity-75" />
          <h2 className="fw-bold mb-3">E-Learning</h2>
          <p className="text-center opacity-75">Hệ thống quản trị đào tạo doanh nghiệp thông minh và bảo mật.</p>
        </div>

        {/* Right Side: Form */}
        <div className="col-md-7 bg-white p-5 d-flex flex-column justify-content-center">
          <div className="mb-4">
            <h3 className="fw-bold text-dark">Chào mừng trở lại!</h3>
            <p className="text-muted small">Vui lòng đăng nhập để tiếp tục quản trị hệ thống.</p>
          </div>

          {error && <div className="alert alert-danger border-0 small py-2">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label small fw-bold">Tài khoản</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><User size={18} className="text-muted" /></span>
                <input
                  type="text"
                  required
                  className="form-control bg-light border-start-0"
                  value={formData.account}
                  onChange={e => setFormData({...formData, account: e.target.value})}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-bold">Mật khẩu</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><Lock size={18} className="text-muted" /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="form-control bg-light border-start-0 border-end-0"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
                <span
                  className="input-group-text bg-light border-start-0 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={18} className="text-muted" /> : <Eye size={18} className="text-muted" />}
                </span>
              </div>
            </div>

            <button className="btn btn-primary w-100 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><LogIn size={20} /> Đăng nhập</>}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-muted small">© 2024 E-Learning System. All rights reserved.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
