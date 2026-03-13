import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Building2, User, CheckCircle2, XCircle, Trash2, Edit2, Loader2, Calendar, ExternalLink, Layers, Hash, Clock, Eye } from 'lucide-react';

const CourseTable = ({ courses, loading, onDelete, onEdit }) => {
  const navigate = useNavigate();

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

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="bg-light border-bottom">
          <tr>
            <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase" style={{ width: '150px' }}>Mã khóa học</th>
            <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Tên khóa học</th>
            <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Danh mục</th>
            <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Đơn vị sở hữu</th>
            <th className="py-3 border-0 text-secondary small fw-bold text-uppercase" style={{ width: '220px' }}>Thời gian học</th>
            <th className="py-3 border-0 text-secondary small fw-bold text-uppercase text-center">Trạng thái</th>
            <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase text-end">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id}>
              <td className="px-4 py-3">
                <span className="badge bg-primary-subtle text-primary fw-bold font-monospace px-3 py-2 rounded-3">
                  {course.courseCode}
                </span>
              </td>
              <td className="py-3">
                <div
                  className="fw-bold text-primary fs-6 cursor-pointer hover-underline d-flex align-items-center gap-3"
                  onClick={() => navigate(`/admin/courses/${course.id}`)}
                  title="Nhấn để xem nội dung khóa học"
                >
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                  ) : (
                    <div className="bg-light p-2 rounded-2 text-muted d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                      <BookOpen size={18} className="opacity-50" />
                    </div>
                  )}
                  {course.title}
                </div>
              </td>
              <td className="py-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-1 bg-info-subtle rounded-2 text-info"><Layers size={14} /></div>
                  <span className="small fw-bold text-secondary text-uppercase" style={{ fontSize: '0.65rem' }}>{course.categoryName}</span>
                </div>
              </td>
              <td className="py-3">
                <div className="d-flex align-items-center gap-2 text-muted small fw-medium">
                  <Building2 size={14} className="opacity-50" /> {course.companyName ?? course.CompanyName ?? 'Hệ thống tổng'}
                </div>
              </td>
              <td className="py-3">
                <div className="d-flex flex-column gap-1">
                  <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.75rem' }}>
                    <Calendar size={12} className="opacity-50" />
                    <span>Bắt đầu: {formatDateTime(course.startDate)}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-danger" style={{ fontSize: '0.75rem' }}>
                    <Clock size={12} className="opacity-50" />
                    <span className="fw-bold">Hết hạn: {formatDateOnly(course.endDate)}</span>
                  </div>
                </div>
              </td>
              <td className="py-3 text-center">
                {course.isPublished ? (
                  <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill border border-success-subtle" style={{ fontSize: '0.65rem' }}>CÔNG KHAI</span>
                ) : (
                  <span className="badge bg-secondary-subtle text-secondary px-3 py-2 rounded-pill border border-secondary-subtle" style={{ fontSize: '0.65rem' }}>BẢN NHÁP</span>
                )}
              </td>
              <td className="px-4 py-3 text-end">
                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-white btn-sm p-2 rounded-3 border shadow-sm text-info hover-bg-info-subtle transition-all" onClick={() => window.open(`/course/${course.id}`, '_blank')} title="Xem giao diện Học viên"><Eye size={16} /></button>
                  <button className="btn btn-white btn-sm p-2 rounded-3 border shadow-sm text-primary hover-bg-primary-subtle transition-all" onClick={() => onEdit(course)} title="Sửa thông tin"><Edit2 size={16} /></button>
                  <button className="btn btn-white btn-sm p-2 rounded-3 border shadow-sm text-danger hover-bg-danger-subtle transition-all" onClick={() => onDelete(course.id)} title="Xóa khóa học"><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        .hover-underline:hover { text-decoration: underline !important; }
      `}</style>
    </div>
  );
};

export default CourseTable;
