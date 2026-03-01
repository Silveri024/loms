import api from './axios';

export const getDocumentsByCaseId = async (caseId) => {
  const response = await api.get(`/documents/case/${caseId}`);
  return response.data;
};

export const createDocument = async (documentData) => {
  let response;
  if (documentData.file) {
    const form = new FormData();
    form.append('caseId', documentData.caseId);
    form.append('title', documentData.title);
    if (documentData.content) form.append('content', documentData.content);
    form.append('file', documentData.file);
    response = await api.post('/documents', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  } else {
    response = await api.post('/documents', documentData);
  }
  return response.data;
};

export const createDocumentFromTemplate = async (data) => {
  const response = await api.post('/documents/from-template', data);
  return response.data;
};

export const updateDocument = async (id, documentData) => {
  let response;
  if (documentData.file) {
    const form = new FormData();
    if (documentData.title) form.append('title', documentData.title);
    if (documentData.content) form.append('content', documentData.content);
    form.append('file', documentData.file);
    response = await api.put(`/documents/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  } else {
    response = await api.put(`/documents/${id}`, documentData);
  }
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};

export const getAllTemplates = async () => {
  const response = await api.get('/documents/templates');
  return response.data;
};
