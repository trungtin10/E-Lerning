import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { useNotify } from '../../../context/NotifyContext';
import api from '../../../api/axios';

const CheckoutReturn = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useNotify();
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const isSuccess = searchParams.get('success') === 'true';
        const err = searchParams.get('error') || '';
        setSuccess(isSuccess);
        setError(err);
        setLoading(false);

        if (isSuccess) {
            toast('Giao dịch hoàn tất! Hệ thống đang cập nhật gói dịch vụ.', 'success');
            // Refresh subscription info so the company sees new plan immediately
            api.get('/admin/subscription-info').catch(() => {});
            setTimeout(() => navigate('/admin/subscription?refresh=true', { replace: true }), 900);
        } else if (err) {
            if (err === 'Code24' || err === 'Code1006' || err === 'Code49') {
                toast('Bạn đã hủy giao dịch thanh toán.', 'info');
            } else {
                toast(`Thanh toán không thành công. Mã lỗi: ${err}`, 'error');
            }
        }
    }, [searchParams, toast, navigate]);

    const isCanceled = error === 'Code24' || error === 'Code1006' || error === 'Code49';

    return (
        <AdminLayout>
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="card border-0 shadow-lg rounded-4 p-5 text-center" style={{ maxWidth: 500, width: '100%' }}>
                    {loading ? (
                        <div className="py-4"><Loader2 className="animate-spin text-primary" size={48} /></div>
                    ) : success ? (
                        <>
                            <div className="mb-4 text-success"><CheckCircle size={80} /></div>
                            <h2 className="fw-bold mb-3">Thanh toán thành công!</h2>
                            <p className="text-muted mb-4">Mã đơn hàng: #{searchParams.get('orderId')}. Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của chúng tôi. Hệ thống sẽ áp dụng gói mới ngay lập tức.</p>
                            <button 
                                className="btn btn-primary rounded-pill w-100 py-2 d-flex align-items-center justify-content-center"
                                onClick={() => navigate('/admin/dashboard')}
                            >Về Trang Chủ <ArrowRight size={18} className="ms-2" /></button>
                        </>
                    ) : isCanceled ? (
                        <>
                            <div className="mb-4 text-warning"><XCircle size={80} /></div>
                            <h2 className="fw-bold mb-3">Hủy thanh toán</h2>
                            <p className="text-muted mb-4">Bạn đã chủ động hủy giao dịch này. Gói dịch vụ của bạn chưa được thay đổi.</p>
                            <button 
                                className="btn btn-primary rounded-pill w-100 py-2"
                                onClick={() => navigate('/admin/subscription')}
                            >Quay lại trang nâng cấp</button>
                        </>
                    ) : (
                        <>
                            <div className="mb-4 text-danger"><XCircle size={80} /></div>
                            <h2 className="fw-bold mb-3">Thanh toán thất bại</h2>
                            <p className="text-muted mb-4">Đã xảy ra lỗi trong quá trình xử lý giao dịch. Vui lòng thử lại hoặc liên hệ bộ phận hỗ trợ.<br/><span className="badge bg-light text-danger mt-2">Lỗi: {error || 'Hủy bỏ'}</span></p>
                            <button 
                                className="btn btn-outline-danger rounded-pill w-100 py-2"
                                onClick={() => navigate('/admin/subscription')}
                            >Thử lại</button>
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default CheckoutReturn;
