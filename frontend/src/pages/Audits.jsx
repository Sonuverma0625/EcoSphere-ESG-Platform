import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  PlusCircle,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

const Audits = () => {
  const { user } = useAuth();
  const isAuditor = user?.role === 'Admin' || user?.role === 'Auditor' || user?.role === 'ESG Manager';

  // State lists
  const [audits, setAudits] = useState([]);
  const [complianceIssues, setComplianceIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [auditors, setAuditors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab control
  const [activeTab, setActiveTab] = useState('audits'); // audits, compliance

  // Form states
  const [showAuditForm, setShowAuditForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [auditFormData, setAuditFormData] = useState({
    auditTitle: '',
    auditType: 'Environmental',
    department: '',
    assignedAuditor: '',
    startDate: '',
    dueDate: '',
    scope: ''
  });

  const [issueFormData, setIssueFormData] = useState({
    auditReference: '',
    title: '',
    severity: 'Medium',
    description: '',
    department: '',
    owner: '',
    dueDate: ''
  });

  const [staffList, setStaffList] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [auditsRes, issuesRes, deptsRes, auditorsRes, staffRes] = await Promise.all([
        api.get('/audits?limit=100'),
        api.get('/compliance-issues?limit=100'),
        api.get('/departments'),
        api.get('/users/role/auditors'),
        api.get('/users?limit=200') // for issue owner options
      ]);

      if (auditsRes.data.success) setAudits(auditsRes.data.data.audits || []);
      if (issuesRes.data.success) setComplianceIssues(issuesRes.data.data.issues || []);
      if (deptsRes.data.success) setDepartments(deptsRes.data.data.departments || []);
      if (auditorsRes.data.success) setAuditors(auditorsRes.data.data || []);
      if (staffRes.data.success) setStaffList(staffRes.data.data.users || []);
    } catch (error) {
      toast.error('Error fetching audits data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAuditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/audits', auditFormData);
      if (res.data.success) {
        toast.success('Audit scheduled successfully!');
        setShowAuditForm(false);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Scheduling audit failed');
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/compliance-issues', issueFormData);
      if (res.data.success) {
        toast.success('Compliance issue logged and owner notified!');
        setShowIssueForm(false);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Logging issue failed');
    }
  };

  const handleCompleteAudit = async (auditId) => {
    const findings = prompt('Enter final audit findings summary:');
    if (findings === null) return;

    try {
      const res = await api.post(`/audits/${auditId}/findings`, {
        findings,
        status: 'Completed'
      });
      if (res.data.success) {
        toast.success('Audit status updated to Completed!');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Completing audit failed');
    }
  };

  const handleResolveIssue = async (issueId) => {
    const notes = prompt('Provide comments on remediation actions implemented:');
    if (notes === null) return;

    try {
      const res = await api.post(`/compliance-issues/${issueId}/resolve`, { resolutionNotes: notes });
      if (res.data.success) {
        toast.success('Compliance issue status updated to Resolved!');
        fetchData();
      }
    } catch (error) {
      toast.error('Remediation action submission failed');
    }
  };

  const handleVerifyIssue = async (issueId, approval) => {
    const notes = prompt('Enter review notes:');
    if (notes === null) return;

    try {
      const res = approval
        ? await api.post(`/compliance-issues/${issueId}/close`, { reviewNotes: notes })
        : await api.put(`/compliance-issues/${issueId}`, {
            status: 'In Progress',
            resolutionNotes: notes
          });
      if (res.data.success) {
        toast.success(approval ? 'Compliance issue verified and closed!' : 'Issue sent back to owner for refinement');
        fetchData();
      }
    } catch (error) {
      toast.error('Action verification review failed');
    }
  };

  const getAuditStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return <span className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">Completed</span>;
      case 'In Progress':
        return <span className="rounded-lg bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">In Progress</span>;
      default:
        return <span className="rounded-lg bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">Scheduled</span>;
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'Critical':
        return <span className="rounded-lg bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">Critical</span>;
      case 'High':
        return <span className="rounded-lg bg-orange-50 text-orange-700 border border-orange-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">High</span>;
      default:
        return <span className="rounded-lg bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">Medium</span>;
    }
  };

  const getIssueStatusBadge = (status) => {
    switch (status) {
      case 'Closed':
        return <span className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">Closed</span>;
      case 'Resolved':
        return <span className="rounded-lg bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">Pending Review</span>;
      case 'In Progress':
        return <span className="rounded-lg bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">Remediating</span>;
      default:
        return <span className="rounded-lg bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">Open</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Compliance &amp; Audit Manager</h1>
          <p className="text-xs font-semibold text-slate-400">Conduct ESG compliance evaluations, inspect workflows, and remediate structural issues</p>
        </div>

        {isAuditor && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowAuditForm(!showAuditForm);
                setShowIssueForm(false);
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 px-4.5 py-3 text-xs font-extrabold text-white hover:opacity-95 shadow-md shadow-emerald-100 transition-all"
            >
              <Plus className="h-4 w-4" />
              Schedule Audit
            </button>
            <button
              onClick={() => {
                setShowIssueForm(!showIssueForm);
                setShowAuditForm(false);
              }}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-4.5 py-3 text-xs font-extrabold text-slate-600 hover:bg-white hover:border-slate-300 transition-all shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              Log Non-Compliance
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('audits');
            setShowAuditForm(false);
            setShowIssueForm(false);
          }}
          className={`px-6 py-3 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${
            activeTab === 'audits'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Scheduled Audits ({audits.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('compliance');
            setShowAuditForm(false);
            setShowIssueForm(false);
          }}
          className={`px-6 py-3 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${
            activeTab === 'compliance'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Compliance Issues ({complianceIssues.length})
        </button>
      </div>

      {/* Audit Scheduler Form */}
      {showAuditForm && (
        <div className="glass rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl shadow-slate-100/50 backdrop-blur-xl">
          <h2 className="text-base font-black text-slate-800 mb-4">Schedule Audit Inspection</h2>
          <form onSubmit={handleAuditSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Audit Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Q4 Data Security Compliance Audit"
                value={auditFormData.auditTitle}
                onChange={(e) => setAuditFormData({ ...auditFormData, auditTitle: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Audit Type</label>
              <select
                value={auditFormData.auditType}
                onChange={(e) => setAuditFormData({ ...auditFormData, auditType: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              >
                <option value="Environmental">Environmental</option>
                <option value="Social">Social</option>
                <option value="Governance">Governance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Department</label>
              <select
                required
                value={auditFormData.department}
                onChange={(e) => setAuditFormData({ ...auditFormData, department: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assigned Auditor</label>
              <select
                required
                value={auditFormData.assignedAuditor}
                onChange={(e) => setAuditFormData({ ...auditFormData, assignedAuditor: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              >
                <option value="">Select Auditor</option>
                {auditors.map((au) => (
                  <option key={au._id} value={au._id}>{au.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
              <input
                type="date"
                required
                value={auditFormData.startDate}
                onChange={(e) => setAuditFormData({ ...auditFormData, startDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Inspection Due Date</label>
              <input
                type="date"
                required
                value={auditFormData.dueDate}
                onChange={(e) => setAuditFormData({ ...auditFormData, dueDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Scope Details</label>
              <textarea
                rows="3"
                placeholder="Directives, operational scope to inspect..."
                value={auditFormData.scope}
                onChange={(e) => setAuditFormData({ ...auditFormData, scope: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowAuditForm(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-550 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 px-6 py-2.5 text-xs font-extrabold text-white hover:opacity-95 shadow-md shadow-emerald-100 transition-all"
              >
                Schedule Inspection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Log Compliance Issue Form */}
      {showIssueForm && (
        <div className="glass rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl shadow-slate-100/50 backdrop-blur-xl">
          <h2 className="text-base font-black text-slate-800 mb-4">Log Compliance Finding</h2>
          <form onSubmit={handleIssueSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Audit Reference (Optional)</label>
              <select
                value={issueFormData.auditReference}
                onChange={(e) => setIssueFormData({ ...issueFormData, auditReference: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              >
                <option value="">None</option>
                {audits.map((a) => (
                  <option key={a._id} value={a._id}>{a.auditTitle}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Issue Title / Violation Summary</label>
              <input
                type="text"
                required
                placeholder="e.g. Inadequate Safety Clearance Signage"
                value={issueFormData.title}
                onChange={(e) => setIssueFormData({ ...issueFormData, title: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Severity Level</label>
              <select
                value={issueFormData.severity}
                onChange={(e) => setIssueFormData({ ...issueFormData, severity: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              >
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Critical">Critical Breach</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Department</label>
              <select
                required
                value={issueFormData.department}
                onChange={(e) => setIssueFormData({ ...issueFormData, department: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assigned Owner (Remediator)</label>
              <select
                required
                value={issueFormData.owner}
                onChange={(e) => setIssueFormData({ ...issueFormData, owner: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              >
                <option value="">Select Staff Owner</option>
                {staffList.map((st) => (
                  <option key={st._id} value={st._id}>{st.name} ({st.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Remediation Due Date</label>
              <input
                type="date"
                required
                value={issueFormData.dueDate}
                onChange={(e) => setIssueFormData({ ...issueFormData, dueDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Issue Description &amp; Compliance Gap</label>
              <textarea
                rows="3"
                placeholder="Identify root causes and clear remedial actions required..."
                value={issueFormData.description}
                onChange={(e) => setIssueFormData({ ...issueFormData, description: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowIssueForm(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-550 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 px-6 py-2.5 text-xs font-extrabold text-white hover:opacity-95 shadow-md shadow-rose-100 transition-all"
              >
                Log Finding
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lists Displays */}
      {activeTab === 'audits' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {loading ? (
            <div className="col-span-2 text-center py-12 text-xs font-semibold text-slate-400">Loading scheduled inspections...</div>
          ) : audits.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-xs font-semibold text-slate-400">No inspections scheduled.</div>
          ) : (
            audits.map((a) => (
              <div key={a._id} className="glass rounded-3xl border border-white/65 bg-white/70 p-6 flex flex-col justify-between shadow-lg shadow-slate-100/50 backdrop-blur-md">
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
                      <ShieldCheck className="h-5.5 w-5.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{a.auditType}</span>
                        {getAuditStatusBadge(a.status)}
                      </div>
                      <h3 className="mt-1.5 text-sm font-black text-slate-800 leading-snug">{a.auditTitle}</h3>
                      <p className="mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dept: {a.department?.name}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-slate-500 line-clamp-3 leading-relaxed">{a.scope}</p>

                  <div className="mt-5 space-y-2 text-xs text-slate-550 font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span>Auditor: <span className="font-black text-slate-700">{a.assignedAuditor?.name || 'Unassigned'}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Created: {new Date(a.createdAt).toLocaleDateString()}
                  </span>

                  {(user?.role === 'Admin' || user?._id === a.assignedAuditor?._id) && a.status !== 'Completed' && (
                    <button
                      onClick={() => handleCompleteAudit(a._id)}
                      className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 hover:opacity-95 px-4 py-2 text-xs font-black text-white shadow-sm shadow-emerald-100 transition-all"
                    >
                      Complete Assessment
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {loading ? (
            <div className="col-span-2 text-center py-12 text-xs font-semibold text-slate-400">Loading compliance logbook...</div>
          ) : complianceIssues.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-xs font-semibold text-slate-400">No compliance violations logged.</div>
          ) : (
            complianceIssues.map((ci) => {
              const isRemediator = user?._id === ci.owner?._id || user?._id === ci.owner;
              const isCreatorOrAdmin = user?.role === 'Admin' || user?.role === 'Auditor';

              return (
                <div key={ci._id} className="glass rounded-3xl border border-white/65 bg-white/70 p-6 flex flex-col justify-between shadow-lg shadow-slate-100/50 backdrop-blur-md">
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-500 shrink-0">
                        <AlertTriangle className="h-5.5 w-5.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getSeverityBadge(ci.severity)}
                          {getIssueStatusBadge(ci.status)}
                        </div>
                        <h3 className="mt-2 text-sm font-black text-slate-800 leading-snug">{ci.title}</h3>
                        <p className="mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dept: {ci.department?.name}</p>
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-slate-500 line-clamp-3 leading-relaxed">{ci.description}</p>

                    <div className="mt-5 space-y-2 text-xs text-slate-550 font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span>Owner: <span className="font-black text-slate-700">{ci.owner?.name || 'Unassigned'}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>Remediation Target: {new Date(ci.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-4 flex justify-between items-center flex-wrap gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Logged: {new Date(ci.createdAt).toLocaleDateString()}
                    </span>

                    {/* Action flow based on owner vs auditor role verification */}
                    <div className="flex gap-2">
                      {isRemediator && ci.status === 'Open' && (
                        <button
                          onClick={() => handleResolveIssue(ci._id)}
                          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 hover:opacity-95 px-4 py-2 text-xs font-black text-white shadow-sm shadow-emerald-100 transition-all"
                        >
                          Resolve &amp; Submit
                        </button>
                      )}

                      {isCreatorOrAdmin && ci.status === 'Resolved' && (
                        <>
                          <button
                            onClick={() => handleVerifyIssue(ci._id, false)}
                            className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-4 py-2 text-xs font-black text-rose-600 transition-all"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleVerifyIssue(ci._id, true)}
                            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 hover:opacity-95 px-4 py-2 text-xs font-black text-white shadow-sm shadow-emerald-100 transition-all"
                          >
                            Verify &amp; Close
                          </button>
                        </>
                      )}
                    </div>
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

export default Audits;


