import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotify } from '../../../context/NotifyContext';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import CompanyTable from './CompanyTable';
import AssignAdminModal from './AssignAdminModal';

const Companies = () => {
  const navigate = useNavigate();
  const { toast, confirm } = useNotify();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState(() => new Set());

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/superadmin/companies');
      setCompanies(response.data);
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ title: 'Xóa công ty', message: 'Bạn có chắc chắn muốn xóa công ty này? Toàn bộ dữ liệu và tài khoản liên quan sẽ bị xóa vĩnh viễn.', confirmText: 'Xóa' });
    if (!ok) return;
    try {
      await api.delete(`/superadmin/companies/${id}`);
      toast('Đã xóa công ty thành công.', 'success');
      setSelectedCompanyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchCompanies();
    } catch (err) {
      const errorMsg = err.response?.data || 'Lỗi không xác định khi xóa.';
      toast(typeof errorMsg === 'string' ? errorMsg : 'Lỗi khi xóa công ty.', 'error');
    }
  };

  const handleEdit = (company) => {
    navigate(`/admin/companies/edit/${company.id}`, { state: { company } });
  };

  const handleAssignAdmin = (company) => {
    setSelectedCompany(company);
    setShowAssignModal(true);
  };

  const normalizePlan = (c) => (c.servicePlan && String(c.servicePlan).trim()) || 'Basic';

  const filteredCompanies = companies.filter((c) => {
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      const name = (c.companyName || '').toLowerCase();
      const sub = (c.subDomain || '').toLowerCase();
      if (!name.includes(q) && !sub.includes(q)) return false;
    }
    if (statusFilter === 'active' && !c.isActive) return false;
    if (statusFilter === 'inactive' && c.isActive) return false;
    if (planFilter) {
      if (normalizePlan(c).toLowerCase() !== planFilter.toLowerCase()) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPlanFilter('');
  };

  const toggleCompanyRowSelected = (id) => {
    setSelectedCompanyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    const ids = filteredCompanies.map((c) => c.id);
    setSelectedCompanyIds((prev) => {
      const next = new Set(prev);
      const allOn = ids.length > 0 && ids.every((i) => next.has(i));
      if (allOn) ids.forEach((i) => next.delete(i));
      else ids.forEach((i) => next.add(i));
      return next;
    });
  };

  return (
    <AdminLayout>
      {/* Header Bar */}
      <div className="border-bottom border-danger border-2 mb-4">
        <div className="d-flex align-items-center gap-2 pb-2">
          <div className="rounded-circle bg-primary" style={{ width: 8, height: 8 }}></div>
          <h4 className="fw-bold mb-0 text-primary">Danh sách công ty</h4>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-light p-3 border rounded-3 mb-3">
        <div className="row g-3 align-items-center">
          <div className="col-auto">
            <select
              className="form-select form-select-sm border-secondary-subtle"
              style={{ minWidth: 150 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Chọn trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Chưa kích hoạt</option>
            </select>
          </div>
          <div className="col-auto">
            <select
              className="form-select form-select-sm border-secondary-subtle"
              style={{ minWidth: 200 }}
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="">Chọn gói dịch vụ</option>
              <option value="Basic">Basic</option>
              <option value="Plus">Plus</option>
              <option value="Pro">Pro</option>
            </select>
          </div>
          <div className="col ps-0">
            <div className="d-flex gap-1 justify-content-center">
              <input
                type="text"
                className="form-control form-control-sm border-secondary-subtle"
                style={{ maxWidth: 200 }}
                placeholder="Tìm kiếm công ty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-sm btn-primary px-3 shadow-sm d-flex align-items-center"
                onClick={() => fetchCompanies()}
                title="Tải lại danh sách từ máy chủ"
              >
                Tìm
              </button>
            </div>
          </div>
          <div className="col-auto d-flex gap-2">
            <button type="button" className="btn btn-sm btn-danger px-3 shadow-sm" onClick={clearFilters}>
              Xóa
            </button>
            <button 
              className="btn btn-sm btn-primary px-3 shadow-sm fw-bold"
              onClick={() => navigate('/admin/companies/create')}
            >
              Tạo mới
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="card shadow-sm border rounded-2 overflow-hidden bg-white">
        <CompanyTable
          companies={filteredCompanies}
          loading={loading}
          selectedCompanyIds={selectedCompanyIds}
          onToggleRow={toggleCompanyRowSelected}
          onToggleAllFiltered={toggleSelectAllFiltered}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onAssignAdmin={handleAssignAdmin}
        />
      </div>

      <AssignAdminModal 
        isOpen={showAssignModal} 
        company={selectedCompany} 
        onClose={() => { setShowAssignModal(false); setSelectedCompany(null); }} 
      />
    </AdminLayout>
  );
};

export default Companies;
