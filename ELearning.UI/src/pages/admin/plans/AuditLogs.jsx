import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { useNotify } from '../../../context/NotifyContext';
import { FileText, Loader2, AlertCircle, RefreshCw, Trash2, Clock, CheckSquare, Square, Info, X } from 'lucide-react';
import AdminPaginationBar from '../../../components/common/AdminPaginationBar';

const AuditLogs = () => {
  const { toast, confirm } = useNotify();
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 50 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.roles?.includes('SuperAdmin');

  const fetchLogs = useCallback((pageOverride) => {
    const p = pageOverride ?? page;
    const params = new URLSearchParams({ page: String(p), pageSize: '50' });
    setLoading(true);
    setError('');
    api.get(`/audit?${params}`)
      .then(r => {
        const res = r.data;
        setData({
          items: res.items ?? res.Items ?? [],
          total: res.total ?? res.Total ?? 0,
          page: res.page ?? res.Page ?? p,
          pageSize: res.pageSize ?? res.PageSize ?? 50
        });
        setSelectedIds([]);
      })
      .catch(err => {
        const res = err.response?.data;
        const msg = res?.message ?? res?.error ?? res?.detail ?? err.message ?? 'Không thể tải nhật ký.';
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        setData({ items: [], total: 0, page: 1, pageSize: 50 });
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil((data.total || 0) / (data.pageSize || 50)) || 1;

  const handleDelete = async (id) => {
    const ok = await confirm({ title: 'Xóa bản ghi', message: 'Xóa bản ghi nhật ký này?', confirmText: 'Xóa' });
    if (!ok) return;
    setDeleting(id);
    try {
      await api.delete(`/audit/${id}`);
      toast('Đã xóa bản ghi nhật ký.', 'success');
      fetchLogs(page);
    } catch (err) {
      toast(err.response?.data || 'Không thể xóa.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length > 0 && selectedIds.length === (data.items?.length || 0)) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.items?.map(i => i.id) || []);
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
      title: 'Xóa nhiều bản ghi',
      message: `Bạn có chắc chắn muốn xóa ${selectedIds.length} bản ghi đã chọn? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa'
    });
    if (!ok) return;

    try {
      await api.post('/audit/bulk-delete', selectedIds);
      toast(`Đã xóa ${selectedIds.length} bản ghi thành công.`, 'success');
      fetchLogs(page);
    } catch (err) {
      toast(err.response?.data || 'Lỗi khi xóa.', 'error');
    }
  };

  const handleClearAll = async () => {
    const ok = await confirm({ title: 'Xóa tất cả', message: 'Xóa toàn bộ nhật ký hoạt động? Hành động này không thể hoàn tác.', confirmText: 'Xóa tất cả' });
    if (!ok) return;
    try {
      await api.delete('/audit/clear');
      toast('Đã xóa toàn bộ nhật ký.', 'success');
      setPage(1);
      fetchLogs(1);
    } catch (err) {
      toast(err.response?.data || 'Không thể xóa.', 'error');
    }
  };

  const formatActivity = (a) => {
    const action = a.action || a.Action || '';
    const entityType = a.entityType || a.EntityType || '';
    const newVal = a.newValue || a.NewValue || '';
    const oldVal = a.oldValue || a.OldValue || '';
    const details = a.details || a.Details || '';
    const entityNames = {
      Course: 'Khóa học',
      Lesson: 'Bài học',
      Category: 'Danh mục',
      User: 'Người dùng',
      Company: 'Công ty',
      Announcement: 'Thông báo',
      SupportTicket: 'Ticket hỗ trợ',
      Certificate: 'Chứng chỉ',
      Quiz: 'Bài kiểm tra',
      QuizAttempt: 'Bài làm',
      CourseEnrollment: 'Đăng ký khóa học',
      LessonProgress: 'Tiến độ bài học',
      ServicePlan: 'Gói dịch vụ',
      Transaction: 'Giao dịch'
    };
    const name = entityNames[entityType] || entityType || 'Mục';
    if (action === 'Create') return `${name} "${newVal || 'mới'}" đã được tạo`;
    if (action === 'Update') return `${name} "${newVal || ''}" đã được cập nhật`;
    if (action === 'Delete') {
      const target = (oldVal || newVal || '').trim();
      return target ? `${name} "${target}" đã bị xóa` : `${name} đã bị xóa`;
    }
    if (action === 'Enroll') return `Đăng ký khóa học ${newVal || ''}`;
    if (action === 'Complete') return `Hoàn thành bài học ${newVal || ''}`;
    if (action === 'Generate') return `Cấp chứng chỉ: ${newVal || ''}`;
    if (action === 'Login' || action === 'GoogleLogin') return `Đăng nhập: ${newVal || ''}`;
    if (action === 'Submit') return `Nộp bài kiểm tra: ${newVal || ''}`;
    if (action === 'Reply' || action === 'Toggle') return details || `${action} ${entityType}`;
    return details || `${action} ${entityType} ${newVal}`.trim();
  };

  // Add Escape key listener to close modals
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setShowLogDetail(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold tracking-tight mb-1">Nhật ký hoạt động</h2>
          <p className="text-muted small mb-0">Hoạt động đã khởi tạo và thời gian thực hiện.</p>
        </div>
        <div className="d-flex gap-2">
          {selectedIds.length > 0 && (
            <button
              className="btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-3"
              style={{ background: '#dc3545', color: '#fff', border: 'none' }}
              onClick={handleDeleteSelected}
            >
              <Trash2 size={16} /> Xóa {selectedIds.length} mục
            </button>
          )}
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-3"
            onClick={() => { setPage(1); fetchLogs(1); }}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
          {isSuperAdmin && (data.total ?? 0) > 0 && (
            <button
              className="btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-3"
              style={{ background: '#dc3545', color: '#fff', border: 'none' }}
              onClick={handleClearAll}
            >
              <Trash2 size={16} /> Xóa tất cả
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3 rounded-3">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button className="btn btn-sm btn-outline-danger ms-auto" onClick={() => { setError(''); fetchLogs(1); }}>
            Thử lại
          </button>
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive admin-table-framed-wrapper">
            <table className="table table-hover align-middle mb-0 admin-table-framed">
              <thead>
                <tr>
                  <th style={{ width: 40 }} className="px-3 py-3">
                    <div className="form-check p-0 m-0" style={{ cursor: 'pointer' }} onClick={toggleSelectAll}>
                      {selectedIds.length > 0 && selectedIds.length === (data.items?.length || 0) ? (
                        <CheckSquare size={18} className="text-primary" />
                      ) : (
                        <Square size={18} className="text-muted" />
                      )}
                    </div>
                  </th>
                  <th style={{ width: '200px' }} className="px-4 py-3 text-secondary small fw-bold text-uppercase">Thời gian</th>
                  <th className="px-4 py-3 text-secondary small fw-bold text-uppercase">Hoạt động</th>
                  <th style={{ width: '80px' }} className="px-4 py-3 text-end text-secondary small fw-bold text-uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-5"><Loader2 className="animate-spin text-primary" size={32} /></td></tr>
                ) : (data.items?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-5">
                      <FileText size={48} className="text-muted mb-2 opacity-50" />
                      <p className="text-muted mb-0">Chưa có bản ghi nhật ký nào.</p>
                    </td>
                  </tr>
                ) : (
                  data.items?.map(a => (
                    <tr 
                      key={a.id} 
                      className={`${selectedIds.includes(a.id) ? 'table-primary bg-opacity-10' : ''} cursor-pointer hover-bg-light`}
                      onClick={() => setSelectedLog(a)}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="form-check p-0 m-0" style={{ cursor: 'pointer' }} onClick={() => toggleSelectOne(a.id)}>
                          {selectedIds.includes(a.id) ? (
                            <CheckSquare size={18} className="text-primary" />
                          ) : (
                            <Square size={18} className="text-muted" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <Clock size={14} className="text-muted" />
                          <span className="text-nowrap">{new Date(a.createdAt || a.CreatedAt).toLocaleString('vi-VN')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="fw-medium text-dark mb-1">{formatActivity(a)}</div>
                        <div className="small text-muted text-truncate" style={{ maxWidth: '400px' }}>
                          Mục: {a.entityType || a.EntityType} ID {a.entityId || a.EntityId}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="d-flex justify-content-end gap-1">
                          <button
                            className="btn btn-sm p-2 rounded-3 border-0 text-primary"
                            style={{ background: 'rgba(13,110,253,0.1)' }}
                            onClick={() => setSelectedLog(a)}
                            title="Xem chi tiết"
                          >
                            <Info size={14} />
                          </button>
                          <button
                            className="btn btn-sm p-2 rounded-3 border-0 text-danger"
                            style={{ background: 'rgba(220,53,69,0.1)' }}
                            onClick={() => handleDelete(a.id)}
                            disabled={deleting === a.id}
                            title="Xóa bản ghi"
                          >
                            {deleting === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      {(data.total ?? 0) > 0 && (
          <div className="d-flex align-items-center justify-content-between px-4 py-3 border-top bg-light">
            <span className="small text-muted">Tổng {data.total} bản ghi</span>
            <AdminPaginationBar
              page={page}
              totalPages={totalPages}
              disabled={loading}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </div>
        )}
        </div>
      </div>

      {selectedLog && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-bottom p-4">
                <div>
                  <h5 className="modal-title fw-bold">Chi tiết hoạt động</h5>
                  <div className="small text-muted">{new Date(selectedLog.createdAt || selectedLog.CreatedAt).toLocaleString('vi-VN')}</div>
                </div>
                <button type="button" className="btn-close shadow-none" onClick={() => setSelectedLog(null)} />
              </div>
              <div className="modal-body p-4 bg-light">
                <div className="mb-4">
                  <div className="fw-bold text-dark mb-2">Hoạt động</div>
                  <div className="p-3 bg-white rounded-3 border">{formatActivity(selectedLog)}</div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="small fw-bold text-secondary text-uppercase mb-2">Đối tượng</div>
                    <div className="p-2 bg-white rounded-3 border small">{selectedLog.entityType || selectedLog.EntityType} (ID: {selectedLog.entityId || selectedLog.EntityId})</div>
                  </div>
                  <div className="col-md-6">
                    <div className="small fw-bold text-secondary text-uppercase mb-2">Người thực hiện</div>
                    <div className="p-2 bg-white rounded-3 border small">{selectedLog.userName || selectedLog.UserName || 'Hệ thống'}</div>
                  </div>
                </div>

                {(selectedLog.oldValue || selectedLog.OldValue) && (
                  <div className="mb-4">
                    <div className="small fw-bold text-danger text-uppercase mb-2">Dữ liệu cũ</div>
                    <pre className="p-3 bg-white rounded-3 border small mb-0 overflow-auto" style={{ maxHeight: '200px' }}>
                      {selectedLog.oldValue || selectedLog.OldValue}
                    </pre>
                  </div>
                )}

                {(selectedLog.newValue || selectedLog.NewValue) && (
                  <div className="mb-0">
                    <div className="small fw-bold text-success text-uppercase mb-2">Dữ liệu mới</div>
                    <pre className="p-3 bg-white rounded-3 border small mb-0 overflow-auto" style={{ maxHeight: '200px' }}>
                      {selectedLog.newValue || selectedLog.NewValue}
                    </pre>
                  </div>
                )}
              </div>
              <div className="modal-footer border-top p-3 px-4">
                <button type="button" className="btn btn-secondary px-4 rounded-3" onClick={() => setSelectedLog(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AuditLogs;
