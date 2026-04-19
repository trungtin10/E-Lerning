import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Building2, User, CheckCircle2, XCircle, Trash2, Edit2, Loader2, Calendar, ExternalLink, Layers, Hash, Clock, Eye, MoreVertical } from 'lucide-react';

const CourseTable = ({ courses, loading, onDelete, onEdit }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div className="text-center py-5">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-muted mt-2 small">Đang tải danh sách khóa học...</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-5 bg-white rounded-4 border border-dashed">
        <BookOpen size={48} className="text-muted mb-3 opacity-20" />
        <p className="text-muted fw-medium">Chưa có khóa học nào được tạo.</p>
      </div>
    );
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const day = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time} - ${day}`;
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'Không thời hạn';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const cellStyle = { fontSize: '0.8125rem', fontWeight: 500, color: '#475569', lineHeight: 1.4 };

  return (
    <div className="table-responsive course-table admin-table-framed-wrapper">
      <table className="table table-hover mb-0 admin-table-framed">
        <thead className="bg-light border-bottom">
          <tr>
            <th className="px-4 py-3 border-0 text-uppercase" style={{ width: '150px', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em' }}>Mã khóa học</th>
            <th className="py-3 border-0 text-uppercase" style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em' }}>Tên khóa học</th>
            <th className="py-3 border-0 text-uppercase" style={{ width: '140px', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em' }}>Danh mục</th>
            <th className="py-3 border-0 text-uppercase" style={{ width: '140px', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em' }}>Đơn vị sở hữu</th>
            <th className="py-3 border-0 text-uppercase" style={{ width: '200px', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em' }}>Thời gian học</th>
            <th className="py-3 border-0 text-uppercase text-center" style={{ width: '100px', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em' }}>Trạng thái</th>
            <th className="px-4 py-3 border-0 text-uppercase text-end" style={{ width: '120px', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id} className="course-table-row">
              <td className="px-4 py-3 align-middle">
                <span className="badge bg-primary-subtle text-primary px-2 py-1 rounded-2" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                  {course.courseCode}
                </span>
              </td>
              <td className="py-3 align-middle">
                <div
                  className="d-flex align-items-center gap-2 cursor-pointer hover-underline text-primary course-title-cell"
                  style={cellStyle}
                  onClick={() => navigate(`/admin/courses/${course.id}`, { state: { from: location.pathname } })}
                  title={course.title}
                >
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt="" className="flex-shrink-0" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }} />
                  ) : (
                    <div className="bg-light rounded-2 text-muted flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, padding: 6 }}>
                      <BookOpen size={16} className="opacity-50" />
                    </div>
                  )}
                  <span className="course-title-text">{course.title}</span>
                </div>
              </td>
              <td className="py-3 align-middle">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-1 bg-info-subtle rounded-2 text-info flex-shrink-0"><Layers size={12} /></div>
                  <span style={cellStyle}>{course.categoryName}</span>
                </div>
              </td>
              <td className="py-3 align-middle">
                <div className="d-flex align-items-center gap-2" style={cellStyle}>
                  <Building2 size={12} className="opacity-50 flex-shrink-0" />
                  <span>{course.companyName ?? course.CompanyName ?? 'Hệ thống tổng'}</span>
                </div>
              </td>
              <td className="py-3 align-middle">
                <div className="d-flex align-items-center gap-2">
                  <Calendar size={12} className="opacity-50 flex-shrink-0" />
                  <span style={cellStyle}>{formatDateTime(course.startDate)}</span>
                </div>
                <div className="d-flex align-items-center gap-2 mt-0.5">
                  <Clock size={12} className="opacity-50 flex-shrink-0" />
                  <span style={{ ...cellStyle, fontSize: '0.75rem', color: '#94a3b8' }}>Hết hạn: {formatDateOnly(course.endDate)}</span>
                </div>
              </td>
              <td className="py-3 text-center align-middle">
                {course.isPublished ? (
                  <span className="badge bg-success-subtle text-success px-2 py-1 rounded-pill" style={{ fontSize: '0.7rem', fontWeight: 500 }}>CÔNG KHAI</span>
                ) : (
                  <span className="badge bg-secondary-subtle text-secondary px-2 py-1 rounded-pill" style={{ fontSize: '0.7rem', fontWeight: 500 }}>BẢN NHÁP</span>
                )}
              </td>
              <td className="px-4 py-3 text-end align-middle">
                <div className="dropdown">
                  <button
                    className="btn btn-white btn-sm p-2 rounded-3 text-secondary border shadow-sm transition-all"
                    type="button"
                    data-bs-toggle="dropdown"
                    data-bs-popper-config={JSON.stringify({ strategy: 'fixed' })}
                    data-bs-boundary="viewport"
                    data-bs-offset="0,8"
                    aria-expanded="false"
                  >
                    <MoreVertical size={16} />
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3">
                    <li>
                      <button className="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => window.open(`/course/${course.id}`, '_blank')}>
                        <Eye size={16} className="text-info" /> Xem giao diện
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => onEdit(course)}>
                        <Edit2 size={16} className="text-primary" /> Sửa thông tin
                      </button>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" onClick={() => onDelete(course.id, course.title)}>
                        <Trash2 size={16} /> Xóa khóa học
                      </button>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        .course-table table { border-collapse: collapse; }
        .course-table th,
        .course-table td { vertical-align: middle !important; }
        .course-table-row { min-height: 56px; }
        .course-table th { padding-top: 14px !important; padding-bottom: 14px !important; }
        .course-table td { padding-top: 12px !important; padding-bottom: 12px !important; }
        .course-title-cell { min-width: 0; }
        .course-title-text { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.35; }
        .hover-underline:hover { text-decoration: underline !important; }
        .mt-0\.5 { margin-top: 2px; }
      `}</style>
    </div>
  );
};

export default CourseTable;
