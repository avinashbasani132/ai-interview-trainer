import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ShieldAlert, Activity, AlertCircle } from 'lucide-react';

export default function Admin() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSystemLogs();
  }, []);

  const loadSystemLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const logs = await api.getAdminAuditLogs();
      setAuditLogs(logs.logs || []);
    } catch (e) {
      setError('You must be logged in as an administrator to access the admin portal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-3xl font-extrabold text-white flex items-center gap-2 font-outfit">
          <ShieldAlert className="w-8 h-8 text-amber-500" />
          Admin Management Portal
        </h2>
        <p className="text-slate-400 mt-1 text-sm">System controls, dashboard telemetry, and direct question bank modifications.</p>
      </div>

      {error ? (
        <div className="p-6 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Tabs Sidebar */}
          <div className="space-y-2 lg:col-span-1 bg-slate-900 border border-slate-850 p-4 rounded-2xl h-fit">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold px-3 mb-3">Management Options</p>
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-xs rounded-xl transition-all text-left bg-slate-800 text-white font-bold border border-slate-700/65"
            >
              <Activity className="w-4 h-4" />
              System Logs
            </button>
          </div>

          {/* Main Panel Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Audit Log Trails</h3>
              <div className="font-mono text-[11px] text-slate-400 bg-slate-950/80 p-4 rounded-xl border border-slate-900 max-h-[350px] overflow-y-auto space-y-2 leading-relaxed">
                {loading ? (
                  <p className="text-slate-500 italic text-center py-6 animate-pulse">Loading logs...</p>
                ) : auditLogs.length > 0 ? (
                  auditLogs.map((log, idx) => (
                    <div key={idx} className="border-b border-slate-900 pb-2">
                      <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                      <span className="text-indigo-400">({log.action})</span>{' '}
                      <span className="text-slate-300">{log.details}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic text-center py-6">No audit activities tracked yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
