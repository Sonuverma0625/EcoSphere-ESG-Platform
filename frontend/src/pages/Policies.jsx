import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Plus,
  Calendar,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Users,
  CheckSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

const Policies = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'Admin' || user?.role === 'ESG Manager';

  // Lists
  const [policies, setPolicies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [acknowledgements, setAcknowledgements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    policyCode: '',
    description: '',
    version: '1.0',
    effectiveDate: '',
    reviewDate: '',
    requiredAcknowledgement: true,
    targetDepartments: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [policiesRes, deptsRes, acksRes] = await Promise.all([
        api.get('/policies?limit=100'),
        api.get('/departments'),
        user?.role === 'Employee' ? api.get('/policies/acknowledgements/me') : Promise.resolve({ data: { data: [] } })
      ]);

      if (policiesRes.data.success) setPolicies(policiesRes.data.data.policies);
      if (deptsRes.data.success) setDepartments(deptsRes.data.data.departments || []);
      if (acksRes.data.success) setAcknowledgements(acksRes.data.data);
    } catch (error) {
      toast.error('Error fetching policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/policies', formData);
      if (res.data.success) {
        toast.success('ESG policy published successfully!');
        setShowForm(false);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Publishing policy failed');
    }
  };

  const handleAcknowledge = async (policyId) => {
    try {
      const res = await api.post(`/policies/${policyId}/acknowledge`);
      if (res.data.success) {
        toast.success('Policy acknowledged. Thank you!');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to acknowledge policy');
    }
  };

  const getAcknowledgeStatus = (policyId) => {
    const found = acknowledgements.find(a => a.policy?._id === policyId || a.policy === policyId);
    return found ? 'Acknowledged' : 'Pending';
  };

  const handleDeptSelect = (deptId) => {
    setFormData(prev => {
      const exists = prev.targetDepartments.includes(deptId);
      const updated = exists
        ? prev.targetDepartments.filter(id => id !== deptId)
        : [...prev.targetDepartments, deptId];
      return { ...prev, targetDepartments: updated };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">ESG Policies & Directives</h1>
          <p className="text-xs font-semibold text-slate-400">Review corporate environmental, social, and governance rules and submit compliance acknowledgements</p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 px-4.5 py-3 text-xs font-extrabold text-white hover:opacity-95 shadow-md shadow-emerald-100 transition-all"
          >
            <Plus className="h-4 w-4" />
            {showForm ? 'View Policies' : 'Create Policy'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl shadow-slate-100/50 backdrop-blur-xl">
          <h2 className="text-base font-black text-slate-800 mb-4">Publish ESG Policy Document</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Policy Title / Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Fair Procurement & Anti-Bribery Policy"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Policy Code / Reference</label>
              <input
                type="text"
                required
                placeholder="e.g. ESG-POL-003"
                value={formData.policyCode}
                onChange={(e) => setFormData({ ...formData, policyCode: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Policy Scope & Content Summary</label>
              <textarea
                rows="4"
                required
                placeholder="Write full text or key directives details..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Version</label>
              <input
                type="text"
                required
                placeholder="e.g. 1.0"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Effective Date</label>
              <input
                type="date"
                required
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Review / Expiry Date</label>
              <input
                type="date"
                required
                value={formData.reviewDate}
                onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requiredAcknowledgement"
                checked={formData.requiredAcknowledgement}
                onChange={(e) => setFormData({ ...formData, requiredAcknowledgement: e.target.checked })}
                className="h-4.5 w-4.5 rounded border-slate-200 bg-white accent-emerald-600 focus:outline-none"
              />
              <label htmlFor="requiredAcknowledgement" className="text-xs font-bold text-slate-500">Require Acknowledgement</label>
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Departments (Empty = All Departments)</label>
              <div className="flex flex-wrap gap-2">
                {departments.map((d) => (
                  <button
                    key={d._id}
                    type="button"
                    onClick={() => handleDeptSelect(d._id)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                      formData.targetDepartments.includes(d._id)
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white/60 text-slate-500 hover:border-emerald-300 hover:text-emerald-600'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
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
                Publish Policy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid listing */}
      {!showForm && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {loading ? (
            <div className="col-span-2 py-12 text-center text-xs font-semibold text-slate-400">Loading policy documents...</div>
          ) : policies.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-xs font-semibold text-slate-400">No organizational policies published.</div>
          ) : (
            policies.map((p) => {
              const ackStatus = getAcknowledgeStatus(p._id);

              return (
                <div key={p._id} className="glass rounded-3xl border border-white/65 bg-white/70 p-6 flex flex-col justify-between shadow-lg shadow-slate-100/50 backdrop-blur-md">
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
                        <BookOpen className="h-5.5 w-5.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="inline-block text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">{p.policyCode} · v{p.version}</span>
                        <h3 className="mt-1.5 text-sm font-black text-slate-800 truncate leading-snug">{p.title}</h3>
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-slate-500 line-clamp-4 leading-relaxed">{p.description}</p>

                    <div className="mt-5 space-y-2 text-xs text-slate-550 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>Effective: {new Date(p.effectiveDate).toLocaleDateString()}</span>
                      </div>
                      {p.targetDepartments && p.targetDepartments.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Users className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                          <div className="flex flex-wrap gap-1">
                            {p.targetDepartments.map((d, index) => (
                              <span key={index} className="rounded-lg bg-slate-50 px-2 py-0.5 text-[9px] text-slate-500 font-bold border border-slate-100">
                                {d.name || 'Tgt'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions and Status */}
                  <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Acknowledgement: {p.requiredAcknowledgement ? 'Required' : 'Optional'}
                    </span>

                    {user?.role === 'Employee' && p.requiredAcknowledgement && (
                      <div>
                        {ackStatus === 'Acknowledged' ? (
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100/80 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Acknowledged
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAcknowledge(p._id)}
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 hover:opacity-95 px-4 py-1.5 text-xs font-black text-white shadow-sm shadow-emerald-100 transition-all"
                          >
                            <CheckSquare className="h-4 w-4" />
                            Acknowledge Policy
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Policies;
