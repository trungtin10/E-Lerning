import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../api/axios';
import {
  Building2, Users, BookOpen, ShieldAlert, Loader2,
  ChevronRight, ChevronLeft, MoreHorizontal, Plus, Calendar as CalendarIcon,
  Inbox, TrendingUp, HardDrive
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchAnalytics();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/superadmin/dashboard-stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats({
        totalCompanies: 0,
        totalUsers: 0,
        totalCourses: 0,
        pendingActivations: 0,
        recentActivities: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/superadmin/dashboard-analytics?months=6');
      setAnalytics(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayMondayBased = (year, month) => (new Date(year, month, 1).getDay() + 6) % 7;

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayMondayBased(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ day: prevMonthDays - firstDay + 1 + i, currentMonth: false });
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      days.push({ day: i, currentMonth: true, isToday });
    }
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
      <div className="mb-4 d-flex flex-wrap align-items-end justify-content-between gap-2">
        <div>
          <h2 className="fw-bold tracking-tight mb-1">Tổng quan hệ thống</h2>
          <p className="text-muted small mb-0">Dữ liệu quản trị thời gian thực · {today.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
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

          {analytics && (
            <>
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                <h5 className="fw-bold mb-3">Biểu đồ tăng trưởng (6 tháng)</h5>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.userGrowthByMonth?.length ? analytics.userGrowthByMonth : analytics.companyGrowthByMonth || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#4a90c7" strokeWidth={2} name="Người dùng mới" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                    <h6 className="fw-bold mb-3">Top công ty theo người dùng</h6>
                    <div className="table-responsive">
                      <table className="table table-sm mb-0">
                        <tbody>
                          {(analytics.topCompaniesByUsers || []).slice(0, 5).map((c, i) => (
                            <tr key={c.companyId}>
                              <td className="py-1">{i + 1}. {c.companyName}</td>
                              <td className="text-end py-1 fw-bold">{c.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                    <h6 className="fw-bold mb-3">Top công ty theo dung lượng (MB)</h6>
                    <div className="table-responsive">
                      <table className="table table-sm mb-0">
                        <tbody>
                          {(analytics.topCompaniesByStorage || []).slice(0, 5).map((c, i) => (
                            <tr key={c.companyId}>
                              <td className="py-1">{i + 1}. {c.companyName}</td>
                              <td className="text-end py-1 fw-bold">{c.value} MB</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
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

            <div className="calendar-mini mb-4 p-3 bg-light rounded-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <button type="button" className="btn btn-sm btn-light p-1 rounded-2" onClick={() => changeMonth(-1)} title="Tháng trước">
                  <ChevronLeft size={18} />
                </button>
                <span className="fw-bold text-primary small">Tháng {currentDate.getMonth() + 1}/{currentDate.getFullYear()}</span>
                <button type="button" className="btn btn-sm btn-light p-1 rounded-2" onClick={() => changeMonth(1)} title="Tháng sau">
                  <ChevronRight size={18} />
                </button>
              </div>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm w-100 mb-2 py-1"
                onClick={() => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))}
              >
                Hôm nay ({today.getDate()}/{today.getMonth() + 1})
              </button>
              <div className="dashboard-calendar-grid mb-1">
                {daysOfWeek.map(d => (
                  <small key={d} className="text-muted fw-bold text-center d-flex align-items-center justify-content-center" style={{ fontSize: '0.6rem' }}>{d}</small>
                ))}
              </div>
              <div className="dashboard-calendar-grid">
                {renderCalendarDays().map((item, i) => (
                  <div
                    key={i}
                    className={`rounded-2 d-flex align-items-center justify-content-center dashboard-cal-day ${item.currentMonth ? '' : 'text-muted opacity-60'} ${item.isToday ? 'bg-primary text-white fw-bold' : ''}`}
                  >
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
                  <p className="small fw-medium mb-0">
                    {currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()
                      ? 'Hôm nay chưa có lịch hẹn nào'
                      : `Tháng ${currentDate.getMonth() + 1} chưa có lịch hẹn`}
                  </p>
                </div>
              )}
            </div>

            <button
              className="btn w-100 mt-4 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 border"
              style={{
                background: 'linear-gradient(to bottom, #7ec8e3, #3498db)',
                borderColor: '#1a5276',
                color: '#fff',
                borderRadius: 2,
                textShadow: '0 1px 1px rgba(255,255,255,0.4)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)'
              }}
            >
              <Plus size={18} /> Tạo mới
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .hover-shadow:hover { transform: translateY(-5px); box-shadow: 0 1rem 3rem rgba(0,0,0,.1) !important; }
        .hover-bg-light:hover { background-color: #f8f9fa; }
        .cursor-pointer { cursor: pointer; }
        .dashboard-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }
        .dashboard-cal-day {
          aspect-ratio: 1;
          min-height: 22px;
          font-size: 0.7rem;
        }
      `}</style>
    </AdminLayout>
  );
};

export default Dashboard;
