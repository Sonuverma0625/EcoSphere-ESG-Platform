import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Bell, User, LogOut, ChevronDown, Check, X, ShieldAlert, Award, FileText, CheckSquare, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'Compliance':
        return <ShieldAlert className="h-5 w-5 text-red-500" />;
      case 'Audit':
        return <CheckSquare className="h-5 w-5 text-blue-500" />;
      case 'Policy':
        return <FileText className="h-5 w-5 text-yellow-500" />;
      case 'Challenge':
      case 'CSR':
        return <Award className="h-5 w-5 text-emerald-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <nav className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/80 px-6 backdrop-blur-md">
      {/* Title / Hamburger for mobile */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 lg:hidden"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">EcoSphere</span>
          <span className="hidden rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 sm:inline-block">ESG</span>
        </Link>
      </div>

      {/* Action Items */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileDropdown(false);
            }}
            className="relative rounded-full p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-750"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-sm shadow-emerald-200">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-100 bg-white/95 shadow-xl ring-1 ring-black/5 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <span className="text-sm font-bold text-slate-700">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No notifications.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`flex gap-3 border-b border-slate-50 px-4 py-3 hover:bg-slate-50/50 ${
                        !n.isRead ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">{getNotificationIcon(n.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-1">
                          <span className={`text-xs font-bold ${!n.isRead ? 'text-emerald-800' : 'text-slate-700'}`}>
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <button
                              onClick={() => markAsRead(n._id)}
                              className="text-slate-400 hover:text-emerald-600"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3 text-sm font-semibold text-slate-650 hover:bg-slate-50"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 font-bold text-white shadow-sm shadow-emerald-200">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <span className="hidden md:inline-block text-slate-700">{user?.name}</span>
            <ChevronDown className="h-4 w-4 text-slate-450" />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-100 bg-white/95 py-1.5 shadow-xl ring-1 ring-black/5 backdrop-blur-md">
              <div className="border-b border-slate-100 px-4 py-2">
                <p className="text-xs font-bold text-slate-700">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                <span className="mt-1.5 inline-block rounded-md bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                  {user?.role}
                </span>
              </div>
              <Link
                to="/profile"
                onClick={() => setShowProfileDropdown(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50"
              >
                <User className="h-4 w-4" />
                My Profile
              </Link>
              {user?.role === 'Admin' && (
                <Link
                  to="/settings"
                  onClick={() => setShowProfileDropdown(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50"
                >
                  <Settings className="h-4 w-4" />
                  System Settings
                </Link>
              )}
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs text-red-500 hover:bg-slate-50 border-t border-slate-50 mt-1"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
