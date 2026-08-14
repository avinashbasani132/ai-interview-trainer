import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, ShieldAlert, Award, Sparkles, TrendingUp, Key, Calendar } from 'lucide-react';

export default function Profile() {
  const [data, setData] = useState(null);
  const [perfData, setPerfData] = useState({});
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const dash = await api.getDashboard();
      setData(dash);
      setUsernameInput(dash.email?.split('@')[0] || '');

      const perf = await api.getPerformanceAnalytics().catch(() => ({ success_rates: {} }));
      setPerfData(perf.success_rates || {});

      const certsList = await api.getMyCertificates().catch(() => ({ certificates: [] }));
      setCerts(certsList.certificates || []);
    } catch (e) {
      setError(e.message || 'Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUsername = () => {
    if (!usernameInput.trim()) {
      setUsernameStatus('Username cannot be empty');
      return;
    }
    setUsernameStatus('✅ Preferred username saved locally.');
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="loader"></div>
      </div>
    );
  }

  const email = data ? data.email || 'user@example.com' : 'user@example.com';
  const emailInitial = email[0].toUpperCase();
  const certsEarned = certs.length;
  const latestCert = certs.length > 0 ? certs[0].id : 'None';
  const highestScore = certs.length > 0 ? Math.max(...certs.map(c => c.overall_score)).toFixed(1) + '%' : 'N/A';

  const statsItems = [
    { label: 'Total Interviews', val: data.total_interviews || 0, icon: '📊' },
    { label: 'Rounds Cleared', val: data.rounds_cleared || 0, icon: '✅' },
    { label: 'Failed Attempts', val: data.failed_attempts || 0, icon: '❌' },
    { label: 'DSA Solved', val: data.ml_job_prediction?.dsa_solved ?? 0, icon: '💻' },
    { label: 'Current Streak', val: `${data.current_streak || 0} days`, icon: '🔥' },
    { label: 'Max Streak', val: `${data.max_streak || 0} days`, icon: '⭐' }
  ];

  const perfItems = [
    { label: 'Aptitude Test', val: perfData['Aptitude Test'] || 0, color: 'from-blue-500 to-blue-400', textColor: 'text-blue-400' },
    { label: 'Technical AI Round', val: perfData['Technical Round'] || 0, color: 'from-indigo-500 to-indigo-400', textColor: 'text-indigo-400' },
    { label: 'HR Conversational Round', val: perfData['HR Round'] || 0, color: 'from-purple-500 to-purple-400', textColor: 'text-purple-400' }
  ];

  const mlPred = data.ml_job_prediction || null;

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
          {emailInitial}
        </div>
        <div className="text-center md:text-left space-y-1">
          <h2 className="text-2xl font-bold text-white font-outfit">{email.split('@')[0]}</h2>
          <p className="text-slate-400 text-xs">{email}</p>
          <div className="flex items-center gap-2 justify-center md:justify-start pt-1.5">
            <span className="text-[10px] bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-full text-indigo-300 font-bold">
              {data.is_admin ? '🛡️ System Administrator' : 'Candidate Account'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsItems.map((item, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-1">
            <span className="text-sm block mb-1">{item.icon}</span>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{item.label}</p>
            <p className="text-base font-extrabold text-white">{item.val}</p>
          </div>
        ))}
      </div>

      {/* ML Job Readiness Prediction Section */}
      {mlPred && mlPred.prediction !== undefined && (
        <div className="bg-gradient-to-r from-indigo-950/30 to-blue-950/30 border border-indigo-500/20 rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            ML Job Readiness Prediction
          </h3>
          <div className="flex items-center gap-4 flex-wrap">
            <div className={`text-4xl font-black ${mlPred.prediction >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
              {mlPred.prediction?.toFixed(1)}%
            </div>
            <div>
              <p className="text-slate-200 font-extrabold text-sm">{mlPred.label || 'Needs Improvement'}</p>
              <p className="text-slate-400 text-xs mt-0.5 max-w-lg leading-relaxed">{mlPred.advice || 'Keep practicing to boost your score.'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Performance Breakdown */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Performance Breakdown
          </h3>
          <div className="space-y-4">
            {perfItems.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{item.label}</span>
                  <span className={`font-bold ${item.textColor}`}>{item.val?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-850 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${item.color}`} 
                    style={{ width: `${Math.min(100, item.val)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credentials and Badges */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            Credential Milestones
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850"><p className="text-[10px] text-slate-500 uppercase font-bold">Earned</p><p className="text-lg font-black text-white mt-1">{certsEarned}</p></div>
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850"><p className="text-[10px] text-slate-500 uppercase font-bold">Highest Score</p><p className="text-lg font-black text-amber-500 mt-1">{highestScore}</p></div>
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850"><p className="text-[10px] text-slate-500 uppercase font-bold">Latest ID</p><p className="text-xs font-bold text-slate-400 mt-2 truncate px-1" title={latestCert}>{latestCert !== 'None' ? latestCert : 'None'}</p></div>
          </div>

          {/* Badges list */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Achievements</h4>
            <div className="flex flex-wrap gap-2">
              {data.achievements && data.achievements.length > 0 ? (
                data.achievements.map((a, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-indigo-950/30 border border-indigo-700/20 px-3 py-1.5 rounded-xl text-xs text-indigo-300 font-semibold">
                    <span>🏆</span>
                    <span>{a}</span>
                  </div>
                ))
              ) : (
                <span className="text-slate-500 text-xs">Start assessments to unlock achievements.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Key className="w-5 h-5 text-indigo-400" />
          Account Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Email (Read Only)</label>
            <input 
              type="text" 
              value={email}
              disabled
              className="w-full bg-slate-950/40 border border-slate-800 text-slate-400 text-xs p-3 rounded-xl cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Preferred Display Name</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setUsernameStatus('');
                }}
                className="flex-1 bg-slate-950/60 border border-slate-800 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-indigo-500"
              />
              <button 
                onClick={handleSaveUsername}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 rounded-xl transition-colors"
              >
                Save
              </button>
            </div>
            {usernameStatus && <p className="text-[10px] text-slate-500 mt-1">{usernameStatus}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
