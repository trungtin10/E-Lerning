import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, CreditCard, Globe, ArrowRight, 
  Download, Printer, Building2, ExternalLink
} from 'lucide-react';
import AdminLayout from '../../../components/layout/AdminLayout';

const CheckoutSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { companyData } = location.state || {};

  if (!companyData) {
    return (
      <AdminLayout>
        <div className="text-center py-5">
           <Building2 size={48} className="text-muted mb-3 opacity-20" />
           <p>Không tìm thấy thông tin giao dịch.</p>
           <button onClick={() => navigate('/admin/companies')} className="btn btn-primary">Quay lại danh sách</button>
        </div>
      </AdminLayout>
    );
  }

  const formatVND = (val) => new Intl.NumberFormat('vi-VN').format(val || 0) + ' VNĐ';

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto py-4">
        {/* Header Success */}
        <div className="text-center mb-5 animate-in fade-in zoom-in duration-500">
           <div className="d-inline-flex p-3 bg-success-subtle rounded-circle text-success mb-3 shadow-sm">
              <CheckCircle2 size={48} />
           </div>
           <h2 className="fw-bold">Kích hoạt hệ thống thành công!</h2>
           <p className="text-muted">Hệ thống SaaS cho <strong>{companyData.companyName}</strong> đã được khởi tạo và đang chờ thanh toán đối soát.</p>
        </div>

        <div className="row g-4">
           {/* Cột trái: Thông tin thanh toán */}
           <div className="col-lg-7">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 h-100">
                 <div className="card-header bg-dark text-white p-4 border-0">
                    <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                       <CreditCard size={18} /> HƯỚNG DẪN THANH TOÁN
                    </h6>
                 </div>
                 <div className="card-body p-4">
                    {companyData.paymentMethod === 'BankTransfer' ? (
                      <div>
                         <div className="alert alert-info border-0 rounded-3 mb-4">
                            Vui lòng chuyển khoản chính xác số tiền bên dưới để hệ thống tự động đối soát nhanh nhất.
                         </div>
                         <div className="d-flex flex-column gap-3">
                            <div className="p-3 bg-light rounded-3">
                               <div className="small text-muted mb-1">Ngân hàng</div>
                               <div className="fw-bold fs-5">Vietcombank (VCB)</div>
                            </div>
                            <div className="p-3 bg-light rounded-3">
                               <div className="small text-muted mb-1">Số tài khoản</div>
                               <div className="fw-bold text-primary fs-4 tracking-wider">1023 4567 890</div>
                            </div>
                            <div className="p-3 bg-light rounded-3">
                               <div className="small text-muted mb-1">Chủ tài khoản</div>
                               <div className="fw-bold text-uppercase">CTY TNHH CÔNG NGHỆ GIÁO DỤC</div>
                            </div>
                            <div className="p-3 bg-warning-subtle border border-warning-subtle rounded-3">
                               <div className="small text-warning-emphasis fw-bold mb-1">Nội dung chuyển khoản (Bắt buộc)</div>
                               <div className="fw-bold text-danger fs-5 font-monospace">
                                  THU_PHI_TENANT_{companyData.subDomain?.toUpperCase()}
                               </div>
                            </div>
                         </div>
                      </div>
                    ) : companyData.paymentMethod === 'VnPay' ? (
                      <div className="text-center py-4">
                         <div className="bg-white d-inline-block p-3 rounded-4 shadow-sm border mb-3">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VNPAY_PAYMENT_${companyData.subDomain}`} alt="QR" width="200" />
                         </div>
                         <h5 className="fw-bold">Quét mã để thanh toán</h5>
                         <p className="text-muted small px-4">Sử dụng ứng dụng Ngân hàng hoặc Ví điện tử Mobifone Money, Viettel Money, VNPay để quét mã.</p>
                      </div>
                    ) : companyData.paymentMethod === 'MoMo' ? (
                      <div className="text-center py-4">
                         <div className="bg-white d-inline-block p-3 rounded-4 shadow-sm border mb-3">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MOMO_PAYMENT_${companyData.subDomain}`} alt="QR" width="200" />
                         </div>
                         <h5 className="fw-bold">Quét mã MoMo để thanh toán</h5>
                         <p className="text-muted small px-4">Mở ứng dụng MoMo và quét QR để hoàn tất giao dịch.</p>
                      </div>
                    ) : (
                      <div className="text-center py-5">
                         <CheckCircle2 size={48} className="text-success opacity-20 mb-3" />
                         <h5 className="fw-bold">Thanh toán trực tiếp</h5>
                         <p className="text-muted">Vui lòng bàn giao tiền mặt hoặc hồ sơ thanh toán cho nhân viên kinh doanh phụ trách.</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Cột phải: Tổng kết đơn hàng */}
           <div className="col-lg-5">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                 <div className="card-body p-4 d-flex flex-column">
                    <h6 className="fw-bold text-muted mb-4 text-uppercase tracking-wider">Chi tiết đơn hàng</h6>
                    
                    <div className="flex-grow-1">
                       <div className="d-flex justify-content-between mb-3">
                          <span className="text-muted">Công ty:</span>
                          <span className="fw-bold text-end">{companyData.companyName}</span>
                       </div>
                       <div className="d-flex justify-content-between mb-3">
                          <span className="text-muted">ID Hệ thống:</span>
                          <span className="fw-bold font-monospace">{companyData.subDomain}</span>
                       </div>
                       <div className="d-flex justify-content-between mb-3">
                          <span className="text-muted">Chu kỳ:</span>
                          <span className="fw-bold">{companyData.billingCycleMonths === 12 ? '1 Năm' : '1 Tháng'}</span>
                       </div>
                       <hr className="my-4" />
                       <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold fs-5">TỔNG CỘNG:</span>
                          <span className="fw-bold fs-4 text-primary">{formatVND(companyData.amountPaid)}</span>
                       </div>
                       <p className="extra-small text-muted text-end">(Đã bao gồm thuế VAT)</p>
                    </div>

                    <div className="mt-auto pt-4 d-flex flex-column gap-2">
                       <button className="btn btn-outline-dark d-flex align-items-center justify-content-center gap-2 py-2">
                          <Printer size={18} /> In phiếu thu
                       </button>
                       <button onClick={() => navigate('/admin/companies')} className="btn btn-primary d-flex align-items-center justify-content-center gap-2 py-3 fw-bold">
                          Trở về trang quản lý <ArrowRight size={18} />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="mt-5 p-4 bg-light rounded-4 border d-flex align-items-center justify-content-between">
           <div>
              <h6 className="fw-bold mb-1">Hướng dẫn cho khách hàng</h6>
              <p className="text-muted small mb-0">Hệ thống đã gửi email kích hoạt đến <strong>{companyData.contactEmail}</strong>. Khách hàng cần xác nhận để bắt đầu sử dụng.</p>
           </div>
           <a href={`http://${companyData.subDomain}.elearning.com`} target="_blank" rel="noreferrer" className="btn btn-link text-primary fw-bold text-decoration-none d-flex align-items-center gap-1">
              Xem trang đích <ExternalLink size={16} />
           </a>
        </div>
      </div>

      <style>{`
        .bg-success-subtle { background-color: #f0fdf4; }
        .bg-info-subtle { background-color: #f0f9ff; }
        .font-monospace { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
        .extra-small { font-size: 0.75rem; }
      `}</style>
    </AdminLayout>
  );
};

export default CheckoutSuccess;
