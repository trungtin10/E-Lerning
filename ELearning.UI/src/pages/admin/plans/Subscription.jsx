import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { Check, ArrowRight, Loader2, Sparkles, History, X, Video, Image as ImageIcon, FileText } from 'lucide-react';
import { useNotify } from '../../../context/NotifyContext';

const Subscription = () => {
  const { toast } = useNotify();
  const [searchParams] = useSearchParams();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [subInfo, setSubInfo] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const now = useMemo(() => new Date(), []);
  const expiryDate = subInfo?.planExpiryDate ? new Date(subInfo.planExpiryDate) : null;
  const isExpired = !!(expiryDate && expiryDate.getTime() < now.getTime());
  const currentPlanName = (subInfo?.currentPlan || '').trim();
  const isFreePlan = !currentPlanName || /free/i.test(currentPlanName);

  useEffect(() => {
    fetchPlans();
    fetchSubInfo();
  }, []);

  // Auto-refresh subscription info when user returns to this tab/page
  useEffect(() => {
    const handleFocus = () => {
      fetchSubInfo();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Refresh when returning from payment (refresh=true query param)
  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      fetchSubInfo();
    }
  }, [searchParams]);

  // Refresh subscription info when closing transaction modal
  useEffect(() => {
    if (!showTransactionModal) {
      // Slight delay to debounce refresh calls
      const timer = setTimeout(() => {
        fetchSubInfo();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showTransactionModal]);

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
      toast('Không thể tải danh sách gói dịch vụ', 'error');
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
      toast(e.response?.data || 'Lỗi khi khởi tạo thanh toán', 'error');
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
  }, [plans, subInfo?.maxUsers, currentPlanName]);

  const getCardStyle = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('plus')) return { tone: 'primary', featured: true, badge: 'PHỔ BIẾN' };
    if (n.includes('pro') || n.includes('enterprise')) return { tone: 'dark', featured: false, badge: null };
    if (n.includes('go') || n.includes('basic')) return { tone: 'light', featured: false, badge: null };
    if (n.includes('free')) return { tone: 'light', featured: false, badge: null };
    return { tone: 'light', featured: false, badge: null };
  };

  const normalizePlanName = (raw) => {
    const n = (raw || '').toLowerCase();
    if (n.includes('free')) return 'free';
    if (n.includes('plus')) return 'plus';
    if (n.includes('pro') || n.includes('enterprise')) return 'pro';
    if (n.includes('basic') || n.includes('go')) return 'basic';
    return n.trim();
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

  const getButtonLabel = (p, isCurrentPlan) => {
    if (isCurrentPlan) return 'Gói hiện tại';
    const n = (p?.name || '').trim();
    if (!n) return 'Nâng cấp';
    if (/free/i.test(n)) return 'Gói miễn phí';
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
                  <div className="fw-bold fs-5 text-primary d-flex align-items-center gap-2">
                    {displayPlanName(subInfo.currentPlan || 'Free')}
                  </div>
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
              <div className="col-md-3">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="small text-muted mb-1">Số lượng nhân viên</div>
                  <div className="fw-bold fs-5 text-dark">
                    {subInfo.userCount} / {subInfo.maxUsers || '∞'}
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="small text-muted mb-1">Dung lượng lưu trữ</div>
                  <div className="fw-bold fs-5 text-dark mb-2">
                    {(subInfo.storageUsedBytes / 1024 / 1024).toFixed(1)} MB / {subInfo.storageLimitGB || 0} GB
                  </div>
                  <div className="d-flex flex-column gap-1 mb-2">
                    <div className="d-flex align-items-center justify-content-between extra-small text-muted">
                       <span className="d-flex align-items-center gap-1"><Video size={12} /> Video:</span>
                       <span className="fw-medium">{(subInfo.videoStorageBytes / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between extra-small text-muted">
                       <span className="d-flex align-items-center gap-1"><ImageIcon size={12} /> Hình ảnh:</span>
                       <span className="fw-medium">{(subInfo.imageStorageBytes / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between extra-small text-muted">
                       <span className="d-flex align-items-center gap-1"><FileText size={12} /> Tài liệu:</span>
                       <span className="fw-medium">{(subInfo.documentStorageBytes / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  </div>
                  <div className="progress mt-2" style={{ height: '4px' }}>
                    <div 
                      className={`progress-bar bg-${(subInfo.storageUsedBytes / (subInfo.storageLimitGB * 1024 * 1024 * 1024 || 1) > 0.9) ? 'danger' : 'primary'}`}
                      role="progressbar" 
                      style={{ width: `${Math.min(100, (subInfo.storageUsedBytes / (subInfo.storageLimitGB * 1024 * 1024 * 1024 || 1)) * 100)}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {isExpired && isFreePlan && (
              <div className="alert alert-warning rounded-4 mb-3">
                <div className="fw-bold">Gói Free đã hết hạn.</div>
                <div className="small">Vui lòng chọn một gói trả phí bên dưới để tiếp tục sử dụng đầy đủ tính năng cho công ty.</div>
              </div>
            )}

            <div className="d-flex gap-2">
              <button 
                type="button"
                className="btn btn-outline-primary rounded-3 d-flex align-items-center gap-2"
                onClick={() => setShowTransactionModal(true)}
              >
                <History size={18} /> Xem lịch sử giao dịch
              </button>
            </div>
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
            // Normalize both plan names before comparing
            const normalizedCurrent = normalizePlanName(currentPlanName);
            const normalizedCard = normalizePlanName(p.name);
            const isCurrent = normalizedCurrent && normalizedCard && normalizedCurrent === normalizedCard;

            const price = p.priceMonthly || 0;
            const pricePerMonth = p.priceMonthly || 0;
            const canBuy = !isFree;

            // Nếu Free hết hạn, disable Free card; bắt buộc chọn gói trả phí
            const isDisabled = processing !== null || (isFree && isExpired && isFreePlan);

            // Đồng bộ màu nút nâng cấp: tất cả gói trả phí dùng nút đen
            const btnClass = canBuy ? 'btn-dark' : 'btn-outline-secondary';

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
                      disabled={isDisabled || !canBuy || isCurrent}
                      onClick={() => !isCurrent && canBuy && handleUpgrade(p.id)}
                      title={!canBuy && !isCurrent ? 'Gói Free không cần mua' : isCurrent ? 'Đây là gói hiện tại của bạn' : undefined}
                    >
                      {processing === p.id ? <Loader2 className="animate-spin" size={18} /> : getButtonLabel(p, isCurrent)}
                      {processing !== p.id && canBuy && !isCurrent && <ArrowRight size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction History Modal */}
      {showTransactionModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0 p-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold m-0">Lịch sử giao dịch</h5>
                <button 
                  type="button"
                  className="btn-close"
                  onClick={() => setShowTransactionModal(false)}
                />
              </div>
              <div className="modal-body p-4">
                {subInfo?.transactions && subInfo.transactions.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0 fw-bold">Mã giao dịch</th>
                          <th className="border-0 fw-bold">Gói dịch vụ</th>
                          <th className="border-0 fw-bold">Số tiền</th>
                          <th className="border-0 fw-bold">Phương thức</th>
                          <th className="border-0 fw-bold">Trạng thái</th>
                          <th className="border-0 fw-bold">Ngày tạo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subInfo.transactions.map((t) => (
                          <tr key={t.id}>
                            <td className="fw-semibold">#{t.id}</td>
                            <td>{t.planName || '—'}</td>
                            <td className="fw-semibold">{formatMoney(t.amount)} VND</td>
                            <td>
                              <span className="badge bg-light text-dark">{t.paymentGateway || 'Khác'}</span>
                            </td>
                            <td>
                              <span className={`badge ${
                                t.status === 'Completed' ? 'bg-success' : 
                                t.status === 'Pending' ? 'bg-warning text-dark' : 
                                t.status === 'Canceled' ? 'bg-secondary' :
                                'bg-danger'
                              }`}>
                                {t.status === 'Completed' ? '✓ Hoàn tất' : 
                                 t.status === 'Pending' ? '⏳ Đang xử lý' : 
                                 t.status === 'Canceled' ? '⊘ Hủy thanh toán' :
                                 '✗ Thất bại'}
                              </span>
                            </td>
                            <td className="text-muted small">
                              {new Date(t.createdAt).toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <History size={40} className="mb-3 opacity-50" />
                    <p className="mb-0">Chưa có giao dịch nào</p>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 p-4">
                <button 
                  type="button"
                  className="btn btn-secondary rounded-3"
                  onClick={() => setShowTransactionModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default Subscription;
