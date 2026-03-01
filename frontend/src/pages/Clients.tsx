import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import Table from '../components/Table';
import ConfirmModal from '../components/ConfirmModal';
import { getAllClients, createClient, updateClient, deleteClient } from '../api/clients';
import { bubbleSort } from '../utils/sort';
import { binarySearchPrefix } from '../utils/search';

// Manages the list of clients, including adding and editing.
function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', idNumber: '' });
  const [error, setError] = useState('');
  const [sortOption, setSortOption] = useState({ key: 'name', direction: 'asc' as 'asc' | 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await getAllClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({ name: client.name, email: client.email, phone: client.phone || '', address: client.address || '', idNumber: client.idNumber || '' });
    } else {
      setEditingClient(null);
      setFormData({ name: '', email: '', phone: '', address: '', idNumber: '' });
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({ name: '', email: '', phone: '', address: '', idNumber: '' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
      } else {
        await createClient(formData);
      }
      handleCloseModal();
      loadClients();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save client');
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
      await deleteClient(deleteId);
      setShowConfirm(false);
      setDeleteId(null);
      loadClients();
    } catch (error) {
      alert('Failed to delete client');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name', render: (row) => <div className="font-medium text-gray-900">{row.name}</div> },
    { header: 'Email', accessor: 'email', render: (row) => <div className="text-gray-600">{row.email}</div> },
    { header: 'Phone', accessor: 'phone', render: (row) => <div className="text-gray-600">{row.phone || 'N/A'}</div> },
    { header: 'ID Number', accessor: 'idNumber', render: (row) => <div className="text-gray-600">{row.idNumber || 'N/A'}</div> },
    { header: 'Cases', accessor: 'cases', render: (row) => <div className="text-gray-600">{row.cases?.length || 0}</div> },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleOpenModal(row); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="text-center py-8">Loading clients...</div>;

  const sortedClients = bubbleSort(
    clients,
    sortOption.key === 'email'
      ? ['email']
      : sortOption.key === 'cases'
      ? ['cases', 'length']
      : ['name'],
    sortOption.direction
  );

  const searchableKey =
    sortOption.key === 'email'
      ? ['email']
      : ['name'];

  const filteredClients =
    searchTerm && typeof searchableKey[0] === 'string'
      ? binarySearchPrefix(sortedClients, searchableKey as any, searchTerm)
      : sortedClients;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Clients</h2>
        <div className="flex items-center gap-3">
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
              const [key, dir] = e.target.value.split(':');
              setSortOption({ key, direction: dir as 'asc' | 'desc' });
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="name:asc">Name (A-Z)</option>
            <option value="name:desc">Name (Z-A)</option>
            <option value="email:asc">Email (A-Z)</option>
            <option value="email:desc">Email (Z-A)</option>
            <option value="cases:desc">Cases (Most)</option>
            <option value="cases:asc">Cases (Least)</option>
          </select>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            Add Client
          </button>
        </div>
      </div>

      <Table columns={columns} data={filteredClients} onRowClick={(row) => navigate(`/clients/${row.id}`)} />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{editingClient ? 'Edit Client' : 'Add Client'}</h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                <input type="text" value={formData.idNumber} onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">{editingClient ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone."
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

export default Clients;
