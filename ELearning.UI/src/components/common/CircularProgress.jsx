import React from 'react';

const CircularProgress = ({ percentage, size = 60, strokeWidth = 6, color = '#4f46e5' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="position-relative d-inline-flex align-items-center justify-content-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          style={{
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 0.5s ease',
            strokeLinecap: 'round'
          }}
        />
      </svg>
      <div className="position-absolute fw-bold" style={{ fontSize: size * 0.25, color: '#1e293b' }}>
        {Math.round(percentage)}%
      </div>
    </div>
  );
};

export default CircularProgress;
