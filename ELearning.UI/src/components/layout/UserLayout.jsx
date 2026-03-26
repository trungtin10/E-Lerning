import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getUploadUrl } from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard, BookOpen, GraduationCap,
  Settings, LogOut, UserCircle, ChevronDown, HelpCircle,
  Home, MapPin, Phone, Mail, Apple, Play, QrCode, Bot
} from 'lucide-react';
import NotificationBell from '../common/NotificationBell';

const UserLayout = ({ children, hideSidebar = true, hideHeader = false }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang, t } = useLanguage();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const logoUrl = user.companyLogoUrl ? getUploadUrl(user.companyLogoUrl) : '/h_logo.png';

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
    { path: '/my-courses', icon: BookOpen, labelKey: 'myCourses' },
    { path: '/certificates', icon: GraduationCap, labelKey: 'certificates' },
    { path: '/settings', icon: Settings, labelKey: 'accountSettings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white d-flex flex-column">
      {/* Sidebar - ẩn khi hideSidebar */}
      {!hideSidebar && (
      <aside
        className={`bg-white border-end transition-all ${isSidebarOpen ? 'w-250' : 'w-0 overflow-hidden'}`}
        style={{ width: isSidebarOpen ? '260px' : '0', minHeight: '100vh', transition: '0.3s' }}
      >
        <div className="p-4 d-flex align-items-center gap-2 border-bottom">
          <div className="bg-primary p-2 rounded-3">
            <GraduationCap size={24} className="text-white" />
          </div>
          <span className="fw-bold fs-5 text-dark tracking-tight">E-Learning</span>
        </div>
        <div className="py-4 px-3">
          <nav className="nav flex-column gap-1">
            {menuItems.map((item) => (
              <Link key={item.path} to={item.path}
                className={`nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 transition-all ${location.pathname === item.path ? 'bg-primary text-white shadow-sm' : 'text-secondary hover-bg-light'}`}>
                <item.icon size={20} />
                <span className="fw-medium">{t(item.labelKey)}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-3 border-top">
          <button onClick={handleLogout} className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 border-0">
            <LogOut size={18} /> <span>{t('logout')}</span>
          </button>
        </div>
      </aside>
      )}

      <main className="flex-grow-1 d-flex flex-column">
        {/* Header kiểu HUTECH - Logo + Khóa học | Trợ giúp | Ngôn ngữ | User */}
        {!hideHeader && (
        <header className="bg-white border-bottom px-4 py-3 d-flex align-items-center justify-content-between sticky-top" style={{ zIndex: 100 }}>
          <div className="d-flex align-items-center gap-4">
            <Link to="/dashboard" className="d-flex align-items-center gap-2 text-decoration-none">
              <div className="d-flex align-items-center justify-content-center rounded-2 overflow-hidden bg-white border" style={{ width: 44, height: 44, padding: 6, borderColor: '#e2e8f0' }}>
                <img src={logoUrl} alt="Logo" className="w-100 h-100 object-fit-contain" onError={(e) => { e.target.onerror = null; e.target.src = '/h_logo.png'; }} />
              </div>
              <span className="fw-bold text-primary" style={{ fontSize: '1.15rem' }}>E-Learning</span>
            </Link>
            <Link to="/dashboard" className="nav-link text-dark fw-medium px-0 py-0" style={{ fontSize: '0.95rem' }}>{t('courses')}</Link>
          </div>

          <div className="d-flex align-items-center gap-3">
            <a href="#" className="text-secondary text-decoration-none small fw-medium d-flex align-items-center gap-1" title={t('help')}><HelpCircle size={16} /> {t('help')}</a>
            <div className="d-flex align-items-center">
              {/* chuông thông báo (in-app) */}
              <NotificationBell />
            </div>
            <select
              className="form-select form-select-sm border py-1 px-3"
              style={{ width: 'auto', fontSize: '0.875rem' }}
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              <option value="vi">{t('langVi')}</option>
              <option value="en">{t('langEn')}</option>
            </select>
            <div className="dropdown position-relative">
              <button
                className="btn btn-light border-0 d-flex align-items-center gap-2 py-1 px-3"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <UserCircle size={22} className="text-primary" />
                <span className="small fw-medium text-dark d-none d-sm-inline">{user.fullName || user.email || user.account || t('student')}</span>
                <ChevronDown size={16} className="text-muted" />
              </button>
              {userMenuOpen && (
                <>
                  <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 998 }} onClick={() => setUserMenuOpen(false)} />
                  <div className="dropdown-menu dropdown-menu-end show position-absolute end-0 mt-2 shadow border" style={{ zIndex: 999, minWidth: 200 }}>
                    <div className="px-3 py-2 border-bottom">
                      <div className="fw-bold small">{user.fullName || t('student')}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user.email || user.account}</div>
                    </div>
                    <div className="border-top">
                      <button className="dropdown-item small text-danger w-100 text-start" onClick={handleLogout}>{t('logout')}</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        )}

        {/* Page Content */}
        <div className={`overflow-auto flex-grow-1 ${hideHeader ? 'p-0' : hideSidebar ? 'p-3 p-md-4' : 'p-4'}`}>
          {children}
        </div>
      </main>

      {/* Footer - kiểu HUTECH eLearning */}
      {!hideHeader && (
        <footer className="mt-auto text-white" style={{ backgroundColor: '#002060' }}>
          <div className="container-fluid px-4 px-md-5 py-5">
            <div className="row g-4 g-lg-5">
              {/* Cột 1: Logo + Liên hệ */}
              <div className="col-12 col-md-6 col-lg-4">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <div className="d-flex align-items-center justify-content-center rounded-2 overflow-hidden bg-white" style={{ width: 48, height: 48, padding: 6 }}>
                    <img src={logoUrl} alt="Logo" className="w-100 h-100 object-fit-contain" onError={(e) => { e.target.onerror = null; e.target.src = '/h_logo.png'; }} />
                  </div>
                  <div>
                    <span className="fw-bold" style={{ fontSize: '1.1rem' }}>E-Learning</span>
                  </div>
                </div>
                <div className="d-flex flex-column gap-2 small" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                  <div className="d-flex align-items-start gap-2">
                    <Home size={18} className="flex-shrink-0 mt-1" style={{ opacity: 0.9 }} />
                    <span>TRUNG TÂM DẠY HỌC SỐ - E-LEARNING</span>
                  </div>
                  <div className="d-flex align-items-start gap-2">
                    <MapPin size={18} className="flex-shrink-0 mt-1" style={{ opacity: 0.9 }} />
                    <span>61/31 Bình Giã ,Tân Bình, TP.HCM</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Phone size={18} className="flex-shrink-0" style={{ opacity: 0.9 }} />
                    <span>0817 673 820</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Mail size={18} className="flex-shrink-0" style={{ opacity: 0.9 }} />
                    <span>dayhocso@mxv.vn</span>
                  </div>
                </div>
              </div>
              {/* Cột 2: Tải App */}
              <div className="col-12 col-md-6 col-lg-3">
                <h6 className="fw-bold mb-3" style={{ fontSize: '1rem' }}>Tải App</h6>
                <div className="d-flex align-items-start gap-3">
                  <div className="d-flex flex-column gap-2">
                    <a href="#" className="btn btn-outline-light btn-sm rounded-2 d-flex align-items-center gap-2 px-3 py-2 text-decoration-none" style={{ borderWidth: 1, fontSize: '0.75rem' }}>
                      <Apple size={18} /> Download on the App Store
                    </a>
                    <a href="#" className="btn btn-outline-light btn-sm rounded-2 d-flex align-items-center gap-2 px-3 py-2 text-decoration-none" style={{ borderWidth: 1, fontSize: '0.75rem' }}>
                      <Play size={18} /> GET IT ON Google Play
                    </a>
                  </div>
                  <div className="flex-shrink-0 bg-white rounded-2 p-2 d-flex align-items-center justify-content-center" style={{ width: 72, height: 72 }}>
                    <QrCode size={48} className="text-dark" />
                  </div>
                </div>
              </div>
              {/* Cột 3: Kết nối */}
              <div className="col-12 col-md-6 col-lg-2">
                <h6 className="fw-bold mb-3" style={{ fontSize: '1rem' }}>Kết nối</h6>
                <div className="d-flex flex-column gap-2 small">
                  <a href="#" className="text-white text-decoration-none d-flex align-items-center gap-2" style={{ opacity: 0.95 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </a>
                  <a href="#" className="text-white text-decoration-none d-flex align-items-center gap-2" style={{ opacity: 0.95 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    Youtube
                  </a>
                  <a href="#" className="text-white text-decoration-none d-flex align-items-center gap-2" style={{ opacity: 0.95 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.265.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.058 1.645-.07 4.849-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    Instagram
                  </a>
                </div>
              </div>
              {/* Cột 4: Điều khoản */}
              <div className="col-12 col-md-6 col-lg-3">
                <h6 className="fw-bold mb-3" style={{ fontSize: '1rem' }}>Điều khoản và Chính sách</h6>
                <div className="d-flex flex-column gap-2 small">
                  <a href="#" className="text-white text-decoration-none" style={{ opacity: 0.95 }}>Điều khoản sử dụng</a>
                  <a href="#" className="text-white text-decoration-none" style={{ opacity: 0.95 }}>Chính sách bảo mật</a>
                </div>
              </div>
            </div>
            {/* Bottom: Copyright + AI */}
            <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-2 pt-4 mt-4 border-top" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
              <span className="small" style={{ opacity: 0.85 }}>© {new Date().getFullYear()} E-Learning. Bảo lưu mọi quyền.</span>
              <div className="d-flex align-items-center gap-2">
                <div className="d-flex align-items-center justify-content-center rounded-circle bg-white" style={{ width: 40, height: 40 }}>
                  <Bot size={22} className="text-primary" />
                </div>
                <span className="small fw-medium">E-Learning AI</span>
              </div>
            </div>
          </div>
        </footer>
      )}

      <style>{`
        .hover-bg-light:hover {
          background-color: #f8f9fa;
          color: var(--bs-primary) !important;
        }
        .w-250 { width: 260px; }
        .transition-all { transition: all 0.3s ease; }
        footer a:hover { opacity: 1 !important; }
      `}</style>
    </div>
  );
};

export default UserLayout;
