import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Edit, X, Check } from 'lucide-react';
import { getClientById } from '../api/clients';
import api from '../api/axios';

// Displays detailed information about a single client.
function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClient();
  }, [id]);

  const loadClient = async () => {
    try {
      const data = await getClientById(id);
      setClient(data);
      setFormData(data);
    } catch (error) {
      console.error('Failed to load client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(client);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put(`/clients/${id}`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        idNumber: formData.idNumber
      });
      setClient(response.data);
      setFormData(response.data);
      setIsEditing(false);
      alert('Client updated successfully');
    } catch (error) {
      console.error('Failed to update client:', error);
      alert('Failed to update client');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading client...</div>;
  if (!client) return <div className="text-center py-8">Client not found</div>;

  const associatedCasesMap = new Map();
  (client.cases || []).forEach((c) => associatedCasesMap.set(c.id, c));
  (client.caseClients || []).forEach((cc) => {
    if (cc.case) {
      associatedCasesMap.set(cc.case.id, cc.case);
    }
  });
  const associatedCases = Array.from(associatedCasesMap.values());

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
        <ArrowLeft className="w-5 h-5" />
        Back to Clients
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">{isEditing ? 'Edit Client' : client.name}</h2>
          {!isEditing && (
            <button onClick={handleEdit} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea name="address" value={formData.address || ''} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
              <input type="text" name="idNumber" value={formData.idNumber || ''} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                <Check className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-800">{client.email}</p>
                </div>
              </div>

              {client.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-800">{client.phone}</p>
                  </div>
                </div>
              )}

              {client.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-800">{client.address}</p>
                  </div>
                </div>
              )}

              {client.idNumber && (
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">ID Number</p>
                    <p className="text-gray-800">{client.idNumber}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center bg-blue-50 rounded-lg p-6">
              <div className="text-center">
                <Briefcase className="w-16 h-16 text-blue-600 mx-auto mb-2" />
                <p className="text-4xl font-bold text-blue-900">{client.cases?.length || 0}</p>
                <p className="text-gray-600">Total Cases</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">Cases</h3>
        </div>
        <div className="p-6">
          {!associatedCases || associatedCases.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No cases for this client</p>
          ) : (
            <div className="space-y-3">
              {associatedCases.map((caseItem) => (
                <div key={caseItem.id} onClick={() => navigate(`/cases/${caseItem.id}`)} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <div>
                    <h4 className="font-semibold text-gray-800">{caseItem.title}</h4>
                    <p className="text-sm text-gray-600">Lawyer: {caseItem.lawyer?.username} • Status: {caseItem.status}</p>
                  </div>
                  <div className="text-sm text-gray-500">{new Date(caseItem.createdAt).toLocaleDateString('tr-TR')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientDetail;
