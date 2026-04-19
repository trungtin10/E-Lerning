import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Thanh chuyển trang đồng bộ admin: [‹] Trang x / y [›]
 */
export default function AdminPaginationBar({
  page,
  totalPages,
  onPrev,
  onNext,
  disabled = false,
  className = '',
}) {
  const tp = Math.max(1, totalPages || 1);
  const p = Math.min(Math.max(1, page || 1), tp);

  return (
    <div className={`admin-pagination ${className}`.trim()} role="navigation" aria-label="Phân trang">
      <button
        type="button"
        className="admin-pagination__btn"
        disabled={disabled || p <= 1}
        onClick={onPrev}
        aria-label="Trang trước"
      >
        <ChevronLeft size={18} strokeWidth={2} />
      </button>
      <span className="admin-pagination__label">
        Trang {p} / {tp}
      </span>
      <button
        type="button"
        className="admin-pagination__btn"
        disabled={disabled || p >= tp}
        onClick={onNext}
        aria-label="Trang sau"
      >
        <ChevronRight size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
