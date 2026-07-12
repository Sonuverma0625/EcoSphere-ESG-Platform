require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('../models/User');
const Department = require('../models/Department');
const Category = require('../models/Category');
const EmissionFactor = require('../models/EmissionFactor');
const CarbonTransaction = require('../models/CarbonTransaction');
const EnvironmentalGoal = require('../models/EnvironmentalGoal');
const CSRActivity = require('../models/CSRActivity');
const EmployeeParticipation = require('../models/EmployeeParticipation');
const ESGPolicy = require('../models/ESGPolicy');
const PolicyAcknowledgement = require('../models/PolicyAcknowledgement');
const Audit = require('../models/Audit');
const ComplianceIssue = require('../models/ComplianceIssue');
const Challenge = require('../models/Challenge');
const ChallengeParticipation = require('../models/ChallengeParticipation');
const Badge = require('../models/Badge');
const Reward = require('../models/Reward');
const XPTransaction = require('../models/XPTransaction');
const ESGScoreHistory = require('../models/ESGScoreHistory');
const DepartmentScore = require('../models/DepartmentScore');
const Notification = require('../models/Notification');
const OrganizationSettings = require('../models/OrganizationSettings');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecosphere';
  await mongoose.connect(uri);
  console.log(`MongoDB Connected: ${mongoose.connection.host}`);
};

const clearDatabase = async () => {
  const collections = Object.keys(mongoose.connection.collections);
  for (const name of collections) {
    await mongoose.connection.collections[name].deleteMany({});
  }
  console.log('All collections cleared.');
};

const seed = async () => {
  await connectDB();
  await clearDatabase();

  // ─── Organization Settings ───────────────────────────────────────────────
  await OrganizationSettings.create({
    orgName: 'EcoSphere ESG Platform',
    environmentalWeight: 40,
    socialWeight: 30,
    governanceWeight: 30,
    autoEmissionCalculation: true,
    csrEvidenceRequired: false, // disabled for demo so approvals work without uploads
    badgeAutoAward: true,
    inAppNotificationsEnabled: true,
    emailNotificationsEnabled: false
  });
  console.log('Organization settings seeded.');

  // ─── Departments ─────────────────────────────────────────────────────────
  const [hrDept, opsDept, techDept, procureDept] = await Department.insertMany([
    { name: 'Human Resources', code: 'HR', employeeCount: 0, status: 'Active' },
    { name: 'Operations', code: 'OPS', employeeCount: 0, status: 'Active' },
    { name: 'Technology', code: 'TECH', employeeCount: 0, status: 'Active' },
    { name: 'Procurement', code: 'PROC', employeeCount: 0, status: 'Active' }
  ]);
  console.log('Departments seeded.');

  // ─── Users ───────────────────────────────────────────────────────────────
  const hashedAdmin = await bcrypt.hash('Admin@123', 10);
  const hashedManager = await bcrypt.hash('Manager@123', 10);
  const hashedEmployee = await bcrypt.hash('Employee@123', 10);
  const hashedAuditor = await bcrypt.hash('Auditor@123', 10);

  const [adminUser, managerUser, employeeUser, auditorUser] = await User.insertMany([
    {
      name: 'Admin User',
      email: 'admin@ecosphere.com',
      password: hashedAdmin,
      role: 'Admin',
      department: opsDept._id,
      status: 'Active',
      xpCurrent: 0,
      xpLifetime: 0
    },
    {
      name: 'ESG Manager',
      email: 'manager@ecosphere.com',
      password: hashedManager,
      role: 'ESG Manager',
      department: hrDept._id,
      status: 'Active',
      xpCurrent: 0,
      xpLifetime: 0
    },
    {
      name: 'Jane Employee',
      email: 'employee@ecosphere.com',
      password: hashedEmployee,
      role: 'Employee',
      department: techDept._id,
      status: 'Active',
      xpCurrent: 150,
      xpLifetime: 250,
      csrPoints: 100,
      challengeXp: 150
    },
    {
      name: 'Audit Reviewer',
      email: 'auditor@ecosphere.com',
      password: hashedAuditor,
      role: 'Auditor',
      department: opsDept._id,
      status: 'Active',
      xpCurrent: 0,
      xpLifetime: 0
    }
  ]);

  // Update department head and employee counts
  await Department.findByIdAndUpdate(hrDept._id, { head: managerUser._id, employeeCount: 1 });
  await Department.findByIdAndUpdate(techDept._id, { employeeCount: 1 });
  await Department.findByIdAndUpdate(opsDept._id, { head: adminUser._id, employeeCount: 2 });
  console.log('Users seeded.');

  // ─── Categories ──────────────────────────────────────────────────────────
  const [envCat, wellnessCat, trainingCat, complianceCat, communityCat, challengeCat] = await Category.insertMany([
    { name: 'Environmental Cleanup', type: 'CSR Activity', status: 'Active' },
    { name: 'Wellness & Health', type: 'CSR Activity', status: 'Active' },
    { name: 'Community Support', type: 'CSR Activity', status: 'Active' },
    { name: 'Data Protection', type: 'Compliance', status: 'Active' },
    { name: 'Safety & Compliance', type: 'Compliance', status: 'Active' },
    { name: 'Green Skills', type: 'Challenge', status: 'Active' }
  ]);
  console.log('Categories seeded.');

  // ─── Emission Factors ────────────────────────────────────────────────────
  const [electricityFactor, dieselFactor, flightFactor, naturalGasFactor] = await EmissionFactor.insertMany([
    {
      name: 'Electricity (Grid Average)',
      activityType: 'electricity',
      unit: 'kWh',
      factorValue: 0.233,
      co2EquivalentUnit: 'kgCO2e',
      source: 'IEA 2023',
      effectiveDate: new Date('2023-01-01'),
      status: 'Active'
    },
    {
      name: 'Diesel Combustion',
      activityType: 'diesel',
      unit: 'litre',
      factorValue: 2.68,
      co2EquivalentUnit: 'kgCO2e',
      source: 'DEFRA 2023',
      effectiveDate: new Date('2023-01-01'),
      status: 'Active'
    },
    {
      name: 'Short-haul Flight',
      activityType: 'flight',
      unit: 'km',
      factorValue: 0.158,
      co2EquivalentUnit: 'kgCO2e',
      source: 'ICAO 2023',
      effectiveDate: new Date('2023-01-01'),
      status: 'Active'
    },
    {
      name: 'Natural Gas Combustion',
      activityType: 'natural-gas',
      unit: 'cubic metre',
      factorValue: 2.02,
      co2EquivalentUnit: 'kgCO2e',
      source: 'DEFRA 2023',
      effectiveDate: new Date('2023-01-01'),
      status: 'Active'
    }
  ]);
  console.log('Emission factors seeded.');

  // ─── Carbon Transactions ─────────────────────────────────────────────────
  const transactions = [];
  const months = [1, 2, 3, 4, 5, 6];
  for (const month of months) {
    transactions.push({
      department: techDept._id,
      activityType: 'electricity',
      sourceModule: 'Manufacturing',
      activityQuantity: 5000 - month * 100,
      unit: 'kWh',
      emissionFactor: electricityFactor._id,
      calculatedEmission: (5000 - month * 100) * 0.233,
      transactionDate: new Date(`2025-0${month}-15`),
      notes: `Monthly electricity consumption - Tech Department`,
      createdBy: adminUser._id,
      isManual: false
    });
    transactions.push({
      department: opsDept._id,
      activityType: 'diesel',
      sourceModule: 'Fleet',
      activityQuantity: 200,
      unit: 'litre',
      emissionFactor: dieselFactor._id,
      calculatedEmission: 200 * 2.68,
      transactionDate: new Date(`2025-0${month}-20`),
      notes: 'Fleet vehicle diesel consumption',
      createdBy: managerUser._id,
      isManual: false
    });
  }
  await CarbonTransaction.insertMany(transactions);
  console.log('Carbon transactions seeded.');

  // ─── Environmental Goals ─────────────────────────────────────────────────
  await EnvironmentalGoal.insertMany([
    {
      title: 'Reduce Electricity Consumption by 20%',
      department: techDept._id,
      metric: 'kWh Monthly Consumption',
      baselineValue: 5000,
      targetValue: 4000,
      currentValue: 4600,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      progressPercentage: 40,
      status: 'In Progress'
    },
    {
      title: 'Fleet Diesel Reduction by 15%',
      department: opsDept._id,
      metric: 'Litres per month',
      baselineValue: 240,
      targetValue: 204,
      currentValue: 200,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-06-30'),
      progressPercentage: 80,
      status: 'In Progress'
    },
    {
      title: 'Zero Carbon Procurement Goal',
      department: procureDept._id,
      metric: 'kgCO2e from purchases',
      baselineValue: 10000,
      targetValue: 5000,
      currentValue: 7000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2024-12-31'), // intentionally expired for demo
      progressPercentage: 60,
      status: 'At Risk'
    }
  ]);
  console.log('Environmental goals seeded.');

  // ─── CSR Activities ──────────────────────────────────────────────────────
  const [treePlanting, bloodDrive] = await CSRActivity.insertMany([
    {
      title: 'City Park Tree Planting Drive',
      category: envCat._id,
      description: 'Join us for a community tree planting initiative in the local city park. Help us plant 200 trees this season.',
      department: hrDept._id,
      location: 'City Park, Downtown',
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-07-31'),
      maxParticipants: 30,
      pointsAwarded: 100,
      evidenceRequired: false,
      status: 'Active',
      createdBy: managerUser._id
    },
    {
      title: 'Annual Blood Donation Drive',
      category: wellnessCat._id,
      description: 'Participate in our annual blood donation campaign to support local hospitals and save lives.',
      department: hrDept._id,
      location: 'Company Health Center',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2025-08-15'),
      maxParticipants: 50,
      pointsAwarded: 75,
      evidenceRequired: false,
      status: 'Published',
      createdBy: managerUser._id
    }
  ]);
  console.log('CSR activities seeded.');

  // ─── Employee Participation ──────────────────────────────────────────────
  const participation = await EmployeeParticipation.create({
    employee: employeeUser._id,
    csrActivity: treePlanting._id,
    approvalStatus: 'Approved',
    pointsEarned: 100,
    completionDate: new Date(),
    reviewedBy: managerUser._id,
    reviewNotes: 'Great participation! Well done.'
  });

  // XP transaction for CSR points
  await XPTransaction.create({
    user: employeeUser._id,
    amount: 100,
    type: 'CSR',
    description: 'Completed CSR Activity: City Park Tree Planting Drive',
    referenceId: participation._id
  });
  console.log('Employee participation seeded.');

  // ─── ESG Policies ────────────────────────────────────────────────────────
  const [envPolicy, dataPolicy] = await ESGPolicy.insertMany([
    {
      title: 'Environmental Responsibility Policy',
      policyCode: 'ENV-001',
      description: 'This policy outlines our organization\'s commitment to environmental sustainability, including carbon reduction targets, waste management protocols, and responsible energy consumption practices.',
      version: '2.1',
      effectiveDate: new Date('2025-01-01'),
      reviewDate: new Date('2025-12-31'),
      requiredAcknowledgement: true,
      targetDepartments: [],
      status: 'Published'
    },
    {
      title: 'Data Protection & Privacy Policy',
      policyCode: 'DATA-001',
      description: 'Comprehensive data protection guidelines ensuring compliance with GDPR, CCPA, and internal data handling standards for all employees and third-party vendors.',
      version: '1.5',
      effectiveDate: new Date('2025-02-01'),
      reviewDate: new Date('2025-11-30'),
      requiredAcknowledgement: true,
      targetDepartments: [techDept._id, hrDept._id],
      status: 'Published'
    }
  ]);

  // Employee has acknowledged one policy
  await PolicyAcknowledgement.create({
    policy: envPolicy._id,
    employee: employeeUser._id,
    acknowledgedAt: new Date(),
    status: 'Acknowledged'
  });
  console.log('Policies and acknowledgements seeded.');

  // ─── Audits ──────────────────────────────────────────────────────────────
  const audit = await Audit.create({
    auditTitle: 'Q2 Environmental Compliance Audit',
    auditType: 'Environmental',
    department: techDept._id,
    assignedAuditor: auditorUser._id,
    startDate: new Date('2025-06-01'),
    dueDate: new Date('2025-07-15'),
    status: 'In Progress',
    scope: 'Review of electricity consumption, waste management, and carbon reporting processes.',
    createdBy: managerUser._id
  });
  console.log('Audits seeded.');

  // ─── Compliance Issues ───────────────────────────────────────────────────
  await ComplianceIssue.insertMany([
    {
      auditReference: audit._id,
      title: 'Missing Carbon Emission Documentation',
      severity: 'High',
      description: 'The Technology department is missing carbon emission documentation for Q1 2025 fleet activities.',
      department: techDept._id,
      owner: managerUser._id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: 'Open',
      createdBy: auditorUser._id
    },
    {
      title: 'Safety Equipment Non-Compliance',
      severity: 'Medium',
      description: 'Operations floor safety equipment inspection records are 3 months overdue.',
      department: opsDept._id,
      owner: adminUser._id,
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Overdue by 5 days
      status: 'In Progress',
      createdBy: managerUser._id
    },
    {
      title: 'Data Retention Policy Violation',
      severity: 'Critical',
      description: 'Employee records in the HR system have not been archived per the data retention policy timelines.',
      department: hrDept._id,
      owner: managerUser._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'Open',
      createdBy: adminUser._id
    }
  ]);
  console.log('Compliance issues seeded.');

  // ─── Challenges ──────────────────────────────────────────────────────────
  const [greenChallenge] = await Challenge.insertMany([
    {
      title: '30-Day Green Commute Challenge',
      category: challengeCat._id,
      description: 'Commit to using only public transport, cycling, or walking for your daily commute for 30 consecutive days. Track your carbon savings!',
      xp: 150,
      difficulty: 'Medium',
      evidenceRequired: false,
      startDate: new Date('2025-07-01'),
      deadline: new Date('2025-07-31'),
      maxParticipants: 25,
      status: 'Active',
      createdBy: managerUser._id
    },
    {
      title: 'Paperless Office Challenge',
      category: challengeCat._id,
      description: 'Go entirely paperless for one full month. Document your actions using digital tools only.',
      xp: 100,
      difficulty: 'Easy',
      evidenceRequired: false,
      startDate: new Date('2025-08-01'),
      deadline: new Date('2025-08-31'),
      maxParticipants: 50,
      status: 'Draft',
      createdBy: managerUser._id
    }
  ]);

  // Employee participation in challenge
  const challengeParticipation = await ChallengeParticipation.create({
    challenge: greenChallenge._id,
    employee: employeeUser._id,
    progress: 100,
    approvalStatus: 'Approved',
    xpAwarded: 150,
    completionDate: new Date(),
    reviewedBy: managerUser._id,
    reviewNotes: 'Excellent effort on going green!'
  });

  // XP transaction for challenge
  await XPTransaction.create({
    user: employeeUser._id,
    amount: 150,
    type: 'Challenge',
    description: 'Completed Challenge: 30-Day Green Commute Challenge',
    referenceId: challengeParticipation._id
  });
  console.log('Challenges and participations seeded.');

  // ─── Badges ──────────────────────────────────────────────────────────────
  await Badge.insertMany([
    {
      name: 'Green Starter',
      description: 'Awarded for reaching 100 lifetime XP points',
      icon: '',
      unlockMetric: 'TotalXP',
      unlockThreshold: 100,
      status: 'Active'
    },
    {
      name: 'Challenge Champion',
      description: 'Awarded for completing 3 sustainability challenges',
      icon: '',
      unlockMetric: 'CompletedChallenges',
      unlockThreshold: 3,
      status: 'Active'
    },
    {
      name: 'CSR Hero',
      description: 'Awarded for participating in 5 CSR activities',
      icon: '',
      unlockMetric: 'CompletedCSR',
      unlockThreshold: 5,
      status: 'Active'
    },
    {
      name: 'XP Legend',
      description: 'Awarded for reaching 1000 lifetime XP points',
      icon: '',
      unlockMetric: 'TotalXP',
      unlockThreshold: 1000,
      status: 'Active'
    }
  ]);
  console.log('Badges seeded.');

  // ─── Rewards ─────────────────────────────────────────────────────────────
  await Reward.insertMany([
    {
      name: 'Eco Water Bottle',
      description: 'A premium stainless steel eco-friendly water bottle, perfect for reducing plastic waste.',
      pointsRequired: 50,
      availableStock: 20,
      status: 'Active'
    },
    {
      name: 'Sustainable Tote Bag',
      description: 'Handmade organic cotton tote bag featuring the EcoSphere brand.',
      pointsRequired: 30,
      availableStock: 50,
      status: 'Active'
    },
    {
      name: 'Extra Leave Day',
      description: 'Redeem for one additional paid leave day, approved by your manager.',
      pointsRequired: 200,
      availableStock: 5,
      status: 'Active'
    },
    {
      name: 'Charity Donation (₹500)',
      description: 'We will make a ₹500 donation to an environmental charity of your choice on your behalf.',
      pointsRequired: 100,
      availableStock: 30,
      status: 'Active'
    }
  ]);
  console.log('Rewards seeded.');

  // ─── ESG Score History ───────────────────────────────────────────────────
  const periods = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];
  const scoreHistory = periods.map((p, i) => ({
    period: p,
    organizationScore: 62 + i * 2,
    environmentalScore: 58 + i * 2,
    socialScore: 65 + i,
    governanceScore: 60 + i * 3
  }));
  await ESGScoreHistory.insertMany(scoreHistory);

  // Department Scores for latest period
  await DepartmentScore.insertMany([
    { department: techDept._id, period: '2025-06', environmentalScore: 68, socialScore: 72, governanceScore: 65, totalScore: 68 },
    { department: hrDept._id, period: '2025-06', environmentalScore: 75, socialScore: 80, governanceScore: 70, totalScore: 74 },
    { department: opsDept._id, period: '2025-06', environmentalScore: 60, socialScore: 65, governanceScore: 62, totalScore: 62 },
    { department: procureDept._id, period: '2025-06', environmentalScore: 55, socialScore: 60, governanceScore: 58, totalScore: 57 }
  ]);
  console.log('ESG score history seeded.');

  // ─── Notifications ───────────────────────────────────────────────────────
  await Notification.insertMany([
    {
      user: employeeUser._id,
      title: 'Welcome to EcoSphere!',
      message: 'Welcome to the EcoSphere ESG Management Platform. Start exploring challenges, CSR activities, and earning XP!',
      type: 'Challenge',
      isRead: false
    },
    {
      user: employeeUser._id,
      title: 'CSR Activity Approved!',
      message: 'Your participation in "City Park Tree Planting Drive" has been approved. You earned 100 CSR points!',
      type: 'CSR',
      relatedEntityType: 'CSRActivity',
      relatedEntityId: treePlanting._id,
      isRead: true
    },
    {
      user: auditorUser._id,
      title: 'Audit Assignment',
      message: 'You have been assigned to conduct the "Q2 Environmental Compliance Audit". Please review and begin your assessment.',
      type: 'Audit',
      relatedEntityType: 'Audit',
      relatedEntityId: audit._id,
      isRead: false
    },
    {
      user: managerUser._id,
      title: 'Compliance Issue Assigned',
      message: 'A new compliance issue "Data Retention Policy Violation" (Severity: Critical) has been assigned to you.',
      type: 'Compliance',
      isRead: false
    }
  ]);
  console.log('Notifications seeded.');

  console.log('\n✅ Seed completed successfully!\n');
  console.log('Demo Accounts:');
  console.log('  Admin:      admin@ecosphere.com      / Admin@123');
  console.log('  ESG Mgr:    manager@ecosphere.com    / Manager@123');
  console.log('  Employee:   employee@ecosphere.com   / Employee@123');
  console.log('  Auditor:    auditor@ecosphere.com    / Auditor@123');

  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
