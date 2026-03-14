import React from 'react';
import { Building2, Globe, Users, CreditCard, Image as ImageIcon, Edit2, Trash2, Loader2, Mail, Calendar, Clock, UserPlus } from 'lucide-react';
import { getUploadUrl } from '../../../api/axios';

const CompanyTable = ({ companies, loading, onEdit, onDelete, onAssignAdmin }) => {
  const [brokenLogos, setBrokenLogos] = React.useState(new Set());
  const markLogoBroken = (id) => setBrokenLogos((s) => new Set(s).add(id));
  if (loading) {
    return (
      <div className="text-center py-5">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-muted mt-2 small">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="text-center py-5 bg-white rounded-4 border border-dashed">
        <Building2 size={48} className="text-muted mb-3 opacity-20" />
        <p className="text-muted fw-medium">Chưa có dữ liệu công ty khách hàng.</p>
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

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="bg-light border-bottom">
          <tr>
            <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase" style={{ width: '80px' }}>Logo</th>
            <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Thông tin Công ty</th>
            <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Địa chỉ Domain</th>
            <th className="py-3 border-0 text-secondary small fw-bold text-uppercase" style={{ width: '220px' }}>Thời gian tạo</th>
            <th className="py-3 border-0 text-secondary small fw-bold text-uppercase text-center" style={{ width: '100px' }}>Quy mô</th>
            <th className="py-3 border-0 text-secondary small fw-bold text-uppercase text-center" style={{ width: '150px' }}>Gói dịch vụ</th>
            <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase text-end" style={{ width: '150px' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody className="border-0">
          {companies.map((company) => (
            <tr key={company.id} className="border-bottom-0">
              <td className="px-4 py-3">
                <div className="bg-white rounded-3 border shadow-sm d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '48px', height: '48px' }}>
                  {company.logoUrl && !brokenLogos.has(company.id) ? (
                    <img
                      src={getUploadUrl(company.logoUrl)}
                      alt="logo"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={() => markLogoBroken(company.id)}
                    />
                  ) : (
                    <Building2 size={20} className="text-primary opacity-50" />
                  )}
                </div>
              </td>
              <td className="py-3">
                <div className="fw-bold text-dark fs-6 mb-0">{company.companyName}</div>
                <div className="text-muted small d-flex align-items-center gap-1 mt-1">
                  <Mail size={12} className="opacity-50" />
                  <span className="text-truncate" style={{ maxWidth: '180px' }}>{company.contactEmail || 'Chưa có email'}</span>
                </div>
              </td>
              <td className="py-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-1.5 bg-primary-subtle rounded-2 text-primary"><Globe size={14} /></div>
                  <span className="text-primary fw-semibold small font-monospace">{company.subDomain}</span>
                </div>
              </td>
              <td className="py-3">
                <div className="d-flex flex-column gap-1">
                  <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.75rem' }}>
                    <Calendar size={12} className="text-secondary opacity-75" />
                    <span>Tạo: {formatDateTime(company.createdAt)}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-info" style={{ fontSize: '0.75rem' }}>
                    <Clock size={12} className="text-info opacity-75" />
                    <span className="fw-bold">Sửa: {formatDateTime(company.updatedAt)}</span>
                  </div>
                </div>
              </td>
              <td className="py-3 text-center">
                <div className="d-inline-flex align-items-center gap-1 px-3 py-1 bg-light rounded-pill border text-dark small fw-bold">
                  <Users size={14} className="text-muted" /> {company.userCount}
                </div>
              </td>
              <td className="py-3 text-center">
                <span className={`badge w-100 py-2 rounded-3 fw-bold ${
                  company.servicePlan === 'Enterprise' ? 'bg-danger-subtle text-danger border border-danger-subtle' :
                  company.servicePlan === 'Business' ? 'bg-primary-subtle text-primary border border-primary-subtle' :
                  'bg-success-subtle text-success border border-success-subtle'
                }`}>
                  {company.servicePlan || 'Basic'}
                </span>
              </td>
              <td className="px-4 py-3 text-end">
                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-white btn-sm p-2 rounded-3 border shadow-sm text-success hover-bg-success-subtle transition-all" title="Cấp thêm Admin" onClick={() => onAssignAdmin(company)}><UserPlus size={16} /></button>
                  <button className="btn btn-white btn-sm p-2 rounded-3 border shadow-sm text-primary hover-bg-primary-subtle transition-all" title="Chỉnh sửa" onClick={() => onEdit(company)}><Edit2 size={16} /></button>
                  <button className="btn btn-white btn-sm p-2 rounded-3 border shadow-sm text-danger hover-bg-danger-subtle transition-all" title="Xóa công ty" onClick={() => onDelete(company.id)}><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyTable;
