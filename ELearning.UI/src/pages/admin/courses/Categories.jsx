import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { useNotify } from '../../../context/NotifyContext';
import { Layers, Plus, Edit2, Trash2, Loader2, Save, Search, ChevronRight, Building2, MoreVertical } from 'lucide-react';
import AdminPaginationBar from '../../../components/common/AdminPaginationBar';

const PAGE_SIZE = 10;

function readUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

const Categories = () => {
  const navigate = useNavigate();
  const { toast, confirm } = useNotify();
  const isSuperAdmin = readUser().roles?.includes('SuperAdmin');

  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', companyId: '' });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;
    api
      .get('/superadmin/companies')
      .then((r) => setCompanies(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCompanies([]));
  }, [isSuperAdmin]);

  const companyNameById = React.useMemo(() => {
    const m = new Map();
    (companies || []).forEach((c) => m.set(c.id, c.companyName || c.CompanyName || ''));
    return m;
  }, [companies]);

  const categoryCompanyLabel = (cat) => {
    const cid = cat.companyId ?? cat.CompanyId;
    if (cid == null || cid === '') return 'Hệ thống tổng';
    return companyNameById.get(cid) || `Công ty #${cid}`;
  };

  const filteredCategories = categories.filter((cat) => {
    const name = (cat.name || '').toLowerCase();
    if (!name.includes(searchTerm.toLowerCase())) return false;
    if (!isSuperAdmin || companyFilter === '') return true;
    const cid = cat.companyId ?? cat.CompanyId;
    if (companyFilter === 'system') return cid == null;
    return String(cid) === String(companyFilter);
  });
  const totalPages = Math.ceil(filteredCategories.length / PAGE_SIZE) || 1;
  const paginatedCategories = filteredCategories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    const total = Math.ceil(filteredCategories.length / PAGE_SIZE) || 1;
    setPage(p => (p > total && total > 0) ? 1 : p);
  }, [filteredCategories.length]);

  const colCount = isSuperAdmin ? 4 : 3;

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
      setFormData({ name: '', description: '', companyId: '' });
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
          className="btn btn-admin-create d-flex align-items-center gap-2"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} /> Tạo mới
        </button>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {isSuperAdmin && (
              <div className="col-12 col-md-auto">
                <select
                  className="form-select form-select-sm border-secondary-subtle"
                  style={{ minWidth: 220 }}
                  value={companyFilter}
                  onChange={(e) => {
                    setCompanyFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Tất cả công ty</option>
                  <option value="system">Hệ thống tổng (danh mục chung)</option>
                  {[...companies]
                    .sort((a, b) => (a.companyName || '').localeCompare(b.companyName || '', 'vi'))
                    .map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.companyName}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <div className="col">
              <div className="input-group bg-light border-0 rounded-3 px-2">
                <span className="input-group-text bg-transparent border-0 text-muted">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  className="form-control bg-transparent border-0 py-2"
                  placeholder="Tìm kiếm danh mục..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
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
                {isSuperAdmin && (
                  <th className="py-3 border-0 text-secondary small fw-bold text-uppercase" style={{ minWidth: 160 }}>
                    <span className="d-inline-flex align-items-center gap-1">
                      <Building2 size={14} className="opacity-75" /> Công ty
                    </span>
                  </th>
                )}
                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="text-center py-5">
                    <Loader2 className="animate-spin text-primary" size={32} />
                  </td>
                </tr>
              ) : paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="text-center py-5 text-muted">
                    {categories.length === 0 ? 'Chưa có danh mục nào.' : 'Không có danh mục phù hợp bộ lọc.'}
                  </td>
                </tr>
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
                    {isSuperAdmin && (
                      <td className="py-3 small">
                        <span className="text-dark fw-medium">{categoryCompanyLabel(cat)}</span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-end">
                      <div className="dropdown">
                        <button
                          className="btn btn-white btn-sm p-2 rounded-3 text-secondary border shadow-sm transition-all"
                          type="button"
                          data-bs-toggle="dropdown"
                          data-bs-popper-config={JSON.stringify({ strategy: 'fixed' })}
                          data-bs-boundary="viewport"
                          data-bs-offset="0,8"
                          aria-expanded="false"
                        >
                          <MoreVertical size={16} />
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3">
                          <li>
                            <button className="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => { setEditingId(cat.id); setFormData({ name: cat.name, description: cat.description || '', companyId: (cat.companyId ?? cat.CompanyId) || '' }); setShowAddModal(true); }}>
                              <Edit2 size={16} className="text-primary" /> Chỉnh sửa
                            </button>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <button className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" onClick={() => handleDelete(cat.id)}>
                              <Trash2 size={16} /> Xóa danh mục
                            </button>
                          </li>
                        </ul>
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
            <span className="small text-muted">Tổng {filteredCategories.length} danh mục</span>
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

      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header border-0 p-4 pb-0">
                <h5 className="fw-bold mb-0">{editingId ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowAddModal(false); setEditingId(null); setFormData({ name: '', description: '', companyId: '' }); }}></button>
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
                  {isSuperAdmin && (
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Thuộc về công ty</label>
                      <select className="form-select rounded-3" value={formData.companyId} onChange={e => setFormData({...formData, companyId: e.target.value})}>
                        <option value="">Hệ thống tổng (Dùng chung)</option>
                        {companies.map(comp => <option key={comp.id} value={comp.id}>{comp.companyName}</option>)}
                      </select>
                    </div>
                  )}
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
