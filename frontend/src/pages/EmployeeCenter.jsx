import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  Sparkles,
  ShoppingBag,
  Flame,
  CheckCircle,
  Clock,
  HeartHandshake,
  CheckSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeCenter = () => {
  const { user, setUser } = useAuth();

  // State
  const [challenges, setChallenges] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active view tab: challenges, rewards
  const [activeTab, setActiveTab] = useState('challenges');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [challengesRes, partRes, rewardsRes, redemptionsRes] = await Promise.all([
        api.get('/challenges?limit=100'),
        api.get('/challenges/participations/me'),
        api.get('/rewards?limit=100'),
        api.get('/rewards/redemptions/all') // returns user specific redemptions
      ]);

      if (challengesRes.data.success) setChallenges(challengesRes.data.data.challenges);
      if (partRes.data.success) setParticipations(partRes.data.data);
      if (rewardsRes.data.success) setRewards(rewardsRes.data.data.rewards);
      if (redemptionsRes.data.success) {
        setRedemptions(redemptionsRes.data.data.redemptions || []);
      }
    } catch (error) {
      toast.error('Error fetching gamification hub data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleJoinChallenge = async (challengeId) => {
    try {
      const res = await api.post(`/challenges/${challengeId}/join`);
      if (res.data.success) {
        toast.success('Joined challenge! Start tracking your task progress.');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Joining challenge failed');
    }
  };

  const handleUpdateProgress = async (participationId) => {
    const progress = prompt('Enter your current progress percentage (0 - 100):');
    if (progress === null) return;

    const num = Number(progress);
    if (isNaN(num) || num < 0 || num > 100) {
      toast.error('Please enter a valid percentage between 0 and 100');
      return;
    }

    try {
      const res = await api.put(`/challenges/participations/${participationId}/progress`, {
        progress: num
      });
      if (res.data.success) {
        toast.success('Challenge progress updated!');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Updating progress failed');
    }
  };

  const handleRedeemReward = async (rewardId) => {
    if (!window.confirm('Redeem your CSR points for this reward?')) return;
    try {
      const res = await api.post(`/rewards/${rewardId}/redeem`);
      if (res.data.success) {
        toast.success('Reward redeemed successfully! Please wait for delivery info.');
        // Update user state points
        const meRes = await api.get('/auth/me');
        if (meRes.data.success) {
          setUser(meRes.data.data);
        }
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Redemption failed');
    }
  };

  const getChallengeParticipation = (challengeId) => {
    return participations.find(p => p.challenge?._id === challengeId || p.challenge === challengeId);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">Completed &amp; Verified</span>;
      case 'Pending':
        return <span className="rounded-lg bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">Awaiting Verification</span>;
      default:
        return <span className="rounded-lg bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">In Progress</span>;
    }
  };

  const getRedemptionBadge = (status) => {
    switch (status) {
      case 'Fulfilled':
        return <span className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">Fulfilled</span>;
      case 'Rejected':
        return <span className="rounded-lg bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">Rejected</span>;
      default:
        return <span className="rounded-lg bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">Pending Approval</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* User Points Card */}
      <div className="glass rounded-3xl border border-white/60 bg-gradient-to-r from-emerald-50/50 via-white/70 to-teal-50/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-slate-100/50 backdrop-blur-xl">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Gamified Employee Center</h1>
          <p className="mt-1 text-xs font-semibold text-slate-400">Complete eco-challenges, participate in CSR campaigns, and redeem points for sustainable gifts.</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-6 py-3 text-center shrink-0 flex-1 sm:flex-initial">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">CSR Points Balance</span>
            <p className="text-2xl font-black text-emerald-800">{user?.csrPoints || 0} pts</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-6 py-3 text-center shrink-0 flex-1 sm:flex-initial">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Lifetime XP level</span>
            <p className="text-2xl font-black text-blue-800">{user?.xpLifetime || 0} XP</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`px-6 py-3 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${
            activeTab === 'challenges'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Eco-Challenges ({challenges.filter(c => c.status === 'Active').length})
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-6 py-3 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${
            activeTab === 'rewards'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Rewards Catalog ({rewards.length})
        </button>
      </div>

      {/* Content area */}
      {activeTab === 'challenges' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {loading ? (
            <div className="col-span-2 text-center py-12 text-xs font-semibold text-slate-400">Loading challenges...</div>
          ) : challenges.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-xs font-semibold text-slate-400">No active eco-challenges available.</div>
          ) : (
            challenges
              .filter(c => c.status === 'Active')
              .map((c) => {
                const part = getChallengeParticipation(c._id);
                const progressVal = part ? part.progress : 0;
                const isDeadlinePassed = new Date(c.deadline) < new Date();

                return (
                  <div key={c._id} className="glass rounded-3xl border border-white/65 bg-white/70 p-6 flex flex-col justify-between shadow-lg shadow-slate-100/50 backdrop-blur-md">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
                          <Flame className="h-5.5 w-5.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                              +{c.xp} XP
                            </span>
                            <span className="text-[10px] font-black text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                              Diff: {c.difficulty}
                            </span>
                            {part && getStatusBadge(part.approvalStatus)}
                          </div>
                          <h3 className="mt-2 text-sm font-black text-slate-800 leading-snug truncate">{c.title}</h3>
                        </div>
                      </div>

                      <p className="mt-4 text-xs text-slate-500 leading-relaxed line-clamp-3 font-medium">{c.description}</p>

                      {/* Progress Bar (Visible if participating) */}
                      {part && (
                        <div className="mt-5 space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                            <span>Challenge Task Progress</span>
                            <span className="text-emerald-600 font-black">{progressVal}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full" style={{ width: `${progressVal}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Deadline: {new Date(c.deadline).toLocaleDateString()}
                      </span>

                      {!isDeadlinePassed && (
                        <div>
                          {!part ? (
                            <button
                              onClick={() => handleJoinChallenge(c._id)}
                              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 hover:opacity-95 px-4 py-2 text-xs font-black text-white shadow-sm shadow-emerald-100 transition-all"
                            >
                              Join Challenge
                            </button>
                          ) : (
                            part.approvalStatus === 'In Progress' && (
                              <button
                                onClick={() => handleUpdateProgress(part._id)}
                                className="rounded-xl border border-emerald-200 hover:bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-600 transition-all"
                              >
                                Update Progress
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Rewards Grid catalog */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {loading ? (
              <div className="col-span-3 text-center py-12 text-xs font-semibold text-slate-400">Loading catalog...</div>
            ) : rewards.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-xs font-semibold text-slate-400">No rewards defined in the catalog.</div>
            ) : (
              rewards.map((r) => {
                const canAfford = (user?.csrPoints || 0) >= r.pointsRequired;
                const hasStock = r.availableStock > 0;

                return (
                  <div key={r._id} className="glass rounded-3xl border border-white/65 bg-white/70 p-6 flex flex-col justify-between shadow-lg shadow-slate-100/50 backdrop-blur-md">
                    <div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 mb-4">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-black text-slate-800 leading-snug">{r.name}</h3>
                      <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed line-clamp-3">{r.description}</p>
                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Stock: {r.availableStock} remaining</span>
                        <span className="text-sm font-black text-emerald-700">{r.pointsRequired} Points</span>
                      </div>
                      <button
                        onClick={() => handleRedeemReward(r._id)}
                        disabled={!canAfford || !hasStock}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 hover:opacity-95 disabled:bg-slate-100 disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed py-2.5 text-xs font-black text-white shadow-sm transition-all"
                      >
                        {!hasStock ? 'Out of Stock' : !canAfford ? 'Need More Points' : 'Redeem Reward'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Redemption History list */}
          {redemptions.length > 0 && (
            <div className="glass rounded-3xl border border-white/65 bg-white/70 p-6 shadow-lg shadow-slate-100/50 backdrop-blur-xl">
              <h2 className="text-sm font-black text-slate-800 mb-4">Redemption History</h2>
              <div className="space-y-3">
                {redemptions.map((red) => (
                  <div key={red._id} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-xs font-black text-slate-800">{red.reward?.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">Ordered: {new Date(red.redeemedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-slate-500">-{red.pointsRedeemed} Points</span>
                      {getRedemptionBadge(red.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeCenter;

