import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../../components/layout/UserLayout';
import api, { getUploadUrl } from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import { BookOpen, Loader2, ChevronRight, Calendar, Hash } from 'lucide-react';

const UserDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const logoUrl = user?.companyLogoUrl ? getUploadUrl(user.companyLogoUrl) : '/h_logo.png';

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/learning/my-courses');
      setCourses(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = courses.filter((c) => {
    const pct = Math.round(c.progressPercentage || 0);
    const isEnrolled = c.isEnrolled !== false;
    if (filter === 'dang-hoc') return isEnrolled && pct < 100;
    if (filter === 'da-hoan-thanh') return isEnrolled && pct >= 100;
    return true;
  });

  const formatEndDate = (d) => {
    if (!d) return t('noDeadline');
    const locale = lang === 'vi' ? 'vi-VN' : 'en-US';
    return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getProgressColor = (pct) => {
    if (pct >= 100) return '#10b981';
    if (pct >= 50) return '#6366f1';
    return '#f59e0b';
  };

  return (
    <UserLayout>
      <div className="container-fluid px-4 px-md-5 pt-4 pb-5" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="mb-5">
          <h2 className="fw-bold mb-2" style={{ color: '#0f172a', fontSize: '1.75rem', letterSpacing: '-0.02em' }}>{t('myCoursesTitle')}</h2>
          <p className="text-secondary small mb-0">{t('myCoursesDesc')}</p>
          <div className="d-flex align-items-center gap-2 flex-wrap mt-3">
            <button className={`btn btn-sm rounded-pill px-4 py-2 fw-medium ${filter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilter('all')}>{t('filterAll')}</button>
            <button className={`btn btn-sm rounded-pill px-4 py-2 fw-medium ${filter === 'dang-hoc' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilter('dang-hoc')}>{t('filterInProgress')}</button>
            <button className={`btn btn-sm rounded-pill px-4 py-2 fw-medium ${filter === 'da-hoan-thanh' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilter('da-hoan-thanh')}>{t('filterCompleted')}</button>
            {filter !== 'all' && (
              <button className="btn btn-link p-0 text-secondary small ms-2" onClick={() => setFilter('all')}>{t('clearFilter')}</button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5"><Loader2 className="animate-spin text-primary" size={40} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 80, height: 80, backgroundColor: '#f1f5f9' }}>
              <BookOpen size={40} style={{ color: '#94a3b8' }} />
            </div>
            <h5 className="fw-bold mb-2" style={{ color: '#475569' }}>{t('noCourses')}</h5>
            <p className="text-secondary small">{t('noCoursesHint')}</p>
          </div>
        ) : null}
        {!loading && filtered.length > 0 && (
          <div className="d-flex flex-column gap-4">
            {filtered.map((course) => {
              const pct = Math.round(course.progressPercentage || 0);
              const isEnrolled = course.isEnrolled !== false;
              return (
                <div
                  key={course.id}
                  className="card border-0 rounded-4 overflow-hidden bg-white shadow-sm position-relative"
                  style={{
                    transition: 'all 0.25s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div className="card-body p-5 d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-4">
                    <div className="flex-grow-1 min-w-0 d-flex align-items-center gap-4">
                      <div className="flex-shrink-0 d-flex align-items-center justify-content-center rounded-3 overflow-hidden bg-white border" style={{ width: 72, height: 72, padding: 8, borderColor: '#e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                        <img src={logoUrl} alt="Logo" className="w-100 h-100 object-fit-contain" onError={(e) => { e.target.onerror = null; e.target.src = '/h_logo.png'; }} />
                      </div>
                      <div className="min-w-0 flex-grow-1">
                        <h5 className="fw-bold mb-2" style={{ color: '#0f172a', fontSize: '1.15rem', lineHeight: 1.4 }}>{course.title}</h5>
                        <div className="d-flex flex-wrap align-items-center gap-3 small text-secondary mb-3">
                          <span className="d-flex align-items-center gap-1">
                            <Hash size={14} /> {course.courseCode}
                          </span>
                          <span className="d-flex align-items-center gap-1">
                            <Calendar size={14} /> {t('endDate')}: {formatEndDate(course.endDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        className="btn btn-primary rounded-3 px-5 py-3 fw-semibold d-flex align-items-center gap-2"
                        style={{ fontSize: '0.95rem' }}
                        onClick={() => navigate(isEnrolled ? (pct >= 100 ? `/course/${course.id}` : `/learning/${course.id}`) : `/learning/${course.id}`)}
                      >
                        {!isEnrolled ? t('startLearning') : (pct >= 100 ? t('viewCourse') : t('continueLearning'))}
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default UserDashboard;
