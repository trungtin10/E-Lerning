import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { useNotify } from '../../../context/NotifyContext';
import { FileText, Loader2, AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Trash2, Clock } from 'lucide-react';

const AuditLogs = () => {
  const { toast, confirm } = useNotify();
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 50 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);
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

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold tracking-tight mb-1">Nhật ký hoạt động</h2>
          <p className="text-muted small mb-0">Hoạt động đã khởi tạo và thời gian thực hiện.</p>
        </div>
        <div className="d-flex gap-2">
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
                  <th style={{ width: '200px' }} className="px-4 py-3 text-secondary small fw-bold text-uppercase">Thời gian</th>
                  <th className="px-4 py-3 text-secondary small fw-bold text-uppercase">Hoạt động</th>
                  <th style={{ width: '80px' }} className="px-4 py-3 text-end text-secondary small fw-bold text-uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} className="text-center py-5"><Loader2 className="animate-spin text-primary" size={32} /></td></tr>
                ) : (data.items?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-5">
                      <FileText size={48} className="text-muted mb-2 opacity-50" />
                      <p className="text-muted mb-0">Chưa có bản ghi nhật ký nào.</p>
                    </td>
                  </tr>
                ) : (
                  data.items?.map(a => (
                    <tr key={a.id}>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <Clock size={14} className="text-muted" />
                          <span className="text-nowrap">{new Date(a.createdAt || a.CreatedAt).toLocaleString('vi-VN')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatActivity(a)}</td>
                      <td className="px-4 py-3 text-end">
                        <button
                          className="btn btn-sm p-2 rounded-3 border-0 text-danger"
                          style={{ background: 'rgba(220,53,69,0.1)' }}
                          onClick={() => handleDelete(a.id)}
                          disabled={deleting === a.id}
                          title="Xóa bản ghi"
                        >
                          {deleting === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
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
            <div className="d-flex gap-2 align-items-center">
              <button
                className="btn btn-sm btn-outline-secondary rounded-3"
                disabled={page <= 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="small fw-medium">Trang {page} / {totalPages}</span>
              <button
                className="btn btn-sm btn-outline-secondary rounded-3"
                disabled={page >= totalPages || loading}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuditLogs;
