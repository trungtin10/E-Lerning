import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Search, UserPlus, Mail, Eye, EyeOff,
  Trash2, Loader2, UserCircle, ShieldCheck, Users, RefreshCw, AlertCircle, XCircle
} from 'lucide-react';

const CompanyUsers = () => {
  const { subDomain } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const isSuperAdmin = user.roles?.includes('SuperAdmin');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswords, setShowPasswords] = useState({});
  const [resending, setResending] = useState({});

  // Add Employee Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    account: '',
    email: '', // THÊM
    password: '',
    role: subDomain === 'system' ? 'SuperAdmin' : 'Admin'
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
      alert('Tính năng này chỉ dành cho SuperAdmin.');
      return;
    }
    setResending(prev => ({ ...prev, [userId]: true }));
    try {
      await api.post(`/superadmin/users/${userId}/resend-activation`);
      alert('Đã gửi lại email kích hoạt thành công! Bộ đếm 24h đã được reset.');
      fetchCompanyUsers(); // Tải lại để cập nhật trạng thái
    } catch (err) {
      alert('Lỗi khi gửi lại email.');
    } finally {
      setResending(prev => ({ ...prev, [userId]: false }));
    }
  };

  const togglePassword = (userId) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleDeleteUser = async (userId, userRole, e) => {
    e.stopPropagation();
    if (userRole === 'SuperAdmin') {
      alert('Không thể xóa tài khoản SuperAdmin!');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này khỏi hệ thống? Phép toán này không thể hoàn tác.')) {
      try {
        const endpoint = isSuperAdmin ? `/superadmin/users/${userId}` : `/admin/users/${userId}`;
        await api.delete(endpoint);
        alert('Đã xóa nhân viên thành công.');
        fetchCompanyUsers();
      } catch (err) {
        alert(err.response?.data || 'Lỗi khi xóa nhân viên.');
      }
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
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

      alert('Thêm nhân viên thành công!');
      setShowAddModal(false);
      setFormData({ ...formData, fullName: '', account: '', email: '', password: '' });
      fetchCompanyUsers();
    } catch (err) {
      alert(err.response?.data || err.message || 'Lỗi khi thêm nhân viên.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.account.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <button className="btn btn-primary fw-bold rounded-3 shadow-sm d-flex align-items-center gap-2 px-4 py-2" onClick={() => setShowAddModal(true)}>
          <UserPlus size={20} /> Thêm nhân viên
        </button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm rounded-4 p-2">
            <div className="input-group border-0 px-2">
              <span className="input-group-text bg-transparent border-0 text-muted"><Search size={18} /></span>
              <input type="text" className="form-control bg-transparent border-0 py-2" placeholder="Tìm kiếm nhân viên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-primary text-white d-flex flex-row align-items-center justify-content-between">
            <div>
              <div className="small opacity-75 fw-bold">TỔNG NHÂN SỰ</div>
              <div className="fs-3 fw-bold">{users.length}</div>
            </div>
            <Users size={32} className="opacity-30" />
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
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
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted">Chưa có nhân viên nào trong đơn vị này.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <motion.div whileHover={{ x: 5 }} className="fw-bold text-dark">{user.fullName}</motion.div>
                    </td>
                    <td className="py-3">
                      <div className="text-primary fw-bold small">{user.account}</div>
                      <div className="text-muted small d-flex align-items-center gap-1 mt-1">
                        <Mail size={12} /> {user.email || 'Chưa cập nhật'}
                      </div>
                    </td>
                    <td className="py-3">
                      {user.emailConfirmed ? (
                        <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill fw-bold" style={{ fontSize: '0.65rem' }}>ĐÃ KÍCH HOẠT</span>
                      ) : user.isExpired ? (
                        <div className="d-flex align-items-center gap-2">
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
                    </td>
                    <td className="py-3">
                      <span className={`badge px-3 py-1 rounded-pill fw-bold ${user.role === 'Admin' ? 'bg-primary-subtle text-primary' : 'bg-light text-dark border'}`} style={{ fontSize: '0.65rem' }}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button 
                        className="btn btn-white btn-sm p-2 rounded-3 text-danger border shadow-sm hover-bg-danger-subtle transition-all"
                        onClick={(e) => handleDeleteUser(user.id, user.role, e)}
                        title="Xóa nhân viên"
                      >
                        <Trash2 size={16} />
                      </button>
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
                      {subDomain === 'system' ? (
                        <>
                          <option value="SuperAdmin">SuperAdmin</option>
                          <option value="Admin">Admin</option>
                          <option value="User">User</option>
                        </>
                      ) : (
                        <>
                          <option value="Admin">Admin</option>
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
    </AdminLayout>
  );
};

export default CompanyUsers;
