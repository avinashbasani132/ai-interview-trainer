import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Sparkles, Trophy, Award, ArrowRight, FileText, Briefcase, Play, Calendar, Download, Code } from 'lucide-react';


export default function Dashboard({ setActiveView, startStandardInterview }) {
  const [data, setData] = useState(null);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const dashData = await api.getDashboard();
      setData(dashData);

      // Async load certificates
      const certData = await api.getMyCertificates().catch(() => ({ certificates: [] }));
      setCerts((certData.certificates || []).slice(0, 2));
    } catch (e) {
      setError(e.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCert = (certId, filename) => {
    const downloadUrl = api.getCertificateDownloadUrl(certId);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename || 'Certificate.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="loader"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-20">
        <p className="text-red-400 font-semibold">{error}</p>
        <button onClick={loadDashboard} className="mt-4 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-sm">
          Retry
        </button>
      </div>
    );
  }

  const score = data.readiness_score ? data.readiness_score.toFixed(1) : '0';
  const currentRound = data.current_round || 1;
  const progressPercentage = Math.min(100, ((currentRound - 1) / 3) * 100).toFixed(0);
  const attemptsRemaining = data.attempts_remaining !== undefined ? data.attempts_remaining : 2;
  const weakTopics = data.weak_topics && data.weak_topics.length > 0 ? data.weak_topics.join(', ') : 'None identified yet';
  const streak = data.current_streak || 0;

  const roundLabels = ['', 'Aptitude MCQ', 'Technical AI', 'Coding Arena', 'HR Video'];
  const nextStepMessages = [
    '',
    'Complete the Aptitude round to unlock Technical.',
    'Pass Technical to unlock Coding Arena.',
    'Solve coding problems to unlock HR round.',
    'Complete the HR round to finish!'
  ];

  const scoreColorClass = parseFloat(score) >= 70 ? 'text-emerald-400' : parseFloat(score) >= 40 ? 'text-amber-400' : 'text-blue-400';
  const nextStepMessage = nextStepMessages[currentRound] || 'All rounds complete!';
  const roundLabel = roundLabels[currentRound] || 'Complete';

  return (
    <div className="w-full space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-heading text-white tracking-tight">Dashboard</h2>
          <p className="text-slate-400 mt-1 text-sm">{nextStepMessage}</p>
        </div>
        <div className="flex items-center gap-3 glass-panel px-5 py-3">
          <span className="text-2xl animate-pulse">🔥</span>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Current Streak</p>
            <p className="text-lg font-black text-amber-400">{streak} day{streak !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Readiness */}
        <div className="md:col-span-2 glass-panel p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-light" />
              Job Readiness Score
            </h3>
            <span className={`text-3xl font-black ${scoreColorClass} drop-shadow-sm`}>{score}%</span>
          </div>
          <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className="h-3 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 relative shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              style={{ width: `${score}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
            </div>
          </div>
          <div className="flex justify-between mt-3">
            <p className="text-xs text-slate-400 font-medium">Round {currentRound} of 4: {roundLabel}</p>
            <p className="text-xs text-slate-400 font-medium">Stage Progress: {progressPercentage}%</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="glass-panel p-6 flex flex-col justify-between gap-4">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Attempts Left</p>
            <p className={`text-2xl font-black ${attemptsRemaining > 0 ? 'text-white drop-shadow-sm' : 'text-red-400'}`}>{attemptsRemaining}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Weak Topics</p>
            <p className="text-xs font-semibold text-rose-300 truncate bg-rose-500/10 px-2 py-1 rounded-md inline-block max-w-full" title={weakTopics}>{weakTopics}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 font-heading">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Start next round */}
          <div 
            onClick={startStandardInterview}
            className="glass-panel glass-panel-hover p-6 cursor-pointer flex justify-between items-center group"
          >
            <div>
              <h3 className="text-sm font-bold text-blue-400 mb-1 group-hover:text-blue-300 flex items-center gap-1.5">
                <Play className="w-4 h-4 text-blue-500 fill-blue-500" />
                Start Next Round
              </h3>
              <p className="text-slate-400 text-[11px]">Continue standard {roundLabel}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
          </div>

          {/* Resume Upload */}
          <div 
            onClick={() => setActiveView('resume')}
            className="glass-panel glass-panel-hover p-6 cursor-pointer relative group flex justify-between items-center"
          >
            <div>
              <h3 className="text-sm font-bold text-purple-400 mb-1 group-hover:text-purple-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-500" />
                Resume Analysis
              </h3>
              <p className="text-slate-400 text-[11px]">Upload resume for ATS feedback</p>
            </div>
            <ArrowRight className="w-5 h-5 text-purple-500 group-hover:translate-x-1 transition-transform" />
          </div>

          {/* Resume Interview */}
          <div 
            onClick={() => setActiveView('rounds')}
            className="glass-panel glass-panel-hover p-6 cursor-pointer relative group flex justify-between items-center"
          >
            <div>
              <h3 className="text-sm font-bold text-primary-light mb-1 group-hover:text-primary flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-primary" />
                AI Prep Rounds
              </h3>
              <p className="text-slate-400 text-[11px]">Take tailored AI/MCQ/HR rounds</p>
            </div>
            <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
          </div>

          {/* Daily DSA */}
          {data.daily_dsa ? (
            <div 
              onClick={() => setActiveView('arena')}
              className="glass-panel glass-panel-hover p-6 cursor-pointer flex justify-between items-center group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-amber-400 group-hover:text-amber-300 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Daily DSA
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-amber-300 font-semibold">{data.daily_dsa.difficulty}</span>
                </div>
                <p className="text-slate-200 font-bold text-xs truncate max-w-[150px]">{data.daily_dsa.title}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
            </div>
          ) : (
            <div 
              onClick={() => setActiveView('arena')}
              className="glass-panel glass-panel-hover p-6 cursor-pointer flex justify-between items-center group"
            >
              <div>
                <h3 className="text-sm font-bold text-amber-400 mb-1 group-hover:text-amber-300 flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-amber-500" />
                  Coding Arena
                </h3>
                <p className="text-slate-400 text-[11px]">Solve DSA algorithm problems</p>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-heading">
          <Trophy className="w-5 h-5 text-primary-light" />
          Earned Badges
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.achievements && data.achievements.length > 0 ? (
            data.achievements.map((a, idx) => (
              <span key={idx} className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary-light text-xs rounded-full font-semibold shadow-sm">
                🏆 {a}
              </span>
            ))
          ) : (
            <span className="text-slate-500 text-xs">No badges earned yet. Complete standard rounds or resume interviews to unlock badges!</span>
          )}
        </div>
      </div>

      {/* Credentials */}
      <div className="glass-panel p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
            <Award className="w-5 h-5 text-accent" />
            Claimed Credentials
          </h3>
          <button 
            onClick={() => setActiveView('certificates')}
            className="text-[10px] text-accent hover:text-accent-hover font-bold uppercase tracking-wider flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certs.length > 0 ? (
            certs.map((c, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 hover:border-accent/30 hover:bg-white/10 transition-all rounded-xl p-4 flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-[10px] text-accent font-bold uppercase tracking-wide">{c.interview_type}</p>
                  <p className="font-bold text-white text-sm mt-1 tracking-tight">{c.id}</p>
                  <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                    <Calendar className="w-3 h-3" />
                    Issued: {new Date(c.issue_date).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-amber-400 font-black text-lg drop-shadow-sm">{c.overall_score}%</span>
                  <button 
                    onClick={() => handleDownloadCert(c.id, c.pdf_filename)}
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover text-white p-2.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5" 
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-6 text-center text-slate-500 text-xs bg-white/5 rounded-xl border border-white/5">
              No certificates claimed yet. Complete standard rounds or resume interviews with score &ge; 70% to claim.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
