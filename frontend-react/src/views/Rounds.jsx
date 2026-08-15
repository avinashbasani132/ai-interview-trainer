import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import Editor from '@monaco-editor/react';
import { 
  Trophy, BookOpen, Brain, Code, Play, ArrowRight, X, AlertTriangle, 
  CheckCircle2, Clock, Volume2, Shield, Calendar, Film, Video, Star, Building2 
} from 'lucide-react';

const STARTER_CODES = {
  python: 'def solve(nums, target):\n    # Write your Python solution here\n    pass\n',
  javascript: 'function solve(nums, target) {\n    // Write your JavaScript solution here\n    return [];\n}\n'
};

const ROUNDS_METADATA = [
  {
    num: 1, name: 'Aptitude MCQ', emoji: '🧠',
    desc: '25 multiple-choice questions covering logical reasoning, quantitative aptitude, and basic CS. 30-minute timer. Must score ≥ 60% to proceed.',
    color: 'blue', duration: '30 min', questions: '25 MCQ', passMark: '60%'
  },
  {
    num: 2, name: 'Technical AI Interview', emoji: '⚙️',
    desc: '5-question dynamic AI conversation powered by Gemini. Follow-up questions adapt based on your answers. Must score ≥ 70% to proceed.',
    color: 'indigo', duration: '15–20 min', questions: '5 AI Questions', passMark: '70%'
  },
  {
    num: 3, name: 'Coding Arena', emoji: '💻',
    desc: 'Solve a DSA problem with a live Monaco code editor. Run your code in real-time. Multiple languages supported.',
    color: 'purple', duration: '30 min', questions: '1 Problem', passMark: '70%'
  },
  {
    num: 4, name: 'HR Video Round', emoji: '🎥',
    desc: 'Record a video answer to a behavioural interview question. Gemini AI transcribes and evaluates your communication.',
    color: 'rose', duration: '10 min', questions: '1 Video Question', passMark: '70%'
  },
];

export default function Rounds({ sessionId, setSessionId }) {
  const [activeSubView, setActiveSubView] = useState('hub');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Dashboard state (to find current round)
  const [currentRound, setCurrentRound] = useState(1);

  // Aptitude state
  const [aptQuestions, setAptQuestions] = useState([]);
  const [aptAnswers, setAptAnswers] = useState({});
  const [aptActiveIdx, setAptActiveIdx] = useState(0);
  const [aptTimer, setAptTimer] = useState(1800); // 30 mins
  
  // Tech AI state
  const [techMessages, setTechMessages] = useState([]);
  const [techInput, setTechInput] = useState('');
  const [techQuestionCount, setTechQuestionCount] = useState(0);
  const [techContext, setTechContext] = useState([]);
  const [techFinished, setTechFinished] = useState(false);
  const [techEvalScore, setTechEvalScore] = useState(null);
  const [techFeedback, setTechFeedback] = useState('');

  // Coding state
  const [codeLanguage, setCodeLanguage] = useState('python');
  const [codeValue, setCodeValue] = useState(STARTER_CODES.python);
  const [codeProblem, setCodeProblem] = useState(null);
  const [codeOutput, setCodeOutput] = useState('Output appears here...');
  const [codeOutputColor, setCodeOutputColor] = useState('text-green-400');
  const [codeEvalResult, setCodeEvalResult] = useState(null);

  // HR state
  const [hrVideoFile, setHrVideoFile] = useState(null);
  const [hrEvaluation, setHrEvaluation] = useState(null);
  const [hrRecording, setHrRecording] = useState(false);
  
  // Company hub state
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companySession, setCompanySession] = useState(null);
  const [companyQuestions, setCompanyQuestions] = useState([]);
  const [companyAnswers, setCompanyAnswers] = useState({});
  const [companyActiveIdx, setCompanyActiveIdx] = useState(0);
  const [companyTimer, setCompanyTimer] = useState(900); // 15 mins
  const [companyFinished, setCompanyFinished] = useState(false);
  const [companySummary, setCompanySummary] = useState(null);

  // Resume-Based track state
  const [existingResumes, setExistingResumes] = useState([]);
  const [resumeSession, setResumeSession] = useState(null);
  const [resumePlan, setResumePlan] = useState([]);
  const [resumeActiveQIdx, setResumeActiveQIdx] = useState(0);
  const [resumeAnswerText, setResumeAnswerText] = useState('');
  const [resumeMessages, setResumeMessages] = useState([]);
  const [resumeHint, setResumeHint] = useState('');
  const [resumeFinished, setResumeFinished] = useState(false);
  const [resumeReport, setResumeReport] = useState(null);

  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    loadRoundsState();
    return () => clearInterval(timerRef.current);
  }, []);

  const loadRoundsState = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getDashboard();
      setCurrentRound(data.current_round || 1);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to load user status');
    } finally {
      setLoading(false);
    }
  };

  const startGeneralTrack = async () => {
    setError('');
    try {
      setLoading(true);
      const res = await api.startInterview();
      setSessionId(res.session_id);
      
      if (res.round === 1) {
        startAptitudeQuiz(res.session_id);
      } else {
        startAdaptiveRound(res.round, res.session_id);
      }
    } catch (err) {
      setError(err.message || 'Failed to start interview.');
      setLoading(false);
    }
  };

  const startAptitudeQuiz = async (sessId) => {
    try {
      const data = await api.startAptitude();
      setAptQuestions(data.questions || []);
      setAptAnswers({});
      setAptActiveIdx(0);
      setAptTimer(1800);
      setActiveSubView('aptitude-quiz');
      setLoading(false);

      // Start timer countdown
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setAptTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            submitAptitudeAnswers(sessId, {});
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      setError(err.message || 'Failed to start Aptitude round');
      setActiveSubView('hub');
      setLoading(false);
    }
  };

  const submitAptitudeAnswers = async (sessId, answersToSubmit = aptAnswers) => {
    clearInterval(timerRef.current);
    try {
      setLoading(true);
      const res = await api.submitAptitude(sessId || sessionId, answersToSubmit);
      alert(`Aptitude round completed. Score: ${res.score}%. Status: ${res.status}`);
      loadRoundsState();
      setActiveSubView('general-stepper');
    } catch (err) {
      setError(err.message || 'Error submitting aptitude answers');
    } finally {
      setLoading(false);
    }
  };

  const startAdaptiveRound = async (round, sessId) => {
    if (round === 2) {
      setLoading(true);
      try {
        const res = await api.sendChatMessage('Start technical AI round', { resume_name: 'CS Core' }).catch(() => ({ response: 'Explain what an OS scheduler does.' }));
        const firstQuestionText = res.response;
        setTechMessages([{ role: 'assistant', content: firstQuestionText }]);
        setTechQuestionCount(1);
        setTechContext([{ role: 'assistant', content: firstQuestionText }]);
        setTechFinished(false);
        setTechEvalScore(null);
        setTechFeedback('');
        setTechInput('');
        setActiveSubView('tech-ai');
      } catch (err) {
        setError(err.message || 'Error starting Tech AI');
      } finally {
        setLoading(false);
      }
    } else if (round === 3) {
      setLoading(true);
      try {
        const prob = await api.getDailyDSA();
        setCodeProblem(prob);
        setCodeLanguage('python');
        setCodeValue(STARTER_CODES.python);
        setCodeOutput('Output appears here...');
        setCodeOutputColor('text-green-400');
        setCodeEvalResult(null);
        setActiveSubView('coding-arena');
      } catch (err) {
        setError(err.message || 'Error loading coding problem');
      } finally {
        setLoading(false);
      }
    } else if (round === 4) {
      setHrVideoFile(null);
      setHrEvaluation(null);
      setActiveSubView('hr-video');
    }
  };

  // Tech AI submit
  const submitTechAnswer = async () => {
    if (!techInput.trim()) return;
    const answer = techInput.trim();
    
    setTechMessages(prev => [...prev, { role: 'user', content: answer }]);
    setTechInput('');
    setLoading(true);

    try {
      const qCount = techQuestionCount + 1;
      setTechQuestionCount(qCount);
      const context = [...techContext, { role: 'user', content: answer }];
      setTechContext(context);

      const res = await api.chatInterview(sessionId, techMessages[techMessages.length - 1].content, answer, context, qCount);
      
      const eval_ = res.evaluation || {};
      setTechMessages(prev => [...prev, { role: 'feedback', content: `Score: ${eval_.score}/100. Feedback: ${eval_.feedback}` }]);

      if (res.is_complete || qCount >= 5) {
        setTechFinished(true);
        setTechEvalScore(eval_.score);
        setTechFeedback(eval_.recommendation || 'Interview completed.');
      } else {
        const nextQ = res.next_question || 'Can you explain that further?';
        setTechMessages(prev => [...prev, { role: 'assistant', content: nextQ }]);
        setTechContext(prev => [...prev, { role: 'assistant', content: nextQ }]);
      }
    } catch (err) {
      setError(err.message || 'Failed evaluating answer');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishTechRound = () => {
    loadRoundsState();
    setActiveSubView('general-stepper');
  };

  // Coding actions
  const runCode = async () => {
    setCodeOutput('⏳ Running code test cases...');
    setCodeOutputColor('text-amber-400');
    try {
      const res = await api.submitDSASolution(codeProblem ? codeProblem.id : '1', codeValue);
      setCodeOutput(res.output || 'Solution verified successfully.');
      setCodeOutputColor('text-emerald-400');
    } catch (err) {
      setCodeOutput(`Execution error: ${err.message}`);
      setCodeOutputColor('text-red-400');
    }
  };

  const submitCodeSolution = async () => {
    setLoading(true);
    try {
      const res = await api.evaluateRound(sessionId, 'Coding DSA Solution', codeValue);
      setCodeEvalResult(res.evaluation);
    } catch (err) {
      setError(err.message || 'Failed evaluating code');
    } finally {
      setLoading(false);
    }
  };

  // HR Video actions
  const submitHrVideo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(file);
  };

  const setUploadingFile = async (file) => {
    setHrVideoFile(file);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('session_id', sessionId);

    setLoading(true);
    try {
      const res = await api.uploadHrVideo(formData);
      setHrEvaluation(res.evaluation);
      alert(`HR round evaluated! Score: ${res.evaluation.score}%`);
    } catch (err) {
      setError(err.message || 'Failed to upload and evaluate video');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang) => {
    setCodeLanguage(lang);
    setCodeValue(STARTER_CODES[lang] || '');
  };

  // Browse Companies
  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await api.getCompanies();
      setCompanies(data.companies || []);
      setActiveSubView('company-hub');
    } catch (err) {
      setError(err.message || 'Failed to load companies.');
    } finally {
      setLoading(false);
    }
  };

  const startCompanyAssess = async (companyId) => {
    try {
      setLoading(true);
      const res = await api.startCompanyInterview(companyId, 'Software Engineer', 'Medium');
      setCompanySession(res);
      loadCompanyQuestions(res.session_id, res.round);
    } catch (err) {
      setError(err.message || 'Failed to start company interview');
      setLoading(false);
    }
  };

  const loadCompanyQuestions = async (sessId, round) => {
    try {
      const data = await api.getCompanyRoundQuestions(sessId, round);
      setCompanyQuestions(data.questions || []);
      setCompanyAnswers({});
      setCompanyActiveIdx(0);
      setCompanyTimer(900);
      setActiveSubView('company-run');
    } catch (err) {
      setError(err.message || 'Failed to load round questions');
    }
  };

  // Resume prep setups
  const loadResumeSessions = async () => {
    try {
      setLoading(true);
      const data = await api.getResumeHistory();
      setExistingResumes(data.history || []);
      setActiveSubView('resume-setup');
    } catch (err) {
      setError(err.message || 'Failed to load resume history');
    } finally {
      setLoading(false);
    }
  };

  const initiateResumeInterview = async (resumeId) => {
    try {
      setLoading(true);
      const sess = await api.startResumeInterviewWithExisting(resumeId);
      setResumeSession(sess);
      setResumePlan(sess.plan || []);
      setResumeActiveQIdx(0);
      setResumeAnswerText('');
      setResumeMessages([{ role: 'assistant', content: sess.first_question }]);
      setResumeFinished(false);
      setActiveSubView('resume-run');
    } catch (err) {
      setError(err.message || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const submitResumeAnswer = async () => {
    if (!resumeAnswerText.trim()) return;
    const answer = resumeAnswerText.trim();
    setResumeMessages(prev => [...prev, { role: 'user', content: answer }]);
    setResumeAnswerText('');
    setLoading(true);

    try {
      const res = await api.submitResumeInterviewAnswer(resumeSession.session_id, answer);
      const eval_ = res.evaluation || {};
      
      setResumeMessages(prev => [...prev, { role: 'feedback', content: `Score: ${eval_.score}/100. Feedback: ${eval_.feedback}` }]);

      if (res.is_complete) {
        // Complete the session
        const report = await api.completeResumeInterview(resumeSession.session_id, 300);
        setResumeFinished(true);
        setResumeReport(report);
      } else {
        const nextQ = res.next_question || 'Next question';
        setResumeMessages(prev => [...prev, { role: 'assistant', content: nextQ }]);
        setResumeActiveQIdx(res.current_question_idx || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed processing answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* 1. HUB VIEW */}
      {activeSubView === 'hub' && (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in">
          <div className="border-b border-slate-800 pb-6">
            <h1 className="text-3xl font-extrabold text-white font-outfit">AI Interview Hub</h1>
            <p className="text-slate-400 mt-1 text-sm">Choose your practice pathway and simulate actual industry hiring assessments.</p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs flex justify-between items-center animate-fade-in">
              <span>⚠️ {error}</span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 font-bold ml-2">Dismiss</button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* General interview card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-blue-500/50 p-6 rounded-2xl flex flex-col justify-between transition-all group hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">🧠</div>
                <h3 className="text-lg font-bold text-white mb-2">1. General Interview Track</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6">Complete standard MCQ screening, AI questions, DSA coding and HR video assessments.</p>
              </div>
              <button 
                onClick={() => setActiveSubView('general-stepper')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Enter Standard Track
              </button>
            </div>

            {/* Resume-based interview card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl flex flex-col justify-between transition-all group hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">📄</div>
                <h3 className="text-lg font-bold text-white mb-2">2. Resume Interview</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6">Generate fully customized AI interview questions matching your own project experience.</p>
              </div>
              <button 
                onClick={loadResumeSessions}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Configure Interview
              </button>
            </div>

            {/* Company placement interview card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-purple-500/50 p-6 rounded-2xl flex flex-col justify-between transition-all group hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">🏢</div>
                <h3 className="text-lg font-bold text-white mb-2">3. Company Interviews</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6">Select from 32 top companies and practice their structured 5-round hiring assessments.</p>
              </div>
              <button 
                onClick={loadCompanies}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Browse Company Placement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. GENERAL STEPPER VIEW */}
      {activeSubView === 'general-stepper' && (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-white font-outfit">Standard Placement Track</h2>
              <p className="text-slate-400 text-xs mt-1">Simulate standard recruitment rounds and pass to progress your Readiness Score.</p>
            </div>
            <button 
              onClick={() => setActiveSubView('hub')}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs transition-colors flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Quit Track
            </button>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs flex justify-between items-center animate-fade-in">
              <span>⚠️ {error}</span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 font-bold ml-2">Dismiss</button>
            </div>
          )}

          {/* Progress Tracker */}
          <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-xl flex items-center justify-between overflow-x-auto gap-4">
            {ROUNDS_METADATA.map((r, i) => {
              const status = r.num < currentRound ? 'cleared' : r.num === currentRound ? 'active' : 'locked';
              const circleColor = status === 'cleared' ? 'bg-green-500 text-white' : status === 'active' ? 'bg-indigo-600 ring-4 ring-indigo-500/20 text-white font-bold' : 'bg-slate-800 text-slate-500';
              const lineColor = r.num < currentRound ? 'bg-green-500' : 'bg-slate-800';

              return (
                <div key={r.num} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5 min-w-[70px]">
                    <div className={`w-9 h-9 rounded-full ${circleColor} flex items-center justify-center text-xs font-bold transition-all`}>
                      {status === 'cleared' ? '✓' : r.num}
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight text-center">{r.name.split(' ')[0]}</span>
                  </div>
                  {i < ROUNDS_METADATA.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${lineColor} transition-all`}></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ROUNDS_METADATA.map(r => {
              const status = r.num < currentRound ? 'cleared' : r.num === currentRound ? 'active' : 'locked';
              const statusBadge = {
                cleared: <span className="px-2 py-0.5 bg-green-950/60 border border-green-800 text-green-400 text-[10px] rounded-full font-bold">✓ Cleared</span>,
                active: <span className="px-2 py-0.5 bg-blue-950/60 border border-blue-800 text-blue-300 text-[10px] rounded-full font-bold animate-pulse">▶ Current</span>,
                locked: <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-500 text-[10px] rounded-full font-bold">🔒 Locked</span>
              }[status];

              const borderColor = status === 'active' ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/5' : 'border-slate-800';

              return (
                <div key={r.num} className={`bg-slate-900 border ${borderColor} p-6 rounded-2xl flex flex-col justify-between`}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{r.emoji}</span>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Round {r.num}</p>
                          <h4 className="font-bold text-white text-base">{r.name}</h4>
                        </div>
                      </div>
                      {statusBadge}
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{r.desc}</p>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="bg-slate-950/40 p-2 rounded-lg"><span className="text-slate-500 block mb-0.5">Duration</span><span className="font-bold text-slate-300">{r.duration}</span></div>
                      <div className="bg-slate-950/40 p-2 rounded-lg"><span className="text-slate-500 block mb-0.5">Format</span><span className="font-bold text-slate-300">{r.questions}</span></div>
                      <div className="bg-slate-950/40 p-2 rounded-lg"><span className="text-slate-500 block mb-0.5">Min Pass</span><span className="font-bold text-slate-300">{r.passMark}</span></div>
                    </div>

                    {status === 'active' && (
                      <button 
                        onClick={startGeneralTrack}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20"
                      >
                        Start Assessment
                      </button>
                    )}
                    {status === 'cleared' && (
                      <button 
                        onClick={startGeneralTrack}
                        className="w-full py-3 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
                      >
                        Re-evaluate Round
                      </button>
                    )}
                    {status === 'locked' && (
                      <button disabled className="w-full py-3 bg-slate-800 border border-slate-700 text-slate-600 text-xs rounded-xl cursor-not-allowed">
                        Locked (Pass Round {r.num - 1} first)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. APTITUDE ROUND INTERACTIVE VIEW */}
      {activeSubView === 'aptitude-quiz' && (
        <div className="w-full max-w-3xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Round 1 Assessment</span>
              <h3 className="text-xl font-bold text-white mt-1">Aptitude & Logical MCQ</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">{Object.keys(aptAnswers).length} of {aptQuestions.length} answered</span>
              <span className="text-xs font-mono bg-red-950/60 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {Math.floor(aptTimer / 60)}:{(aptTimer % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {aptQuestions.length > 0 && (
            <div className="space-y-6">
              {/* Question card */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-indigo-300 rounded-full font-bold border border-slate-700">{aptQuestions[aptActiveIdx].topic}</span>
                <p className="text-slate-100 font-semibold text-sm leading-relaxed mt-3">{aptQuestions[aptActiveIdx].text}</p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map(letter => {
                  const optText = aptQuestions[aptActiveIdx].options[letter];
                  if (!optText) return null;
                  const isChecked = aptAnswers[aptQuestions[aptActiveIdx].id] === letter;

                  return (
                    <label 
                      key={letter}
                      className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                        isChecked ? 'bg-indigo-950/20 border-indigo-500 text-indigo-200' : 'bg-slate-950/20 border-slate-800 hover:border-indigo-500/50 text-slate-300'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="apt-option" 
                        value={letter} 
                        checked={isChecked} 
                        className="hidden"
                        onChange={() => setAptAnswers(prev => ({ ...prev, [aptQuestions[aptActiveIdx].id]: letter }))}
                      />
                      <span className={`w-6 h-6 rounded-md border flex items-center justify-center text-[10px] font-bold ${
                        isChecked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-slate-500'
                      }`}>{letter}</span>
                      <span className="text-xs">{optText}</span>
                    </label>
                  );
                })}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <button 
                  disabled={aptActiveIdx === 0}
                  onClick={() => setAptActiveIdx(prev => prev - 1)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-lg text-xs disabled:opacity-40"
                >
                  Previous
                </button>
                
                {aptActiveIdx < aptQuestions.length - 1 ? (
                  <button 
                    onClick={() => setAptActiveIdx(prev => prev + 1)}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                  >
                    Next
                  </button>
                ) : (
                  <button 
                    onClick={() => submitAptitudeAnswers(sessionId, aptAnswers)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-xs"
                  >
                    Submit Answers
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TECH AI INTERACTIVE CHAT */}
      {activeSubView === 'tech-ai' && (
        <div className="w-full max-w-3xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 flex flex-col h-[520px]">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4 flex-shrink-0">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Round 2 Assessment</span>
              <h3 className="text-xl font-bold text-white mt-1">Adaptive AI Technical Interview</h3>
            </div>
            <span className="text-xs bg-indigo-950/60 border border-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-semibold">
              Question {techQuestionCount}/5
            </span>
          </div>

          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none">
            {techMessages.map((m, idx) => {
              if (m.role === 'feedback') {
                return (
                  <div key={idx} className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl mx-4 text-xs">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Evaluation feedback</span>
                    <p className="text-slate-300 leading-relaxed">{m.content}</p>
                  </div>
                );
              }

              return (
                <div key={idx} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role !== 'user' && (
                    <div className="w-7 h-7 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-xs text-indigo-400 font-bold flex-shrink-0">AI</div>
                  )}
                  <div className={`max-w-[80%] px-3.5 py-2.5 text-xs leading-normal ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none'
                      : 'bg-slate-950/50 border border-slate-800 rounded-2xl rounded-tl-none text-slate-300'
                  }`}>
                    {m.content}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-xs text-indigo-400 font-bold flex-shrink-0">AI</div>
                <div className="px-3 py-2 rounded-2xl rounded-tl-none bg-slate-950/50 border border-slate-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
          </div>

          {/* Tech Evaluation Summary */}
          {techFinished && (
            <div className="p-4 bg-indigo-950/30 border border-indigo-700/30 rounded-xl space-y-3 flex-shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-300">Round Completed! Overall Score:</span>
                <span className="text-lg font-black text-amber-400">{techEvalScore}%</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">{techFeedback}</p>
              <button 
                onClick={handleFinishTechRound}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl"
              >
                Close & Proceed
              </button>
            </div>
          )}

          {/* Answer Box */}
          {!techFinished && (
            <div className="p-3 border-t border-slate-800 flex-shrink-0 bg-slate-950/40 rounded-xl flex items-end gap-2">
              <textarea 
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submitTechAnswer())}
                placeholder="Write your technical explanation here..."
                rows="3"
                className="flex-1 bg-transparent text-white text-xs resize-none focus:outline-none placeholder-slate-500 leading-normal"
              />
              <button
                onClick={submitTechAnswer}
                disabled={loading || !techInput.trim()}
                className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/30 disabled:opacity-40"
              >
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. CODING ARENA ASSESSMENT */}
      {activeSubView === 'coding-arena' && codeProblem && (
        <div className="w-full space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Round 3 Assessment</span>
              <h2 className="text-xl font-bold text-white mt-1">DSA Coding Arena</h2>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={codeLanguage} 
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
              </select>
              <button 
                onClick={runCode}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-xs"
              >
                Run Code
              </button>
              <button 
                onClick={submitCodeSolution}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
              >
                Submit Code
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Problem details */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">{codeProblem.title}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300 font-bold">{codeProblem.difficulty}</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{codeProblem.description}</p>
              
              {codeProblem.example_input && (
                <div className="bg-slate-950/40 p-4 rounded-xl font-mono text-xs border border-slate-800 space-y-1.5">
                  <p className="text-slate-500">Input: <span className="text-slate-200">{codeProblem.example_input}</span></p>
                  <p className="text-slate-500">Output: <span className="text-slate-200">{codeProblem.example_output}</span></p>
                </div>
              )}

              {/* Evaluation Results Card */}
              {codeEvalResult && (
                <div className="p-4 bg-indigo-950/20 border border-indigo-700/30 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-300">Code Score:</span>
                    <span className="text-sm font-black text-amber-400">{codeEvalResult.score}/100</span>
                  </div>
                  <p className="text-slate-400 text-[10px] leading-relaxed">{codeEvalResult.feedback}</p>
                  <button 
                    onClick={() => {
                      loadRoundsState();
                      setActiveSubView('general-stepper');
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg"
                  >
                    Finish Round
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Code Editor & Output */}
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden border border-slate-800 h-[260px]">
                <Editor 
                  height="260px"
                  language={codeLanguage}
                  value={codeValue}
                  theme="vs-dark"
                  onChange={(val) => setCodeValue(val)}
                  options={{
                    fontSize: 12,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true
                  }}
                />
              </div>

              {/* Output terminal */}
              <div className={`bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-xs ${codeOutputColor} min-h-[80px] whitespace-pre-wrap`}>
                {codeOutput}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. HR VIDEO ASSESSMENT */}
      {activeSubView === 'hr-video' && (
        <div className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 animate-fade-in">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Round 4 Assessment</span>
            <h3 className="text-xl font-bold text-white mt-1">HR & Communication Video Round</h3>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-2xl">🗣️</span>
            <p className="text-slate-200 font-bold text-sm leading-relaxed mt-2">
              "Please record a short video answering: How do you handle conflict in a team?"
            </p>
          </div>

          {/* Capture controls */}
          <div className="flex flex-col items-center gap-4 py-6 border border-slate-800 rounded-xl bg-slate-900/40">
            <Video className="w-12 h-12 text-rose-500 opacity-60" />
            <p className="text-slate-400 text-xs text-center max-w-xs">Record or select your video answer. Gemini AI will evaluate your speech delivery, vocabulary, and communication clarity.</p>
            
            <input 
              ref={fileInputRef}
              type="file" 
              accept="video/*,audio/*"
              onChange={submitHrVideo}
              className="hidden" 
            />

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs flex items-center gap-2"
            >
              <Film className="w-4 h-4" />
              Upload Recorded Answer
            </button>
          </div>

          {/* HR results evaluation */}
          {hrEvaluation && (
            <div className="p-4 bg-indigo-950/20 border border-indigo-700/30 rounded-xl space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-indigo-300">Communication Score:</span>
                <span className="font-black text-amber-400 text-sm">{hrEvaluation.score}/100</span>
              </div>
              <p className="text-slate-400 leading-relaxed">{hrEvaluation.feedback}</p>
              <button 
                onClick={() => {
                  loadRoundsState();
                  setActiveSubView('hub');
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
              >
                Complete Interview Track
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. COMPANY HUB VIEW */}
      {activeSubView === 'company-hub' && (
        <div className="w-full space-y-8 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-white font-outfit">Company Assessment Hub</h2>
              <p className="text-slate-400 text-xs mt-1">Practice realistic mock interviews aligned with standard corporate patterns.</p>
            </div>
            <button 
              onClick={() => setActiveSubView('hub')}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs transition-colors"
            >
              Back to Hub
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {companies.map(c => (
              <div key={c.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between hover:border-indigo-500/50 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-850 flex items-center justify-center overflow-hidden">
                      <Building2 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{c.name}</h4>
                      <p className="text-[10px] text-slate-500">{c.category}</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">{c.description}</p>
                </div>
                <div className="mt-5 space-y-3">
                  <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-3">
                    <span>Round difficulty</span>
                    <span className="font-bold text-slate-300">{c.difficulty}</span>
                  </div>
                  <button 
                    onClick={() => startCompanyAssess(c.id)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors"
                  >
                    Start Assessments
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. RESUME INTERVIEW SETUP */}
      {activeSubView === 'resume-setup' && (
        <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white">Start Resume-Based Interview</h3>
            <button onClick={() => setActiveSubView('hub')} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4">
            <p className="text-slate-400 text-xs leading-relaxed">Choose one of your previously parsed resumes to load as the interview profile template.</p>
            {existingResumes.length > 0 ? (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {existingResumes.map(r => (
                  <div key={r.id} className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl hover:border-indigo-500/50 flex justify-between items-center transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-200">{r.filename}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Analyzed on {new Date(r.date).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => initiateResumeInterview(r.id)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg"
                    >
                      Use Profile
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">
                No analyzed resumes found. Please go to the Resume tab and upload a file first.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. RESUME RUNNING INTERVIEW */}
      {activeSubView === 'resume-run' && (
        <div className="w-full max-w-3xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 flex flex-col h-[520px]">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4 flex-shrink-0">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Resume Assessment Session</span>
              <h3 className="text-base font-bold text-white mt-1">Turn {resumeActiveQIdx + 1} of 5</h3>
            </div>
            <span className="text-[10px] bg-slate-850 border border-slate-800 px-3 py-1 rounded-full text-indigo-300 font-bold">
              Level: {resumeSession?.difficulty || 'Medium'}
            </span>
          </div>

          {/* Messages container */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none">
            {resumeMessages.map((m, idx) => {
              if (m.role === 'feedback') {
                return (
                  <div key={idx} className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl mx-4 text-xs">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Answer Assessment</span>
                    <p className="text-slate-300 leading-relaxed">{m.content}</p>
                  </div>
                );
              }

              return (
                <div key={idx} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role !== 'user' && (
                    <div className="w-7 h-7 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-xs text-indigo-400 font-bold flex-shrink-0">AI</div>
                  )}
                  <div className={`max-w-[80%] px-3.5 py-2.5 text-xs leading-normal ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none'
                      : 'bg-slate-950/50 border border-slate-800 rounded-2xl rounded-tl-none text-slate-300'
                  }`}>
                    {m.content}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-xs text-indigo-400 font-bold flex-shrink-0">AI</div>
                <div className="px-3 py-2 rounded-2xl rounded-tl-none bg-slate-950/50 border border-slate-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
          </div>

          {/* Finished results display */}
          {resumeFinished && resumeReport && (
            <div className="p-4 bg-indigo-950/30 border border-indigo-700/30 rounded-xl space-y-3 flex-shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-300">Resume assessment complete! Overall Score:</span>
                <span className="text-lg font-black text-amber-400">{resumeReport.overall_score?.toFixed(1)}%</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed">Your performance report has been compiled. Head back to Dashboard to inspect detailed scores.</p>
              <button 
                onClick={() => {
                  loadRoundsState();
                  setActiveSubView('hub');
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg"
              >
                Close Session
              </button>
            </div>
          )}

          {/* Inputs */}
          {!resumeFinished && (
            <div className="p-3 border-t border-slate-800 flex-shrink-0 bg-slate-950/40 rounded-xl flex items-end gap-2 animate-fade-in">
              <textarea 
                value={resumeAnswerText}
                onChange={(e) => setResumeAnswerText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submitResumeAnswer())}
                placeholder="Formulate your experience-based explanation..."
                rows="2"
                className="flex-1 bg-transparent text-white text-xs resize-none focus:outline-none placeholder-slate-500 leading-normal"
              />
              <button
                onClick={submitResumeAnswer}
                disabled={loading || !resumeAnswerText.trim()}
                className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/30 disabled:opacity-40"
              >
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
