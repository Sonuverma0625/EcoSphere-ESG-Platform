import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Plus,
  Target,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const SustainabilityGoals = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'Admin' || user?.role === 'ESG Manager';

  // Lists
  const [goals, setGoals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    metric: '',
    baselineValue: '',
    targetValue: '',
    currentValue: '',
    startDate: '',
    endDate: '',
    status: 'Not Started'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [goalsRes, deptsRes] = await Promise.all([
        api.get('/environmental-goals?limit=100'),
        api.get('/departments')
      ]);

      if (goalsRes.data.success) setGoals(goalsRes.data.data.goals);
      if (deptsRes.data.success) setDepartments(deptsRes.data.data.departments || []);
    } catch (error) {
      toast.error('Error loading sustainability goals');
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
        const res = await api.put(`/environmental-goals/${editingId}`, formData);
        if (res.data.success) {
          toast.success('Sustainability goal updated');
          setShowForm(false);
          setEditingId(null);
          fetchData();
        }
      } else {
        const res = await api.post('/environmental-goals', formData);
        if (res.data.success) {
          toast.success('Sustainability goal created');
          setShowForm(false);
          fetchData();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save sustainability goal');
    }
  };

  const handleEdit = (goal) => {
    setEditingId(goal._id);
    setFormData({
      title: goal.title,
      department: goal.department?._id || '',
      metric: goal.metric,
      baselineValue: goal.baselineValue,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      startDate: new Date(goal.startDate).toISOString().split('T')[0],
      endDate: new Date(goal.endDate).toISOString().split('T')[0],
      status: goal.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sustainability goal permanently?')) return;
    try {
      const res = await api.delete(`/environmental-goals/${id}`);
      if (res.data.success) {
        toast.success('Goal deleted');
        fetchData();
      }
    } catch (error) {
      toast.error('Error deleting goal');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return <span className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 text-[10px] font-bold">Completed</span>;
      case 'At Risk':
        return <span className="rounded-lg bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-0.5 text-[10px] font-bold">At Risk</span>;
      case 'In Progress':
        return <span className="rounded-lg bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 text-[10px] font-bold">In Progress</span>;
      default:
        return <span className="rounded-lg bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold">Not Started</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Sustainability Goals</h1>
          <p className="text-xs font-semibold text-slate-400">Track key organizational sustainability goals and carbon reduction plans</p>
        </div>
        {isManager && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                title: '',
                department: '',
                metric: '',
                baselineValue: '',
                targetValue: '',
                currentValue: '',
                startDate: '',
                endDate: '',
                status: 'Not Started'
              });
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 px-4.5 py-3 text-xs font-extrabold text-white hover:opacity-95 shadow-md shadow-emerald-100 transition-all"
          >
            <Plus className="h-4 w-4" />
            {showForm ? 'View Goals Dashboard' : 'Define Goal'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl shadow-slate-100/50 backdrop-blur-xl">
          <h2 className="text-base font-black text-slate-800 mb-4">
            {editingId ? 'Edit Sustainability Goal' : 'Define New Sustainability Goal'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Goal Title / Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Reduce corporate office energy consumption by 25%"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Responsible Department</label>
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

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Metric & Unit</label>
              <input
                type="text"
                required
                placeholder="e.g. kWh consumed, kgCO2e"
                value={formData.metric}
                onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Baseline Value</label>
              <input
                type="number"
                required
                placeholder="Baseline (original) value"
                value={formData.baselineValue}
                onChange={(e) => setFormData({ ...formData, baselineValue: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Value</label>
              <input
                type="number"
                required
                placeholder="Target objective value"
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current Value</label>
              <input
                type="number"
                required
                placeholder="Latest current status"
                value={formData.currentValue}
                onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Completion Date</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Execution Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="At Risk">At Risk</option>
              </select>
            </div>

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
                Save Goal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals grid display */}
      {!showForm && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {loading ? (
            <div className="col-span-2 py-12 text-center text-xs font-semibold text-slate-400">Loading sustainability goals...</div>
          ) : goals.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-xs font-semibold text-slate-400">No goals currently defined.</div>
          ) : (
            goals.map((goal) => (
              <div key={goal._id} className="glass rounded-3xl border border-white/65 bg-white/70 p-6 flex flex-col justify-between shadow-lg shadow-slate-100/50 backdrop-blur-md">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
                      <Target className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{goal.department?.name}</span>
                        {getStatusBadge(goal.status)}
                      </div>
                      <h3 className="mt-1.5 text-sm font-black text-slate-800 leading-relaxed">{goal.title}</h3>
                    </div>
                  </div>

                  {/* Details stats */}
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center rounded-2xl bg-slate-50/50 border border-slate-100 p-3.5 shadow-sm shadow-slate-100/10">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Baseline</p>
                      <p className="mt-0.5 text-xs font-extrabold text-slate-650">{goal.baselineValue}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Target</p>
                      <p className="mt-0.5 text-xs font-black text-emerald-600">{goal.targetValue}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Current</p>
                      <p className="mt-0.5 text-xs font-black text-slate-850">{goal.currentValue}</p>
                    </div>
                  </div>

                  {/* Progress Slider */}
                  <div className="mt-5 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span>Objective Metric: {goal.metric}</span>
                      <span className="text-emerald-600 font-extrabold">{goal.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          goal.status === 'At Risk' ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, goal.progressPercentage))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>TARGET: {new Date(goal.endDate).toLocaleDateString()}</span>
                  </div>

                  {isManager && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-emerald-700 transition-all"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(goal._id)}
                        className="flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:text-rose-700 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SustainabilityGoals;
