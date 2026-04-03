import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { CreditCard, Loader2, Trash2, CheckSquare, Square } from 'lucide-react';
import { useNotify } from '../../../context/NotifyContext';

const Transactions = () => {
  const { toast, confirm } = useNotify();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const isSuperAdmin = user.roles?.includes('SuperAdmin');
  
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState('');
  
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Tự động refresh mỗi 10 giây
    return () => clearInterval(interval);
  }, [page, companyId]);

  useEffect(() => {
    if (isSuperAdmin) api.get('/superadmin/companies').then(r => setCompanies(r.data)).catch(() => {});
  }, [isSuperAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, pageSize: PAGE_SIZE });
      if (companyId) params.append('companyId', companyId);
      const res = await api.get(`/transaction?${params}`);
      setData(res.data);
      setSelectedIds([]); // Reset selection when data changes
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isPendingStatus = (status) => {
    if (!status) return false;
    const s = status.toString().trim().toLowerCase();
    return s === 'pending' || s === 'chuathanhtoan' || s === 'unpaid' || s === 'received';
  };

  const isCompletedStatus = (status) => {
    if (!status) return false;
    return status.toString().trim().toLowerCase() === 'completed';
  };

  const handleDeleteOne = async (id) => {
    const ok = await confirm({
      title: 'Xóa giao dịch',
      message: 'Bạn có chắc chắn muốn xóa giao dịch này? Hành động không thể hoàn tác.',
      confirmText: 'Xóa'
    });

    if (!ok) return;

    try {
      await api.delete(`/transaction/${id}`);
      toast('Đã xóa giao dịch thành công.', 'success');
      fetchData();
    } catch (err) {
      toast(err.response?.data || 'Lỗi khi xóa giao dịch.', 'error');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || (data.total && (newPage - 1) * PAGE_SIZE >= data.total)) return;
    setPage(newPage);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.items.map(t => t.id));
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    const ok = await confirm({
      title: 'Xóa giao dịch',
      message: `Bạn có chắc chắn muốn xóa ${selectedIds.length} giao dịch đã chọn? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa'
    });
    
    if (!ok) return;

    try {
      await api.post('/transaction/bulk-delete', selectedIds);
      toast(`Đã xóa ${selectedIds.length} giao dịch thành công.`, 'success');
      fetchData();
    } catch (err) {
      toast(err.response?.data || 'Lỗi khi xóa giao dịch.', 'error');
    }
  };

  const handleComplete = async (id) => {
    const ok = await confirm({
      title: 'Xác nhận thanh toán',
      message: 'Bạn có chắc chắn muốn xác nhận giao dịch này đã hoàn tất? Hệ thống sẽ cập nhật gói dịch vụ cho công ty tương ứng.',
      confirmText: 'Xác nhận'
    });
    if (!ok) return;

    try {
      await api.post(`/transaction/${id}/complete`);
      toast('Đã xác nhận thanh toán thành công!', 'success');
      fetchData();
    } catch (err) {
      toast(err.response?.data || 'Lỗi khi xác nhận thanh toán.', 'error');
    }
  };

  const getPaymentLabel = (method) => {
    switch (method?.toLowerCase()) {
      case 'vnpay': return <span className="badge bg-primary">VNPay</span>;
      case 'cash': case 'direct': return <span className="badge bg-secondary">Tiền mặt</span>;
      case 'banktransfer': return <span className="badge bg-info text-dark">Chuyển khoản</span>;
      default: return <span className="badge bg-dark">{method || 'Khác'}</span>;
    }
  }

  const getStatusLabel = (status) => {
    const normalized = (status || '').toString().trim().toLowerCase();
    if (normalized === 'completed') return <span className="badge bg-success">Đã hoàn tất</span>;
    if (normalized === 'pending' || normalized === 'chuathanhtoan' || normalized === 'unpaid' || normalized === 'received') return <span className="badge bg-warning text-dark">Chưa thanh toán</span>;
    return <span className="badge bg-secondary">{status || 'Chưa xác định'}</span>;
  }
  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    let dStr = dateString;
    if (typeof dStr === 'string' && !dStr.endsWith('Z') && !dStr.includes('+')) {
      dStr += 'Z';
    }
    const date = new Date(dStr);
    return date.toLocaleString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Lịch sử giao dịch</h2>
          <p className="text-muted small mb-0">Hệ thống ghi nhận giao dịch tự động khi tạo công ty hoặc gia hạn.</p>
        </div>
        {selectedIds.length > 0 && isSuperAdmin && (
          <button
            className="btn btn-danger d-flex align-items-center gap-2 px-4 shadow-sm"
            onClick={handleDeleteSelected}
          >
            <Trash2 size={18} /> Xóa {selectedIds.length} mục
          </button>
        )}
      </div>

      <div className="d-flex gap-2 mb-3 align-items-center">
        {isSuperAdmin && (
          <select className="form-select form-select-sm" style={{ width: 220 }} value={companyId} onChange={e => setCompanyId(e.target.value)}>
            <option value="">Tất cả công ty</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.companyName || c.CompanyName}</option>)}
          </select>
        )}
        <div className="text-muted small">Hiển thị {data.items?.length || 0} / {data.total || 0} giao dịch</div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive admin-table-framed-wrapper">
          <table className="table table-hover align-middle mb-0 admin-table-framed">
            <thead className="table-light">
              <tr>
                {isSuperAdmin && (
                  <th style={{ width: 40 }}>
                    <div className="form-check p-0" style={{ cursor: 'pointer' }} onClick={toggleSelectAll}>
                      {selectedIds.length > 0 && selectedIds.length === data.items.length ? (
                        <CheckSquare size={20} className="text-primary" />
                      ) : (
                        <Square size={20} className="text-muted" />
                      )}
                    </div>
                  </th>
                )}
                <th>Công ty</th>
                <th>Gói</th>
                <th>Phương thức</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                {isSuperAdmin && <th className="text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isSuperAdmin ? 8 : 7} className="text-center py-4"><Loader2 className="animate-spin" size={24} /></td></tr>
              ) : (
                data.items?.map(t => (
                  <tr key={t.id} className={selectedIds.includes(t.id) ? 'table-primary bg-opacity-10' : ''}>
                    {isSuperAdmin && (
                      <td>
                        <div className="form-check p-0" style={{ cursor: 'pointer' }} onClick={() => toggleSelectOne(t.id)}>
                          {selectedIds.includes(t.id) ? (
                            <CheckSquare size={18} className="text-primary" />
                          ) : (
                            <Square size={18} className="text-muted" />
                          )}
                        </div>
                      </td>
                    )}
                    <td>{t.companyName}</td>
                    <td>{t.planName}</td>
                    <td>{getPaymentLabel(t.paymentGateway)}</td>
                    <td className="fw-bold">{formatVND(t.amount)}</td>
                    <td>
                      {getStatusLabel(t.status)}
                    </td>
                    <td>{formatDateTime(t.createdAt)}</td>
                    {isSuperAdmin && (
                      <td className="text-center">
                        {isPendingStatus(t.status) && (
                          <button
                            className="btn btn-sm btn-outline-success d-flex align-items-center gap-1 mx-auto mb-1"
                            onClick={() => handleComplete(t.id)}
                            title="Xác nhận đã nhận tiền"
                          >
                            <CreditCard size={14} /> Xác nhận
                          </button>
                        )}
                        {isCompletedStatus(t.status) && (
                          <span className="text-success small"><i className="bi bi-check-circle-fill"></i> Hoàn tất</span>
                        )}

                        <button
                          className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 mx-auto"
                          onClick={() => handleDeleteOne(t.id)}
                          title="Xóa giao dịch"
                        >
                          <Trash2 size={14} /> Xóa
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
              {data.items?.length === 0 && !loading && (
                <tr><td colSpan={8} className="text-center py-5 text-muted">Không có dữ liệu giao dịch nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="small text-muted">
          Hiện tại trang {page} / {Math.max(1, Math.ceil((data.total || 0) / PAGE_SIZE))} - tổng {data.total || 0} giao dịch
        </div>
        <div className="btn-group btn-group-sm" role="group">
          <button
            className="btn btn-outline-primary"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
          >
            Trang trước
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={() => handlePageChange(page + 1)}
            disabled={(page * PAGE_SIZE) >= (data.total || 0)}
          >
            Trang sau
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Transactions;
