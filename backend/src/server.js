require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const app = require('./app');
const connectDB = require('./config/db');
const { startJobs } = require('./jobs/scheduledJobs');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🚀 EcoSphere ESG API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Start background cron jobs
  startJobs();
};

startServer().catch(err => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
