import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import TiptapEditor from '../../../components/common/TiptapEditor';
import { Phone, ChevronLeft, Loader2 } from 'lucide-react';

export default function CreateTicket() {
  const navigate = useNavigate();
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  }, []);
  const roles = Array.isArray(user?.roles) ? user.roles : String(user?.roles ?? user?.role ?? '').split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
  const isSuperAdmin = roles.includes('SuperAdmin');
  const isCompanyAdmin = roles.includes('Admin');

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', content: '' });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.content.trim() || form.content === '<p></p>') {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung yêu cầu.');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('subject', form.subject);
      fd.append('content', form.content);
      fd.append('priority', 'Normal');
      
      const r = await api.post('/ticket', fd);
      const newId = r.data?.id ?? r.data?.Id ?? r.data?.ticketId ?? r.data?.TicketId;
      navigate(newId ? `/admin/tickets/${newId}` : '/admin/tickets');
    } catch (err) {
      const msg = err.response?.data;
      alert(typeof msg === 'string' ? msg : (msg?.message || 'Không tạo được yêu cầu hỗ trợ.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuperAdmin) {
    return (
      <AdminLayout>
        <div className="container-fluid px-4 py-3 text-center py-5">
            <div className="fw-bold mb-1">Trang này dành cho Admin công ty</div>
            <div className="text-muted small">SuperAdmin không cần tạo yêu cầu hỗ trợ.</div>
            <button className="btn btn-sm btn-outline-secondary mt-3" onClick={() => navigate('/admin/tickets')}>Quay lại</button>
        </div>
      </AdminLayout>
    );
  }

  const TopBar = () => (
    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between p-3 gap-3" style={{ backgroundColor: '#0f172a' }}>
      <div className="d-flex flex-wrap align-items-center gap-2">
        <input type="text" className="form-control border-secondary text-white shadow-none" style={{ backgroundColor: '#1e293b', minWidth: '220px' }} placeholder="Nhập từ khóa tìm kiếm" />
        <button className="btn text-white px-4 border-0" style={{ backgroundColor: '#3b82f6', fontWeight: 600, height: '38px' }}>TÌM KIẾM</button>
      </div>
      <div className="d-flex flex-wrap align-items-center gap-2">
        <button className="btn text-white fw-bold d-flex flex-column align-items-center justify-content-center border-0" style={{ backgroundColor: '#e11d48', height: '38px', padding: '0 16px' }}>
          <span className="d-flex align-items-center gap-2">1900 9477 <Phone size={16} /></span>
        </button>
        <button className="btn text-white fw-bold d-flex align-items-center justify-content-center border-0" style={{ backgroundColor: '#10b981', height: '38px', padding: '0 16px' }} onClick={() => navigate('/admin/tickets/new')}>
          GỬI YÊU CẦU 
        </button>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div style={{ margin: '-1.5rem', backgroundColor: '#fff', minHeight: '100vh', paddingBottom: '40px' }}>
        <TopBar />
        
        <div className="px-3 pt-4 pb-3 border-bottom d-flex align-items-center justify-content-between">
          <h4 className="fw-bold mb-0 text-uppercase" style={{ color: '#0f172a', letterSpacing: '0.5px', fontSize: '1.25rem' }}>GỬI YÊU CẦU MỚI</h4>
          <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={() => navigate('/admin/tickets')}>
            <ChevronLeft size={16} /> Quay lại danh sách
          </button>
        </div>

        <div className="container-fluid pt-4 px-3" style={{ maxWidth: '1000px' }}>
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden border">
            <div className="card-header bg-warning bg-opacity-10 border-bottom border-warning border-opacity-25 py-3">
               <span className="fw-bold text-dark text-uppercase small">TẠO YÊU CẦU HỖ TRỢ ĐẾN BỘ PHẬN KỸ THUẬT</span>
            </div>
            <div className="card-body p-4">
              <form onSubmit={submit}>
                <div className="mb-4">
                  <label className="form-label fw-bold text-danger small text-uppercase">Lĩnh vực / Tiêu đề yêu cầu:</label>
                  <input
                    type="text"
                    className="form-control rounded-3 shadow-none border-secondary border-opacity-25 py-2"
                    placeholder="Nhập tiêu đề ngắn gọn cho vấn đề của bạn..."
                    value={form.subject}
                    onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold text-danger small text-uppercase">Nội dung chi tiết yêu cầu:</label>
                  <div className="mb-2 text-muted small">Bạn có thể chèn hình ảnh minh họa, bảng biểu hoặc copy nội dung trực tiếp vào đây.</div>
                  <TiptapEditor 
                    content={form.content} 
                    onChange={(val) => setForm(p => ({ ...p, content: val }))} 
                  />
                </div>

                <div className="d-flex align-items-center justify-content-center gap-3 mt-5 pt-3 border-top">
                  <button type="button" className="btn btn-light px-5 py-2 rounded-3 fw-bold border" onClick={() => navigate('/admin/tickets')} disabled={submitting}>
                    QUAY LẠI
                  </button>
                  <button type="submit" className="btn text-white px-5 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center gap-2" style={{ backgroundColor: '#e11d48' }} disabled={submitting}>
                    {submitting ? <><Loader2 size={18} className="animate-spin" /> ĐANG GỬI...</> : 'GỬI YÊU CẦU'}
                  </button>
                </div>
                
                <div className="text-center small mt-4 p-3 bg-light rounded-3 border-dashed border-success border-opacity-25" style={{ color: '#059669' }}>
                   Yêu cầu của bạn sẽ được gửi trực tiếp đến Hệ Thống Tổng để xử lý. Vui lòng cung cấp chi tiết lỗi để được hỗ trợ tốt nhất.
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
