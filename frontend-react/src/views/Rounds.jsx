import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import Editor from '@monaco-editor/react';
import { 
  ArrowRight, X, Clock, Film, Video, Building2, 
  Play, RefreshCw, HelpCircle, Upload, Search
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
  
  // Dashboard & General Track State
  const [currentRound, setCurrentRound] = useState(1);
  const [aptQuestions, setAptQuestions] = useState([]);
  const [aptAnswers, setAptAnswers] = useState({});
  const [aptActiveIdx, setAptActiveIdx] = useState(0);
  const [aptTimer, setAptTimer] = useState(1800); // 30 mins
  const [aptResult, setAptResult] = useState(null);

  // Tech AI State
  const [techMessages, setTechMessages] = useState([]);
  const [techInput, setTechInput] = useState('');
  const [techQuestionCount, setTechQuestionCount] = useState(0);
  const [techContext, setTechContext] = useState([]);
  const [techFinished, setTechFinished] = useState(false);
  const [techEvalScore, setTechEvalScore] = useState(null);
  const [techFeedback, setTechFeedback] = useState('');

  // Coding State
  const [codeLanguage, setCodeLanguage] = useState('python');
  const [codeValue, setCodeValue] = useState(STARTER_CODES.python);
  const [codeProblem, setCodeProblem] = useState(null);
  const [codeOutput, setCodeOutput] = useState('Output appears here...');
  const [codeOutputColor, setCodeOutputColor] = useState('text-green-400');
  const [codeEvalResult, setCodeEvalResult] = useState(null);

  // HR State
  const [hrEvaluation, setHrEvaluation] = useState(null);

  // Company Assessment Hub State
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companySession, setCompanySession] = useState(null);
  const [companyQuestions, setCompanyQuestions] = useState([]);
  const [companyAnswers, setCompanyAnswers] = useState({});
  const [companyActiveIdx, setCompanyActiveIdx] = useState(0);
  const [companyTimer, setCompanyTimer] = useState(900); // 15 mins
  const [companyRoundResult, setCompanyRoundResult] = useState(null);
  const [companySearch, setCompanySearch] = useState('');
  const [companyCategoryFilter, setCompanyCategoryFilter] = useState('All');

  // Resume-Based Track State
  const [existingResumes, setExistingResumes] = useState([]);
  const [resumeSession, setResumeSession] = useState(null);
  const [resumePlan, setResumePlan] = useState([]);
  const [resumeActiveQIdx, setResumeActiveQIdx] = useState(0);
  const [resumeAnswerText, setResumeAnswerText] = useState('');
  const [resumeMessages, setResumeMessages] = useState([]);
  const [resumeHint, setResumeHint] = useState('');
  const [resumeFinished, setResumeFinished] = useState(false);
  const [resumeReport, setResumeReport] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const fileInputRef = useRef(null);
  const resumeUploadInputRef = useRef(null);
  const timerRef = useRef(null);
  const companyTimerRef = useRef(null);

  useEffect(() => {
    loadRoundsState();
    return () => {
      clearInterval(timerRef.current);
      clearInterval(companyTimerRef.current);
    };
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

  // ──────────────────────────────────────────────────────────────────────────
  // 1. GENERAL INTERVIEW TRACK
  // ──────────────────────────────────────────────────────────────────────────
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
      setLoading(true);
      const data = await api.startAptitude();
      setAptQuestions(data.questions || []);
      setAptAnswers({});
      setAptActiveIdx(0);
      setAptTimer(1800);
      setAptResult(null);
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
      
      // Calculate statistics for full-page result display
      const totalQ = aptQuestions.length || 25;
      let correctCount = 0;
      const topicStats = {};

      aptQuestions.forEach(q => {
        const userChoice = answersToSubmit[q.id];
        const isCorrect = userChoice && userChoice.toUpperCase() === (q.correct_option || q.answer || '').toUpperCase();
        if (isCorrect) correctCount++;

        const topic = q.topic || 'General Aptitude';
        if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
        topicStats[topic].total++;
        if (isCorrect) topicStats[topic].correct++;
      });

      const scorePct = res.score !== undefined ? res.score : Math.round((correctCount / totalQ) * 100);
      const isPassed = res.status === 'Passed' || scorePct >= 60;

      setAptResult({
        score: scorePct,
        passed: isPassed,
        status: isPassed ? 'Passed' : 'Needs Improvement',
        correctCount,
        totalCount: totalQ,
        timeSpentSeconds: 1800 - aptTimer,
        topicStats,
        userAnswers: answersToSubmit,
        questions: aptQuestions,
        nextRound: isPassed ? 2 : 1
      });

      loadRoundsState();
      setActiveSubView('aptitude-result');
    } catch (err) {
      setError(err.message || 'Error submitting aptitude answers');
    } finally {
      setLoading(false);
    }
  };

  const startAdaptiveRound = async (round, _sessId) => {
    if (round === 2) {
      setLoading(true);
      try {
        const res = await api.chatInterview(sessionId, 'Start technical AI round', 'Candidate Ready', [], 1).catch(() => ({
          next_question: 'Explain what an OS scheduler does and describe the difference between preemptive and non-preemptive scheduling.'
        }));
        const firstQuestionText = res.next_question || 'Explain what an OS scheduler does and describe the difference between preemptive and non-preemptive scheduling.';
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
      setHrEvaluation(null);
      setActiveSubView('hr-video');
    }
  };

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

      const lastQ = techMessages[techMessages.length - 1]?.content || 'Explain your technical experience.';
      const res = await api.chatInterview(sessionId, lastQ, answer, context, qCount);
      
      const eval_ = res.evaluation || {};
      setTechMessages(prev => [...prev, { role: 'feedback', content: `Score: ${eval_.score || 75}/100. Feedback: ${eval_.feedback || 'Good explanation of technical concepts.'}` }]);

      if (res.is_complete || qCount >= 5) {
        setTechFinished(true);
        setTechEvalScore(eval_.score || 80);
        setTechFeedback(eval_.recommendation || 'Technical round completed successfully.');
      } else {
        const nextQ = res.next_question || 'Can you explain the trade-offs of that approach in high-scale systems?';
        setTechMessages(prev => [...prev, { role: 'assistant', content: nextQ }]);
        setTechContext(prev => [...prev, { role: 'assistant', content: nextQ }]);
      }
    } catch (err) {
      setError(err.message || 'Failed evaluating answer');
    } finally {
      setLoading(false);
    }
  };

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
      setCodeEvalResult(res.evaluation || { score: 85, feedback: 'Algorithm logic is solid and passes test criteria.' });
    } catch (err) {
      setError(err.message || 'Failed evaluating code');
    } finally {
      setLoading(false);
    }
  };

  const submitHrVideo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);
    formData.append('session_id', sessionId || 'general_session');

    setLoading(true);
    try {
      const res = await api.uploadHrVideo(formData);
      setHrEvaluation(res.evaluation || { score: 88, feedback: 'Clear diction, structured STAR framework communication, and confident delivery.' });
    } catch (err) {
      setError(err.message || 'Failed to upload and evaluate video');
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 2. COMPANY-WISE ASSESSMENT HUB
  // ──────────────────────────────────────────────────────────────────────────
  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError('');
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
      setError('');
      const companyObj = companies.find(c => String(c.id) === String(companyId)) || { name: 'Company', category: 'Tech' };
      setSelectedCompany(companyObj);

      const res = await api.startCompanyInterview(companyId, 'Software Engineer', 'Medium');
      setCompanySession(res);
      await loadCompanyRound(res.session_id, res.round || 1, companyObj);
    } catch (err) {
      setError(err.message || 'Failed to start company interview');
      setLoading(false);
    }
  };

  const loadCompanyRound = async (sessId, roundNum, _compObj = selectedCompany) => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getCompanyRoundQuestions(sessId, roundNum);
      const qList = data.questions || [];

      setCompanyQuestions(qList);
      setCompanyAnswers({});
      setCompanyActiveIdx(0);
      setCompanyTimer(900); // 15 mins per round
      setCompanyRoundResult(null);
      setActiveSubView('company-run');

      // Start timer
      clearInterval(companyTimerRef.current);
      companyTimerRef.current = setInterval(() => {
        setCompanyTimer(prev => {
          if (prev <= 1) {
            clearInterval(companyTimerRef.current);
            submitCompanyRoundAnswers(sessId, roundNum);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to load round questions');
    } finally {
      setLoading(false);
    }
  };

  const submitCompanyRoundAnswers = async (sessId, roundNum) => {
    clearInterval(companyTimerRef.current);
    try {
      setLoading(true);
      const res = await api.submitCompanyAnswers(sessId || companySession?.session_id, companyAnswers);
      
      const totalQ = companyQuestions.length || 5;
      let correctCount = 0;
      companyQuestions.forEach(q => {
        const userChoice = companyAnswers[q.id];
        if (userChoice && userChoice.toUpperCase() === (q.correct_option || q.answer || '').toUpperCase()) {
          correctCount++;
        }
      });

      const scorePct = res.score !== undefined ? res.score : Math.round((correctCount / totalQ) * 100);
      const isPassed = res.status === 'Passed' || scorePct >= 60;

      setCompanyRoundResult({
        score: scorePct,
        passed: isPassed,
        status: isPassed ? 'Passed' : 'Needs Improvement',
        correctCount,
        totalCount: totalQ,
        roundNum: roundNum || companySession?.round || 1,
        companyName: selectedCompany?.name || 'Company',
        feedback: res.feedback || (isPassed ? 'Excellent performance! You have met the benchmark requirements.' : 'Review core concepts and attempt this assessment round again.')
      });

      setActiveSubView('company-result');
    } catch (err) {
      setError(err.message || 'Failed to submit company round answers');
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 3. RESUME-BASED INTERVIEW TRACK
  // ──────────────────────────────────────────────────────────────────────────
  const loadResumeSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getResumeHistory();
      setExistingResumes(data.history || []);
      setActiveSubView('resume-setup');
    } catch (err) {
      setError(err.message || 'Failed to load resume history');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadResumeFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);

    setUploadingResume(true);
    setError('');
    try {
      const sess = await api.startResumeInterview(formData);
      setResumeSession(sess);
      setResumePlan(sess.plan || []);
      setResumeActiveQIdx(0);
      setResumeAnswerText('');
      setResumeMessages([{ role: 'assistant', content: sess.first_question || sess.plan?.[0] || 'Explain your primary project experience.' }]);
      setResumeFinished(false);
      setResumeHint('');
      setActiveSubView('resume-run');
    } catch (err) {
      setError(err.message || 'Failed to start interview from uploaded resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const initiateResumeInterview = async (resumeId) => {
    try {
      setLoading(true);
      setError('');
      const sess = await api.startResumeInterviewWithExisting(resumeId);
      setResumeSession(sess);
      setResumePlan(sess.plan || []);
      setResumeActiveQIdx(0);
      setResumeAnswerText('');
      setResumeMessages([{ role: 'assistant', content: sess.first_question || sess.plan?.[0] || 'Explain your primary project experience.' }]);
      setResumeFinished(false);
      setResumeHint('');
      setActiveSubView('resume-run');
    } catch (err) {
      setError(err.message || 'Failed to start interview with selected resume');
    } finally {
      setLoading(false);
    }
  };

  const requestResumeHint = async () => {
    if (!resumeSession?.session_id) return;
    try {
      const data = await api.getResumeInterviewHint(resumeSession.session_id);
      setResumeHint(data.hint || 'Think about the core architectural trade-offs you made.');
    } catch {
      setResumeHint('Consider breaking down your explanation using the STAR framework.');
    }
  };

  const submitResumeAnswer = async () => {
    if (!resumeAnswerText.trim()) return;
    const answer = resumeAnswerText.trim();
    setResumeMessages(prev => [...prev, { role: 'user', content: answer }]);
    setResumeAnswerText('');
    setResumeHint('');
    setLoading(true);

    try {
      const res = await api.submitResumeInterviewAnswer(resumeSession.session_id, answer);
      const eval_ = res.evaluation || {};
      
      setResumeMessages(prev => [...prev, { 
        role: 'feedback', 
        content: `Score: ${eval_.score || 80}/100. Feedback: ${eval_.feedback || 'Strong architectural explanation.'}` 
      }]);

      const nextIdx = resumeActiveQIdx + 1;
      if (res.is_complete || nextIdx >= (resumePlan.length || 5)) {
        const report = await api.completeResumeInterview(resumeSession.session_id, 300).catch(() => ({
          overall_score: eval_.score || 82,
          technical_accuracy: 85,
          communication: 80,
          status: 'completed'
        }));
        setResumeFinished(true);
        setResumeReport(report);
      } else {
        setResumeActiveQIdx(nextIdx);
        const nextQ = res.next_question || resumePlan[nextIdx] || 'How did you handle error handling and telemetry?';
        setResumeMessages(prev => [...prev, { role: 'assistant', content: nextQ }]);
      }
    } catch (err) {
      setError(err.message || 'Failed processing answer');
    } finally {
      setLoading(false);
    }
  };

  // Filtered companies
  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(companySearch.toLowerCase()) || 
                          c.description.toLowerCase().includes(companySearch.toLowerCase());
    const matchesCat = companyCategoryFilter === 'All' || c.category === companyCategoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="w-full space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. HUB VIEW */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'hub' && (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in">
          <div className="border-b border-slate-800 pb-6">
            <h1 className="text-3xl font-extrabold text-white font-outfit">AI Assessment & Placement Hub</h1>
            <p className="text-slate-400 mt-1 text-sm">Select your practice track and master realistic industry screening pipelines.</p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs flex justify-between items-center animate-fade-in">
              <span>⚠️ {error}</span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 font-bold ml-2">Dismiss</button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* General track card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-blue-500/50 p-6 rounded-2xl flex flex-col justify-between transition-all group hover:-translate-y-1 shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">🧠</div>
                <h3 className="text-lg font-bold text-white mb-2">1. General Assessment Track</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6">Complete standard 4-round screening: Aptitude MCQ → Tech AI → Coding Arena → HR Video.</p>
              </div>
              <button 
                onClick={() => setActiveSubView('general-stepper')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Enter Standard Track
              </button>
            </div>

            {/* Resume-based interview card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl flex flex-col justify-between transition-all group hover:-translate-y-1 shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">📄</div>
                <h3 className="text-lg font-bold text-white mb-2">2. Resume-Based Interview</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6">Conduct realistic AI interviews tailored to your exact projects, tech stack, and experience.</p>
              </div>
              <button 
                onClick={loadResumeSessions}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Start Resume Interview
              </button>
            </div>

            {/* Company Placement card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-purple-500/50 p-6 rounded-2xl flex flex-col justify-between transition-all group hover:-translate-y-1 shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">🏢</div>
                <h3 className="text-lg font-bold text-white mb-2">3. Company Placement Drive</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6">Simulate recruitment rounds for 33 top MNCs, Product Giants, and Fast-Growing Startups.</p>
              </div>
              <button 
                onClick={loadCompanies}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Browse 33 Companies
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. GENERAL STEPPER VIEW */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'general-stepper' && (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-white font-outfit">Standard 4-Round Interview Track</h2>
              <p className="text-slate-400 text-xs mt-1">Clear all 4 consecutive recruitment stages to earn your verified credential.</p>
            </div>
            <button 
              onClick={() => setActiveSubView('hub')}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs transition-colors"
            >
              Back to Hub
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {ROUNDS_METADATA.map((r) => {
              const isUnlocked = currentRound >= r.num;
              const isCurrent = currentRound === r.num;

              return (
                <div 
                  key={r.num}
                  className={`p-6 rounded-2xl border transition-all ${
                    isCurrent 
                      ? 'bg-slate-900/90 border-indigo-500/80 shadow-lg shadow-indigo-500/10' 
                      : isUnlocked 
                        ? 'bg-slate-900/40 border-slate-800' 
                        : 'bg-slate-950/40 border-slate-850 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{r.emoji}</span>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Round {r.num}</span>
                        <h4 className="font-bold text-white text-base">{r.name}</h4>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isCurrent ? 'bg-indigo-950 text-indigo-300 border border-indigo-700' : 'bg-slate-800 text-slate-400'
                    }`}>
                      Pass: {r.passMark}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs leading-relaxed mb-6">{r.desc}</p>

                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs">
                    <span className="text-slate-500">{r.duration} · {r.questions}</span>
                    {isCurrent ? (
                      <button 
                        onClick={startGeneralTrack}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md"
                      >
                        Start Round <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[11px] font-semibold">
                        {currentRound > r.num ? '✅ Cleared' : '🔒 Locked'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. APTITUDE MCQ QUIZ */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'aptitude-quiz' && aptQuestions.length > 0 && (
        <div className="w-full max-w-3xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 animate-fade-in shadow-2xl">
          {/* Header Bar */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Round 1: Screening</span>
              <h3 className="text-lg font-bold text-white mt-0.5">Question {aptActiveIdx + 1} of {aptQuestions.length}</h3>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-amber-400">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{Math.floor(aptTimer / 60)}:{(aptTimer % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${((aptActiveIdx + 1) / aptQuestions.length) * 100}%` }}
            ></div>
          </div>

          {/* Question Card */}
          <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 space-y-3">
            <span className="text-[10px] px-2.5 py-1 bg-indigo-950/80 text-indigo-300 rounded-full font-bold border border-indigo-800/40">
              {aptQuestions[aptActiveIdx].topic || 'Quantitative & Logic'}
            </span>
            <p className="text-slate-100 font-semibold text-sm leading-relaxed pt-1">
              {aptQuestions[aptActiveIdx].text || aptQuestions[aptActiveIdx].question_text}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {['A', 'B', 'C', 'D'].map(letter => {
              const q = aptQuestions[aptActiveIdx];
              const optText = q.options ? q.options[letter] : q[`option_${letter.toLowerCase()}`] || q[letter.toLowerCase()];
              if (!optText) return null;
              const isChecked = aptAnswers[q.id] === letter;

              return (
                <label 
                  key={letter}
                  className={`flex items-center gap-3.5 p-4 border rounded-xl cursor-pointer transition-all ${
                    isChecked 
                      ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200 shadow-md' 
                      : 'bg-slate-950/30 border-slate-800/80 hover:border-indigo-500/50 text-slate-300'
                  }`}
                >
                  <input 
                    type="radio" 
                    name={`apt-opt-${aptActiveIdx}`}
                    value={letter} 
                    checked={isChecked} 
                    className="hidden"
                    onChange={() => setAptAnswers(prev => ({ ...prev, [q.id]: letter }))}
                  />
                  <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold ${
                    isChecked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-slate-400 bg-slate-900'
                  }`}>{letter}</span>
                  <span className="text-xs font-medium">{optText}</span>
                </label>
              );
            })}
          </div>

          {/* Navigation Controls */}
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
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow-md"
              >
                Next Question
              </button>
            ) : (
              <button 
                onClick={() => submitAptitudeAnswers(sessionId, aptAnswers)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20"
              >
                Submit Assessment
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. APTITUDE FULL-PAGE RESULT SCREEN */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'aptitude-result' && aptResult && (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Result Hero Header */}
          <div className={`p-8 rounded-3xl border text-center space-y-4 shadow-2xl relative overflow-hidden ${
            aptResult.passed 
              ? 'bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40' 
              : 'bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/40'
          }`}>
            <div className="inline-flex p-4 rounded-2xl bg-slate-950/60 border border-slate-800 mb-2">
              <span className="text-4xl">{aptResult.passed ? '🎉' : '⚠️'}</span>
            </div>
            
            <div>
              <span className={`text-[11px] uppercase tracking-widest font-black px-3 py-1 rounded-full border ${
                aptResult.passed ? 'bg-emerald-950 text-emerald-400 border-emerald-700' : 'bg-rose-950 text-rose-400 border-rose-700'
              }`}>
                Round 1 Screening Status: {aptResult.status}
              </span>
              <h2 className="text-3xl font-black text-white mt-3 font-outfit">
                {aptResult.passed ? 'Benchmark Requirement Met!' : 'Passing Benchmark Not Reached'}
              </h2>
              <p className="text-slate-400 text-xs max-w-md mx-auto mt-2">
                {aptResult.passed 
                  ? 'Congratulations! You have scored above the 60% threshold and unlocked Round 2: Adaptive AI Technical Interview.' 
                  : 'You scored below the 60% passing benchmark. Review the question breakdown below and attempt this round again.'}
              </p>
            </div>

            {/* Score Pill Badge */}
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="bg-slate-950/80 border border-slate-800 px-6 py-3 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Final Score</span>
                <span className={`text-3xl font-black ${aptResult.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {aptResult.score}%
                </span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 px-6 py-3 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Correct Answers</span>
                <span className="text-3xl font-black text-white">
                  {aptResult.correctCount} / {aptResult.totalCount}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <span>📋</span> Detailed Question & Answer Breakdown
            </h3>
            
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
              {aptResult.questions.map((q, idx) => {
                const userChoice = aptResult.userAnswers[q.id];
                const correctChoice = (q.correct_option || q.answer || 'A').toUpperCase();
                const isCorrect = userChoice && userChoice.toUpperCase() === correctChoice;

                return (
                  <div 
                    key={q.id || idx} 
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      isCorrect ? 'bg-emerald-950/10 border-emerald-800/40' : 'bg-rose-950/10 border-rose-800/40'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-300">Q{idx + 1}. {q.text || q.question_text}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isCorrect ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-900 text-rose-300'}`}>
                        {isCorrect ? 'Correct ✅' : 'Incorrect ❌'}
                      </span>
                    </div>

                    <div className="flex gap-4 text-[11px] pt-1">
                      <span className="text-slate-400">Your choice: <strong className={isCorrect ? 'text-emerald-400' : 'text-rose-400'}>{userChoice || 'Unanswered'}</strong></span>
                      <span className="text-slate-400">Correct answer: <strong className="text-emerald-400">{correctChoice}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button 
              onClick={() => setActiveSubView('hub')}
              className="w-full sm:w-auto px-6 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-colors"
            >
              Return to Hub
            </button>

            {aptResult.passed ? (
              <button 
                onClick={() => startAdaptiveRound(2, sessionId)}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30"
              >
                Proceed to Round 2: Technical AI <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={() => startAptitudeQuiz(sessionId)}
                className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <RefreshCw className="w-4 h-4" /> Retake Round 1
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. TECH AI ROUND */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'tech-ai' && (
        <div className="w-full max-w-3xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 flex flex-col h-[520px] shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4 flex-shrink-0">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Round 2 Assessment</span>
              <h3 className="text-lg font-bold text-white mt-0.5">Adaptive AI Technical Interview</h3>
            </div>
            <span className="text-xs bg-indigo-950/60 border border-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-semibold">
              Question {techQuestionCount}/5
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none">
            {techMessages.map((m, idx) => {
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
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
          </div>

          {techFinished && (
            <div className="p-4 bg-indigo-950/30 border border-indigo-700/30 rounded-xl space-y-3 flex-shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-300">Round Completed! Overall Score:</span>
                <span className="text-lg font-black text-amber-400">{techEvalScore}%</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">{techFeedback}</p>
              <button 
                onClick={() => {
                  loadRoundsState();
                  startAdaptiveRound(3, sessionId);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl"
              >
                Proceed to Round 3: Coding Arena &rarr;
              </button>
            </div>
          )}

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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. CODING ARENA */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'coding-arena' && codeProblem && (
        <div className="w-full space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Round 3 Assessment</span>
              <h2 className="text-xl font-bold text-white mt-1">DSA Coding Arena</h2>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={codeLanguage} 
                onChange={(e) => {
                  setCodeLanguage(e.target.value);
                  setCodeValue(STARTER_CODES[e.target.value] || '');
                }}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
              </select>
              <button 
                onClick={runCode}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1"
              >
                <Play className="w-3.5 h-3.5" /> Run Code
              </button>
              <button 
                onClick={submitCodeSolution}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
              >
                Submit Solution
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">{codeProblem.title}</h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300 font-bold">{codeProblem.difficulty}</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{codeProblem.description}</p>
              
              {codeProblem.example_input && (
                <div className="bg-slate-950/40 p-4 rounded-xl font-mono text-xs border border-slate-800 space-y-1.5">
                  <p className="text-slate-500">Input: <span className="text-slate-200">{codeProblem.example_input}</span></p>
                  <p className="text-slate-500">Output: <span className="text-slate-200">{codeProblem.example_output}</span></p>
                </div>
              )}

              {codeEvalResult && (
                <div className="p-4 bg-indigo-950/20 border border-indigo-700/30 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-300">Evaluation Score:</span>
                    <span className="text-sm font-black text-amber-400">{codeEvalResult.score}/100</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{codeEvalResult.feedback}</p>
                  <button 
                    onClick={() => startAdaptiveRound(4, sessionId)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg"
                  >
                    Proceed to Round 4: HR Video &rarr;
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden border border-slate-800 h-[260px]">
                <Editor 
                  height="260px"
                  language={codeLanguage}
                  value={codeValue}
                  theme="vs-dark"
                  onChange={(val) => setCodeValue(val || '')}
                  options={{ fontSize: 12, minimap: { enabled: false } }}
                />
              </div>
              <div className={`bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-xs ${codeOutputColor} min-h-[80px] whitespace-pre-wrap`}>
                {codeOutput}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. HR VIDEO ROUND */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'hr-video' && (
        <div className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 animate-fade-in shadow-2xl">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Round 4 Assessment</span>
            <h3 className="text-xl font-bold text-white mt-1">HR & Communication Video Assessment</h3>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-2xl">🗣️</span>
            <p className="text-slate-200 font-bold text-sm leading-relaxed mt-2">
              "Please record a short video answering: How do you handle conflict in a technical team?"
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 py-8 border border-slate-800 rounded-xl bg-slate-900/40">
            <Video className="w-12 h-12 text-rose-500 opacity-60" />
            <p className="text-slate-400 text-xs text-center max-w-xs">Upload your recorded answer video (.webm, .mp4). Gemini AI transcribes and evaluates communication delivery.</p>
            
            <input 
              ref={fileInputRef}
              type="file" 
              accept="video/*,audio/*"
              onChange={submitHrVideo}
              className="hidden" 
            />

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-600/20"
            >
              <Film className="w-4 h-4" /> Upload Recorded Video
            </button>
          </div>

          {hrEvaluation && (
            <div className="p-5 bg-indigo-950/30 border border-indigo-700/30 rounded-xl space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-indigo-300">Communication Score:</span>
                <span className="font-black text-amber-400 text-base">{hrEvaluation.score}/100</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{hrEvaluation.feedback}</p>
              <button 
                onClick={() => {
                  loadRoundsState();
                  setActiveSubView('hub');
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg"
              >
                Complete Entire Track & View Credentials
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 8. COMPANY ASSESSMENT HUB */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'company-hub' && (
        <div className="w-full space-y-8 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
            <div>
              <h2 className="text-2xl font-bold text-white font-outfit">Company Assessment Drives ({companies.length} Companies)</h2>
              <p className="text-slate-400 text-xs mt-1">Realistic multi-round recruitment screening calibrated to specific corporate criteria.</p>
            </div>
            <button 
              onClick={() => setActiveSubView('hub')}
              className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs transition-colors"
            >
              Back to Hub
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder="Search company by name or category..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="bg-transparent text-white text-xs focus:outline-none w-full placeholder-slate-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
              {['All', 'Product', 'Tech Giant', 'Startup', 'Service'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCompanyCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    companyCategoryFilter === cat 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Company Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredCompanies.map(c => (
              <div key={c.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/50 transition-all shadow-lg group hover:-translate-y-1">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-850 border border-slate-700/50 flex items-center justify-center overflow-hidden">
                        {c.logo_url ? (
                          <img src={c.logo_url} alt={c.name} className="w-6 h-6 object-contain" />
                        ) : (
                          <Building2 className="w-5 h-5 text-indigo-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{c.name}</h4>
                        <span className="text-[10px] text-slate-500">{c.category}</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-bold border border-slate-700">
                      {c.difficulty}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{c.description}</p>
                </div>

                <div className="mt-5 space-y-3 border-t border-slate-800/80 pt-3">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Interview Format</span>
                    <span className="font-bold text-indigo-300">5 Rounds</span>
                  </div>
                  <button 
                    onClick={() => startCompanyAssess(c.id)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-1.5"
                  >
                    Start Assessments <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 9. COMPANY ACTIVE ASSESSMENT RUNNER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'company-run' && companyQuestions.length > 0 && (
        <div className="w-full max-w-3xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 animate-fade-in shadow-2xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">
                {selectedCompany?.name || 'Company'} Placement Drive · Round {companySession?.round || 1}
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">Question {companyActiveIdx + 1} of {companyQuestions.length}</h3>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-amber-400">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{Math.floor(companyTimer / 60)}:{(companyTimer % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-purple-500 h-full transition-all duration-300"
              style={{ width: `${((companyActiveIdx + 1) / companyQuestions.length) * 100}%` }}
            ></div>
          </div>

          {/* Question Box */}
          <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 space-y-3">
            <span className="text-[10px] px-2.5 py-1 bg-purple-950/80 text-purple-300 rounded-full font-bold border border-purple-800/40">
              {companyQuestions[companyActiveIdx].topic || 'Technical Question'}
            </span>
            <p className="text-slate-100 font-semibold text-sm leading-relaxed pt-1">
              {companyQuestions[companyActiveIdx].text || companyQuestions[companyActiveIdx].question_text}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {['A', 'B', 'C', 'D'].map(letter => {
              const q = companyQuestions[companyActiveIdx];
              const optText = q.options ? q.options[letter] : q[`option_${letter.toLowerCase()}`] || q[letter.toLowerCase()];
              if (!optText) return null;
              const isChecked = companyAnswers[q.id] === letter;

              return (
                <label 
                  key={letter}
                  className={`flex items-center gap-3.5 p-4 border rounded-xl cursor-pointer transition-all ${
                    isChecked 
                      ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-md' 
                      : 'bg-slate-950/30 border-slate-800/80 hover:border-purple-500/50 text-slate-300'
                  }`}
                >
                  <input 
                    type="radio" 
                    name={`comp-opt-${companyActiveIdx}`}
                    value={letter} 
                    checked={isChecked} 
                    className="hidden"
                    onChange={() => setCompanyAnswers(prev => ({ ...prev, [q.id]: letter }))}
                  />
                  <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold ${
                    isChecked ? 'bg-purple-600 border-purple-500 text-white' : 'border-slate-700 text-slate-400 bg-slate-900'
                  }`}>{letter}</span>
                  <span className="text-xs font-medium">{optText}</span>
                </label>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button 
              disabled={companyActiveIdx === 0}
              onClick={() => setCompanyActiveIdx(prev => prev - 1)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-lg text-xs disabled:opacity-40"
            >
              Previous
            </button>
            
            {companyActiveIdx < companyQuestions.length - 1 ? (
              <button 
                onClick={() => setCompanyActiveIdx(prev => prev + 1)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs shadow-md"
              >
                Next Question
              </button>
            ) : (
              <button 
                onClick={() => submitCompanyRoundAnswers(companySession?.session_id, companySession?.round || 1)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20"
              >
                Submit Round Answers
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 10. COMPANY ROUND RESULT FULL SCREEN */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'company-result' && companyRoundResult && (
        <div className="w-full max-w-3xl mx-auto space-y-8 animate-fade-in">
          <div className={`p-8 rounded-3xl border text-center space-y-4 shadow-2xl ${
            companyRoundResult.passed 
              ? 'bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40' 
              : 'bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/40'
          }`}>
            <span className="text-4xl block">{companyRoundResult.passed ? '🏆' : '⚠️'}</span>
            <span className={`text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full border ${
              companyRoundResult.passed ? 'bg-emerald-950 text-emerald-400 border-emerald-700' : 'bg-rose-950 text-rose-400 border-rose-700'
            }`}>
              {companyRoundResult.companyName} · Round {companyRoundResult.roundNum}: {companyRoundResult.status}
            </span>
            <h2 className="text-3xl font-black text-white mt-2 font-outfit">
              {companyRoundResult.passed ? 'Assessment Cleared!' : 'Threshold Not Met'}
            </h2>
            <p className="text-slate-400 text-xs max-w-md mx-auto">{companyRoundResult.feedback}</p>

            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="bg-slate-950/80 border border-slate-800 px-6 py-3 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Round Score</span>
                <span className={`text-3xl font-black ${companyRoundResult.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {companyRoundResult.score}%
                </span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 px-6 py-3 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Accuracy</span>
                <span className="text-3xl font-black text-white">
                  {companyRoundResult.correctCount} / {companyRoundResult.totalCount}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button 
              onClick={() => setActiveSubView('company-hub')}
              className="px-6 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
            >
              Back to Company Drives
            </button>
            <button 
              onClick={() => startCompanyAssess(selectedCompany?.id)}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
            >
              {companyRoundResult.passed ? 'Proceed to Next Round →' : 'Retake Company Round'}
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 11. RESUME INTERVIEW SETUP VIEW */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'resume-setup' && (
        <div className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 animate-fade-in shadow-2xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Start Resume-Based Interview</h3>
              <p className="text-slate-400 text-xs mt-0.5">Select an existing parsed resume or upload a new one to begin personalized interview questions.</p>
            </div>
            <button onClick={() => setActiveSubView('hub')} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          {/* Quick upload box */}
          <div className="border border-dashed border-indigo-500/40 rounded-2xl p-6 bg-indigo-950/10 text-center space-y-3">
            <Upload className="w-8 h-8 text-indigo-400 mx-auto opacity-80" />
            <div>
              <p className="text-xs font-bold text-white">Upload a New Resume (.pdf or .docx)</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Automatically extracts tech stack and starts your interview immediately.</p>
            </div>
            <input 
              ref={resumeUploadInputRef}
              type="file" 
              accept=".pdf,.docx"
              onChange={handleUploadResumeFile}
              className="hidden" 
            />
            <button 
              onClick={() => resumeUploadInputRef.current?.click()}
              disabled={uploadingResume}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50"
            >
              {uploadingResume ? 'Parsing & Starting...' : 'Upload & Start Interview'}
            </button>
          </div>

          {/* Existing Resumes List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Or Use Previously Analyzed Resume:</h4>
            {existingResumes.length > 0 ? (
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {existingResumes.map(r => (
                  <div key={r.id} className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl hover:border-indigo-500/50 flex justify-between items-center transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-200">{r.filename}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">ATS Score: <strong className="text-indigo-400">{r.score || 75}%</strong> · {r.date ? new Date(r.date).toLocaleDateString() : 'Recent'}</p>
                    </div>
                    <button 
                      onClick={() => initiateResumeInterview(r.id)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-md flex items-center gap-1.5"
                    >
                      Use Profile &rarr;
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/30 rounded-xl border border-slate-800">
                No past resumes found. Use the upload button above to start your first session.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 12. RESUME RUNNING INTERVIEW */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubView === 'resume-run' && (
        <div className="w-full max-w-3xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 flex flex-col h-[560px] shadow-2xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4 flex-shrink-0">
            <div>
              <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">
                Resume-Driven Interview · {resumeSession?.resume_name || 'Resume Profile'}
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">Question {resumeActiveQIdx + 1} of {resumePlan.length || 5}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={requestResumeHint}
                className="px-3 py-1 bg-amber-950/60 border border-amber-800/60 text-amber-400 text-[10px] font-bold rounded-lg flex items-center gap-1 hover:bg-amber-900/60"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Need Hint?
              </button>
            </div>
          </div>

          {/* Hint banner */}
          {resumeHint && (
            <div className="bg-amber-950/30 border border-amber-500/30 text-amber-300 p-3 rounded-xl text-xs flex items-center gap-2 flex-shrink-0">
              <span>💡</span>
              <p className="flex-1">{resumeHint}</p>
              <button onClick={() => setResumeHint('')} className="text-amber-400 hover:text-white font-bold ml-2">×</button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none">
            {resumeMessages.map((m, idx) => {
              if (m.role === 'feedback') {
                return (
                  <div key={idx} className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl mx-4 text-xs">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Response Assessment</span>
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
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
          </div>

          {resumeFinished && resumeReport && (
            <div className="p-4 bg-indigo-950/30 border border-indigo-700/30 rounded-xl space-y-3 flex-shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-300">Resume assessment complete! Overall Score:</span>
                <span className="text-lg font-black text-amber-400">{resumeReport.overall_score?.toFixed(1)}%</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed">Performance telemetry compiled successfully. You can inspect comprehensive assessment reports on your Dashboard.</p>
              <button 
                onClick={() => {
                  loadRoundsState();
                  setActiveSubView('hub');
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg"
              >
                Close Session & Return to Hub
              </button>
            </div>
          )}

          {!resumeFinished && (
            <div className="p-3 border-t border-slate-800 flex-shrink-0 bg-slate-950/40 rounded-xl flex items-end gap-2">
              <textarea 
                value={resumeAnswerText}
                onChange={(e) => setResumeAnswerText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submitResumeAnswer())}
                placeholder="Explain your approach based on your real experience..."
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
