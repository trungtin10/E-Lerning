import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { NotifyProvider } from './context/NotifyContext';

const BASE_TITLE = 'E-Learning SaaS';
const pathTitles = {
  '/login': 'Đăng nhập',
  '/confirm-email': 'Xác nhận email',
  '/admin/dashboard': 'Dashboard',
  '/admin/companies': 'Quản lý công ty',
  '/admin/users': 'Quản lý người dùng',
  '/admin/company-users': 'Nhân viên công ty',
  '/admin/courses': 'Khóa học',
  '/admin/company-courses': 'Khóa học',
  '/admin/categories': 'Danh mục',
  '/admin/settings': 'Cài đặt',
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
import Login from './pages/auth/Login';
import ConfirmEmail from './pages/auth/ConfirmEmail';
import AdminDashboard from './pages/admin/Dashboard';
import Companies from './pages/admin/companies/index';
import Users from './pages/admin/Users';
import CompanyUsers from './pages/admin/CompanyUsers';
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
  return (
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/companies" element={<Companies />} />
        <Route path="/admin/users" element={<Users />} />
        {/* SỬA ROUTE: Thêm tham số :subDomain */}
        <Route path="/admin/company-users/:subDomain" element={<CompanyUsers />} />
        <Route path="/admin/courses" element={<Courses />} />
        <Route path="/admin/company-courses" element={<Courses />} />
        <Route path="/admin/courses/:id" element={<CourseDetail />} />
        <Route path="/admin/courses/:id/quiz" element={<QuizBuilder />} />
        <Route path="/admin/categories" element={<Categories />} />
        <Route path="/admin/categories/:categoryId/courses" element={<CategoryCourses />} />

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
      <Router>
        <AppRoutes />
      </Router>
    </NotifyProvider>
  );
}

export default App;
