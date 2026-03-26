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
      className="min-vh-100 d-flex align-items-center justify-content-center p-4"
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
            className="d-inline-flex align-items-center gap-2 text-decoration-none mb-4"
            style={{ color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}
          >
            <ArrowLeft size={18} />
            Đăng nhập
          </Link>

          <h4 className="mb-2" style={{ color: '#1e293b', fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Đặt lại mật khẩu
          </h4>
          <p className="mb-4" style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Vui lòng nhập địa chỉ email của bạn dưới đây và chúng tôi sẽ gửi cho bạn một email có hướng dẫn về cách đặt lại mật khẩu của bạn.
          </p>

          {success ? (
            <div className="alert alert-success py-3" style={{ fontSize: '0.9rem' }}>
              Đã gửi email hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="form-label mb-2" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                  Email
                </label>
                <div className="input-group" style={{ borderRadius: '10px', overflow: 'hidden', border: emailError ? '1px solid #dc3545' : '1px solid #dee2e6' }}>
                  <span className="input-group-text bg-white border-0">
                    <Mail size={18} className="text-muted" />
                  </span>
                  <input
                    type="email"
                    className="form-control border-0 py-2 px-3"
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
                className="btn btn-danger w-100 py-2 fw-semibold rounded-3 d-flex align-items-center justify-content-center gap-2"
                style={{ fontSize: '1rem' }}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Gửi'}
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-top text-center" style={{ borderColor: '#f1f5f9' }}>
            <p className="mb-0" style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.5 }}>
              Để được trợ giúp, hãy liên hệ với bộ phận hỗ trợ của E-Learning tại{' '}
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
