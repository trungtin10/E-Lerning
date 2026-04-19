import React, { useState, useRef, useEffect } from 'react';
import { Building2, Edit2, Trash2, Loader2, Check, Copy, MoreVertical, Eye, X } from 'lucide-react';
import { getUploadUrl } from '../../../api/axios';
import { getCompanyPortalUrl } from '../../../utils/companyPortalUrl';

const CompanyTable = ({
  companies,
  loading,
  selectedCompanyIds,
  onToggleRow,
  onToggleAllFiltered,
  onEdit,
  onDelete,
  onAssignAdmin,
}) => {
  const [brokenLogos, setBrokenLogos] = useState(new Set());
  const markLogoBroken = (id) => setBrokenLogos((s) => new Set(s).add(id));
  const headerCheckboxRef = useRef(null);

  const visibleIds = companies.map((c) => c.id);
  const selectedOnPage = visibleIds.filter((id) => selectedCompanyIds.has(id)).length;
  const allFilteredSelected = visibleIds.length > 0 && selectedOnPage === visibleIds.length;

  useEffect(() => {
    const el = headerCheckboxRef.current;
    if (!el) return;
    el.indeterminate = selectedOnPage > 0 && selectedOnPage < visibleIds.length;
  }, [selectedOnPage, visibleIds.length]);

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
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', { 
      hour: '2-digit', minute: '2-digit',
      day: '2-digit', month: '2-digit', year: 'numeric' 
    });
  };

  return (
    <div className="table-responsive">
      <table className="table table-bordered table-hover align-middle mb-0 custom-product-table">
        <thead className="table-light text-center">
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ width: 40 }}>
              <input
                ref={headerCheckboxRef}
                type="checkbox"
                className="form-check-input"
                checked={allFilteredSelected}
                onChange={() => onToggleAllFiltered()}
                aria-label="Chọn tất cả công ty đang hiển thị"
              />
            </th>
            <th style={{ width: 50 }}>STT</th>
            <th style={{ width: 100 }}>Hình ảnh</th>
            <th>Tên công ty</th>
            <th style={{ width: 150 }}>Gói dịch vụ</th>
            <th style={{ width: 150 }}>SubDomain</th>
            <th style={{ width: 100 }}>Trạng thái</th>
            <th style={{ width: 180 }}>Thông tin</th>
            <th style={{ width: 120 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company, index) => (
            <tr key={company.id}>
              <td className="text-center">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={selectedCompanyIds.has(company.id)}
                  onChange={() => onToggleRow(company.id)}
                  aria-label={`Chọn ${company.companyName || 'công ty'}`}
                />
              </td>
              <td className="text-center fw-bold text-muted">{index + 1}</td>
              <td className="text-center">
                <div className="bg-white border rounded overflow-hidden shadow-sm mx-auto" style={{ width: 60, height: 60 }}>
                  {company.logoUrl && !brokenLogos.has(company.id) ? (
                    <img
                      src={getUploadUrl(company.logoUrl)}
                      alt="logo"
                      className="w-100 h-100 object-fit-contain"
                      onError={() => markLogoBroken(company.id)}
                    />
                  ) : (
                    <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                       <Building2 size={24} className="text-muted" />
                    </div>
                  )}
                </div>
              </td>
              <td>
                <a
                  href={getCompanyPortalUrl(company)}
                  target="_blank"
                  rel="noreferrer"
                  className="fw-bold text-primary text-decoration-none"
                >
                  {company.companyName}
                </a>
              </td>
              <td className="text-center">
                {company.servicePlan?.includes('Dùng thử') || company.servicePlan?.includes('Free') ? (
                  <div className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-2 fw-bold">
                    {company.servicePlan.includes('Dùng thử') 
                      ? company.servicePlan.replace(/.*\(Dùng thử/, 'Free (Dùng thử')
                      : company.servicePlan}
                  </div>
                ) : (
                  <div className="badge bg-primary-subtle text-primary-emphasis border border-primary-subtle px-3 py-2 fw-bold">
                    {company.servicePlan || 'Chưa mua gói'}
                  </div>
                )}
              </td>
              <td className="text-center">
                <span className="text-danger fw-bold">{company.subDomain}</span>
              </td>
              <td className="text-center">
                {company.isActive ? (
                  <Check size={20} className="text-success" strokeWidth={3} />
                ) : (
                  <X size={20} className="text-danger opacity-85" strokeWidth={3} />
                )}
              </td>
              <td className="small text-muted">
                <div className="mb-1"><span className="fw-medium text-dark">{formatDateTime(company.createdAt)}</span></div>
                <div className="text-nowrap overflow-hidden text-truncate" style={{ maxWidth: 160 }}>
                  ID-{company.id?.toString().slice(0, 4)} - ({company.contactEmail})
                </div>
              </td>
              <td className="text-center">
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
                      <a
                        href={getCompanyPortalUrl(company)}
                        target="_blank"
                        rel="noreferrer"
                        className="dropdown-item d-flex align-items-center gap-2 py-2 text-info fw-medium"
                      >
                        <Eye size={16} /> Xem hệ thống
                      </a>
                    </li>
                    <li>
                      <button className="dropdown-item d-flex align-items-center gap-2 py-2 text-success" onClick={() => onAssignAdmin(company)}>
                        <Copy size={16} /> Cấp tài khoản quản trị
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item d-flex align-items-center gap-2 py-2 text-primary" onClick={() => onEdit(company)}>
                        <Edit2 size={16} /> Chỉnh sửa thông tin
                      </button>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" onClick={() => onDelete(company.id)}>
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

      <style>{`
        .custom-product-table thead th {
          font-size: 0.85rem;
          font-weight: 700;
          color: #555;
          border-bottom: 2px solid #dee2e6;
        }
        .custom-product-table tbody td {
          font-size: 0.88rem;
          padding: 12px 8px;
        }
        .custom-product-table .form-check-input {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default CompanyTable;
