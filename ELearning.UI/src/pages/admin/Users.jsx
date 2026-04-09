import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import { Search, Building2, Shield, Mail, Loader2, Info, X, Filter } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/superadmin/users');
      setUsers(response.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.trim().toLowerCase();
    const byRole = !roleFilter || u.role === roleFilter;
    if (!byRole) return false;
    if (!q) return true;
    return (
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.account || '').toLowerCase().includes(q) ||
      (u.companyName || '').toLowerCase().includes(q) ||
      (u.subDomain || '').toLowerCase().includes(q)
    );
  });

  const uniqueRoles = Array.from(new Set(users.map((u) => u.role).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'vi'));
  const allChecked = filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds[u.id]);
  const anyChecked = Object.values(selectedIds).some(Boolean);

  const toggleAll = () => {
    if (allChecked) {
      const next = { ...selectedIds };
      filteredUsers.forEach((u) => { delete next[u.id]; });
      setSelectedIds(next);
      return;
    }
    const next = { ...selectedIds };
    filteredUsers.forEach((u) => { next[u.id] = true; });
    setSelectedIds(next);
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
  };

  return (
    <AdminLayout>
      <div className="mb-3">
        <h2 className="fw-bold mb-1">Danh sách người dùng</h2>
        <p className="text-muted small mb-0">Quản lý đơn vị và tài khoản quản trị. Có thể lọc nhanh theo vai trò, tìm kiếm và xem chi tiết.</p>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-3">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-3">
              <select className="form-select form-select-sm bg-light border-0 rounded-3" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">Chọn vai trò</option>
                {uniqueRoles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-5">
              <div className="input-group input-group-sm bg-light border-0 rounded-3 px-2">
                <span className="input-group-text bg-transparent border-0 text-muted"><Search size={16} /></span>
                <input
                  type="text"
                  className="form-control bg-transparent border-0"
                  placeholder="Tìm theo công ty, tài khoản, subDomain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-4 d-flex justify-content-md-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2 rounded-3 px-3"
                onClick={clearFilters}
              >
                <X size={16} /> Xóa lọc
              </button>
              <div className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2 rounded-3 px-3" style={{ pointerEvents: 'none', opacity: 0.65 }}>
                <Filter size={16} /> {filteredUsers.length}
              </div>
            </div>
          </div>
          {anyChecked && (
            <div className="mt-2 small text-muted">
              Đã chọn <strong className="text-dark">{Object.values(selectedIds).filter(Boolean).length}</strong> mục.
            </div>
          )}
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive admin-table-framed-wrapper">
          <table className="table table-hover align-middle mb-0 admin-table-framed admin-table-compact">
            <thead className="bg-light border-bottom">
              <tr>
                <th className="px-3 py-3 border-0" style={{ width: 40 }}>
                  <input className="form-check-input" type="checkbox" checked={allChecked} onChange={toggleAll} />
                </th>
                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase" style={{ width: 56 }}>STT</th>
                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Đơn vị / Tài khoản</th>
                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase" style={{ width: 150 }}>Vai trò</th>
                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase text-center" style={{ width: 140 }}>Trạng thái</th>
                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase text-end" style={{ width: 96 }}>View</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <Loader2 className="animate-spin text-muted" size={28} />
                    <div className="text-muted small mt-2">Đang tải dữ liệu...</div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-5 text-muted">Không có dữ liệu.</td></tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr key={user.id}>
                    <td className="px-3 py-3">
                      <input className="form-check-input" type="checkbox" checked={Boolean(selectedIds[user.id])} onChange={() => toggleOne(user.id)} />
                    </td>
                    <td className="py-3 text-muted small">{idx + 1}</td>
                    <td className="py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center rounded-3"
                          style={{
                            width: 30,
                            height: 30,
                            background: user.companyName ? 'rgba(37,99,235,0.10)' : 'rgba(239,68,68,0.10)',
                            color: user.companyName ? '#2563eb' : '#ef4444',
                            border: '1px solid rgba(17,24,39,0.08)',
                          }}
                        >
                          {user.companyName ? <Building2 size={16} /> : <Shield size={16} />}
                        </div>
                        <div className="min-w-0">
                          <div className="fw-semibold text-dark text-truncate">{user.companyName || 'Hệ thống tổng'}</div>
                          <div className="text-muted small d-flex align-items-center gap-1">
                            <Mail size={12} className="opacity-60" /> {user.account}
                            {user.subDomain && <span className="ms-2 text-muted">({user.subDomain})</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className="badge rounded-pill px-3 py-2"
                        style={{
                          fontSize: '0.7rem',
                          background: user.role === 'SuperAdmin' ? 'rgba(239,68,68,0.12)' : 'rgba(37,99,235,0.10)',
                          border: '1px solid rgba(17,24,39,0.10)',
                          color: user.role === 'SuperAdmin' ? '#b91c1c' : '#2563eb',
                          fontWeight: 650,
                        }}
                      >
                        {user.role === 'SuperAdmin' ? 'QUẢN TRỊ TỔNG' : 'QUẢN TRỊ VIÊN'}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="d-inline-flex align-items-center gap-2 small fw-semibold">
                        <span
                          className="rounded-circle"
                          style={{
                            width: 8,
                            height: 8,
                            background: user.emailConfirmed ? '#16a34a' : '#f59e0b',
                          }}
                        />
                        <span className="text-muted">{user.emailConfirmed ? 'Đã kích hoạt' : 'Chờ xác nhận'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button
                        className="btn btn-white btn-sm p-2 rounded-3 border"
                        onClick={() => navigate(`/admin/company-users/${user.subDomain || 'system'}`)}
                        title="Xem danh sách nhân viên"
                      >
                        <Info size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Users;
