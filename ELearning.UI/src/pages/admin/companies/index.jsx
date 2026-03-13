import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import api from '../../../api/axios';
import { Search, Plus } from 'lucide-react';
import CompanyTable from './CompanyTable';
import AddCompanyModal from './AddCompanyModal';
import EditCompanyModal from './EditCompanyModal';
import AssignAdminModal from './AssignAdminModal';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

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
    if (!window.confirm('Bạn có chắc chắn muốn xóa công ty này? Toàn bộ dữ liệu và tài khoản liên quan sẽ bị xóa vĩnh viễn.')) return;
    try {
      await api.delete(`/superadmin/companies/${id}`);
      fetchCompanies();
      alert('Đã xóa công ty thành công.');
    } catch (err) {
      // HIỂN THỊ LỖI CHI TIẾT
      const errorMsg = err.response?.data || 'Lỗi không xác định khi xóa.';
      alert('LỖI XÓA: ' + (typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)));
    }
  };

  const handleEdit = (company) => {
    setSelectedCompany(company);
    setShowEditModal(true);
  };

  const handleAssignAdmin = (company) => {
    setSelectedCompany(company);
    setShowAssignModal(true);
  };

  const filteredCompanies = companies.filter(c =>
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.subDomain && c.subDomain.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold tracking-tight mb-1">Quản lý Công ty</h2>
          <p className="text-muted small">Danh sách các đối tác và cấu hình hệ thống riêng biệt.</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 rounded-3 shadow-sm fw-bold" onClick={() => setShowAddModal(true)}>
          <Plus size={20} /> Thêm Công ty
        </button>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="input-group bg-light border-0 rounded-3 px-2">
            <span className="input-group-text bg-transparent border-0 text-muted"><Search size={18} /></span>
            <input type="text" className="form-control bg-transparent border-0 py-2" placeholder="Tìm kiếm công ty..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <CompanyTable companies={filteredCompanies} loading={loading} onDelete={handleDelete} onEdit={handleEdit} onAssignAdmin={handleAssignAdmin} />
      </div>

      <AddCompanyModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchCompanies} />
      <EditCompanyModal isOpen={showEditModal} company={selectedCompany} onClose={() => { setShowEditModal(false); setSelectedCompany(null); }} onSuccess={fetchCompanies} />
      <AssignAdminModal isOpen={showAssignModal} company={selectedCompany} onClose={() => { setShowAssignModal(false); setSelectedCompany(null); }} />
    </AdminLayout>
  );
};

export default Companies;
