import React, { useMemo, useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { Check, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useNotify } from '../../../context/NotifyContext';

const Subscription = () => {
  const { showNotify } = useNotify();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [subInfo, setSubInfo] = useState(null);

  const now = useMemo(() => new Date(), []);
  const expiryDate = subInfo?.planExpiryDate ? new Date(subInfo.planExpiryDate) : null;
  const isExpired = !!(expiryDate && expiryDate.getTime() < now.getTime());
  const currentPlanName = (subInfo?.currentPlan || '').trim();
  const isFreePlan = !currentPlanName || /free/i.test(currentPlanName);

  useEffect(() => {
    fetchPlans();
    fetchSubInfo();
  }, []);

  const fetchSubInfo = async () => {
    try {
      const res = await api.get('/admin/subscription-info');
      setSubInfo(res.data);
    } catch (e) {
      console.error(e);
    }
  };

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
        billingCycle: 'Monthly',
        paymentMethod: 'VnPay'
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

  const formatMoney = (v) => (v ?? 0).toLocaleString('vi-VN');

  const displayPlans = useMemo(() => {
    const paid = (plans || [])
      .filter(p => p?.isActive)
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    // Luôn hiển thị Free card để giống UI mẫu
    const free = {
      id: 'free',
      name: 'Free',
      description: 'Xem AI có thể làm gì',
      priceMonthly: 0,
      priceYearly: 0,
      maxUsers: subInfo?.maxUsers ?? 0,
      storageLimitGB: 0,
      isSynthetic: true,
    };

    // Cố định 3 gói trả phí: Basic, Plus, Pro (giống UI mẫu)
    const pick = (pred) => paid.find(pred);
    const basic = pick(p => /basic|go/i.test(p?.name || ''));
    const plus = pick(p => /plus/i.test(p?.name || ''));
    const pro = pick(p => /pro|enterprise/i.test(p?.name || ''));
    const fixed = [basic, plus, pro].filter(Boolean);

    // Fallback: nếu DB chưa đặt tên đúng thì lấy 3 gói đầu theo sortOrder
    const paid3 = fixed.length === 3 ? fixed : paid.slice(0, 3);
    return [free, ...paid3];
  }, [plans, subInfo?.maxUsers]);

  const getCardStyle = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('plus')) return { tone: 'primary', featured: true, badge: 'PHỔ BIẾN' };
    if (n.includes('pro') || n.includes('enterprise')) return { tone: 'dark', featured: false, badge: null };
    if (n.includes('go') || n.includes('basic')) return { tone: 'light', featured: false, badge: null };
    if (n.includes('free')) return { tone: 'light', featured: false, badge: null };
    return { tone: 'light', featured: false, badge: null };
  };

  const displayPlanName = (raw) => {
    const n = (raw || '').toLowerCase();
    if (n.includes('free')) return 'Free';
    if (n.includes('plus')) return 'Plus';
    if (n.includes('pro') || n.includes('enterprise')) return 'Pro';
    if (n.includes('basic') || n.includes('go')) return 'Basic';
    return raw || '—';
  };

  const formatVnDate = (value) => {
    if (!value) return 'Không giới hạn';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'Không giới hạn';
    return d.toLocaleDateString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const buildFeatureList = (p) => {
    const name = (p?.name || '').toLowerCase();
    if (name.includes('free')) {
      return [
        'Nhận lời giải thích đơn giản',
        'Thực hiện các đoạn chat ngắn cho những câu hỏi thường gặp',
        'Thử tính năng tạo hình ảnh',
        'Tiết kiệm bộ nhớ và ngữ cảnh hạn chế',
      ];
    }
    if (name.includes('go') || name.includes('basic')) {
      return [
        'Tiếp tục trò chuyện với quyền truy cập mở rộng',
        'Trò chuyện lâu hơn và tải lên nhiều nội dung hơn',
        'Tạo thêm hình ảnh cho dự án',
        `Tối đa ${p.maxUsers} người dùng`,
        `Lưu trữ ${p.storageLimitGB} GB`,
      ];
    }
    if (name.includes('plus')) {
      return [
        'Trải nghiệm đầy đủ tính năng',
        'Giải quyết các vấn đề phức tạp',
        'Trò chuyện dài hơn và nhanh hơn',
        'Ghi nhớ mục tiêu và cuộc trò chuyện trước đây',
        `Tối đa ${p.maxUsers} người dùng`,
        `Lưu trữ ${p.storageLimitGB} GB`,
      ];
    }
    // Pro / Enterprise
    return [
      'Tối đa hóa năng suất',
      'Giải quyết dự án lớn với tính năng nâng cao',
      'Tạo hình ảnh chất lượng cao',
      'Bảo mật và kiểm soát tốt hơn',
      `Tối đa ${p.maxUsers} người dùng`,
      `Lưu trữ ${p.storageLimitGB} GB`,
    ];
  };

  const getButtonLabel = (p) => {
    const n = (p?.name || '').trim();
    if (!n) return 'Nâng cấp';
    if (/free/i.test(n)) return 'Gói hiện tại';
    return `Nâng cấp lên ${displayPlanName(n)}`;
  };

  return (
    <AdminLayout>
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h2 className="fw-bold mb-1">Gói dịch vụ hệ thống</h2>
          <p className="text-muted small">Quản lý và nâng cấp gói dịch vụ để mở rộng quy mô đào tạo</p>
        </div>
      </div>

      {subInfo && (
        <div className="card border-0 shadow-sm rounded-4 mb-5">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <Sparkles size={18} className="text-primary" /> Thông tin gói hiện tại
            </h5>
            <div className="row g-4 mb-4">
              <div className="col-md-4">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="small text-muted mb-1">Gói dịch vụ</div>
                  <div className="fw-bold fs-5 text-primary">{displayPlanName(subInfo.currentPlan || 'Free')}</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="small text-muted mb-1">Thời hạn</div>
                  <div className="fw-bold fs-5 text-dark">
                    {formatVnDate(subInfo.planExpiryDate)}
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="small text-muted mb-1">Số lượng nhân viên</div>
                  <div className="fw-bold fs-5 text-dark">
                    {subInfo.userCount} / {subInfo.maxUsers || '∞'}
                  </div>
                </div>
              </div>
            </div>

            {isExpired && isFreePlan && (
              <div className="alert alert-warning rounded-4 mb-0">
                <div className="fw-bold">Gói Free đã hết hạn.</div>
                <div className="small">Vui lòng chọn một gói trả phí bên dưới để tiếp tục sử dụng đầy đủ tính năng cho công ty.</div>
              </div>
            )}

            {/* Bỏ lịch sử giao dịch theo yêu cầu UI */}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5"><Loader2 className="animate-spin text-primary" size={40} /></div>
      ) : (
        <div className="row g-4 justify-content-center">
          {displayPlans.map((p) => {
            const style = getCardStyle(p.name);
            const isFree = /free/i.test(p.name);
            const isCurrent = currentPlanName && p.name && currentPlanName.toLowerCase() === p.name.toLowerCase();

            const price = p.priceMonthly || 0;
            const pricePerMonth = p.priceMonthly || 0;
            const canBuy = !isFree;

            // Nếu Free hết hạn, disable Free card; bắt buộc chọn gói trả phí
            const isDisabled = processing !== null || (isFree && isExpired && isFreePlan);

            const btnClass =
              style.tone === 'dark'
                ? 'btn-dark'
                : style.featured
                  ? 'btn-primary'
                  : 'btn-outline-primary';

            return (
              <div key={p.id} className="col-12 col-sm-6 col-lg-3">
                <div className={`card h-100 border-0 shadow-sm rounded-4 position-relative overflow-hidden ${style.featured ? 'border border-primary-subtle' : ''}`}>
                  {style.badge && (
                    <div className="position-absolute top-0 end-0 m-3">
                      <span className="badge rounded-pill text-bg-primary">{style.badge}</span>
                    </div>
                  )}

                  <div className="card-body p-4 d-flex flex-column">
                    <div className="mb-3">
                      <h4 className="fw-bold mb-1">{displayPlanName(p.name)}</h4>
                      <div className="text-muted small">{p.description || '—'}</div>
                    </div>

                    <div className="mb-3">
                      <div className="d-flex align-items-baseline gap-2">
                        <div className="display-6 fw-bold mb-0" style={{ letterSpacing: '-0.02em' }}>
                          {formatMoney(pricePerMonth)}
                        </div>
                        <div className="text-muted small">VND / tháng</div>
                      </div>
                      {isFree && <div className="text-muted small">Gói miễn phí</div>}
                    </div>

                    {isCurrent && (
                      <div className="mb-3">
                        <span className="badge rounded-pill text-bg-secondary">Gói hiện tại</span>
                      </div>
                    )}

                    <div className="flex-grow-1">
                      {buildFeatureList(p).map((txt) => (
                        <div key={txt} className="d-flex align-items-start gap-2 small mb-2">
                          <Check size={16} className="text-success mt-1 flex-shrink-0" />
                          <div>{txt}</div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className={`btn ${btnClass} w-100 rounded-3 fw-semibold mt-3 d-flex align-items-center justify-content-center gap-2`}
                      disabled={isDisabled || !canBuy}
                      onClick={() => canBuy && handleUpgrade(p.id)}
                      title={!canBuy ? 'Gói Free không cần mua' : undefined}
                    >
                      {processing === p.id ? <Loader2 className="animate-spin" size={18} /> : getButtonLabel(p)}
                      {processing !== p.id && canBuy && <ArrowRight size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </AdminLayout>
  );
};

export default Subscription;
