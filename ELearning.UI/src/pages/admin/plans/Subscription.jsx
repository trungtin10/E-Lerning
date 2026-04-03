import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { CreditCard, Check, Shield, Zap, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { useNotify } from '../../../context/NotifyContext';

const Subscription = () => {
  const { showNotify } = useNotify();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [cycle, setCycle] = useState('Monthly'); // 'Monthly' | 'Yearly'
  const [paymentMethod, setPaymentMethod] = useState('VnPay'); // VnPay | MoMo

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/plan');
      setPlans(res.data.filter(p => p.isActive));
    } catch (e) {
      showNotify('error', 'Không thể tải danh sách gói dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    setProcessing(planId);
    try {
      const res = await api.post('/checkout/create-payment', {
        planId,
        billingCycle: cycle,
        paymentMethod
      });
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      }
    } catch (e) {
      showNotify('error', e.response?.data || 'Lỗi khi khởi tạo thanh toán');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Gói dịch vụ hệ thống</h2>
        <p className="text-muted small">Nâng cấp gói dịch vụ để mở rộng quy mô đào tạo của doanh nghiệp</p>
      </div>

      <div className="d-flex justify-content-center mb-5">
        <div className="btn-group p-1 bg-light rounded-pill border shadow-sm">
          <button 
            className={`btn rounded-pill px-4 ${cycle === 'Monthly' ? 'btn-primary shadow-sm' : 'btn-light'}`}
            onClick={() => setCycle('Monthly')}
          >Hàng tháng</button>
          <button 
            className={`btn rounded-pill px-4 ${cycle === 'Yearly' ? 'btn-primary shadow-sm' : 'btn-light'}`}
            onClick={() => setCycle('Yearly')}
          >
            Hàng năm <span className="badge bg-warning ms-1 text-dark">-15%</span>
          </button>
        </div>
      </div>

      <div className="d-flex justify-content-center mb-5">
        <div className="btn-group p-1 bg-light rounded-pill border shadow-sm">
          <button
            className={`btn rounded-pill px-4 ${paymentMethod === 'VnPay' ? 'btn-primary shadow-sm' : 'btn-light'}`}
            onClick={() => setPaymentMethod('VnPay')}
          >VNPay</button>
          <button
            className={`btn rounded-pill px-4 ${paymentMethod === 'MoMo' ? 'btn-primary shadow-sm' : 'btn-light'}`}
            onClick={() => setPaymentMethod('MoMo')}
          >MoMo</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><Loader2 className="animate-spin text-primary" size={40} /></div>
      ) : (
        <div className="row g-4 justify-content-center">
          {plans.map((p, idx) => {
            const isPro = p.name.toLowerCase().includes('pro');
            const isEnterprise = p.name.toLowerCase().includes('enterprise');
            const price = cycle === 'Yearly' ? p.priceYearly : p.priceMonthly;
            const pricePerMonth = cycle === 'Yearly' ? Math.round(p.priceYearly / 12) : p.priceMonthly;

            return (
              <div key={p.id} className="col-md-4">
                <div className={`card h-100 border-0 shadow-sm rounded-4 position-relative overflow-hidden ${isPro ? 'border-primary border-2' : ''}`}
                     style={{ transition: 'transform 0.2s' }}>
                  {isPro && (
                    <div className="position-absolute translate-middle-x start-50 top-0 bg-primary text-white px-3 py-1 rounded-bottom shadow-sm" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                      PHỔ BIẾN NHẤT
                    </div>
                  )}
                  
                  <div className="card-body p-4 d-flex flex-column">
                    <div className="mb-4 text-center">
                      <div className={`mb-3 d-inline-flex p-3 rounded-4 ${isEnterprise ? 'bg-warning-subtle text-warning' : (isPro ? 'bg-primary-subtle text-primary' : 'bg-light text-secondary')}`}>
                        {isEnterprise ? <Crown size={32} /> : (isPro ? <Zap size={32} /> : <Shield size={32} />)}
                      </div>
                      <h4 className="fw-bold mb-1">{p.name}</h4>
                      <p className="text-muted small mb-0">{p.description || 'Giải pháp đào tạo tối ưu'}</p>
                    </div>

                    <div className="mb-4 text-center">
                       <span className="fs-3 fw-bold">{pricePerMonth.toLocaleString('vi-VN')} ₫</span>
                       <span className="text-muted">/tháng</span>
                       {cycle === 'Yearly' && (
                         <div className="text-muted small mt-1">({price.toLocaleString('vi-VN')} ₫ thanh toán hàng năm)</div>
                       )}
                    </div>

                    <div className="flex-grow-1 mb-4">
                        <div className="d-flex align-items-center mb-2 small text-dark">
                          <Check size={16} className="text-success me-2" />
                          Tối đa <strong>{p.maxUsers}</strong> người dùng
                        </div>
                        <div className="d-flex align-items-center mb-2 small text-dark">
                          <Check size={16} className="text-success me-2" />
                          Lưu trữ <strong>{p.storageLimitGB} GB</strong>
                        </div>
                        <div className="d-flex align-items-center mb-2 small text-dark">
                          <Check size={16} className="text-success me-2" />
                          Hỗ trợ kỹ thuật 24/7
                        </div>
                        <div className="d-flex align-items-center mb-2 small text-dark">
                          <Check size={16} className="text-success me-2" />
                          Báo cáo thống kê chi tiết
                        </div>
                    </div>

                    <button 
                      disabled={processing !== null}
                      onClick={() => handleUpgrade(p.id)}
                      className={`btn w-100 py-2 fw-bold rounded-pill d-flex align-items-center justify-content-center ${isPro ? 'btn-primary shadow' : 'btn-outline-primary'}`}
                    >
                      {processing === p.id ? <Loader2 className="animate-spin me-2" size={18} /> : (isEnterprise ? 'Liên hệ' : 'Nâng cấp ngay')}
                      {processing !== p.id && !isEnterprise && <ArrowRight size={18} className="ms-2" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 bg-light p-4 rounded-4 border border-dashed border-primary">
         <div className="row align-items-center">
            <div className="col-md-auto mb-3 mb-md-0">
               <div className="bg-white p-3 rounded-circle shadow-sm">
                  <CreditCard className="text-primary" size={32} />
               </div>
            </div>
            <div className="col">
               <h5 className="fw-bold mb-1">Cần hỗ trợ thanh toán?</h5>
               <p className="text-muted mb-0 small">Chúng tôi hỗ trợ chuyển khoản ngân hàng, ví Momo, VNPay và thẻ quốc tế (Visa/Master). Vui lòng liên hệ hotline: 1900 1234 để được xử lý nhanh nhất.</p>
            </div>
            <div className="col-md-auto mt-3 mt-md-0">
               <button className="btn btn-primary rounded-pill px-4">Gửi yêu cầu hỗ trợ</button>
            </div>
         </div>
      </div>
    </AdminLayout>
  );
};

export default Subscription;
