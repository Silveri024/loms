import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Check, Lock } from 'lucide-react';
import api from '../api/axios';
import { isAdmin } from '../utils/auth';
import { bubbleSort } from '../utils/sort';
import { binarySearchPrefix } from '../utils/search';

function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);
  const userIsAdmin = isAdmin();
  const [sortOption, setSortOption] = useState({ key: 'title', direction: 'asc' as 'asc' | 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      alert('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({ title: template.title, content: template.content });
    } else {
      setEditingTemplate(null);
      setFormData({ title: '', content: '' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTemplate) {
        const response = await api.put(`/templates/${editingTemplate.id}`, formData);
        setTemplates(templates.map(t => t.id === response.data.id ? response.data : t));
      } else {
        const response = await api.post('/templates', formData);
        setTemplates([response.data, ...templates]);
      }
      setShowModal(false);
      alert(editingTemplate ? 'Template updated' : 'Template created');
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await api.delete(`/templates/${id}`);
      setTemplates(templates.filter(t => t.id !== id));
      alert('Template deleted');
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-dark-600">Loading templates...</div>;
  }

  const sortedTemplates = bubbleSort(
    templates,
    sortOption.key === 'createdAt' ? ['createdAt'] : ['title'],
    sortOption.direction
  );

  const filteredTemplates =
    searchTerm
      ? binarySearchPrefix(sortedTemplates, ['title'], searchTerm)
      : sortedTemplates;

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Document Templates</h2>
            <p className="text-dark-500 mt-1">Create and manage reusable legal document templates</p>
            {!userIsAdmin && <p className="text-xs text-accent-amber mt-2 flex items-center gap-1"><Lock className="w-3 h-3" /> Admin only</p>}
          </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="px-3 py-2 border border-dark-200 rounded-lg text-sm bg-white"
          />
          <select
            value={`${sortOption.key}:${sortOption.direction}`}
            onChange={(e) => {
              const [key, dir] = e.target.value.split(':');
              setSortOption({ key, direction: dir as 'asc' | 'desc' });
            }}
            className="px-3 py-2 border border-dark-200 rounded-lg text-sm bg-white"
          >
            <option value="title:asc">Title (A-Z)</option>
            <option value="title:desc">Title (Z-A)</option>
            <option value="createdAt:desc">Newest</option>
            <option value="createdAt:asc">Oldest</option>
          </select>
          {userIsAdmin && (
            <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold">
              <Plus className="w-5 h-5" />
              New Template
            </button>
          )}
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-dark-100 p-12 text-center">
          <p className="text-dark-500 text-lg">No templates yet. Create your first template to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-xl shadow-md border border-dark-100 hover:shadow-lg transition-all p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-dark-900">{template.title}</h3>
                  <p className="text-dark-600 mt-2 line-clamp-2">{template.content}</p>
                  <p className="text-xs text-dark-400 mt-3">{new Date(template.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  {userIsAdmin && (
                    <>
                      <button onClick={() => handleOpenModal(template)} className="p-3 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(template.id)} className="p-3 text-accent-rose hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && userIsAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-dark-900">{editingTemplate ? 'Edit Template' : 'Create Template'}</h3>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-dark-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" required placeholder="Template name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">Content *</label>
                <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" rows="12" required placeholder="Template content..." />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-dark-200 text-dark-700 rounded-lg hover:bg-dark-50 font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 font-medium flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Templates;
