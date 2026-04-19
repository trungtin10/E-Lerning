import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../api/axios';
import { useNotify } from '../../context/NotifyContext';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Search, UserPlus, Mail, Eye, EyeOff,
  Trash2, Loader2, UserCircle, ShieldCheck, Users, XCircle, MoreVertical, Edit2, Filter, X,
  Lock, Unlock
} from 'lucide-react';

/** Email hiển thị: API camelCase/PascalCase + fallback account dạng email */
function resolveUserEmail(user) {
  if (!user) return '';
  const raw = user.email ?? user.Email;
  const e = typeof raw === 'string' ? raw.trim() : '';
  if (e) return e;
  const acc = (user.account ?? user.Account ?? '').trim();
  if (acc.includes('@')) return acc;
  return '';
}

/** Trạng thái hoạt động tài khoản (tạm khóa = IsActive false) */
function isAccountActive(u) {
  if (!u) return true;
  if (u.isActive === false || u.IsActive === false) return false;
  return true;
}

function roleBadgeClass(role) {
  switch (role) {
    case 'SuperAdmin':
      return 'bg-danger-subtle text-danger border border-danger-subtle';
    case 'Admin':
      return 'bg-primary-subtle text-primary border border-primary-subtle';
    case 'Instructor':
      return 'bg-info-subtle text-info border border-info-subtle';
    case 'Student':
      return 'bg-success-subtle text-success border border-success-subtle';
    default:
      return 'bg-light text-dark border';
  }
}

const CompanyUsers = () => {
  const { subDomain } = useParams();
  const navigate = useNavigate();
  const { toast, confirm } = useNotify();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const isSuperAdmin = Array.isArray(user?.roles)
    ? user.roles.includes('SuperAdmin')
    : String(user?.roles ?? user?.role ?? '').includes('SuperAdmin');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  /** '' = tất cả vai trò */
  const [roleFilter, setRoleFilter] = useState('');
  const [showPasswords, setShowPasswords] = useState({});
  const [resending, setResending] = useState({});
  const [togglingActive, setTogglingActive] = useState({});

  // Add Employee Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit Employee States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    fullName: '',
    email: '',
    role: ''
  });

  // Account Details Modal
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    account: '',
    email: '', // THÊM
    password: '',
    role: (subDomain === 'system' && isSuperAdmin) ? 'SuperAdmin' : 'Admin'
  });
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchCompanyUsers();
    fetchCompanies();
  }, [subDomain]);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/superadmin/companies');
      setCompanies(response.data);
    } catch (err) { console.error(err); }
  };

  const fetchCompanyUsers = async () => {
    try {
      const endpoint = isSuperAdmin 
        ? `/superadmin/users?subDomain=${subDomain}` 
        : '/admin/users';
      const response = await api.get(endpoint);
      setUsers(response.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleResendActivation = async (userId) => {
    if (!isSuperAdmin) {
      toast('Tính năng này chỉ dành cho SuperAdmin.', 'warning');
      return;
    }
    setResending(prev => ({ ...prev, [userId]: true }));
    try {
      await api.post(`/superadmin/users/${userId}/resend-activation`);
      toast('Đã gửi lại email kích hoạt thành công! Bộ đếm 24h đã được reset.', 'success');
      fetchCompanyUsers(); // Tải lại để cập nhật trạng thái
    } catch (err) {
      toast('Lỗi khi gửi lại email.', 'error');
    } finally {
      setResending(prev => ({ ...prev, [userId]: false }));
    }
  };

  const togglePassword = (userId) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleSetUserActive = async (row, nextActive) => {
    const actionLabel = nextActive ? 'mở khóa' : 'tạm khóa';
    const ok = await confirm({
      title: nextActive ? 'Mở khóa tài khoản' : 'Tạm khóa tài khoản',
      message: `Bạn có chắc muốn ${actionLabel} tài khoản "${row.fullName}" (${row.account})? ${nextActive ? '' : 'Người dùng sẽ bị đăng xuất khỏi mọi phiên đang đăng nhập.'}`,
      confirmText: nextActive ? 'Mở khóa' : 'Tạm khóa',
    });
    if (!ok) return;
    const uid = row.id;
    setTogglingActive((prev) => ({ ...prev, [uid]: true }));
    try {
      const endpoint = isSuperAdmin ? `/superadmin/users/${uid}/active` : `/admin/users/${uid}/active`;
      await api.patch(endpoint, { isActive: nextActive });
      toast(nextActive ? 'Đã mở khóa tài khoản.' : 'Đã tạm khóa tài khoản.', 'success');
      fetchCompanyUsers();
    } catch (err) {
      const msg = err.response?.data;
      toast(typeof msg === 'string' ? msg : msg?.message || 'Không thể cập nhật trạng thái tài khoản.', 'error');
    } finally {
      setTogglingActive((prev) => ({ ...prev, [uid]: false }));
    }
  };

  const handleDeleteUser = async (userId, userRole, e) => {
    e.stopPropagation();
    if (userRole === 'SuperAdmin' && !isSuperAdmin) {
      toast('Chỉ SuperAdmin mới có quyền xóa tài khoản này!', 'warning');
      return;
    }
    const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;
    if (userId === currentUserId) {
      toast('Bạn không thể tự xóa chính mình!', 'warning');
      return;
    }
    const ok = await confirm({ title: 'Xóa nhân viên', message: 'Bạn có chắc chắn muốn xóa nhân viên này khỏi hệ thống? Phép toán này không thể hoàn tác.', confirmText: 'Xóa' });
    if (!ok) return;
    try {
      const endpoint = isSuperAdmin ? `/superadmin/users/${userId}` : `/admin/users/${userId}`;
      await api.delete(endpoint);
      toast('Đã xóa nhân viên thành công.', 'success');
      fetchCompanyUsers();
    } catch (err) {
      toast(err.response?.data || 'Lỗi khi xóa nhân viên.', 'error');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra Gmail hợp lệ
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      toast('Vui lòng nhập địa chỉ Email đúng định dạng (VD: abc@gmail.com).', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (isSuperAdmin) {
        let companyId = null;
        if (subDomain !== 'system') {
          const company = companies.find(c => c.subDomain === subDomain);
          if (company) {
            companyId = company.id;
          } else {
            throw new Error('Đang tải dữ liệu công ty, vui lòng thử lại.');
          }
        }
        await api.post('/superadmin/users', {
          Account: formData.account,
          Email: formData.email, // THÊM
          FullName: formData.fullName,
          CompanyId: companyId,
          Password: formData.password,
          Role: formData.role
        });
      } else {
        await api.post('/admin/users', {
          Account: formData.account,
          Email: formData.email, // THÊM
          FullName: formData.fullName,
          Password: formData.password,
          Role: formData.role
        });
      }

      toast('Thêm nhân viên thành công!', 'success');
      setShowAddModal(false);
      setFormData({ ...formData, fullName: '', account: '', email: '', password: '' });
      fetchCompanyUsers();
    } catch (err) {
      toast(err.response?.data || err.message || 'Lỗi khi thêm nhân viên.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openAccountDetails = (user) => {
    setSelectedUser(user);
    setShowAccountModal(true);
  };

  const handeEditUser = (user) => {
    setEditFormData({
      id: user.id,
      fullName: user.fullName || '',
      email: resolveUserEmail(user),
      role: user.role || 'User'
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = isSuperAdmin ? `/superadmin/users/${editFormData.id}` : `/admin/users/${editFormData.id}`;
      await api.put(endpoint, {
        fullName: editFormData.fullName,
        email: editFormData.email,
        role: editFormData.role
      });
      toast('Cập nhật nhân viên thành công!', 'success');
      setShowEditModal(false);
      fetchCompanyUsers();
    } catch (err) {
      toast(err.response?.data || err.message || 'Lỗi khi cập nhật nhân viên.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const uniqueRoles = useMemo(() => {
    const set = new Set(users.map((u) => u.role).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      const byRole = !roleFilter || u.role === roleFilter;
      if (!byRole) return false;
      if (!q) return true;
      const email = resolveUserEmail(u).toLowerCase();
      return (
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        (u.account && u.account.toLowerCase().includes(q)) ||
        email.includes(q)
      );
    });
  }, [users, searchTerm, roleFilter]);

  const hasActiveFilters = Boolean(searchTerm.trim() || roleFilter);

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
  };

  return (
    <AdminLayout>
      <div className="mb-4 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-white rounded-circle p-2 shadow-sm border" onClick={() => navigate(isSuperAdmin ? '/admin/users' : '/admin/dashboard')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="fw-bold tracking-tight mb-0">Danh sách nhân sự</h2>
            <p className="text-muted small mb-0">
              {isSuperAdmin ? (
                <span>Đơn vị: <span className="text-primary fw-bold">{subDomain === 'system' ? 'Hệ Thống Tổng' : subDomain?.toUpperCase()}</span></span>
              ) : (
                <span>Quản lý nhân viên công ty</span>
              )}
            </p>
          </div>
        </div>
        <button
          className="btn btn-admin-create d-flex align-items-center gap-2"
          onClick={() => setShowAddModal(true)}
        >
          <UserPlus size={20} /> Tạo mới
        </button>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ border: '1px solid rgba(17,24,39,0.08)' }}>
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-lg-3">
              <select className="form-select form-select-sm bg-light border-0 rounded-3" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">Chọn vai trò</option>
                {uniqueRoles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-12 col-lg-7">
              <div className="input-group input-group-sm bg-light border-0 rounded-3 px-2">
                <span className="input-group-text bg-transparent border-0 text-muted"><Search size={16} /></span>
                <input
                  type="search"
                  className="form-control bg-transparent border-0"
                  placeholder="Tìm họ tên, tài khoản, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="col-12 col-lg-2 d-flex justify-content-lg-end gap-2">
              <button type="button" className="btn btn-sm btn-outline-secondary px-3 rounded-3 d-flex align-items-center gap-2" onClick={clearFilters} disabled={!hasActiveFilters}>
                <X size={16} /> Xóa
              </button>
              <div className="btn btn-sm btn-outline-secondary px-3 rounded-3 d-flex align-items-center gap-2" style={{ pointerEvents: 'none', opacity: 0.7 }}>
                <Filter size={16} /> {filteredUsers.length}/{users.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4" style={{ overflow: 'visible' }}>
        <div className="table-responsive admin-table-framed-wrapper" style={{ overflow: 'visible' }}>
          <table className="table table-hover align-middle mb-0 admin-table-framed">
            <thead className="bg-light border-bottom">
              <tr>
                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase">Họ và tên</th>
                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Tài khoản & Email</th>
                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Trạng thái kích hoạt</th>
                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Vai trò</th>
                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-5"><Loader2 className="animate-spin text-primary" size={32} /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted">Chưa có nhân viên nào trong đơn vị này.</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted">Không có nhân viên khớp bộ lọc. Thử đổi từ khóa hoặc vai trò.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <motion.div whileHover={{ x: 5 }} className="fw-bold text-dark">{user.fullName}</motion.div>
                    </td>
                    <td className="py-3">
                      <div 
                        className="text-primary fw-bold small text-decoration-underline" 
                        onClick={() => openAccountDetails(user)}
                        style={{ cursor: 'pointer' }}
                      >
                        {user.account}
                      </div>
                      <div className="text-muted small d-flex align-items-center gap-1 mt-1">
                        <Mail size={12} /> {resolveUserEmail(user) || 'Chưa cập nhật'}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="d-flex flex-column gap-2 align-items-start">
                        {user.emailConfirmed ? (
                          <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill fw-bold" style={{ fontSize: '0.65rem' }}>ĐÃ KÍCH HOẠT</span>
                        ) : user.isExpired ? (
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill fw-bold" style={{ fontSize: '0.65rem' }}>
                              <XCircle size={12} className="me-1" /> ĐÃ HỦY (QUÁ 24H)
                            </span>
                            <button
                              className="btn btn-link p-0 text-primary small fw-bold text-decoration-none"
                              onClick={() => handleResendActivation(user.id)}
                              disabled={resending[user.id]}
                              title="Gửi lại mail để reset bộ đếm 24h"
                            >
                              {resending[user.id] ? <Loader2 size={14} className="animate-spin" /> : 'Kích hoạt lại'}
                            </button>
                          </div>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning px-3 py-2 rounded-pill fw-bold" style={{ fontSize: '0.65rem' }}>CHỜ XÁC NHẬN</span>
                        )}
                        {!isAccountActive(user) && (
                          <span className="badge bg-secondary px-3 py-2 rounded-pill fw-bold d-inline-flex align-items-center gap-1" style={{ fontSize: '0.65rem' }}>
                            <Lock size={12} /> TẠM KHÓA
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`badge px-3 py-2 rounded-pill fw-bold ${roleBadgeClass(user.role)}`} style={{ fontSize: '0.65rem' }}>
                        {user.role || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="dropdown">
                        <button
                          className="btn btn-white btn-sm p-2 rounded-3 text-secondary border shadow-sm transition-all"
                          type="button"
                          data-bs-toggle="dropdown"
                          data-bs-popper-config={JSON.stringify({ strategy: 'fixed' })}
                          data-bs-offset="0,8"
                          aria-expanded="false"
                        >
                          <MoreVertical size={16} />
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3">
                          <li>
                            <button className="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => handeEditUser(user)}>
                              <Edit2 size={16} className="text-primary" /> Chỉnh sửa
                            </button>
                          </li>
                          {(user.role !== 'SuperAdmin' || isSuperAdmin) && user.id !== JSON.parse(localStorage.getItem('user') || '{}').id && (
                            <li>
                              <button
                                type="button"
                                className="dropdown-item d-flex align-items-center gap-2 py-2"
                                disabled={togglingActive[user.id]}
                                onClick={() => handleSetUserActive(user, !isAccountActive(user))}
                              >
                                {isAccountActive(user) ? (
                                  <>
                                    <Lock size={16} className="text-warning" /> Tạm khóa tài khoản
                                  </>
                                ) : (
                                  <>
                                    <Unlock size={16} className="text-success" /> Mở khóa tài khoản
                                  </>
                                )}
                              </button>
                            </li>
                          )}
                          <li>
                            <button className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" onClick={(e) => handleDeleteUser(user.id, user.role, e)}>
                              <Trash2 size={16} /> Xóa
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
      </div>

      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="fw-bold mb-0">Thêm nhân viên mới</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleAddSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-secondary small">Họ và tên</label>
                    <input type="text" className="form-control rounded-3" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-secondary small">Email (Gmail)</label>
                    <input type="email" className="form-control rounded-3" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-secondary small">Tên tài khoản</label>
                    <input type="text" className="form-control rounded-3" value={formData.account} onChange={e => setFormData({ ...formData, account: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-secondary small">Mật khẩu</label>
                    <div className="input-group">
                      <input type={showAddPassword ? "text" : "password"} className="form-control rounded-3" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required minLength={6} />
                      <button type="button" className="btn btn-outline-secondary rounded-3 ms-2 d-flex align-items-center" onClick={() => setShowAddPassword(!showAddPassword)} style={{ border: '1px solid #dee2e6' }}>
                        {showAddPassword ? <EyeOff size={18} className="text-muted" /> : <Eye size={18} className="text-muted" />}
                      </button>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-bold text-secondary small">Vai trò</label>
                    <select className="form-select rounded-3" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                      {subDomain === 'system' && isSuperAdmin ? (
                        <>
                          <option value="SuperAdmin">SuperAdmin</option>
                          <option value="Admin">Admin</option>
                          <option value="Editor">Biên tập</option>
                          <option value="User">User</option>
                        </>
                      ) : (
                        <>
                          <option value="Admin">Admin</option>
                          <option value="Editor">Biên tập</option>
                          <option value="User">User</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-light fw-bold rounded-3" onClick={() => setShowAddModal(false)}>Hủy</button>
                    <button type="submit" className="btn btn-primary fw-bold rounded-3" disabled={submitting}>
                      {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Xác nhận tạo'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="fw-bold mb-0">Chỉnh sửa nhân viên</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleEditSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-secondary small">Họ và tên</label>
                    <input type="text" className="form-control rounded-3" value={editFormData.fullName} onChange={e => setEditFormData({ ...editFormData, fullName: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-secondary small">Email</label>
                    <input type="email" className="form-control rounded-3" value={editFormData.email} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} required />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-bold text-secondary small">Vai trò</label>
                    <select className="form-select rounded-3" value={editFormData.role} onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}>
                      {subDomain === 'system' && isSuperAdmin ? (
                        <>
                          <option value="SuperAdmin">SuperAdmin</option>
                          <option value="Admin">Admin</option>
                          <option value="Editor">Biên tập</option>
                          <option value="User">User</option>
                        </>
                      ) : (
                        <>
                          <option value="Admin">Admin</option>
                          <option value="Editor">Biên tập</option>
                          <option value="User">User</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-light fw-bold rounded-3" onClick={() => setShowEditModal(false)}>Hủy</button>
                    <button type="submit" className="btn btn-primary fw-bold rounded-3" disabled={submitting}>
                      {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Account Info Modal */}
      {showAccountModal && selectedUser && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="fw-bold mb-0">Thông tin tài khoản</h5>
                <button type="button" className="btn-close" onClick={() => setShowAccountModal(false)}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <div className="mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle mb-3" style={{ width: '80px', height: '80px' }}>
                    <UserCircle size={48} />
                  </div>
                  <h4 className="fw-bold mb-1">{selectedUser.fullName}</h4>
                  <p className="text-muted small mb-0 d-flex align-items-center justify-content-center gap-2">
                    <ShieldCheck size={16} className="text-secondary" />
                    {selectedUser.role} 
                    {selectedUser.companyName && ` - ${selectedUser.companyName}`}
                  </p>
                </div>
                
                <div className="card border shadow-sm rounded-4 text-start">
                  <div className="list-group list-group-flush rounded-4">
                    <div className="list-group-item p-3">
                      <div className="small text-muted mb-1 fw-bold">Tài khoản đăng nhập</div>
                      <div className="fw-bold text-dark">{selectedUser.account}</div>
                    </div>
                    <div className="list-group-item p-3">
                      <div className="small text-muted mb-1 fw-bold">Email (Gmail)</div>
                      <div className="d-flex align-items-center gap-2">
                        <Mail size={16} className="text-primary" />
                        <span className="fw-medium text-dark">{resolveUserEmail(selectedUser) || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                    <div className="list-group-item p-3">
                      <div className="small text-muted mb-1 fw-bold">Trạng thái xác thực</div>
                      {selectedUser.emailConfirmed ? (
                         <span className="badge bg-success-subtle text-success px-2 py-1 rounded-pill">Đã xác minh</span>
                      ) : (
                         <span className="badge bg-warning-subtle text-warning px-2 py-1 rounded-pill">Chưa xác minh</span>
                      )}
                    </div>
                    <div className="list-group-item p-3">
                      <div className="small text-muted mb-1 fw-bold">Truy cập tài khoản</div>
                      {isAccountActive(selectedUser) ? (
                        <span className="badge bg-success-subtle text-success px-2 py-1 rounded-pill">Đang hoạt động</span>
                      ) : (
                        <span className="badge bg-secondary px-2 py-1 rounded-pill d-inline-flex align-items-center gap-1">
                          <Lock size={12} /> Tạm khóa
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top-0 d-flex justify-content-center">
                <button type="button" className="btn btn-light fw-bold rounded-3 px-4" onClick={() => setShowAccountModal(false)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CompanyUsers;
