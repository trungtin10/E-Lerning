import React, { useState } from 'react';
import UserLayout from '../../components/layout/UserLayout';
import { 
  FileText, Download, Search, Filter, 
  FileVideo, FileArchive, FileCode, ExternalLink,
  ChevronRight, BookOpen
} from 'lucide-react';

const Resources = () => {
  const [search, setSearch] = useState('');
  
  const resourceTypes = [
    { label: 'Tất cả', count: 42, active: true },
    { label: 'Tài liệu PDF', count: 18 },
    { label: 'Video bài giảng', count: 12 },
    { label: 'Mã nguồn mẫu', count: 8 },
    { label: 'Khác', count: 4 },
  ];

  const resources = [
    { id: 1, title: 'Giáo trình JavaScript nâng cao - Tập 1', type: 'pdf', size: '4.2 MB', course: 'Fullstack Web Development', date: '12/03/2026' },
    { id: 2, title: 'Source Code Project E-Commerce (React + Node)', type: 'zip', size: '128 MB', course: 'React Masterclass', date: '10/03/2026' },
    { id: 3, title: 'Cheat sheet CSS Grid & Flexbox', type: 'pdf', size: '1.5 MB', course: 'UI/UX Design Basics', date: '08/03/2026' },
    { id: 4, title: 'Video hướng dẫn Setup Môi trường Docker', type: 'video', size: '450 MB', course: 'DevOps for Beginners', date: '05/03/2026' },
    { id: 5, title: 'Ebook: Thuật toán và Cấu trúc dữ liệu', type: 'pdf', size: '8.7 MB', course: 'Computer Science Fundamental', date: '01/03/2026' },
    { id: 6, title: 'Template Báo cáo Đồ án tốt nghiệp', type: 'docx', size: '2.1 MB', course: 'General Resources', date: '28/02/2026' },
  ];

  const getIcon = (type) => {
    switch(type) {
      case 'pdf': return <FileText className="text-danger" size={24} />;
      case 'video': return <FileVideo className="text-primary" size={24} />;
      case 'zip': return <FileArchive className="text-warning" size={24} />;
      case 'code': return <FileCode className="text-info" size={24} />;
      default: return <FileText className="text-secondary" size={24} />;
    }
  };

  return (
    <UserLayout>
      <div className="container-fluid px-md-4 px-lg-5 py-4">
        <div className="mx-auto" style={{ maxWidth: '1400px' }}>
          
          {/* Header Section */}
          <div className="mb-5">
            <h1 className="fw-bold mb-2" style={{ color: '#0f172a', fontSize: '2.5rem', letterSpacing: '-0.03em' }}>
              Kho tài liệu học tập
            </h1>
            <p className="text-secondary fs-5" style={{ maxWidth: '700px' }}>
              Truy cập và tải xuống toàn bộ giáo trình, mã nguồn mẫu và tài liệu bổ trợ cho các khóa học của bạn.
            </p>
          </div>

          <div className="row g-4">
            {/* Sidebar Filters */}
            <div className="col-12 col-lg-3">
              <div className="card border-0 rounded-4 shadow-sm p-4 sticky-top" style={{ top: '100px' }}>
                <h6 className="fw-bold mb-4 d-flex align-items-center gap-2">
                  <Filter size={18} /> Phân loại tài liệu
                </h6>
                <div className="d-flex flex-column gap-2">
                  {resourceTypes.map((t, idx) => (
                    <button 
                      key={idx}
                      className={`btn w-100 text-start d-flex justify-content-between align-items-center py-2 px-3 rounded-3 transition-all border-0 ${t.active ? 'bg-primary text-white shadow-sm' : 'hover-bg-light text-secondary bg-transparent'}`}
                    >
                      <span className="fw-medium">{t.label}</span>
                      <span className={`badge rounded-pill ${t.active ? 'bg-white text-primary' : 'bg-light text-muted'}`}>{t.count}</span>
                    </button>
                  ))}
                </div>

                <hr className="my-4 opacity-50" />

                <h6 className="fw-bold mb-3">Tìm kiếm nhanh</h6>
                <div className="position-relative">
                  <Search className="position-absolute top-50 translate-middle-y ms-3 text-muted" size={16} />
                  <input 
                    type="text" 
                    className="form-control border shadow-none rounded-3 ps-5 py-2" 
                    placeholder="Tên tài liệu..." 
                    style={{ fontSize: '0.9rem' }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Resources List */}
            <div className="col-12 col-lg-9">
              <div className="card border-0 rounded-4 shadow-sm overflow-hidden">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="ps-4 py-3 border-0 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Tên tài liệu</th>
                        <th className="py-3 border-0 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Khóa học liên quan</th>
                        <th className="py-3 border-0 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Kích thước</th>
                        <th className="py-3 border-0 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Ngày đăng</th>
                        <th className="pe-4 py-3 border-0 text-end"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {resources.map((res) => (
                        <tr key={res.id}>
                          <td className="ps-4 py-3">
                            <div className="d-flex align-items-center gap-3">
                              <div className="bg-light rounded-3 d-flex align-items-center justify-content-center shadow-sm" style={{ width: 44, height: 44 }}>
                                {getIcon(res.type)}
                              </div>
                              <div>
                                <div className="fw-bold mb-0 text-dark" style={{ fontSize: '0.95rem' }}>{res.title}</div>
                                <span className="badge bg-light text-muted fw-normal" style={{ fontSize: '0.7rem' }}>.{res.type.toUpperCase()}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center gap-2 text-secondary small">
                              <BookOpen size={14} /> {res.course}
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="text-secondary small">{res.size}</span>
                          </td>
                          <td className="py-3">
                            <span className="text-secondary small">{res.date}</span>
                          </td>
                          <td className="pe-4 py-3 text-end">
                            <button className="btn btn-primary rounded-circle p-2 shadow-sm border-0 d-inline-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                              <Download size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Empty state placeholder footer */}
              <div className="mt-4 p-4 rounded-4 border-2 border-dashed border-light text-center">
                <p className="text-muted mb-0 small">Bạn cần thêm tài liệu? Hãy gửi yêu cầu cho giảng viên thông qua mục hỗ trợ.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </UserLayout>
  );
};

export default Resources;
