import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../api/axios';
import { 
  Building2, Users, BookOpen, Clock, 
  TrendingUp, Activity, Plus, ArrowRight,
  Loader2, AlertCircle, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.roles?.includes('SuperAdmin');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/superadmin/dashboard-stats');
      setStats(response.data);
    } catch (err) {
      setError('Không thể tải dữ liệu bảng điều khiển.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ marginTop: '-100px' }}>
          <div className="text-center">
            <Loader2 className="animate-spin text-primary mb-3 mx-auto" size={48} />
            <p className="text-muted fw-medium">Đang khởi tạo hệ thống...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, onClick }) => (
    <div 
      className="card border-0 shadow-sm rounded-4 h-100 transition-all hover-translate-y cursor-pointer"
      onClick={onClick}
    >
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className={`p-3 rounded-4 bg-${color} bg-opacity-10 text-${color}`}>
            <Icon size={24} />
          </div>
          <div className="text-muted">
            <TrendingUp size={16} className="text-success me-1" />
            <span className="small fw-semibold">+12%</span>
          </div>
        </div>
        <div>
          <h6 className="text-muted small fw-bold text-uppercase mb-1">{title}</h6>
          <h2 className="fw-bold mb-0">{value || 0}</h2>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h2 className="fw-bold mb-1">Tổng quan hệ thống</h2>
          <p className="text-muted small mb-0">Chào mừng trở lại, {user.fullName || 'Quản trị viên'}. Dưới đây là thống kê mới nhất.</p>
        </div>
        <button 
          className="btn btn-primary px-4 py-2 rounded-3 d-flex align-items-center gap-2 shadow-sm"
          onClick={() => navigate('/admin/announcements')}
        >
          <Plus size={20} /> Tạo thông báo mới
        </button>
      </div>

      {error && (
        <div className="alert alert-danger border-0 rounded-4 d-flex align-items-center gap-3 p-4 mb-4">
          <AlertCircle className="text-danger" size={24} />
          <div>
            <div className="fw-bold">Lỗi truy xuất dữ liệu</div>
            <div className="small opacity-75">{error}</div>
          </div>
          <button className="btn btn-sm btn-outline-danger ms-auto px-3 rounded-pill" onClick={fetchStats}>Thử lại</button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="row g-4 mb-5">
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard 
            title="Tổng số Công ty" 
            value={stats?.totalCompanies} 
            icon={Building2} 
            color="primary" 
            onClick={() => navigate('/admin/companies')}
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard 
            title="Đang hoạt động" 
            value={stats?.activeCompanies} 
            icon={Activity} 
            color="success" 
            onClick={() => navigate('/admin/companies')}
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard 
            title="Tổng Người dùng" 
            value={stats?.totalUsers} 
            icon={Users} 
            color="info" 
            onClick={() => navigate('/admin/users')}
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard 
            title="Tổng Khóa học" 
            value={stats?.totalCourses} 
            icon={BookOpen} 
            color="warning" 
            onClick={() => navigate('/admin/courses')}
          />
        </div>
      </div>

      <div className="row g-4">
        {/* Recent Activity */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-transparent border-0 p-4 pb-0 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Hoạt động gần đây</h5>
              <button className="btn btn-link text-primary text-decoration-none small p-0 fw-bold" onClick={() => navigate('/admin/audit-logs')}>
                Xem tất cả <ChevronRight size={16} />
              </button>
            </div>
            <div className="card-body p-4">
              <div className="d-flex flex-column gap-4">
                {stats?.recentActivities?.length > 0 ? (
                  stats.recentActivities.map((act, i) => (
                    <div key={`${act.type}-${i}-${act.createdAt}`} className="d-flex align-items-start gap-3">
                      <div className={`p-2 rounded-circle bg-${act.entityType === 'Company' ? 'primary' : 'success'} bg-opacity-10 text-${act.entityType === 'Company' ? 'primary' : 'success'}`}>
                        {act.entityType === 'Company' ? <Building2 size={18} /> : <Users size={18} />}
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="fw-bold text-dark">{act.title}</span>
                          <span className="small text-muted">{new Date(act.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <p className="small text-muted mb-0">{act.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5">
                    <Clock size={40} className="text-muted opacity-20 mb-2" />
                    <p className="text-muted small">Chưa ghi nhận hoạt động nào hôm nay.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 bg-primary text-white p-4 h-100">
            <h5 className="fw-bold mb-4">Lối tắt nhanh</h5>
            <div className="d-flex flex-column gap-3">
              <button 
                className="btn btn-white w-100 text-start py-3 px-4 rounded-4 d-flex align-items-center justify-content-between shadow-sm border-0"
                onClick={() => navigate('/admin/companies/create')}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3">
                    <Plus size={18} />
                  </div>
                  <span className="fw-bold text-dark">Thêm công ty</span>
                </div>
                <ArrowRight size={18} className="text-muted" />
              </button>
              
              <button 
                className="btn btn-white w-100 text-start py-3 px-4 rounded-4 d-flex align-items-center justify-content-between shadow-sm border-0"
                onClick={() => navigate('/admin/audit-logs')}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 bg-success bg-opacity-10 text-success rounded-3">
                    <Activity size={18} />
                  </div>
                  <span className="fw-bold text-dark">Xem Nhật ký</span>
                </div>
                <ArrowRight size={18} className="text-muted" />
              </button>

              <div className="mt-4 p-4 bg-white bg-opacity-10 rounded-4 border border-white border-opacity-10">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <AlertCircle size={18} />
                  <span className="fw-bold">Yêu cầu hỗ trợ mới</span>
                </div>
                <p className="small mb-3 opacity-75">Có {stats?.pendingActivations || 0} tài khoản đang chờ kích hoạt email.</p>
                <button 
                  className="btn btn-light w-100 rounded-3 fw-bold py-2"
                  onClick={() => navigate('/admin/users')}
                >
                  Kiểm tra ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .transition-all { transition: all 0.2s ease-in-out; }
        .hover-translate-y:hover { transform: translateY(-5px); }
        .btn-white { background: white; }
        .btn-white:hover { background: #f8fafc; }
      `}</style>
    </AdminLayout>
  );
};

export default Dashboard;
