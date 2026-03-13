import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, GraduationCap, Compass,
  Settings, LogOut, Menu, X, Bell, UserCircle, Search
} from 'lucide-react';

const UserLayout = ({ children, hideSidebar = false }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Bảng điều khiển' },
    { path: '/my-courses', icon: BookOpen, label: 'Khóa học của tôi' },
    { path: '/courses', icon: Compass, label: 'Khám phá khóa học' },
    { path: '/certificates', icon: GraduationCap, label: 'Chứng chỉ' },
    { path: '/settings', icon: Settings, label: 'Cài đặt tài khoản' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-light d-flex">
      {/* Sidebar cho User - ẩn khi hideSidebar */}
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
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 transition-all ${
                  location.pathname === item.path ? 'bg-primary text-white shadow-sm' : 'text-secondary hover-bg-light'
                }`}
              >
                <item.icon size={20} />
                <span className="fw-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-3 border-top">
          <button
            onClick={handleLogout}
            className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 border-0"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
      )}

      {/* Main Content */}
      <main className="flex-grow-1 d-flex flex-column">
        {/* Header */}
        <header className="bg-white border-bottom px-4 py-2 d-flex align-items-center justify-content-between sticky-top">
          <div className="d-flex align-items-center gap-3">
            {!hideSidebar && (
            <button
              className="btn btn-light p-2 rounded-circle border-0"
              onClick={() => setSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            )}
            {!hideSidebar && (
            <div className="d-none d-md-flex align-items-center bg-light rounded-pill px-3 py-1 border">
              <Search size={16} className="text-muted me-2" />
              <input type="text" className="form-control form-control-sm bg-transparent border-0" placeholder="Tìm khóa học..." style={{ width: '200px' }} />
            </div>
            )}
          </div>

          <div className="d-flex align-items-center gap-3">
            {!hideSidebar && (
            <button className="btn btn-light p-2 rounded-circle border-0 position-relative">
              <Bell size={20} />
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white p-1"></span>
            </button>
            )}
            {!hideSidebar && <div className="vr mx-2"></div>}
            <div className="d-flex align-items-center gap-2">
              <div className="text-end d-none d-sm-block">
                <div className="fw-bold small">{user.fullName || 'Học viên'}</div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{user.roles?.[0] || 'Student'}</div>
              </div>
              <div className="bg-primary-subtle p-2 rounded-circle text-primary">
                <UserCircle size={24} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className={`overflow-auto ${hideSidebar ? 'p-3 p-md-4' : 'p-4'}`}>
          {children}
        </div>
      </main>

      <style>{`
        .hover-bg-light:hover {
          background-color: #f8f9fa;
          color: var(--bs-primary) !important;
        }
        .w-250 { width: 260px; }
        .transition-all { transition: all 0.3s ease; }
      `}</style>
    </div>
  );
};

export default UserLayout;
