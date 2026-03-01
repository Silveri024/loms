// Utility functions for role-based access control

export const getUserRole = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user).role : null;
};

export const isAdmin = () => {
  return getUserRole() === 'admin';
};

export const isLawyer = () => {
  return getUserRole() === 'lawyer';
};

export const hasRole = (role) => {
  return getUserRole() === role;
};

export const canDeleteTemplate = () => {
  return isAdmin();
};

export const canEditTemplate = () => {
  return isAdmin();
};

export const canCreateTemplate = () => {
  return isAdmin();
};

export const canViewTemplates = () => {
  return true; // all authenticated users
};
