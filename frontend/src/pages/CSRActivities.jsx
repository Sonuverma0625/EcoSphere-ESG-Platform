import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  Plus,
  MapPin,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  ThumbsUp,
  AlertCircle,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

const CSRActivities = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'Admin' || user?.role === 'ESG Manager';

  // State
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    maxParticipants: '',
    pointsAwarded: '',
    evidenceRequired: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [actRes, catRes, partRes] = await Promise.all([
        api.get('/csr-activities?limit=100'),
        api.get('/categories?type=CSR Activity'),
        user?.role === 'Employee' ? api.get(`/csr-activities/participations/me`) : Promise.resolve({ data: { data: [] } })
      ]);

      if (actRes.data.success) setActivities(actRes.data.data.activities);
      if (catRes.data.success) setCategories(catRes.data.data.categories);
      if (partRes.data.success) setParticipations(partRes.data.data);
    } catch (error) {
      toast.error('Error fetching CSR hub data');
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
      const res = await api.post('/csr-activities', formData);
      if (res.data.success) {
        toast.success('CSR activity published');
        setShowForm(false);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Publish activity failed');
    }
  };

  const handleRegister = async (activityId) => {
    try {
      const res = await api.post(`/csr-activities/${activityId}/register`);
      if (res.data.success) {
        toast.success('Registered successfully! Complete the activity to earn points.');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleComplete = async (activityId) => {
    const notes = prompt('Enter a brief summary / evidence of your participation:');
    if (notes === null) return; // cancelled

    try {
      const res = await api.post(`/csr-activities/${activityId}/complete`, {
        evidenceNotes: notes
      });
      if (res.data.success) {
        toast.success('Activity completion request submitted for manager review!');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    }
  };

  // Helper checking if employee is participating
  const getParticipationStatus = (activityId) => {
    const found = participations.find(p => p.csrActivity?._id === activityId || p.csrActivity === activityId);
    if (!found) return null;
    return found.approvalStatus; // Pending, Approved, Rejected
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">CSR Volunteer Activities</h1>
          <p className="text-xs font-semibold text-slate-400">Join company-sponsored social responsibility activities and earn rewards</p>
        </div>
        {isManager && (
          <button
            onClick={() => {
              setFormData({
                title: '',
                category: '',
                description: '',
                location: '',
                startDate: '',
                endDate: '',
                maxParticipants: '',
                pointsAwarded: '',
                evidenceRequired: true
              });
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 px-4.5 py-3 text-xs font-extrabold text-white hover:opacity-95 shadow-md shadow-emerald-100 transition-all"
          >
            <Plus className="h-4 w-4" />
            {showForm ? 'View Activities' : 'Publish CSR Activity'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl shadow-slate-100/50 backdrop-blur-xl">
          <h2 className="text-base font-black text-slate-800 mb-4">Publish CSR Activity</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Activity Title</label>
              <input
                type="text"
                required
                placeholder="e.g. City Beach Cleanup Campaign"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
              <textarea
                rows="3"
                required
                placeholder="Detailed information and schedule..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Location / Venue</label>
              <input
                type="text"
                required
                placeholder="e.g. Marina Beach, St. Peter Square"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Max Participant Slots</label>
              <input
                type="number"
                required
                placeholder="e.g. 50"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">CSR Points Value</label>
              <input
                type="number"
                required
                placeholder="e.g. 100"
                value={formData.pointsAwarded}
                onChange={(e) => setFormData({ ...formData, pointsAwarded: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="evidenceRequired"
                checked={formData.evidenceRequired}
                onChange={(e) => setFormData({ ...formData, evidenceRequired: e.target.checked })}
                className="h-4.5 w-4.5 rounded border-slate-200 bg-white accent-emerald-600 focus:outline-none"
              />
              <label htmlFor="evidenceRequired" className="text-xs font-bold text-slate-500">Require File Evidence</label>
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
                Publish Activity
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid listing */}
      {!showForm && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {loading ? (
            <div className="col-span-2 py-12 text-center text-xs font-semibold text-slate-400">Loading activities...</div>
          ) : activities.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-xs font-semibold text-slate-400">No CSR activities available.</div>
          ) : (
            activities.map((act) => {
              const partStatus = getParticipationStatus(act._id);
              const isExpired = new Date(act.endDate) < new Date();

              return (
                <div key={act._id} className="glass rounded-3xl border border-white/65 bg-white/70 p-6 flex flex-col justify-between shadow-lg shadow-slate-100/50 backdrop-blur-md">
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
                        <Award className="h-5.5 w-5.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="inline-block text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100/80 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                          +{act.pointsAwarded} CSR Points
                        </span>
                        <h3 className="mt-2 text-sm font-black text-slate-800 truncate leading-snug">{act.title}</h3>
                        <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category: {act.category?.name}</p>
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-slate-500 line-clamp-3 leading-relaxed">{act.description}</p>

                    <div className="mt-5 space-y-2 text-xs text-slate-550 font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>{act.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>{new Date(act.startDate).toLocaleDateString()} - {new Date(act.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>
                          {act.registeredEmployeesCount || 0} / {act.maxParticipants} slots reserved
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Action Panel */}
                  <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {isExpired ? 'Activity Ended' : 'Open for registration'}
                    </span>

                    {user?.role === 'Employee' && (
                      <div className="flex gap-2">
                        {partStatus === null && !isExpired && (
                          <button
                            onClick={() => handleRegister(act._id)}
                            disabled={act.registeredEmployeesCount >= act.maxParticipants}
                            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 px-4.5 py-2 text-xs font-black text-white hover:opacity-95 shadow-md shadow-emerald-100 disabled:opacity-50 transition-all"
                          >
                            Register
                          </button>
                        )}
                        {partStatus === 'Registered' && !isExpired && (
                          <button
                            onClick={() => handleComplete(act._id)}
                            className="flex items-center gap-1.5 rounded-xl border border-emerald-500 bg-white px-4 py-2 text-xs font-black text-emerald-600 hover:bg-emerald-50/50 shadow-sm shadow-emerald-50 transition-all"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Submit Completion
                          </button>
                        )}
                        {partStatus === 'Pending' && (
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100/80 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            <Clock className="h-3.5 w-3.5 animate-pulse" />
                            Under Review
                          </span>
                        )}
                        {partStatus === 'Approved' && (
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100/80 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            <ThumbsUp className="h-3.5 w-3.5" />
                            Points Awarded
                          </span>
                        )}
                        {partStatus === 'Rejected' && (
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Rejected
                          </span>
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

export default CSRActivities;
