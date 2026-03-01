import api from './axios';

export const getLogsByCaseId = async (caseId) => {
  const response = await api.get(`/logs/case/${caseId}`);
  return response.data;
};

export const createLog = async (logData) => {
  const response = await api.post('/logs', logData);
  return response.data;
};
