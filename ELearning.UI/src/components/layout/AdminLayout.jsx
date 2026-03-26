import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getUploadUrl } from '../../api/axios';
import {
  LayoutDashboard, Building2, Users, BookOpen,
  Menu, X, LogOut, ChevronDown, ChevronRight, Mail,
  Package, CreditCard, FileText, MessageCircle, Megaphone, GraduationCap
} from 'lucide-react';
import NotificationBell from '../common/NotificationBell';

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [courseMenuOpen, setCourseMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const logoUrl = user?.companyLogoUrl ? getUploadUrl(user.companyLogoUrl) : '/h_logo.png';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 992) setSidebarOpen(true); };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/admin/courses') || location.pathname.startsWith('/admin/company-courses') || location.pathname.startsWith('/admin/learners')) {
      setCourseMenuOpen(true);
    }
  }, [location.pathname]);

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

  const menuItems = isSuperAdmin ? [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Tổng quan hệ thống' },
    { path: '/admin/companies', icon: Building2, label: 'Quản lý Công ty' },
    { path: '/admin/users', icon: Users, label: 'Người dùng toàn hệ thống' },
    { type: 'dropdown', icon: BookOpen, label: 'Khóa học', children: [
      { path: '/admin/courses', label: 'Quản lý khóa học' },
      { path: '/admin/learners', label: 'Theo dõi học viên' },
    ]},
    { path: '/admin/categories', icon: BookOpen, label: 'Danh mục khóa học' },
    { path: '/admin/plans', icon: Package, label: 'Gói dịch vụ' },
    { path: '/admin/transactions', icon: CreditCard, label: 'Giao dịch' },
    { path: '/admin/audit-logs', icon: FileText, label: 'Nhật ký hoạt động' },
    { path: '/admin/tickets', icon: MessageCircle, label: 'Hỗ trợ Ticket' },
    { path: '/admin/announcements', icon: Megaphone, label: 'Thông báo' },
  ] : [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Bảng điều khiển' },
    { path: `/admin/company-users/${user.subDomain || 'default'}`, icon: Users, label: 'Quản lý Nhân viên' },
    { type: 'dropdown', icon: BookOpen, label: 'Khóa học', children: [
      { path: '/admin/company-courses', label: 'Quản lý khóa học' },
      { path: '/admin/learners', label: 'Theo dõi học viên' },
    ]},
    { path: '/admin/audit-logs', icon: FileText, label: 'Nhật ký hoạt động' },
    { path: '/admin/tickets', icon: MessageCircle, label: 'Hỗ trợ' },
  ];

  return (
    <div className="min-h-screen d-flex flex-column admin-theme" style={{ backgroundColor: '#f5f5f5', fontFamily: 'Arial, Helvetica, Verdana, sans-serif' }}>
      {/* Header gradient xanh */}
      <header
        className="d-flex align-items-center justify-content-between px-4 py-3"
        style={{
          background: 'linear-gradient(90deg, #1a5276 0%, #2471a3 50%, #3498db 100%)',
          minHeight: '72px'
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center rounded-2 overflow-hidden flex-shrink-0 bg-white" style={{ width: 44, height: 44, padding: 6 }}>
            <img src={logoUrl} alt="Logo" className="w-100 h-100 object-fit-contain" onError={(e) => { e.target.onerror = null; e.target.src = '/h_logo.png'; setLogoError(true); }} />
            {logoError && (
              <span className="fw-bold text-primary" style={{ fontSize: '1.2rem' }}>EL</span>
            )}
          </div>
          <div>
            <div className="text-white fw-bold" style={{ fontSize: '1.35rem', letterSpacing: '0.05em' }}>E-LEARNING ADMIN</div>
            <div className="text-white-50" style={{ fontSize: '0.8rem', letterSpacing: '0.02em' }}>SYSTEM MANAGER</div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-link p-2 text-white d-lg-none" onClick={() => setSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <NotificationBell />
          <div
            className="bg-white px-3 py-2 rounded-2 border"
            style={{ borderColor: '#cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
          >
            <span className="text-dark fw-medium small">Welcome: {user.fullName || user.account || 'Admin'}</span>
          </div>
          <div className="position-relative d-none d-md-block">
            <div className="d-flex align-items-center" onClick={() => setUserMenuOpen(!isUserMenuOpen)} style={{ cursor: 'pointer' }}>
              <div className="d-flex align-items-center justify-content-center rounded-2 overflow-hidden bg-white border" style={{ width: 36, height: 36 }}>
                {!logoError ? (
                  <img src={logoUrl} alt="" className="w-100 h-100 object-fit-contain" />
                ) : (
                  <span className="fw-bold text-primary small">{getInitials(user.fullName)}</span>
                )}
              </div>
              <ChevronDown size={16} className="text-white ms-1" />
            </div>
            {isUserMenuOpen && (
              <>
                <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 999 }} onClick={() => setUserMenuOpen(false)} />
                <div className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg border overflow-hidden" style={{ minWidth: '220px', zIndex: 1000 }}>
                  <div className="p-3 border-bottom bg-light">
                    <div className="fw-bold text-dark small">{user.fullName || user.account || 'Admin'}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user.email || user.account}</div>
                  </div>
                  <div className="border-top">
                    <button onClick={handleLogout} className="btn btn-white w-100 text-danger d-flex align-items-center gap-2 px-3 py-2 border-0 text-start">
                      <LogOut size={16} /> <span className="small">Đăng xuất</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Vạch đỏ ngăn cách */}
      <div style={{ height: 3, backgroundColor: '#dc2626' }} />

      {/* Body: Sidebar + Content */}
      <div className="d-flex flex-grow-1 overflow-hidden position-relative">
        {isSidebarOpen && (
          <div
            className="d-lg-none position-fixed"
            style={{ top: 75, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 799 }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <aside
          className={`transition-all d-flex flex-column flex-shrink-0 ${!isSidebarOpen ? 'd-none' : ''} admin-sidebar`}
          style={{
            width: 260,
            minHeight: 'calc(100vh - 75px - 3px)',
            backgroundColor: '#e8ecf0',
            borderRight: '1px solid #d1d5db'
          }}
        >
          <div className="text-center py-3 px-2">
            <h6 className="fw-bold text-dark mb-0 text-uppercase" style={{ fontSize: '0.85rem', textDecoration: 'underline', letterSpacing: '0.08em' }}>Menu</h6>
          </div>
          <nav className="nav flex-column gap-0 px-2 pb-3">
            {menuItems.map((item) => {
              if (item.type === 'dropdown') {
                const Icon = item.icon;
                const isChildActive = item.children?.some(c => 
                  location.pathname === c.path ||
                  (c.path?.includes('courses') && location.pathname.startsWith('/admin/courses')) ||
                  (c.path?.includes('company-courses') && location.pathname.startsWith('/admin/company-courses')) ||
                  (c.path?.includes('learners') && location.pathname.startsWith('/admin/learners'))
                );
                return (
                  <div key={item.label} className="mb-1">
                    <div
                      className={`d-flex align-items-center gap-2 px-3 py-2 rounded-2 border-0 admin-sidebar-link ${isChildActive ? 'admin-sidebar-active' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setCourseMenuOpen(!courseMenuOpen)}
                    >
                      <ChevronRight
                        size={18}
                        className="flex-shrink-0 transition-transform"
                        style={{ color: '#1a5276', transform: courseMenuOpen ? 'rotate(90deg)' : 'none' }}
                      />
                      <Icon size={18} className="flex-shrink-0" style={{ color: '#1a5276' }} />
                      <span>{item.label}</span>
                    </div>
                    {courseMenuOpen && item.children && (
                      <div className="ps-4 py-1">
                        {item.children.map((child) => {
                          const isActive = location.pathname === child.path ||
                            (child.path?.includes('courses') && location.pathname.startsWith('/admin/courses')) ||
                            (child.path?.includes('company-courses') && location.pathname.startsWith('/admin/company-courses')) ||
                            (child.path?.includes('learners') && location.pathname.startsWith('/admin/learners'));
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={`d-block py-2 px-2 rounded-2 small text-decoration-none admin-sidebar-link ${isActive ? 'admin-sidebar-active' : ''}`}
                              style={{ color: '#1a5276' }}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              const isActive = location.pathname === item.path
                || (item.path?.includes('courses') && location.pathname.startsWith('/admin/courses'))
                || (item.path?.includes('company-users') && location.pathname.startsWith('/admin/company-users'))
                || (item.path?.includes('learners') && location.pathname.startsWith('/admin/learners'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-2 border-0 admin-sidebar-link ${isActive ? 'admin-sidebar-active' : ''}`}
                >
                  <ChevronRight size={18} className="flex-shrink-0" style={{ color: '#1a5276' }} />
                  <Icon size={18} className="flex-shrink-0" style={{ color: '#1a5276' }} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-grow-1 d-flex flex-column overflow-hidden bg-white" style={{ boxShadow: '-2px 0 8px rgba(0,0,0,0.04)' }}>
          <div className="p-4 overflow-auto flex-grow-1">
            {children}
          </div>
          <footer className="py-2 px-4 text-center small text-muted" style={{ backgroundColor: '#1a5276', color: 'rgba(255,255,255,0.9)' }}>
            © {new Date().getFullYear()} E-Learning. All rights reserved.
          </footer>
        </main>
      </div>

      <style>{`
        .admin-theme, .admin-theme * { font-family: Arial, Helvetica, Verdana, sans-serif !important; }
        .admin-theme { color: #333333; }
        .admin-theme h1, .admin-theme h2, .admin-theme h3, .admin-theme h4, .admin-theme h5, .admin-theme h6 { color: #1a5276 !important; font-weight: bold; }
        .admin-theme a, .admin-theme .text-primary { color: #0056b3 !important; }
        .admin-theme a:hover { text-decoration: underline; }
        .admin-theme .table thead th { background: linear-gradient(#f2f2f2, #e6e6e6) !important; color: #333 !important; font-weight: bold; border: 1px solid #cccccc !important; }
        .admin-theme .table td, .admin-theme .table th { border-color: #dee2e6 !important; color: #333333; }
        .admin-theme .table tbody tr:hover { background-color: #f9f9f9; }
        .admin-theme .btn-primary { background-color: #0056b3 !important; border-color: #0056b3 !important; color: white !important; }
        .admin-theme .btn-primary:hover { background-color: #004494 !important; border-color: #004494 !important; }
        .admin-theme .admin-price, .admin-theme .text-danger { color: #d9534f !important; }
        .admin-sidebar-link { color: #1a5276 !important; transition: all 0.2s; }
        .admin-sidebar-link span { color: #1a5276 !important; font-weight: bold !important; font-size: 0.95rem !important; }
        .admin-sidebar-link:hover { background-color: #e6e6e6 !important; color: #1a5276 !important; }
        .admin-sidebar-active { background-color: #d6eaf8 !important; color: #1a5276 !important; }
        .admin-sidebar-active:hover { background-color: #aed6f1 !important; }
        .dropdown-item:hover { background-color: #f2f2f2 !important; }
        @media (max-width: 991px) {
          .admin-sidebar { position: fixed !important; left: 0; top: 75px; z-index: 800; height: calc(100vh - 78px) !important; box-shadow: 4px 0 12px rgba(0,0,0,0.15); }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
