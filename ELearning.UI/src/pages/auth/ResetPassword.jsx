import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!userId || !token) {
      setError('Link không hợp lệ. Vui lòng yêu cầu gửi lại email.');
      return;
    }

    setLoading(true);
    try {
      await api.post('auth/reset-password', {
        userId,
        token,
        newPassword: password
      });
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message ?? err.response?.data ?? 'Đặt lại mật khẩu thất bại.';
      setError(typeof msg === 'string' ? msg : 'Đặt lại mật khẩu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  if (!userId || !token) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center p-4" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #4a90c7 100%)' }}>
        <div className="card border-0 shadow-lg rounded-4 p-5" style={{ maxWidth: '420px' }}>
          <div className="alert alert-danger">Link không hợp lệ hoặc đã hết hạn. Vui lòng <Link to="/forgot-password">yêu cầu gửi lại</Link>.</div>
          <Link to="/login" className="btn btn-primary w-100">Quay lại đăng nhập</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #4a90c7 100%)', fontFamily: "'Inter', sans-serif" }}>
      <div className="card border-0 shadow-lg rounded-4" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="card-body p-5">
          <Link to="/login" className="d-inline-flex align-items-center gap-2 text-decoration-none mb-4" style={{ color: '#475569', fontSize: '0.9rem' }}>
            <ArrowLeft size={18} /> Đăng nhập
          </Link>

          <h4 className="mb-2" style={{ color: '#1e293b', fontSize: '1.35rem', fontWeight: 700 }}>Đặt mật khẩu mới</h4>
          <p className="mb-4" style={{ color: '#64748b', fontSize: '0.9rem' }}>Nhập mật khẩu mới cho tài khoản của bạn.</p>

          {success ? (
            <div className="alert alert-success">
              Đặt lại mật khẩu thành công! <Link to="/login">Đăng nhập ngay</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

              <div className="mb-3">
                <label className="form-label">Mật khẩu mới *</label>
                <div className="input-group" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                  <span className="input-group-text bg-white border-end-0"><Lock size={18} className="text-muted" /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control border-0 py-2 px-3"
                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  <span className="input-group-text bg-white border-0" onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label">Xác nhận mật khẩu *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control py-2 px-3"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ borderRadius: '10px' }}
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-danger w-100 py-2 fw-semibold rounded-3 d-flex align-items-center justify-content-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Đặt lại mật khẩu'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
