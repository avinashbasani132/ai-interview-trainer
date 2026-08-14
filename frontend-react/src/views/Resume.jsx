import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { 
  Upload, FileText, Download, Play, CheckCircle2, AlertTriangle, 
  ChevronRight, Brain, Sparkles, TrendingUp, HelpCircle 
} from 'lucide-react';

export default function Resume({ setActiveView, setResumeInterviewSessionId }) {
  const [history, setHistory] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getResumeHistory();
      setHistory(data.history || []);
    } catch (e) {
      console.error('Failed to load resume history:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      alert('Only PDF and DOCX files are supported.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    try {
      setUploading(true);
      setError('');
      setSelectedResult(null);

      const res = await api.uploadResume(formData);
      setSelectedResult(res);
      loadHistory();
    } catch (err) {
      setError(err.message || 'ATS Resume Analysis failed.');
    } finally {
      setUploading(false);
    }
  };

  const loadDetail = async (recordId) => {
    try {
      setLoading(true);
      setError('');
      const detail = await api.getResumeDetail(recordId);
      setSelectedResult(detail);
    } catch (err) {
      setError(err.message || 'Failed to load details.');
    } finally {
      setLoading(false);
    }
  };

  const startResumeBasedInterview = async (resumeId) => {
    try {
      setLoading(true);
      setError('');
      const session = await api.startResumeInterviewWithExisting(resumeId);
      if (session && session.session_id) {
        setResumeInterviewSessionId(session.session_id);
        setActiveView('rounds'); // switch view
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate resume-based interview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = (recordId, filename) => {
    const url = api.getResumeDownloadUrl(recordId);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATS_Report_${filename || 'resume'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white font-outfit">Resume ATS Analyzer</h2>
        <p className="text-slate-400 mt-1 text-sm">Upload your resume to get instant AI-powered ATS scores, suggestions, and mock interview setups.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Upload & History */}
        <div className="space-y-6 lg:col-span-1">
          {/* Upload Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl text-center space-y-4">
            <h3 className="text-base font-bold text-white">Upload Resume</h3>
            <p className="text-slate-400 text-xs">PDF or DOCX format (Max 10MB)</p>
            
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".pdf,.docx" 
              onChange={handleFileChange}
              className="hidden" 
            />

            <button 
              disabled={uploading}
              onClick={handleUploadClick}
              className="w-full py-4 border border-dashed border-indigo-500/50 rounded-xl hover:border-indigo-400 hover:bg-slate-800/40 transition-all flex flex-col items-center justify-center gap-2 group disabled:opacity-50"
            >
              <Upload className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-slate-300">
                {uploading ? 'Analyzing Resume...' : 'Select PDF or Word File'}
              </span>
            </button>

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl">
                {error}
              </div>
            )}
          </div>

          {/* History Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-base font-bold text-white mb-4">Past Analyses</h3>
            {loading && history.length === 0 ? (
              <div className="flex justify-center py-6"><div className="loader"></div></div>
            ) : history.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {history.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => loadDetail(item.id)}
                    className={`p-3 bg-slate-950/40 border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition-colors flex justify-between items-center ${selectedResult && selectedResult.id === item.id ? 'border-indigo-500/60 bg-indigo-950/10' : ''}`}
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="text-xs font-bold text-white truncate">{item.filename}</p>
                      <p className="text-[9px] text-slate-500 mt-1">v{item.resume_version} · Employability: {item.overall_employability}%</p>
                    </div>
                    <span className="text-xs font-black text-indigo-400 font-mono">{item.score}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs text-center py-6">No previous analysis found.</p>
            )}
          </div>
        </div>

        {/* Right Side: Active Analysis Results */}
        <div className="lg:col-span-2 space-y-6">
          {uploading ? (
            <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl text-center space-y-4">
              <div className="loader mx-auto"></div>
              <p className="text-slate-300 font-bold text-sm">Deep AI scanning active...</p>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">Gemini is checking section coverage, extracting hard and soft skills, verifying contact info, analyzing grammar syntax, and building your customized learning roadmap.</p>
            </div>
          ) : selectedResult ? (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-8 animate-fade-in">
              {/* Top Banner with Score */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                  {/* Circle progress bar */}
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" className="stroke-slate-800" strokeWidth="4" fill="transparent" />
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="28" 
                        className="stroke-indigo-500" 
                        strokeWidth="4" 
                        fill="transparent" 
                        strokeDasharray={175.9}
                        strokeDashoffset={175.9 - (175.9 * (selectedResult.ats_score || selectedResult.score || 0)) / 100}
                      />
                    </svg>
                    <span className="absolute text-sm font-black font-mono">{(selectedResult.ats_score || selectedResult.score || 0).toFixed(0)}%</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base truncate max-w-[250px]">{selectedResult.filename}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Experience Level: {selectedResult.experience_level || 'Not parsed'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => startResumeBasedInterview(selectedResult.id)}
                    className="flex-1 md:flex-none text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Start Interview
                  </button>
                  <button 
                    onClick={() => handleDownloadReport(selectedResult.id, selectedResult.filename)}
                    className="flex-1 md:flex-none text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <Download className="w-4 h-4" />
                    PDF Report
                  </button>
                </div>
              </div>

              {/* Sections & Contact Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Section coverage */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Section Coverage</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {selectedResult.sections && Object.keys(selectedResult.sections).slice(0, 8).map(key => (
                      <div key={key} className="flex items-center gap-1.5 text-slate-300">
                        {selectedResult.sections[key] ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        )}
                        <span className="capitalize">{key.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact info verification */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Contact Information</h4>
                  <div className="space-y-2 text-xs">
                    {selectedResult.contact_info && Object.keys(selectedResult.contact_info).slice(0, 4).map(key => (
                      <div key={key} className="flex justify-between items-center bg-slate-950/40 p-2 rounded-lg">
                        <span className="capitalize text-slate-500">{key}</span>
                        <span className="font-bold text-slate-200 text-[11px] truncate max-w-[150px]">
                          {selectedResult.contact_info[key] || 'Not Whitelisted'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-800 pt-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    Key Strengths
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside pl-1">
                    {selectedResult.strengths && selectedResult.strengths.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-4.5 h-4.5" />
                    Identified Gaps
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside pl-1">
                    {selectedResult.weaknesses && selectedResult.weaknesses.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Extracted Skills */}
              <div className="border-t border-slate-800 pt-6 space-y-3">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Detected Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedResult.extracted_skills && selectedResult.extracted_skills.map((skill, idx) => (
                    <span key={idx} className="text-[10px] font-semibold bg-slate-950/60 border border-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Learning Roadmap Preview */}
              {selectedResult.learning_roadmap && selectedResult.learning_roadmap.immediate_actions && (
                <div className="border-t border-slate-800 pt-6 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <Brain className="w-4.5 h-4.5" />
                    Immediate Recommendations
                  </h4>
                  <div className="space-y-2">
                    {selectedResult.learning_roadmap.immediate_actions.map((act, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-slate-950/30 p-2.5 rounded-lg text-xs text-slate-300">
                        <ChevronRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                        <p>{act}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl text-center">
              <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-50" />
              <h3 className="text-base font-bold text-slate-400 mb-2">No Active Resume Profile Selected</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">Select a previous analysis from the sidebar, or upload a new file to scan content coverage.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
