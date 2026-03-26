import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { Megaphone, Plus, Loader2, Trash2 } from 'lucide-react';

const Announcements = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    targetType: 'All',
    displayType: 'Banner',
    targetCompanyId: '',
    targetRoles: '',
    severity: 'Info',
    priority: 0,
    linkUrl: '',
    startAt: new Date().toISOString().slice(0, 16),
    endAt: ''
  });

  useEffect(() => { api.get('/announcement').then(r => setList(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/announcement', {
        ...form,
        targetCompanyId: form.targetCompanyId ? parseInt(form.targetCompanyId, 10) : null,
        startAt: new Date(form.startAt).toISOString(),
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null
      });
      setModal(false);
      setForm({
        title: '',
        content: '',
        targetType: 'All',
        displayType: 'Banner',
        targetCompanyId: '',
        targetRoles: '',
        severity: 'Info',
        priority: 0,
        linkUrl: '',
        startAt: new Date().toISOString().slice(0, 16),
        endAt: ''
      });
      api.get('/announcement').then(r => setList(r.data));
    } catch (err) {
      alert(err.response?.data || 'Lỗi');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.put(`/announcement/${id}/toggle`);
      api.get('/announcement').then(r => setList(r.data));
    } catch (err) {
      alert(err.response?.data || 'Lỗi');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa thông báo?')) return;
    try {
      await api.delete(`/announcement/${id}`);
      api.get('/announcement').then(r => setList(r.data));
    } catch (err) {
      alert(err.response?.data || 'Lỗi');
    }
  };

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Thông báo toàn hệ thống</h2>
          <p className="text-muted small mb-0">Banner/Popup đẩy đến tất cả người dùng hoặc công ty</p>
        </div>
        <button
          className="btn d-flex align-items-center gap-2 px-4 py-2 fw-bold border"
          style={{
            background: 'linear-gradient(to bottom, #7ec8e3, #3498db)',
            borderColor: '#1a5276',
            color: '#fff',
            borderRadius: 2,
            textShadow: '0 1px 1px rgba(255,255,255,0.4)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)'
          }}
          onClick={() => setModal(true)}
        >
          <Plus size={18} /> Tạo mới
        </button>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive admin-table-framed-wrapper">
          <table className="table table-hover align-middle mb-0 admin-table-framed">
            <thead className="table-light">
              <tr>
                <th>Tiêu đề</th>
                <th>Đối tượng</th>
                <th>Hiển thị</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4"><Loader2 className="animate-spin" size={24} /></td></tr>
              ) : (
                list.map(a => (
                  <tr key={a.id}>
                    <td>{a.title}</td>
                    <td>{a.targetType}</td>
                    <td>{a.displayType}</td>
                    <td>{new Date(a.startAt).toLocaleDateString('vi-VN')} {a.endAt && `→ ${new Date(a.endAt).toLocaleDateString('vi-VN')}`}</td>
                    <td><span className={`badge ${a.isActive ? 'bg-success' : 'bg-secondary'}`}>{a.isActive ? 'Đang hiển thị' : 'Tắt'}</span></td>
                    <td>
                      <button className="btn btn-sm btn-light" onClick={() => handleToggle(a.id)}>Bật/Tắt</button>
                      <button className="btn btn-sm btn-light text-danger ms-1" onClick={() => handleDelete(a.id)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content rounded-4">
              <div className="modal-header">
                <h5 className="modal-title">Thêm thông báo</h5>
                <button type="button" className="btn-close" onClick={() => setModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Tiêu đề</label>
                    <input type="text" className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nội dung</label>
                    <textarea className="form-control" rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required />
                  </div>
                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label">Đối tượng</label>
                      <select className="form-select" value={form.targetType} onChange={e => setForm({ ...form, targetType: e.target.value })}>
                        <option value="All">Tất cả</option>
                        <option value="AllCompanies">Tất cả công ty</option>
                        <option value="SuperAdminOnly">Chỉ Super Admin</option>
                      </select>
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label">Hiển thị</label>
                      <select className="form-select" value={form.displayType} onChange={e => setForm({ ...form, displayType: e.target.value })}>
                        <option value="Banner">Banner</option>
                        <option value="Popup">Popup</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label">CompanyId (tùy chọn)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="vd: 12"
                        value={form.targetCompanyId}
                        onChange={e => setForm({ ...form, targetCompanyId: e.target.value })}
                      />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label">Role(s) (CSV, tùy chọn)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Learner,Instructor"
                        value={form.targetRoles}
                        onChange={e => setForm({ ...form, targetRoles: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-4 mb-3">
                      <label className="form-label">Severity</label>
                      <select className="form-select" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                        <option value="Info">Info</option>
                        <option value="Warning">Warning</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div className="col-4 mb-3">
                      <label className="form-label">Priority</label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.priority}
                        onChange={e => setForm({ ...form, priority: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className="col-4 mb-3">
                      <label className="form-label">LinkUrl (tùy chọn)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.linkUrl}
                        onChange={e => setForm({ ...form, linkUrl: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label">Bắt đầu</label>
                      <input type="datetime-local" className="form-control" value={form.startAt} onChange={e => setForm({ ...form, startAt: e.target.value })} />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label">Kết thúc (tùy chọn)</label>
                      <input type="datetime-local" className="form-control" value={form.endAt} onChange={e => setForm({ ...form, endAt: e.target.value })} />
                    </div>
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

export default Announcements;
