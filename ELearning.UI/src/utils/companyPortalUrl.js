export const getCompanyPortalUrl = (company) => {
  if (!company || !company.subDomain) return '/';
  
  const protocol = window.location.protocol;
  const currentHost = window.location.host;
  
  if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
    // Tách port ra (ví dụ :5173) để nối subdomain vào
    const portPos = currentHost.indexOf(':');
    const port = portPos !== -1 ? currentHost.substring(portPos) : ':5173';
    return `${protocol}//${company.subDomain}.localhost${port}`;
  }
  
  // Xử lý hostname production (ex: abc.lms.com -> tenant.lms.com)
  const parts = currentHost.split('.');
  if (parts.length > 2) {
    parts[0] = company.subDomain;
    return `${protocol}//${parts.join('.')}`;
  }
  
  // Fallback
  return `${protocol}//${company.subDomain}.${currentHost}`;
};
