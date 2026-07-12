import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import {
  TrendingDown,
  Flame,
  Plus,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const CarbonTracker = () => {
  // Lists
  const [transactions, setTransactions] = useState([]);
  const [emissionFactors, setEmissionFactors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    department: '',
    activityType: 'electricity',
    sourceModule: 'Facility',
    activityQuantity: '',
    notes: '',
    transactionDate: new Date().toISOString().split('T')[0]
  });

  // Filter State
  const [filterDept, setFilterDept] = useState('');
  const [filterType, setFilterType] = useState('');

  // Fetch Lists
  const fetchData = async () => {
    setLoading(true);
    try {
      const [txsRes, factorsRes, deptsRes] = await Promise.all([
        api.get(`/carbon-transactions?department=${filterDept}&activityType=${filterType}&limit=100`),
        api.get('/emission-factors?limit=100'),
        api.get('/departments')
      ]);

      if (txsRes.data.success) setTransactions(txsRes.data.data.transactions || []);
      if (factorsRes.data.success) setEmissionFactors(factorsRes.data.data.emissionFactors || []);
      if (deptsRes.data.success) setDepartments(deptsRes.data.data.departments || []);
    } catch (error) {
      toast.error('Error fetching carbon data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterDept, filterType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update
        const res = await api.put(`/carbon-transactions/${editingId}`, formData);
        if (res.data.success) {
          toast.success('Emissions transaction updated');
          setShowForm(false);
          setEditingId(null);
          fetchData();
        }
      } else {
        // Create
        const res = await api.post('/carbon-transactions', formData);
        if (res.data.success) {
          toast.success('Emissions transaction logged');
          setShowForm(false);
          fetchData();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Emissions logging failed');
    }
  };

  const handleEdit = (tx) => {
    setEditingId(tx._id);
    setFormData({
      department: tx.department?._id || '',
      activityType: tx.activityType,
      sourceModule: tx.sourceModule,
      activityQuantity: tx.activityQuantity,
      notes: tx.notes || '',
      transactionDate: new Date(tx.transactionDate).toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this log entry?')) return;
    try {
      const res = await api.delete(`/carbon-transactions/${id}`);
      if (res.data.success) {
        toast.success('Emissions transaction deleted');
        fetchData();
      }
    } catch (error) {
      toast.error('Error deleting transaction');
    }
  };

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      department: '',
      activityType: 'electricity',
      sourceModule: 'Facility',
      activityQuantity: '',
      notes: '',
      transactionDate: new Date().toISOString().split('T')[0]
    });
  };

  // Compute stats
  const totalEmissions = transactions.reduce((sum, tx) => sum + tx.calculatedEmission, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Carbon Footprint Tracker</h1>
          <p className="text-xs font-semibold text-slate-400">Log activity inputs and calculate equivalent greenhouse emissions (CO2e)</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 px-4.5 py-3 text-xs font-extrabold text-white hover:opacity-95 shadow-md shadow-emerald-100 transition-all"
        >
          <Plus className="h-4 w-4" />
          {showForm ? 'View All Logs' : 'Log Activity'}
        </button>
      </div>

      {/* Main Form Overlay / Section */}
      {showForm && (
        <div className="glass rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl shadow-slate-100/50 backdrop-blur-xl">
          <h2 className="text-base font-black text-slate-800 mb-4">
            {editingId ? 'Edit Emissions Transaction' : 'Log Emissions Activity'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
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
                  <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Activity Type</label>
              <select
                required
                value={formData.activityType}
                onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              >
                <option value="electricity">Electricity Grid</option>
                <option value="diesel">Diesel Combustion</option>
                <option value="flight">Business Travel (Flight)</option>
                <option value="natural-gas">Natural Gas Heating</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Source Module</label>
              <select
                value={formData.sourceModule}
                onChange={(e) => setFormData({ ...formData, sourceModule: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              >
                <option value="Facility">Facility Energy</option>
                <option value="Fleet">Transport Fleet</option>
                <option value="Travel">Business Flights</option>
                <option value="Manufacturing">Production Line</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quantity</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 1500"
                value={formData.activityQuantity}
                onChange={(e) => setFormData({ ...formData, activityQuantity: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Log Date</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes & Context</label>
              <textarea
                rows="2"
                placeholder="Details of verification, bill references..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-550 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 px-6 py-2.5 text-xs font-extrabold text-white hover:opacity-95 shadow-md shadow-emerald-100 transition-all"
              >
                {editingId ? 'Save Changes' : 'Log Emissions'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Summary Widget */}
      {!showForm && (
        <div className="glass rounded-3xl border border-white/60 bg-white/70 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-slate-100/50">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Filtered Activity Total</span>
              <p className="text-xl font-black text-slate-800">
                {Math.round(totalEmissions * 100) / 100} <span className="text-xs font-bold text-slate-400">kgCO2e</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter className="h-4.5 w-4.5 text-slate-400" />
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-[11px] text-slate-650 focus:outline-none focus:border-emerald-500 transition-all font-semibold"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-[11px] text-slate-650 focus:outline-none focus:border-emerald-500 transition-all font-semibold"
            >
              <option value="">All Scopes</option>
              <option value="electricity">Electricity</option>
              <option value="diesel">Diesel</option>
              <option value="flight">Flight</option>
              <option value="natural-gas">Natural Gas</option>
            </select>
            <button
              onClick={() => {
                setFilterDept('');
                setFilterType('');
                fetchData();
              }}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Logs Table */}
      {!showForm && (
        <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-lg shadow-slate-100/50 backdrop-blur-md">
          <div className="px-6 py-4 border-b border-slate-100/80 bg-slate-50/20">
            <h2 className="text-sm font-black text-slate-800">Carbon Accounting Ledger</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase bg-slate-50/50">
                  <th className="px-6 py-3">Logged Date</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Activity</th>
                  <th className="px-6 py-3 text-right">Quantity</th>
                  <th className="px-6 py-3 text-right">Calculated CO2e</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400 font-semibold">Loading emissions logs...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400 font-semibold">No logs found matching filters.</td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/30 transition-all">
                      <td className="px-6 py-4 text-slate-450 font-semibold">
                        {new Date(tx.transactionDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 font-black text-slate-800">
                        {tx.department?.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-slate-850 capitalize">{tx.activityType}</span>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tx.sourceModule}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-slate-700">
                        {tx.activityQuantity} <span className="text-[10px] font-bold text-slate-400 uppercase">{tx.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600">
                        {tx.calculatedEmission} kg
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(tx)}
                            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-150 transition-all"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx._id)}
                            className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-650 border border-rose-100 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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

export default CarbonTracker;
