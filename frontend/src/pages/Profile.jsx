import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Shield,
  Briefcase,
  Key,
  BadgeAlert,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // User badges lists
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    setName(user?.name || '');
    const fetchUserBadges = async () => {
      try {
        const res = await api.get(`/badges/user/${user?._id}`);
        if (res.data.success) {
          setBadges(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching user badges', err);
      }
    };
    if (user?._id) fetchUserBadges();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    const data = { name };
    if (password) data.password = password;

    const res = await updateProfile(data);
    setLoading(false);

    if (res.success) {
      toast.success('Profile updated successfully');
      setPassword('');
      confirmPassword('');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">My Profile</h1>
        <p className="text-xs font-semibold text-slate-400">View personal details, achievements, and configure account credentials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card & Badges */}
        <div className="md:col-span-1 space-y-6">
          {/* Main info card */}
          <div className="glass rounded-3xl border border-white/65 bg-white/70 p-6 text-center shadow-lg shadow-slate-100/50 backdrop-blur-xl">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 font-black text-xl text-white shadow-md">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            </div>
            <h2 className="text-base font-black text-slate-800 leading-snug">{user?.name}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user?.email}</p>

            <div className="mt-4 inline-block rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
              Role: {user?.role}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 grid grid-cols-2 gap-2 text-center text-xs text-slate-500">
              <div className="border-r border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">CSR Points</span>
                <span className="text-base font-black text-slate-800">{user?.csrPoints || 0}</span>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">XP Level</span>
                <span className="text-base font-black text-slate-800">{user?.xpLifetime || 0}</span>
              </div>
            </div>
          </div>

          {/* Badges Achievements */}
          <div className="glass rounded-3xl border border-white/65 bg-white/70 p-6 shadow-lg shadow-slate-100/50 backdrop-blur-xl">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-amber-500" />
              Unlocked Badges ({badges.length})
            </h3>
            {badges.length === 0 ? (
              <p className="text-center py-6 text-xs font-semibold text-slate-400">No achievements unlocked yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {badges.map((ub) => (
                  <div key={ub._id} className="text-center group relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 border border-amber-100 mx-auto text-xl mb-1.5 hover:scale-105 transition-all cursor-help shadow-sm">
                      ⭐
                    </div>
                    <p className="text-[9px] font-black text-slate-650 truncate leading-snug">{ub.badge?.name}</p>
                    {/* Tooltip detail description */}
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2.5 text-[10px] text-slate-600 bg-white border border-slate-200 rounded-xl shadow-xl z-10 leading-relaxed font-semibold">
                      {ub.badge?.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Update Form Profile */}
        <div className="md:col-span-2 glass rounded-3xl border border-white/65 bg-white/70 p-6 shadow-lg shadow-slate-100/50 backdrop-blur-xl">
          <h3 className="text-base font-black text-slate-800 mb-6">Account Settings</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200/80 bg-white/60 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address (Read-only)</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-450 focus:outline-none cursor-not-allowed transition-all font-semibold"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Key className="h-4 w-4" />
                Update Password (leave blank to keep current)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200/80 bg-white/60 py-2.5 px-4 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200/80 bg-white/60 py-2.5 px-4 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 hover:opacity-95 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-100 transition-all"
              >
                {loading ? 'Saving Changes...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
