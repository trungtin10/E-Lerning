import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { MessageCircle, Plus, Loader2, Send } from 'lucide-react';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [replyModal, setReplyModal] = useState(null);
  const [form, setForm] = useState({ subject: '', content: '', priority: 'Normal' });
  const [reply, setReply] = useState('');
  const isSuperAdmin = JSON.parse(localStorage.getItem('user') || '{}')?.roles?.includes('SuperAdmin');

  useEffect(() => {
    const endpoint = isSuperAdmin ? '/ticket' : '/ticket/my';
    api.get(endpoint).then(r => setTickets(isSuperAdmin ? r.data?.items || r.data : r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [isSuperAdmin]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ticket', form);
      setModal(false);
      setForm({ subject: '', content: '', priority: 'Normal' });
      if (!isSuperAdmin) api.get('/ticket/my').then(r => setTickets(r.data));
    } catch (err) {
      alert(err.response?.data || 'Lỗi');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/ticket/${replyModal.id}/reply`, { reply });
      setReplyModal(null);
      setReply('');
      api.get('/ticket').then(r => setTickets(r.data?.items || r.data));
    } catch (err) {
      alert(err.response?.data || 'Lỗi');
    }
  };

  const list = Array.isArray(tickets) ? tickets : (tickets?.items || []);

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Hỗ trợ / Ticket</h2>
          <p className="text-muted small mb-0">{isSuperAdmin ? 'Yêu cầu hỗ trợ từ các công ty' : 'Gửi yêu cầu hỗ trợ cho Super Admin'}</p>
        </div>
        {!isSuperAdmin && (
          <button className="btn btn-primary rounded-3 d-flex align-items-center gap-2" onClick={() => setModal(true)}>
            <Plus size={18} /> Tạo ticket
          </button>
        )}
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive admin-table-framed-wrapper">
          <table className="table table-hover align-middle mb-0 admin-table-framed">
            <thead className="table-light">
              <tr>
                <th>Công ty</th>
                <th>Tiêu đề</th>
                <th>Trạng thái</th>
                <th>Ưu tiên</th>
                <th>Ngày tạo</th>
                {isSuperAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4"><Loader2 className="animate-spin" size={24} /></td></tr>
              ) : (
                list.map(t => (
                  <tr key={t.id}>
                    <td>{t.companyName}</td>
                    <td>{t.subject}</td>
                    <td><span className={`badge ${t.status === 'Resolved' ? 'bg-success' : 'bg-warning'}`}>{t.status}</span></td>
                    <td>{t.priority}</td>
                    <td>{new Date(t.createdAt).toLocaleDateString('vi-VN')}</td>
                    {isSuperAdmin && <td>
                      <button className="btn btn-sm btn-light" onClick={() => setReplyModal(t)}>Trả lời</button>
                    </td>}
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
                <h5 className="modal-title">Tạo ticket hỗ trợ</h5>
                <button type="button" className="btn-close" onClick={() => setModal(false)} />
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Tiêu đề</label>
                    <input type="text" className="form-control" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nội dung</label>
                    <textarea className="form-control" rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ưu tiên</label>
                    <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      <option value="Low">Thấp</option>
                      <option value="Normal">Bình thường</option>
                      <option value="High">Cao</option>
                      <option value="Urgent">Khẩn cấp</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Gửi</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {replyModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content rounded-4">
              <div className="modal-header">
                <h5 className="modal-title">Trả lời: {replyModal.subject}</h5>
                <button type="button" className="btn-close" onClick={() => setReplyModal(null)} />
              </div>
              <form onSubmit={handleReply}>
                <div className="modal-body">
                  <p className="small text-muted">{replyModal.content}</p>
                  {replyModal.adminReply && <p className="small badge bg-light text-dark">Đã trả lời: {replyModal.adminReply}</p>}
                  <div className="mb-3">
                    <label className="form-label">Trả lời</label>
                    <textarea className="form-control" rows={4} value={reply} onChange={e => setReply(e.target.value)} required />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setReplyModal(null)}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Gửi</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Tickets;
