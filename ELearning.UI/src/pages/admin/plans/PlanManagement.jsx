import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { Package, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

const PlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, plan: null });
  const [form, setForm] = useState({ name: '', description: '', maxUsers: 50, storageLimitGB: 10, priceMonthly: 500000, priceYearly: 5000000, sortOrder: 0 });

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plan');
      setPlans(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal.plan) {
        await api.put(`/plan/${modal.plan.id}`, form);
      } else {
        await api.post('/plan', form);
      }
      setModal({ show: false, plan: null });
      setForm({ name: '', description: '', maxUsers: 50, storageLimitGB: 10, priceMonthly: 500000, priceYearly: 5000000, sortOrder: 0 });
      fetchPlans();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa gói dịch vụ này?')) return;
    try {
      await api.delete(`/plan/${id}`);
      fetchPlans();
    } catch (err) {
      alert(err.response?.data || 'Không thể xóa');
    }
  };

  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description || '', maxUsers: p.maxUsers, storageLimitGB: p.storageLimitGB, priceMonthly: p.priceMonthly, priceYearly: p.priceYearly, sortOrder: p.sortOrder });
    setModal({ show: true, plan: p });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="d-flex justify-content-center py-5"><Loader2 className="animate-spin" size={40} /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Quản lý gói dịch vụ</h2>
          <p className="text-muted small mb-0">Định nghĩa Basic, Pro, Enterprise với giới hạn tài nguyên và giá</p>
        </div>
        <button
          className="btn btn-admin-create d-flex align-items-center gap-2"
          onClick={() => { setForm({ name: '', description: '', maxUsers: 50, storageLimitGB: 10, priceMonthly: 500000, priceYearly: 5000000, sortOrder: plans.length }); setModal({ show: true, plan: null }); }}
        >
          <Plus size={18} /> Tạo mới
        </button>
      </div>

      <div className="row g-3">
        {plans.map((p) => (
          <div key={p.id} className="col-12 col-md-6 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="bg-primary-subtle p-2 rounded-3 text-primary">
                    <Package size={24} />
                  </div>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-light p-1" onClick={() => openEdit(p)}><Pencil size={16} /></button>
                    {!p.isActive && <button className="btn btn-sm btn-light text-danger p-1" onClick={() => handleDelete(p.id)}><Trash2 size={16} /></button>}
                  </div>
                </div>
                <h5 className="fw-bold mb-1">{p.name}</h5>
                <p className="text-muted small mb-3">{p.description || '—'}</p>
                <div className="small mb-2"><strong>Max users:</strong> {p.maxUsers}</div>
                <div className="small mb-2"><strong>Storage:</strong> {p.storageLimitGB} GB</div>
                <div className="small mb-2"><strong>Giá/tháng:</strong> {p.priceMonthly?.toLocaleString('vi-VN')} ₫</div>
                <div className="small"><strong>Giá/năm:</strong> {p.priceYearly?.toLocaleString('vi-VN')} ₫</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal.show && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content rounded-4">
              <div className="modal-header">
                <h5 className="modal-title">{modal.plan ? 'Chỉnh sửa gói' : 'Thêm gói dịch vụ'}</h5>
                <button type="button" className="btn-close" onClick={() => setModal({ show: false, plan: null })} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Tên gói</label>
                    <input type="text" className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mô tả</label>
                    <input type="text" className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label">Max users</label>
                      <input type="number" className="form-control" value={form.maxUsers} onChange={e => setForm({ ...form, maxUsers: +e.target.value })} min={1} />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label">Storage (GB)</label>
                      <input type="number" className="form-control" value={form.storageLimitGB} onChange={e => setForm({ ...form, storageLimitGB: +e.target.value })} min={1} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label">Giá/tháng (₫)</label>
                      <input type="number" className="form-control" value={form.priceMonthly} onChange={e => setForm({ ...form, priceMonthly: +e.target.value })} />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label">Giá/năm (₫)</label>
                      <input type="number" className="form-control" value={form.priceYearly} onChange={e => setForm({ ...form, priceYearly: +e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setModal({ show: false, plan: null })}>Hủy</button>
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

export default PlanManagement;
