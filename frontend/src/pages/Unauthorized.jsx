import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-600">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">
        Access Denied
      </h1>
      <p className="mt-3 max-w-md text-xs font-semibold text-slate-400">
        You do not have the required permissions or organizational roles to access this module. Please contact your ESG administrator if this is an error.
      </p>
      <div className="mt-8">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-5 py-2.5 text-xs font-black text-slate-650 hover:bg-white shadow-sm transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
