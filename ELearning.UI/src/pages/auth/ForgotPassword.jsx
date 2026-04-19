import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');

    if (!email?.trim()) {
      setEmailError('Nhập email của bạn');
      return;
    }

    setLoading(true);
    try {
      await api.post('auth/forgot-password', { email: email.trim() });
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message ?? err.response?.data ?? 'Gửi thất bại. Vui lòng thử lại.';
      setError(typeof msg === 'string' ? msg : 'Gửi thất bại. Vui lòng thử lại.');
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
      <div className="card border-0 shadow-lg rounded-4" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="card-body p-5">
          {/* Header: Back + Đăng nhập */}
          <Link
            to="/login"
            className="d-inline-flex align-items-center gap-2 text-decoration-none mb-4 text-secondary small fw-medium"
          >
            <ArrowLeft size={18} />
            Quay lại đăng nhập
          </Link>

          <h4 className="mb-2 text-dark fw-bold">Đặt lại mật khẩu</h4>
          <p className="mb-4 text-muted small" style={{ lineHeight: 1.6 }}>
            Vui lòng nhập địa chỉ email của bạn dưới đây và chúng tôi sẽ gửi cho bạn một email có hướng dẫn về cách đặt lại mật khẩu của bạn.
          </p>

          {success ? (
            <div className="alert alert-success py-3 small">
              Đã gửi email hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="alert alert-danger py-2 mb-3 small">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="form-label mb-2 fw-semibold text-secondary small">Email</label>
                <div className="input-group" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                  <span className="input-group-text bg-white border-0">
                    <Mail size={18} className="text-muted" />
                  </span>
                  <input
                    type="email"
                    className={`form-control border-0 py-2 px-3 ${emailError ? 'is-invalid' : ''}`}
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); setError(''); }}
                    style={{ fontSize: '0.95rem' }}
                  />
                </div>
                {emailError && (
                  <div className="text-danger small mt-1">{emailError}</div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-100 py-2 fw-semibold rounded-3 d-flex align-items-center justify-content-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Gửi mã xác nhận'}
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-top text-center">
            <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>
              Nếu gặp khó khăn, vui lòng liên hệ bộ phận hỗ trợ tại{' '}
              <a href="mailto:support@elearning.com" className="text-primary text-decoration-none fw-medium">
                support@elearning.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
