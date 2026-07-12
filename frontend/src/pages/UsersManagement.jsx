import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Lock,
  Mail,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const UsersManagement = () => {
  // Lists
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Employee',
    department: '',
    status: 'Active'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, deptsRes] = await Promise.all([
        api.get('/users?limit=200'),
        api.get('/departments')
      ]);

      if (usersRes.data.success) setUsers(usersRes.data.data.users);
      if (deptsRes.data.success) setDepartments(deptsRes.data.data.departments || []);
    } catch (error) {
      toast.error('Error fetching users directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Edit User
        const res = await api.put(`/users/${editingId}`, {
          name: formData.name,
          role: formData.role,
          status: formData.status,
          department: formData.department
        });
        if (res.data.success) {
          toast.success('User updated successfully');
          setShowForm(false);
          setEditingId(null);
          fetchData();
        }
      } else {
        // Register User
        const res = await api.post('/auth/register', formData);
        if (res.data.success) {
          toast.success('New user account registered!');
          setShowForm(false);
          fetchData();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleEdit = (u) => {
    setEditingId(u._id);
    setFormData({
      name: u.name,
      email: u.email,
      password: '', // blank on edit
      role: u.role,
      department: u.department?._id || '',
      status: u.status
    });
    setShowForm(true);
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this user account? The employee will lose platform access.')) return;
    try {
      const res = await api.delete(`/users/${id}`);
      if (res.data.success) {
        toast.success('User deactivated');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deactivating user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Users Directory</h1>
          <p className="text-xs font-semibold text-slate-400">Manage corporate staff profiles, assign operational roles, and set departments</p>
        </div>

        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              name: '',
              email: '',
              password: '',
              role: 'Employee',
              department: '',
              status: 'Active'
            });
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 px-4.5 py-3 text-xs font-extrabold text-white hover:opacity-95 shadow-md shadow-emerald-100 transition-all"
        >
          <UserPlus className="h-4 w-4" />
          {showForm ? 'View User Directory' : 'Register User'}
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl shadow-slate-100/50 backdrop-blur-xl">
          <h2 className="text-base font-black text-slate-800 mb-4">
            {editingId ? 'Edit Staff Account' : 'Register New User'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  disabled={!!editingId}
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/80 bg-white/60 py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>

            {!editingId && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-200/80 bg-white/60 py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Security Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              >
                <option value="Employee">Employee</option>
                <option value="ESG Manager">ESG Manager</option>
                <option value="Auditor">Auditor</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Department</label>
              <select
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            {editingId && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            )}

            <div className="sm:col-span-2 md:col-span-3 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-550 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 px-6 py-2.5 text-xs font-extrabold text-white hover:opacity-95 shadow-md shadow-emerald-100 transition-all"
              >
                Save Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Directory Table */}
      {!showForm && (
        <div className="glass overflow-hidden rounded-3xl border border-white/65 bg-white/70 shadow-xl shadow-slate-100/50 backdrop-blur-xl">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-700">Staff Roster</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Security Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4 text-center">XP Level</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-xs font-semibold text-slate-400">Loading directories roster...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-xs font-semibold text-slate-400">No users found.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-black text-slate-800">{u.name}</p>
                          <p className="text-[10px] font-medium text-slate-400">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-600">{u.role}</td>
                      <td className="px-6 py-4 font-medium text-slate-500">{u.department?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-center font-black text-emerald-700">{u.xpLifetime} XP</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          u.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>{u.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(u)}
                            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 transition-all"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          {u.status === 'Active' && (
                            <button
                              onClick={() => handleDeactivate(u._id)}
                              className="p-1.5 rounded-lg bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-500 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
