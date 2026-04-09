import React from 'react';
import { Building2, Globe, Users, Edit2, Trash2, Loader2, Mail, Calendar, Clock, UserPlus, MoreVertical } from 'lucide-react';
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
    let dStr = dateString;
    // Nếu backend trả về UTC nhưng thiếu 'Z', ta chủ động thêm để JS hiểu đúng là UTC
    if (typeof dStr === 'string' && !dStr.endsWith('Z') && !dStr.includes('+')) {
      dStr += 'Z';
    }
    const date = new Date(dStr);
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const day = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time} - ${day}`;
  };

  const parseUtc = (d) => {
    if (!d) return null;
    let s = d;
    if (typeof s === 'string' && !s.endsWith('Z') && !s.includes('+')) s += 'Z';
    const dt = new Date(s);
    return Number.isNaN(dt.getTime()) ? null : dt;
  };

  const getPlanBadge = (company) => {
    const now = new Date();
    const exp = parseUtc(company.planExpiresAt);
    const hasPaid = !!company.hasPaidSubscription;

    // Trial = có expiresAt trong tương lai nhưng chưa có giao dịch completed
    if (exp && exp > now && !hasPaid) {
      const daysLeft = Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        label: daysLeft > 0 ? `Miễn phí · còn ${daysLeft} ngày` : 'Miễn phí',
        cls: 'bg-secondary-subtle text-secondary border border-secondary-subtle',
      };
    }

    // Hết trial và chưa đăng ký gói
    if ((!hasPaid) && (!company.servicePlanId || !company.servicePlan)) {
      return { label: 'Chưa đăng ký', cls: 'bg-light text-muted border' };
    }

    // Có gói (đã mua hoặc admin gán)
    const planName = company.servicePlan || '—';
    const planCls =
      planName === 'Enterprise' ? 'bg-danger-subtle text-danger border border-danger-subtle' :
      planName === 'Business' ? 'bg-primary-subtle text-primary border border-primary-subtle' :
      'bg-success-subtle text-success border border-success-subtle';

    // Nếu có hạn và đã hết hạn
    if (exp && exp <= now) {
      return { label: `${planName} · Hết hạn`, cls: 'bg-warning-subtle text-warning border border-warning-subtle' };
    }

    return { label: planName, cls: planCls };
  };

  return (
    <div className="table-responsive admin-table-framed-wrapper">
      <table className="table table-hover align-middle mb-0 admin-table-framed admin-table-compact" style={{ minWidth: '920px' }}>
        <thead className="bg-light border-bottom">
          <tr>
            <th className="px-3 py-3 border-0 text-secondary small fw-bold text-uppercase align-middle" style={{ width: '56px' }}>Logo</th>
            <th className="py-3 border-0 text-secondary small fw-bold text-uppercase align-middle" style={{ minWidth: '220px' }}>Thông tin Công ty</th>
            <th className="py-3 border-0 text-secondary small fw-bold text-uppercase align-middle" style={{ minWidth: '140px' }}>Domain</th>
            <th className="py-3 border-0 text-secondary small fw-bold text-uppercase align-middle" style={{ minWidth: '150px', whiteSpace: 'nowrap' }}>Thời gian</th>
            <th className="py-3 border-0 text-secondary small fw-bold text-uppercase text-center align-middle" style={{ width: '84px' }}>Quy mô</th>
            <th className="py-3 border-0 text-secondary small fw-bold text-uppercase text-center align-middle" style={{ minWidth: '120px' }}>Trạng thái</th>
            <th className="py-3 border-0 text-secondary small fw-bold text-uppercase text-center align-middle" style={{ minWidth: '140px' }}>Gói dịch vụ</th>
            <th className="px-3 py-3 border-0 text-secondary small fw-bold text-uppercase text-end align-middle" style={{ width: '1%', whiteSpace: 'nowrap' }}>View</th>
          </tr>
        </thead>
        <tbody className="border-0">
          {companies.map((company) => (
            <tr key={company.id} className="border-bottom-0">
              <td className="px-3 py-3 align-middle">
                <div className="bg-white rounded-3 border d-flex align-items-center justify-content-center overflow-hidden mx-auto" style={{ width: '36px', height: '36px' }}>
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
              <td className="py-3 align-middle" style={{ minWidth: '200px', maxWidth: '280px' }}>
                <div className="fw-bold text-dark text-break mb-0">{company.companyName}</div>
                <div className="text-muted small d-flex align-items-center gap-1 mt-1 min-w-0">
                  <Mail size={12} className="opacity-50 flex-shrink-0" />
                  <span className="text-truncate" title={company.contactEmail || ''}>{company.contactEmail || 'Chưa có email'}</span>
                </div>
              </td>
              <td className="py-3 align-middle">
                <div className="d-flex align-items-center gap-2 min-w-0">
                  <div className="p-1 bg-primary-subtle rounded-2 text-primary flex-shrink-0"><Globe size={14} /></div>
                  <span className="text-primary fw-semibold small font-monospace text-break">{company.subDomain}</span>
                </div>
              </td>
              <td className="py-3 align-middle" style={{ whiteSpace: 'nowrap' }}>
                <div className="d-flex flex-column gap-1">
                  <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.72rem' }}>
                    <Calendar size={12} className="text-secondary opacity-75 flex-shrink-0" />
                    <span>Tạo: {formatDateTime(company.createdAt)}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-info" style={{ fontSize: '0.72rem' }}>
                    <Clock size={12} className="text-info opacity-75 flex-shrink-0" />
                    <span className="fw-bold">Sửa: {formatDateTime(company.updatedAt)}</span>
                  </div>
                </div>
              </td>
              <td className="py-3 text-center align-middle">
                <div className="d-inline-flex align-items-center justify-content-center gap-1 px-2 py-1 bg-light rounded-pill border text-dark small fw-bold" style={{ fontSize: '0.75rem' }}>
                  <Users size={14} className="text-muted flex-shrink-0" /> {company.userCount}
                </div>
              </td>
              <td className="py-3 text-center align-middle">
                <span className={`badge rounded-3 fw-bold d-inline-block text-wrap ${company.isActive ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-secondary border border-secondary-subtle'}`} style={{ maxWidth: '140px' }}>
                  {company.isActive ? 'Đang hoạt động' : 'Chưa kích hoạt'}
                </span>
              </td>
              <td className="py-3 text-center align-middle">
                {(() => {
                  const b = getPlanBadge(company);
                  return (
                    <span className={`badge rounded-3 fw-bold d-inline-block text-wrap ${b.cls}`} style={{ maxWidth: '160px' }}>
                      {b.label}
                    </span>
                  );
                })()}
              </td>
              <td className="px-3 py-3 text-end align-middle">
                <div className="dropdown d-inline-block">
                  <button
                    className="btn btn-white btn-sm p-2 rounded-3 text-secondary border transition-all"
                    type="button"
                    data-bs-toggle="dropdown"
                    data-bs-popper-config={JSON.stringify({ strategy: 'fixed' })}
                    data-bs-offset="0,8"
                    aria-expanded="false"
                    aria-label="Thao tác"
                  >
                    <MoreVertical size={18} />
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 py-1" style={{ minWidth: '12rem' }}>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item d-flex align-items-center gap-2 py-2"
                        onClick={() => onAssignAdmin(company)}
                      >
                        <UserPlus size={16} className="text-success" /> Cấp thêm Admin
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item d-flex align-items-center gap-2 py-2"
                        onClick={() => onEdit(company)}
                      >
                        <Edit2 size={16} className="text-primary" /> Chỉnh sửa
                      </button>
                    </li>
                    <li><hr className="dropdown-divider my-1" /></li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger"
                        onClick={() => onDelete(company.id)}
                      >
                        <Trash2 size={16} /> Xóa công ty
                      </button>
                    </li>
                  </ul>
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
