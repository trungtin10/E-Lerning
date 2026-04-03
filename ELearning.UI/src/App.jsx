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
  '/admin/dashboard': 'Dashboard',
  '/admin/companies': 'Quản lý công ty',
  '/admin/companies/create': 'Tạo công ty mới',
  '/admin/companies/checkout-success': 'Xác nhận thanh toán',
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
  '/dashboard': 'Dashboard',
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
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
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
import CheckoutSuccess from './pages/admin/companies/CheckoutSuccess';
import Users from './pages/admin/Users';
import PlanManagement from './pages/admin/plans/PlanManagement';
import Transactions from './pages/admin/plans/Transactions';
import AuditLogs from './pages/admin/plans/AuditLogs';
import Tickets from './pages/admin/plans/Tickets';
import Announcements from './pages/admin/plans/Announcements';
import Subscription from './pages/admin/plans/Subscription';
import CheckoutReturn from './pages/admin/plans/CheckoutReturn';
import CompanyUsers from './pages/admin/CompanyUsers';
import Learners from './pages/admin/Learners';
import Courses from './pages/admin/courses/index';
import CourseDetail from './pages/admin/courses/CourseDetail';
import Categories from './pages/admin/courses/Categories';
import CategoryCourses from './pages/admin/courses/CategoryCourses';
import QuizBuilder from './pages/admin/courses/QuizBuilder';
import UserDashboard from './pages/user/Dashboard';
import LearningView from './pages/user/LearningView';
import CourseOverview from './pages/user/CourseOverview';
import CourseList from './pages/user/CourseList';

function AppRoutes() {
  usePageTitle();
  useFaviconSync();
  return (
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/companies" element={<Companies />} />
        <Route path="/admin/companies/create" element={<CreateCompany />} />
        <Route path="/admin/companies/edit/:id" element={<EditCompany />} />
        <Route path="/admin/companies/checkout-success" element={<CheckoutSuccess />} />
        <Route path="/admin/users" element={<Users />} />
        {/* SỬA ROUTE: Thêm tham số :subDomain */}
        <Route path="/admin/company-users/:subDomain" element={<CompanyUsers />} />
        <Route path="/admin/learners" element={<Learners />} />
        <Route path="/admin/courses" element={<Courses />} />
        <Route path="/admin/company-courses" element={<Courses />} />
        <Route path="/admin/courses/:id" element={<CourseDetail />} />
        <Route path="/admin/courses/:id/quiz" element={<QuizBuilder />} />
        <Route path="/admin/categories" element={<Categories />} />
        <Route path="/admin/categories/:categoryId/courses" element={<CategoryCourses />} />
        <Route path="/admin/plans" element={<PlanManagement />} />
        <Route path="/admin/subscription" element={<Subscription />} />
        <Route path="/checkout/vnpay-return" element={<CheckoutReturn />} />
        <Route path="/admin/transactions" element={<Transactions />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} />
        <Route path="/admin/tickets/:ticketId?" element={<Tickets />} />
        <Route path="/admin/announcements" element={<Announcements />} />

        {/* User Routes */}
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/course" element={<Navigate to="/courses" replace />} />
        <Route path="/courses" element={<CourseList />} />
        <Route path="/course/:id" element={<CourseOverview />} />
        <Route path="/learning/:courseId" element={<LearningView />} />
        <Route path="/my-courses" element={<UserDashboard />} />
        <Route path="/certificates" element={<UserDashboard />} />
        <Route path="/settings" element={<UserDashboard />} />

        {/* Placeholder */}
        <Route path="/admin/settings" element={<AdminDashboard />} />
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
