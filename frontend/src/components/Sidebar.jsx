import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Flame,
  Award,
  BookOpen,
  Calendar,
  FileBarChart,
  ShieldCheck,
  Users,
  Settings,
  X,
  ClipboardList
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Admin', 'ESG Manager', 'Employee', 'Auditor'] },
    { name: 'Carbon Tracker', path: '/carbon-tracker', icon: Flame, roles: ['Admin', 'ESG Manager'] },
    { name: 'Sustainability Goals', path: '/goals', icon: Calendar, roles: ['Admin', 'ESG Manager', 'Employee'] },
    { name: 'CSR Hub', path: '/csr', icon: Award, roles: ['Admin', 'ESG Manager', 'Employee'] },
    { name: 'ESG Policies', path: '/policies', icon: BookOpen, roles: ['Admin', 'ESG Manager', 'Employee'] },
    { name: 'Compliance & Audits', path: '/compliance', icon: ShieldCheck, roles: ['Admin', 'ESG Manager', 'Auditor'] },
    { name: 'ESG Reports', path: '/reports', icon: FileBarChart, roles: ['Admin', 'ESG Manager'] },
    { name: 'Employee Center', path: '/employee-center', icon: ClipboardList, roles: ['Employee'] },
    { name: 'Leaderboard', path: '/leaderboard', icon: Award, roles: ['Admin', 'ESG Manager', 'Employee', 'Auditor'] },
    { name: 'Users Management', path: '/users', icon: Users, roles: ['Admin'] },
    { name: 'System Settings', path: '/settings', icon: Settings, roles: ['Admin'] }
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-100 bg-white/90 backdrop-blur-md transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Head */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 lg:justify-center">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">EcoSphere</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {filteredItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold tracking-wide transition-all duration-200 border ${
                  isActive
                    ? 'bg-emerald-50/70 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-100/30'
                    : 'text-slate-500 border-transparent hover:bg-slate-50/60 hover:text-slate-800'
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 font-bold text-emerald-700 border border-emerald-100">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-700">{user?.name}</p>
              <p className="truncate text-[10px] font-semibold text-slate-400">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
