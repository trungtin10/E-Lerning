import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import { Search, Building2, Shield, Mail, Loader2, Info } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.companyName && user.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold tracking-tight mb-1">Hệ thống Nhân sự</h2>
        <p className="text-muted small">Nhấn vào biểu tượng thông tin để quản lý danh sách nhân viên của từng đơn vị.</p>
      </div>

      {/* Thanh tìm kiếm */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="input-group bg-light border-0 rounded-3 px-2">
            <span className="input-group-text bg-transparent border-0 text-muted"><Search size={18} /></span>
            <input
              type="text"
              className="form-control bg-transparent border-0 py-2"
              placeholder="Tìm kiếm theo tên công ty hoặc tài khoản..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Bảng danh sách đơn vị */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light border-bottom">
              <tr>
                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase">Đơn vị & Quản trị viên</th>
                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Vai trò hệ thống</th>
                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase text-center">Trạng thái</th>
                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase text-end">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="text-center py-5"><Loader2 className="animate-spin text-primary" size={32} /></td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className={`p-2 rounded-3 shadow-sm ${user.companyName ? 'bg-primary-subtle text-primary' : 'bg-danger-subtle text-danger'}`}>
                          {user.companyName ? <Building2 size={20} /> : <Shield size={20} />}
                        </div>
                        <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300 }}>
                          <div className="fw-bold text-dark fs-6">{user.companyName || 'HỆ THỐNG TỔNG'}</div>
                          <div className="text-muted small d-flex align-items-center gap-1">
                            <Mail size={12} /> {user.account}
                          </div>
                        </motion.div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`badge px-3 py-2 rounded-pill fw-bold ${user.role === 'SuperAdmin' ? 'bg-danger text-white' : 'bg-primary-subtle text-primary'}`} style={{ fontSize: '0.65rem' }}>
                        {user.role === 'SuperAdmin' ? 'QUẢN TRỊ TỔNG' : 'QUẢN TRỊ VIÊN'}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <div className={`d-inline-flex align-items-center gap-1 small fw-bold ${user.emailConfirmed ? 'text-success' : 'text-warning'}`}>
                        <div className={`rounded-circle ${user.emailConfirmed ? 'bg-success' : 'bg-warning'}`} style={{ width: '8px', height: '8px' }}></div>
                        {user.emailConfirmed ? 'ĐÃ KÍCH HOẠT' : 'CHỜ XÁC NHẬN'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-end">
                      {/* ĐỔI THÀNH NÚT CHỮ I */}
                      <button
                        className="btn btn-white btn-sm p-2 rounded-3 border shadow-sm text-primary hover-bg-primary-subtle transition-all"
                        onClick={() => navigate(`/admin/company-users/${user.subDomain || 'system'}`)}
                        title="Xem danh sách nhân viên"
                      >
                        <Info size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        .btn-white { background: white; }
        .hover-bg-primary-subtle:hover { background-color: var(--bs-primary-bg-subtle) !important; }
      `}</style>
    </AdminLayout>
  );
};

export default Users;
