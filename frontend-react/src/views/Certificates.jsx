import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Download, ExternalLink, Calendar, Mail, Award, CheckCircle, RefreshCw } from 'lucide-react';

export default function Certificates({ setActiveView }) {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getMyCertificates();
      setCerts(data.certificates || []);
    } catch (e) {
      setError(e.message || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    try {
      setClaiming(true);
      setError('');
      setSuccessMsg('');
      const res = await api.claimLatestCertificate();
      setSuccessMsg(res.message || 'Verified Certificate Issued Successfully!');
      await loadCertificates();
    } catch (e) {
      setError(e.message || 'Failed to issue certificate');
    } finally {
      setClaiming(false);
    }
  };

  const handleDownload = async (certId, filename) => {
    try {
      setDownloadingId(certId);
      setError('');
      await api.downloadCertificatePdf(certId, filename);
    } catch (e) {
      setError('Download failed: ' + (e.message || 'Server error'));
    } finally {
      setDownloadingId(null);
    }
  };

  const shareLinkedIn = (certId) => {
    const verifyUrl = `${window.location.origin}/verify-certificate/${certId}`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`;
    window.open(url, '_blank');
  };

  const shareEmail = (certId) => {
    const verifyUrl = `${window.location.origin}/verify-certificate/${certId}`;
    const subject = encodeURIComponent("AI Interview Assessment Certificate Earned!");
    const body = encodeURIComponent(`Hi there,\n\nI have successfully completed my AI Interview Trainer assessment and wanted to share my verified certificate of achievement!\n\nVerify certificate credentials here:\n${verifyUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white font-outfit">My Credentials</h2>
          <p className="text-slate-400 mt-1 text-sm">Access your verified credentials, download official PDF certificates, and share accomplishments with employers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadCertificates}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition"
            title="Refresh Certificates"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            disabled={claiming}
            onClick={handleClaim}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/25 disabled:opacity-50"
          >
            <Award className="w-4 h-4" />
            {claiming ? 'Generating Certificate...' : 'Claim / Issue Certificate'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {certs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-12 text-center max-w-xl mx-auto mt-10 space-y-4 shadow-xl">
          <span className="text-5xl block">📜</span>
          <h3 className="text-xl font-bold text-white font-outfit">No Certificates Earned Yet</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
            Complete either a standard placement assessment track (4 Rounds) or a resume-based AI interview with an overall score of 70% or higher to receive your verified certificate credentials.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button 
              disabled={claiming}
              onClick={handleClaim}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
            >
              {claiming ? 'Generating...' : 'Issue Verified Certificate'}
            </button>
            <button 
              onClick={() => setActiveView('rounds')}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25"
            >
              Start Assessment Round
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certs.map(c => {
            const dateStr = new Date(c.issue_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const isDownloading = downloadingId === c.id;

            return (
              <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl hover:border-indigo-500/50 transition-all">
                
                {/* Certificate Miniature Design */}
                <div className="relative w-full aspect-[1.414/1] bg-slate-950 border border-indigo-950 rounded-xl p-4 flex flex-col justify-between text-center overflow-hidden mb-5 select-none no-invert">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.04),transparent)]"></div>
                  <div className="text-[7px] font-bold text-indigo-400 uppercase tracking-widest">Trainer AI</div>
                  <div className="space-y-1">
                    <div className="text-[8px] font-serif text-amber-500 uppercase tracking-wider font-extrabold">Certificate of Completion</div>
                    <div className="text-[5px] text-slate-500">successfully validated performance in</div>
                    <div className="text-[8px] font-black text-slate-300 truncate px-2">{c.interview_type}</div>
                  </div>
                  <div className="flex justify-between items-center text-[5px] text-slate-500 border-t border-slate-800/80 pt-2 px-1">
                    <div className="truncate max-w-[50px]">{c.id}</div>
                    <div className="text-amber-500 font-bold">Score: {c.overall_score}%</div>
                    <div>{dateStr}</div>
                  </div>
                </div>

                {/* Information */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-900/60 rounded-full text-[9px] font-bold uppercase tracking-wider">
                        {c.interview_type}
                      </span>
                      <h4 className="font-extrabold text-white text-sm mt-3 font-mono truncate max-w-[150px]">{c.id}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-amber-400">{c.overall_score}%</p>
                      <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Overall Score</p>
                    </div>
                  </div>
                  
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 border-t border-slate-800 pt-3">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Issued: {dateStr}
                  </div>
                </div>

                {/* Share/Actions Grid */}
                <div className="grid grid-cols-2 gap-2 mt-5">
                  <button 
                    disabled={isDownloading}
                    onClick={() => handleDownload(c.id, c.pdf_filename)}
                    className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {isDownloading ? 'Downloading...' : 'Download PDF'}
                  </button>
                  <button 
                    onClick={() => window.open(`/verify-certificate/${c.id}`, '_blank')}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    Verify Badge
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => shareLinkedIn(c.id)}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750 font-semibold text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 text-blue-400 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    LinkedIn
                  </button>
                  <button 
                    onClick={() => shareEmail(c.id)}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750 font-semibold text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Email Share
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
