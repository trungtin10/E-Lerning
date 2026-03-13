import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../api/axios';
import {
  Building2, Users, BookOpen, ShieldAlert, Loader2,
  Clock, ChevronRight, ChevronLeft, MoreHorizontal, Plus, Calendar as CalendarIcon,
  Inbox
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1));

  // State cho lịch hẹn (Mặc định để trống để test giao diện khi chưa có lịch)
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    fetchStats();
    // Giả sử sau này sẽ gọi API lấy lịch hẹn tại đây: fetchSchedule();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/superadmin/dashboard-stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) days.push({ day: prevMonthDays - i, currentMonth: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, currentMonth: true, isToday: i === 6 && month === 2 && year === 2026 });
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) days.push({ day: i, currentMonth: false });
    return days;
  };

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  if (loading || !stats) {
    return (
      <AdminLayout>
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
          <Loader2 className="animate-spin text-primary mb-3" size={48} />
          <p className="text-muted fw-medium">Đang tải dữ liệu tổng quan...</p>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    { label: 'Tổng Công ty', value: stats.totalCompanies, icon: Building2, color: 'primary' },
    { label: 'Người dùng', value: stats.totalUsers, icon: Users, color: 'success' },
    { label: 'Khóa học', value: stats.totalCourses, icon: BookOpen, color: 'warning' },
    { label: 'Chờ kích hoạt', value: stats.pendingActivations, icon: ShieldAlert, color: 'danger' },
  ];

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold tracking-tight mb-1">Tổng quan hệ thống</h2>
        <p className="text-muted small">Dữ liệu quản trị thời gian thực.</p>
      </div>

      <div className="row g-4">
        {/* CỘT TRÁI */}
        <div className="col-12 col-lg-8">
          <div className="row g-3 mb-4">
            {statCards.map((stat, i) => (
              <div key={i} className="col-12 col-sm-6">
                <div className="card border-0 shadow-sm rounded-4 p-4 h-100 transition-all hover-shadow">
                  <div className="d-flex align-items-center gap-3">
                    <div className={`bg-${stat.color}-subtle p-3 rounded-4 text-${stat.color}`}>
                      <stat.icon size={24} />
                    </div>
                    <div>
                      <h3 className="fw-bold mb-0">{stat.value}</h3>
                      <div className="text-muted small fw-bold text-uppercase tracking-wider">{stat.label}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card border-0 shadow-sm rounded-4 p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">Hoạt động gần đây</h5>
              <button className="btn btn-light btn-sm fw-bold text-primary border">Tất cả</button>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light border-0">
                  <tr>
                    <th className="border-0 rounded-start small text-uppercase">Đối tượng</th>
                    <th className="border-0 small text-uppercase">Hành động</th>
                    <th className="border-0 rounded-end small text-uppercase text-end">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentActivities && stats.recentActivities.map((activity, i) => (
                    <tr key={i}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="p-1.5 bg-primary-subtle rounded-2 text-primary">
                            <Building2 size={14} />
                          </div>
                          <span className="fw-bold small">{activity.title}</span>
                        </div>
                      </td>
                      <td className="text-muted small">{activity.description}</td>
                      <td className="text-end text-muted small">
                        {new Date(activity.time).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex align-items-center gap-2">
                <CalendarIcon size={20} className="text-primary" />
                <h5 className="fw-bold mb-0">Thời khóa biểu</h5>
              </div>
              <button className="btn btn-link p-0 text-muted"><MoreHorizontal size={20} /></button>
            </div>

            <div className="calendar-mini mb-4 p-3 bg-light rounded-4 text-center">
              <div className="fw-bold text-primary mb-1">Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}</div>
              <div className="d-flex justify-content-between px-2">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                  <small key={d} className="text-muted fw-bold" style={{ fontSize: '0.6rem' }}>{d}</small>
                ))}
              </div>
              <div className="d-flex justify-content-between mt-2 px-1">
                {renderCalendarDays().slice(0, 7).map((item, i) => (
                  <div key={i} className={`rounded-circle d-flex align-items-center justify-content-center ${item.isToday ? 'bg-primary text-white shadow-sm' : ''}`} style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                    {item.day}
                  </div>
                ))}
              </div>
            </div>

            {/* HIỂN THỊ LỊCH HẸN NẾU CÓ, NGƯỢC LẠI HIỆN THÔNG BÁO TRỐNG */}
            <div className="schedule-list d-flex flex-column gap-3 pt-3 border-top">
              {schedule.length > 0 ? (
                schedule.map((item, i) => (
                  <div key={i} className="d-flex gap-3 p-2 rounded-3 hover-bg-light transition-all cursor-pointer">
                    <div className="text-primary fw-bold small pt-1" style={{ minWidth: '45px' }}>{item.time}</div>
                    <div className="border-start ps-3">
                      <div className="fw-bold text-dark small">{item.task}</div>
                      <div className="text-muted" style={{ fontSize: '0.65rem' }}>{item.type}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-5 opacity-50">
                  <Inbox size={40} className="text-muted mb-2 mx-auto" />
                  <p className="small fw-medium mb-0">Hôm nay chưa có lịch hẹn nào</p>
                </div>
              )}
            </div>

            <button className="btn btn-primary w-100 mt-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
              <Plus size={18} /> Thêm lịch hẹn
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .hover-shadow:hover { transform: translateY(-5px); box-shadow: 0 1rem 3rem rgba(0,0,0,.1) !important; }
        .hover-bg-light:hover { background-color: #f8f9fa; }
        .cursor-pointer { cursor: pointer; }
      `}</style>
    </AdminLayout>
  );
};

export default Dashboard;
