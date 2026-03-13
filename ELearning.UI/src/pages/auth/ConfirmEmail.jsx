import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, LogIn } from 'lucide-react';
import api from '../../api/axios';

const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const userId = searchParams.get('userId');
    const token = searchParams.get('token');

    if (userId && token) {
      activateAccount(userId, token);
    } else {
      setStatus('error');
      setMessage('Thông tin kích hoạt không hợp lệ.');
    }
  }, [searchParams]);

  const activateAccount = async (userId, token) => {
    try {
    const response = await api.get(`/superadmin/confirm-activation?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`);
      setStatus('success');
      setMessage(response.data);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data || 'Kích hoạt thất bại. Link kích hoạt đã hết hạn (sau 24 giờ) hoặc không hợp lệ.');
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-lg border-0 rounded-4 p-5 text-center" style={{ maxWidth: '500px' }}>
        {status === 'loading' && (
          <div className="py-4">
            <Loader2 className="animate-spin text-primary mb-3" size={48} />
            <h4 className="fw-bold">Đang xác thực tài khoản...</h4>
            <p className="text-muted">Vui lòng đợi trong giây lát.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4">
            <CheckCircle2 className="text-success mb-3" size={64} />
            <h3 className="fw-bold text-success">Thành công!</h3>
            <p className="text-muted mb-4">{message}</p>
            <button className="btn btn-primary px-5 py-2 fw-bold rounded-3 d-flex align-items-center gap-2 mx-auto" onClick={() => navigate('/login')}>
              <LogIn size={20} /> Đăng nhập ngay
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4">
            <XCircle className="text-danger mb-3" size={64} />
            <h3 className="fw-bold text-danger">Lỗi kích hoạt</h3>
            <p className="text-muted mb-4">{message}</p>
            <button className="btn btn-outline-secondary px-5 py-2 fw-bold rounded-3" onClick={() => navigate('/login')}>
              Quay lại trang chủ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmail;
