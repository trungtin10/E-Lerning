import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <Router>
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
        <Route path="/admin/courses/:id" element={<CourseDetail />} />
        <Route path="/admin/courses/:id/quiz" element={<QuizBuilder />} />
        <Route path="/admin/categories" element={<Categories />} />
        <Route path="/admin/categories/:categoryId/courses" element={<CategoryCourses />} />

        {/* User Routes */}
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/course/:id" element={<CourseOverview />} />
        <Route path="/learning/:courseId" element={<LearningView />} />
        <Route path="/my-courses" element={<UserDashboard />} />
        <Route path="/certificates" element={<UserDashboard />} />
        <Route path="/settings" element={<UserDashboard />} />

        {/* Placeholder */}
        <Route path="/admin/settings" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
