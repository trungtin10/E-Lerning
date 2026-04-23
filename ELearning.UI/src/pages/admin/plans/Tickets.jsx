import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import api, { getUploadUrl } from '../../../api/axios';
import { Loader2, Paperclip, ChevronLeft, Building2, HelpCircle, User, Phone, Undo, Redo, ListTodo, List, XCircle, Mail, Save, Trash2, MoreVertical, Eye } from 'lucide-react';
import TiptapEditor from '../../../components/common/TiptapEditor';
import { useNotify } from '../../../context/NotifyContext';

const formatVnDateTime = (value) => {
  if (value == null) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const Tickets = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [thread, setThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast, confirm } = useNotify();

  const [replyBody, setReplyBody] = useState('');
  const [files, setFiles] = useState([null, null, null]);
  const [previews, setPreviews] = useState([null, null, null]);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roles = Array.isArray(user?.roles) ? user.roles : String(user?.roles ?? user?.role ?? '').split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
  const isSuperAdmin = roles.includes('SuperAdmin');
  const isCompanyAdmin = roles.includes('Admin');
  const isEditor = roles.includes('Editor');
  const canModifyStatus = isSuperAdmin || isCompanyAdmin || isEditor;

  const fetchList = useCallback(async () => {
    setListLoading(true);
    try {
      if (isSuperAdmin) {
        const r = await api.get('/ticket', { params: { page: 1, pageSize: 100 } });
        setTickets(r.data?.items || []);
        setTotal(r.data?.total ?? 0);
      } else {
        const r = await api.get('/ticket/my');
        setTickets(Array.isArray(r.data) ? r.data : []);
        setTotal(Array.isArray(r.data) ? r.data.length : 0);
      }
    } catch (err) {
      setTickets([]);
      setTotal(0);
    } finally {
      setListLoading(false);
    }
  }, [isSuperAdmin]);

  const fetchThread = useCallback(async (id) => {
    if (!id) { setThread(null); return; }
    setThreadLoading(true);
    try {
      const r = await api.get(`/ticket/${id}`);
      setThread(r.data);
    } catch {
      setThread(null);
      navigate('/admin/tickets', { replace: true });
    } finally {
      setThreadLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchList(); }, [fetchList]);
  useEffect(() => { if (ticketId) fetchThread(ticketId); else setThread(null); }, [ticketId, fetchThread]);

  const handleFileChange = (index, e) => {
    const newFiles = [...files];
    const newPreviews = [...previews];
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      newFiles[index] = file;
      
      if (file.type.startsWith('image/')) {
        newPreviews[index] = URL.createObjectURL(file);
      } else {
        newPreviews[index] = null;
      }
    } else {
      newFiles[index] = null;
      if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index]);
      newPreviews[index] = null;
    }
    
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!ticketId) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('body', replyBody);
      if (canModifyStatus && thread?.status === 'Open') fd.append('status', 'InProgress');
      files.forEach(f => { if (f) fd.append('files', f); });
      const r = await api.post(`/ticket/${ticketId}/posts`, fd);
      setThread(r.data);
      setReplyBody('');
      setFiles([null, null, null]);
      previews.forEach(p => { if (p) URL.revokeObjectURL(p); });
      setPreviews([null, null, null]);
      document.querySelectorAll('.file-input').forEach(el => el.value = '');
      fetchList();
      toast('Đã gửi phản hồi thành công.', 'success');
    } catch (err) {
      toast('Lỗi: ' + (err.response?.data || 'Không gửi được'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!ticketId) return;
    try {
      await api.patch(`/ticket/${ticketId}/status`, { status: newStatus });
      await fetchThread(ticketId);
      fetchList();
      toast('Đã cập nhật trạng thái.', 'success');
    } catch {
      toast('Không cập nhật được trạng thái', 'error');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const ok = await confirm({ 
      title: 'Xoá yêu cầu hỗ trợ', 
      message: 'Bạn có chắc chắn muốn xoá ticket này? Hành động này không thể hoàn tác và toàn bộ lịch sử trao đổi sẽ bị mất.', 
      confirmText: 'Xoá ticket' 
    });
    if (!ok) return;
    try {
      await api.delete(`/ticket/${id}`);
      toast('Đã xoá ticket thành công.', 'success');
      fetchList();
      if (ticketId && parseInt(ticketId) === id) {
        navigate('/admin/tickets');
      }
    } catch (err) {
      toast('Không xoá được ticket: ' + (err.response?.data?.message || err.response?.data || 'Lỗi hệ thống'), 'error');
    }
  };

  const TopBar = () => (
    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between p-3 gap-3" style={{ backgroundColor: '#0f172a' }}>
      <div className="d-flex flex-wrap align-items-center gap-2">
        <input type="text" className="form-control border-secondary text-white shadow-none" style={{ backgroundColor: '#1e293b', minWidth: '220px' }} placeholder="Nhập từ khóa tìm kiếm" />
        <select className="form-select border-0 shadow-none" style={{ minWidth: '160px', height: '38px' }}>
          <option>Tìm dịch vụ</option>
        </select>
        <button className="btn text-white px-4 border-0" style={{ backgroundColor: '#3b82f6', fontWeight: 600, height: '38px' }}>TÌM KIẾM</button>
      </div>
      <div className="d-flex flex-wrap align-items-center gap-2">
        <div className="d-flex align-items-center gap-2">
          <div className="btn text-white fw-bold d-flex align-items-center justify-content-center border-0 px-3" style={{ backgroundColor: '#e11d48', height: '38px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            <span className="d-flex align-items-center gap-2">0909 995 137 | 028-3842 8832 <Phone size={14} /></span>
          </div>
          <div className="btn text-white fw-bold d-flex align-items-center justify-content-center border-0 px-3" style={{ backgroundColor: '#e11d48', height: '38px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            <span className="d-flex align-items-center gap-2">info@xvnet.vn <Mail size={14} /></span>
          </div>
        </div>
        {isCompanyAdmin && !isSuperAdmin && (
          <button className="btn text-white fw-bold d-flex align-items-center justify-content-center border-0" style={{ backgroundColor: '#10b981', height: '38px', padding: '0 16px' }} onClick={() => navigate('/admin/tickets/new')}>
            GỬI YÊU CẦU 
          </button>
        )}
      </div>
    </div>
  );

  const renderBadge = (status) => {
    switch (status) {
      case 'Resolved': return <span className="badge px-3 py-1 bg-success-subtle text-success border border-success-subtle">Đã trả lời</span>;
      case 'Closed': return <span className="badge px-3 py-1 bg-secondary-subtle text-secondary border border-secondary-subtle">Đóng</span>;
      case 'InProgress': return <span className="badge px-3 py-1 bg-warning-subtle text-warning border border-warning-subtle">Đang xử lý</span>;
      default: return <span className="badge px-3 py-1 bg-danger-subtle text-danger border border-danger-subtle">Đang chờ</span>;
    }
  };

  const listView = (
    <div className="w-100 bg-white" style={{ minHeight: '100vh' }}>
      <TopBar />
      <div className="px-3 pt-4 pb-3 border-bottom">
        <h4 className="fw-bold mb-0 text-uppercase" style={{ color: '#0f172a', letterSpacing: '0.5px', fontSize: '1.25rem' }}>MY SUPPORT :: Danh sách yêu cầu</h4>
      </div>
      <div className="px-3 pb-4 pt-3">
        <div className="bg-white table-responsive pb-5" style={{ minHeight: '400px' }}>
          <table className="table table-bordered table-hover align-middle mb-0" style={{ minWidth: '950px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th className="text-center text-secondary fw-bold py-3" style={{ width: '130px', fontSize: '0.85rem' }}>Mã câu hỏi</th>
                <th className="text-secondary fw-bold py-3" style={{ fontSize: '0.85rem' }}>Lĩnh vực</th>
                <th className="text-secondary fw-bold py-3" style={{ width: '180px', fontSize: '0.85rem' }}>Gửi đến</th>
                <th className="text-center text-secondary fw-bold py-3" style={{ width: '180px', fontSize: '0.85rem' }}>Thời gian</th>
                <th className="text-center text-secondary fw-bold py-3" style={{ width: '130px', fontSize: '0.85rem' }}>Trạng thái</th>
                <th className="text-center text-secondary fw-bold py-3" style={{ width: '180px', fontSize: '0.85rem' }}>Dịch vụ</th>
                <th className="text-center text-secondary fw-bold py-3" style={{ width: '120px', fontSize: '0.85rem' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr><td colSpan="6" className="text-center py-5"><Loader2 className="animate-spin text-muted mx-auto" /></td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-5 text-muted">Chưa có ticket nào.</td></tr>
              ) : (
                tickets.map((t, idx) => (
                  <tr key={t.id} style={{ cursor: 'pointer', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }} onClick={() => navigate(`/admin/tickets/${t.id}`)}>
                    <td className="text-center fw-medium" style={{ color: '#3b82f6', fontSize: '0.88rem' }}>{t.id}Y{(t.id * 7).toString().padStart(4, '0')}</td>
                    <td>
                      <span className="text-danger fw-medium" style={{ fontSize: '0.88rem' }}>( {t.subject} )</span>
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.88rem' }}>Kỹ Thuật (Software)</td>
                    <td className="text-center text-muted" style={{ fontSize: '0.88rem' }}>
                      {formatVnDateTime(t.createdAt).replace(',', ' -')}
                    </td>
                    <td className="text-center">{renderBadge(t.status)}</td>
                    <td className="text-center text-muted" style={{ fontSize: '0.88rem' }}>{t.companyName || 'Windows: hethong'}</td>
                    <td className="text-center">
                      <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-white btn-sm p-2 rounded-3 text-secondary border shadow-sm transition-all"
                          type="button"
                          data-bs-toggle="dropdown"
                          data-bs-display="static"
                          aria-expanded="false"
                        >
                          <MoreVertical size={16} />
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3">
                          <li>
                            <button className="dropdown-item d-flex align-items-center gap-2 py-2 text-primary" onClick={() => navigate(`/admin/tickets/${t.id}`)}>
                              <Eye size={16} /> Xem chi tiết
                            </button>
                          </li>
                          {(isSuperAdmin || isCompanyAdmin) && (
                            <>
                              <li><hr className="dropdown-divider" /></li>
                              <li>
                                <button className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" onClick={(e) => handleDelete(e, t.id)}>
                                  <Trash2 size={16} /> Xoá ticket
                                </button>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const detailView = (
    <div className="w-100 bg-white" style={{ minHeight: '100vh', paddingBottom: '40px' }}>
      <TopBar />
      <div className="container-fluid pt-4 px-3" style={{ maxWidth: '1200px' }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <button className="btn btn-outline-secondary mb-0 d-flex align-items-center gap-2" onClick={() => navigate('/admin/tickets')}>
            <ChevronLeft size={16} /> Quay lại danh sách
          </button>
          
          {canModifyStatus && thread && (
            <div className="d-flex align-items-center gap-2">
              <span className="text-secondary small fw-medium">Trạng thái:</span>
              <select
                className="form-select form-select-sm border-secondary shadow-none"
                style={{ width: '140px' }}
                value={thread.status}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="Open">Mở</option>
                <option value="InProgress">Đang xử lý</option>
                <option value="Resolved">Đã trả lời</option>
                <option value="Closed">Đóng</option>
              </select>
            </div>
          )}
        </div>

        {threadLoading ? (
          <div className="text-center py-5"><Loader2 className="animate-spin mx-auto text-primary" size={32} /></div>
        ) : thread ? (
          <div className="bg-white" style={{ minHeight: '600px' }}>
            <table className="table table-bordered align-middle text-center mb-4">
              <thead style={{ backgroundColor: '#f3f4f6' }}>
                <tr>
                  <th className="py-3 text-secondary small fw-bold" style={{ width: '20%' }}>Mã câu hỏi</th>
                  <th className="py-3 text-secondary small fw-bold" style={{ width: '30%' }}>Dịch vụ</th>
                  <th className="py-3 text-secondary small fw-bold" style={{ width: '25%' }}>Phòng xử lý</th>
                  <th className="py-3 text-secondary small fw-bold" style={{ width: '25%' }}>Nhân viên</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="fw-bold text-dark">{thread.id}Y{(thread.id * 7).toString().padStart(4, '0')}</td>
                  <td className="text-muted small">Windows: {thread.companyName || 'Hệ thống'}</td>
                  <td className="text-muted small">Kỹ Thuật (Software)</td>
                  <td className="fw-bold" style={{ color: '#d9534f' }}>
                    {thread.posts?.find(p => p.authorRole === 'SuperAdmin')?.authorName || 'Đang chờ...'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Original question */}
            <div className="mb-4 bg-white" style={{ border: '1px solid #f6d155', padding: '4px' }}>
              <div className="p-2 border-bottom" style={{ backgroundColor: '#fff' }}>
                <div className="d-flex align-items-center gap-2 fw-bold" style={{ color: '#d9534f', fontSize: '0.9rem' }}>
                  <HelpCircle size={16} className="text-secondary" /> NỘI DUNG YÊU CẦU - {thread.subject}
                </div>
              </div>
              <hr className="m-0" style={{ borderTop: '2px solid #d9534f', opacity: 1 }} />
              <div className="p-3 bg-white text-dark" style={{ minHeight: '140px', fontSize: '0.9rem', lineHeight: '1.6' }}>
                <div dangerouslySetInnerHTML={{ __html: thread.posts?.[0]?.body }} />
                
                {thread.posts?.[0]?.attachmentUrls?.length > 0 && (
                  <div className="mt-3 pt-3 border-top">
                    <div className="fw-bold mb-2 small text-secondary">Tệp đính kèm:</div>
                    <div className="d-flex flex-wrap gap-3">
                      {thread.posts[0].attachmentUrls.map((url, i) => {
                        const isImg = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url);
                        return (
                          <div key={i} className="d-flex flex-column gap-1">
                            {isImg ? (
                              <div onClick={() => setSelectedImageUrl(getUploadUrl(url))} style={{ cursor: 'zoom-in' }}>
                                <img src={getUploadUrl(url)} alt="attachment" className="rounded shadow-sm border hover-opacity-75 transition-all" style={{ maxWidth: '300px', maxHeight: '200px', objectFit: 'contain' }} />
                              </div>
                            ) : (
                              <a href={getUploadUrl(url)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
                                <Paperclip size={14} /> Tệp {i + 1}
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Replies */}
            {thread.posts?.slice(1).map((p, idx) => {
              const isStaff = p.authorRole === 'SuperAdmin';
              return (
                <div key={p.id} className="mb-4 bg-white" style={{ border: '1px solid #f6d155', padding: '4px' }}>
                  <div className="p-2 text-white d-inline-flex align-items-center gap-2 rounded-t" style={{ backgroundColor: isStaff ? '#d9534f' : '#6c757d', fontSize: '0.85rem' }}>
                    <Mail size={16} /> {p.authorName} [{formatVnDateTime(p.createdAt).replace(',', ' -')}]
                  </div>
                  <div className="p-3 bg-white text-dark border border-top-0" style={{ borderColor: '#f6d155', minHeight: '140px', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {isStaff && <div className="mb-2">Kính thưa quý khách!</div>}
                      <div dangerouslySetInnerHTML={{ __html: p.body }} />
                      {isStaff && <div className="mt-3">Trân trọng,<br/>{p.authorName} - Phòng Kỹ Thuật</div>}
                    </div>
                    
                    {p.attachmentUrls?.length > 0 && (
                      <div className="mt-4 pt-3 border-top">
                        <div className="fw-bold mb-2 small text-secondary">Tệp đính kèm:</div>
                        <div className="d-flex flex-wrap gap-3">
                          {p.attachmentUrls.map((url, i) => {
                            const isImg = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url);
                            return (
                              <div key={i} className="d-flex flex-column gap-1">
                                {isImg ? (
                                  <div onClick={() => setSelectedImageUrl(getUploadUrl(url))} style={{ cursor: 'zoom-in' }}>
                                    <img src={getUploadUrl(url)} alt="attachment" className="rounded shadow-sm border hover-opacity-75 transition-all" style={{ maxWidth: '300px', maxHeight: '200px', objectFit: 'contain' }} />
                                  </div>
                                ) : (
                                  <a href={getUploadUrl(url)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
                                    <Paperclip size={14} /> Tệp {i + 1}
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Company Banner */}
            <div className="mb-3 d-flex align-items-center gap-2 p-2 rounded-3" style={{ backgroundColor: '#ffc107', border: '1px solid #e2e8f0' }}>
              <div className="bg-white rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                <HelpCircle size={14} className="text-warning" />
              </div>
              <span className="fw-bold text-dark small text-uppercase">
                {thread.companyName || user.companyName || 'Hệ thống E-Learning'}
              </span>
            </div>

            {/* Reply Form */}
            <div className="mt-2" style={{ border: '1px solid #ffc107', padding: '4px' }}>
              <div className="p-2 fw-bold bg-white" style={{ color: '#000', fontSize: '0.85rem' }}>
                Nội dung phản hồi:
              </div>
              <div className="p-3 bg-white">
                <form onSubmit={handleReply}>
                  <div className="mb-4">
                    <TiptapEditor 
                      key="ticket-reply-editor"
                      content={replyBody} 
                      onChange={(html) => setReplyBody(html)} 
                    />
                  </div>

                  <hr className="my-4 text-muted opacity-25" />

                  {[1, 2, 3].map((num, i) => (
                    <div key={num} className="mb-4">
                      <div className="text-dark mb-2" style={{ fontSize: '0.85rem' }}>
                        Hình minh họa {num} (*.gif, *.jpg, *.jpeg, *.png, *.svg, *.bmp, *.pdf, *.zip, *.rar) và dung lượng tối đa 10Mb:
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <input type="file" className="form-control form-control-sm file-input rounded-0 border-secondary border-opacity-25" style={{ maxWidth: '400px' }} onChange={(e) => handleFileChange(i, e)} />
                        {previews[i] && (
                          <div className="position-relative" style={{ width: '60px', height: '60px' }}>
                            <img src={previews[i]} alt="Preview" className="w-100 h-100 object-fit-cover border shadow-sm" />
                            <button 
                              type="button" 
                              className="btn btn-sm p-0 position-absolute top-0 end-0 bg-white border rounded-circle d-flex align-items-center justify-content-center shadow-sm" 
                              style={{ width: '20px', height: '20px', marginTop: '-10px', marginRight: '-10px', zIndex: 10 }}
                              onClick={() => {
                                const newFiles = [...files];
                                const newPreviews = [...previews];
                                if (newPreviews[i]) URL.revokeObjectURL(newPreviews[i]);
                                newFiles[i] = null;
                                newPreviews[i] = null;
                                setFiles(newFiles);
                                setPreviews(newPreviews);
                                const inputs = document.querySelectorAll('.file-input');
                                if (inputs[i]) inputs[i].value = '';
                              }}
                            >
                              <XCircle size={14} className="text-danger" />
                            </button>
                          </div>
                        )}
                      </div>
                      <hr className="mt-4 text-muted opacity-25" />
                    </div>
                  ))}

                  <div className="text-center mt-5 mb-3">
                    <button type="submit" className="btn text-white px-4 py-2 border-0 fw-medium shadow-sm" style={{ backgroundColor: '#e11d48', minWidth: '120px' }} disabled={submitting}>
                      {submitting ? 'ĐANG GỬI...' : 'Gửi Đi'}
                    </button>
                    <button type="button" className="btn text-white px-4 py-2 border-0 fw-medium ms-2 shadow-sm" style={{ backgroundColor: '#4b5563', minWidth: '140px' }} onClick={() => handleStatusChange('Closed')}>
                      Đóng câu hỏi
                    </button>
                  </div>
                  <div className="text-center mt-4" style={{ color: '#059669', fontSize: '0.85rem' }}>
                    Nếu quý khách có câu hỏi hay vấn đề Mới, vui lòng Không phản hồi, xin hãy <span style={{ color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => navigate('/admin/tickets/new')}>Gửi Yêu Cầu Mới</span> sẽ giúp chúng tôi hỗ trợ nhanh hơn
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div style={{ margin: '-1.5rem', backgroundColor: '#fff' }}>
        {ticketId ? detailView : listView}
      </div>
      <LightBox url={selectedImageUrl} onClose={() => setSelectedImageUrl(null)} />
    </AdminLayout>
  );
};

const LightBox = ({ url, onClose }) => {
  if (!url) return null;
  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
      style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.85)', padding: '20px' }}
      onClick={onClose}
    >
      <button 
        type="button" 
        className="position-absolute top-0 end-0 m-4 btn border-0 text-white" 
        style={{ fontSize: '2rem', backgroundColor: 'transparent' }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <XCircle size={40} />
      </button>
      <img 
        src={url} 
        alt="Full Screen" 
        className="img-fluid shadow-lg rounded-3" 
        style={{ maxHeight: '95vh', objectFit: 'contain' }}
        onClick={(e) => e.stopPropagation()} 
      />
    </div>
  );
};

export default Tickets;
