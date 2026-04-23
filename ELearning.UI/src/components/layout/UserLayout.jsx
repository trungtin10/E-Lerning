import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getUploadUrl } from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/axios';
import {
  LayoutDashboard, BookOpen, GraduationCap, Compass, ClipboardList,
  Settings, LogOut, UserCircle, ChevronDown, HelpCircle,
  Home, MapPin, Phone, Mail, Apple, Play, QrCode, Bot,
  User, KeyRound, Search, MessageSquare, Bell, Facebook, Linkedin, Youtube, Users,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import NotificationBell from '../common/NotificationBell';
import UserAccountDialogs from '../account/UserAccountDialogs';

const UserLayout = ({ children, hideSidebar = false, hideHeader = false }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportForm, setSupportForm] = useState(() => ({
    fullName: '',
    email: '',
    message: '',
    files: [],
  }));
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang, t } = useLanguage();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });
  const refreshUserRef = useRef(() => {});
  refreshUserRef.current = () => {
    try {
      setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    } catch {
      setUser({});
    }
  };

  useEffect(() => {
    const onUp = () => refreshUserRef.current();
    window.addEventListener('elearning-user-updated', onUp);
    return () => window.removeEventListener('elearning-user-updated', onUp);
  }, []);

  const logoUrl = user.companyLogoUrl ? getUploadUrl(user.companyLogoUrl) : '/h_logo.png';

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Bảng điều khiển' },
    { path: '/my-courses', icon: BookOpen, label: 'Khóa học của tôi' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    setSupportForm((prev) => ({
      ...prev,
      fullName: prev.fullName || user.fullName || '',
      email: prev.email || user.email || '',
    }));
  }, [user.fullName, user.email]);

  const openSupport = () => {
    setSupportForm((prev) => ({
      ...prev,
      fullName: user.fullName || prev.fullName || '',
      email: user.email || prev.email || '',
    }));
    setSupportOpen(true);
  };

  const closeSupport = () => {
    setSupportOpen(false);
    setSupportSubmitting(false);
  };

  const handleSupportFiles = (e) => {
    const arr = Array.from(e.target.files || []);
    setSupportForm((prev) => ({ ...prev, files: [...(prev.files || []), ...arr].slice(0, 8) }));
    e.target.value = '';
  };

  const removeSupportFileAt = (idx) => {
    setSupportForm((prev) => ({ ...prev, files: (prev.files || []).filter((_, i) => i !== idx) }));
  };

  const submitSupport = async (e) => {
    e.preventDefault();
    if (!supportForm.message?.trim()) return;
    setSupportSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('fullName', supportForm.fullName || '');
      fd.append('email', supportForm.email || '');
      fd.append('message', supportForm.message || '');
      (supportForm.files || []).forEach((f) => fd.append('files', f));
      await api.post('/ticket/contact', fd);
      alert('Đã gửi yêu cầu hỗ trợ.');
      setSupportForm((prev) => ({ ...prev, message: '', files: [] }));
      closeSupport();
    } catch (err) {
      const msg = err.response?.data;
      alert(typeof msg === 'string' ? msg : (msg?.message || 'Không gửi được yêu cầu.'));
    } finally {
      setSupportSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white d-flex flex-row">
      {/* Sidebar - ẩn khi hideSidebar */}
      {!hideSidebar && (
      <aside
        className={`bg-white border-end d-flex flex-column sticky-top overflow-hidden flex-shrink-0 transition-all`}
        style={{ width: isCollapsed ? '80px' : '280px', height: '100vh', zIndex: 1000 }}
      >
        <div className={`p-4 mb-2 d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'justify-content-between'}`}>
          {!isCollapsed && (
            <Link to="/dashboard" className="text-decoration-none d-flex align-items-center gap-2 overflow-hidden">
              {user.companyLogoUrl && (
                <img 
                  src={getUploadUrl(user.companyLogoUrl)} 
                  alt="Logo" 
                  className="flex-shrink-0"
                  style={{ height: '32px', width: 'auto', objectFit: 'contain' }} 
                />
              )}
              <span className="fw-bold text-truncate" style={{ color: '#4c49ed', fontSize: '1.25rem' }}>{user.companyName || 'MẠNG XUYÊN VIỆT'}</span>
            </Link>
          )}
          
          <button 
            className={`btn btn-sm btn-light border-0 rounded-circle p-2 ${isCollapsed ? '' : 'ms-2'}`}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            {isCollapsed ? <PanelLeftOpen size={20} className="text-primary" /> : <PanelLeftClose size={18} className="text-muted" />}
          </button>
        </div>

        <div className={`px-${isCollapsed ? '2' : '4'} mb-4`}>
          <div className={`rounded-4 ${isCollapsed ? 'p-2 justify-content-center' : 'p-3 gap-3'} d-flex align-items-center`} style={{ backgroundColor: '#f5f3ff' }}>
             <div className="bg-white rounded-3 p-2 shadow-sm d-flex align-items-center justify-content-center">
                <BookOpen size={18} style={{ color: '#4c49ed' }} />
             </div>
             {!isCollapsed && (
               <div>
                 <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>Cổng học tập</div>
                 <div className="text-muted" style={{ fontSize: '0.65rem', fontWeight: 600 }}>DÀNH CHO HỌC VIÊN</div>
               </div>
             )}
          </div>
        </div>

        <div className={`flex-grow-1 px-${isCollapsed ? '2' : '3'}`}>
          <nav className="nav flex-column gap-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}
                  className={`nav-link d-flex align-items-center ${isCollapsed ? 'justify-content-center p-3' : 'gap-3 px-3 py-2'} rounded-3 transition-all ${isActive ? 'bg-primary bg-opacity-10 text-primary fw-bold active-sidebar-item' : 'text-secondary opacity-75 hover-bg-light fw-medium'}`}
                  style={{ fontSize: '0.9rem' }}
                  title={isCollapsed ? item.label : ''}
                >
                  <item.icon size={20} className={isActive ? 'text-primary' : 'text-secondary'} />
                  {!isCollapsed && <span>{item.label}</span>}
                  {isActive && !isCollapsed && <div className="ms-auto bg-primary rounded-pill" style={{ width: 4, height: 20 }}></div>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={`p-${isCollapsed ? '2' : '4'} mt-auto text-center`}>
          <button 
            onClick={openSupport} 
            className={`btn w-100 ${isCollapsed ? 'p-3' : 'py-2 rounded-pill'} d-flex align-items-center justify-content-center gap-2 fw-medium border-0`}
            style={{ backgroundColor: '#eeeffe', color: '#4c49ed', fontSize: '0.85rem' }}
            title={isCollapsed ? 'Liên hệ hỗ trợ' : ''}
          >
            <Bot size={18} /> {!isCollapsed && <span>Liên hệ hỗ trợ</span>}
          </button>
        </div>
      </aside>
      )}

      <div className="flex-grow-1 d-flex flex-column min-w-0">
        {!hideHeader && (
        <header className="bg-white px-4 py-2 d-flex align-items-center justify-content-between sticky-top border-bottom" style={{ zIndex: 100, height: '72px' }}>
          {/* Search Bar */}
          <div className="d-flex align-items-center position-relative flex-grow-1 mx-4" style={{ maxWidth: '500px' }}>
             <Search size={18} className="position-absolute ms-3 text-secondary opacity-50" />
             <input 
               type="text" 
               className="form-control border-0 rounded-pill ps-5 py-2 shadow-sm transition-all search-input-premium" 
               placeholder="Tìm kiếm khóa học, bài giảng của bạn..." 
               style={{ fontSize: '0.9rem', backgroundColor: '#f1f5f9' }}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && e.target.value.trim()) {
                   navigate(`/my-courses?q=${encodeURIComponent(e.target.value)}`);
                 }
               }}
             />
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="d-flex bg-light rounded-pill p-1 border">
               <button className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${lang === 'vi' ? 'bg-white shadow-sm' : 'text-secondary'}`} onClick={() => setLang('vi')}>VN</button>
               <button className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${lang === 'en' ? 'bg-white shadow-sm' : 'text-secondary'}`} onClick={() => setLang('en')}>EN</button>
            </div>

            <div className="d-flex align-items-center gap-2">
               <NotificationBell />
               <button 
                 className="btn btn-light rounded-circle p-2 border-0 bg-transparent text-secondary hover-bg-light transition-all" 
                 title="Gửi hỗ trợ" 
                 onClick={openSupport}
               >
                  <Mail size={20} />
               </button>
            </div>

            <div className="vr mx-1 opacity-10" style={{ height: '24px' }}></div>

            <div className="dropdown position-relative">
              <button
                className="btn border-0 d-flex align-items-center gap-2 py-1 pe-0 ps-2 bg-transparent"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="text-end d-none d-lg-block">
                  <div className="fw-bold text-dark lh-1" style={{ fontSize: '0.95rem' }}>{user.fullName || 'Minh Anh'}</div>
                </div>
                <ChevronDown size={14} className="text-muted d-none d-lg-block" />
              </button>
              {userMenuOpen && (
                <>
                  <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 998 }} onClick={() => setUserMenuOpen(false)} />
                  <div className="dropdown-menu dropdown-menu-end show position-absolute end-0 mt-2 shadow-lg border-0 rounded-4 overflow-hidden user-user-menu" style={{ zIndex: 999, width: 260, boxShadow: '0 10px 40px rgba(0,0,0,0.12)' }}>
                    <div className="p-3 border-bottom bg-light">
                      <div className="fw-bold text-dark">{user.fullName || 'Alex Harrison'}</div>
                      <div className="text-muted small">{user.email || 'alex@example.com'}</div>
                    </div>

                    <div className="p-2">
                      <Link to="/profile" className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 small" onClick={() => setUserMenuOpen(false)}>
                        <User size={16} /> Hồ sơ của tôi
                      </Link>
                      <button className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 small" onClick={() => { setUserMenuOpen(false); setPasswordOpen(true); }}>
                        <KeyRound size={16} /> Đổi mật khẩu
                      </button>
                    </div>

                    <div className="p-2 border-top">
                      <button className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 text-danger small fw-bold" onClick={handleLogout}>
                        <LogOut size={16} /> Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        )}

        <main className="overflow-auto flex-grow-1 bg-light p-4">
          <div className="container-fluid p-0 flex-grow-1">
            {children}
          </div>

          {/* Footer - White Modern Style */}
          <footer className="bg-white border-top mt-5 pt-5 pb-4 px-4">
            <div className="container-fluid">
              <div className="row g-4 align-items-center">
                <div className="col-12 col-md-6">
                  <h5 className="fw-bold mb-2" style={{ color: '#4c49ed' }}>{user.companyName || 'E-Learning System'}</h5>
                  <p className="text-secondary small mb-0">
                    Nền tảng học tập trực tuyến hàng đầu dành cho doanh nghiệp và học viên hiện đại.
                  </p>
                </div>

                <div className="col-12 col-md-6 text-md-end">
                  <div className="d-flex gap-4 justify-content-md-end mb-2">
                    <Link to="/dashboard" className="text-secondary text-decoration-none small hover-link">Bảng điều khiển</Link>
                    <Link to="/my-courses" className="text-secondary text-decoration-none small hover-link">Khóa học của tôi</Link>
                    <a href="#" className="text-secondary text-decoration-none small hover-link" onClick={(e) => { e.preventDefault(); openSupport(); }}>Hỗ trợ</a>
                  </div>
                  <p className="text-muted m-0" style={{ fontSize: '0.75rem' }}>© {new Date().getFullYear()} {user.companyName || 'E-Learning'}. Tất cả quyền được bảo lưu.</p>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>



      {/* Support modal */}
      {supportOpen && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 2000, background: 'rgba(0,0,0,0.35)' }} onClick={closeSupport} />
          <div className="position-fixed top-0 end-0 h-100 bg-white shadow-lg" style={{ zIndex: 2001, width: 'min(520px, 100vw)' }}>
            <div className="d-flex align-items-center justify-content-between px-3 py-2 text-white" style={{ background: '#002060' }}>
              <button type="button" className="btn btn-link text-white p-1 text-decoration-none" onClick={closeSupport} aria-label="Back">
                ←
              </button>
              <div className="fw-bold">Trợ lý AI</div>
              <button type="button" className="btn btn-link text-white p-1 text-decoration-none" onClick={closeSupport} aria-label="Close">
                ✕
              </button>
            </div>

            <form onSubmit={submitSupport} className="p-3" style={{ overflow: 'auto', height: 'calc(100% - 44px)' }}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Họ tên</label>
                <input
                  className="form-control"
                  placeholder="Họ tên của bạn"
                  value={supportForm.fullName}
                  onChange={(e) => setSupportForm((p) => ({ ...p, fullName: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email của bạn"
                  value={supportForm.email}
                  onChange={(e) => setSupportForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Nội dung liên hệ</label>
                <textarea
                  className="form-control"
                  rows={6}
                  placeholder="Nội dung liên hệ của bạn..."
                  value={supportForm.message}
                  onChange={(e) => setSupportForm((p) => ({ ...p, message: e.target.value }))}
                />
              </div>
              <div className="mb-2">
                <label className="form-label small fw-semibold">Đính kèm tập tin</label>
                <input type="file" className="form-control" multiple onChange={handleSupportFiles} />
                {supportForm.files?.length > 0 && (
                  <div className="mt-2 d-flex flex-wrap gap-2">
                    {supportForm.files.map((f, idx) => (
                      <span key={f.name + idx} className="badge text-bg-light border d-inline-flex align-items-center gap-2">
                        <span className="text-truncate" style={{ maxWidth: 240 }}>{f.name}</span>
                        <button type="button" className="btn btn-sm p-0 border-0" onClick={() => removeSupportFileAt(idx)} aria-label="Remove">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-2">
                <button type="submit" className="btn btn-primary" disabled={supportSubmitting || !supportForm.message?.trim()}>
                  {supportSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

    

      <UserAccountDialogs
        passwordOpen={passwordOpen}
        onClosePassword={() => setPasswordOpen(false)}
      />

      <style>{`
        .hover-bg-light:hover {
          background-color: #f8f9fa;
        }
        .transition-all { transition: all 0.3s ease; }
        .user-user-menu { border-color: rgba(15, 23, 42, 0.08) !important; }
        .active-sidebar-item { border-right: 3px solid #4c49ed; border-radius: 8px 0 0 8px !important; }
        .nav-link:hover { background-color: #f5f3ff; color: #4c49ed !important; }
        .cursor-pointer { cursor: pointer; }
        .hover-primary:hover { color: #4c49ed !important; }
        .hover-link:hover { color: #4c49ed !important; text-decoration: underline !important; }
        .search-input-premium {
          border: 1px solid transparent !important;
        }
        .search-input-premium:focus {
          background-color: #fff !important;
          border-color: #4c49ed !important;
          box-shadow: 0 0 0 4px rgba(76, 73, 237, 0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default UserLayout;
