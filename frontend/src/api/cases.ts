import api from './axios';

export const getAllCases = async () => {
  const response = await api.get('/cases');
  return response.data;
};

export const getCaseById = async (id) => {
  const response = await api.get(`/cases/${id}`);
  return response.data;
};

export const createCase = async (caseData) => {
  const response = await api.post('/cases', caseData);
  return response.data;
};

export const updateCase = async (id, caseData) => {
  const response = await api.put(`/cases/${id}`, caseData);
  return response.data;
};

export const deleteCase = async (id) => {
  const response = await api.delete(`/cases/${id}`);
  return response.data;
};

export const getCaseAccess = async (id) => {
  const response = await api.get(`/cases/${id}/access`);
  return response.data;
};

export const upsertCaseAccess = async (id, payload) => {
  const response = await api.post(`/cases/${id}/access`, payload);
  return response.data;
};

export const revokeCaseAccess = async (id, internId) => {
  const response = await api.delete(`/cases/${id}/access/${internId}`);
  return response.data;
};
