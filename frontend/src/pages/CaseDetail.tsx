import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, MessageSquare, DollarSign, Plus, X, Edit, Trash2, Check, Shield, UserPlus } from 'lucide-react';
import { getCaseById, getCaseAccess, upsertCaseAccess, revokeCaseAccess } from '../api/cases';
import { getDocumentsByCaseId, createDocument, updateDocument, deleteDocument, getAllTemplates, createDocumentFromTemplate } from '../api/documents';
import { getLogsByCaseId, createLog } from '../api/logs';
import { getFeeByCaseId, createOrUpdateFee, addPayment } from '../api/fees';
import { getUserRole } from '../utils/auth';
import { fetchInterns, fetchLawyers } from '../api/users';
import { bubbleSort } from '../utils/sort';

function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [activeTab, setActiveTab] = useState('documents');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [caseFormData, setCaseFormData] = useState({ title: '', status: '', deadline: '', lawyerId: '', lawyerIds: [] as string[], clientIds: [] as string[], opposition: '', oppositionLawyer: '' });
  const [savingCase, setSavingCase] = useState(false);
  const [deletingCase, setDeletingCase] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [docSort, setDocSort] = useState({ key: 'createdAt', direction: 'desc' as 'asc' | 'desc' });
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [docFormData, setDocFormData] = useState({ title: '', content: '', file: null });

  const [logs, setLogs] = useState([]);
  const [logSort, setLogSort] = useState({ key: 'timestamp', direction: 'desc' as 'asc' | 'desc' });
  const [showLogModal, setShowLogModal] = useState(false);
  const [logNote, setLogNote] = useState('');

  const [fee, setFee] = useState(null);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [feeAmount, setFeeAmount] = useState('');
  const [paymentData, setPaymentData] = useState({ amount: '', method: 'bank_transfer' });

  const [accessList, setAccessList] = useState([]);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessForm, setAccessForm] = useState({
    internId: '',
    canViewDocuments: true,
    canUploadDocuments: false,
    canViewLogs: true,
    canAddLogs: false,
    canViewPayments: false
  });
  const [accessSaving, setAccessSaving] = useState(false);
  const [interns, setInterns] = useState([]);
  const [lawyers, setLawyers] = useState([]);

  const role = getUserRole();

  useEffect(() => {
    loadCaseData();
    loadTemplates();
  }, [id]);

  // Build absolute uploads base from Vite env. If VITE_API_URL is like
  // http://localhost:5001/api, strip the trailing /api to get the server origin.
  const UPLOADS_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

  const makeFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    // If it's already absolute, return as-is
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
    // Otherwise prefix with uploads base
    return `${UPLOADS_BASE}${fileUrl}`;
  };

  useEffect(() => {
    if (activeTab === 'documents') {
      loadDocuments();
    } else if (activeTab === 'logs') {
      loadLogs();
    } else if (activeTab === 'fees') {
      loadFee();
    }
  }, [activeTab, id]);

  useEffect(() => {
    if (role !== 'intern') {
      loadAccess();
      loadInterns();
    }
    if (role === 'admin') {
      loadLawyers();
    }
  }, [id, role]);

  const loadCaseData = async () => {
    try {
      const data = await getCaseById(id);
      setCaseData(data);
          setCaseFormData({
            title: data.title,
            status: data.status,
            deadline: data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : '',
            lawyerId: data.lawyer?.id || '',
            lawyerIds: data.caseLawyers?.map((cl) => cl.lawyerId) || (data.lawyerId ? [data.lawyerId] : []),
            clientIds: data.caseClients?.map((cc) => cc.clientId) || (data.clientId ? [data.clientId] : []),
            opposition: data.opposition || '',
            oppositionLawyer: data.oppositionLawyer || ''
          });
    } catch (error) {
      console.error('Failed to load case:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const data = await getDocumentsByCaseId(id);
      const sorted = bubbleSort(
        data,
        docSort.key === 'title' ? ['title'] : ['createdAt'],
        docSort.direction
      );
      setDocuments(sorted);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const data = await getLogsByCaseId(id);
      const sorted = bubbleSort(
        data,
        logSort.key === 'note' ? ['note'] : ['timestamp'],
        logSort.direction
      );
      setLogs(sorted);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const loadFee = async () => {
    try {
      const data = await getFeeByCaseId(id);
      setFee(data);
    } catch (error) {
      console.error('Failed to load fee:', error);
    }
  };

  const handleDeleteCase = async () => {
    if (!window.confirm('Are you sure you want to delete this case?')) return;
    setDeletingCase(true);
    try {
      const api = (await import('../api/axios')).default;
      await api.delete(`/cases/${id}`);
      navigate('/cases');
    } catch (error) {
      console.error('Failed to delete case:', error);
      alert(error.response?.data?.error || 'Failed to delete case');
    } finally {
      setDeletingCase(false);
    }
  };

  const loadAccess = async () => {
    if (role === 'intern') return;
    try {
      const data = await getCaseAccess(id);
      setAccessList(data);
    } catch (error) {
      console.error('Failed to load access list:', error);
    }
  };

  const loadInterns = async () => {
    try {
      const data = await fetchInterns();
      setInterns(data);
    } catch (error) {
      console.error('Failed to load interns:', error);
    }
  };

  const loadLawyers = async () => {
    try {
      const data = await fetchLawyers();
      setLawyers(data);
    } catch (error) {
      console.error('Failed to load lawyers:', error);
    }
  };

  const handleOpenDocModal = (doc = null) => {
    if (doc) {
      setEditingDoc(doc);
      setDocFormData({ title: doc.title, content: doc.content || '', file: null });
    } else {
      setEditingDoc(null);
      setDocFormData({ title: '', content: '', file: null });
    }
    setShowDocModal(true);
  };

  const openAccessModal = (entry = null) => {
    if (entry) {
      setAccessForm({
        internId: entry.internId,
        canViewDocuments: entry.canViewDocuments,
        canUploadDocuments: entry.canUploadDocuments,
        canViewLogs: entry.canViewLogs,
        canAddLogs: entry.canAddLogs,
        canViewPayments: entry.canViewPayments
      });
    } else {
      setAccessForm({
        internId: '',
        canViewDocuments: true,
        canUploadDocuments: false,
        canViewLogs: true,
        canAddLogs: false,
        canViewPayments: false
      });
    }
    setShowAccessModal(true);
  };

  const handleAccessSave = async (e) => {
    e.preventDefault();
    setAccessSaving(true);
    try {
      await upsertCaseAccess(id, { internId: accessForm.internId, permissions: { ...accessForm } });
      setShowAccessModal(false);
      loadAccess();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save access');
    } finally {
      setAccessSaving(false);
    }
  };

  const handleAccessRemove = async (internId) => {
    if (!window.confirm('Revoke access for this intern?')) return;
    try {
      await revokeCaseAccess(id, internId);
      loadAccess();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to revoke access');
    }
  };

  const handleDocSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDoc) {
        await updateDocument(editingDoc.id, docFormData);
      } else {
        await createDocument({ ...docFormData, caseId: id });
      }
      setShowDocModal(false);
      loadDocuments();
    } catch (error) {
      alert('Failed to save document');
    }
  };

  const handleCreateFromTemplate = async (templateId) => {
    try {
      await createDocumentFromTemplate({ caseId: id, templateId });
      loadDocuments();
    } catch (error) {
      alert('Failed to create document from template');
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (window.confirm('Delete this document?')) {
      try {
        await deleteDocument(docId);
        loadDocuments();
      } catch (error) {
        alert('Failed to delete document');
      }
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    try {
      await createLog({ caseId: id, note: logNote });
      setShowLogModal(false);
      setLogNote('');
      loadLogs();
    } catch (error) {
      alert('Failed to add log');
    }
  };

  const handleFeeSubmit = async (e) => {
    e.preventDefault();
    try {
      await createOrUpdateFee({ caseId: id, totalFee: parseFloat(feeAmount) });
      setShowFeeModal(false);
      setFeeAmount('');
      loadFee();
    } catch (error) {
      alert('Failed to save fee');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await addPayment({ caseId: id, ...paymentData, amount: parseFloat(paymentData.amount) });
      setShowPaymentModal(false);
      setPaymentData({ amount: '', method: 'bank_transfer' });
      loadFee();
      loadCaseData();
    } catch (error) {
      alert('Failed to add payment');
    }
  };

  const handleEditCase = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCaseFormData({
      title: caseData.title,
      status: caseData.status,
      deadline: caseData.deadline ? new Date(caseData.deadline).toISOString().split('T')[0] : ''
    });
  };

  const handleSaveCase = async () => {
    setSavingCase(true);
    try {
      const api = (await import('../api/axios')).default;
      const response = await api.put(`/cases/${id}`, {
        title: caseFormData.title,
        status: caseFormData.status,
        deadline: caseFormData.deadline ? new Date(caseFormData.deadline).toISOString() : null,
        lawyerId: role === 'admin' && caseFormData.lawyerId ? caseFormData.lawyerId : undefined,
        lawyerIds: role === 'admin' ? caseFormData.lawyerIds : undefined,
        clientIds: caseFormData.clientIds,
        opposition: caseFormData.opposition,
        oppositionLawyer: caseFormData.oppositionLawyer
      });
      setCaseData(response.data);
      setIsEditing(false);
      alert('Case updated successfully');
    } catch (error) {
      console.error('Failed to update case:', error);
      alert('Failed to update case');
    } finally {
      setSavingCase(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading case...</div>;
  if (!caseData) return <div className="text-center py-8">Case not found</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/cases')} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
        <ArrowLeft className="w-5 h-5" />
        Back to Cases
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-gray-800">{isEditing ? 'Edit Case' : caseData.title}</h2>
          <div className="flex gap-2">
            {!isEditing && (
              <button onClick={handleEditCase} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            {role !== 'intern' && (
              <button onClick={() => openAccessModal()} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <Shield className="w-4 h-4" />
                Manage Interns
              </button>
            )}
            {role !== 'intern' && (
              <button
                onClick={handleDeleteCase}
                className="flex items-center gap-2 px-4 py-2 bg-accent-rose text-white rounded-lg hover:bg-rose-700 disabled:opacity-60"
                disabled={deletingCase}
              >
                <Trash2 className="w-4 h-4" />
                {deletingCase ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <form className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Case Title</label>
              <input type="text" value={caseFormData.title} onChange={(e) => setCaseFormData({...caseFormData, title: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clients</label>
              <select
                multiple
                value={caseFormData.clientIds}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                  setCaseFormData({ ...caseFormData, clientIds: selected });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
              >
                {caseData.caseClients?.map((cc) => cc.client).length === 0 && (
                  <option value={caseData.clientId}>{caseData.client?.name}</option>
                )}
                {caseData.caseClients?.map((cc) => (
                  <option key={cc.clientId} value={cc.clientId}>{cc.client?.name || cc.clientId}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">First selected client is primary.</p>
            </div>
            {role === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Lawyer</label>
                <select
                  multiple
                  value={caseFormData.lawyerIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                    setCaseFormData({ ...caseFormData, lawyerIds: selected, lawyerId: selected[0] || '' });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                >
                  <option value="">Select lawyer</option>
                  {lawyers.map((lawyer) => (
                    <option key={lawyer.id} value={lawyer.id}>{lawyer.username}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">First selected lawyer is primary.</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={caseFormData.status} onChange={(e) => setCaseFormData({...caseFormData, status: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
                <option value="Pending">Pending</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input type="date" value={caseFormData.deadline} onChange={(e) => setCaseFormData({...caseFormData, deadline: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opposition</label>
                <input type="text" value={caseFormData.opposition} onChange={(e) => setCaseFormData({ ...caseFormData, opposition: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Opposing party" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opposition Lawyer</label>
                <input type="text" value={caseFormData.oppositionLawyer} onChange={(e) => setCaseFormData({ ...caseFormData, oppositionLawyer: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Opposing counsel" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={handleSaveCase} disabled={savingCase} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                <Check className="w-4 h-4" />
                {savingCase ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={handleCancelEdit} className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Clients</p>
              <div className="text-gray-800 font-medium space-y-1">
                {caseData.caseClients?.length
                  ? caseData.caseClients.map((cc) => (
                      <div key={cc.clientId}>
                        <Link to={`/clients/${cc.clientId}`} className="text-blue-600 hover:underline">
                          {cc.client?.name || cc.clientId}
                        </Link>
                      </div>
                    ))
                  : caseData.client && (
                      <Link to={`/clients/${caseData.clientId}`} className="text-blue-600 hover:underline">
                        {caseData.client.name}
                      </Link>
                    )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lawyer</p>
              <div className="text-gray-800 font-medium space-y-1">
                {caseData.caseLawyers?.length
                  ? caseData.caseLawyers.map((cl) => <div key={cl.lawyerId}>{cl.lawyer?.username || cl.lawyerId}</div>)
                  : caseData.lawyer?.username}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${caseData.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {caseData.status}
              </span>
            </div>
            {caseData.deadline && (
              <div>
                <p className="text-sm text-gray-500">Deadline</p>
                <p className="text-gray-800 font-medium">{new Date(caseData.deadline).toLocaleDateString('tr-TR')}</p>
                {caseData.daysUntilDeadline !== undefined && (
                  <p className={`text-sm font-medium ${caseData.isOverdue ? 'text-red-600' : caseData.daysUntilDeadline <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
                    {caseData.isOverdue ? 'Overdue!' : `${caseData.daysUntilDeadline} days remaining`}
                  </p>
                )}
              </div>
            )}
            {(caseData.opposition || caseData.oppositionLawyer) && (
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Opposition</p>
                  <p className="text-gray-800 font-medium">{caseData.opposition || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Opposition Lawyer</p>
                  <p className="text-gray-800 font-medium">{caseData.oppositionLawyer || 'N/A'}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex">
            {[
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'logs', label: 'Logs', icon: MessageSquare },
              { id: 'fees', label: 'Fees & Payments', icon: DollarSign },
              ...(role !== 'intern' ? [{ id: 'access', label: 'Intern Access', icon: Shield }] : []),
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Documents</h3>
                <div className="flex gap-2 items-center">
                  <select
                    value={`${docSort.key}:${docSort.direction}`}
                    onChange={(e) => {
                      const [key, dir] = e.target.value.split(':');
                      setDocSort({ key, direction: dir as 'asc' | 'desc' });
                      loadDocuments();
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="createdAt:desc">Newest</option>
                    <option value="createdAt:asc">Oldest</option>
                    <option value="title:asc">Title (A-Z)</option>
                    <option value="title:desc">Title (Z-A)</option>
                  </select>
                  {templates.length > 0 && (
                    <select onChange={(e) => { if (e.target.value) { handleCreateFromTemplate(e.target.value); e.target.value = ''; } }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                      <option value="">Create from template...</option>
                      {templates.map((t) => (<option key={t.id} value={t.id}>{t.title}</option>))}
                    </select>
                  )}
                  <button onClick={() => handleOpenDocModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                    Add Document
                  </button>
                </div>
              </div>

              {documents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No documents yet</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{doc.title}</h4>
                        {doc.fileUrl ? (
                          <p className="text-sm text-gray-600 mt-1">Attached: <a className="text-blue-600 underline" href={makeFileUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer">{doc.fileName || 'Download'}</a></p>
                        ) : (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{doc.content}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">{new Date(doc.createdAt).toLocaleString('tr-TR')}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => handleOpenDocModal(doc)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteDoc(doc.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Interaction Logs</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={`${logSort.key}:${logSort.direction}`}
                    onChange={(e) => {
                      const [key, dir] = e.target.value.split(':');
                      setLogSort({ key, direction: dir as 'asc' | 'desc' });
                      loadLogs();
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="timestamp:desc">Newest</option>
                    <option value="timestamp:asc">Oldest</option>
                    <option value="note:asc">Note (A-Z)</option>
                    <option value="note:desc">Note (Z-A)</option>
                  </select>
                  <button onClick={() => setShowLogModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                    Add Log
                  </button>
                </div>
              </div>

              {logs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No logs yet</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="p-4 border border-gray-200 rounded-lg">
                      <p className="text-gray-800">{log.note}</p>
                      <p className="text-xs text-gray-500 mt-2">{new Date(log.timestamp).toLocaleString('tr-TR')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Fee Information</h3>
                <div className="flex gap-2">
                  {fee && (
                    <button onClick={() => setShowPaymentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      <Plus className="w-4 h-4" />
                      Add Payment
                    </button>
                  )}
                  <button onClick={() => { setFeeAmount(fee?.totalFee?.toString() || ''); setShowFeeModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    {fee ? 'Update Fee' : 'Set Fee'}
                  </button>
                </div>
              </div>

              {fee ? (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-900 font-medium">Total Fee</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">₺{fee.totalFee.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-900 font-medium">Amount Paid</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">₺{fee.amountPaid.toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-900 font-medium">Remaining</p>
                    <p className="text-2xl font-bold text-orange-900 mt-1">₺{(fee.totalFee - fee.amountPaid).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No fee set for this case</p>
              )}

              {caseData.payments && caseData.payments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Payment History</h4>
                  <div className="space-y-2">
                    {caseData.payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">₺{payment.amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">{payment.method.replace('_', ' ')}</p>
                        </div>
                        <p className="text-sm text-gray-500">{new Date(payment.paymentDate).toLocaleDateString('tr-TR')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'access' && role !== 'intern' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Intern Access</h3>
                <button onClick={() => openAccessModal()} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  <UserPlus className="w-4 h-4" />
                  Grant Access
                </button>
              </div>
              {accessList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No interns have access to this case.
                </div>
              ) : (
                <div className="space-y-2">
                  {accessList.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-800">{entry.intern?.username || 'Intern'}</p>
                        <p className="text-xs text-gray-500">ID: {entry.internId}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-1 bg-gray-100 rounded">Docs: {entry.canViewDocuments ? 'View' : 'No view'}{entry.canUploadDocuments ? '/Upload' : ''}</span>
                          <span className="px-2 py-1 bg-gray-100 rounded">Logs: {entry.canViewLogs ? 'View' : 'No view'}{entry.canAddLogs ? '/Add' : ''}</span>
                          <span className="px-2 py-1 bg-gray-100 rounded">Payments: {entry.canViewPayments ? 'View' : 'Hidden'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openAccessModal(entry)} className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1 text-sm font-medium">
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button onClick={() => handleAccessRemove(entry.internId)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded flex items-center gap-1 text-sm font-medium">
                          <Trash2 className="w-4 h-4" />
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Document Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingDoc ? 'Edit Document' : 'Add Document'}</h3>
              <button onClick={() => setShowDocModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleDocSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={docFormData.title} onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea value={docFormData.content} onChange={(e) => setDocFormData({ ...docFormData, content: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows="10" required />
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Upload File (Optional - PDF, DOCX)</label>
                              <input type="file" accept=".pdf,.docx,.doc" onChange={(e) => setDocFormData({ ...docFormData, file: e.target.files?.[0] || null })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                              {docFormData.file && <p className="text-sm text-green-600 mt-2">Selected: {docFormData.file.name}</p>}
                            </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowDocModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{editingDoc ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Interaction Log</h3>
              <button onClick={() => setShowLogModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note *</label>
                <textarea value={logNote} onChange={(e) => setLogNote(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows="5" required placeholder="Describe the interaction, meeting, or update..." />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowLogModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{fee ? 'Update Case Fee' : 'Set Case Fee'}</h3>
              <button onClick={() => setShowFeeModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleFeeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Fee (₺) *</label>
                <input type="number" step="0.01" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required placeholder="50000.00" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowFeeModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{fee ? 'Update' : 'Set Fee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₺) *</label>
                <input type="number" step="0.01" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required placeholder="10000.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select value={paymentData.method} onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="check">Check</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Access Modal */}
      {showAccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Permissions</p>
                <h3 className="text-xl font-bold text-gray-900">{accessForm.internId ? 'Edit Access' : 'Grant Access'}</h3>
              </div>
              <button onClick={() => setShowAccessModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
            </div>
            <form className="space-y-4" onSubmit={handleAccessSave}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intern *</label>
                <select
                  value={accessForm.internId}
                  onChange={(e) => setAccessForm({ ...accessForm, internId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="">Select an intern</option>
                  {interns.map((intern) => (
                    <option key={intern.id} value={intern.id}>{intern.username}</option>
                  ))}
                </select>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={accessForm.canViewDocuments} onChange={(e) => setAccessForm({ ...accessForm, canViewDocuments: e.target.checked })} />
                  Can view documents
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={accessForm.canUploadDocuments} onChange={(e) => setAccessForm({ ...accessForm, canUploadDocuments: e.target.checked })} />
                  Can upload documents
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={accessForm.canViewLogs} onChange={(e) => setAccessForm({ ...accessForm, canViewLogs: e.target.checked })} />
                  Can view logs
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={accessForm.canAddLogs} onChange={(e) => setAccessForm({ ...accessForm, canAddLogs: e.target.checked })} />
                  Can add logs
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={accessForm.canViewPayments} onChange={(e) => setAccessForm({ ...accessForm, canViewPayments: e.target.checked })} />
                  Can view payments
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAccessModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={accessSaving} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400">
                  {accessSaving ? 'Saving...' : 'Save Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default CaseDetail;
