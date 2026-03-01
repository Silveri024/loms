import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Edit, Trash2, X, CheckSquare, Square } from 'lucide-react';
import Table from '../components/Table';
import ConfirmModal from '../components/ConfirmModal';
import { getAllCases, createCase, updateCase, deleteCase } from '../api/cases';
import { getAllClients } from '../api/clients';
import { fetchLawyers } from '../api/users';
import { getUserRole } from '../utils/auth';
import { bubbleSort } from '../utils/sort';
import { binarySearchPrefix } from '../utils/search';

type CaseClient = {
  clientId: string;
  client?: { id: string; name: string };
};

type CaseLawyer = {
  lawyerId: string;
  lawyer?: { id: string; username: string };
};

type CaseType = {
  id: string;
  title: string;
  client?: { id: string; name: string };
  caseClients?: CaseClient[];
  lawyer?: { id: string; username: string };
  caseLawyers?: CaseLawyer[];
  status: string;
  deadline?: string;
  daysUntilDeadline?: number;
  isOverdue?: boolean;
  [key: string]: any;
};

// Shows a list of all cases and lets users view, add, or edit them.
function Cases() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cases, setCases] = useState<CaseType[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [formData, setFormData] = useState({ title: '', clientIds: [] as string[], status: 'open', deadline: '', lawyerIds: [] as string[], lawyerId: '' });
  const [error, setError] = useState('');
  const [lawyers, setLawyers] = useState([]);
  const [sortOption, setSortOption] = useState({ key: 'title', direction: 'asc' as 'asc' | 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const role = getUserRole();
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    loadData();
    // Check if navigated with filter state
    if (location.state?.filter) {
      setStatusFilter(location.state.filter);
    }
  }, [location]);

  const loadData = async () => {
    try {
      const [casesData, clientsData] = await Promise.all([getAllCases(), getAllClients()]);
      setCases(casesData);
      setClients(clientsData);
      if (role === 'admin') {
        const lawyerUsers = await fetchLawyers();
        setLawyers(lawyerUsers);
      } else if (currentUser) {
        setLawyers([{ id: currentUser.id, username: currentUser.username }]);
        setFormData((prev) => ({ ...prev, lawyerId: currentUser.id }));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (caseItem = null) => {
    if (caseItem) {
      setEditingCase(caseItem);
      setFormData({
        title: caseItem.title,
        clientIds: caseItem.caseClients?.map((cc) => cc.clientId) || (caseItem.clientId ? [caseItem.clientId] : []),
        status: caseItem.status,
        deadline: caseItem.deadline ? new Date(caseItem.deadline).toISOString().split('T')[0] : '',
        lawyerId: caseItem.lawyer?.id || '',
        lawyerIds: caseItem.caseLawyers?.map((cl) => cl.lawyerId) || (caseItem.lawyerId ? [caseItem.lawyerId] : [])
      });
    } else {
      setEditingCase(null);
      setFormData({ title: '', clientIds: [], status: 'open', deadline: '', lawyerId: currentUser?.id || '', lawyerIds: [] });
    }
      setError('');
      setShowModal(true);
  };

  const updateClientSelection = (clientId: string, makePrimary = false) => {
    let updated = [...formData.clientIds];
    const exists = updated.includes(clientId);
    if (exists && makePrimary) {
      updated = [clientId, ...updated.filter((id) => id !== clientId)];
    } else if (exists) {
      updated = updated.filter((id) => id !== clientId);
    } else {
      updated = makePrimary ? [clientId, ...updated] : [...updated, clientId];
    }
    setFormData({ ...formData, clientIds: updated });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCase(null);
    setFormData({ title: '', clientIds: [], status: 'open', deadline: '', lawyerId: '', lawyerIds: [] });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.title || formData.clientIds.length === 0) {
      setError('Title and at least one client required');
      return;
    }
    try {
      const payload = { ...formData, clientId: formData.clientIds[0] };
      if (role !== 'admin') {
        delete payload.lawyerId;
        delete payload.lawyerIds;
      }
      if (editingCase) {
        await updateCase(editingCase.id, payload);
      } else {
        await createCase(payload);
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save case');
    }
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteCase(deleteId);
      setShowConfirm(false);
      setDeleteId(null);
      loadData();
    } catch (error) {
      alert('Failed to delete case');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { header: 'Title', accessor: 'title', render: (row) => <div className="font-medium text-gray-900">{row.title}</div> },
    { header: 'Client', accessor: 'client', render: (row) => <div className="text-gray-600">{row.caseClients?.length ? row.caseClients.map((cc) => cc.client?.name).join(', ') : row.client?.name}</div> },
    { header: 'Lawyer', accessor: 'lawyer', render: (row) => <div className="text-gray-600">{row.caseLawyers?.length ? row.caseLawyers.map((cl) => cl.lawyer?.username).join(', ') : row.lawyer?.username}</div> },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${row.status === 'open' ? 'bg-green-100 text-green-800' : row.status === 'closed' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Deadline',
      accessor: 'deadline',
      render: (row) => {
        if (!row.deadline) return <span className="text-gray-400">No deadline</span>;
        return (
          <div>
            <div className="text-gray-600">{new Date(row.deadline).toLocaleDateString('tr-TR')}</div>
            {row.daysUntilDeadline !== undefined && (
              <div className={`text-xs font-medium ${row.isOverdue ? 'text-red-600' : row.daysUntilDeadline <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
                {row.isOverdue ? 'Overdue' : `${row.daysUntilDeadline} days left`}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleOpenModal(row); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="text-center py-8">Loading cases...</div>;

  const sortedCases = bubbleSort(
    cases,
    sortOption.key === 'client'
      ? ['client', 'name']
      : sortOption.key === 'lawyer'
      ? ['lawyer', 'username']
      : sortOption.key === 'deadline'
      ? ['deadline']
      : ['title'],
    sortOption.direction
  );

  const filteredCases = sortedCases.filter((c: CaseType) => {
    // Apply status filter
    if (statusFilter !== 'all' && c.status !== statusFilter) {
      return false;
    }
    
    // Apply search filter
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const inTitle = c.title?.toLowerCase().includes(q);
    const inClient = c.client?.name?.toLowerCase().includes(q);
    const inClients = c.caseClients?.some((cc) => cc.client?.name?.toLowerCase().includes(q));
    const inLawyer = c.lawyer?.username?.toLowerCase().includes(q);
    return inTitle || inClient || inClients || inLawyer;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Cases</h2>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <select
            value={`${sortOption.key}:${sortOption.direction}`}
            onChange={(e) => {
              const [key, direction] = e.target.value.split(':');
              setSortOption({ key, direction: direction as 'asc' | 'desc' });
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="title:asc">Title (A-Z)</option>
            <option value="title:desc">Title (Z-A)</option>
            <option value="deadline:asc">Deadline (Earliest)</option>
            <option value="deadline:desc">Deadline (Latest)</option>
            <option value="client:asc">Client (A-Z)</option>
            <option value="client:desc">Client (Z-A)</option>
            <option value="lawyer:asc">Lawyer (A-Z)</option>
            <option value="lawyer:desc">Lawyer (Z-A)</option>
          </select>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            Add Case
          </button>
        </div>
      </div>

      <Table columns={columns} data={filteredCases} onRowClick={(row) => navigate(`/cases/${row.id}`)} />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{editingCase ? 'Edit Case' : 'Add Case'}</h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clients *</label>
                <div className="border border-gray-300 rounded-lg p-3 space-y-2 max-h-48 overflow-auto">
                  {clients.map((client) => {
                    const selected = formData.clientIds.includes(client.id);
                    return (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => updateClientSelection(client.id)}
                        onDoubleClick={() => updateClientSelection(client.id, true)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${selected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                      >
                        <span className="flex items-center gap-2">
                          {selected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                          <span className="text-sm text-gray-800">{client.name}</span>
                        </span>
                        {selected && (
                          <span className="text-xs text-blue-600 font-semibold">
                            {formData.clientIds.indexOf(client.id) === 0 ? 'Primary' : 'Selected'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {clients.length === 0 && <p className="text-sm text-gray-500">No clients available.</p>}
                </div>
                <p className="text-xs text-gray-500 mt-1">Click to select, double-click to set as primary.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Lawyers *</label>
                  <select
                    multiple
                    value={formData.lawyerIds}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map((o: HTMLOptionElement) => o.value);
                      setFormData({ ...formData, lawyerIds: selected });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                    required
                  >
                    {lawyers.map((lawyer) => (
                      <option key={lawyer.id} value={lawyer.id}>{lawyer.username}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">First selected lawyer is primary.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">{editingCase ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Case"
        message="Are you sure you want to delete this case? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
}

export default Cases;
