import React, { useEffect, useState } from 'react';
import { Plus, Shield, Trash2, Edit, Lock, UserPlus, KeyRound } from 'lucide-react';
import { fetchUsers, createUser, updateUser, deleteUser, fetchInterns, fetchLawyers } from '../api/users';
import { isAdmin } from '../utils/auth';

// Lets admins manage user accounts and roles.
function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ username: '', role: 'lawyer', password: '' });

  const userIsAdmin = isAdmin();
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (userIsAdmin) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [userIsAdmin]);

  // Loads all users from the server and updates the state.
  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Opens the user modal for creating a new user or editing an existing one.
  const openModal = (user = null) => {
    setError('');
    if (user) {
      setEditingUser(user);
      setFormData({ username: user.username, role: user.role, password: '' });
    } else {
      setEditingUser(null);
      setFormData({ username: '', role: 'lawyer', password: '' });
    }
    setShowModal(true);
  };

  // Opens the password reset modal for the selected user.
  const openResetModal = (user) => {
    setResetUser(user);
    setResetPassword('');
    setError('');
    setShowResetModal(true);
  };

  // Handles saving a new user or updating an existing user's info.
  const handleSave = async (e) => {
    e.preventDefault();
    if (!userIsAdmin) return;
    setSaving(true);
    setError('');

    try {
      if (editingUser) {
        const payload: { username: string; role: string } = {
          username: formData.username,
          role: formData.role
        };
        const updated = await updateUser(editingUser.id, payload);
        setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
      } else {
        const created = await createUser(formData);
        setUsers([created, ...users]);
      }
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save user:', err);
      setError(err.response?.data?.error || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  // Deletes a user, unless it's the currently logged-in user.
  const handleDelete = async (userId) => {
    if (currentUser?.id === userId) {
      alert('You cannot delete the account currently in use.');
      return;
    }
    if (!window.confirm('Delete this user?')) return;
    try {
      await deleteUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  // Resets the password for the selected user.
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetUser || !resetPassword) {
      setError('Password required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateUser(resetUser.id, { username: resetUser.username, role: resetUser.role, password: resetPassword });
      setShowResetModal(false);
      setResetUser(null);
      setResetPassword('');
      loadUsers();
    } catch (err) {
      console.error('Failed to reset password:', err);
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-dark-600">Loading users...</div>;
  }

  if (!userIsAdmin) {
    return (
      <div className="bg-white border border-dark-100 shadow-sm rounded-xl p-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-dark-50 text-dark-400 mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-semibold text-dark-900 mt-2">Admins only</h2>
        <p className="text-dark-500 mt-2">You need admin privileges to manage users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">User Management</h2>
          <p className="text-dark-500 mt-1">Create and manage user accounts with roles</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
        >
          <UserPlus className="w-5 h-5" />
          New User
        </button>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-dark-100 p-12 text-center">
          <p className="text-dark-500 text-lg">No users yet. Create your first account.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-dark-100 overflow-hidden">
          <div className="grid grid-cols-5 gap-3 px-6 py-4 bg-dark-50 text-xs font-semibold text-dark-600 uppercase tracking-wide">
            <div>Username</div>
            <div>Role</div>
            <div>Created</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y divide-dark-100">
            {users.map((u) => (
              <div key={u.id} className="grid grid-cols-5 gap-3 px-6 py-4 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-bold uppercase">
                    {u.username.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-dark-900">{u.username}</p>
                    <p className="text-xs text-dark-500">ID: {u.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-primary-50 text-primary-700' : 'bg-dark-50 text-dark-600'}`}>
                    <Shield className="w-4 h-4" />
                    {u.role}
                  </span>
                </div>
                <div className="text-sm text-dark-600">{new Date(u.createdAt).toLocaleDateString('tr-TR')}</div>
                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => openModal(u)}
                    className="px-3 py-2 text-primary-700 hover:bg-primary-50 rounded-lg flex items-center gap-2 text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => openResetModal(u)}
                    className="px-3 py-2 text-dark-700 hover:bg-dark-50 rounded-lg flex items-center gap-2 text-sm font-medium"
                  >
                    <KeyRound className="w-4 h-4" />
                    Reset Password
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="px-3 py-2 text-accent-rose hover:bg-rose-50 rounded-lg flex items-center gap-2 text-sm font-medium"
                    disabled={currentUser?.id === u.id}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-dark-400 font-semibold">Admin</p>
                <h3 className="text-2xl font-bold text-dark-900">{editingUser ? 'Edit User' : 'Create User'}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            {error && (
              <div className="mb-4 px-4 py-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="lawyer">Lawyer</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">Password *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-dark-200 text-dark-700 rounded-lg hover:bg-dark-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  {saving ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetModal && resetUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-dark-400 font-semibold">Admin</p>
                <h3 className="text-2xl font-bold text-dark-900">Reset Password</h3>
                <p className="text-sm text-dark-500 mt-1">User: {resetUser.username}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
            </div>
            {error && (
              <div className="mb-4 px-4 py-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">New Password *</label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowResetModal(false); setResetUser(null); setResetPassword(''); setError(''); }}
                  className="flex-1 px-4 py-2 border border-dark-200 text-dark-700 rounded-lg hover:bg-dark-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  {saving ? 'Saving...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
