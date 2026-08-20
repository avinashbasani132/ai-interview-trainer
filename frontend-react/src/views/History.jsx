import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Calendar, CheckCircle2, XCircle, Filter } from 'lucide-react';


export default function History() {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getHistory();
      setHistory(data.history || []);
      setFilteredHistory(data.history || []);
    } catch (e) {
      setError(e.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    if (type === 'all') {
      setFilteredHistory(history);
    } else {
      setFilteredHistory(history.filter(item => item.round_type && item.round_type.toLowerCase().includes(type.toLowerCase())));
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white font-outfit">Interview History</h2>
          <p className="text-slate-400 mt-1 text-sm">Review your past scores, feedback, and performance breakdowns.</p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl">
          <Filter className="w-4 h-4 text-slate-500 ml-2" />
          <select 
            value={filterType}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="bg-transparent text-slate-300 text-xs focus:outline-none pr-4 cursor-pointer"
          >
            <option value="all">All Rounds</option>
            <option value="Aptitude">Aptitude</option>
            <option value="Technical">Technical AI</option>
            <option value="Coding">Coding</option>
            <option value="HR">HR Video</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* History table */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                <th className="p-4">Pathway / Round</th>
                <th className="p-4">Score</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">AI Feedback Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item, idx) => {
                  const passed = item.score >= 70 || item.status === 'Pass';
                  return (
                    <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-950/50 border border-slate-800 text-indigo-300 rounded-full font-semibold">
                          {item.round_type}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full ${passed ? 'bg-emerald-500' : 'bg-red-500'}`} 
                              style={{ width: `${Math.min(100, item.score)}%` }}
                            ></div>
                          </div>
                          <span className={`font-bold ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
                            {item.score?.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit ${passed ? 'bg-green-950/60 text-green-400 border border-green-800' : 'bg-red-950/60 text-red-400 border border-red-800'}`}>
                          {passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {passed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 italic max-w-xs truncate" title={item.feedback_summary}>
                        {item.feedback_summary || '—'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-500 text-xs">
                    No interview history record found. Complete standard rounds or resume interviews to see records!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
