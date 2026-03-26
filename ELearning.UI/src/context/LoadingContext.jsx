import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { setLoadingHandlers } from '../utils/loadingStore';

const LoadingContext = createContext(null);

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) return { start: () => {}, done: () => {} };
  return ctx;
};

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  const start = useCallback(() => setLoading(true), []);
  const done = useCallback(() => setLoading(false), []);

  useEffect(() => {
    setLoadingHandlers({ start, done });
    return () => setLoadingHandlers(null);
  }, [start, done]);

  return (
    <LoadingContext.Provider value={{ loading, start, done }}>
      {children}
    </LoadingContext.Provider>
  );
};
