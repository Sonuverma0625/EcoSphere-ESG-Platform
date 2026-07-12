const CarbonTransaction = require('../models/CarbonTransaction');
const EmployeeParticipation = require('../models/EmployeeParticipation');
const PolicyAcknowledgement = require('../models/PolicyAcknowledgement');
const ComplianceIssue = require('../models/ComplianceIssue');
const ChallengeParticipation = require('../models/ChallengeParticipation');
const ESGScoreHistory = require('../models/ESGScoreHistory');
const DepartmentScore = require('../models/DepartmentScore');
const Department = require('../models/Department');
const User = require('../models/User');
const { getSettings } = require('../services/settingsService');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

// Helper: Format date for display
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper: Build common filter object from query
const buildFilter = (query) => {
  const filter = {};

  if (query.department) filter.department = query.department;
  if (query.status) filter.status = query.status;
  if (query.employee) filter.employee = query.employee;

  if (query.startDate || query.endDate) {
    const dateField = query.dateField || 'createdAt';
    filter[dateField] = {};
    if (query.startDate) filter[dateField].$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter[dateField].$lte = end;
    }
  }

  return filter;
};

// @desc    Generate Environmental Report data
// @route   GET /api/reports/environmental
// @access  Private (Admin, ESG Manager Only)
const getEnvironmentalReport = async (req, res) => {
  try {
    const filter = buildFilter({ ...req.query, dateField: 'transactionDate' });

    const transactions = await CarbonTransaction.find(filter)
      .populate('department', 'name code')
      .populate('emissionFactor', 'name unit')
      .populate('createdBy', 'name email')
      .sort({ transactionDate: -1 });

    const totalEmissions = transactions.reduce((sum, tx) => sum + tx.calculatedEmission, 0);

    // Aggregation by source
    const bySource = {};
    const byDept = {};
    transactions.forEach(tx => {
      const source = tx.sourceModule || 'Unknown';
      bySource[source] = (bySource[source] || 0) + tx.calculatedEmission;

      const deptName = tx.department ? tx.department.name : 'Unknown';
      byDept[deptName] = (byDept[deptName] || 0) + tx.calculatedEmission;
    });

    return res.status(200).json({
      success: true,
      data: {
        reportTitle: 'Environmental Report',
        generatedAt: new Date(),
        filters: req.query,
        summary: {
          totalTransactions: transactions.length,
          totalEmissions: Math.round(totalEmissions * 100) / 100,
          bySource: Object.entries(bySource).map(([k, v]) => ({ source: k, emissions: Math.round(v * 100) / 100 })),
          byDepartment: Object.entries(byDept).map(([k, v]) => ({ department: k, emissions: Math.round(v * 100) / 100 }))
        },
        records: transactions
      }
    });
  } catch (error) {
    console.error(`[Env Report Error] ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server Error generating environmental report' });
  }
};

// @desc    Generate Social Report data
// @route   GET /api/reports/social
// @access  Private (Admin, ESG Manager Only)
const getSocialReport = async (req, res) => {
  try {
    const filter = buildFilter(req.query);

    const participations = await EmployeeParticipation.find(filter)
      .populate('employee', 'name email department')
      .populate('csrActivity', 'title category pointsAwarded')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    const approved = participations.filter(p => p.approvalStatus === 'Approved');
    const totalPointsAwarded = approved.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        reportTitle: 'Social Report',
        generatedAt: new Date(),
        filters: req.query,
        summary: {
          totalParticipations: participations.length,
          approved: approved.length,
          pending: participations.filter(p => p.approvalStatus === 'Pending').length,
          rejected: participations.filter(p => p.approvalStatus === 'Rejected').length,
          totalPointsAwarded
        },
        records: participations
      }
    });
  } catch (error) {
    console.error(`[Social Report Error] ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server Error generating social report' });
  }
};

// @desc    Generate Governance Report data
// @route   GET /api/reports/governance
// @access  Private (Admin, ESG Manager Only)
const getGovernanceReport = async (req, res) => {
  try {
    const issueFilter = buildFilter({ ...req.query, dateField: 'createdAt' });

    const issues = await ComplianceIssue.find(issueFilter)
      .populate('department', 'name code')
      .populate('owner', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const acknowledgements = await PolicyAcknowledgement.find()
      .populate('policy', 'title policyCode')
      .populate('employee', 'name email department')
      .sort({ acknowledgedAt: -1 });

    const open = issues.filter(i => i.status === 'Open').length;
    const resolved = issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;
    const overdue = issues.filter(i =>
      (i.status === 'Open' || i.status === 'In Progress') && new Date(i.dueDate) < new Date()
    ).length;

    return res.status(200).json({
      success: true,
      data: {
        reportTitle: 'Governance Report',
        generatedAt: new Date(),
        filters: req.query,
        summary: {
          totalIssues: issues.length,
          open,
          resolved,
          overdue,
          totalAcknowledgements: acknowledgements.length
        },
        complianceIssues: issues,
        policyAcknowledgements: acknowledgements
      }
    });
  } catch (error) {
    console.error(`[Governance Report Error] ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server Error generating governance report' });
  }
};

// @desc    ESG Summary Report
// @route   GET /api/reports/esg-summary
// @access  Private (Admin, ESG Manager Only)
const getESGSummaryReport = async (req, res) => {
  try {
    const settings = await getSettings();

    // Latest org score
    const latestScore = await ESGScoreHistory.findOne().sort({ period: -1 });

    // Score trend (last 6 periods)
    const scoreTrend = await ESGScoreHistory.find().sort({ period: 1 }).limit(6);

    // Department rankings
    const latestPeriod = latestScore ? latestScore.period : null;
    const deptScores = latestPeriod
      ? await DepartmentScore.find({ period: latestPeriod })
          .populate('department', 'name code')
          .sort({ totalScore: -1 })
      : [];

    // Key metrics
    const totalActiveEmployees = await User.countDocuments({ role: 'Employee', status: 'Active' });
    const openComplianceIssues = await ComplianceIssue.countDocuments({ status: { $in: ['Open', 'In Progress'] } });

    return res.status(200).json({
      success: true,
      data: {
        reportTitle: 'ESG Summary Report',
        generatedAt: new Date(),
        organizationName: settings.orgName,
        weights: {
          environmental: settings.environmentalWeight,
          social: settings.socialWeight,
          governance: settings.governanceWeight
        },
        latestScore,
        scoreTrend,
        departmentRankings: deptScores,
        keyMetrics: {
          totalActiveEmployees,
          openComplianceIssues
        }
      }
    });
  } catch (error) {
    console.error(`[ESG Summary Report Error] ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server Error generating ESG summary' });
  }
};

// @desc    Custom Report Builder — runs a configurable query
// @route   POST /api/reports/custom
// @access  Private (Admin, ESG Manager Only)
const getCustomReport = async (req, res) => {
  try {
    const { module: reportModule, filters = {}, fields = [] } = req.body;

    let records = [];
    let modelName = '';

    switch (reportModule) {
      case 'carbon-transactions':
        modelName = 'Carbon Transactions';
        const ctFilter = buildFilter({ ...filters, dateField: 'transactionDate' });
        records = await CarbonTransaction.find(ctFilter)
          .populate('department', 'name code')
          .populate('emissionFactor', 'name unit')
          .sort({ transactionDate: -1 })
          .limit(500);
        break;

      case 'csr-participations':
        modelName = 'CSR Participations';
        const csrFilter = buildFilter(filters);
        records = await EmployeeParticipation.find(csrFilter)
          .populate('employee', 'name email')
          .populate('csrActivity', 'title pointsAwarded')
          .sort({ createdAt: -1 })
          .limit(500);
        break;

      case 'compliance-issues':
        modelName = 'Compliance Issues';
        const ciFilter = buildFilter(filters);
        records = await ComplianceIssue.find(ciFilter)
          .populate('department', 'name code')
          .populate('owner', 'name email')
          .sort({ createdAt: -1 })
          .limit(500);
        break;

      case 'challenge-participations':
        modelName = 'Challenge Participations';
        const cpFilter = buildFilter(filters);
        records = await ChallengeParticipation.find(cpFilter)
          .populate('employee', 'name email')
          .populate('challenge', 'title xp difficulty')
          .sort({ createdAt: -1 })
          .limit(500);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report module selected'
        });
    }

    return res.status(200).json({
      success: true,
      data: {
        reportTitle: `Custom Report: ${modelName}`,
        generatedAt: new Date(),
        filters,
        totalRecords: records.length,
        records
      }
    });
  } catch (error) {
    console.error(`[Custom Report Error] ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server Error generating custom report' });
  }
};

// @desc    Export any report as CSV
// @route   POST /api/reports/export/csv
// @access  Private (Admin, ESG Manager Only)
const exportCSV = async (req, res) => {
  try {
    const { module: reportModule, filters = {}, fields = [] } = req.body;

    let records = [];
    let filename = 'report';
    let csvFields = fields;

    switch (reportModule) {
      case 'carbon-transactions':
        filename = 'carbon_transactions';
        const ctFilter = buildFilter({ ...filters, dateField: 'transactionDate' });
        const txs = await CarbonTransaction.find(ctFilter)
          .populate('department', 'name code')
          .lean();
        records = txs.map(tx => ({
          Date: formatDate(tx.transactionDate),
          Department: tx.department ? tx.department.name : 'N/A',
          ActivityType: tx.activityType,
          SourceModule: tx.sourceModule,
          Quantity: tx.activityQuantity,
          Unit: tx.unit,
          'Emissions (kgCO2e)': tx.calculatedEmission,
          Manual: tx.isManual ? 'Yes' : 'No'
        }));
        break;

      case 'csr-participations':
        filename = 'csr_participations';
        const csrFilter = buildFilter(filters);
        const parts = await EmployeeParticipation.find(csrFilter)
          .populate('employee', 'name email')
          .populate('csrActivity', 'title pointsAwarded')
          .lean();
        records = parts.map(p => ({
          Employee: p.employee ? p.employee.name : 'N/A',
          Email: p.employee ? p.employee.email : 'N/A',
          Activity: p.csrActivity ? p.csrActivity.title : 'N/A',
          Status: p.approvalStatus,
          'Points Earned': p.pointsEarned,
          'Completion Date': formatDate(p.completionDate)
        }));
        break;

      case 'compliance-issues':
        filename = 'compliance_issues';
        const ciFilter = buildFilter(filters);
        const issues = await ComplianceIssue.find(ciFilter)
          .populate('department', 'name code')
          .populate('owner', 'name email')
          .lean();
        records = issues.map(i => ({
          Title: i.title,
          Severity: i.severity,
          Department: i.department ? i.department.name : 'N/A',
          Owner: i.owner ? i.owner.name : 'N/A',
          Status: i.status,
          'Due Date': formatDate(i.dueDate),
          'Resolved At': formatDate(i.resolvedAt),
          'Overdue': (i.status === 'Open' || i.status === 'In Progress') && new Date(i.dueDate) < new Date() ? 'Yes' : 'No'
        }));
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid module for CSV export' });
    }

    if (records.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No data found matching the selected filters'
      });
    }

    const parser = new Parser({ fields: csvFields.length > 0 ? csvFields : Object.keys(records[0]) });
    const csv = parser.parse(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}_${Date.now()}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error(`[CSV Export Error] ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server Error generating CSV export' });
  }
};

// @desc    Export any report as PDF
// @route   POST /api/reports/export/pdf
// @access  Private (Admin, ESG Manager Only)
const exportPDF = async (req, res) => {
  try {
    const { module: reportModule, filters = {}, title = 'EcoSphere ESG Report' } = req.body;

    let records = [];
    let columns = [];

    switch (reportModule) {
      case 'carbon-transactions':
        const ctFilter = buildFilter({ ...filters, dateField: 'transactionDate' });
        const txs = await CarbonTransaction.find(ctFilter)
          .populate('department', 'name code')
          .lean();
        columns = ['Date', 'Department', 'Activity Type', 'Module', 'Emissions'];
        records = txs.map(tx => [
          formatDate(tx.transactionDate),
          tx.department ? tx.department.name : 'N/A',
          tx.activityType,
          tx.sourceModule,
          `${tx.calculatedEmission} kgCO2e`
        ]);
        break;

      case 'compliance-issues':
        const ciFilter = buildFilter(filters);
        const issues = await ComplianceIssue.find(ciFilter)
          .populate('department', 'name code')
          .populate('owner', 'name email')
          .lean();
        columns = ['Title', 'Severity', 'Department', 'Owner', 'Status', 'Due Date'];
        records = issues.map(i => [
          i.title,
          i.severity,
          i.department ? i.department.name : 'N/A',
          i.owner ? i.owner.name : 'N/A',
          i.status,
          formatDate(i.dueDate)
        ]);
        break;

      case 'csr-participations':
        const csrFilter = buildFilter(filters);
        const parts = await EmployeeParticipation.find(csrFilter)
          .populate('employee', 'name email')
          .populate('csrActivity', 'title pointsAwarded')
          .lean();
        columns = ['Employee', 'Activity', 'Status', 'Points Earned', 'Completion Date'];
        records = parts.map(p => [
          p.employee ? p.employee.name : 'N/A',
          p.csrActivity ? p.csrActivity.title : 'N/A',
          p.approvalStatus,
          p.pointsEarned,
          formatDate(p.completionDate)
        ]);
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid module for PDF export' });
    }

    // Build PDF
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report_${Date.now()}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).fillColor('#059669').text('EcoSphere ESG Management Platform', { align: 'center' });
    doc.fontSize(14).fillColor('#111827').text(title, { align: 'center' });
    doc.fontSize(10).fillColor('#6b7280').text(`Generated: ${formatDate(new Date())}`, { align: 'center' });

    // Filters summary
    if (Object.keys(filters).length > 0) {
      doc.moveDown().fontSize(10).fillColor('#111827').text('Applied Filters:', { underline: true });
      Object.entries(filters).forEach(([k, v]) => {
        doc.text(`  ${k}: ${v}`);
      });
    }

    doc.moveDown();

    if (records.length === 0) {
      doc.fontSize(12).fillColor('#6b7280').text('No records found matching the selected filters.', { align: 'center' });
    } else {
      // Column headers
      doc.fontSize(9).fillColor('#059669');
      const colWidth = (doc.page.width - 80) / columns.length;
      let xPos = 40;
      const startY = doc.y;
      columns.forEach(col => {
        doc.text(col, xPos, startY, { width: colWidth, ellipsis: true });
        xPos += colWidth;
      });

      doc.moveDown(0.3);
      doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#e5e7eb');
      doc.moveDown(0.3);

      // Data rows
      doc.fontSize(8).fillColor('#374151');
      records.slice(0, 100).forEach(row => {
        if (doc.y > doc.page.height - 60) {
          doc.addPage();
        }
        const rowY = doc.y;
        xPos = 40;
        row.forEach(cell => {
          doc.text(String(cell || ''), xPos, rowY, { width: colWidth, ellipsis: true });
          xPos += colWidth;
        });
        doc.moveDown(0.5);
      });

      if (records.length > 100) {
        doc.moveDown().fontSize(9).fillColor('#6b7280')
          .text(`Showing 100 of ${records.length} records. Export CSV for full data.`);
      }
    }

    doc.end();
  } catch (error) {
    console.error(`[PDF Export Error] ${error.message}`);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Server Error generating PDF export' });
    }
  }
};

module.exports = {
  getEnvironmentalReport,
  getSocialReport,
  getGovernanceReport,
  getESGSummaryReport,
  getCustomReport,
  exportCSV,
  exportPDF
};
