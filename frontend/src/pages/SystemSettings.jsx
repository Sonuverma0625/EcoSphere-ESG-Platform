import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import {
  Settings,
  Scale,
  Briefcase,
  Save,
  CheckCircle,
  ToggleLeft,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const SystemSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    orgName: '',
    environmentalWeight: 40,
    socialWeight: 30,
    governanceWeight: 30,
    autoEmissionCalculation: true,
    csrEvidenceRequired: false,
    badgeAutoAward: true,
    inAppNotificationsEnabled: true,
    emailNotificationsEnabled: false
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      if (res.data.success) {
        setFormData(res.data.data);
      }
    } catch (error) {
      toast.error('Error fetching platform settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalWeight = Number(formData.environmentalWeight) + Number(formData.socialWeight) + Number(formData.governanceWeight);
    if (totalWeight !== 100) {
      toast.error(`Pillar weights must sum up to exactly 100%. Current sum: ${totalWeight}%`);
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/settings', formData);
      if (res.data.success) {
        toast.success('System configuration saved successfully!');
        fetchSettings();
      }
    } catch (error) {
      toast.error('Saving configuration failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">System Settings</h1>
        <p className="text-xs font-semibold text-slate-400">Configure ESG organizational weights, gamification rules, and automated emission settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Config */}
        <div className="glass rounded-3xl border border-white/65 bg-white/70 p-6 space-y-4 shadow-lg shadow-slate-100/50 backdrop-blur-xl">
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
            <Briefcase className="h-4.5 w-4.5 text-emerald-600" />
            Organization Identity
          </h2>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Platform / Company Name</label>
            <input
              type="text"
              required
              value={formData.orgName}
              onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
              className="w-full rounded-xl border border-slate-200/80 bg-white/60 py-2.5 px-4 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* ESG Weights Config */}
        <div className="glass rounded-3xl border border-white/65 bg-white/70 p-6 space-y-4 shadow-lg shadow-slate-100/50 backdrop-blur-xl">
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-2">
            <Scale className="h-4.5 w-4.5 text-emerald-600" />
            Index Score Weight Allocations (Must Sum to 100%)
          </h2>
          <p className="text-[10px] font-semibold text-slate-400 mb-4">Weights are used to compute the composite organizational and department ESG Index Grade.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Environmental Weight (%)</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={formData.environmentalWeight}
                onChange={(e) => setFormData({ ...formData, environmentalWeight: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 py-2 px-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Social Weight (%)</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={formData.socialWeight}
                onChange={(e) => setFormData({ ...formData, socialWeight: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 py-2 px-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Governance Weight (%)</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={formData.governanceWeight}
                onChange={(e) => setFormData({ ...formData, governanceWeight: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 py-2 px-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Rules & Automations toggle */}
        <div className="glass rounded-3xl border border-white/65 bg-white/70 p-6 space-y-4 shadow-lg shadow-slate-100/50 backdrop-blur-xl">
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
            <ToggleLeft className="h-4.5 w-4.5 text-emerald-600" />
            Rules &amp; Automations
          </h2>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="flex items-center justify-between py-3.5">
              <div>
                <p className="font-black text-slate-800">Automatic Emission Factor Translation</p>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">Auto calculate carbon emissions equivalents (CO2e) during transaction logs.</p>
              </div>
              <input
                type="checkbox"
                checked={formData.autoEmissionCalculation}
                onChange={(e) => setFormData({ ...formData, autoEmissionCalculation: e.target.checked })}
                className="h-4.5 w-4.5 accent-emerald-600 bg-white rounded border-slate-200"
              />
            </div>

            <div className="flex items-center justify-between py-3.5">
              <div>
                <p className="font-black text-slate-800">Enforce CSR Completion Evidence Uploads</p>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">Force employees to submit files as completion verification proof.</p>
              </div>
              <input
                type="checkbox"
                checked={formData.csrEvidenceRequired}
                onChange={(e) => setFormData({ ...formData, csrEvidenceRequired: e.target.checked })}
                className="h-4.5 w-4.5 accent-emerald-600 bg-white rounded border-slate-200"
              />
            </div>

            <div className="flex items-center justify-between py-3.5">
              <div>
                <p className="font-black text-slate-800">Gamification Auto-Award Achievements</p>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">Award badges immediately when threshold metric objectives are met.</p>
              </div>
              <input
                type="checkbox"
                checked={formData.badgeAutoAward}
                onChange={(e) => setFormData({ ...formData, badgeAutoAward: e.target.checked })}
                className="h-4.5 w-4.5 accent-emerald-600 bg-white rounded border-slate-200"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 px-6 py-2.5 text-xs font-extrabold text-white hover:opacity-95 shadow-md shadow-emerald-100 disabled:opacity-70 transition-all"
          >
            <Save className="h-4.5 w-4.5" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemSettings;
