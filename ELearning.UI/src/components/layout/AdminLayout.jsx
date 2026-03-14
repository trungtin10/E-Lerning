import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, BookOpen,
  Menu, X, LogOut, ChevronDown, User as UserIcon, Lock, Mail
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
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

  const getInitials = (name) => {
    if (!name) return 'AD';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  // Phân quyền Menu dựa trên Role
  const menuItems = isSuperAdmin ? [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Tổng quan hệ thống' },
    { path: '/admin/companies', icon: Building2, label: 'Quản lý Công ty' },
    { path: '/admin/users', icon: Users, label: 'Người dùng toàn hệ thống' },
    { path: '/admin/courses', icon: BookOpen, label: 'Khóa học' },
    { path: '/admin/categories', icon: BookOpen, label: 'Danh mục khóa học' },
  ] : [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Bảng điều khiển' },
    { path: `/admin/company-users/${user.subDomain || 'default'}`, icon: Users, label: 'Quản lý Nhân viên' },
    { path: '/admin/company-courses', icon: BookOpen, label: 'Khóa học' },
  ];

  return (
    <div className="min-h-screen d-flex" style={{ backgroundColor: '#f8fafc' }}>
      <aside
        className={`bg-white transition-all d-flex flex-column ${isSidebarOpen ? 'w-250' : 'w-0 overflow-hidden'}`}
        style={{ 
          width: isSidebarOpen ? '280px' : '0', 
          minHeight: '100vh', 
          transition: '0.3s',
          boxShadow: '2px 0 12px rgba(0,0,0,0.06)'
        }}
      >
        <div className="p-4 d-flex align-items-center gap-3 border-bottom" style={{ borderColor: '#f1f5f9' }}>
          <div className="d-flex align-items-center justify-content-center rounded-2 overflow-hidden flex-shrink-0" style={{ width: 40, height: 40 }}>
            <img src="/h_logo.png" alt="Logo" className="w-100 h-100 object-fit-contain" />
          </div>
          <span className="fw-bold" style={{ fontSize: '1.1rem', color: '#1e293b' }}>E-Learning CMS</span>
        </div>

        <div className="p-3">
          <nav className="nav flex-column gap-0">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path.includes('courses') && location.pathname.startsWith('/admin/courses'));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-2 transition-all border-0 ${
                    isActive 
                      ? 'admin-nav-active' 
                      : 'admin-nav-item'
                  }`}
                >
                  <item.icon size={20} style={isActive ? { color: '#6366f1' } : { color: '#94a3b8' }} />
                  <span className="fw-medium" style={{ fontSize: '0.9rem' }}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

      </aside>

      <main className="flex-grow-1 d-flex flex-column">
        <header className="bg-white px-4 py-2 d-flex align-items-center justify-content-between sticky-top" style={{ zIndex: 900, borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <button className="btn btn-light p-2 rounded-circle border-0" onClick={() => setSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

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
                <div 
                  className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0 overflow-hidden bg-white p-1"
                  style={{ width: 40, height: 40 }}
                >
                  {!logoError ? (
                    <img src="/h_logo.png" alt="Logo" className="w-100 h-100 object-fit-contain" onError={() => setLogoError(true)} />
                  ) : (
                    <div className="d-flex align-items-center justify-content-center w-100 h-100 rounded-2 fw-bold" style={{ backgroundColor: '#6366f1', color: 'white', fontSize: '0.9rem' }}>
                      {getInitials(user.fullName)}
                    </div>
                  )}
                </div>
                <ChevronDown size={16} className="text-muted ms-1" />
              </div>

              {isUserMenuOpen && (
                <>
                  <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 999 }} onClick={() => setUserMenuOpen(false)} />
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
        .admin-nav-active { background-color: rgba(99,102,241,0.12) !important; color: #6366f1 !important; }
        .admin-nav-active:hover { background-color: rgba(99,102,241,0.18) !important; color: #6366f1 !important; }
        .admin-nav-item { color: #475569 !important; }
        .admin-nav-item:hover { background-color: #f1f5f9 !important; color: #1e293b !important; }
        .dropdown-item:hover { background-color: #f8f9fa; color: #6366f1 !important; }
        .btn-white:hover.text-danger { background-color: #fee2e2; }
        .w-250 { width: 280px; }
        .transition-all { transition: all 0.2s ease; }
        .cursor-pointer { cursor: pointer; }
      `}</style>
    </div>
  );
};

export default AdminLayout;
