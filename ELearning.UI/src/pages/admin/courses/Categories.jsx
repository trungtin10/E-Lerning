import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { Layers, Plus, Edit2, Trash2, Loader2, Save, X, Search, ChevronRight } from 'lucide-react';

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

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
      alert('Lỗi khi lưu danh mục.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa danh mục này?')) return;
    try {
      await api.delete(`/course/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert('Không thể xóa danh mục đang có khóa học liên quan.');
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold tracking-tight mb-1">Danh mục Khóa học</h2>
          <p className="text-muted small">Nhấn vào tên danh mục để xem các khóa học thuộc chuyên ngành đó.</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 rounded-3 shadow-sm fw-bold" onClick={() => setShowAddModal(true)}>
          <Plus size={20} /> Thêm danh mục
        </button>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="input-group bg-light border-0 rounded-3 px-2">
            <span className="input-group-text bg-transparent border-0 text-muted"><Search size={18} /></span>
            <input type="text" className="form-control bg-transparent border-0 py-2" placeholder="Tìm kiếm danh mục..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
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
                filteredCategories.map((cat, index) => (
                  <tr key={cat.id}>
                    <td className="px-4 py-3 text-muted small">{index + 1}</td>
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
