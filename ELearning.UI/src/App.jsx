import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { NotifyProvider } from './context/NotifyContext';
import { LoadingProvider, useLoading } from './context/LoadingContext';
import { LanguageProvider } from './context/LanguageContext';
import LoadingBar from './components/common/LoadingBar';
import AnnouncementCenter from './components/common/AnnouncementCenter';
import { getUploadUrl } from './api/axios';

const BASE_TITLE = 'E-Learning SaaS';
const DEFAULT_FAVICON = '/h_logo.png';
const pathTitles = {
  '/login': 'Đăng nhập',
  '/forgot-password': 'Đặt lại mật khẩu',
  '/reset-password': 'Đặt mật khẩu mới',
  '/confirm-email': 'Xác nhận email',
  '/admin/dashboard': 'Cấu hình trang chủ',
  '/admin/home-config/header': 'Đầu trang',
  '/admin/home-config/slider-vi': 'Slider trang chủ VN',
  '/admin/home-config/slider-en': 'Slider trang chủ EN',
  '/admin/home-config/small-banner': 'Banner nhỏ',
  '/admin/home-config/testimonials': 'Cảm nhận khách hàng',
  '/admin/home-config/footer': 'Thông tin chân trang',
  '/admin/home-config/policy': 'Chính sách & Quy định',
  '/admin/home-config/social-links': 'Liên kết mạng xã hội',
  '/admin/companies': 'Quản lý công ty',
  '/admin/companies/create': 'Tạo công ty mới',
  '/admin/users': 'Quản lý người dùng',
  '/admin/company-users': 'Nhân viên công ty',
  '/admin/learners': 'Theo dõi học viên',
  '/admin/courses': 'Khóa học',
  '/admin/company-courses': 'Khóa học',
  '/admin/categories': 'Danh mục',
  '/admin/settings': 'Cài đặt',
  '/admin/plans': 'Gói dịch vụ',
  '/admin/subscription': 'Gói dịch vụ & Thanh toán',
  '/checkout/vnpay-return': 'Kết quả thanh toán',
  '/admin/transactions': 'Giao dịch',
  '/admin/audit-logs': 'Nhật ký',
  '/admin/tickets': 'Hỗ trợ',
  '/admin/announcements': 'Thông báo',
  '/admin/profile': 'Hồ sơ',
  '/profile': 'Hồ sơ',
  '/dashboard': 'Trang chủ',
  '/courses': 'Khám phá khóa học',
  '/course': 'Chi tiết khóa học',
  '/learning': 'Học tập',
  '/my-courses': 'Khóa học của tôi',
  '/certificates': 'Chứng chỉ',
  '/settings': 'Cài đặt',
};

function usePageTitle() {
  const { pathname } = useLocation();
  const { start, done } = useLoading();
  useEffect(() => {
    start();
    const t = setTimeout(done, 350);
    return () => clearTimeout(t);
  }, [pathname]);
  useEffect(() => {
    const segs = pathname.split('/').filter(Boolean);
    let title = BASE_TITLE;
    for (let i = segs.length; i >= 1; i--) {
      const path = '/' + segs.slice(0, i).join('/');
      if (pathTitles[path]) {
        title = `${pathTitles[path]} - ${BASE_TITLE}`;
        break;
      }
    }
    document.title = title;
    return () => { document.title = BASE_TITLE; };
  }, [pathname]);
}

function useFaviconSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    const publicPaths = ['/login', '/forgot-password', '/reset-password', '/confirm-email'];
    const isPublic = publicPaths.some(p => pathname.startsWith(p));
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
    let faviconUrl = DEFAULT_FAVICON;
    if (!isPublic && token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.companyLogoUrl) {
          faviconUrl = getUploadUrl(user.companyLogoUrl) || DEFAULT_FAVICON;
        }
      } catch { /* ignore */ }
    }
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, [pathname]);
}

function AppWithLoading() {
  const { loading } = useLoading();
  return (
    <>
      <AnnouncementCenter />
      <LoadingBar loading={loading} />
      <AppRoutes />
    </>
  );
}
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ConfirmEmail from './pages/auth/ConfirmEmail';
import AdminDashboard from './pages/admin/Dashboard';
import Companies from './pages/admin/companies/index';
import CreateCompany from './pages/admin/companies/CreateCompany';
import EditCompany from './pages/admin/companies/EditCompany';
import Users from './pages/admin/Users';
import PlanManagement from './pages/admin/plans/PlanManagement';
import Transactions from './pages/admin/plans/Transactions';
import AuditLogs from './pages/admin/plans/AuditLogs';
import Tickets from './pages/admin/plans/Tickets';
import CreateTicket from './pages/admin/plans/CreateTicket';
import Announcements from './pages/admin/plans/Announcements';
import Subscription from './pages/admin/plans/Subscription';
import CheckoutReturn from './pages/admin/plans/CheckoutReturn';
import CompanyUsers from './pages/admin/CompanyUsers';
import Learners from './pages/admin/Learners';
import HomeConfig from './pages/admin/HomeConfig';
import Courses from './pages/admin/courses/index';
import CourseDetail from './pages/admin/courses/CourseDetail';
import Categories from './pages/admin/courses/Categories';
import CategoryCourses from './pages/admin/courses/CategoryCourses';
import QuizBuilder from './pages/admin/courses/QuizBuilder';
import UserDashboard from './pages/user/Dashboard';
import LearningView from './pages/user/LearningView';
import CourseOverview from './pages/user/CourseOverview';
import CourseList from './pages/user/CourseList';
import MyCourses from './pages/user/MyCourses';
import Resources from './pages/user/Resources';
import Community from './pages/user/Community';
import MyProfile from './pages/account/MyProfile';

function ProtectedRoute({ children, allowedRoles }) {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
  const location = useLocation();

  if (!token || !userStr) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (allowedRoles && !allowedRoles.some(role => user.roles?.includes(role))) {
      // Nếu là học viên (không có quyền admin), chuyển về dashboard học viên
      return <Navigate to="/dashboard" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  usePageTitle();
  useFaviconSync();

  const adminRoles = ['SuperAdmin', 'Admin', 'Editor'];
  return (
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Admin Routes - Protected */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={adminRoles}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/home-config/header" element={<ProtectedRoute allowedRoles={adminRoles}><HomeConfig /></ProtectedRoute>} />
        <Route path="/admin/home-config/slider-vi" element={<ProtectedRoute allowedRoles={adminRoles}><HomeConfig /></ProtectedRoute>} />
        <Route path="/admin/home-config/slider-en" element={<ProtectedRoute allowedRoles={adminRoles}><HomeConfig /></ProtectedRoute>} />
        <Route path="/admin/home-config/small-banner" element={<ProtectedRoute allowedRoles={adminRoles}><HomeConfig /></ProtectedRoute>} />
        <Route path="/admin/home-config/testimonials" element={<ProtectedRoute allowedRoles={adminRoles}><HomeConfig /></ProtectedRoute>} />
        <Route path="/admin/home-config/footer" element={<ProtectedRoute allowedRoles={adminRoles}><HomeConfig /></ProtectedRoute>} />
        <Route path="/admin/home-config/policy" element={<ProtectedRoute allowedRoles={adminRoles}><HomeConfig /></ProtectedRoute>} />
        <Route path="/admin/home-config/social-links" element={<ProtectedRoute allowedRoles={adminRoles}><HomeConfig /></ProtectedRoute>} />
        <Route path="/admin/companies" element={<ProtectedRoute allowedRoles={adminRoles}><Companies /></ProtectedRoute>} />
        <Route path="/admin/companies/create" element={<ProtectedRoute allowedRoles={adminRoles}><CreateCompany /></ProtectedRoute>} />
        <Route path="/admin/companies/edit/:id" element={<ProtectedRoute allowedRoles={adminRoles}><EditCompany /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={adminRoles}><Users /></ProtectedRoute>} />
        <Route path="/admin/company-users/:subDomain" element={<ProtectedRoute allowedRoles={adminRoles}><CompanyUsers /></ProtectedRoute>} />
        <Route path="/admin/learners" element={<ProtectedRoute allowedRoles={adminRoles}><Learners /></ProtectedRoute>} />
        <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={adminRoles}><Courses /></ProtectedRoute>} />
        <Route path="/admin/company-courses" element={<ProtectedRoute allowedRoles={adminRoles}><Courses /></ProtectedRoute>} />
        <Route path="/admin/courses/:id" element={<ProtectedRoute allowedRoles={adminRoles}><CourseDetail /></ProtectedRoute>} />
        <Route path="/admin/courses/:id/quiz" element={<ProtectedRoute allowedRoles={adminRoles}><QuizBuilder /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={adminRoles}><Categories /></ProtectedRoute>} />
        <Route path="/admin/categories/:categoryId/courses" element={<ProtectedRoute allowedRoles={adminRoles}><CategoryCourses /></ProtectedRoute>} />
        <Route path="/admin/plans" element={<ProtectedRoute allowedRoles={adminRoles}><PlanManagement /></ProtectedRoute>} />
        <Route path="/admin/subscription" element={<ProtectedRoute allowedRoles={adminRoles}><Subscription /></ProtectedRoute>} />
        <Route path="/checkout/vnpay-return" element={<ProtectedRoute allowedRoles={adminRoles}><CheckoutReturn /></ProtectedRoute>} />
        <Route path="/admin/transactions" element={<ProtectedRoute allowedRoles={adminRoles}><Transactions /></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={adminRoles}><AuditLogs /></ProtectedRoute>} />
        <Route path="/admin/tickets/new" element={<ProtectedRoute allowedRoles={adminRoles}><CreateTicket /></ProtectedRoute>} />
        <Route path="/admin/tickets/:ticketId?" element={<ProtectedRoute allowedRoles={adminRoles}><Tickets /></ProtectedRoute>} />
        <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={adminRoles}><Announcements /></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={adminRoles}><MyProfile /></ProtectedRoute>} />

        {/* User Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/course" element={<Navigate to="/courses" replace />} />
        <Route path="/courses" element={<ProtectedRoute><CourseList /></ProtectedRoute>} />
        <Route path="/course/:id" element={<ProtectedRoute><CourseOverview /></ProtectedRoute>} />
        <Route path="/learning/:courseId" element={<ProtectedRoute><LearningView /></ProtectedRoute>} />
        <Route path="/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path="/certificates" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />

        {/* Placeholder */}
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={adminRoles}><AdminDashboard /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <NotifyProvider>
      <LoadingProvider>
        <LanguageProvider>
          <Router>
            <AppWithLoading />
          </Router>
        </LanguageProvider>
      </LoadingProvider>
    </NotifyProvider>
  );
}

export default App;
