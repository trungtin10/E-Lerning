// Store toàn cục cho loading - axios gọi từ bên ngoài React
let loadingCount = 0;
let handlers = { start: () => {}, done: () => {} };

export const setLoadingHandlers = (h) => {
  handlers = h ? { start: h.start || (() => {}), done: h.done || (() => {}) } : { start: () => {}, done: () => {} };
};

export const startLoading = () => {
  loadingCount++;
  if (handlers?.start) handlers.start();
};

export const doneLoading = () => {
  loadingCount = Math.max(0, loadingCount - 1);
  if (loadingCount === 0 && handlers?.done) handlers.done();
};
