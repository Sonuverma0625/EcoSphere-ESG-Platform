import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import {
  TrendingUp,
  Leaf,
  ShieldCheck,
  Award,
  Users,
  Target,
  Sparkles,
  ChevronRight,
  Plus
} from 'lucide-react';
import {
  AreaChart,
Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        toast.error('Error fetching dashboard summary');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  // Fallback to empty calculations if not populated yet
  const esgIndex = data?.esgIndex || { score: 0, grade: 'N/A' };
  const environmentalScore = data?.environmentalScore || 0;
  const socialScore = data?.socialScore || 0;
  const governanceScore = data?.governanceScore || 0;
  const carbonMetrics = data?.carbonMetrics || { totalCo2: 0, percentageChange: 0, isReduction: true };
  const employeeParticipation = data?.employeeParticipation || { activeUsersCount: 0, participationRate: 0 };
  const recentActivities = data?.recentActivities || [];

  // Recharts parameters
  const scoreTrendData = data?.scoreHistory?.map(h => ({
    name: h.period,
    Score: h.organizationScore,
    Env: h.environmentalScore,
    Soc: h.socialScore,
    Gov: h.governanceScore
  })) || [];

  const pieData = [
    { name: 'Environmental', value: environmentalScore, color: '#10b981' },
    { name: 'Social', value: socialScore, color: '#3b82f6' },
    { name: 'Governance', value: governanceScore, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="rounded-3xl border border-white/50 bg-gradient-to-r from-emerald-600 to-teal-650 p-6 md:p-8 text-white shadow-xl shadow-emerald-100/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-2xl transform translate-x-12 -translate-y-12"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-2xl font-black md:text-3xl tracking-tight">EcoSphere Dashboard</h1>
            <p className="mt-1.5 text-sm text-emerald-50 font-semibold opacity-90">
              Welcome back, <span>{user?.name}</span>. Check your organization's real-time ESG index metrics.
            </p>
          </div>
          {user?.role === 'Admin' && (
            <Link
              to="/carbon-tracker"
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black text-emerald-700 hover:bg-emerald-50 transition-all shrink-0 shadow-md shadow-emerald-950/10 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Log Emissions
            </Link>
          )}
        </div>
      </div>

      {/* Primary KPI widgets */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* ESG Index Score */}
        <div className="glass rounded-3xl p-6 border border-white/60 bg-white/70 shadow-lg shadow-slate-100/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Weighted ESG Index</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-650">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{esgIndex.score}</span>
            <span className="rounded-md bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-700">Grade {esgIndex.grade}</span>
          </div>
          <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settings Weighting Matrix</p>
        </div>

        {/* Environmental (CO2) */}
        <div className="glass rounded-3xl p-6 border border-white/60 bg-white/70 shadow-lg shadow-slate-100/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Emissions</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
              <Leaf className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-800">
              {carbonMetrics.totalCo2.toLocaleString()} <span className="text-xs font-bold text-slate-400 uppercase">kgCO2e</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${carbonMetrics.isReduction ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
              {carbonMetrics.percentageChange}% {carbonMetrics.isReduction ? 'reduction' : 'increase'}
            </span>
            <span className="text-slate-400 font-semibold">vs last month</span>
          </div>
        </div>

        {/* Social Activity (Participations) */}
        <div className="glass rounded-3xl p-6 border border-white/60 bg-white/70 shadow-lg shadow-slate-100/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">CSR Active Engagement</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{employeeParticipation.activeUsersCount}</span>
            <span className="text-xs font-bold text-slate-400">employees</span>
          </div>
          <p className="mt-2 text-xs font-bold text-emerald-700">{employeeParticipation.participationRate}% participation rate</p>
        </div>

        {/* Governance (Compliance) */}
        <div className="glass rounded-3xl p-6 border border-white/60 bg-white/70 shadow-lg shadow-slate-100/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compliance Status</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">
              {data?.governanceMetrics?.resolvedCount || 0}
              <span className="text-lg font-bold text-slate-400">/{data?.governanceMetrics?.totalCount || 0}</span>
            </span>
            <span className="text-xs font-bold text-slate-400">Issues Resolved</span>
          </div>
          <p className="mt-2 text-xs font-bold text-rose-600">
            {data?.governanceMetrics?.openCount || 0} open issues requiring action
          </p>
        </div>
      </div>

      {/* Main Charts & History section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ESG Index Score History Trend Line */}
        <div className="glass rounded-3xl p-6 border border-white/60 bg-white/70 shadow-lg shadow-slate-100/50 lg:col-span-2">
          <h2 className="text-base font-black text-slate-800 mb-4">ESG History Trend</h2>
          <div className="h-80 w-full">
            {scoreTrendData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-450">No scoring history recorded.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreTrendData} margin={{ left: -10, right: 10 }}>
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" style={{ fontSize: 10, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }} />
                  <Area type="monotone" dataKey="Score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#scoreColor)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ESG Index Weights (Pie Chart) */}
        <div className="glass rounded-3xl p-6 border border-white/60 bg-white/70 shadow-lg shadow-slate-100/50">
          <h2 className="text-base font-black text-slate-800 mb-4">Pillar Distribution</h2>
          <div className="relative h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '16px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Org Index</span>
              <span className="text-2xl font-black text-slate-800">{esgIndex.score}</span>
            </div>
          </div>
          <div className="mt-2 space-y-2.5">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-slate-500 font-semibold">{item.name}</span>
                </div>
                <span className="font-extrabold text-slate-700">{item.value}/100</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recents Logs and Progress Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activities Log */}
        <div className="glass rounded-3xl p-6 border border-white/60 bg-white/70 shadow-lg shadow-slate-100/50">
          <h2 className="text-base font-black text-slate-800 mb-4">Recent Audit & CSR Logs</h2>
          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No activity logs found.</div>
            ) : (
              recentActivities.map((act, idx) => (
                <div key={idx} className="flex items-start justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-xs font-bold text-slate-700">{act.title}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Module: <span className="text-slate-500">{act.module}</span> • {new Date(act.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold border ${
                    act.status === 'Approved' || act.status === 'Resolved' || act.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {act.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Environmental Department Rankings */}
        <div className="glass rounded-3xl p-6 border border-white/60 bg-white/70 shadow-lg shadow-slate-100/50">
          <h2 className="text-base font-black text-slate-800 mb-4">Top Departments ESG Score</h2>
          <div className="space-y-4">
            {data?.departmentScores?.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No department scores computed.</div>
            ) : (
              data?.departmentScores?.map((dept, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-slate-100 pb-3.5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-emerald-600 w-4">#{idx+1}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-700">{dept.department?.name}</p>
                      <p className="text-[10px] font-semibold text-slate-405">Code: {dept.department?.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Visual Progress Bar */}
                    <div className="hidden sm:block w-24 bg-slate-100 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full" style={{ width: `${dept.totalScore}%` }}></div>
                    </div>
                    <span className="text-xs font-extrabold text-slate-750">{dept.totalScore}/100</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

