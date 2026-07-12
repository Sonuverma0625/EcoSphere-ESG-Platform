import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-tr from-[#f3faf7] via-white to-[#f4f7fa] text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navigation Bar */}
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Dynamic Route Outlet */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-transparent">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
