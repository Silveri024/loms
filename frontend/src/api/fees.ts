import api from './axios';

export const getFeeByCaseId = async (caseId) => {
  const response = await api.get(`/fees/case/${caseId}`);
  return response.data;
};

export const createOrUpdateFee = async (feeData) => {
  const response = await api.post('/fees', feeData);
  return response.data;
};

export const addPayment = async (paymentData) => {
  const response = await api.post('/fees/payment', paymentData);
  return response.data;
};

export const getMonthlySummary = async (year, month) => {
  const response = await api.get(`/fees/summary/monthly?year=${year}&month=${month}`);
  return response.data;
};
