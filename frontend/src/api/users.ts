import api from './axios';

export const fetchUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post('/users', data);
  return response.data;
};

export const fetchInterns = async () => {
  const users = await fetchUsers();
  return users.filter((u) => u.role === 'intern');
};

export const fetchLawyers = async () => {
  const users = await fetchUsers();
  return users.filter((u) => u.role === 'lawyer');
};

export const updateUser = async (id, data) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};
