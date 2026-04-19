import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { Megaphone, Plus, Loader2, Trash2, Calendar, Target, Layout, Eye, EyeOff } from 'lucide-react';
import TiptapEditor from '../../../components/common/TiptapEditor';

const Announcements = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    content: '',
    targetType: 'All',
    displayType: 'Banner',
    severity: 'Info',
    priority: 0,
    startAt: new Date().toISOString().slice(0, 16),
  });

  const fetchList = async () => {
    setLoading(true);
    try {
      const r = await api.get('/announcement');
      setList(r.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/announcement', {
        ...form,
        startAt: new Date(form.startAt).toISOString(),
      });
      setModal(false);
      setForm({
        title: '',
        content: '',
        targetType: 'All',
        displayType: 'Banner',
        severity: 'Info',
        priority: 0,
        startAt: new Date().toISOString().slice(0, 16),
      });
      fetchList();
    } catch (err) {
      alert(err.response?.data || 'Lỗi khi lưu thông báo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.put(`/announcement/${id}/toggle`);
      fetchList();
    } catch (err) {
      alert(err.response?.data || 'Lỗi');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return;
    try {
      await api.delete(`/announcement/${id}`);
      fetchList();
    } catch (err) {
      alert(err.response?.data || 'Lỗi');
    }
  };

  return (
    <AdminLayout>
      <div className="admin-announcement-root">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">Thông báo toàn hệ thống</h2>
            <p className="text-secondary small mb-0">Quản lý các tin nhắn Banner/Popup gửi đến người dùng.</p>
          </div>
          <button
            className="btn btn-primary px-4 py-2 rounded-3 d-flex align-items-center gap-2 shadow-sm fw-semibold"
            onClick={() => setModal(true)}
          >
            <Plus size={20} /> Tạo thông báo
          </button>
        </div>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive admin-table-framed-wrapper">
            <table className="table table-hover align-middle mb-0 admin-table-framed">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Tiêu đề thông báo</th>
                  <th>Đối tượng</th>
                  <th>Hình thức</th>
                  <th>Bắt đầu</th>
                  <th className="text-center">Trạng thái</th>
                  <th className="pe-4 text-end">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-5"><Loader2 className="animate-spin text-primary mx-auto" size={32} /></td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-5 text-muted">Chưa có thông báo nào được tạo.</td></tr>
                ) : (
                  list.map(a => (
                    <tr key={a.id}>
                      <td className="ps-4 py-3">
                        <div className="fw-bold text-dark cursor-pointer hover-text-primary" onClick={() => setViewModal(a)}>{a.title}</div>
                        <div className="small text-muted text-truncate" style={{ maxWidth: '300px' }} dangerouslySetInnerHTML={{ __html: a.content }} />
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border px-2 py-1 fw-medium d-inline-flex align-items-center gap-1">
                          <Target size={12} /> {a.targetType === 'All' ? 'Tất cả' : a.targetType}
                        </span>
                      </td>
                      <td>
                        <span className="small text-muted d-inline-flex align-items-center gap-1">
                          <Layout size={14} /> {a.displayType}
                        </span>
                      </td>
                      <td>
                        <div className="small text-muted">
                          <Calendar size={13} className="me-1" />
                          {new Date(a.startAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="text-center">
                        <div 
                          className={`badge rounded-pill px-3 py-1 ${a.isActive ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'}`}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {a.isActive ? 'Đang bật' : 'Đang tắt'}
                        </div>
                      </td>
                      <td className="pe-4 text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <button className="btn btn-sm btn-white border shadow-sm" onClick={() => setViewModal(a)} title="Xem chi tiết">
                            <Eye size={16} />
                          </button>
                          <button className="btn btn-sm btn-white border shadow-sm" onClick={() => handleToggle(a.id)} title={a.isActive ? 'Tắt' : 'Bật'}>
                            {a.isActive ? <EyeOff size={16} /> : <Eye size={16} className="text-secondary" />}
                          </button>
                          <button className="btn btn-sm btn-white border shadow-sm text-danger" onClick={() => handleDelete(a.id)} title="Xóa">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {modal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                <div className="modal-header border-bottom-0 p-4 pb-0">
                  <h5 className="modal-title fw-bold fs-4 d-flex align-items-center gap-2">
                    <Megaphone className="text-primary" /> Soạn thông báo mới
                  </h5>
                  <button type="button" className="btn-close shadow-none" onClick={() => setModal(false)} />
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4">
                    <div className="row g-4">
                      <div className="col-lg-8">
                        <div className="mb-4">
                          <label className="form-label fw-semibold text-dark">Tiêu đề thông báo</label>
                          <input 
                            type="text" 
                            className="form-control form-control-lg border-2 shadow-none focus-primary" 
                            placeholder="Nhập tiêu đề ngắn gọn, thu hút..."
                            value={form.title} 
                            onChange={e => setForm({ ...form, title: e.target.value })} 
                            required 
                          />
                        </div>
                        <div className="mb-0">
                          <label className="form-label fw-semibold text-dark">Nội dung chi tiết</label>
                          <TiptapEditor 
                            key="announcement-editor"
                            content={form.content} 
                            onChange={(html) => setForm({ ...form, content: html })} 
                          />
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div className="p-4 bg-light rounded-4 h-100">
                          <h6 className="fw-bold mb-4 text-primary">Cấu hình gửi tin</h6>
                          
                          <div className="mb-4">
                            <label className="form-label small fw-bold text-uppercase text-muted">Đối tượng nhận</label>
                            <select className="form-select border-0 shadow-sm" value={form.targetType} onChange={e => setForm({ ...form, targetType: e.target.value })}>
                              <option value="All">Toàn bộ thành viên</option>
                              <option value="AllCompanies">Các quản trị viên công ty</option>
                              <option value="SuperAdminOnly">Chỉ Super Admin</option>
                            </select>
                          </div>

                          <div className="mb-4">
                            <label className="form-label small fw-bold text-uppercase text-muted">Hình thức hiển thị</label>
                            <div className="d-flex gap-2">
                              {['Banner', 'Popup'].map(t => (
                                <button
                                  key={t}
                                  type="button"
                                  className={`btn btn-sm flex-grow-1 py-2 rounded-3 border-0 shadow-sm ${form.displayType === t ? 'bg-primary text-white' : 'bg-white text-dark'}`}
                                  onClick={() => setForm({ ...form, displayType: t })}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="form-label small fw-bold text-uppercase text-muted">Độ ưu tiên</label>
                            <select className="form-select border-0 shadow-sm" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                              <option value="Info">Thông tin (Xanh)</option>
                              <option value="Warning">Cảnh báo (Vàng)</option>
                              <option value="Critical">Quan trọng (Đỏ)</option>
                            </select>
                          </div>

                          <div className="mb-0">
                            <label className="form-label small fw-bold text-uppercase text-muted">Thời gian bắt đầu</label>
                            <input type="datetime-local" className="form-control border-0 shadow-sm" value={form.startAt} onChange={e => setForm({ ...form, startAt: e.target.value })} />
                            <p className="extra-small text-muted mt-2 mb-0">Hệ thống sẽ tự động kích hoạt thông báo vào thời gian này.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-top-0 p-4 pt-0">
                    <button type="button" className="btn btn-light px-4 py-2 rounded-3 fw-bold" onClick={() => setModal(false)}>Hủy bỏ</button>
                    <button type="submit" className="btn btn-primary px-5 py-2 rounded-3 fw-bold shadow-sm" disabled={submitting}>
                      {submitting ? <Loader2 className="animate-spin me-2" size={18} /> : null}
                      {submitting ? 'ĐANG LƯU...' : 'LƯU VÀ PHÁT HÀNH'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {viewModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                <div className="modal-header border-bottom p-4">
                  <div>
                    <h5 className="modal-title fw-bold">Chi tiết thông báo</h5>
                    <div className="small text-muted">Bắt đầu từ: {new Date(viewModal.startAt).toLocaleString('vi-VN')}</div>
                  </div>
                  <button type="button" className="btn-close shadow-none" onClick={() => setViewModal(null)} />
                </div>
                <div className="modal-body p-4">
                  <div className="mb-4 pb-4 border-bottom">
                    <div className="small text-uppercase text-muted fw-bold mb-2">Tiêu đề</div>
                    <h3 className="fw-bold text-dark mb-0">{viewModal.title}</h3>
                  </div>

                  <div className="mb-4">
                    <div className="small text-uppercase text-muted fw-bold mb-2">Nội dung</div>
                    <div className="tiptap-content" dangerouslySetInnerHTML={{ __html: viewModal.content }} />
                  </div>

                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="p-3 bg-light rounded-3">
                        <div className="small text-muted mb-1">Đối tượng</div>
                        <div className="fw-bold">{viewModal.targetType === 'All' ? 'Tất cả' : viewModal.targetType}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="p-3 bg-light rounded-3">
                        <div className="small text-muted mb-1">Hình thức</div>
                        <div className="fw-bold">{viewModal.displayType}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="p-3 bg-light rounded-3">
                        <div className="small text-muted mb-1">Độ ưu tiên</div>
                        <div className={`fw-bold ${viewModal.severity === 'Critical' ? 'text-danger' : viewModal.severity === 'Warning' ? 'text-warning' : 'text-primary'}`}>{viewModal.severity}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top p-3 px-4">
                  <button type="button" className="btn btn-secondary px-4 rounded-3" onClick={() => setViewModal(null)}>Đóng</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .admin-announcement-root { font-family: 'Inter', sans-serif; }
        .focus-primary:focus { border-color: #3b82f6 !important; }
        .extra-small { font-size: 0.75rem; }
        .btn-white { background-color: white; }
        .btn-white:hover { background-color: #f8fafc; }
        .hover-opacity-75:hover { opacity: 0.75; }
        .hover-text-primary:hover { color: #3b82f6 !important; transition: color 0.15s; }
        .tiptap-content { line-height: 1.6; }
        .tiptap-content p { margin-bottom: 1rem; }
      `}</style>
    </AdminLayout>
  );
};

export default Announcements;
