import React, { useEffect, useState } from 'react';

const LoadingBar = ({ loading }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) {
      setVisible(true);
      setProgress(0);
      const t1 = setTimeout(() => setProgress(30), 50);
      const t2 = setTimeout(() => setProgress(70), 200);
      const t3 = setTimeout(() => setProgress(90), 400);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setProgress(100);
      const t = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [loading]);

  if (!visible) return null;

  return (
    <div
      className="position-fixed top-0 start-0 end-0"
      style={{
        height: 3,
        zIndex: 9999,
        backgroundColor: 'transparent',
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          backgroundColor: '#6366f1',
          transition: progress < 100 ? 'width 0.2s ease-out' : 'width 0.3s ease-in',
          boxShadow: '0 0 10px rgba(99,102,241,0.5)'
        }}
      />
    </div>
  );
};

export default LoadingBar;
