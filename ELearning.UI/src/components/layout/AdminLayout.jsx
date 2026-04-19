import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getUploadUrl } from '../../api/axios';
import '../../styles/adminTheme.css';
import {
  LayoutDashboard, Building2, Users, BookOpen,
  Menu, X, LogOut, ChevronDown, ChevronRight, Mail,
  Package, CreditCard, FileText, MessageCircle, Megaphone, GraduationCap,
  User, KeyRound,
} from 'lucide-react';
import NotificationBell from '../common/NotificationBell';
import UserAccountDialogs from '../account/UserAccountDialogs';

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [courseMenuOpen, setCourseMenuOpen] = useState(false);
  const [homeConfigMenuOpen, setHomeConfigMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const safeUser = user ?? {};
  const logoUrl = safeUser?.companyLogoUrl ? getUploadUrl(safeUser.companyLogoUrl) : '/h_logo.png';

  useEffect(() => {
    const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (!raw) {
      navigate('/login');
    } else {
      try {
        setUser(JSON.parse(raw));
      } catch (err) {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        navigate('/login');
      }
    }
  }, [navigate]);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 992) setSidebarOpen(true); };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/admin/courses') || location.pathname.startsWith('/admin/company-courses')) {
      setCourseMenuOpen(true);
    }
    if (location.pathname.startsWith('/admin/home-config')) {
      setHomeConfigMenuOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const refreshUserRef = useRef(() => {});
  refreshUserRef.current = () => {
    const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (!raw) return;
    try {
      setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const onUp = () => refreshUserRef.current();
    window.addEventListener('elearning-user-updated', onUp);
    return () => window.removeEventListener('elearning-user-updated', onUp);
  }, []);

  const roles = Array.isArray(safeUser?.roles)
    ? safeUser.roles
    : String(safeUser?.roles ?? safeUser?.role ?? '')
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  const isSuperAdmin = roles.includes('SuperAdmin');
  const isEditor = roles.includes('Editor');

  const getInitials = (name) => {
    if (!name) return 'AD';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const menuItems = isSuperAdmin ? [
    { path: '/admin/companies', icon: Building2, label: 'Quản lý Công ty' },
    { path: '/admin/users', icon: Users, label: 'Người dùng toàn hệ thống' },
    { type: 'dropdown', icon: BookOpen, label: 'Khóa học', children: [
      { path: '/admin/courses', label: 'Quản lý khóa học' },
    ]},
    { path: '/admin/learners', icon: GraduationCap, label: 'Theo dõi học viên' },
    { path: '/admin/categories', icon: BookOpen, label: 'Danh mục khóa học' },
    { path: '/admin/plans', icon: Package, label: 'Gói dịch vụ' },
    { path: '/admin/transactions', icon: CreditCard, label: 'Giao dịch' },
    { path: '/admin/audit-logs', icon: FileText, label: 'Nhật ký hoạt động' },
    { path: '/admin/tickets', icon: MessageCircle, label: 'Hỗ trợ Ticket' },
    { path: '/admin/announcements', icon: Megaphone, label: 'Thông báo' },
  ] : (isEditor ? [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Bảng điều khiển' },
    { type: 'dropdown', icon: BookOpen, label: 'Khóa học', children: [
      { path: '/admin/company-courses', label: 'Quản lý khóa học' },
      { path: '/admin/categories', label: 'Danh mục khóa học' },
    ]},
    { path: '/admin/learners', icon: GraduationCap, label: 'Theo dõi học viên' },
    { path: '/admin/audit-logs', icon: FileText, label: 'Nhật ký hoạt động' },
    { path: '/admin/tickets', icon: MessageCircle, label: 'Hỗ trợ' },
  ] : [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Bảng điều khiển' },
    { path: `/admin/company-users/${safeUser.subDomain || 'default'}`, icon: Users, label: 'Quản lý Nhân viên' },
    { type: 'dropdown', icon: BookOpen, label: 'Khóa học', children: [
      { path: '/admin/company-courses', label: 'Quản lý khóa học' },
      { path: '/admin/categories', label: 'Danh mục khóa học' },
    ]},
    { path: '/admin/learners', icon: GraduationCap, label: 'Theo dõi học viên' },
    { path: '/admin/subscription', icon: Package, label: 'Gói dịch vụ' },
    { path: '/admin/audit-logs', icon: FileText, label: 'Nhật ký hoạt động' },
    { path: '/admin/tickets', icon: MessageCircle, label: 'Hỗ trợ' },
  ]);

  useEffect(() => {
    if (!user) return;
    if (!isEditor || isSuperAdmin) return;
    const p = location.pathname;
    const blocked =
      p.startsWith('/admin/users')
      || p.startsWith('/admin/companies')
      || p.startsWith('/admin/company-users')
      || p.startsWith('/admin/transactions')
      || p.startsWith('/admin/plans')
      || p.startsWith('/admin/subscription')
      || p.startsWith('/admin/home-config')
      || p.startsWith('/admin/announcements');
    if (blocked) navigate('/admin/company-courses', { replace: true });
  }, [user, isEditor, isSuperAdmin, location.pathname, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen d-flex flex-column admin-shell">
      <header className="admin-header d-flex align-items-center justify-content-between px-4 py-3">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center rounded-2 overflow-hidden flex-shrink-0 admin-chip" style={{ width: 32, height: 32, padding: 5 }}>
            <img src={logoUrl} alt="Logo" className="w-100 h-100 object-fit-contain" onError={(e) => { e.target.onerror = null; e.target.src = '/h_logo.png'; setLogoError(true); }} />
            {logoError && (
              <span className="fw-bold" style={{ fontSize: '1rem' }}>EL</span>
            )}
          </div>
          <div className="admin-brand">
            <button
              type="button"
              className="admin-brand__title btn btn-link p-0 text-decoration-none"
              onClick={() => navigate('/admin/dashboard')}
              aria-label="Về trang dashboard"
            >
              E-LEARNING CMS
            </button>
            <div className="admin-brand__subtitle">{isSuperAdmin ? 'System' : 'Company'}</div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-link p-2 text-dark d-lg-none" onClick={() => setSidebarOpen(!isSidebarOpen)} aria-label="Toggle sidebar">
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <NotificationBell />
          <div
            className="admin-chip px-3 py-2 rounded-2"
          >
            <span className="text-dark fw-medium small">{user.fullName || user.account || 'Admin'}</span>
          </div>
          <div className="position-relative">
            <div className="d-flex align-items-center" onClick={() => setUserMenuOpen(!isUserMenuOpen)} style={{ cursor: 'pointer' }}>
              <div className="d-flex align-items-center justify-content-center rounded-2 overflow-hidden admin-chip" style={{ width: 34, height: 34 }}>
                {!logoError ? (
                  <img src={logoUrl} alt="" className="w-100 h-100 object-fit-contain" />
                ) : (
                  <span className="fw-bold small">{getInitials(user.fullName)}</span>
                )}
              </div>
              <ChevronDown size={16} className="text-muted ms-1" />
            </div>
            {isUserMenuOpen && (
              <>
                <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 999 }} onClick={() => setUserMenuOpen(false)} />
                <div className="position-absolute end-0 mt-2 bg-white rounded-4 shadow-lg border overflow-hidden admin-user-menu" style={{ width: 280, zIndex: 1000 }}>
                  <div className="p-3 border-bottom" style={{ background: 'rgba(17,24,39,0.02)' }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle admin-chip d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 44, height: 44, overflow: 'hidden' }}>
                        {!logoError ? (
                          <img src={logoUrl} alt="" className="w-100 h-100 object-fit-contain" />
                        ) : (
                          <span className="fw-bold">{getInitials(user.fullName)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.95rem' }}>{user.fullName || user.account || 'Admin'}</div>
                        <div className="text-muted text-truncate" style={{ fontSize: '0.78rem' }}>{user.email || user.account}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <Link
                      to="/admin/profile"
                      className="admin-user-menu-item d-flex align-items-center gap-2 px-2 py-2 rounded-3 text-decoration-none"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span className="admin-user-menu-icon">
                        <User size={16} />
                      </span>
                      <span className="flex-grow-1 small fw-medium text-dark">Hồ sơ</span>
                    </Link>
                    <button
                      type="button"
                      className="admin-user-menu-item btn w-100 text-start d-flex align-items-center gap-2 px-2 py-2 rounded-3 border-0"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setPasswordOpen(true);
                      }}
                    >
                      <span className="admin-user-menu-icon">
                        <KeyRound size={16} />
                      </span>
                      <span className="flex-grow-1 small fw-medium text-dark">Đổi mật khẩu</span>
                    </button>
                  </div>

                  <div className="p-2 border-top">
                    <button
                      onClick={handleLogout}
                      className="admin-user-menu-item btn w-100 text-start d-flex align-items-center gap-2 px-2 py-2 rounded-3 border-0 text-danger"
                    >
                      <span className="admin-user-menu-icon admin-user-menu-icon-danger">
                        <LogOut size={16} />
                      </span>
                      <span className="flex-grow-1 small fw-semibold">Đăng xuất</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div className="d-flex flex-grow-1 position-relative admin-main" style={{ minHeight: 0 }}>
        {isSidebarOpen && (
          <div
            className="d-lg-none position-fixed"
            style={{ top: 56, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)', zIndex: 799 }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <aside
          className={`transition-all d-flex flex-column flex-shrink-0 ${!isSidebarOpen ? 'd-none' : ''} admin-sidebar`}
          style={{
            width: 240,
            minHeight: 'calc(100vh - 56px)',
          }}
        >
          <div className="admin-sidebar-scroll flex-grow-1">
            <nav className="nav flex-column gap-1 admin-nav-section">
            {menuItems.map((item) => {
              if (item.type === 'dropdown') {
                const Icon = item.icon;
                const isHomeCfg = item.label === 'Cấu hình trang chủ';
                const isChildActive = item.children?.some(c =>
                  location.pathname === c.path ||
                  (c.path?.includes('courses') && location.pathname.startsWith('/admin/courses')) ||
                  (c.path?.includes('company-courses') && location.pathname.startsWith('/admin/company-courses')) ||
                  (typeof c.path === 'string' && c.path.startsWith('/admin/home-config') && location.pathname.startsWith('/admin/home-config'))
                );
                return (
                  <div key={item.label} className="mb-1">
                    <div
                      className={`admin-nav-link ${isChildActive ? 'active' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (isHomeCfg) setHomeConfigMenuOpen((v) => !v);
                        else setCourseMenuOpen((v) => !v);
                      }}
                    >
                      <div className="admin-nav-item">
                        <span className="admin-nav-icon"><Icon size={16} /></span>
                        <span className="admin-nav-label">{item.label}</span>
                        <ChevronDown
                          size={16}
                          className="admin-nav-caret transition-transform"
                          style={{ transform: (isHomeCfg ? homeConfigMenuOpen : courseMenuOpen) ? 'rotate(180deg)' : 'none' }}
                        />
                      </div>
                    </div>
                    {(isHomeCfg ? homeConfigMenuOpen : courseMenuOpen) && item.children && (
                      <div className="ps-4 py-1">
                        {item.children.map((child) => {
                          const isActive = location.pathname === child.path ||
                            (child.path?.includes('courses') && location.pathname.startsWith('/admin/courses')) ||
                            (child.path?.includes('company-courses') && location.pathname.startsWith('/admin/company-courses')) ||
                            (typeof child.path === 'string' && child.path.startsWith('/admin/home-config') && location.pathname.startsWith('/admin/home-config'));
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={`admin-nav-link ${isActive ? 'active' : ''}`}
                            >
                              <div className="admin-nav-item" style={{ minHeight: 38, paddingTop: 8, paddingBottom: 8 }}>
                                <span style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: 999, background: isActive ? 'rgba(37,99,235,0.65)' : 'rgba(17,24,39,0.25)' }} />
                                </span>
                                <span className="admin-nav-label" style={{ fontSize: '0.84rem' }}>{child.label}</span>
                              </div>
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
                || (item.path?.includes('learners') && location.pathname.startsWith('/admin/learners'))
                || (typeof item.path === 'string' && item.path.includes('home-config') && location.pathname.startsWith('/admin/home-config'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`admin-nav-link ${isActive ? 'active' : ''}`}
                >
                  <div className="admin-nav-item">
                    <span className="admin-nav-icon"><Icon size={16} /></span>
                    <span className="admin-nav-label">{item.label}</span>
                  </div>
                </Link>
              );
            })}
            </nav>
          </div>
        </aside>

        <main className="flex-grow-1 d-flex flex-column admin-content" style={{ minWidth: 0 }}>
          <div className="p-4 overflow-auto flex-grow-1">
            {children}
          </div>
          <footer className="admin-footer py-3 px-4 text-center small">
            © {new Date().getFullYear()} E-Learning. All rights reserved.
          </footer>
        </main>
      </div>

      <UserAccountDialogs
        passwordOpen={passwordOpen}
        onClosePassword={() => setPasswordOpen(false)}
      />
    </div>
  );
};

export default AdminLayout;
