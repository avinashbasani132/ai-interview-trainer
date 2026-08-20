import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  ShieldAlert, Users, Award, Layers, HelpCircle, 
  Activity, BarChart3, AlertCircle, Trash2, Plus, 
  Building, CheckCircle2, Search, Filter, RefreshCw,
  Sun, Moon, LogOut, ArrowLeft
} from 'lucide-react';

export default function Admin({ logout, toggleTheme, isLightMode, setActiveView }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [certs, setCerts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');


  // Filtering states for Question Configs
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('all');
  const [selectedRoundFilter, setSelectedRoundFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for creating a new structured question
  const [targetCompanyId, setTargetCompanyId] = useState('');
  const [newQRound, setNewQRound] = useState('Technical MCQ');
  const [newQTopic, setNewQTopic] = useState('Core CS Fundamentals');
  const [newQDiff, setNewQDiff] = useState('Medium');
  const [newQText, setNewQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState('A');
  const [expectedAnswer, setExpectedAnswer] = useState('');

  // Form states for creating a new company
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompCategory, setNewCompCategory] = useState('Product');
  const [newCompDifficulty, setNewCompDifficulty] = useState('Medium');
  const [newCompDesc, setNewCompDesc] = useState('');
  const [newCompLogo, setNewCompLogo] = useState('');


  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, compData, logData] = await Promise.all([
        api.getAdminStats().catch(() => null),
        api.getAdminCompanies().catch(() => ({ companies: [] })),
        api.getAdminAuditLogs().catch(() => ({ logs: [] }))
      ]);

      if (statsData) setStats(statsData);
      if (compData && compData.companies) setCompanies(compData.companies);
      if (logData && logData.logs) setAuditLogs(logData.logs);
    } catch (err) {
      setError(err.message || 'Failed to initialize administrator telemetry. Ensure you have admin privileges.');
    } finally {
      setLoading(false);
    }
  };


  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    setSuccessMsg('');
    setError('');
    setLoading(true);
    try {
      if (tab === 'dashboard') {
        const statsData = await api.getAdminStats();
        setStats(statsData);
      } else if (tab === 'users') {
        const uList = await api.getAdminUsers();
        setUsers(uList.users || []);
      } else if (tab === 'questions') {
        await refreshQuestions(selectedCompanyFilter, selectedRoundFilter);
        if (companies.length === 0) {
          const cList = await api.getAdminCompanies();
          setCompanies(cList.companies || []);
        }
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
      setError(e.message || 'Error loading tab data');
    } finally {
      setLoading(false);
    }
  };

  const refreshQuestions = async (compId, roundType) => {
    const qList = await api.getAdminQuestions({
      company_id: compId,
      round_type: roundType
    });
    setQuestions(qList.questions || []);
  };

  const handleFilterQuestions = async (compId, roundType) => {
    setSelectedCompanyFilter(compId);
    setSelectedRoundFilter(roundType);
    setLoading(true);
    try {
      await refreshQuestions(compId, roundType);
    } catch (err) {
      setError(err.message || 'Failed to filter questions');
    } finally {
      setLoading(false);
    }
  };


  const handleBypassRound = async (round) => {
    try {
      setActionLoading(true);
      await api.bypassRound(round);
      setSuccessMsg(`Successfully bypassed system assessment to round ${round}!`);
      const s = await api.getAdminStats();
      setStats(s);
    } catch (e) {
      setError('Bypass request failed: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!newQText.trim()) return;

    setActionLoading(true);
    setError('');
    try {
      const isMCQ = newQRound === 'Aptitude' || newQRound === 'Technical MCQ';
      const options = isMCQ ? {
        A: optA || 'Option A',
        B: optB || 'Option B',
        C: optC || 'Option C',
        D: optD || 'Option D'
      } : (newQRound === 'Coding' ? {
        title: newQTopic || 'Coding Problem',
        difficulty: newQDiff,
        example_input: optA || '',
        example_output: optB || ''
      } : null);

      const targetCompObj = companies.find(c => c.id === targetCompanyId);

      await api.createAdminQuestion({
        company_id: targetCompanyId || null,
        company_name: targetCompObj ? targetCompObj.name : null,
        round_type: newQRound,
        topic: newQTopic,
        difficulty: newQDiff,
        question_text: newQText.trim(),
        options: options,
        correct_option: correctOpt,
        expected_answer: expectedAnswer
      });

      setSuccessMsg(`Question successfully saved to ${targetCompObj ? targetCompObj.name : 'General'} Bank!`);
      setNewQText('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setExpectedAnswer('');

      await refreshQuestions(selectedCompanyFilter, selectedRoundFilter);
    } catch (err) {
      setError(err.message || 'Failed to add question');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      setActionLoading(true);
      await api.deleteAdminQuestion(qId);
      setSuccessMsg('Question deleted successfully');
      await refreshQuestions(selectedCompanyFilter, selectedRoundFilter);
    } catch (err) {
      setError(err.message || 'Failed to delete question');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!newCompName.trim()) return;

    setActionLoading(true);
    setError('');
    try {
      await api.createAdminCompany({
        name: newCompName.trim(),
        category: newCompCategory,
        difficulty: newCompDifficulty,
        duration: newCompDuration,
        description: newCompDesc.trim() || `Prepare for ${newCompName}'s comprehensive assessment cycle.`,
        logo_url: newCompLogo.trim() || 'https://img.icons8.com/color/144/company.png'
      });

      setSuccessMsg(`Company "${newCompName}" successfully enrolled!`);
      setShowAddCompanyModal(false);
      setNewCompName('');
      setNewCompDesc('');
      setNewCompLogo('');

      const cList = await api.getAdminCompanies();
      setCompanies(cList.companies || []);
    } catch (err) {
      setError(err.message || 'Failed to add company');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredQuestionsList = questions.filter(q => {
    if (!searchQuery) return true;
    const text = (q.question_text || '').toLowerCase();
    const topic = (q.topic || '').toLowerCase();
    const compName = (q.company_name || '').toLowerCase();
    const sq = searchQuery.toLowerCase();
    return text.includes(sq) || topic.includes(sq) || compName.includes(sq);
  });

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white p-6 md:p-10 space-y-8 animate-fade-in">
      {/* Title & Portal Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 shadow-lg shadow-amber-500/5">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight font-outfit">
                Administrator Portal
              </h2>
              <p className="text-slate-400 text-xs md:text-sm mt-0.5">
                Centralized system controls, 33-company question banks, telemetry & candidate monitoring.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh Button */}
          <button
            onClick={() => handleTabChange(activeTab)}
            disabled={loading || actionLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all shadow-md hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Theme Toggle Button */}
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all hover:text-white"
              title="Toggle Theme"
            >
              {isLightMode ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          )}

          {/* Switch to Candidate App Button */}
          {setActiveView && (
            <button
              onClick={() => setActiveView('dashboard')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600/10 border border-indigo-500/30 hover:bg-indigo-600/20 text-indigo-300 rounded-xl text-xs font-semibold transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Candidate App</span>
            </button>
          )}

          {/* Logout Button */}
          {logout && (
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-600/10 border border-rose-500/30 hover:bg-rose-600/20 text-rose-400 rounded-xl text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>


      {/* Global Alerts */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl flex items-center justify-between gap-3 text-sm animate-slide-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-200 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center justify-between gap-3 text-sm animate-slide-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-200 text-xs font-bold">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Tabs Sidebar */}
        <div className="space-y-2 lg:col-span-1 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl h-fit backdrop-blur shadow-xl">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold px-3 mb-3">Management Options</p>
          {[
            { id: 'dashboard', label: 'Telemetry & Overview', icon: BarChart3 },
            { id: 'companies', label: 'Company Placements (33)', icon: Layers },
            { id: 'questions', label: 'Question Bank Configs', icon: HelpCircle },
            { id: 'users', label: 'Registered Candidates', icon: Users },
            { id: 'certificates', label: 'Issued Credentials', icon: Award },
            { id: 'system', label: 'System Logs & Health', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 text-xs rounded-xl transition-all text-left font-medium ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold shadow-lg shadow-indigo-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Workspace Area */}
        <div className="lg:col-span-3 space-y-6">

          {/* TAB 1: TELEMETRY & SYSTEM OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {stats ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Candidates</p>
                    <p className="text-3xl font-black text-white mt-1.5 font-outfit">{stats.total_users}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Sessions</p>
                    <p className="text-3xl font-black text-indigo-400 mt-1.5 font-outfit">{stats.total_sessions}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Active Live</p>
                    <p className="text-3xl font-black text-emerald-400 mt-1.5 font-outfit">{stats.active_sessions}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Rounds Cleared</p>
                    <p className="text-3xl font-black text-amber-400 mt-1.5 font-outfit">{stats.total_rounds_cleared}</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500">Loading system metrics...</div>
              )}

              {/* Developer Test & Verification Bypass */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  <h3>Developer Assessment Test Controls</h3>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Trigger instant round bypasses to directly evaluate Round 1 (Aptitude), Round 2 (Technical MCQ), Round 3 (Coding Arena), or Round 4/5 (Technical AI & HR) interview engines during testing.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {[1, 2, 3, 4].map(rNum => (
                    <button
                      key={rNum}
                      disabled={actionLoading}
                      onClick={() => handleBypassRound(rNum)}
                      className="py-3 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500 text-slate-200 font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      Bypass to Round {rNum}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Info Banner */}
              <div className="p-6 bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl space-y-2">
                <h4 className="text-white font-bold text-sm">33 Companies Question Bank Active</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Product MNCs (Google, Microsoft, Amazon, Apple, Meta, Netflix, NVIDIA...), Service Giants (TCS, Infosys, Wipro, Accenture, Cognizant...), and Startups (Zoho, Freshworks, Flipkart, PhonePe, Swiggy, Razorpay...) are loaded with structured assessment questions.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: COMPANY PLACEMENTS (33) */}
          {activeTab === 'companies' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white text-lg">Enrolled Companies ({companies.length})</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Explore recruitment formats, assessment rounds, and company-specific question counts.</p>
                </div>
                <button
                  onClick={() => setShowAddCompanyModal(!showAddCompanyModal)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <Plus className="w-4 h-4" />
                  Add New Company
                </button>
              </div>

              {/* Add Company Modal / Form */}
              {showAddCompanyModal && (
                <form onSubmit={handleCreateCompany} className="bg-slate-900 border border-indigo-500/30 p-6 rounded-2xl space-y-4 animate-slide-in">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-400" />
                    Enroll New Company into Placement Engine
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Company Name</label>
                      <input
                        type="text"
                        value={newCompName}
                        onChange={(e) => setNewCompName(e.target.value)}
                        placeholder="e.g. OpenAI"
                        required
                        className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Category</label>
                      <select
                        value={newCompCategory}
                        onChange={(e) => setNewCompCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="Product">Product MNC</option>
                        <option value="Service">Service MNC</option>
                        <option value="Startup">Tech Startup</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Difficulty</label>
                      <select
                        value={newCompDifficulty}
                        onChange={(e) => setNewCompDifficulty(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Description / Recruitment Overview</label>
                    <textarea
                      value={newCompDesc}
                      onChange={(e) => setNewCompDesc(e.target.value)}
                      placeholder="e.g. Focus on systems architecture, machine learning scale, and high-throughput algorithms."
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCompanyModal(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
                    >
                      {actionLoading ? 'Saving...' : 'Save Company'}
                    </button>
                  </div>
                </form>
              )}

              {/* Companies Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companies.map((c) => (
                  <div key={c.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 hover:border-slate-700 transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={c.logo_url || 'https://img.icons8.com/color/144/company.png'}
                            alt={c.name}
                            className="w-10 h-10 object-contain rounded-lg bg-slate-950/60 p-1 border border-slate-800"
                            onError={(e) => { e.target.src = 'https://img.icons8.com/color/144/company.png'; }}
                          />
                          <div>
                            <h4 className="font-bold text-white text-sm">{c.name}</h4>
                            <span className="text-[10px] text-slate-400">{c.hiring_type || 'Software Engineer'}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          c.category === 'Product' ? 'bg-purple-950/60 text-purple-300 border border-purple-800' :
                          c.category === 'Startup' ? 'bg-amber-950/60 text-amber-300 border border-amber-800' :
                          'bg-blue-950/60 text-blue-300 border border-blue-800'
                        }`}>
                          {c.category}
                        </span>
                      </div>

                      <p className="text-slate-400 text-xs mt-3 line-clamp-2 leading-relaxed">{c.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-850 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-indigo-400 font-semibold">
                        {c.question_count || 5}+ Structured Questions
                      </span>
                      <button
                        onClick={() => {
                          setSelectedCompanyFilter(c.id);
                          setActiveTab('questions');
                          refreshQuestions(c.id, 'all');
                        }}
                        className="text-[11px] text-slate-300 hover:text-white font-bold flex items-center gap-1 hover:underline"
                      >
                        View Bank &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: QUESTION BANK CONFIGS */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              {/* Filter Bar & Search */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    <select
                      value={selectedCompanyFilter}
                      onChange={(e) => handleFilterQuestions(e.target.value, selectedRoundFilter)}
                      className="bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-xl focus:outline-none"
                    >
                      <option value="all">All Companies & General</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={selectedRoundFilter}
                      onChange={(e) => handleFilterQuestions(selectedCompanyFilter, e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-xl focus:outline-none"
                    >
                      <option value="all">All Rounds</option>
                      <option value="Aptitude">Round 1: Aptitude</option>
                      <option value="Technical MCQ">Round 2: Technical MCQ</option>
                      <option value="Coding">Round 3: Coding</option>
                      <option value="Technical AI">Round 4: Technical AI</option>
                      <option value="HR">Round 5: HR Behavioral</option>
                    </select>
                  </div>
                </div>

                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search questions..."
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs pl-9 pr-3 py-2.5 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Add New Question Form */}
              <form onSubmit={handleCreateQuestion} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-400" />
                  Add Structured Question to Bank
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Target Company</label>
                    <select
                      value={targetCompanyId}
                      onChange={(e) => setTargetCompanyId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl focus:outline-none"
                    >
                      <option value="">General (All Interviews)</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Assessment Round</label>
                    <select
                      value={newQRound}
                      onChange={(e) => setNewQRound(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl focus:outline-none"
                    >
                      <option value="Aptitude">Round 1: Aptitude (MCQ)</option>
                      <option value="Technical MCQ">Round 2: Technical MCQ</option>
                      <option value="Coding">Round 3: Coding Challenge</option>
                      <option value="Technical AI">Round 4: Technical AI Architecture</option>
                      <option value="HR">Round 5: HR / Behavioral</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Difficulty</label>
                    <select
                      value={newQDiff}
                      onChange={(e) => setNewQDiff(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl focus:outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Topic / Category</label>
                  <input
                    type="text"
                    value={newQTopic}
                    onChange={(e) => setNewQTopic(e.target.value)}
                    placeholder="e.g. Distributed Systems, Dynamic Programming, Leadership Principles..."
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Question / Problem Statement</label>
                  <textarea
                    value={newQText}
                    onChange={(e) => setNewQText(e.target.value)}
                    placeholder="Enter the full question text or coding problem statement..."
                    rows={3}
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl focus:outline-none"
                  />
                </div>

                {/* Multiple Choice Options if MCQ */}
                {(newQRound === 'Aptitude' || newQRound === 'Technical MCQ') && (
                  <div className="space-y-3 pt-2">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Multiple Choice Options (A, B, C, D)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={optA}
                        onChange={(e) => setOptA(e.target.value)}
                        placeholder="Option A text"
                        required
                        className="bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-xl focus:outline-none"
                      />
                      <input
                        type="text"
                        value={optB}
                        onChange={(e) => setOptB(e.target.value)}
                        placeholder="Option B text"
                        required
                        className="bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-xl focus:outline-none"
                      />
                      <input
                        type="text"
                        value={optC}
                        onChange={(e) => setOptC(e.target.value)}
                        placeholder="Option C text"
                        required
                        className="bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-xl focus:outline-none"
                      />
                      <input
                        type="text"
                        value={optD}
                        onChange={(e) => setOptD(e.target.value)}
                        placeholder="Option D text"
                        required
                        className="bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Correct Option</label>
                      <select
                        value={correctOpt}
                        onChange={(e) => setCorrectOpt(e.target.value)}
                        className="w-32 bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-xl focus:outline-none"
                      >
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Expected Answer for AI / Coding */}
                {(newQRound === 'Coding' || newQRound === 'Technical AI' || newQRound === 'HR') && (
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      {newQRound === 'Coding' ? 'Example Input / Output' : 'Expected Solution / Evaluation Criteria'}
                    </label>
                    <textarea
                      value={expectedAnswer}
                      onChange={(e) => setExpectedAnswer(e.target.value)}
                      placeholder="Provide expected solution points, evaluation benchmarks, or code examples..."
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl focus:outline-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving to Database...' : 'Save Question to Bank'}
                </button>
              </form>

              {/* Active Questions List */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">
                    Structured Questions ({filteredQuestionsList.length})
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Filter: {selectedCompanyFilter === 'all' ? 'All Companies' : 'Selected Company'} | {selectedRoundFilter}
                  </span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredQuestionsList.map((q) => (
                    <div key={q.id} className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl text-xs space-y-2 hover:border-slate-750 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold rounded text-[10px]">
                            {q.company_name || 'General'}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                            {q.round_type}
                          </span>
                          <span className="text-slate-500 text-[10px]">{q.topic}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            q.difficulty === 'Hard' ? 'text-red-400 bg-red-950/50' :
                            q.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-950/50' :
                            'text-amber-400 bg-amber-950/50'
                          }`}>
                            {q.difficulty}
                          </span>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            title="Delete Question"
                            className="p-1 text-slate-500 hover:text-red-400 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-200 font-medium leading-relaxed">{q.question_text}</p>

                      {/* Options Preview */}
                      {q.options && Object.keys(q.options).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-400">
                          {Object.entries(q.options).map(([k, v]) => (
                            <div key={k} className={`p-1.5 rounded bg-slate-900/60 border ${q.correct_option === k ? 'border-emerald-500/50 text-emerald-300 font-semibold' : 'border-slate-850'}`}>
                              <span className="font-bold mr-1">{k}:</span> {typeof v === 'string' ? v : JSON.stringify(v)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {filteredQuestionsList.length === 0 && (
                    <p className="text-center text-slate-500 italic py-8">No questions found matching your filter criteria.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REGISTERED CANDIDATES */}
          {activeTab === 'users' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-slate-850 flex items-center justify-between">
                <h3 className="font-bold text-white text-base">Registered Candidates ({users.length})</h3>
                <span className="text-xs text-slate-400">Real-time candidate telemetry and employability ratings</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-950/60 text-[9px] text-slate-400 uppercase font-bold tracking-widest p-3">
                      <th className="p-3.5">Candidate / Email</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5 text-center">Employability</th>
                      <th className="p-3.5 text-center">Interviews</th>
                      <th className="p-3.5 text-center">Rounds Cleared</th>
                      <th className="p-3.5 text-right">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-850/30 transition">
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-200">{u.username || 'Anonymous'}</div>
                          <div className="text-[10px] text-slate-400">{u.email}</div>
                        </td>
                        <td className="p-3.5">
                          {u.is_admin ? (
                            <span className="px-2.5 py-0.5 bg-amber-950/60 border border-amber-800 text-amber-400 rounded-full text-[9px] font-bold">Administrator</span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-full text-[9px]">Candidate</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-bold text-indigo-400">{u.readiness_score?.toFixed(1)}%</td>
                        <td className="p-3.5 text-center text-slate-300">{u.total_interviews || 0}</td>
                        <td className="p-3.5 text-center text-amber-400 font-bold">{u.rounds_cleared || 0}</td>
                        <td className="p-3.5 text-right text-slate-500 text-[10px]">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-500 italic">No candidates registered.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ISSUED CREDENTIALS */}
          {activeTab === 'certificates' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-slate-850 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">Issued Credentials ({certs.length})</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Cryptographically signed placement certificates & assessment records.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-950/60 text-[9px] text-slate-400 uppercase font-bold tracking-widest p-3">
                      <th className="p-3.5">Certificate ID</th>
                      <th className="p-3.5">Candidate</th>
                      <th className="p-3.5">Interview Track</th>
                      <th className="p-3.5 text-center">Score</th>
                      <th className="p-3.5 text-right">Issue Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs">
                    {certs.map(c => (
                      <tr key={c.id} className="hover:bg-slate-850/30 transition">
                        <td className="p-3.5 font-mono text-[11px] text-indigo-400">{c.id}</td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-200">{c.candidate_name}</div>
                          <div className="text-[10px] text-slate-400">{c.email}</div>
                        </td>
                        <td className="p-3.5 text-slate-300 font-medium">{c.type || 'Standard SDE Track'}</td>
                        <td className="p-3.5 text-center font-bold text-emerald-400">{c.score}%</td>
                        <td className="p-3.5 text-right text-slate-400 text-[10px]">
                          {c.issue_date ? new Date(c.issue_date).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                    {certs.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-500 italic">No certificates issued yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: SYSTEM AUDIT LOGS */}
          {activeTab === 'system' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">System Audit & Security Trails</h3>
                  <p className="text-slate-400 text-xs">Full immutable telemetry of administrator modifications and candidate assessments.</p>
                </div>
                <span className="px-3 py-1 bg-emerald-950/60 border border-emerald-800 text-emerald-400 rounded-full text-[10px] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  System Healthy
                </span>
              </div>

              <div className="font-mono text-[11px] text-slate-400 bg-slate-950/90 p-5 rounded-xl border border-slate-850 max-h-[450px] overflow-y-auto space-y-2.5 leading-relaxed shadow-inner">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="border-b border-slate-900/80 pb-2">
                    <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                    <span className="text-indigo-400 font-semibold">({log.action})</span>{' '}
                    <span className="text-slate-300">{log.details || log.target}</span>{' '}
                    <span className="text-slate-600 text-[10px]">by {log.admin_email || 'Admin'}</span>
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
    </div>
  );
}
