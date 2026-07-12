import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import {
  Award,
  TrendingUp,
  MapPin,
  Trophy,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filterDept, setFilterDept] = useState('');
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leaderRes, deptsRes] = await Promise.all([
        api.get(`/leaderboard?department=${filterDept}&limit=50`),
        api.get('/departments')
      ]);

      if (leaderRes.data.success) {
        setLeaderboard(leaderRes.data.data.leaderboard);
        setCurrentUserRank(leaderRes.data.data.currentUserRank);
      }
      if (deptsRes.data.success) {
        setDepartments(deptsRes.data.data.departments || []);
      }
    } catch (error) {
      toast.error('Error compiling leaderboard stand');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterDept]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">EcoSphere Leaderboard</h1>
          <p className="text-xs font-semibold text-slate-400">See where you stand in sustainable XP and CSR contribution index rankings</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Filter</span>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="rounded-xl border border-slate-200/80 bg-white/70 px-3.5 py-2 text-xs text-slate-700 font-semibold focus:border-emerald-500 focus:outline-none shadow-sm transition-all"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Standings Table container */}
      <div className="glass overflow-hidden rounded-3xl border border-white/65 bg-white/70 shadow-xl shadow-slate-100/50 backdrop-blur-xl">
        <div className="px-6 py-4 border-b border-slate-100 bg-white/30 flex justify-between items-center">
          <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">Top Contributors</h2>
          {currentUserRank && (
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">Your Rank: #{currentUserRank}</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4 text-center">CSR Activities</th>
                <th className="px-6 py-4 text-center">Badges</th>
                <th className="px-6 py-4 text-right">Lifetime XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-xs font-semibold text-slate-400">Loading standings dataset...</td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-xs font-semibold text-slate-400">No records found.</td>
                </tr>
              ) : (
                leaderboard.map((item) => (
                  <tr
                    key={item.user._id}
                    className={`hover:bg-emerald-50/30 transition-colors ${
                      item.isCurrentUser ? 'bg-emerald-50/50 border-l-2 border-l-emerald-500' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-black text-slate-700">
                      {item.rank === 1 ? (
                        <Trophy className="h-5 w-5 text-amber-500 inline mr-1" />
                      ) : item.rank === 2 ? (
                        <Trophy className="h-5 w-5 text-slate-400 inline mr-1" />
                      ) : item.rank === 3 ? (
                        <Trophy className="h-5 w-5 text-orange-500 inline mr-1" />
                      ) : null}
                      #{item.rank}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className={`font-black ${item.isCurrentUser ? 'text-emerald-700' : 'text-slate-800'}`}>{item.user.name}</p>
                        <p className="text-[10px] font-medium text-slate-400">{item.user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{item.user.department?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-center font-black text-slate-700">{item.completedChallenges}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg">
                        <Award className="h-3.5 w-3.5" />
                        {item.badgeCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-emerald-700">
                      {item.xpLifetime} XP
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
