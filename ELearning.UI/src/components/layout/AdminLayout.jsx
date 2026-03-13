import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, BookOpen,
  Settings, LogOut, Menu, X, Bell, UserCircle, ChevronDown, User as UserIcon, Lock, Mail
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  const isSuperAdmin = user.roles?.includes('SuperAdmin');

  // Phân quyền Menu dựa trên Role
  const menuItems = isSuperAdmin ? [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Tổng quan hệ thống' },
    { path: '/admin/companies', icon: Building2, label: 'Quản lý Công ty' },
    { path: '/admin/users', icon: Users, label: 'Người dùng toàn hệ thống' },
    { path: '/admin/courses', icon: BookOpen, label: 'Khóa học' },
    { path: '/admin/categories', icon: BookOpen, label: 'Danh mục khóa học' },
    { path: '/admin/settings', icon: Settings, label: 'Cài đặt hệ thống' },
  ] : [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Bảng điều khiển' },
    { path: `/admin/company-users/${user.subDomain || 'default'}`, icon: Users, label: 'Quản lý Nhân viên' },
    { path: '/admin/company-courses', icon: BookOpen, label: 'Khóa học' },
    { path: '/admin/settings', icon: Settings, label: 'Cài đặt công ty' },
  ];

  return (
    <div className="min-h-screen bg-light d-flex">
      <aside
        className={`bg-dark text-white transition-all ${isSidebarOpen ? 'w-250' : 'w-0 overflow-hidden'}`}
        style={{ width: isSidebarOpen ? '260px' : '0', minHeight: '100vh', transition: '0.3s' }}
      >
        <div className="p-4 d-flex align-items-center gap-3 border-bottom border-secondary">
          <div className="bg-primary p-2 rounded-3">
            <BookOpen size={24} className="text-white" />
          </div>
          <span className="fw-bold fs-5 tracking-tight">E-Learning CMS</span> {/* Đã đổi lại tên */}
        </div>

        <div className="py-4 px-3">
          <small className="text-secondary text-uppercase fw-bold mb-3 d-block px-2" style={{ fontSize: '0.7rem' }}>
            {isSuperAdmin ? 'QUẢN TRỊ HỆ THỐNG' : 'QUẢN TRỊ CÔNG TY'}
          </small>
          <nav className="nav flex-column gap-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 transition-all ${
                  location.pathname === item.path ? 'bg-primary text-white shadow-sm' : 'text-secondary hover-bg-secondary'
                }`}
              >
                <item.icon size={20} />
                <span className="fw-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-3 border-top border-secondary">
          <button onClick={handleLogout} className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 border-0">
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className="flex-grow-1 d-flex flex-column">
        <header className="bg-white border-bottom px-4 py-2 d-flex align-items-center justify-content-between sticky-top" style={{ zIndex: 900 }}>
          <button className="btn btn-light p-2 rounded-circle border-0" onClick={() => setSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo ở góc trên cùng bên phải */}
          <div className="d-flex align-items-center gap-3">
            <div className="position-relative">
              <div 
                className="d-flex align-items-center gap-2 user-select-none" 
                onClick={() => setUserMenuOpen(!isUserMenuOpen)}
                style={{ cursor: 'pointer' }}
              >
                <div className="text-end d-none d-sm-block">
                  <div className="fw-bold small mb-0 lh-1">{user.fullName}</div>
                  <div className="text-muted mt-1 lh-1" style={{ fontSize: '0.7rem' }}>{isSuperAdmin ? 'Super Admin' : 'Company Admin'}</div>
                </div>
                <div className="bg-white p-1 rounded-circle shadow-sm" style={{ width: '40px', height: '40px' }}>
                  <img src="/h_logo.png" alt="Logo" className="w-100 h-100 object-fit-contain" />
                </div>
                <ChevronDown size={16} className="text-muted ms-1" />
              </div>

              {isUserMenuOpen && (
                <>
                  <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 999 }} onClick={() => setUserMenuOpen(false)}></div>
                  <div className="position-absolute end-0 mt-3 bg-white rounded-4 shadow-lg border overflow-hidden" style={{ minWidth: '240px', zIndex: 1000 }}>
                    <div className="p-3 border-bottom bg-light">
                      <div className="fw-bold text-dark">{user.fullName}</div>
                      <div className="text-muted small d-flex align-items-center gap-2 mt-1">
                        <Mail size={14} className="text-primary" /> <span className="text-truncate">{user.email || user.account || 'admin@gmail.com'}</span>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <Link to="/admin/profile" className="dropdown-item px-3 py-2 d-flex align-items-center gap-3 text-secondary transition-all" onClick={() => setUserMenuOpen(false)}>
                        <UserIcon size={18} /> <span className="fw-medium small">Hồ sơ cá nhân</span>
                      </Link>
                      <Link to="/admin/change-password" className="dropdown-item px-3 py-2 d-flex align-items-center gap-3 text-secondary transition-all" onClick={() => setUserMenuOpen(false)}>
                        <Lock size={18} /> <span className="fw-medium small">Đổi mật khẩu</span>
                      </Link>
                    </div>

                    <div className="border-top p-2">
                      <button 
                        onClick={handleLogout} 
                        className="btn btn-white w-100 text-danger d-flex align-items-center gap-3 px-3 py-2 border-0 transition-all text-start rounded-3"
                      >
                        <LogOut size={18} /> <span className="fw-medium small">Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 overflow-auto">
          {children}
        </div>
      </main>

      <style>{`
        .hover-bg-secondary:hover { background-color: rgba(255,255,255,0.05); color: white !important; }
        .dropdown-item:hover { background-color: #f8f9fa; color: #0d6efd !important; }
        .btn-white:hover.text-danger { background-color: #fee2e2; }
        .w-250 { width: 260px; }
        .transition-all { transition: all 0.3s ease; }
      `}</style>
    </div>
  );
};

export default AdminLayout;
