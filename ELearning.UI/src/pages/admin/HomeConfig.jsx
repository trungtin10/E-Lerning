import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import { Search, Pencil, Image as ImageIcon } from 'lucide-react';

const titleByPath = {
  '/admin/home-config/header': 'Đầu trang',
  '/admin/home-config/slider-vi': 'Slider trang chủ VN',
  '/admin/home-config/slider-en': 'Slider trang chủ EN',
  '/admin/home-config/small-banner': 'Banner nhỏ',
  '/admin/home-config/testimonials': 'Cảm nhận khách hàng',
  '/admin/home-config/footer': 'Thông tin chân trang',
  '/admin/home-config/policy': 'Chính sách & Quy định',
  '/admin/home-config/social-links': 'Liên kết mạng xã hội',
};

export default function HomeConfig() {
  const { pathname } = useLocation();
  const title = titleByPath[pathname] || 'Cấu hình trang chủ';
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data matching the image
  const [configs] = useState([
    { id: 1, name: 'Slogan EN', value: 'Slogan EN', type: 'text' },
    { id: 2, name: 'Slogan VN', value: 'Slogan VN', type: 'text' },
    { id: 3, name: 'Logo', value: '/logo-haga.png', type: 'image', logoLabel: 'HAGAsmartech' },
  ]);

  return (
    <AdminLayout>
      <div className="system-config-container shadow-sm border rounded-2 overflow-hidden bg-white">
        {/* Header Bar */}
        <div className="bg-primary px-3 py-2 text-white fw-bold d-flex align-items-center" style={{ backgroundColor: '#0071ae !important' }}>
          Danh sách cấu hình
        </div>

        {/* Filter / Search Bar */}
        <div className="bg-light p-3 border-bottom d-flex align-items-center justify-content-center gap-2">
          <label className="small fw-medium text-dark">ConfigName</label>
          <input 
            type="text" 
            className="form-control form-control-sm" 
            style={{ maxWidth: 200 }} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-sm px-4 d-flex align-items-center gap-1 border shadow-sm btn-light-grey">
            <Search size={14} /> Tìm kiếm
          </button>
        </div>

        {/* Config Table */}
        <div className="table-responsive">
          <table className="table table-bordered table-hover mb-0 align-middle config-custom-table">
            <thead className="table-light">
              <tr className="text-center">
                <th style={{ width: 50 }}>STT</th>
                <th>Tên cấu hình</th>
                <th>Giá trị</th>
                <th style={{ width: 100 }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config, index) => (
                <tr key={config.id}>
                  <td className="text-center">{index + 1}</td>
                  <td>{config.name}</td>
                  <td>
                    {config.type === 'image' ? (
                      <div className="d-flex align-items-center gap-2">
                         <span className="fw-bold fs-6 text-dark" style={{ letterSpacing: '1px' }}>HAGA</span>
                         <span className="text-warning small fw-bold">smartech</span>
                      </div>
                    ) : (
                      config.value
                    )}
                  </td>
                  <td className="text-center">
                    <button className="btn btn-link p-0 text-warning">
                      <Pencil size={18} fill="currentColor" strokeWidth={1} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .btn-light-grey {
          background: linear-gradient(to bottom, #fefefe 0%, #d1d1d1 100%);
          border: 1px solid #a1a1a1;
          color: #333;
          font-weight: 500;
        }
        .btn-light-grey:hover {
          background: linear-gradient(to bottom, #e1e1e1 0%, #c1c1c1 100%);
        }
        .config-custom-table thead th {
          background-color: #f2f2f2;
          font-size: 0.9rem;
          padding: 8px;
          color: #333;
        }
        .config-custom-table tbody td {
          padding: 10px 12px;
          font-size: 0.9rem;
        }
        .system-config-container {
          border: 1px solid #ccc;
        }
      `}</style>
    </AdminLayout>
  );
}

