import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  ShieldAlert, Users, Settings, Award, Layers, HelpCircle, 
  Activity, BarChart3, AlertCircle, ChevronRight, CheckCircle2 
} from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [certs, setCerts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states for creating items
  const [newQText, setNewQText] = useState('');
  const [newQTopic, setNewQTopic] = useState('Operating Systems');
  const [newQDiff, setNewQDiff] = useState('Medium');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getAdminStats();
      setStats(data);
    } catch (e) {
      setError('You must be logged in as an administrator to access the admin portal.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    setLoading(true);
    try {
      if (tab === 'users') {
        const uList = await api.getAdminUsers();
        setUsers(uList.users || []);
      } else if (tab === 'questions') {
        const qList = await api.getAdminQuestions();
        setQuestions(qList.questions || []);
      } else if (tab === 'companies') {
        const cList = await api.getAdminCompanies();
        setCompanies(cList.companies || []);
      } else if (tab === 'certificates') {
        const certList = await api.getAdminCertificates();
        setCerts(certList.certificates || []);
      } else if (tab === 'system') {
        const logs = await api.getAdminAuditLogs();
        setAuditLogs(logs.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBypassRound = async (round) => {
    try {
      await api.bypassRound(round);
      alert(`Successfully bypassed round ${round}!`);
      loadStats();
    } catch (e) {
      alert('Bypass request failed');
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!newQText.trim()) return;

    try {
      setLoading(true);
      await api.createAdminQuestion({
        text: newQText.trim(),
        topic: newQTopic,
        difficulty: newQDiff,
        options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
        correct_option: 'A'
      });
      setNewQText('');
      // Reload questions
      const qList = await api.getAdminQuestions();
      setQuestions(qList.questions || []);
    } catch (err) {
      alert('Failed to create question');
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
            {[
              { id: 'dashboard', label: 'Telemetry', icon: BarChart3 },
              { id: 'users', label: 'Registered Candidates', icon: Users },
              { id: 'questions', label: 'Question Configs', icon: HelpCircle },
              { id: 'companies', label: 'Company Placements', icon: Layers },
              { id: 'certificates', label: 'Issued Credentials', icon: Award },
              { id: 'system', label: 'System Logs', icon: Activity }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-xl transition-all text-left ${
                    activeTab === tab.id 
                      ? 'bg-slate-800 text-white font-bold border border-slate-700/65' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Main Panel Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Tab: Dashboard Telemetry */}
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Total Users</p><p className="text-2xl font-black text-white mt-1">{stats.total_users}</p></div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Total Sessions</p><p className="text-2xl font-black text-white mt-1">{stats.total_sessions}</p></div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Active Sessions</p><p className="text-2xl font-black text-emerald-400 mt-1">{stats.active_sessions}</p></div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Rounds Cleared</p><p className="text-2xl font-black text-amber-500 mt-1">{stats.total_rounds_cleared}</p></div>
                </div>

                {/* Round Bypasser Controls */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h3 className="text-base font-bold text-white">System Testing Round Controls</h3>
                  <p className="text-slate-400 text-xs">Simulate developer bypass triggers to unlock specific candidate assessment paths during local verification.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                    {[1, 2, 3, 4].map(rNum => (
                      <button
                        key={rNum}
                        onClick={() => handleBypassRound(rNum)}
                        className="py-2.5 bg-slate-800 border border-slate-700 hover:border-indigo-500/50 text-slate-300 font-bold text-[11px] rounded-lg transition-all"
                      >
                        Bypass Round {rNum}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Users */}
            {activeTab === 'users' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-950/40 text-[9px] text-slate-500 uppercase font-bold tracking-widest p-3">
                      <th className="p-3">Username</th>
                      <th className="p-3">Permission</th>
                      <th className="p-3 text-center">Employability</th>
                      <th className="p-3 text-center">Interviews</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-850/20">
                        <td className="p-3 font-semibold text-slate-200">{u.username || 'Anonymous'}</td>
                        <td className="p-3">
                          {u.is_admin ? (
                            <span className="px-2 py-0.5 bg-amber-950/60 border border-amber-800 text-amber-400 rounded-full text-[9px] font-bold">Admin</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-full text-[9px]">Candidate</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-300">{u.readiness_score?.toFixed(1)}%</td>
                        <td className="p-3 text-center text-slate-400">{u.total_interviews || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab: Questions config */}
            {activeTab === 'questions' && (
              <div className="space-y-6">
                {/* Create question form */}
                <form onSubmit={handleCreateQuestion} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-white text-base">Add New MCQ / Technical Question</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Topic</label>
                      <select 
                        value={newQTopic} 
                        onChange={(e) => setNewQTopic(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 text-white text-xs p-3 rounded-xl focus:outline-none"
                      >
                        <option value="Operating Systems">Operating Systems</option>
                        <option value="DBMS">Database Management</option>
                        <option value="Computer Networks">Computer Networks</option>
                        <option value="Data Structures">Data Structures</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Difficulty</label>
                      <select 
                        value={newQDiff} 
                        onChange={(e) => setNewQDiff(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 text-white text-xs p-3 rounded-xl focus:outline-none"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Question Content</label>
                    <input 
                      type="text" 
                      value={newQText}
                      onChange={(e) => setNewQText(e.target.value)}
                      placeholder="e.g. Explain memory virtualization mechanisms..."
                      required
                      className="w-full bg-slate-950/60 border border-slate-800 text-white text-xs p-3 rounded-xl focus:outline-none"
                    />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl">
                    Add Question to Bank
                  </button>
                </form>

                {/* Questions List */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-6 space-y-3">
                  <h3 className="font-bold text-white text-sm">Active Questions ({questions.length})</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {questions.map((q, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-xs space-y-1.5">
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-indigo-400 font-bold">{q.topic}</span>
                          <span className="text-slate-500">{q.difficulty}</span>
                        </div>
                        <p className="text-slate-300 font-semibold">{q.text || q.question_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: System logs */}
            {activeTab === 'system' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white">Audit Log Trails</h3>
                <div className="font-mono text-[11px] text-slate-400 bg-slate-950/80 p-4 rounded-xl border border-slate-900 max-h-[350px] overflow-y-auto space-y-2 leading-relaxed">
                  {auditLogs.map((log, idx) => (
                    <div key={idx} className="border-b border-slate-900 pb-2">
                      <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                      <span className="text-indigo-400">({log.action})</span>{' '}
                      <span className="text-slate-300">{log.details}</span>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <p className="text-slate-500 italic text-center py-6">No audit activities tracked yet.</p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
