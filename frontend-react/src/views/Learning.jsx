import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AlertTriangle, ExternalLink, RefreshCw, BookMarked } from 'lucide-react';

const RECOMMENDED_SUBJECTS = [
  { name: 'Python Mastery', category: 'Language', emoji: '🐍', url: 'https://docs.python.org/3/', isCore: false },
  { name: 'Java Full Course', category: 'Language', emoji: '☕', url: 'https://docs.oracle.com/javase/', isCore: false },
  { name: 'DSA with C++', category: 'Data Structures', emoji: '🌳', url: 'https://www.geeksforgeeks.org/data-structures/', isCore: true },
  { name: 'Operating Systems', category: 'Core CS', emoji: '💻', url: 'https://www.geeksforgeeks.org/operating-systems/', isCore: true },
  { name: 'DBMS', category: 'Core CS', emoji: '🗄️', url: 'https://www.geeksforgeeks.org/dbms/', isCore: true },
  { name: 'Computer Networks', category: 'Core CS', emoji: '🌐', url: 'https://www.geeksforgeeks.org/computer-network-tutorials/', isCore: true },
  { name: 'System Design', category: 'Advanced', emoji: '🏗️', url: 'https://github.com/donnemartin/system-design-primer', isCore: false },
  { name: 'LeetCode Practice', category: 'DSA', emoji: '⚡', url: 'https://leetcode.com/', isCore: false },
];

export default function Learning() {
  const [dashboardData, setDashboardData] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roadmapUpdating, setRoadmapUpdating] = useState({});

  useEffect(() => {
    loadLearningData();
  }, []);

  const loadLearningData = async () => {
    try {
      setLoading(true);
      setError('');
      const dash = await api.getDashboard();
      setDashboardData(dash);

      // Try loading personalized roadmap
      const road = await api.getRoadmap().catch(() => null);
      setRoadmap(road);
    } catch (e) {
      setError(e.message || 'Failed to load learning data');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteStep = async (stepId) => {
    setRoadmapUpdating(prev => ({ ...prev, [stepId]: true }));
    try {
      await api.completeRoadmapStep(stepId);
      // Reload roadmap data
      const updatedRoad = await api.getRoadmap().catch(() => null);
      setRoadmap(updatedRoad);
    } catch (err) {
      alert(err.message || 'Failed to complete roadmap step.');
    } finally {
      setRoadmapUpdating(prev => ({ ...prev, [stepId]: false }));
    }
  };


  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="loader"></div>
      </div>
    );
  }

  const score = dashboardData ? dashboardData.readiness_score : 0;
  const weakTopics = dashboardData ? dashboardData.weak_topics || [] : [];
  const needsHelp = score < 60;

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white font-outfit">Learning Center</h2>
          <p className="text-slate-400 mt-1 text-sm">Access curated tutorials and track your custom learning roadmap milestones.</p>
        </div>
        <button 
          onClick={loadLearningData}
          className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* 1. Personalized Roadmap Card */}
      {roadmap && roadmap.immediate_actions && roadmap.immediate_actions.length > 0 && (
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/20 p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-base font-bold text-indigo-300 flex items-center gap-2">
            <BookMarked className="w-5 h-5" />
            Your Custom Learning Roadmap
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            This roadmap was dynamically built by scanning your uploaded resume gaps and previous assessment scores. Mark items as complete once finished to update your profiles.
          </p>

          <div className="space-y-3 pt-2">
            {roadmap.immediate_actions.map((act, idx) => {
              const stepId = act.id || idx;
              const isDone = act.completed || false;
              const updating = roadmapUpdating[stepId];

              return (
                <div 
                  key={idx}
                  className={`flex items-start gap-3 p-3.5 bg-slate-950/40 border rounded-xl transition-all ${
                    isDone ? 'border-emerald-500/20 bg-emerald-950/5' : 'border-slate-800'
                  }`}
                >
                  <button
                    disabled={isDone || updating}
                    onClick={() => handleCompleteStep(stepId)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                      isDone 
                        ? 'bg-emerald-600 border-emerald-500 text-white' 
                        : 'border-slate-700 hover:border-indigo-500 text-transparent'
                    }`}
                  >
                    ✓
                  </button>
                  <div className="flex-1">
                    <p className={`text-xs ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {act.title || act}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Core Subjects Grid */}
      <div>
        <h3 className="text-base font-bold text-white mb-4">Curated Reference Libraries</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {RECOMMENDED_SUBJECTS.map((sub, idx) => {
            const isWeak = weakTopics.some(w => sub.name.toLowerCase().includes(w.toLowerCase()));
            const highlight = (needsHelp && sub.isCore) || isWeak;

            return (
              <div 
                key={idx}
                className={`bg-slate-900 border p-5 rounded-2xl transition-all flex flex-col justify-between ${
                  highlight 
                    ? 'border-red-500/40 shadow-lg shadow-red-500/5 bg-red-950/5' 
                    : 'border-slate-800 hover:border-indigo-500/50'
                }`}
              >
                <div className="space-y-4 mb-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{sub.emoji}</span>
                      <div>
                        <h4 className={`font-bold text-sm ${highlight ? 'text-red-300 font-extrabold' : 'text-slate-200'}`}>{sub.name}</h4>
                        <span className="text-[10px] text-slate-500 font-semibold">{sub.category}</span>
                      </div>
                    </div>
                    {highlight && (
                      <span className="text-[8px] bg-red-950 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full font-bold">Recommended</span>
                    )}
                  </div>
                  
                  {highlight ? (
                    <p className="text-[10px] text-red-400/85 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      Priority: performance indicator gap
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500">Practice core concepts & expand knowledge base</p>
                  )}
                </div>

                <a 
                  href={sub.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`w-full py-2.5 rounded-xl text-[11px] font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                    highlight 
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  Start Course
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
