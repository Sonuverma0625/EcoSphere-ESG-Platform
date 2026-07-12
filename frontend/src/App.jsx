import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from 'react-hot-toast';

// Layout & Route Guards
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import Dashboard from './pages/Dashboard';
import CarbonTracker from './pages/CarbonTracker';
import SustainabilityGoals from './pages/SustainabilityGoals';
import CSRActivities from './pages/CSRActivities';
import Policies from './pages/Policies';
import Audits from './pages/Audits';
import Reports from './pages/Reports';
import EmployeeCenter from './pages/EmployeeCenter';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import UsersManagement from './pages/UsersManagement';
import SystemSettings from './pages/SystemSettings';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(255, 255, 255, 0.85)',
                color: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: '700'
              }
            }}
          />
          <Routes>
            {/* Public Access */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Authenticated Workspace Shell */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                {/* Everyone can access */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/leaderboard" element={<Leaderboard />} />

                {/* ESG Roles & Admin Operations */}
                <Route element={<ProtectedRoute allowedRoles={['Admin', 'ESG Manager']} />}>
                  <Route path="/carbon-tracker" element={<CarbonTracker />} />
                  <Route path="/reports" element={<Reports />} />
                </Route>

                {/* Goals & CSR (Admin, ESG Manager, Employee) */}
                <Route element={<ProtectedRoute allowedRoles={['Admin', 'ESG Manager', 'Employee']} />}>
                  <Route path="/goals" element={<SustainabilityGoals />} />
                  <Route path="/csr" element={<CSRActivities />} />
                  <Route path="/policies" element={<Policies />} />
                </Route>

                {/* Audits & Issues (Admin, ESG Manager, Auditor) */}
                <Route element={<ProtectedRoute allowedRoles={['Admin', 'ESG Manager', 'Auditor']} />}>
                  <Route path="/compliance" element={<Audits />} />
                </Route>

                {/* Gamified Employee center specific for Employee */}
                <Route element={<ProtectedRoute allowedRoles={['Employee']} />}>
                  <Route path="/employee-center" element={<EmployeeCenter />} />
                </Route>

                {/* Admin Only tools */}
                <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                  <Route path="/users" element={<UsersManagement />} />
                  <Route path="/settings" element={<SystemSettings />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
