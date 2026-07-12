import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import {
  FileText,
  Filter,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const Reports = () => {
  const [reportType, setReportType] = useState('environmental'); // environmental, social, governance, esg-summary
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  // Filters state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [departments, setDepartments] = useState([]);

  // Fetch departments for dropdown
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/departments');
        if (res.data.success) setDepartments(res.data.data.departments || []);
      } catch (error) {
        console.error('Error fetching departments', error);
      }
    };
    fetchDepts();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setData(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (filterDept) params.append('department', filterDept);

      const res = await api.get(`/reports/${reportType}?${params.toString()}`);
      if (res.data.success) {
        setData(res.data.data);
        toast.success(`${reportType.toUpperCase()} report generated`);
      }
    } catch (error) {
      toast.error('Error compiling report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [reportType, filterDept]);

  const handleExportCSV = async () => {
    try {
      toast.loading('Preparing CSV export...', { id: 'export-csv' });
      // Map frontend types to backend csv exporter routes
      let backendModule = 'carbon-transactions';
      if (reportType === 'social') backendModule = 'csr-participations';
      if (reportType === 'governance') backendModule = 'compliance-issues';

      const response = await api.post('/reports/export/csv', {
        module: backendModule,
        filters: {
          startDate,
          endDate,
          department: filterDept
        }
      }, { responseType: 'blob' });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss('export-csv');
      toast.success('CSV downloaded successfully');
    } catch (error) {
      toast.dismiss('export-csv');
      toast.error('CSV export failed');
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.loading('Preparing PDF report...', { id: 'export-pdf' });
      let backendModule = 'carbon-transactions';
      if (reportType === 'social') backendModule = 'csr-participations';
      if (reportType === 'governance') backendModule = 'compliance-issues';

      const response = await api.post('/reports/export/pdf', {
        module: backendModule,
        title: `${reportType.toUpperCase()} ESG Summary Report`,
        filters: {
          startDate,
          endDate,
          department: filterDept
        }
      }, { responseType: 'blob' });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss('export-pdf');
      toast.success('PDF document downloaded');
    } catch (error) {
      toast.dismiss('export-pdf');
      toast.error('PDF export failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">ESG Report Generator</h1>
          <p className="text-xs font-semibold text-slate-400">Generate, review, and export formal ESG audit and metrics documents</p>
        </div>

        {data && reportType !== 'esg-summary' && (
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-4.5 py-2.5 text-xs font-black text-slate-650 hover:bg-white hover:border-slate-350 shadow-sm transition-all"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 hover:opacity-95 px-4.5 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-100 transition-all"
            >
              <FileDown className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        )}
      </div>

      {/* Selectors and Filters */}
      <div className="glass rounded-3xl border border-white/65 bg-white/70 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg shadow-slate-100/50 backdrop-blur-xl">
        {/* Module Selector */}
        <div className="flex flex-wrap gap-2">
          {['environmental', 'social', 'governance', 'esg-summary'].map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`rounded-xl border px-4.5 py-2.5 text-xs font-black tracking-wider uppercase transition-all ${
                reportType === type
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'border-slate-200 bg-white/50 text-slate-400 hover:text-slate-700'
              }`}
            >
              {type.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Date Filters (applicable to tabular data) */}
        {reportType !== 'esg-summary' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-450" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white/60 px-3 py-1.5 text-xs text-slate-750 focus:border-emerald-500 focus:outline-none transition-all"
              />
              <span className="text-slate-400 font-bold text-[10px] uppercase">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white/60 px-3 py-1.5 text-xs text-slate-750 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white/60 px-3 py-1.5 text-xs text-slate-750 focus:border-emerald-500 focus:outline-none transition-all"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>

            <button
              onClick={generateReport}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 hover:opacity-95 px-5 py-2 text-xs font-black text-white shadow-sm transition-all"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Render Report Body */}
      {loading ? (
        <div className="py-20 text-center text-xs font-semibold text-slate-400">Compiling dataset metrics...</div>
      ) : !data ? (
        <div className="py-20 text-center text-xs font-semibold text-slate-400">Failed to load report summary.</div>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats Row */}
          {reportType === 'environmental' && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="glass rounded-3xl border border-white/65 bg-white/70 p-6 text-center shadow-lg shadow-slate-100/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Recorded Logs</span>
                <p className="mt-2 text-3xl font-black text-slate-800">{data.summary?.totalTransactions || 0}</p>
              </div>
              <div className="glass rounded-3xl border border-white/65 bg-white/70 p-6 text-center shadow-lg shadow-slate-100/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sum Equivalent CO2e</span>
                <p className="mt-2 text-3xl font-black text-rose-600">{data.summary?.totalEmissions || 0} kg</p>
              </div>
              <div className="glass rounded-3xl border border-white/65 bg-white/70 p-6 text-center shadow-lg shadow-slate-100/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Average Intensity</span>
                <p className="mt-2 text-3xl font-black text-slate-850">
                  {data.summary?.totalTransactions ? Math.round((data.summary?.totalEmissions / data.summary?.totalTransactions) * 100) / 100 : 0} kg
                </p>
              </div>
            </div>
          )}

          {reportType === 'social' && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
              <div className="glass rounded-3xl border border-white/65 bg-white/70 p-6 text-center shadow-lg shadow-slate-100/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Participations</span>
                <p className="mt-2 text-3xl font-black text-slate-800">{data.summary?.totalParticipations || 0}</p>
              </div>
              <div className="glass rounded-3xl border border-white/65 bg-white/70 p-6 text-center shadow-lg shadow-slate-100/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Approved Tasks</span>
                <p className="mt-2 text-3xl font-black text-emerald-700">{data.summary?.approved || 0}</p>
              </div>
              <div className="glass rounded-3xl border border-white/65 bg-white/70 p-6 text-center shadow-lg shadow-slate-100/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pending Review</span>
                <p className="mt-2 text-3xl font-black text-amber-700">{data.summary?.pending || 0}</p>
              </div>
              <div className="glass rounded-3xl border border-white/65 bg-white/70 p-6 text-center shadow-lg shadow-slate-100/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Points Disbursed</span>
                <p className="mt-2 text-3xl font-black text-blue-700">{data.summary?.totalPointsAwarded || 0}</p>
              </div>
            </div>
          )}

          {reportType === 'governance' && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
              <div className="glass rounded-3xl border border-white/65 bg-white/70 p-6 text-center shadow-lg shadow-slate-100/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Compliance Findings</span>
                <p className="mt-2 text-3xl font-black text-slate-800">{data.summary?.totalIssues || 0}</p>
              </div>
              <div className="glass rounded-3xl border border-white/65 bg-white/70 p-6 text-center shadow-lg shadow-slate-100/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Open</span>
                <p className="mt-2 text-3xl font-black text-rose-600">{data.summary?.open || 0}</p>
              </div>
              <div className="glass rounded-3xl border border-white/65 bg-white/70 p-6 text-center shadow-lg shadow-slate-100/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Remediated &amp; Closed</span>
                <p className="mt-2 text-3xl font-black text-emerald-700">{data.summary?.resolved || 0}</p>
              </div>
              <div className="glass rounded-3xl border border-white/65 bg-white/70 p-6 text-center shadow-lg shadow-slate-100/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Required Policy Acks</span>
                <p className="mt-2 text-3xl font-black text-blue-700">{data.summary?.totalAcknowledgements || 0}</p>
              </div>
            </div>
          )}

          {reportType === 'esg-summary' && (
            <div className="space-y-6">
              {/* Pillar Score Display */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="glass rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6 shadow-md">
                  <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Environmental Index</span>
                  <p className="mt-2 text-4xl font-black text-emerald-800">{data.latestScore?.environmentalScore || 0}/100</p>
                  <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight: {data.weights?.environmental}%</p>
                </div>
                <div className="glass rounded-3xl border border-blue-100 bg-blue-50/50 p-6 shadow-md">
                  <span className="text-xs font-black text-blue-600 uppercase tracking-wider">Social Score Pillar</span>
                  <p className="mt-2 text-4xl font-black text-blue-800">{data.latestScore?.socialScore || 0}/100</p>
                  <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight: {data.weights?.social}%</p>
                </div>
                <div className="glass rounded-3xl border border-amber-100 bg-amber-50/50 p-6 shadow-md">
                  <span className="text-xs font-black text-amber-600 uppercase tracking-wider">Governance Index</span>
                  <p className="mt-2 text-4xl font-black text-amber-800">{data.latestScore?.governanceScore || 0}/100</p>
                  <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight: {data.weights?.governance}%</p>
                </div>
              </div>

              {/* Department Rankings Table */}
              <div className="glass overflow-hidden rounded-3xl border border-white/65 bg-white/70 shadow-xl backdrop-blur-md">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">Department ESG Rankings</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                        <th className="px-6 py-3">Rank</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3 text-center">Environmental</th>
                        <th className="px-6 py-3 text-center">Social</th>
                        <th className="px-6 py-3 text-center">Governance</th>
                        <th className="px-6 py-3 text-right">Aggregate Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {data.departmentRankings?.map((dept, idx) => (
                        <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="px-6 py-4 font-black text-emerald-600">#{idx + 1}</td>
                          <td className="px-6 py-4 font-black text-slate-800">{dept.department?.name} ({dept.department?.code})</td>
                          <td className="px-6 py-4 text-center font-semibold text-slate-650">{dept.environmentalScore}/100</td>
                          <td className="px-6 py-4 text-center font-semibold text-slate-650">{dept.socialScore}/100</td>
                          <td className="px-6 py-4 text-center font-semibold text-slate-650">{dept.governanceScore}/100</td>
                          <td className="px-6 py-4 text-right font-black text-emerald-700">{dept.totalScore}/100</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Records Table for E, S, G modules */}
          {reportType !== 'esg-summary' && (
            <div className="glass overflow-hidden rounded-3xl border border-white/65 bg-white/70 shadow-xl backdrop-blur-md">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">Report Records</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    {reportType === 'environmental' && (
                      <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3">Source Module</th>
                        <th className="px-6 py-3 text-right">Raw Qty</th>
                        <th className="px-6 py-3 text-right">Equivalent Emissions</th>
                      </tr>
                    )}
                    {reportType === 'social' && (
                      <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                        <th className="px-6 py-3">Completion Date</th>
                        <th className="px-6 py-3">Employee</th>
                        <th className="px-6 py-3">Activity</th>
                        <th className="px-6 py-3 text-center">Status</th>
                        <th className="px-6 py-3 text-right">Points Earned</th>
                      </tr>
                    )}
                    {reportType === 'governance' && (
                      <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                        <th className="px-6 py-3">Log Date</th>
                        <th className="px-6 py-3">Audit Reference</th>
                        <th className="px-6 py-3">Issue Title</th>
                        <th className="px-6 py-3 text-center">Severity</th>
                        <th className="px-6 py-3 text-right">Status</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {/* Environmental Rows */}
                    {reportType === 'environmental' && data.records?.map((r) => (
                      <tr key={r._id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-400">{new Date(r.transactionDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-black text-slate-800">{r.department?.name}</td>
                        <td className="px-6 py-4 font-medium text-slate-500">{r.sourceModule} ({r.activityType})</td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-650">{r.activityQuantity} {r.unit}</td>
                        <td className="px-6 py-4 text-right font-black text-rose-600">{r.calculatedEmission} kgCO2e</td>
                      </tr>
                    ))}

                    {/* Social Rows */}
                    {reportType === 'social' && data.records?.map((r) => (
                      <tr key={r._id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-400">{new Date(r.completionDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-black text-slate-800">{r.employee?.name}</p>
                            <p className="text-[10px] font-semibold text-slate-400">{r.employee?.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-black text-slate-800">{r.csrActivity?.title}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                            r.approvalStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>{r.approvalStatus}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-emerald-700">+{r.pointsEarned} Points</td>
                      </tr>
                    ))}

                    {/* Governance Rows */}
                    {reportType === 'governance' && data.complianceIssues?.map((r) => (
                      <tr key={r._id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-medium text-slate-500">{r.auditReference ? 'Audit Ref' : 'Ad-hoc Log'}</td>
                        <td className="px-6 py-4 font-black text-slate-800">{r.title}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="rounded-lg bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">{r.severity}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-700">{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
