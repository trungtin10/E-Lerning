import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { useNotify } from '../../../context/NotifyContext';
import { Layers, Plus, Edit2, Trash2, Loader2, Save, Search, ChevronRight, ChevronLeft } from 'lucide-react';

const PAGE_SIZE = 10;

const Categories = () => {
  const navigate = useNavigate();
  const { toast, confirm } = useNotify();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredCategories.length / PAGE_SIZE) || 1;
  const paginatedCategories = filteredCategories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    const total = Math.ceil(filteredCategories.length / PAGE_SIZE) || 1;
    setPage(p => (p > total && total > 0) ? 1 : p);
  }, [filteredCategories.length]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/course/categories');
      setCategories(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/course/categories/${editingId}`, formData);
      } else {
        await api.post('/course/categories', formData);
      }
      setFormData({ name: '', description: '' });
      setShowAddModal(false);
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      toast('Lỗi khi lưu danh mục.', 'error');
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ title: 'Xóa danh mục', message: 'Xóa danh mục này?', confirmText: 'Xóa' });
    if (!ok) return;
    try {
      await api.delete(`/course/categories/${id}`);
      toast('Đã xóa danh mục.', 'success');
      fetchCategories();
    } catch (err) {
      toast('Không thể xóa danh mục đang có khóa học liên quan.', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold tracking-tight mb-1">Danh mục Khóa học</h2>
          <p className="text-muted small">Nhấn vào tên danh mục để xem các khóa học thuộc chuyên ngành đó.</p>
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
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} /> Tạo mới
        </button>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="input-group bg-light border-0 rounded-3 px-2">
            <span className="input-group-text bg-transparent border-0 text-muted"><Search size={18} /></span>
            <input type="text" className="form-control bg-transparent border-0 py-2" placeholder="Tìm kiếm danh mục..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} />
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive admin-table-framed-wrapper">
          <table className="table table-hover align-middle mb-0 admin-table-framed">
            <thead className="bg-light border-bottom">
              <tr>
                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase" style={{ width: '60px' }}>#</th>
                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Tên danh mục (Chuyên ngành)</th>
                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Mô tả chi tiết</th>
                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="text-center py-5"><Loader2 className="animate-spin text-primary" size={32} /></td></tr>
              ) : (
                paginatedCategories.map((cat, index) => (
                  <tr key={cat.id}>
                    <td className="px-4 py-3 text-muted small">{(page - 1) * PAGE_SIZE + index + 1}</td>
                    <td className="py-3">
                      <div
                        className="d-flex align-items-center gap-2 cursor-pointer group"
                        onClick={() => navigate(`/admin/categories/${cat.id}/courses`)}
                      >
                        <div className="p-1.5 bg-primary-subtle rounded text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <Layers size={14} />
                        </div>
                        <span className="fw-bold text-dark group-hover:text-primary transition-all">{cat.name}</span>
                        <ChevronRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </td>
                    <td className="py-3 text-muted small">{cat.description || <em className="opacity-50">Chưa có mô tả</em>}</td>
                    <td className="px-4 py-3 text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-white btn-sm p-2 rounded-3 border shadow-sm text-primary hover-bg-primary-subtle transition-all" onClick={() => { setEditingId(cat.id); setFormData({ name: cat.name, description: cat.description || '' }); setShowAddModal(true); }}><Edit2 size={16} /></button>
                        <button className="btn btn-white btn-sm p-2 rounded-3 border shadow-sm text-danger hover-bg-danger-subtle transition-all" onClick={() => handleDelete(cat.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredCategories.length > 0 && (
          <div className="d-flex align-items-center justify-content-between px-4 py-3 border-top bg-light">
            <span className="small text-muted">Tổng {filteredCategories.length} danh mục • Trang {page}/{totalPages}</span>
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

      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header border-0 p-4 pb-0">
                <h5 className="fw-bold mb-0">{editingId ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowAddModal(false); setEditingId(null); setFormData({ name: '', description: '' }); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Tên danh mục *</label>
                    <input type="text" required className="form-control rounded-3" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Mô tả</label>
                    <textarea className="form-control rounded-3" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0">
                  <button type="button" className="btn btn-light px-4 fw-bold" onClick={() => { setShowAddModal(false); setEditingId(null); }}>Hủy</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold shadow-sm"><Save size={18} className="me-1" /> {editingId ? 'Cập nhật' : 'Lưu danh mục'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .btn-white { background: white; }
        .hover-bg-primary-subtle:hover { background-color: var(--bs-primary-bg-subtle) !important; }
        .hover-bg-danger-subtle:hover { background-color: var(--bs-danger-bg-subtle) !important; }
      `}</style>
    </AdminLayout>
  );
};

export default Categories;
