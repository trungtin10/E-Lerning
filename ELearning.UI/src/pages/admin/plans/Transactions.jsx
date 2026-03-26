import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { CreditCard, Loader2 } from 'lucide-react';

const Transactions = () => {
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const isSuperAdmin = user.roles?.includes('SuperAdmin');
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [companies, setCompanies] = useState([]);
  const [plans, setPlans] = useState([]);
  const [companyId, setCompanyId] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ companyId: '', servicePlanId: '', amount: 0, billingCycleMonths: 1, notes: '' });

  useEffect(() => { fetchData(); }, [page, companyId]);
  useEffect(() => {
    if (isSuperAdmin) api.get('/superadmin/companies').then(r => setCompanies(r.data)).catch(() => {});
    if (isSuperAdmin) api.get('/plan').then(r => setPlans(r.data)).catch(() => {});
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, pageSize: 20 });
      if (companyId) params.append('companyId', companyId);
      const res = await api.get(`/transaction?${params}`);
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transaction', {
        companyId: +form.companyId,
        servicePlanId: +form.servicePlanId,
        amount: form.amount,
        currency: 'VND',
        billingCycleMonths: form.billingCycleMonths,
        notes: form.notes
      });
      setModal(false);
      setForm({ companyId: '', servicePlanId: '', amount: 0, billingCycleMonths: 1, notes: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data || 'Lỗi');
    }
  };

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Lịch sử giao dịch</h2>
          <p className="text-muted small mb-0">Thanh toán và gia hạn gói của các công ty</p>
        </div>
        {isSuperAdmin && (
          <button
            className="btn px-4 py-2 fw-bold border"
            style={{
              background: 'linear-gradient(to bottom, #7ec8e3, #3498db)',
              borderColor: '#1a5276',
              color: '#fff',
              borderRadius: 2,
              textShadow: '0 1px 1px rgba(255,255,255,0.4)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)'
            }}
            onClick={() => setModal(true)}
          >Tạo mới</button>
        )}
      </div>

      {isSuperAdmin && (
        <div className="mb-3">
          <select className="form-select form-select-sm" style={{ width: 200 }} value={companyId} onChange={e => setCompanyId(e.target.value)}>
            <option value="">Tất cả công ty</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.companyName || c.CompanyName}</option>)}
          </select>
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive admin-table-framed-wrapper">
          <table className="table table-hover align-middle mb-0 admin-table-framed">
            <thead className="table-light">
              <tr>
                <th>Công ty</th>
                <th>Gói</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Hết hạn</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4"><Loader2 className="animate-spin" size={24} /></td></tr>
              ) : (
                data.items?.map(t => (
                  <tr key={t.id}>
                    <td>{t.companyName}</td>
                    <td>{t.planName}</td>
                    <td>{t.amount?.toLocaleString('vi-VN')} ₫</td>
                    <td><span className="badge bg-success">{t.status}</span></td>
                    <td>{t.planExpiresAt ? new Date(t.planExpiresAt).toLocaleDateString('vi-VN') : '—'}</td>
                    <td>{new Date(t.createdAt).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isSuperAdmin && modal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content rounded-4">
              <div className="modal-header">
                <h5 className="modal-title">Thêm giao dịch</h5>
                <button type="button" className="btn-close" onClick={() => setModal(false)} />
              </div>
              <form onSubmit={handleAddTransaction}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Công ty</label>
                    <select className="form-select" value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })} required>
                      <option value="">Chọn công ty</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.companyName || c.CompanyName}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Gói dịch vụ</label>
                    <select className="form-select" value={form.servicePlanId} onChange={e => setForm({ ...form, servicePlanId: e.target.value })} required>
                      <option value="">Chọn gói</option>
                      {plans.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name} - {p.priceMonthly?.toLocaleString()}₫/tháng</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Số tiền (₫)</label>
                    <input type="number" className="form-control" value={form.amount || ''} onChange={e => setForm({ ...form, amount: +e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Chu kỳ (tháng)</label>
                    <select className="form-select" value={form.billingCycleMonths} onChange={e => setForm({ ...form, billingCycleMonths: +e.target.value })}>
                      <option value={1}>1 tháng</option>
                      <option value={12}>12 tháng</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ghi chú</label>
                    <input type="text" className="form-control" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Lưu</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Transactions;
