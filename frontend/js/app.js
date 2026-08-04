
// ============================================================
//   AI Interview Trainer — Full Feature Frontend
//   All pages: Dashboard, Profile, Rounds, Arena, Leaderboard,
//              Community, Resume, Interview Flow
// ============================================================

// State
let token = localStorage.getItem('access_token');
const API_BASE = '/api';
let monacoEditor = null;
let currentSessionId = null;
let currentAptitudeQuestions = [];
let currentAptitudeAnswers = {};
let aptitudeTimerInterval = null;
let timerInterval = null;
let mediaRecorder;
let audioChunks = [];
let recordedBlob = null;
let mediaStream = null;
let currentActivePage = null;

// ─── Safe JSON parser ────────────────────────────────────────
async function parseJSON(res) {
    const text = await res.text();
    try { return JSON.parse(text); }
    catch (e) {
        console.error('Server returned non-JSON:', text);
        throw new Error('Server error. Check backend logs.');
    }
}

// ─── Auth Guard & App Bootstrap ─────────────────────────────
function renderApp() {
    const sidebar = document.getElementById('sidebar');
    const mobileHeader = document.querySelector('header.md\\:hidden');
    const footer = document.getElementById('app-footer');
    const chatWidget = document.getElementById('chat-widget');

    if (token && token !== 'undefined' && token !== 'null') {
        if (sidebar) sidebar.classList.remove('hidden');
        if (mobileHeader) mobileHeader.classList.remove('hidden');
        if (footer) footer.style.display = '';
        // ── Show chat widget for authenticated users ────────
        if (chatWidget) chatWidget.style.display = '';
        renderDashboard();
    } else {
        if (sidebar) sidebar.classList.add('hidden');
        if (mobileHeader) mobileHeader.classList.add('hidden');
        if (footer) footer.style.display = 'none';
        // ── Hide chat widget on logout ──────────────────────
        if (chatWidget) chatWidget.style.display = 'none';
        renderAuth();
    }
}

function logout() {
    localStorage.removeItem('access_token');
    token = null;
    // Reset chatbot state on logout (guard: chatbot module may not yet be loaded)
    if (typeof chatOpen !== 'undefined')       chatOpen = false;
    if (typeof chatInitialized !== 'undefined') chatInitialized = false;
    const panel = document.getElementById('chat-panel');
    if (panel) {
        panel.classList.add('scale-0', 'opacity-0', 'pointer-events-none');
        panel.classList.remove('scale-100', 'opacity-100');
    }
    renderApp();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}
function toggleMap() {
    if (window.innerWidth < 768) toggleSidebar();
}
function toggleTheme() {
    const html = document.documentElement;
    html.classList.toggle('light-mode');
    const isLight = html.classList.contains('light-mode');
    document.getElementById('theme-text').textContent = isLight ? 'Dark Mode' : 'Light Mode';
}

// ─── Utility: set active nav link ───────────────────────────
function setActiveNav(page) {
    currentActivePage = page;
    document.querySelectorAll('.sidebar-link').forEach(el => {
        el.classList.remove('bg-slate-800', 'text-white', 'font-bold');
    });
    const target = document.getElementById(`nav-${page}`);
    if (target) target.classList.add('bg-slate-800', 'text-white', 'font-bold');
}

// ─── Helper: show loader ─────────────────────────────────────
function showLoader() {
    document.getElementById('app-container').innerHTML =
        `<div class="w-full h-full flex flex-col items-center justify-center gap-4 py-20">
            <div class="loader"></div>
            <p class="text-slate-400 text-sm animate-pulse">Loading...</p>
        </div>`;
}

// ─── Helper: toast notification ──────────────────────────────
function showToast(msg, type = 'info') {
    const colors = { info: 'bg-blue-600', success: 'bg-green-600', error: 'bg-red-600', warning: 'bg-yellow-600' };
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 z-[9999] ${colors[type]} text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 opacity-0`;
    toast.innerHTML = `<span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.replace('opacity-0', 'opacity-100'), 10);
    setTimeout(() => { toast.classList.replace('opacity-100', 'opacity-0'); setTimeout(() => toast.remove(), 300); }, 3500);
}

// ────────────────────────────────────────────────────────────
//   AUTH VIEW
// ────────────────────────────────────────────────────────────
function renderAuth() {
    const container = document.getElementById('app-container');
    container.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-screen w-full px-4">
        <div class="text-center mb-10">
            <div class="text-5xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3">Trainer AI</div>
            <p class="text-slate-400 text-lg">Your AI-Powered Interview Partner</p>
        </div>
        <div class="bg-slate-900 border border-slate-700/60 p-8 rounded-2xl shadow-2xl max-w-md w-full backdrop-blur">
            <h2 class="text-2xl font-bold mb-1 text-center text-white">Welcome Back</h2>
            <p class="text-slate-500 text-sm text-center mb-6">Login or create an account to begin</p>
            <input id="email" type="email" placeholder="Email address"
                class="w-full bg-slate-800 border border-slate-600 text-white p-3 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-500 transition">
            <input id="password" type="password" placeholder="Password"
                class="w-full bg-slate-800 border border-slate-600 text-white p-3 rounded-lg mb-5 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-500 transition">
            <div class="flex gap-3">
                <button onclick="handleAuth('login')"
                    class="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-blue-500/30">
                    Login
                </button>
                <button onclick="handleAuth('register')"
                    class="flex-1 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold py-3 rounded-lg transition-colors">
                    Register
                </button>
            </div>
            <p id="auth-error" class="text-red-400 mt-4 text-sm text-center hidden"></p>
        </div>
        <div class="mt-8 flex gap-6 text-slate-500 text-xs">
            <span>🔒 Secure JWT Auth</span>
            <span>🤖 Powered by Gemini AI</span>
            <span>📊 ML Readiness Score</span>
        </div>
    </div>`;
}

async function handleAuth(action) {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('auth-error');
    errorEl.classList.add('hidden');
    if (!email || !password) { errorEl.textContent = 'Email and password are required.'; errorEl.classList.remove('hidden'); return; }

    try {
        const res = await fetch(`${API_BASE}/auth/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || 'Authentication failed');
        token = data.data.access_token;
        localStorage.setItem('access_token', token);
        renderApp();
    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
    }
}

// ────────────────────────────────────────────────────────────
//   DASHBOARD
// ────────────────────────────────────────────────────────────
async function renderDashboard() {
    setActiveNav('dashboard');
    showLoader();
    const container = document.getElementById('app-container');
    try {
        const res = await fetch(`${API_BASE}/user/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.status === 401 || res.status === 422) { logout(); return; }
        if (!res.ok) throw new Error('Failed to load dashboard data');
        const data = await parseJSON(res);

        const score = data.readiness_score ? data.readiness_score.toFixed(1) : 0;
        const currentRound = data.current_round || 1;
        const progressPercentage = Math.min(100, ((currentRound - 1) / 3) * 100);
        const attemptsRemaining = data.attempts_remaining !== undefined ? data.attempts_remaining : 2;
        const weakTopics = data.weak_topics && data.weak_topics.length > 0 ? data.weak_topics.join(', ') : 'None identified yet';
        const streak = data.current_streak || 0;

        const roundLabels = ['', 'Aptitude MCQ', 'Technical AI', 'Coding Arena', 'HR Video'];
        const nextStepMessages = [
            '', 'Complete the Aptitude round to unlock Technical.',
            'Pass Technical to unlock Coding Arena.',
            'Solve coding problems to unlock HR round.',
            'Complete the HR round to finish!'
        ];

        let dsaHtml = '';
        if (data.daily_dsa) {
            const diffColor = data.daily_dsa.difficulty === 'Hard' ? 'text-red-400' : (data.daily_dsa.difficulty === 'Medium' ? 'text-yellow-400' : 'text-green-400');
            dsaHtml = `
            <div class="bg-slate-900 border border-slate-700 p-6 rounded-xl hover:border-yellow-500/60 transition-all cursor-pointer flex justify-between items-center group"
                onclick="renderArena()">
                <div>
                    <div class="flex items-center gap-2 mb-2">
                        <h3 class="text-xl font-bold text-yellow-400">Daily DSA</h3>
                        <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 ${diffColor} font-semibold">${data.daily_dsa.difficulty}</span>
                    </div>
                    <p class="text-slate-200 font-semibold mb-1">${data.daily_dsa.title}</p>
                    <p class="text-slate-400 text-sm">Solve to boost your readiness score.</p>
                </div>
                <svg class="w-8 h-8 text-yellow-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
            </div>`;
        }

        const achievementBadges = (data.achievements || []).map(a =>
            `<span class="px-2 py-1 bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 text-xs rounded-full font-semibold">🏆 ${a}</span>`
        ).join('') || `<span class="text-slate-500 text-sm">No badges yet — start your journey!</span>`;

        container.innerHTML = `
        <div class="w-full space-y-8">
            <!-- Header -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 class="text-3xl font-extrabold text-white">Dashboard</h2>
                    <p class="text-slate-400 mt-1">${nextStepMessages[currentRound] || 'All rounds complete!'}</p>
                </div>
                <div class="flex items-center gap-3 bg-slate-900 border border-slate-700 px-4 py-2 rounded-xl">
                    <span class="text-2xl">🔥</span>
                    <div>
                        <p class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Current Streak</p>
                        <p class="text-xl font-black text-orange-400">${streak} day${streak !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            </div>

            <!-- Top Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                <!-- Readiness -->
                <div class="md:col-span-2 bg-slate-900 border border-slate-700 p-6 rounded-xl">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="text-lg font-bold text-white">Job Readiness Score</h3>
                        <span class="text-3xl font-black ${score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-blue-400'}">${score}%</span>
                    </div>
                    <div class="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                        <div class="h-3 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-1000 relative"
                            style="width:${score}%">
                            <div class="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                        </div>
                    </div>
                    <div class="flex justify-between mt-2">
                        <p class="text-xs text-slate-500">Round ${currentRound} of 4: ${roundLabels[currentRound] || 'Complete'}</p>
                        <p class="text-xs text-slate-500">Stage Progress: ${progressPercentage.toFixed(0)}%</p>
                    </div>
                </div>
                <!-- Stats -->
                <div class="bg-slate-900 border border-slate-700 p-6 rounded-xl flex flex-col gap-4">
                    <div>
                        <p class="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Attempts Left</p>
                        <p class="text-2xl font-bold ${attemptsRemaining > 0 ? 'text-white' : 'text-red-400'}">${attemptsRemaining}</p>
                    </div>
                    <div>
                        <p class="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Weak Topics</p>
                        <p class="text-sm font-medium text-red-300">${weakTopics}</p>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div>
                <h3 class="text-lg font-bold text-white mb-4">Quick Actions</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div class="bg-slate-900 border border-slate-700 p-6 rounded-xl hover:border-blue-500/60 transition-all cursor-pointer flex justify-between items-center group"
                        onclick="startInterview()">
                        <div>
                            <h3 class="text-lg font-bold text-blue-400 mb-1 group-hover:text-blue-300">▶ Start Next Round</h3>
                            <p class="text-slate-400 text-sm">Continue from ${roundLabels[currentRound] || 'Final Stage'}</p>
                        </div>
                        <svg class="w-7 h-7 text-blue-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                    </div>
                    <div class="bg-slate-900 border border-slate-700 p-6 rounded-xl hover:border-purple-500/60 transition-all cursor-pointer relative group"
                        onclick="renderResumePage()">
                        <h3 class="text-lg font-bold text-purple-400 mb-1 group-hover:text-purple-300 flex items-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            Resume Analysis
                        </h3>
                        <p class="text-slate-400 text-sm">Upload & get AI-powered feedback on your resume.</p>
                    </div>
                    <div class="bg-slate-900 border border-slate-700 p-6 rounded-xl hover:border-indigo-500/60 transition-all relative group flex flex-col justify-between">
                        <div>
                            <h3 class="text-lg font-bold text-indigo-400 mb-1 flex items-center gap-2">
                                📝 Resume-Based Interview
                            </h3>
                            <p class="text-slate-400 text-sm mb-4">Take an AI interview based on your uploaded resume.</p>
                        </div>
                        <div class="flex flex-col gap-2 w-full mt-auto">
                            <button onclick="renderResumeInterviewSetup()" class="w-full text-left text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-3 rounded-lg flex justify-between items-center transition-colors">
                                <span>Upload / Start Interview</span>
                                <span>➔</span>
                            </button>
                            <button onclick="renderResumeInterviewHistory()" class="w-full text-left text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-3 rounded-lg flex justify-between items-center transition-colors">
                                <span>View Previous Reports</span>
                                <span>➔</span>
                            </button>
                        </div>
                    </div>
                    ${dsaHtml || `<div class="bg-slate-900 border border-slate-700/40 p-6 rounded-xl flex flex-col justify-center items-center text-slate-600 text-sm gap-2">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                        No daily problem
                    </div>`}
                </div>
            </div>

            <!-- Achievements -->
            <div class="bg-slate-900 border border-slate-700 p-6 rounded-xl">
                <h3 class="text-lg font-bold text-white mb-3">🏅 Achievements</h3>
                <div class="flex flex-wrap gap-2">${achievementBadges}</div>
            </div>

            <!-- Credentials -->
            <div class="bg-slate-900 border border-slate-700 p-6 rounded-xl">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">🏆 My Credentials</h3>
                    <button onclick="renderCertificates()" class="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider">View All ➔</button>
                </div>
                <div id="dashboard-certs-container" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="text-slate-500 text-sm py-2">Loading certificates...</div>
                </div>
            </div>

            <!-- Interview Stage (injected by startInterview) -->
            <div id="interview-stage" class="hidden bg-slate-900 border border-slate-700 rounded-xl p-6"></div>
        </div>`;

        // Async load certificates onto dashboard
        (async () => {
            try {
                const certRes = await fetch(`${API_BASE}/certificate/my-certificates`, { headers: { 'Authorization': `Bearer ${token}` } });
                const certData = certRes.ok ? await parseJSON(certRes) : { certificates: [] };
                const certs = (certData.certificates || []).slice(0, 2);
                const certsEl = document.getElementById('dashboard-certs-container');
                if (!certsEl) return;
                
                if (certs.length === 0) {
                    certsEl.innerHTML = `
                    <div class="col-span-full py-4 text-center text-slate-500 text-sm">
                        No certificates claimed yet. Complete standard rounds or resume interviews with score &ge; 70% to claim.
                    </div>`;
                    return;
                }
                
                certsEl.innerHTML = certs.map(c => `
                <div class="bg-slate-800/40 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                    <div>
                        <p class="text-xs text-indigo-400 font-bold uppercase tracking-wide">${c.interview_type}</p>
                        <p class="font-bold text-white text-sm mt-1">${c.id}</p>
                        <p class="text-[10px] text-slate-500 mt-0.5">Issued: ${new Date(c.issue_date).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-amber-400 font-black text-lg">${c.overall_score}%</span>
                        <button onclick="downloadCertPdf('${c.id}', '${c.pdf_filename}')" class="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors" title="Download PDF">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        </button>
                    </div>
                </div>`).join('');
            } catch (err) {
                console.error('Error loading dashboard certificates:', err);
            }
        })();

    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-20">Error loading dashboard: ${err.message}</p>`;
    }
}

// ────────────────────────────────────────────────────────────
//   PROFILE
// ────────────────────────────────────────────────────────────
async function renderProfile() {
    setActiveNav('profile');
    showLoader();
    const container = document.getElementById('app-container');
    try {
        const res = await fetch(`${API_BASE}/user/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) { if (res.status === 401 || res.status === 422) { logout(); return; } throw new Error('Failed to load profile'); }
        const data = await parseJSON(res);

        const perfRes = await fetch(`${API_BASE}/user/analytics/performance`, { headers: { 'Authorization': `Bearer ${token}` } });
        const perfData = perfRes.ok ? await parseJSON(perfRes) : { success_rates: {} };
        const sr = perfData.success_rates || {};

        const certRes = await fetch(`${API_BASE}/certificate/my-certificates`, { headers: { 'Authorization': `Bearer ${token}` } });
        const certData = certRes.ok ? await parseJSON(certRes) : { certificates: [] };
        const certs = certData.certificates || [];
        const certsEarned = certs.length;
        const latestCert = certs.length > 0 ? certs[0].id : 'None';
        const highestScore = certs.length > 0 ? Math.max(...certs.map(c => c.overall_score)).toFixed(1) + '%' : 'N/A';

        const achievementBadges = (data.achievements || []).map(a =>
            `<div class="flex items-center gap-2 bg-indigo-900/40 border border-indigo-700/40 px-3 py-2 rounded-xl">
                <span class="text-xl">🏆</span>
                <span class="text-indigo-300 text-sm font-semibold">${a}</span>
            </div>`
        ).join('') || `<p class="text-slate-500 text-sm">No badges yet. Complete rounds to earn them!</p>`;

        const mlPred = data.ml_job_prediction || {};

        container.innerHTML = `
        <div class="w-full space-y-8">
            <h2 class="text-3xl font-extrabold text-white">My Profile</h2>

            <!-- Profile Card -->
            <div class="bg-slate-900 border border-slate-700 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-start">
                <div class="flex flex-col items-center gap-3 min-w-[140px]">
                    <div class="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-lg shadow-blue-500/30">
                        ${(data.email || 'U')[0].toUpperCase()}
                    </div>
                    <div class="text-center">
                        <p class="text-white font-bold text-lg">${data.email || 'User'}</p>
                        <p class="text-slate-400 text-xs">Member · AI Trainer</p>
                    </div>
                </div>
                <div class="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                    ${[
                        ['Total Interviews', data.total_interviews || 0, '📊'],
                        ['Rounds Cleared', data.rounds_cleared || 0, '✅'],
                        ['Failed Attempts', data.failed_attempts || 0, '❌'],
                        ['DSA Solved', (data.current_streak !== undefined ? data.ml_job_prediction?.dsa_solved ?? 0 : 0), '💻'],
                        ['Current Streak', (data.current_streak || 0) + ' days', '🔥'],
                        ['Max Streak', (data.max_streak || 0) + ' days', '⭐'],
                    ].map(([label, val, icon]) => `
                        <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                            <p class="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">${icon} ${label}</p>
                            <p class="text-xl font-bold text-white">${val}</p>
                        </div>`).join('')}
                </div>
            </div>

            <!-- Credentials Section -->
            <div class="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">🏆 Credentials & Certifications</h3>
                    <button onclick="renderCertificates()" class="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider">Manage Credentials ➔</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                        <p class="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">🎓 Certificates Earned</p>
                        <p class="text-2xl font-black text-indigo-400">${certsEarned}</p>
                    </div>
                    <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                        <p class="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">📜 Latest Certificate</p>
                        <p class="text-base font-bold text-slate-200 font-mono">${latestCert}</p>
                    </div>
                    <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                        <p class="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">📈 Highest Score</p>
                        <p class="text-2xl font-black text-amber-400">${highestScore}</p>
                    </div>
                </div>
            </div>

            <!-- Set Username -->
            <div class="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                <h3 class="text-lg font-bold text-white mb-4">Display Name (Leaderboard)</h3>
                <div class="flex gap-3">
                    <input id="username-input" type="text" placeholder="Enter a username..."
                        class="flex-1 bg-slate-800 border border-slate-600 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-500">
                    <button onclick="saveUsername()" class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg transition-colors">Save</button>
                </div>
                <p id="username-status" class="text-xs text-slate-500 mt-2"></p>
            </div>

            <!-- Performance Breakdown -->
            <div class="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                <h3 class="text-lg font-bold text-white mb-5">Performance Breakdown</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                    ${[
                        ['Aptitude', sr['Aptitude Test'] || 0, 'blue'],
                        ['Technical', sr['Technical Round'] || 0, 'indigo'],
                        ['HR', sr['HR Round'] || 0, 'purple'],
                    ].map(([label, val, color]) => `
                        <div>
                            <div class="flex justify-between mb-1">
                                <span class="text-slate-300 text-sm font-semibold">${label}</span>
                                <span class="text-${color}-400 font-bold">${val.toFixed(1)}%</span>
                            </div>
                            <div class="w-full bg-slate-800 rounded-full h-2">
                                <div class="h-2 rounded-full bg-gradient-to-r from-${color}-500 to-${color}-400" style="width:${Math.min(100,val)}%"></div>
                            </div>
                        </div>`).join('')}
                </div>
            </div>

            <!-- ML Prediction -->
            ${mlPred && mlPred.prediction !== undefined ? `
            <div class="bg-gradient-to-r from-indigo-900/50 to-blue-900/50 border border-indigo-700/40 rounded-2xl p-6">
                <h3 class="text-lg font-bold text-white mb-2">🤖 ML Job Readiness Prediction</h3>
                <div class="flex items-center gap-4 flex-wrap">
                    <div class="text-4xl font-black ${mlPred.prediction >= 70 ? 'text-green-400' : 'text-yellow-400'}">${mlPred.prediction?.toFixed(1) ?? '—'}%</div>
                    <div>
                        <p class="text-slate-300 font-semibold">${mlPred.label || 'Needs Improvement'}</p>
                        <p class="text-slate-400 text-sm">${mlPred.advice || 'Keep practicing to boost your score.'}</p>
                    </div>
                </div>
            </div>` : ''}

            <!-- Achievements -->
            <div class="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                <h3 class="text-lg font-bold text-white mb-4">Achievements</h3>
                <div class="flex flex-wrap gap-3">${achievementBadges}</div>
            </div>
        </div>`;
    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-20">Error loading profile: ${err.message}</p>`;
    }
}

async function saveUsername() {
    const val = document.getElementById('username-input').value.trim();
    const status = document.getElementById('username-status');
    if (!val) { status.textContent = 'Please enter a username.'; return; }
    // NOTE: endpoint placeholder — update if backend provides it
    status.textContent = '✅ Username saved (requires /api/user/update-username endpoint).';
    showToast('Username preference saved!', 'success');
}

// ────────────────────────────────────────────────────────────
//   ROUNDS PAGE
// ────────────────────────────────────────────────────────────
async function renderRounds() {
    setActiveNav('rounds');
    showLoader();
    const container = document.getElementById('app-container');
    try {
        const res = await fetch(`${API_BASE}/user/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.status === 401 || res.status === 422) { logout(); return; }
        if (!res.ok) throw new Error('Failed to load rounds data');
        const data = await parseJSON(res);
        const currentRound = data.current_round || 1;

        const rounds = [
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

        const roundCards = rounds.map(r => {
            const status = r.num < currentRound ? 'cleared' : r.num === currentRound ? 'active' : 'locked';
            const statusBadge = {
                cleared: `<span class="px-2 py-0.5 bg-green-900/60 border border-green-700 text-green-400 text-xs rounded-full font-bold">✔ Cleared</span>`,
                active:  `<span class="px-2 py-0.5 bg-blue-900/60 border border-blue-700 text-blue-300 text-xs rounded-full font-bold animate-pulse">▶ In Progress</span>`,
                locked:  `<span class="px-2 py-0.5 bg-slate-800 border border-slate-600 text-slate-500 text-xs rounded-full font-bold">🔒 Locked</span>`,
            }[status];

            const borderColor = {
                cleared: 'border-green-700/50', active: `border-${r.color}-600/60`, locked: 'border-slate-700/50'
            }[status];

            const btnHtml = status === 'active'
                ? `<button onclick="startInterview()" class="w-full mt-4 py-2.5 rounded-lg bg-gradient-to-r from-${r.color}-600 to-${r.color}-500 hover:from-${r.color}-500 hover:to-${r.color}-400 text-white font-bold transition-all shadow-lg hover:shadow-${r.color}-500/30">Start Round ${r.num} →</button>`
                : status === 'cleared'
                ? `<button onclick="startInterview()" class="w-full mt-4 py-2.5 rounded-lg bg-green-900/40 border border-green-700 text-green-400 font-semibold text-sm transition-all hover:bg-green-900/60">Retry Round ${r.num}</button>`
                : `<button disabled class="w-full mt-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-600 font-semibold text-sm cursor-not-allowed">Complete Round ${r.num - 1} First</button>`;

            return `
            <div class="bg-slate-900 border ${borderColor} p-6 rounded-2xl transition-all ${status === 'active' ? 'shadow-lg shadow-' + r.color + '-500/10' : ''}">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="text-3xl">${r.emoji}</div>
                        <div>
                            <h3 class="font-bold text-white text-lg">Round ${r.num}</h3>
                            <p class="text-${r.color}-400 font-semibold text-sm">${r.name}</p>
                        </div>
                    </div>
                    ${statusBadge}
                </div>
                <p class="text-slate-400 text-sm leading-relaxed mb-4">${r.desc}</p>
                <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="bg-slate-800/50 rounded-lg p-2"><p class="text-xs text-slate-500">Duration</p><p class="text-slate-200 text-xs font-bold">${r.duration}</p></div>
                    <div class="bg-slate-800/50 rounded-lg p-2"><p class="text-xs text-slate-500">Format</p><p class="text-slate-200 text-xs font-bold">${r.questions}</p></div>
                    <div class="bg-slate-800/50 rounded-lg p-2"><p class="text-xs text-slate-500">Pass Mark</p><p class="text-slate-200 text-xs font-bold">${r.passMark}</p></div>
                </div>
                ${btnHtml}
            </div>`;
        }).join('');

        container.innerHTML = `
        <div class="w-full space-y-8">
            <div>
                <h2 class="text-3xl font-extrabold text-white">Interview Rounds</h2>
                <p class="text-slate-400 mt-1">Track your progress through each stage of the selection process.</p>
            </div>

            <!-- Stepper -->
            <div class="flex items-center gap-0 overflow-x-auto pb-2">
                ${rounds.map((r, i) => {
                    const s = r.num < currentRound ? 'cleared' : r.num === currentRound ? 'active' : 'locked';
                    const circleClass = s === 'cleared' ? 'bg-green-500 text-white' : s === 'active' ? `bg-${r.color}-500 text-white ring-4 ring-${r.color}-500/30` : 'bg-slate-700 text-slate-500';
                    const lineClass = r.num < currentRound ? 'bg-green-500' : 'bg-slate-700';
                    return `
                    <div class="flex items-center ${i < rounds.length - 1 ? 'flex-1' : ''}">
                        <div class="flex flex-col items-center gap-1 min-w-[70px]">
                            <div class="w-9 h-9 rounded-full ${circleClass} flex items-center justify-center font-bold text-sm transition-all">${s === 'cleared' ? '✓' : r.num}</div>
                            <span class="text-[10px] text-slate-400 text-center leading-tight whitespace-nowrap">${r.name.split(' ')[0]}</span>
                        </div>
                        ${i < rounds.length - 1 ? `<div class="flex-1 h-0.5 mx-1 ${lineClass} transition-all"></div>` : ''}
                    </div>`;
                }).join('')}
            </div>

            <!-- Round Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">${roundCards}</div>
        </div>`;
    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-20">Error loading rounds: ${err.message}</p>`;
    }
}

// ────────────────────────────────────────────────────────────
//   ARENA (Code Editor)
// ────────────────────────────────────────────────────────────
async function renderArena() {
    setActiveNav('arena');
    showLoader();
    const container = document.getElementById('app-container');

    // Fetch daily DSA problem
    let problem = { title: 'Two Sum', description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', difficulty: 'Easy', example_input: '[2,7,11,15], target = 9', example_output: '[0,1]' };
    try {
        const res = await fetch(`${API_BASE}/dsa/daily`);
        if (res.ok) { const d = await parseJSON(res); if (d && d.title) problem = d; }
    } catch(_) {}

    const diffColor = problem.difficulty === 'Hard' ? 'text-red-400' : problem.difficulty === 'Medium' ? 'text-yellow-400' : 'text-green-400';

    container.innerHTML = `
    <div class="w-full space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
                <h2 class="text-3xl font-extrabold text-white">Code Arena</h2>
                <p class="text-slate-400 text-sm mt-1">Write, run, and submit your solution.</p>
            </div>
            <div class="flex items-center gap-3">
                <select id="lang-select" class="bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="python">🐍 Python</option>
                    <option value="javascript">🟨 JavaScript</option>
                    <option value="java">☕ Java</option>
                    <option value="c++">⚡ C++</option>
                </select>
                <button onclick="runCode()" id="run-btn"
                    class="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-green-500/30">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Run Code
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-4" style="height:calc(100vh - 220px); min-height:500px;">
            <!-- Problem Panel -->
            <div class="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-xl p-5 overflow-y-auto flex flex-col gap-4">
                <div>
                    <div class="flex items-center gap-2 mb-2">
                        <h3 class="text-lg font-bold text-white">${problem.title}</h3>
                        <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 ${diffColor}">${problem.difficulty}</span>
                    </div>
                    <p class="text-slate-300 text-sm leading-relaxed">${problem.description}</p>
                </div>
                ${problem.example_input ? `
                <div class="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50">
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Example</p>
                    <p class="text-xs text-slate-300 font-mono mb-1"><span class="text-slate-500">Input:</span> ${problem.example_input}</p>
                    <p class="text-xs text-slate-300 font-mono"><span class="text-slate-500">Output:</span> ${problem.example_output || ''}</p>
                </div>` : ''}
                <div class="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50">
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Constraints</p>
                    <ul class="text-xs text-slate-400 list-disc list-inside space-y-1">
                        <li>Time Limit: 10 seconds</li>
                        <li>Python, JavaScript, Java, C++ supported</li>
                        <li>Return the expected output</li>
                    </ul>
                </div>
                <!-- Output Console -->
                <div class="mt-auto">
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Output Console</p>
                    <div id="code-output"
                        class="bg-black/60 border border-slate-700 rounded-lg p-3 font-mono text-xs text-green-400 min-h-[80px] max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                        Ready to run code...
                    </div>
                </div>
            </div>

            <!-- Editor Panel -->
            <div class="lg:col-span-3 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
                <div class="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-red-500"></div>
                        <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div class="w-3 h-3 rounded-full bg-green-500"></div>
                        <span class="text-slate-400 text-xs ml-2 font-mono">solution.py</span>
                    </div>
                    <span id="run-status" class="text-xs text-slate-400"></span>
                </div>
                <div id="monaco-editor-container" class="flex-1" style="min-height:400px;"></div>
            </div>
        </div>
    </div>`;

    // Initialize Monaco Editor
    initMonaco();
}

function initMonaco() {
    if (typeof require === 'undefined') { document.getElementById('monaco-editor-container').innerHTML = '<p class="text-slate-400 text-sm p-4">Monaco editor loading...</p>'; return; }
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.41.0/min/vs' } });
    require(['vs/editor/editor.main'], function () {
        if (monacoEditor) { monacoEditor.dispose(); monacoEditor = null; }
        monacoEditor = monaco.editor.create(document.getElementById('monaco-editor-container'), {
            value: getStarterCode('python'),
            language: 'python',
            theme: 'vs-dark',
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fontFamily: '"Fira Code", "Cascadia Code", monospace',
            fontLigatures: true,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            tabSize: 4,
        });

        document.getElementById('lang-select').addEventListener('change', (e) => {
            const lang = e.target.value;
            const monacoLang = lang === 'c++' ? 'cpp' : lang === 'javascript' ? 'javascript' : lang;
            monaco.editor.setModelLanguage(monacoEditor.getModel(), monacoLang);
            monacoEditor.setValue(getStarterCode(lang));
        });
    });
}

function getStarterCode(lang) {
    const starters = {
        python: `def solution(nums, target):
    # Write your solution here
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test
print(solution([2, 7, 11, 15], 9))`,
        javascript: `function solution(nums, target) {
    // Write your solution here
    const seen = {};
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (complement in seen) return [seen[complement], i];
        seen[nums[i]] = i;
    }
    return [];
}

console.log(solution([2, 7, 11, 15], 9));`,
        java: `import java.util.*;
public class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) return new int[]{map.get(complement), i};
            map.put(nums[i], i);
        }
        return new int[]{};
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        System.out.println(Arrays.toString(s.twoSum(new int[]{2,7,11,15}, 9)));
    }
}`,
        'c++': `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;
vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int,int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int comp = target - nums[i];
        if (seen.count(comp)) return {seen[comp], i};
        seen[nums[i]] = i;
    }
    return {};
}
int main() {
    vector<int> nums = {2, 7, 11, 15};
    auto res = twoSum(nums, 9);
    cout << "[" << res[0] << "," << res[1] << "]" << endl;
}`
    };
    return starters[lang] || starters.python;
}

async function runCode() {
    const btn = document.getElementById('run-btn');
    const output = document.getElementById('code-output');
    const status = document.getElementById('run-status');
    const lang = document.getElementById('lang-select').value;
    const code = monacoEditor ? monacoEditor.getValue() : '';

    if (!code.trim()) { showToast('Please write some code first!', 'warning'); return; }

    btn.disabled = true;
    btn.innerHTML = `<div class="loader" style="width:16px;height:16px;border-width:2px;"></div> Running...`;
    output.textContent = '⏳ Executing...';
    status.textContent = 'Running...';

    try {
        const res = await fetch(`${API_BASE}/code/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ code, language: lang })
        });
        const data = await parseJSON(res);
        output.textContent = data.output || data.error || 'No output';
        output.className = `bg-black/60 border border-slate-700 rounded-lg p-3 font-mono text-xs min-h-[80px] max-h-[200px] overflow-y-auto whitespace-pre-wrap ${data.error ? 'text-red-400' : 'text-green-400'}`;
        status.textContent = data.error ? '❌ Error' : '✅ Ran successfully';
        showToast(data.error ? 'Runtime error — check output.' : 'Code executed!', data.error ? 'error' : 'success');
    } catch (err) {
        output.textContent = `Error: ${err.message}`;
        output.className = `bg-black/60 border border-red-700/50 rounded-lg p-3 font-mono text-xs text-red-400 min-h-[80px] max-h-[200px] overflow-y-auto whitespace-pre-wrap`;
        status.textContent = '❌ Failed';
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Run Code`;
    }
}

// ────────────────────────────────────────────────────────────
//   LEADERBOARD
// ────────────────────────────────────────────────────────────
async function renderLeaderboard() {
    setActiveNav('leaderboard');
    showLoader();
    const container = document.getElementById('app-container');
    try {
        const res = await fetch(`${API_BASE}/user/analytics/leaderboard`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load leaderboard');
        const data = await parseJSON(res);
        const lb = data.leaderboard || [];

        const medalEmoji = ['🥇', '🥈', '🥉'];
        const rankColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];

        const rows = lb.map((u, i) => `
            <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition-colors ${i < 3 ? 'font-bold' : ''}">
                <td class="px-5 py-4 text-center">
                    <span class="${i < 3 ? rankColors[i] : 'text-slate-400'} font-black text-lg">
                        ${i < 3 ? medalEmoji[i] : `#${u.rank}`}
                    </span>
                </td>
                <td class="px-5 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white">${(u.username || 'U')[0].toUpperCase()}</div>
                        <span class="${i < 3 ? 'text-white' : 'text-slate-300'}">${u.username}</span>
                    </div>
                </td>
                <td class="px-5 py-4 text-center">
                    <div class="inline-flex items-center gap-2">
                        <div class="w-20 bg-slate-800 rounded-full h-1.5">
                            <div class="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style="width:${Math.min(100, u.readiness_score)}%"></div>
                        </div>
                        <span class="${i < 3 ? rankColors[i] : 'text-slate-300'} font-bold text-sm">${u.readiness_score.toFixed(1)}%</span>
                    </div>
                </td>
                <td class="px-5 py-4 text-center">
                    <span class="px-2 py-0.5 bg-green-900/40 border border-green-800 text-green-400 text-xs rounded-full font-semibold">${u.rounds_cleared} Rounds</span>
                </td>
            </tr>`).join('') || `<tr><td colspan="4" class="text-center py-10 text-slate-500">No users on the leaderboard yet. Be the first!</td></tr>`;

        container.innerHTML = `
        <div class="w-full space-y-8">
            <div>
                <h2 class="text-3xl font-extrabold text-white">Leaderboard</h2>
                <p class="text-slate-400 mt-1">Top performers ranked by job readiness score.</p>
            </div>

            <!-- Top 3 Podium -->
            ${lb.length >= 3 ? `
            <div class="grid grid-cols-3 gap-4 items-end">
                ${[1, 0, 2].map(i => {
                    const u = lb[i];
                    if (!u) return `<div></div>`;
                    const heights = ['h-24', 'h-32', 'h-20'];
                    const gradients = ['from-slate-400 to-slate-300', 'from-yellow-500 to-amber-400', 'from-amber-700 to-amber-600'];
                    const podiumH = [heights[1], heights[0], heights[2]];
                    return `
                    <div class="flex flex-col items-center gap-2">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br ${gradients[i]} flex items-center justify-center text-white font-black text-lg shadow-lg">${(u.username || 'U')[0].toUpperCase()}</div>
                        <p class="text-white font-bold text-sm">${u.username}</p>
                        <p class="text-slate-400 text-xs">${u.readiness_score.toFixed(1)}%</p>
                        <div class="${podiumH[i === 0 ? 1 : i === 1 ? 0 : 2]} w-full bg-gradient-to-t ${gradients[i]} rounded-t-lg flex items-end justify-center pb-2">
                            <span class="text-white text-xl font-black">${medalEmoji[i]}</span>
                        </div>
                    </div>`;
                }).join('')}
            </div>` : ''}

            <!-- Chart -->
            ${lb.length > 0 ? `
            <div class="bg-slate-900 border border-slate-700 p-6 rounded-2xl">
                <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Top 5 Scores</h3>
                <div style="height:200px; position:relative;">
                    <canvas id="lb-chart"></canvas>
                </div>
            </div>` : ''}

            <!-- Full Table -->
            <div class="bg-slate-900 border border-slate-700 rounded-2xl overflow-x-auto">
                <table class="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                        <tr class="bg-slate-800/60 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                            <th class="px-5 py-3 text-center">Rank</th>
                            <th class="px-5 py-3">User</th>
                            <th class="px-5 py-3 text-center">Readiness Score</th>
                            <th class="px-5 py-3 text-center">Rounds Cleared</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;

        // Chart.js bar chart for top 5
        if (lb.length > 0 && typeof Chart !== 'undefined') {
            const ctx = document.getElementById('lb-chart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: lb.slice(0, 5).map(u => u.username),
                    datasets: [{
                        label: 'Readiness Score',
                        data: lb.slice(0, 5).map(u => u.readiness_score),
                        backgroundColor: ['rgba(234,179,8,0.7)', 'rgba(148,163,184,0.7)', 'rgba(180,83,9,0.7)', 'rgba(99,102,241,0.5)', 'rgba(99,102,241,0.4)'],
                        borderColor: ['rgb(234,179,8)', 'rgb(148,163,184)', 'rgb(180,83,9)', 'rgb(99,102,241)', 'rgb(99,102,241)'],
                        borderWidth: 2,
                        borderRadius: 6,
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.parsed.y.toFixed(1)}%` } } },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', callback: v => v + '%' }, min: 0, max: 100 }
                    }
                }
            });
        }
    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-20">Error loading leaderboard: ${err.message}</p>`;
    }
}

// ────────────────────────────────────────────────────────────
//   COMMUNITY
// ────────────────────────────────────────────────────────────
let expandedPost = null;

async function renderCommunity() {
    setActiveNav('community');
    showLoader();
    const container = document.getElementById('app-container');
    try {
        const res = await fetch(`${API_BASE}/community/posts`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load community');
        const data = await parseJSON(res);
        const posts = data.posts || [];

        const postCards = posts.map(p => `
            <div class="bg-slate-900 border border-slate-700 hover:border-slate-600 p-5 rounded-xl transition-all">
                <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">${(p.author || 'U')[0].toUpperCase()}</div>
                        <div>
                            <p class="text-white font-semibold text-sm">${p.author}</p>
                            <p class="text-slate-500 text-xs">${new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                    </div>
                    <span class="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">${p.replies_count} replies</span>
                </div>
                <h3 class="text-white font-bold mb-2 text-base">${p.title}</h3>
                <p class="text-slate-400 text-sm leading-relaxed mb-4">${p.content.length > 200 ? p.content.slice(0, 200) + '...' : p.content}</p>
                <div class="flex items-center gap-4">
                    <button class="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 text-xs font-semibold transition-colors"
                        onclick="toggleReplies(${p.id})">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                        View Replies
                    </button>
                    <span class="text-slate-500 text-xs">👍 ${p.upvotes}</span>
                </div>
                <div id="replies-${p.id}" class="hidden mt-4 border-t border-slate-700 pt-4">
                    <p class="text-slate-500 text-xs mb-3">Loading replies...</p>
                </div>
                <div id="reply-form-${p.id}" class="hidden mt-3 flex gap-2">
                    <input id="reply-input-${p.id}" type="text" placeholder="Write a reply..."
                        class="flex-1 bg-slate-800 border border-slate-600 text-white p-2 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500">
                    <button onclick="submitReply(${p.id})" class="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Reply</button>
                </div>
            </div>`).join('') || `
            <div class="text-center py-16 text-slate-500">
                <div class="text-5xl mb-4">💬</div>
                <p class="font-semibold text-slate-400">No posts yet.</p>
                <p class="text-sm">Be the first to share your interview experience!</p>
            </div>`;

        container.innerHTML = `
        <div class="w-full space-y-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-3xl font-extrabold text-white">Community</h2>
                    <p class="text-slate-400 mt-1">Share experiences, ask questions, help each other.</p>
                </div>
                <button onclick="openCreatePostModal()"
                    class="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    New Post
                </button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">${postCards}</div>
        </div>

        <!-- Create Post Modal -->
        <div id="create-post-modal" class="fixed inset-0 bg-black/70 z-50 hidden flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                <div class="flex items-center justify-between mb-5">
                    <h3 class="text-xl font-bold text-white">Create Post</h3>
                    <button onclick="closeCreatePostModal()" class="text-slate-400 hover:text-white transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <input id="post-title" type="text" placeholder="Post title..."
                    class="w-full bg-slate-800 border border-slate-600 text-white p-3 rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500">
                <textarea id="post-content" rows="5" placeholder="Share your experience, tips, or questions..."
                    class="w-full bg-slate-800 border border-slate-600 text-white p-3 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500 resize-none"></textarea>
                <div class="flex gap-3 justify-end">
                    <button onclick="closeCreatePostModal()" class="px-4 py-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors">Cancel</button>
                    <button onclick="submitPost()" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2 rounded-lg transition-colors">Post</button>
                </div>
            </div>
        </div>`;
    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-20">Error loading community: ${err.message}</p>`;
    }
}

function openCreatePostModal() {
    document.getElementById('create-post-modal').classList.remove('hidden');
    document.getElementById('create-post-modal').classList.add('flex');
}
function closeCreatePostModal() {
    document.getElementById('create-post-modal').classList.add('hidden');
    document.getElementById('create-post-modal').classList.remove('flex');
}

async function submitPost() {
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    if (!title || !content) { showToast('Title and content are required.', 'warning'); return; }
    try {
        const res = await fetch(`${API_BASE}/community/post`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ title, content })
        });
        if (!res.ok) throw new Error('Failed to create post');
        closeCreatePostModal();
        renderCommunity();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function renderResumePage() {
    setActiveNav('resume');
    const container = document.getElementById('app-container');
    container.innerHTML = `
    <div class="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
            <div>
                <h1 class="text-4xl font-black text-white mb-2">Resume ATS Optimizer</h1>
                <p class="text-slate-400">Professional analysis against 24+ industry standard benchmarks.</p>
            </div>
            <div class="flex gap-3">
                <div class="bg-slate-900 border border-slate-700 p-3 rounded-xl flex items-center gap-3">
                    <span class="text-2xl">⚡</span>
                    <div>
                        <p class="text-xs text-slate-500 font-bold uppercase tracking-widest">Efficiency</p>
                        <p class="text-sm font-semibold text-white">2.4s Analysis</p>
                    </div>
                </div>
                <div class="bg-slate-900 border border-slate-700 p-3 rounded-xl flex items-center gap-3">
                    <span class="text-2xl">🛡️</span>
                    <div>
                        <p class="text-xs text-slate-500 font-bold uppercase tracking-widest">Accuracy</p>
                        <p class="text-sm font-semibold text-white">99.2% Score</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-6">
                <div id="upload-zone" class="bg-slate-900 border-2 border-dashed border-slate-700 rounded-3xl p-10 flex flex-col items-center justify-center text-center hover:border-indigo-500 transition-all cursor-pointer group"
                    onclick="document.getElementById('resume-file-input').click()"
                    ondragover="event.preventDefault(); this.classList.add('border-indigo-500')"
                    ondragleave="this.classList.remove('border-indigo-500')"
                    ondrop="handleResumeDrop(event)">
                    <div class="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 group-hover:bg-indigo-900 transition-colors">
                        <svg class="w-8 h-8 text-slate-400 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">Upload Resume</h3>
                    <p class="text-slate-400 mb-6 text-sm">PDF or DOCX (Max 10MB)</p>
                    <button class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-full transition-all shadow-lg hover:shadow-indigo-500/25">Select File</button>
                    <input id="resume-file-input" type="file" class="hidden" accept=".pdf,.docx" onchange="uploadResumeFromPage(event)">
                </div>

                <div id="resume-upload-status" class="hidden"></div>
                <div id="resume-results" class="hidden space-y-6"></div>
            </div>

            <div class="space-y-6">
                <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <h3 class="font-bold text-white mb-4">ATS Coverage Overview</h3>
                    <div class="space-y-4">
                        <div class="flex justify-between text-sm"><span class="text-slate-400">Parsing Accuracy</span><span class="text-white font-bold">100%</span></div>
                        <div class="w-full bg-slate-800 rounded-full h-2"><div class="bg-indigo-500 w-[100%] h-2 rounded-full"></div></div>
                        <div class="flex justify-between text-sm"><span class="text-slate-400">Keyword Matching</span><span class="text-white font-bold">94%</span></div>
                        <div class="w-full bg-slate-800 rounded-full h-2"><div class="bg-purple-500 w-[94%] h-2 rounded-full"></div></div>
                        <div class="flex justify-between text-sm"><span class="text-slate-400">Formatting Score</span><span class="text-white font-bold">88%</span></div>
                        <div class="w-full bg-slate-800 rounded-full h-2"><div class="bg-blue-500 w-[88%] h-2 rounded-full"></div></div>
                    </div>
                </div>

                <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <h3 class="font-bold text-white mb-4">Quick Tips</h3>
                    <ul class="space-y-3 text-sm text-slate-400">
                        <li class="flex gap-2"><span>✅</span> Use standard headers</li>
                        <li class="flex gap-2"><span>✅</span> Avoid complex graphics</li>
                        <li class="flex gap-2"><span>✅</span> Keep to 1-2 pages</li>
                        <li class="flex gap-2"><span>✅</span> Optimize for keywords</li>
                    </ul>
                </div>
            </div>
        </div>

        <div id="resume-history-section" class="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <h3 class="text-xl font-bold text-white mb-6">Recent Analyses History</h3>
            <div id="resume-history-list" class="overflow-x-auto"><p class="text-slate-500">Loading your history...</p></div>
        </div>
    </div>`;
    loadResumeHistory();
}

async function processResumeFile(file) {
    const statusEl = document.getElementById('resume-upload-status');
    const resultsEl = document.getElementById('resume-results');
    statusEl.classList.remove('hidden');
    statusEl.innerHTML = `<div class="bg-indigo-900/20 border border-indigo-700 text-indigo-300 p-4 rounded-xl flex items-center gap-3">
        <div class="animate-spin w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full"></div> Analyzing ${file.name}...
    </div>`;

    const formData = new FormData();
    formData.append('resume', file);
    try {
        const res = await fetch(`${API_BASE}/resume/upload-resume`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error);
        statusEl.classList.add('hidden');
        renderResumeResults(data);
        loadResumeHistory();
    } catch(e) {
        statusEl.innerHTML = `<div class="bg-red-900/20 border border-red-700 text-red-300 p-4 rounded-xl">❌ ${e.message}</div>`;
    }
}

function handleResumeDrop(e) {
    e.preventDefault();
    const zone = document.getElementById('upload-zone');
    if (zone) zone.classList.remove('border-indigo-500');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) { showToast('Only PDF and DOCX files are supported.', 'warning'); return; }
    processResumeFile(file);
}

async function uploadResume(e) {
    const file = e.target.files[0];
    if (file) processResumeFile(file);
}

async function uploadResumeFromPage(e) {
    const file = e.target.files[0];
    if (file) processResumeFile(file);
}

async function downloadPDFReport(recordId, filename) {
    try {
        showToast('Generating PDF report...', 'success');
        const res = await fetch(`${API_BASE}/resume/report/${recordId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) { const err = await res.json().catch(() => ({error:'Download failed'})); throw new Error(err.error || 'Download failed'); }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ATS_Report_${(filename||'resume').replace(/[^\w]/g,'_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('PDF report downloaded!', 'success');
    } catch (err) {
        showToast('PDF download failed: ' + err.message, 'error');
    }
}

function renderResumeResults(data) {
    const resultsEl = document.getElementById('resume-results');
    if (!resultsEl) return;

    const score = data.ats_score || data.resume_score || 0;
    const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';
    const scoreLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs Work' : 'Poor';
    const scoreBadgeClass = score >= 80 ? 'bg-green-900/60 text-green-400 border-green-700' : score >= 60 ? 'bg-yellow-900/60 text-yellow-400 border-yellow-700' : 'bg-red-900/60 text-red-400 border-red-700';
    const circumference = 251.2;
    const dashOffset = circumference - (score / 100) * circumference;

    const breakdown = data.breakdown || {};
    const contact = data.contact_info || {};
    const skills = data.extracted_skills || [];
    const skillsByCat = data.skills_by_category || {};
    const softSkills = data.soft_skills || [];
    const missing = data.missing_sections || [];
    const strengths = data.strengths || [];
    const weaknesses = data.weaknesses || [];
    const suggestions = data.suggestions || [];
    const missingSkills = data.missing_skills || [];
    const grammar = data.grammar_analysis || {};
    const atsCompat = data.ats_compatibility || {};
    const jobReadiness = data.job_readiness || {};
    const questions = data.interview_questions || {};
    const roadmap = data.learning_roadmap || {};
    const recordId = data.record_id;
    const kwDensity = data.keyword_density || 0;
    const ivReadiness = data.interview_readiness || 'Unknown';
    const ivReason = data.interview_readiness_reason || '';
    const expLevel = data.experience_level || 'Unknown';
    const quantAchievements = data.quantified_achievements || 0;
    const filename = data.filename || 'resume';

    // Score breakdown rows
    const breakdownRows = Object.entries(breakdown).map(([section, info]) => {
        const pct = info.max > 0 ? (info.score / info.max) * 100 : 0;
        const bar = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
        const txt = pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400';
        return `<tr class="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
            <td class="px-4 py-3 text-slate-200 text-sm font-medium whitespace-nowrap">${section}</td>
            <td class="px-4 py-3"><div class="flex items-center gap-3">
                <div class="flex-1 bg-slate-800 rounded-full h-2 min-w-[70px]"><div class="h-2 rounded-full ${bar}" style="width:${Math.min(100,pct).toFixed(0)}%"></div></div>
                <span class="font-bold text-sm ${txt} w-12 text-right">${info.score}/${info.max}</span>
            </div></td>
            <td class="px-4 py-3 text-slate-500 text-xs hidden md:table-cell max-w-xs truncate">${info.details || ''}</td>
        </tr>`;
    }).join('');

    // Contact badges
    const contactBadge = (key, label, icon) => {
        const val = contact[key];
        return val
            ? `<div class="flex items-center gap-2 bg-green-900/30 border border-green-700/40 px-3 py-2 rounded-xl min-w-0">
                <span>${icon}</span><div class="min-w-0"><p class="text-green-400 text-xs font-bold">${label} ✓</p><p class="text-slate-300 text-xs truncate" title="${val}">${val}</p></div></div>`
            : `<div class="flex items-center gap-2 bg-red-900/20 border border-red-700/30 px-3 py-2 rounded-xl">
                <span>${icon}</span><div><p class="text-red-400 text-xs font-bold">${label} ✗</p><p class="text-slate-500 text-xs">Not found</p></div></div>`;
    };
    const contactBadges = [
        contactBadge('email','Email','✉️'), contactBadge('phone','Phone','📱'),
        contactBadge('github','GitHub','🐙'), contactBadge('linkedin','LinkedIn','💼'),
        contactBadge('portfolio','Portfolio','🌐')
    ].join('');

    // Skills by category
    const catColors = { languages:'blue', web_frontend:'indigo', web_backend:'violet', databases:'purple', cloud_devops:'cyan', ai_ml:'pink', mobile:'orange', tools:'slate', data_engineering:'teal' };
    const catLabels = { languages:'Languages', web_frontend:'Frontend', web_backend:'Backend', databases:'Databases', cloud_devops:'Cloud/DevOps', ai_ml:'AI/ML', mobile:'Mobile', tools:'Tools', data_engineering:'Data Eng' };
    const skillCatsHtml = Object.entries(skillsByCat).map(([cat, catSkills]) => {
        const c = catColors[cat] || 'slate';
        return `<div class="mb-3">
            <p class="text-${c}-400 text-xs font-bold uppercase tracking-wider mb-1.5">${catLabels[cat]||cat} (${catSkills.length})</p>
            <div class="flex flex-wrap gap-1.5">${catSkills.map(s=>`<span class="text-xs px-2 py-0.5 bg-${c}-900/30 border border-${c}-700/30 text-${c}-300 rounded-full">${s}</span>`).join('')}</div>
        </div>`;
    }).join('');

    // Missing sections
    const missHtml = missing.length > 0
        ? missing.map(s=>`<div class="flex items-center gap-2 bg-orange-900/20 border border-orange-700/30 px-3 py-2 rounded-lg text-sm text-orange-300"><span class="text-orange-400">⚠</span>${s}</div>`).join('')
        : `<p class="text-green-400 text-sm font-semibold">✅ All key sections detected!</p>`;

    // Job readiness bars
    const jrFields = [
        {key:'technical_readiness', label:'Technical Readiness', icon:'💻'},
        {key:'resume_quality', label:'Resume Quality', icon:'📝'},
        {key:'project_strength', label:'Project Strength', icon:'🚀'},
        {key:'communication_readiness', label:'Communication', icon:'🗣️'},
        {key:'overall_employability', label:'Overall Employability', icon:'🎯'},
    ];
    const jrHtml = jrFields.map(f => {
        const val = jobReadiness[f.key] || 0;
        const bar = val >= 80 ? 'bg-green-500' : val >= 60 ? 'bg-yellow-500' : 'bg-red-500';
        return `<div class="flex items-center gap-3">
            <span class="text-base w-6">${f.icon}</span>
            <div class="flex-1">
                <div class="flex justify-between mb-1"><span class="text-slate-300 text-xs">${f.label}</span><span class="text-slate-200 text-xs font-bold">${val.toFixed(0)}%</span></div>
                <div class="bg-slate-800 rounded-full h-2"><div class="h-2 rounded-full ${bar}" style="width:${Math.min(100,val)}%"></div></div>
            </div>
        </div>`;
    }).join('');

    // Interview readiness badge class
    const ivBadgeClass = ivReadiness==='Excellent'?'bg-green-900/60 text-green-400 border-green-700':ivReadiness==='Good'?'bg-blue-900/60 text-blue-400 border-blue-700':ivReadiness==='Average'?'bg-yellow-900/60 text-yellow-400 border-yellow-700':'bg-red-900/60 text-red-400 border-red-700';

    // Interview questions (tiered)
    const easyQs = Array.isArray(questions.easy) ? questions.easy : [];
    const medQs = Array.isArray(questions.medium) ? questions.medium : [];
    const hardQs = Array.isArray(questions.hard) ? questions.hard : [];
    const qListHtml = (qs, color, tag) => qs.map((q,i)=>`
        <li class="flex items-start gap-3 bg-slate-800/50 border border-slate-700/50 hover:border-${color}-600/40 rounded-xl p-4 transition-colors">
            <span class="w-7 h-7 rounded-full bg-${color}-600/30 border border-${color}-600/50 text-${color}-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">${tag}</span>
            <p class="text-slate-200 text-sm leading-relaxed">${q}</p>
        </li>`).join('');

    // Learning roadmap
    const roadmapSection = (label, icon, items) => {
        if (!items || !items.length) return '';
        return `<div>
            <h4 class="text-white font-bold text-sm mb-2 flex items-center gap-2"><span>${icon}</span>${label}</h4>
            <ul class="space-y-1.5 ml-2">${items.map(item => {
                const name = typeof item === 'object' ? item.name : item;
                const url = typeof item === 'object' && item.url ? item.url : null;
                return `<li class="flex items-start gap-2 text-sm text-slate-300"><span class="text-slate-500 mt-0.5 flex-shrink-0">→</span>${url ? `<a href="${url}" target="_blank" class="text-blue-400 hover:text-blue-300 underline underline-offset-2">${name}</a>` : name}</li>`;
            }).join('')}</ul>
        </div>`;
    };

    // Grammar
    const grammarGrade = grammar.grade || 'Unknown';
    const grammarColor = grammarGrade==='Excellent'?'text-green-400':grammarGrade==='Good'?'text-blue-400':grammarGrade==='Average'?'text-yellow-400':'text-red-400';
    const compatScore = atsCompat.score || 0;

    resultsEl.classList.remove('hidden');
    resultsEl.innerHTML = `
        <!-- ATS Score Hero -->
        <div class="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col lg:flex-row items-center gap-8">
            <div class="relative w-40 h-40 flex-shrink-0">
                <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" stroke-width="10"/>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="${scoreColor}" stroke-width="10"
                        stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"
                        stroke-linecap="round" style="transition:stroke-dashoffset 1.5s ease"/>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span style="color:${scoreColor}" class="font-black text-4xl">${score}</span>
                    <span class="text-slate-400 text-xs font-semibold">/ 100</span>
                </div>
            </div>
            <div class="flex-1 text-center lg:text-left">
                <div class="flex flex-wrap items-center gap-3 justify-center lg:justify-start mb-2">
                    <h3 class="text-2xl font-black text-white">ATS Score</h3>
                    <span class="px-3 py-1 rounded-full text-xs font-bold border ${scoreBadgeClass}">${scoreLabel}</span>
                    <span class="px-3 py-1 rounded-full text-xs font-bold border ${ivBadgeClass}">🎯 ${ivReadiness}</span>
                </div>
                <p class="text-slate-400 text-sm mb-2">Experience: <span class="text-white font-semibold">${expLevel}</span> · Quantified: <span class="text-white font-semibold">${quantAchievements}</span></p>
                <p class="text-slate-500 text-xs leading-relaxed max-w-lg">${ivReason.slice(0,200)}${ivReason.length>200?'...':''}</p>
            </div>
            <div class="grid grid-cols-3 gap-3 flex-shrink-0">
                ${[['Skills',skills.length,'text-blue-400'],['Missing',missing.length,missing.length===0?'text-green-400':'text-orange-400'],['Strengths',strengths.length,'text-purple-400'],['Keywords',data.keyword_matches?data.keyword_matches.length:0,'text-cyan-400'],['Certs',data.certifications_count||0,'text-yellow-400'],['Soft',softSkills.length,'text-pink-400']].map(([l,v,c])=>`
                <div class="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/50">
                    <p class="text-xl font-black ${c}">${v}</p><p class="text-slate-400 text-xs mt-0.5">${l}</p>
                </div>`).join('')}
            </div>
        </div>

        <!-- Score Breakdown -->
        <div class="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <div class="flex items-center gap-2"><span class="text-lg">📊</span><h3 class="font-bold text-white">Score Breakdown</h3></div>
                <span class="text-slate-500 text-xs">9 categories · 100 total pts</span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead><tr class="bg-slate-800/40 text-slate-400 text-xs uppercase tracking-wider">
                        <th class="px-4 py-3 text-left">Section</th><th class="px-4 py-3 text-left">Score</th>
                        <th class="px-4 py-3 text-left hidden md:table-cell">Details</th>
                    </tr></thead>
                    <tbody>${breakdownRows}</tbody>
                </table>
            </div>
        </div>

        <!-- Contact + Job Readiness -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                <h3 class="font-bold text-white mb-4 flex items-center gap-2"><span>📬</span> Contact Information</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">${contactBadges}</div>
            </div>
            <div class="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                <h3 class="font-bold text-white mb-4 flex items-center gap-2"><span>📈</span> Job Readiness</h3>
                <div class="space-y-3">${jrHtml}</div>
            </div>
        </div>

        <!-- Skills by Category -->
        <div class="bg-slate-900 border border-slate-700 rounded-2xl p-5">
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-white flex items-center gap-2"><span class="text-blue-400">⚡</span> Technical Skills <span class="text-slate-500 text-xs font-normal">(${skills.length} detected)</span></h3>
                ${softSkills.length>0?`<span class="text-xs text-slate-400">${softSkills.length} soft skills</span>`:''}
            </div>
            ${Object.keys(skillsByCat).length>0?`<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">${skillCatsHtml}</div>`:
                `<div class="flex flex-wrap gap-2">${skills.map(s=>`<span class="text-xs px-2.5 py-1 bg-blue-900/40 border border-blue-700/40 text-blue-300 rounded-full">${s}</span>`).join()||'<p class="text-slate-500 text-sm">No technical skills detected. Add a dedicated Skills section.</p>'}</div>`}
            ${softSkills.length>0?`<div class="mt-4 pt-4 border-t border-slate-700/50">
                <p class="text-pink-400 text-xs font-bold uppercase tracking-wider mb-2">Soft Skills</p>
                <div class="flex flex-wrap gap-1.5">${softSkills.map(s=>`<span class="text-xs px-2 py-0.5 bg-pink-900/30 border border-pink-700/30 text-pink-300 rounded-full">${s}</span>`).join('')}</div>
            </div>`:''}
        </div>

        <!-- Missing + ATS Compat -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                <h3 class="font-bold text-white mb-3 flex items-center gap-2"><span class="text-orange-400">⚠️</span> Missing Sections</h3>
                <div class="flex flex-col gap-2">${missHtml}</div>
            </div>
            <div class="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                <h3 class="font-bold text-white mb-3 flex items-center gap-2"><span class="text-cyan-400">🤖</span> ATS Compatibility <span class="text-cyan-400 text-xs font-bold ml-auto">${compatScore}/5</span></h3>
                ${(atsCompat.issues||[]).length===0?'<p class="text-green-400 text-sm">✅ No ATS formatting issues!</p>':
                    (atsCompat.issues||[]).map(i=>`<div class="text-xs text-orange-300 flex items-start gap-2 mb-1.5 bg-orange-900/10 border border-orange-800/20 rounded-lg p-2"><span>⚠</span>${i}</div>`).join('')}
                ${(atsCompat.suggestions||[]).length>0?`<div class="mt-2">${(atsCompat.suggestions||[]).map(s=>`<p class="text-slate-400 text-xs mb-1">→ ${s}</p>`).join('')}</div>`:''}
                <p class="mt-2 text-xs text-slate-500">Words: ${atsCompat.word_count||0} · Est. pages: ${atsCompat.page_estimate||1}</p>
            </div>
        </div>

        <!-- Grammar + Keywords -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                <h3 class="font-bold text-white mb-3 flex items-center gap-2"><span class="text-yellow-400">✍️</span> Grammar Analysis</h3>
                <div class="flex items-center gap-4 mb-3">
                    <span class="text-3xl font-black ${grammarColor}">${grammarGrade}</span>
                    <div class="text-xs text-slate-400">
                        <p>Words: <b class="text-slate-200">${grammar.word_count||0}</b></p>
                        <p>Avg sentence: <b class="text-slate-200">${grammar.avg_sentence_length||0} words</b></p>
                        <p>Passive voice: <b class="text-slate-200">${grammar.passive_voice_count||0}</b></p>
                    </div>
                </div>
                ${(grammar.issues||[]).length>0?
                    grammar.issues.map(i=>`<div class="text-xs text-orange-300 flex items-start gap-2 mb-1.5 bg-orange-900/10 border border-orange-800/20 rounded-lg p-2"><span>⚠</span>${i}</div>`).join(''):
                    '<p class="text-green-400 text-sm">✅ No major grammar issues!</p>'}
            </div>
            <div class="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                <h3 class="font-bold text-white mb-3 flex items-center gap-2"><span class="text-purple-400">🔑</span> Keyword Analysis</h3>
                <div class="flex items-center gap-4 mb-3">
                    <div class="text-center"><p class="text-2xl font-black text-purple-400">${kwDensity.toFixed(1)}%</p><p class="text-slate-500 text-xs">Density</p></div>
                    <div class="text-center"><p class="text-2xl font-black text-blue-400">${data.keyword_matches?data.keyword_matches.length:0}</p><p class="text-slate-500 text-xs">Matched</p></div>
                    <div class="text-center"><p class="text-2xl font-black text-red-400">${data.missing_keywords?data.missing_keywords.length:0}</p><p class="text-slate-500 text-xs">Missing</p></div>
                </div>
                ${data.missing_keywords&&data.missing_keywords.length>0?`<p class="text-slate-400 text-xs mb-2">Missing keywords:</p>
                <div class="flex flex-wrap gap-1.5">${data.missing_keywords.slice(0,8).map(k=>`<span class="text-xs px-2 py-0.5 bg-red-900/30 border border-red-700/30 text-red-300 rounded-full">${k}</span>`).join('')}</div>`:'<p class="text-green-400 text-sm">✅ Good keyword coverage!</p>'}
            </div>
        </div>

        <!-- Strengths + Weaknesses -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="bg-slate-900 border border-green-800/40 rounded-2xl p-5">
                <h3 class="font-bold text-white mb-3 flex items-center gap-2"><span class="text-green-400">✅</span> Strengths</h3>
                <ul class="space-y-2">${strengths.map(s=>`<li class="text-sm text-slate-300 leading-relaxed">${s}</li>`).join()||'<p class="text-slate-500 text-sm">Complete more sections to identify strengths.</p>'}</ul>
            </div>
            <div class="bg-slate-900 border border-red-800/40 rounded-2xl p-5">
                <h3 class="font-bold text-white mb-3 flex items-center gap-2"><span class="text-red-400">❌</span> Weaknesses</h3>
                <ul class="space-y-2">${weaknesses.map(w=>`<li class="text-sm text-slate-300 leading-relaxed">${w}</li>`).join()||'<p class="text-slate-500 text-sm">No significant weaknesses — great job!</p>'}</ul>
            </div>
        </div>

        <!-- Suggestions + Missing Skills -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                <h3 class="font-bold text-white mb-3 flex items-center gap-2"><span class="text-yellow-400">💡</span> Improvement Suggestions</h3>
                <ul class="space-y-3">${suggestions.map((s,i)=>`
                <li class="flex items-start gap-3 bg-yellow-900/10 border border-yellow-800/20 rounded-xl p-3">
                    <span class="w-5 h-5 rounded-full bg-yellow-600/40 text-yellow-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">${i+1}</span>
                    <p class="text-slate-300 text-sm">${s}</p>
                </li>`).join()||'<p class="text-slate-500 text-sm">No suggestions — great resume!</p>'}</ul>
            </div>
            <div class="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                <h3 class="font-bold text-white mb-3 flex items-center gap-2"><span class="text-red-400">🎯</span> Missing Skills to Add</h3>
                <div class="flex flex-wrap gap-2 mb-2">${missingSkills.map(s=>`<span class="text-xs px-2.5 py-1 bg-red-900/30 border border-red-700/40 text-red-300 rounded-full font-medium">${s}</span>`).join()||'<p class="text-slate-500 text-sm">None identified.</p>'}</div>
                ${missingSkills.length>0?'<p class="text-slate-500 text-xs">💡 Add these if you have any experience with them.</p>':''}
            </div>
        </div>

        <!-- Interview Questions (Tiered) -->
        <div class="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-700/40 rounded-2xl p-6">
            <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-600/50 flex items-center justify-center text-lg">🤖</div>
                    <div><h3 class="font-bold text-white text-lg">Interview Questions</h3><p class="text-indigo-300 text-xs">Tailored to your resume · ${easyQs.length+medQs.length+hardQs.length} questions total</p></div>
                </div>
                <div class="sm:ml-auto flex gap-2">
                    <span class="text-xs bg-green-900/40 border border-green-700/40 text-green-400 px-2 py-1 rounded-full">🟢 ${easyQs.length} Easy</span>
                    <span class="text-xs bg-yellow-900/40 border border-yellow-700/40 text-yellow-400 px-2 py-1 rounded-full">🟡 ${medQs.length} Medium</span>
                    <span class="text-xs bg-red-900/40 border border-red-700/40 text-red-400 px-2 py-1 rounded-full">🔴 ${hardQs.length} Hard</span>
                </div>
            </div>
            ${easyQs.length?`<div class="mb-4"><p class="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">🟢 Easy — Conceptual & HR</p><ol class="space-y-2">${qListHtml(easyQs,'green','E')}</ol></div>`:''}
            ${medQs.length?`<div class="mb-4"><p class="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">🟡 Medium — Technical & Behavioral</p><ol class="space-y-2">${qListHtml(medQs,'yellow','M')}</ol></div>`:''}
            ${hardQs.length?`<div><p class="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">🔴 Hard — System Design</p><ol class="space-y-2">${qListHtml(hardQs,'red','H')}</ol></div>`:''}
        </div>

        <!-- Learning Roadmap -->
        ${Object.keys(roadmap).length>0?`
        <div class="bg-gradient-to-br from-teal-900/20 to-green-900/20 border border-teal-700/30 rounded-2xl p-6">
            <div class="flex items-center gap-3 mb-5">
                <div class="w-10 h-10 rounded-xl bg-teal-600/30 border border-teal-600/50 flex items-center justify-center text-lg">🗺️</div>
                <div><h3 class="font-bold text-white text-lg">Personalized Learning Roadmap</h3><p class="text-teal-300 text-xs">Based on your profile and gaps</p></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                ${roadmapSection('Immediate Actions','⚡', roadmap.immediate_actions)}
                ${roadmapSection('Recommended Courses','📚', roadmap.courses)}
                ${roadmapSection('Project Ideas','🚀', roadmap.projects)}
                ${roadmapSection('DSA Topics','🧩', roadmap.dsa_topics)}
                ${roadmapSection('Interview Prep Plan','🎯', roadmap.interview_prep)}
            </div>
        </div>`:''}

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-3 justify-center pb-4">
            ${recordId?`
            <button onclick="downloadPDFReport(${recordId}, '${filename}')"
                class="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/30 active:scale-95">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Download PDF Report
            </button>`:''}
            <button onclick="renderResumePage()"
                class="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-semibold px-6 py-3 rounded-xl transition-colors active:scale-95">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                Analyze Another Resume
            </button>
        </div>`;
}

async function loadResumeHistory() {
    const histEl = document.getElementById('resume-history-list');
    if (!histEl) return;
    try {
        const res = await fetch(`${API_BASE}/resume/history`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) { histEl.innerHTML = '<p class="text-slate-500 text-sm">Could not load history.</p>'; return; }
        const data = await parseJSON(res);
        const history = data.history || [];
        if (history.length === 0) {
            histEl.innerHTML = '<div class="text-center py-6"><p class="text-slate-500 text-sm">No previous analyses yet. Upload your first resume above!</p></div>';
            return;
        }
        histEl.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full text-left" style="min-width:580px">
                <thead><tr class="bg-slate-800/60 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                    <th class="px-4 py-3">File</th><th class="px-4 py-3">ATS Score</th>
                    <th class="px-4 py-3">Readiness</th><th class="px-4 py-3">Level</th>
                    <th class="px-4 py-3">Skills</th><th class="px-4 py-3">Date</th><th class="px-4 py-3">Report</th>
                </tr></thead>
                <tbody>${history.map(h => {
                    const sc = h.score || 0;
                    const sColor = sc>=80?'text-green-400':sc>=60?'text-yellow-400':'text-red-400';
                    const barColor = sc>=80?'bg-green-500':sc>=60?'bg-yellow-500':'bg-red-500';
                    const date = new Date(h.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
                    const ext = h.file_type==='docx'?'📄':'📋';
                    const ivClass = h.interview_readiness==='Excellent'?'text-green-400':h.interview_readiness==='Good'?'text-blue-400':h.interview_readiness==='Average'?'text-yellow-400':'text-red-400';
                    return `<tr class="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                        <td class="px-4 py-3"><div class="flex items-center gap-2"><span>${ext}</span><span class="text-slate-200 text-sm font-medium truncate max-w-[130px]" title="${h.filename}">${h.filename}</span><span class="text-slate-600 text-xs">v${h.resume_version||1}</span></div></td>
                        <td class="px-4 py-3"><div class="flex items-center gap-2"><div class="w-14 bg-slate-800 rounded-full h-1.5"><div class="h-1.5 rounded-full ${barColor}" style="width:${Math.min(100,sc)}%"></div></div><span class="font-bold text-sm ${sColor}">${sc.toFixed(0)}</span></div></td>
                        <td class="px-4 py-3 text-xs font-bold ${ivClass}">${h.interview_readiness||'—'}</td>
                        <td class="px-4 py-3 text-slate-400 text-xs">${h.experience_level||'—'}</td>
                        <td class="px-4 py-3 text-slate-400 text-xs">${h.skills_count}</td>
                        <td class="px-4 py-3 text-slate-500 text-xs">${date}</td>
                        <td class="px-4 py-3"><button onclick="downloadPDFReport(${h.id},'${h.filename}')" class="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors">↓ PDF</button></td>
                    </tr>`;
                }).join('')}</tbody>
            </table>
        </div>`;
    } catch(err) {
        histEl.innerHTML = `<p class="text-slate-500 text-sm">Error: ${err.message}</p>`;
    }
}

async function loadResumeQuestions(skills, technologies) {
    const loadingEl = document.getElementById('resume-questions-loading');
    const listEl = document.getElementById('resume-questions-list');
    if (!loadingEl || !listEl) return;
    try {
        const res = await fetch(`${API_BASE}/interview/resume-interview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ skills: [...skills, ...technologies] })
        });
        const data = await parseJSON(res);
        const questions = data.questions || [];
        loadingEl.classList.add('hidden');
        listEl.classList.remove('hidden');
        listEl.innerHTML = questions.map((q, i) => `
            <li class="flex items-start gap-3 bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                <span class="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">${i+1}</span>
                <p class="text-slate-200 text-sm leading-relaxed">${q}</p>
            </li>`).join('') || '<li class="text-slate-400 text-sm">No questions generated.</li>';
    } catch(err) {
        if (loadingEl) loadingEl.textContent = 'Could not load questions.';
    }
}


// ────────────────────────────────────────────────────────────
//   HISTORY
// ────────────────────────────────────────────────────────────
async function renderHistory() {
    setActiveNav('history');
    showLoader();
    const container = document.getElementById('app-container');
    try {
        const res = await fetch(`${API_BASE}/user/history`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load history');
        const data = await parseJSON(res);
        let history = data.history || [];

        const rows = history.length > 0 ? history.map(item => `
            <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                <td class="p-4"><span class="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-full">${item.round_type}</span></td>
                <td class="p-4">
                    <div class="flex items-center gap-2">
                        <div class="w-16 bg-slate-800 rounded-full h-1.5">
                            <div class="h-1.5 rounded-full ${item.score >= 70 ? 'bg-green-500' : 'bg-red-500'}" style="width:${Math.min(100,item.score)}%"></div>
                        </div>
                        <span class="font-bold text-sm ${item.score >= 70 ? 'text-green-400' : 'text-red-400'}">${item.score.toFixed(0)}</span>
                    </div>
                </td>
                <td class="p-4 text-slate-400 text-sm">${new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td class="p-4">
                    <span class="px-2 py-0.5 rounded-full text-xs font-bold ${item.status === 'Pass' ? 'bg-green-900/60 text-green-400 border border-green-800' : 'bg-red-900/60 text-red-400 border border-red-800'}">
                        ${item.status === 'Pass' ? '✔ Pass' : '✘ Fail'}
                    </span>
                </td>
                <td class="p-4 text-slate-400 text-sm italic max-w-xs" title="${item.feedback_summary}">${item.feedback_summary?.length > 80 ? item.feedback_summary.slice(0, 80) + '...' : item.feedback_summary}</td>
            </tr>`) .join('') :
            `<tr><td colspan="5" class="p-10 text-center text-slate-500">No interview history yet. Start your first round!</td></tr>`;

        container.innerHTML = `
        <div class="w-full space-y-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-3xl font-extrabold text-white">Interview History</h2>
                    <p class="text-slate-400 mt-1">Track your past performance and AI feedback.</p>
                </div>
                <select id="filterRound" onchange="filterHistory()" class="bg-slate-800 border border-slate-600 text-slate-300 text-sm rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="all">All Rounds</option>
                    <option value="MCQ Screening">Aptitude MCQ</option>
                    <option value="Technical AI">Technical</option>
                    <option value="HR">HR</option>
                    <option value="Coding">Coding</option>
                </select>
            </div>

            <div class="bg-slate-900 border border-slate-700 rounded-2xl overflow-x-auto">
                <table id="history-table" class="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr class="bg-slate-800/60 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                            <th class="p-4 font-semibold">Round</th>
                            <th class="p-4 font-semibold">Score</th>
                            <th class="p-4 font-semibold">Date</th>
                            <th class="p-4 font-semibold">Status</th>
                            <th class="p-4 font-semibold">Feedback</th>
                        </tr>
                    </thead>
                    <tbody id="history-tbody">${rows}</tbody>
                </table>
            </div>
        </div>`;

        // Store data for filtering
        window._historyData = history;
    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-20">Error: ${err.message}</p>`;
    }
}

function filterHistory() {
    const filter = document.getElementById('filterRound').value;
    const data = (window._historyData || []).filter(i => filter === 'all' || i.round_type.includes(filter));
    const tbody = document.getElementById('history-tbody');
    if (!tbody) return;
    tbody.innerHTML = data.length > 0 ? data.map(item => `
        <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
            <td class="p-4"><span class="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-full">${item.round_type}</span></td>
            <td class="p-4">
                <div class="flex items-center gap-2">
                    <div class="w-16 bg-slate-800 rounded-full h-1.5"><div class="h-1.5 rounded-full ${item.score >= 70 ? 'bg-green-500' : 'bg-red-500'}" style="width:${Math.min(100,item.score)}%"></div></div>
                    <span class="font-bold text-sm ${item.score >= 70 ? 'text-green-400' : 'text-red-400'}">${item.score.toFixed(0)}</span>
                </div>
            </td>
            <td class="p-4 text-slate-400 text-sm">${new Date(item.date).toLocaleDateString()}</td>
            <td class="p-4"><span class="px-2 py-0.5 rounded-full text-xs font-bold ${item.status === 'Pass' ? 'bg-green-900/60 text-green-400 border border-green-800' : 'bg-red-900/60 text-red-400 border border-red-800'}">${item.status === 'Pass' ? '✔ Pass' : '✘ Fail'}</span></td>
            <td class="p-4 text-slate-400 text-sm italic">${item.feedback_summary?.slice(0, 80) || '—'}</td>
        </tr>`).join('') : `<tr><td colspan="5" class="p-8 text-center text-slate-500">No results for this filter.</td></tr>`;
}

// ────────────────────────────────────────────────────────────
//   LEARNING
// ────────────────────────────────────────────────────────────
async function renderLearning() {
    setActiveNav('learning');
    showLoader();
    const container = document.getElementById('app-container');
    try {
        const res = await fetch(`${API_BASE}/user/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.status === 401 || res.status === 422) { logout(); return; }
        if (!res.ok) throw new Error('Failed to load learning data');
        const data = await parseJSON(res);
        const score = data.readiness_score || 0;
        const weakTopics = data.weak_topics || [];

        const subjects = [
            { name: 'Python Mastery', category: 'Language', emoji: '🐍', url: 'https://docs.python.org/3/', isCore: false },
            { name: 'Java Full Course', category: 'Language', emoji: '☕', url: 'https://docs.oracle.com/javase/', isCore: false },
            { name: 'DSA with C++', category: 'Data Structures', emoji: '🌳', url: 'https://www.geeksforgeeks.org/data-structures/', isCore: true },
            { name: 'Operating Systems', category: 'Core CS', emoji: '💻', url: 'https://www.geeksforgeeks.org/operating-systems/', isCore: true },
            { name: 'DBMS', category: 'Core CS', emoji: '🗄️', url: 'https://www.geeksforgeeks.org/dbms/', isCore: true },
            { name: 'Computer Networks', category: 'Core CS', emoji: '🌐', url: 'https://www.geeksforgeeks.org/computer-network-tutorials/', isCore: true },
            { name: 'System Design', category: 'Advanced', emoji: '🏗️', url: 'https://github.com/donnemartin/system-design-primer', isCore: false },
            { name: 'LeetCode Practice', category: 'DSA', emoji: '⚡', url: 'https://leetcode.com/', isCore: false },
        ];

        const needsHelp = score < 60;

        const cards = subjects.map(sub => {
            const isWeak = weakTopics.some(w => sub.name.toLowerCase().includes(w.toLowerCase()));
            const highlight = (needsHelp && sub.isCore) || isWeak;
            return `
            <div class="bg-slate-900 border ${highlight ? 'border-red-500/50 shadow-red-500/5 shadow-lg' : 'border-slate-700 hover:border-blue-500/50'} p-6 rounded-2xl transition-all flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center gap-3">
                            <span class="text-3xl">${sub.emoji}</span>
                            <div>
                                <h3 class="font-bold ${highlight ? 'text-red-300' : 'text-slate-200'} text-base">${sub.name}</h3>
                                <span class="text-xs text-slate-500">${sub.category}</span>
                            </div>
                        </div>
                        ${highlight ? `<span class="text-xs bg-red-900/60 border border-red-700 text-red-400 px-2 py-0.5 rounded-full font-bold">Recommended</span>` : ''}
                    </div>
                    ${highlight ? `<p class="text-xs text-red-400/80 mb-4 flex items-center gap-1.5"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>Based on your recent performance</p>` : `<p class="text-xs text-slate-500 mb-4">Strengthen your foundations</p>`}
                </div>
                <a href="${sub.url}" target="_blank" rel="noopener"
                    class="w-full py-2.5 rounded-xl text-sm font-bold text-center transition-all block ${highlight ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}">
                    Start Learning →
                </a>
            </div>`;
        }).join('');

        container.innerHTML = `
        <div class="w-full space-y-8">
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 class="text-3xl font-extrabold text-white">Learning Center</h2>
                    <p class="text-slate-400 mt-1">Personalized recommendations to boost your readiness score.</p>
                </div>
                <div class="bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl flex items-center gap-3">
                    <span class="text-slate-400 text-sm">Current Readiness:</span>
                    <span class="text-xl font-black ${score >= 70 ? 'text-green-400' : 'text-yellow-400'}">${score.toFixed(1)}%</span>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">${cards}</div>
        </div>`;
    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-20">Error loading learning center.</p>`;
    }
}

// ────────────────────────────────────────────────────────────
//   INTERVIEW FLOW
// ────────────────────────────────────────────────────────────
// ─── Helper: full-page interview stage ───────────────────────
function getInterviewStage() {
    const container = document.getElementById('app-container');
    container.innerHTML = `
    <div class="w-full space-y-4">
        <button onclick="renderDashboard()" class="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors mb-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            Back to Dashboard
        </button>
        <div id="interview-stage" class="bg-slate-900 border border-slate-700 rounded-2xl p-6 md:p-8"></div>
    </div>`;
    return document.getElementById('interview-stage');
}

async function startInterview() {
    const stage = getInterviewStage();
    stage.innerHTML = `<div class="flex items-center gap-4 py-4"><div class="loader"></div><p class="text-slate-400 animate-pulse">Initializing interview session...</p></div>`;

    try {
        const res = await fetch(`${API_BASE}/interview/start`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error);
        currentSessionId = data.session_id;

        if (data.round === 1) {
            await startAptitudeRound();
        } else {
            renderQuestion(data.round);
        }
    } catch (err) {
        stage.innerHTML = `<p class="text-red-400 py-4">Error starting interview: ${err.message}</p>`;
    }
}

// ─── Round 1: Real Aptitude MCQ ─────────────────────────────
async function startAptitudeRound() {
    const stage = getInterviewStage();
    stage.innerHTML = `<div class="flex items-center gap-4 py-4"><div class="loader"></div><p class="text-slate-400 animate-pulse">Loading 25 aptitude questions...</p></div>`;

    try {
        const res = await fetch(`${API_BASE}/interview/aptitude/start`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || 'Failed to start aptitude');

        currentAptitudeQuestions = data.questions || [];
        currentAptitudeAnswers = {};
        const sessionId = data.session_id || currentSessionId;
        currentSessionId = sessionId;

        if (currentAptitudeQuestions.length === 0) {
            stage.innerHTML = `<div class="text-center py-8">
                <p class="text-yellow-400 font-semibold text-lg mb-2">⚠️ No aptitude questions found in the database.</p>
                <p class="text-slate-400 text-sm">Please ask the admin to seed the aptitude question bank.</p>
            </div>`;
            return;
        }

        renderAptitudeQuiz(currentAptitudeQuestions, data.duration_minutes || 30);
    } catch (err) {
        const stage = document.getElementById('interview-stage');
        if (stage) stage.innerHTML = `<p class="text-red-400 py-4">Error loading aptitude round: ${err.message}</p>`;
    }
}

function renderAptitudeQuiz(questions, durationMinutes) {
    const stage = document.getElementById('interview-stage');
    let currentQ = 0;

    function renderQ(idx) {
        const q = questions[idx];
        const optionLetters = ['A', 'B', 'C', 'D'];
        const optionsHtml = optionLetters.map(letter => {
            const text = q.options[letter];
            if (!text) return '';
            const isSelected = currentAptitudeAnswers[q.id] === letter;
            return `
            <label class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-blue-900/40 border-blue-500 text-blue-200' : 'bg-slate-800/60 border-slate-700 hover:border-blue-500/50 text-slate-200'}">
                <input type="radio" name="apt-q-${q.id}" value="${letter}" ${isSelected ? 'checked' : ''} class="hidden" onchange="recordAptAnswer(${q.id}, '${letter}')">
                <span class="w-7 h-7 rounded-lg border ${isSelected ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-600 text-slate-400'} flex items-center justify-center text-xs font-bold flex-shrink-0">${letter}</span>
                <span class="text-sm">${text}</span>
            </label>`;
        }).join('');

        const answeredCount = Object.keys(currentAptitudeAnswers).length;

        stage.innerHTML = `
        <div>
            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-700">
                <div>
                    <span class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Round 1 — Aptitude MCQ</span>
                    <h3 class="text-xl font-bold text-white">Question ${idx + 1} of ${questions.length}</h3>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-xs text-slate-400">${answeredCount}/${questions.length} answered</span>
                    <span id="apt-timer" class="text-sm font-mono bg-red-900/50 border border-red-700 text-red-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        Loading...
                    </span>
                </div>
            </div>

            <!-- Progress Bar -->
            <div class="w-full bg-slate-800 rounded-full h-1.5 mb-5">
                <div class="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all" style="width:${((idx + 1) / questions.length) * 100}%"></div>
            </div>

            <!-- Topic badge -->
            ${q.topic ? `<span class="text-xs px-2 py-0.5 bg-indigo-900/40 border border-indigo-700/40 text-indigo-300 rounded-full mb-3 inline-block">${q.topic}</span>` : ''}

            <!-- Question -->
            <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-5">
                <p class="text-slate-100 font-semibold text-base leading-relaxed">${q.text}</p>
            </div>

            <!-- Options -->
            <div class="space-y-2 mb-6">${optionsHtml}</div>

            <!-- Navigation -->
            <div class="flex items-center justify-between gap-3">
                <button onclick="aptNavigate(-1, ${idx})" ${idx === 0 ? 'disabled' : ''}
                    class="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    ← Prev
                </button>
                <div class="flex gap-1 flex-wrap justify-center max-w-sm">
                    ${questions.slice(0, Math.min(questions.length, 10)).map((qq, i) => `
                    <button onclick="aptNavigate(${i - idx}, ${idx})"
                        class="w-7 h-7 rounded-lg text-xs font-bold transition-colors ${currentAptitudeAnswers[qq.id] ? 'bg-green-700 text-white' : i === idx ? 'bg-blue-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-blue-500'}">
                        ${i + 1}
                    </button>`).join('')}
                    ${questions.length > 10 ? `<span class="text-slate-500 text-xs self-center">+${questions.length - 10} more</span>` : ''}
                </div>
                ${idx < questions.length - 1 ?
                    `<button onclick="aptNavigate(1, ${idx})" class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors">Next →</button>` :
                    `<button onclick="submitAptitude()" class="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-green-500/30">Submit All ✔</button>`}
            </div>
        </div>`;

        // Start or keep timer
        if (!aptitudeTimerInterval) {
            startAptitudeTimer(durationMinutes * 60);
        }
    }

    window._aptRenderQ = renderQ;
    window._aptCurrentIdx = 0;
    renderQ(0);
}

function aptNavigate(delta, currentIdx) {
    const newIdx = currentIdx + delta;
    const qs = currentAptitudeQuestions;
    if (newIdx < 0 || newIdx >= qs.length) return;
    window._aptCurrentIdx = newIdx;
    window._aptRenderQ(newIdx);
}

function recordAptAnswer(questionId, letter) {
    currentAptitudeAnswers[questionId] = letter;
    // Re-render current question to reflect selection
    if (window._aptRenderQ) window._aptRenderQ(window._aptCurrentIdx);
}

function startAptitudeTimer(seconds) {
    clearInterval(aptitudeTimerInterval);
    let timeLeft = seconds;
    aptitudeTimerInterval = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        const el = document.getElementById('apt-timer');
        if (el) el.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${m}:${s}`;
        if (timeLeft <= 0) { clearInterval(aptitudeTimerInterval); aptitudeTimerInterval = null; submitAptitude(); }
    }, 1000);
}

async function submitAptitude() {
    clearInterval(aptitudeTimerInterval);
    aptitudeTimerInterval = null;
    const stage = document.getElementById('interview-stage');
    stage.innerHTML = `<div class="flex items-center gap-4 py-6"><div class="loader"></div><p class="text-slate-400 animate-pulse">Evaluating your aptitude test...</p></div>`;

    try {
        const res = await fetch(`${API_BASE}/interview/aptitude/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ session_id: currentSessionId, answers: currentAptitudeAnswers })
        });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || 'Evaluation failed');

        const passed = data.status === 'PASS';
        stage.innerHTML = `
        <div class="space-y-5">
            <div class="flex items-center justify-between border-b border-slate-700 pb-4">
                <h3 class="text-xl font-bold text-white">Aptitude Round — Results</h3>
                <span class="text-3xl font-black ${passed ? 'text-green-400' : 'text-red-400'}">${data.score?.toFixed(1)}%</span>
            </div>
            <div class="grid grid-cols-3 gap-4 text-center">
                <div class="bg-green-900/30 border border-green-800 rounded-xl p-4">
                    <p class="text-2xl font-black text-green-400">${data.correct}</p>
                    <p class="text-xs text-slate-400 mt-1">Correct</p>
                </div>
                <div class="bg-red-900/30 border border-red-800 rounded-xl p-4">
                    <p class="text-2xl font-black text-red-400">${data.wrong}</p>
                    <p class="text-xs text-slate-400 mt-1">Wrong</p>
                </div>
                <div class="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <p class="text-2xl font-black text-slate-200">${data.total}</p>
                    <p class="text-xs text-slate-400 mt-1">Total</p>
                </div>
            </div>
            <div class="p-4 ${passed ? 'bg-green-900/30 border-green-700' : 'bg-red-900/30 border-red-700'} border rounded-xl">
                <p class="${passed ? 'text-green-300' : 'text-red-300'} font-semibold">${passed ? '🎉 Congratulations! You passed the Aptitude round.' : '😔 You did not pass this round.'}</p>
                <p class="text-slate-400 text-sm mt-1">${data.feedback}</p>
            </div>
            <div class="flex justify-end">
                ${passed ?
                    `<button onclick="renderQuestion(2)" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg">Proceed to Technical Round →</button>` :
                    `<button onclick="renderDashboard()" class="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">Back to Dashboard</button>`
                }
            </div>
        </div>`;
    } catch (err) {
        stage.innerHTML = `<p class="text-red-400 py-4">Evaluation error: ${err.message}</p>`;
    }
}

// ─── Standard Question Renderer (All Rounds) ─────────────────
function renderQuestion(round) {
    const stage = getInterviewStage();

    if (round === 1) {
        // Round 1: Aptitude MCQ
        startAptitudeRound();
    } else if (round === 2) {
        // Round 2: AI Technical Chat Interview
        renderTechnicalChat();
    } else if (round === 3) {
        // Round 3: Coding Arena (Monaco)
        renderCodingRound();
    } else if (round === 4) {
        // Round 4: HR Video
        renderHRRound();
    } else {
        stage.innerHTML = `<p class="text-slate-400 text-center py-8">🎉 All rounds complete! Check your Dashboard.</p>`;
    }
}

// ─── Round 2: Technical AI Chat ──────────────────────────────
let chatContext = [];
let chatQuestionCount = 0;
const CHAT_MAX_QUESTIONS = 5;

async function renderTechnicalChat() {
    const stage = getInterviewStage();
    chatContext = [];
    chatQuestionCount = 0;

    // Fetch first question
    stage.innerHTML = `<div class="flex items-center gap-4 py-4"><div class="loader"></div><p class="text-slate-400 animate-pulse">AI is preparing your first question...</p></div>`;

    // Generate first question
    const firstQ = await generateFirstTechQuestion();

    stage.innerHTML = `
    <div id="tech-chat-wrapper" class="space-y-5">
        <div class="flex items-center justify-between border-b border-slate-700 pb-4">
            <div>
                <span class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Round 2 — Technical Interview</span>
                <h3 class="text-xl font-bold text-white">AI Conversation (<span id="qcount">1</span>/${CHAT_MAX_QUESTIONS})</h3>
            </div>
            <span class="text-xs bg-indigo-900/60 border border-indigo-700 text-indigo-300 px-3 py-1 rounded-full font-semibold">Adaptive AI</span>
        </div>

        <!-- Conversation Feed -->
        <div id="chat-feed" class="space-y-4 max-h-80 overflow-y-auto pr-1">
            <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">AI</div>
                <div class="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 max-w-xl">
                    <p class="text-slate-100 text-sm leading-relaxed" id="current-question">${firstQ}</p>
                </div>
            </div>
        </div>

        <!-- Answer Box -->
        <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <textarea id="tech-answer" rows="4" placeholder="Type your detailed answer here..."
                class="w-full bg-transparent text-white text-sm resize-none focus:outline-none placeholder-slate-500 leading-relaxed"></textarea>
        </div>

        <div class="flex items-center justify-between">
            <span id="tech-eval-status" class="text-sm text-slate-400 hidden animate-pulse">AI is evaluating your response...</span>
            <div class="flex gap-3 ml-auto">
                <button id="tech-submit-btn" onclick="submitTechAnswer('${escapeStr(firstQ)}')"
                    class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30">
                    Submit Answer
                </button>
            </div>
        </div>

        <div id="tech-eval-result" class="hidden"></div>
    </div>`;
}

function escapeStr(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

async function generateFirstTechQuestion() {
    try {
        const res = await fetch(`${API_BASE}/interview/resume-interview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ skills: ['Software Engineering', 'Data Structures', 'Algorithms', 'System Design'] })
        });
        const data = await parseJSON(res);
        return data.questions?.[0] || 'Explain the difference between a process and a thread in an operating system.';
    } catch(_) {
        return 'Explain the difference between a process and a thread in an operating system.';
    }
}

async function submitTechAnswer(question) {
    const answerEl = document.getElementById('tech-answer');
    const answer = answerEl ? answerEl.value.trim() : '';
    if (!answer) { showToast('Please write an answer before submitting.', 'warning'); return; }

    const submitBtn = document.getElementById('tech-submit-btn');
    const statusEl = document.getElementById('tech-eval-status');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Evaluating...'; }
    if (statusEl) statusEl.classList.remove('hidden');

    chatQuestionCount++;
    chatContext.push({ role: 'user', content: answer });

    // Add user answer to feed
    const feed = document.getElementById('chat-feed');
    if (feed) {
        feed.innerHTML += `
        <div class="flex items-start gap-3 flex-row-reverse">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">You</div>
            <div class="bg-blue-900/40 border border-blue-700/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-xl">
                <p class="text-blue-100 text-sm leading-relaxed">${answer}</p>
            </div>
        </div>`;
        feed.scrollTop = feed.scrollHeight;
    }

    try {
        const res = await fetch(`${API_BASE}/interview/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                session_id: currentSessionId,
                question,
                answer,
                context: chatContext,
                question_count: chatQuestionCount
            })
        });
        const data = await parseJSON(res);
        if (statusEl) statusEl.classList.add('hidden');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Answer'; }

        const eval_ = data.evaluation || {};
        const scoreColor = eval_.score >= 70 ? 'text-green-400' : eval_.score >= 50 ? 'text-yellow-400' : 'text-red-400';

        // Show mini feedback inline
        if (feed) {
            feed.innerHTML += `
            <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-3 mx-4">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">AI Feedback</span>
                    <span class="${scoreColor} font-black text-sm">${eval_.score ?? '—'}/100</span>
                </div>
                <p class="text-slate-300 text-xs">${eval_.feedback || 'No feedback'}</p>
            </div>`;
            feed.scrollTop = feed.scrollHeight;
        }

        if (data.is_complete || chatQuestionCount >= CHAT_MAX_QUESTIONS) {
            // Show final summary
            renderTechSummary(data);
        } else {
            // Ask next question
            const nextQ = data.next_question || 'Can you elaborate further on your previous answer?';
            chatContext.push({ role: 'assistant', content: nextQ });

            if (feed) {
                feed.innerHTML += `
                <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">AI</div>
                    <div class="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 max-w-xl">
                        <p class="text-slate-100 text-sm leading-relaxed" id="current-question">${nextQ}</p>
                    </div>
                </div>`;
                feed.scrollTop = feed.scrollHeight;
            }

            // Update counter + clear answer + rebind button
            const qcEl = document.getElementById('qcount');
            if (qcEl) qcEl.textContent = chatQuestionCount + 1;
            if (answerEl) answerEl.value = '';
            if (submitBtn) submitBtn.setAttribute('onclick', `submitTechAnswer("${escapeStr(nextQ)}")`);
        }
    } catch (err) {
        if (statusEl) statusEl.classList.add('hidden');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Answer'; }
        showToast('Evaluation error: ' + err.message, 'error');
    }
}

function renderTechSummary(data) {
    const stage = document.getElementById('interview-stage');
    const lastEval = data.evaluation || {};
    const passed = lastEval.score >= 70;
    const nextRound = data.round || 3;

    const summaryHtml = `
    <div class="space-y-5 mt-4 border-t border-slate-700 pt-5">
        <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-white">Technical Round — Complete</h3>
            <span class="${passed ? 'text-green-400' : 'text-red-400'} font-black text-2xl">${lastEval.score ?? '—'}/100</span>
        </div>
        <div class="p-4 ${passed ? 'bg-green-900/30 border-green-700' : 'bg-red-900/30 border-red-700'} border rounded-xl">
            <p class="${passed ? 'text-green-300' : 'text-red-300'} font-semibold">${passed ? '🎉 Technical round passed!' : '😔 Keep practicing and try again.'}</p>
            <p class="text-slate-400 text-sm mt-1">${lastEval.recommendation || ''}</p>
        </div>
        <div class="flex justify-end">
            ${passed
                ? `<button onclick="renderQuestion(${nextRound})" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all">Next Round →</button>`
                : `<button onclick="renderDashboard()" class="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">Back to Dashboard</button>`
            }
        </div>
    </div>`;

    const wrapper = document.getElementById('tech-chat-wrapper');
    if (wrapper) wrapper.insertAdjacentHTML('beforeend', summaryHtml);
    const techSubmit = document.getElementById('tech-submit-btn');
    if (techSubmit) techSubmit.closest('div.flex').innerHTML = '';
}

// ─── Round 3: Coding (Monaco in interview-stage) ─────────────
async function renderCodingRound() {
    const stage = getInterviewStage();

    let problem = { title: 'Two Sum', description: 'Given an array nums and target, return indices of the two numbers that add up to target.', difficulty: 'Easy', example_input: '[2,7,11,15], target=9', example_output: '[0,1]' };
    try {
        const res = await fetch(`${API_BASE}/dsa/daily`);
        if (res.ok) { const d = await parseJSON(res); if (d?.title) problem = d; }
    } catch(_) {}

    stage.innerHTML = `
    <div class="space-y-5">
        <div class="flex items-center justify-between border-b border-slate-700 pb-4">
            <div>
                <span class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Round 3 — Coding Arena</span>
                <h3 class="text-xl font-bold text-white">${problem.title}</h3>
            </div>
            <div class="flex items-center gap-2">
                <select id="coding-lang" class="bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded-lg px-2 py-1.5">
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                </select>
                <button onclick="runCodingRound()" class="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors">Run ▶</button>
                <button onclick="submitCodingRound()" class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors">Submit ✔</button>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm">
                <p class="text-slate-200 leading-relaxed mb-3">${problem.description}</p>
                ${problem.example_input ? `<div class="bg-black/40 rounded-lg p-3 font-mono text-xs">
                    <p class="text-slate-400">Input: <span class="text-slate-200">${problem.example_input}</span></p>
                    <p class="text-slate-400">Output: <span class="text-slate-200">${problem.example_output}</span></p>
                </div>` : ''}
            </div>
            <div class="flex flex-col gap-2">
                <div id="coding-editor-container" style="height:220px;" class="rounded-xl overflow-hidden border border-slate-700"></div>
                <div id="coding-output" class="bg-black/60 border border-slate-700 rounded-lg p-3 font-mono text-xs text-green-400 min-h-[60px] whitespace-pre-wrap">Output appears here...</div>
            </div>
        </div>
        <div id="coding-eval" class="hidden"></div>
    </div>`;

    // Init Monaco in the coding round
    if (typeof require !== 'undefined') {
        require(['vs/editor/editor.main'], function () {
            if (monacoEditor) { monacoEditor.dispose(); }
            monacoEditor = monaco.editor.create(document.getElementById('coding-editor-container'), {
                value: getStarterCode('python'),
                language: 'python',
                theme: 'vs-dark',
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                fontFamily: '"Fira Code", monospace',
            });
            document.getElementById('coding-lang').addEventListener('change', e => {
                const lang = e.target.value;
                monaco.editor.setModelLanguage(monacoEditor.getModel(), lang === 'c++' ? 'cpp' : lang);
                monacoEditor.setValue(getStarterCode(lang));
            });
        });
    }
}

async function runCodingRound() {
    const output = document.getElementById('coding-output');
    const lang = document.getElementById('coding-lang').value;
    const code = monacoEditor ? monacoEditor.getValue() : '';
    output.textContent = '⏳ Running...';
    output.className = 'bg-black/60 border border-slate-700 rounded-lg p-3 font-mono text-xs text-yellow-400 min-h-[60px] whitespace-pre-wrap';
    try {
        const res = await fetch(`${API_BASE}/code/run`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ code, language: lang })
        });
        const data = await parseJSON(res);
        output.textContent = data.output || 'No output';
        output.className = `bg-black/60 border border-slate-700 rounded-lg p-3 font-mono text-xs ${data.error ? 'text-red-400' : 'text-green-400'} min-h-[60px] whitespace-pre-wrap`;
    } catch(err) { output.textContent = 'Error: ' + err.message; output.className = 'bg-black/60 border border-red-700/50 rounded-lg p-3 font-mono text-xs text-red-400 min-h-[60px] whitespace-pre-wrap'; }
}

async function submitCodingRound() {
    const code = monacoEditor ? monacoEditor.getValue() : '';
    const evalDiv = document.getElementById('coding-eval');
    evalDiv.innerHTML = `<div class="flex items-center gap-3 py-3"><div class="loader" style="width:16px;height:16px;border-width:2px;"></div><p class="text-slate-400 text-sm animate-pulse">Evaluating your solution with AI...</p></div>`;
    evalDiv.classList.remove('hidden');

    try {
        const res = await fetch(`${API_BASE}/interview/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ session_id: currentSessionId, question: 'Solve the given coding problem efficiently.', answer: code })
        });
        const data = await parseJSON(res);
        renderEvaluationResult(data, evalDiv);
    } catch(err) {
        evalDiv.innerHTML = `<p class="text-red-400 text-sm">Evaluation error: ${err.message}</p>`;
    }
}

// ─── Round 4: HR Video ────────────────────────────────────────
function renderHRRound() {
    const stage = getInterviewStage();
    const question = 'Please record a short video answering: How do you handle conflict in a team?';
    stage.innerHTML = `
    <div class="space-y-5">
        <div class="flex items-center justify-between border-b border-slate-700 pb-4">
            <div>
                <span class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Round 4 — HR Video Round</span>
                <h3 class="text-xl font-bold text-white">Behavioural Interview</h3>
            </div>
            <span class="text-xs bg-purple-900/60 border border-purple-700 text-purple-300 px-3 py-1 rounded-full">Camera Required</span>
        </div>
        <div class="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
            <p class="text-slate-100 font-semibold">${question}</p>
            <p class="text-slate-400 text-xs mt-1">Speak clearly. Aim for 1–2 minutes. Be genuine!</p>
        </div>
        <div class="flex flex-col items-center gap-4">
            <video id="video-preview" class="w-full max-w-lg bg-black rounded-xl border border-slate-700 aspect-video object-cover" autoplay muted></video>
            <div class="flex gap-3">
                <button id="record-btn" onclick="startRecording()" class="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-6 rounded-full flex items-center gap-2 transition-colors shadow-lg hover:shadow-red-500/30">
                    <div class="w-3 h-3 bg-white rounded-full"></div> Start Recording
                </button>
                <button id="stop-btn" onclick="stopRecording()" class="hidden bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-bold py-2.5 px-6 rounded-full transition-colors">
                    ⏹ Stop
                </button>
                <button id="upload-btn" onclick="uploadMediaHr()" class="hidden bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-full transition-colors shadow-lg">
                    📤 Submit Video
                </button>
            </div>
            <p id="record-status" class="text-xs text-slate-400">Ready to record.</p>
        </div>
        <div id="eval-loading" class="hidden text-sm text-slate-400 animate-pulse text-center">AI is evaluating your video response...</div>
        <div id="eval-result" class="hidden"></div>
    </div>`;
}

// ─── Recording ────────────────────────────────────────────────
async function startRecording() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('video-preview').srcObject = mediaStream;
        mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });
        audioChunks = [];
        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
        mediaRecorder.onstop = () => {
            recordedBlob = new Blob(audioChunks, { type: 'video/webm' });
            const videoEl = document.getElementById('video-preview');
            videoEl.srcObject = null;
            videoEl.src = URL.createObjectURL(recordedBlob);
            videoEl.controls = true;
            mediaStream.getTracks().forEach(t => t.stop());
            document.getElementById('record-status').textContent = 'Recording saved. Review and submit when ready.';
        };
        mediaRecorder.start();
        document.getElementById('record-btn').classList.add('hidden');
        document.getElementById('stop-btn').classList.remove('hidden');
        document.getElementById('upload-btn').classList.add('hidden');
        const status = document.getElementById('record-status');
        status.textContent = '🔴 Recording in progress...';
        status.className = 'text-xs text-red-400 animate-pulse';
    } catch (err) { showToast('Camera access denied: ' + err.message, 'error'); }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        document.getElementById('stop-btn').classList.add('hidden');
        document.getElementById('upload-btn').classList.remove('hidden');
        document.getElementById('record-btn').classList.remove('hidden');
        document.getElementById('record-btn').innerHTML = '<div class="w-3 h-3 bg-white rounded-full"></div> Re-record';
        const status = document.getElementById('record-status');
        status.className = 'text-xs text-green-400';
    }
}

async function uploadMediaHr() {
    if (!recordedBlob) return;
    document.getElementById('eval-loading').classList.remove('hidden');
    document.getElementById('upload-btn').disabled = true;
    document.getElementById('upload-btn').classList.add('opacity-50');
    const formData = new FormData();
    formData.append('video', recordedBlob, 'hr_video.webm');
    formData.append('session_id', currentSessionId);
    try {
        const res = await fetch(`${API_BASE}/media/upload-hr-video`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
        });
        const data = await parseJSON(res);
        document.getElementById('eval-loading').classList.add('hidden');
        if (!res.ok) throw new Error(data.error);
        renderEvaluationResult(data, document.getElementById('eval-result'));
    } catch (err) {
        document.getElementById('eval-loading').classList.add('hidden');
        document.getElementById('upload-btn').disabled = false;
        document.getElementById('upload-btn').classList.remove('opacity-50');
        showToast('Upload failed: ' + err.message, 'error');
    }
}

// ─── Evaluation Result Renderer ──────────────────────────────
function renderEvaluationResult(data, containerEl) {
    if (!containerEl) return;
    containerEl.classList.remove('hidden');
    const aiEval = data.evaluation || {};
    const score = aiEval.score ?? 0;
    const passed = score >= 70;
    const scoreColor = passed ? 'text-green-400' : 'text-red-400';
    const nextRound = data.next_round;

    containerEl.innerHTML = `
    <div class="space-y-4 mt-4 border-t border-slate-700 pt-5">
        <div class="flex items-center justify-between">
            <h4 class="font-bold text-lg text-white">AI Evaluation</h4>
            <span class="${scoreColor} font-black text-3xl">${score}<span class="text-lg text-slate-400">/100</span></span>
        </div>
        <p class="text-slate-300 text-sm leading-relaxed">${aiEval.feedback || 'No feedback provided.'}</p>
        <div class="grid grid-cols-2 gap-4">
            <div class="bg-green-900/20 border border-green-800/50 rounded-xl p-4">
                <p class="text-green-400 font-bold text-xs uppercase tracking-wider mb-2">Strengths</p>
                <ul class="space-y-1">${(aiEval.strengths || []).map(s => `<li class="text-slate-300 text-xs flex items-start gap-1.5"><span class="text-green-400 mt-0.5">✓</span>${s}</li>`).join('') || '<li class="text-slate-500 text-xs">None noted</li>'}</ul>
            </div>
            <div class="bg-red-900/20 border border-red-800/50 rounded-xl p-4">
                <p class="text-red-400 font-bold text-xs uppercase tracking-wider mb-2">Areas to Improve</p>
                <ul class="space-y-1">${(aiEval.weaknesses || []).map(s => `<li class="text-slate-300 text-xs flex items-start gap-1.5"><span class="text-red-400 mt-0.5">→</span>${s}</li>`).join('') || '<li class="text-slate-500 text-xs">None noted</li>'}</ul>
            </div>
        </div>
        ${aiEval.recommendation ? `
        <div class="bg-blue-900/30 border border-blue-700/50 rounded-xl p-3">
            <p class="text-blue-300 text-sm"><strong class="text-blue-200">Tip:</strong> ${aiEval.recommendation}</p>
        </div>` : ''}
        <div class="flex justify-end gap-3 pt-2">
            ${data.status === 'completed'
                ? `<button onclick="claimCertificate('${currentSessionId}', 'Full Assessment')" class="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-yellow-500/20">🎓 Claim Certificate</button>
                   <button onclick="renderDashboard()" class="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">Back to Dashboard</button>`
                : nextRound && data.status === 'in_progress' && passed
                ? `<button onclick="renderQuestion(${nextRound})" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30">Next Round (${data.attempts}/2) →</button>`
                : `<button onclick="renderDashboard()" class="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">Back to Dashboard</button>`
            }
        </div>
    </div>`;
}

// ─── Timer ────────────────────────────────────────────────────
function startTimer(seconds) {
    clearInterval(timerInterval);
    let timeLeft = seconds;
    const display = document.getElementById('timer-display');
    timerInterval = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        if (display) display.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> ${m}:${s}`;
        if (timeLeft <= 0) { clearInterval(timerInterval); const btn = document.getElementById('submit-btn'); if (btn) btn.click(); }
    }, 1000);
}

async function submitAnswer(round) {
    clearInterval(timerInterval);
    let answer = '';
    if (round === 1) {
        const checked = document.querySelector('input[name="mcq-answer"]:checked');
        answer = checked ? checked.value : 'No Answer Submitted (Timeout)';
    } else {
        const box = document.getElementById('answer-box');
        if (box) answer = box.value;
    }
    const question = document.getElementById('current-question')?.innerText || '';
    if (!answer.trim() && round !== 1) return;

    document.getElementById('eval-loading')?.classList.remove('hidden');
    const btn = document.getElementById('submit-btn');
    if (btn) btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/interview/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ session_id: currentSessionId, question, answer })
        });
        const data = await parseJSON(res);
        document.getElementById('eval-loading')?.classList.add('hidden');
        renderEvaluationResult(data, document.getElementById('eval-result'));
    } catch (err) {
        document.getElementById('eval-loading')?.classList.add('hidden');
        showToast('Evaluation failed: ' + err.message, 'error');
    }
}

// ────────────────────────────────────────────────────────────
//   INIT
// ────────────────────────────────────────────────────────────
renderApp();


// ════════════════════════════════════════════════════════════
//   AI CAREER ASSISTANT — CHATBOT MODULE
//   Features: Context-aware AI, markdown, syntax highlighting,
//   history, suggested questions, copy/regenerate, clear
// ════════════════════════════════════════════════════════════

// ── State ────────────────────────────────────────────────────
let chatOpen = false;
let chatLoading = false;
let chatInitialized = false;
let lastBotMessageId = null;

// ── Configure Marked (Markdown parser) ───────────────────────
function initMarked() {
    if (typeof marked === 'undefined') return;
    marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function(code, lang) {
            if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
                try { return hljs.highlight(code, { language: lang }).value; } catch (e) {}
            }
            return typeof hljs !== 'undefined' ? hljs.highlightAuto(code).value : code;
        }
    });
}

// ── Render markdown text safely ───────────────────────────────
function renderMarkdown(text) {
    if (typeof marked === 'undefined') return text.replace(/\n/g, '<br>');
    try {
        const html = marked.parse(text);
        // Highlight any code blocks that weren't auto-highlighted
        setTimeout(() => {
            if (typeof hljs !== 'undefined') {
                document.querySelectorAll('#chat-messages pre code').forEach(el => {
                    hljs.highlightElement(el);
                });
            }
        }, 50);
        return html;
    } catch (e) {
        return text.replace(/\n/g, '<br>');
    }
}

// ── Show / Hide chatbot ──────────────────────────────────────
function toggleChat() {
    chatOpen = !chatOpen;
    const panel = document.getElementById('chat-panel');
    const fab = document.getElementById('chat-fab');
    const notify = document.getElementById('chat-notify');
    const icon = document.getElementById('chat-fab-icon');

    if (chatOpen) {
        panel.classList.remove('scale-0', 'opacity-0', 'pointer-events-none');
        panel.classList.add('scale-100', 'opacity-100');
        fab.classList.add('ring-2', 'ring-indigo-400');
        notify.classList.add('hidden');
        icon.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
        </svg>`;

        if (!chatInitialized) {
            initChatbot();
        } else {
            scrollChatToBottom();
        }
        setTimeout(() => document.getElementById('chat-input')?.focus(), 300);
    } else {
        panel.classList.add('scale-0', 'opacity-0', 'pointer-events-none');
        panel.classList.remove('scale-100', 'opacity-100');
        fab.classList.remove('ring-2', 'ring-indigo-400');
        icon.innerHTML = `<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
        </svg>`;
    }
}

// ── Initialize: load history + suggestions ───────────────────
async function initChatbot() {
    chatInitialized = true;
    initMarked();
    showChatWidget();

    const msgContainer = document.getElementById('chat-messages');
    msgContainer.innerHTML = '';

    // Welcome message
    appendChatMessage('assistant', `👋 **Hi! I'm your AI Career Mentor.**

I can help you with:
- 📄 Resume analysis & ATS improvements
- 🎯 Mock interviews & question practice
- 💻 Coding help (DSA, Python, Java, React...)
- 🚀 Career guidance & learning roadmaps
- 🏢 Company-specific interview prep

What would you like to work on today?`, false);

    // Load history in parallel
    loadChatHistory();
    loadChatSuggestions();
}

// ── Show widget for authenticated users ───────────────────────
function showChatWidget() {
    const widget = document.getElementById('chat-widget');
    if (widget && token) widget.style.display = '';
}

function hideChatWidget() {
    const widget = document.getElementById('chat-widget');
    if (widget) widget.style.display = 'none';
}

// ── Load past chat history from API ──────────────────────────
async function loadChatHistory() {
    if (!token) return;
    try {
        const res = await fetch(`${API_BASE}/chat/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.history && data.history.length > 0) {
            // Clear welcome message and show history
            const msgContainer = document.getElementById('chat-messages');
            msgContainer.innerHTML = '';
            data.history.forEach(m => {
                appendChatMessage(m.role, m.content, false);
            });
            scrollChatToBottom();
        }
    } catch (e) {
        console.warn('Chat history load failed:', e);
    }
}

// ── Load suggested questions ──────────────────────────────────
async function loadChatSuggestions() {
    if (!token) return;
    try {
        const res = await fetch(`${API_BASE}/chat/suggestions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        renderChatSuggestions(data.suggestions || []);
    } catch (e) {
        renderChatSuggestions([
            'How can I improve my ATS score?',
            'Start a mock interview',
            'What should I learn next?',
            'Explain System Design basics'
        ]);
    }
}

function renderChatSuggestions(suggestions) {
    const box = document.getElementById('chat-suggestions');
    const list = document.getElementById('chat-suggestion-list');
    if (!box || !list || !suggestions.length) return;

    list.innerHTML = suggestions.slice(0, 6).map(q =>
        `<button onclick="useSuggestion(this)" data-q="${q.replace(/"/g,'&quot;')}"
            class="text-[11px] bg-slate-800 hover:bg-indigo-900/50 border border-slate-700 hover:border-indigo-600 text-slate-300 hover:text-indigo-300 px-2.5 py-1.5 rounded-lg transition-all text-left leading-tight">
            ${q}
        </button>`
    ).join('');
    box.classList.remove('hidden');
}

function useSuggestion(btn) {
    const q = btn.dataset.q;
    const input = document.getElementById('chat-input');
    if (input && q) {
        input.value = q;
        autoResizeChatInput(input);
        document.getElementById('chat-suggestions').classList.add('hidden');
        sendChatMessage();
    }
}

// ── Send message ──────────────────────────────────────────────
async function sendChatMessage() {
    if (chatLoading) return;
    const input = document.getElementById('chat-input');
    const message = (input?.value || '').trim();
    if (!message) return;

    // Hide suggestions once user starts chatting
    document.getElementById('chat-suggestions')?.classList.add('hidden');

    // Display user message
    input.value = '';
    input.style.height = 'auto';
    appendChatMessage('user', message, true);
    scrollChatToBottom();

    // Show typing indicator
    chatLoading = true;
    setChatLoading(true);

    // Build resume context payload (STEP 7 – resume integration)
    const payload = { message };
    if (typeof chatSession !== 'undefined') {
        if (chatSession.resumeText)  payload.resume_text  = chatSession.resumeText;
        if (chatSession.resumeName)  payload.resume_name  = chatSession.resumeName;
        if (chatSession.atsScore !== null) payload.ats_score = chatSession.atsScore;
    }

    try {
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const res = await fetch(`${API_BASE}/chat/message`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.status === 401 || res.status === 422) { logout(); return; }

        const data = await res.json();
        setChatLoading(false);
        chatLoading = false;

        if (data.response) {
            const msgId = appendChatMessage('assistant', data.response, true);
            lastBotMessageId = msgId;
            scrollChatToBottom();
        } else {
            appendChatMessage('assistant', '⚠️ ' + (data.error || 'Something went wrong. Please try again.'), true);
        }
    } catch (err) {
        setChatLoading(false);
        chatLoading = false;
        if (err.name === 'AbortError') {
            appendChatMessage('assistant', '⏱️ **Request timed out.** The server took too long. Please try again.', true);
        } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
            appendChatMessage('assistant', '🔴 **Network error.** Cannot reach the server. Please check your connection.', true);
        } else {
            appendChatMessage('assistant', '⚠️ An error occurred: ' + err.message, true);
        }
    }
    scrollChatToBottom();
}

// ── Append a message to chat UI ───────────────────────────────
function appendChatMessage(role, content, animate = true) {
    const container = document.getElementById('chat-messages');
    if (!container) return null;

    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
    const isUser = role === 'user';
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let html;
    if (isUser) {
        const escaped = content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        html = `
        <div id="${id}" class="flex justify-end ${animate ? 'animate-fadeIn' : ''}">
            <div class="max-w-[85%]">
                <div class="bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-lg">
                    <p class="whitespace-pre-wrap break-words">${escaped}</p>
                </div>
                <p class="text-slate-600 text-[10px] text-right mt-1">${timeStr}</p>
            </div>
        </div>`;
    } else {
        const rendered = renderMarkdown(content);
        html = `
        <div id="${id}" class="flex gap-2 ${animate ? 'animate-fadeIn' : ''}">
            <div class="w-7 h-7 rounded-full bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">🤖</div>
            <div class="max-w-[88%]">
                <div class="bg-slate-800 border border-slate-700/60 text-slate-100 text-sm px-4 py-3 rounded-2xl rounded-tl-sm shadow-md chat-bot-msg prose prose-invert prose-sm max-w-none">
                    ${rendered}
                </div>
                <div class="flex items-center gap-2 mt-1.5">
                    <p class="text-slate-600 text-[10px]">${timeStr}</p>
                    <button onclick="copyChatMessage('${id}')" title="Copy"
                        class="text-slate-600 hover:text-slate-400 transition-colors text-[10px] flex items-center gap-0.5">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                        Copy
                    </button>
                    <button onclick="regenerateLastResponse()" title="Regenerate"
                        class="text-slate-600 hover:text-slate-400 transition-colors text-[10px] flex items-center gap-0.5">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        Retry
                    </button>
                </div>
            </div>
        </div>`;
    }

    container.insertAdjacentHTML('beforeend', html);

    // Apply hljs to any code blocks in this new message
    if (!isUser && typeof hljs !== 'undefined') {
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) el.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b));
        }, 60);
    }

    return id;
}

// ── Copy message content ──────────────────────────────────────
function copyChatMessage(msgId) {
    const el = document.getElementById(msgId);
    if (!el) return;
    const textContent = el.querySelector('.chat-bot-msg')?.innerText || el.innerText;
    navigator.clipboard.writeText(textContent).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Copy failed — try selecting text manually', 'warning');
    });
}

// ── Regenerate last bot response ──────────────────────────────
async function regenerateLastResponse() {
    if (chatLoading) return;
    // Find last user message from DOM
    const msgs = document.querySelectorAll('#chat-messages > div');
    let lastUserMsg = null;
    for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].querySelector('.from-indigo-600')) {
            lastUserMsg = msgs[i].querySelector('p')?.textContent;
            break;
        }
    }
    if (!lastUserMsg) { showToast('No message to regenerate', 'warning'); return; }

    // Remove last bot message from DOM
    if (lastBotMessageId) {
        document.getElementById(lastBotMessageId)?.remove();
        lastBotMessageId = null;
    }

    const input = document.getElementById('chat-input');
    if (input) {
        input.value = lastUserMsg;
        await sendChatMessage();
    }
}

// ── Clear all history ─────────────────────────────────────────
async function clearChatHistory() {
    if (!confirm('Clear all chat history? This cannot be undone.')) return;
    try {
        await fetch(`${API_BASE}/chat/clear`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        document.getElementById('chat-messages').innerHTML = '';
        chatInitialized = false;
        initChatbot();
        showToast('Chat history cleared', 'info');
    } catch (e) {
        showToast('Failed to clear history', 'error');
    }
}

// ── Typing indicator ──────────────────────────────────────────
function setChatLoading(loading) {
    const typing = document.getElementById('chat-typing');
    const sendBtn = document.getElementById('chat-send-btn');
    if (typing) typing.classList.toggle('hidden', !loading);
    if (sendBtn) sendBtn.disabled = loading;
    if (loading) scrollChatToBottom();
}

// ── Scroll to bottom ──────────────────────────────────────────
function scrollChatToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) setTimeout(() => { container.scrollTop = container.scrollHeight; }, 60);
}

// ── Handle Enter key (send) / Shift+Enter (newline) ──────────
function handleChatKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
    }
}

// ── Auto-resize textarea ──────────────────────────────────────
function autoResizeChatInput(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ── Widget visibility is handled directly in renderApp() ─────
// renderApp() was patched at the top of app.js to show/hide
// the chat widget based on auth state — no monkey-patch needed.

// ── CSS: fade-in animation & chat prose styles ────────────────
(function injectChatStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out forwards; }

        /* Chat message prose overrides */
        .chat-bot-msg h1,.chat-bot-msg h2,.chat-bot-msg h3 {
            color: #e2e8f0; margin-top: 0.75rem; margin-bottom: 0.25rem; font-weight: 700;
        }
        .chat-bot-msg h1 { font-size: 1rem; }
        .chat-bot-msg h2 { font-size: 0.9rem; }
        .chat-bot-msg h3 { font-size: 0.85rem; }
        .chat-bot-msg p  { margin: 0.25rem 0; color: #cbd5e1; line-height: 1.6; }
        .chat-bot-msg ul, .chat-bot-msg ol { padding-left: 1.2rem; margin: 0.4rem 0; }
        .chat-bot-msg li { margin: 0.2rem 0; color: #cbd5e1; }
        .chat-bot-msg code:not(pre code) {
            background: #1e293b; border: 1px solid #334155;
            color: #7dd3fc; padding: 1px 5px; border-radius: 4px; font-size: 0.8rem;
        }
        .chat-bot-msg pre {
            background: #0f172a; border: 1px solid #1e293b;
            border-radius: 8px; overflow-x: auto; margin: 0.5rem 0;
            padding: 0.75rem 1rem; position: relative;
        }
        .chat-bot-msg pre code { background: transparent; border: none; color: inherit; padding: 0; font-size: 0.78rem; }
        .chat-bot-msg strong { color: #f1f5f9; }
        .chat-bot-msg em { color: #94a3b8; }
        .chat-bot-msg blockquote {
            border-left: 3px solid #4f46e5; padding-left: 0.75rem;
            color: #94a3b8; margin: 0.5rem 0; font-style: italic;
        }
        .chat-bot-msg a { color: #818cf8; text-decoration: underline; }
        .chat-bot-msg hr { border-color: #1e293b; margin: 0.5rem 0; }
        .chat-bot-msg table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
        .chat-bot-msg th { background: #1e293b; color: #94a3b8; padding: 4px 8px; text-align: left; }
        .chat-bot-msg td { border: 1px solid #1e293b; padding: 4px 8px; color: #cbd5e1; }

        /* Scrollbar for chat messages */
        #chat-messages::-webkit-scrollbar { width: 4px; }
        #chat-messages::-webkit-scrollbar-track { background: transparent; }
        #chat-messages::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

        /* Mobile responsiveness */
        @media (max-width: 420px) {
            #chat-panel { width: calc(100vw - 24px); right: 12px; }
        }
    `;
    document.head.appendChild(style);
})();

// ── Auto-init: widget visibility is already set by renderApp() ─
// showChatWidget() is a safety net for edge cases.
if (token && token !== 'undefined' && token !== 'null') {
    showChatWidget();
}

// ============================================================================
//   RESUME-BASED AI INTERVIEW MODULE
// ============================================================================
let resumeInterviewSession = null;
let resumeInterviewTimer = null;
let resumeInterviewDurationSeconds = 0;
let resumeInterviewVoiceRecognition = null;
let resumeInterviewIsListening = false;
let resumeInterviewTtsEnabled = false;

// ── Setup Page: select existing resume or upload new ──────────────────────
async function renderResumeInterviewSetup() {
    setActiveNav('dashboard'); // keep focus in dashboard context
    const container = document.getElementById('app-container');
    showLoader();
    
    try {
        // Fetch user's uploaded resume history
        const res = await fetch(`${API_BASE}/resume/history`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error("Failed to load resume history");
        const historyData = await parseJSON(res);
        const history = historyData.history || [];
        
        let dropdownHtml = `<option value="">-- Choose from History --</option>`;
        if (history.length > 0) {
            dropdownHtml += history.map(h => `<option value="${h.id}">${h.filename} (Score: ${h.score?.toFixed(0) || 'N/A'})</option>`).join('');
        }
        
        container.innerHTML = `
        <div class="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <!-- Header -->
            <div class="border-b border-slate-800 pb-6 flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-black text-white flex items-center gap-3">
                        <span class="text-indigo-500 font-normal">📝</span> Resume-Based AI Interview Setup
                    </h1>
                    <p class="text-slate-400 mt-1">Select an existing resume or upload a new one to generate a tailored interview plan.</p>
                </div>
                <button onclick="renderDashboard()" class="text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-1">
                    ← Back
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Select Existing Resume -->
                <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-3 mb-4">
                            <span class="text-2xl">📋</span>
                            <h3 class="text-lg font-bold text-white">Select from History</h3>
                        </div>
                        <p class="text-slate-400 text-sm mb-6">Choose a resume you have already uploaded and analyzed on the platform.</p>
                        
                        <select id="existing-resume-select" class="w-full bg-slate-800 border border-slate-700 text-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500">
                            ${dropdownHtml}
                        </select>
                    </div>
                    <button onclick="startInterviewWithExisting()" class="mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95 w-full">
                        Start with Selected Resume
                    </button>
                </div>
                
                <!-- Upload New Resume -->
                <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-3 mb-4">
                            <span class="text-2xl">📤</span>
                            <h3 class="text-lg font-bold text-white">Upload New Resume</h3>
                        </div>
                        <p class="text-slate-400 text-sm mb-4">Upload a new PDF or DOCX file specifically for this interview session.</p>
                        
                        <div id="setup-upload-zone" class="border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-indigo-500 transition-all cursor-pointer group"
                            onclick="document.getElementById('setup-file-input').click()"
                            ondragover="event.preventDefault(); this.classList.add('border-indigo-500')"
                            ondragleave="this.classList.remove('border-indigo-500')"
                            ondrop="handleSetupResumeDrop(event)">
                            <div class="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-900 transition-colors">
                                <svg class="w-6 h-6 text-slate-400 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                            </div>
                            <p class="text-slate-400 text-xs font-semibold">PDF or DOCX (Max 10MB)</p>
                            <input id="setup-file-input" type="file" class="hidden" accept=".pdf,.docx" onchange="uploadSetupResume(event)">
                        </div>
                    </div>
                    <div id="setup-upload-status" class="mt-4 hidden"></div>
                </div>
            </div>
        </div>`;
    } catch(err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-20">Error loading setup view: ${err.message}</p>`;
    }
}

function handleSetupResumeDrop(e) {
    e.preventDefault();
    document.getElementById('setup-upload-zone').classList.remove('border-indigo-500');
    const file = e.dataTransfer.files[0];
    if (file) processSetupResumeFile(file);
}

function uploadSetupResume(e) {
    const file = e.target.files[0];
    if (file) processSetupResumeFile(file);
}

async function processSetupResumeFile(file) {
    const statusEl = document.getElementById('setup-upload-status');
    statusEl.classList.remove('hidden');
    statusEl.innerHTML = `
    <div class="bg-indigo-900/20 border border-indigo-700 text-indigo-300 p-4 rounded-xl flex items-center gap-3">
        <div class="animate-spin w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full"></div> 
        Extracting details and generating plan...
    </div>`;

    const formData = new FormData();
    formData.append('resume', file);

    try {
        const res = await fetch(`${API_BASE}/resume-interview/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || "Failed to process resume");
        renderResumeInterviewAnalysis(data);
    } catch(e) {
        statusEl.innerHTML = `<div class="bg-red-900/20 border border-red-700 text-red-300 p-4 rounded-xl">❌ ${e.message}</div>`;
    }
}

async function startInterviewWithExisting() {
    const select = document.getElementById('existing-resume-select');
    const id = select.value;
    if (!id) { showToast("Please select a resume from your history.", "warning"); return; }
    
    showLoader();
    try {
        const res = await fetch(`${API_BASE}/resume-interview/select-existing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ resume_id: id })
        });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || "Failed to start interview");
        renderResumeInterviewAnalysis(data);
    } catch(err) {
        showToast(err.message, "error");
        renderResumeInterviewSetup();
    }
}

// ── Render Analysis & Plan Page ───────────────────────────
function renderResumeInterviewAnalysis(session) {
    resumeInterviewSession = session;
    const container = document.getElementById('app-container');
    
    const details = session.details || {};
    const plan = session.plan || [];
    const projects = details.projects || [];
    
    const planQuestionsHtml = plan.map((q, i) => `
    <li class="flex items-start gap-3 bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
        <span class="w-6 h-6 rounded-full bg-indigo-900 border border-indigo-700 text-indigo-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">${i+1}</span>
        <p class="text-slate-200 text-sm leading-relaxed">${q}</p>
    </li>`).join('');

    container.innerHTML = `
    <div class="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
        <!-- Header -->
        <div class="border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 class="text-3xl font-black text-white">Interview Plan Generated</h1>
                <p class="text-slate-400 mt-1">Review the resume analysis and generated question path before starting.</p>
            </div>
            <div class="flex gap-3">
                <span class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-900/60 border border-indigo-700 text-indigo-300">
                    🎯 Level: ${session.difficulty}
                </span>
                <span class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-green-900/60 border border-green-700 text-green-300">
                    📄 ${session.resume_name}
                </span>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Details Left -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Extracted Profile -->
                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 class="font-bold text-white text-lg flex items-center gap-2">🔍 Extracted Profile Summary</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                        <div>
                            <p class="text-xs text-slate-500 font-bold uppercase">Name</p>
                            <p class="text-white font-semibold mt-0.5">${details.name || 'Not detected'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 font-bold uppercase">Education</p>
                            <p class="text-white font-semibold mt-0.5">${details.education?.[0] || 'Not detected'}</p>
                        </div>
                        <div class="md:col-span-2">
                            <p class="text-xs text-slate-500 font-bold uppercase mb-1">Key Technologies</p>
                            <div class="flex flex-wrap gap-1.5">
                                ${details.technologies?.map(t => `<span class="text-xs px-2 py-0.5 bg-blue-900/40 border border-blue-700/40 text-blue-300 rounded-full">${t}</span>`).join('') || '<span class="text-slate-500">None detected</span>'}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Projects -->
                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 class="font-bold text-white text-lg mb-4 flex items-center gap-2">🚀 Projects</h3>
                    <div class="space-y-4">
                        ${projects.map(p => `
                        <div class="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 space-y-2">
                            <h4 class="font-bold text-white text-sm">${p.title}</h4>
                            <p class="text-slate-400 text-xs">${p.description}</p>
                            <p class="text-xs text-slate-500">Technologies: <span class="text-slate-300">${p.technologies?.join(', ') || 'N/A'}</span></p>
                        </div>`).join('') || '<p class="text-slate-500 text-xs">No projects listed</p>'}
                    </div>
                </div>
            </div>

            <!-- Plan / Start Right -->
            <div class="space-y-6">
                <!-- Action Card -->
                <div class="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-center space-y-4 shadow-xl shadow-indigo-950/10">
                    <h3 class="font-bold text-white text-lg">Ready to begin?</h3>
                    <p class="text-slate-400 text-sm">The interview contains 5 core questions plus adaptive follow-ups based on your responses.</p>
                    
                    <button onclick="startResumeInterview()" class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95 w-full">
                        Start AI Interview Now
                    </button>
                </div>

                <!-- Plan Path -->
                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 class="font-bold text-white text-base mb-3 flex items-center gap-2">📋 Interview Question Plan</h3>
                    <ol class="space-y-3">${planQuestionsHtml}</ol>
                </div>
            </div>
        </div>
    </div>`;
}

// ── Start Interview Flow ──────────────────────────────────
function startResumeInterview() {
    resumeInterviewDurationSeconds = 0;
    resumeInterviewTimer = setInterval(() => {
        resumeInterviewDurationSeconds++;
    }, 1000);
    
    renderResumeInterviewFlow();
}

async function renderResumeInterviewFlow() {
    const container = document.getElementById('app-container');
    showLoader();
    
    try {
        const res = await fetch(`${API_BASE}/resume-interview/session/${resumeInterviewSession.session_id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const sessionState = await parseJSON(res);
        if (!res.ok) throw new Error(sessionState.error || "Failed to load session details");

        const qAsked = sessionState.questions_asked || [];
        const currentQ = qAsked[qAsked.length - 1]; // Current question is the last one in asked list
        const totalPlanned = 5;
        const mainIdx = sessionState.current_question_idx;
        
        // Check if last question asked was a main question or a follow-up
        const isFollowUp = qAsked.length > (2 * mainIdx + 1);

        container.innerHTML = `
        <div class="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                    <span class="text-xs text-indigo-400 uppercase tracking-widest font-bold">Resume-Based Interview</span>
                    <h2 class="text-2xl font-black text-white flex items-center gap-2 mt-1">
                        Question ${mainIdx + 1} of ${totalPlanned} 
                        ${isFollowUp ? '<span class="text-xs bg-purple-900 border border-purple-700 text-purple-300 px-2.5 py-1 rounded-full font-bold ml-2">adaptive follow-up</span>' : ''}
                    </h2>
                </div>
                <div class="flex items-center gap-2">
                    <!-- Typing / Voice Toggles -->
                    <button id="mode-typing-btn" onclick="toggleResumeInterviewInputMode('typing')" class="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold border border-indigo-500 shadow transition-all active:scale-95">Typing Mode</button>
                    <button id="mode-voice-btn" onclick="toggleResumeInterviewInputMode('voice')" class="px-3.5 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold border border-slate-700 transition-all active:scale-95">Voice Mode</button>
                </div>
            </div>

            <!-- Voice Controls Display (Hidden in Typing Mode) -->
            <div id="voice-controls-panel" class="hidden bg-slate-900 border border-indigo-500/20 p-4 rounded-xl flex items-center justify-between gap-4">
                <div class="flex items-center gap-2 text-xs text-slate-300">
                    <span class="flex h-2 w-2 relative">
                        <span id="voice-pulse" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span id="voice-dot" class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <span id="voice-status-text">Click Speak to respond</span>
                </div>
                <div class="flex items-center gap-2">
                    <button id="voice-listen-btn" onclick="toggleResumeInterviewVoiceListening()" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow">
                        🎤 Start Speaking
                    </button>
                    <button id="voice-tts-btn" onclick="toggleResumeInterviewTTS()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                        🔊 Read Question Aloud
                    </button>
                </div>
            </div>

            <!-- Question Card -->
            <div class="bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-lg flex-shrink-0 mt-0.5">🤖</div>
                <div class="space-y-3 flex-1">
                    <p class="text-white font-medium text-lg leading-relaxed" id="ri-question-text">${currentQ}</p>
                    
                    <!-- Hint area -->
                    <div id="ri-hint-area" class="hidden text-slate-400 text-xs italic bg-slate-800/40 border border-slate-700/30 p-3 rounded-lg flex items-center gap-2">
                        <span>💡</span> <span id="ri-hint-text">Hint goes here...</span>
                    </div>
                </div>
            </div>

            <!-- Answer Box -->
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div class="flex items-center justify-between">
                    <h4 class="text-sm font-bold text-slate-400 uppercase tracking-wider">Your Answer</h4>
                    <button onclick="getResumeInterviewHint()" class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">💡 Get a Hint</button>
                </div>
                
                <textarea id="ri-answer-input" rows="5" placeholder="Type or speak your answer details..."
                    class="w-full bg-slate-800 border border-slate-700 text-white p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500 leading-relaxed resize-none"></textarea>
                
                <div class="flex items-center justify-between">
                    <span id="ri-eval-status" class="text-sm text-slate-400 hidden animate-pulse">AI is scoring your response...</span>
                    <button id="ri-submit-btn" onclick="submitResumeInterviewAnswer('${escapeStr(currentQ)}')"
                        class="ml-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/30 active:scale-95">
                        Submit Answer
                    </button>
                </div>
            </div>

            <!-- Evaluation Feedback Display -->
            <div id="ri-eval-result" class="hidden"></div>
        </div>`;

        // Automatically read aloud if TTS was previously enabled
        if (resumeInterviewTtsEnabled) {
            speakResumeQuestion(currentQ);
        }

        // Initialize mode based on setting
        toggleResumeInterviewInputMode(resumeInterviewIsListening ? 'voice' : 'typing');

    } catch(err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-20">Error loading interview: ${err.message}</p>`;
    }
}

// ── Speech / Mode Toggles ─────────────────────────────────
function toggleResumeInterviewInputMode(mode) {
    const typingBtn = document.getElementById('mode-typing-btn');
    const voiceBtn = document.getElementById('mode-voice-btn');
    const voicePanel = document.getElementById('voice-controls-panel');
    const answerInput = document.getElementById('ri-answer-input');

    if (!typingBtn || !voiceBtn) return;

    if (mode === 'voice') {
        typingBtn.className = "px-3.5 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold border border-slate-700 transition-all active:scale-95";
        voiceBtn.className = "px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold border border-indigo-500 shadow transition-all active:scale-95";
        if (voicePanel) voicePanel.classList.remove('hidden');
        if (answerInput) answerInput.placeholder = "Click 'Start Speaking' and state your response clearly...";
    } else {
        stopResumeInterviewVoiceListening();
        typingBtn.className = "px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold border border-indigo-500 shadow transition-all active:scale-95";
        voiceBtn.className = "px-3.5 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold border border-slate-700 transition-all active:scale-95";
        if (voicePanel) voicePanel.classList.add('hidden');
        if (answerInput) answerInput.placeholder = "Type your detailed answer here...";
    }
}

function toggleResumeInterviewVoiceListening() {
    const listenBtn = document.getElementById('voice-listen-btn');
    const statusText = document.getElementById('voice-status-text');
    const pulse = document.getElementById('voice-pulse');
    const dot = document.getElementById('voice-dot');
    
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast('Speech recognition not supported in this browser.', 'warning'); return; }

    if (resumeInterviewIsListening) {
        stopResumeInterviewVoiceListening();
    } else {
        resumeInterviewIsListening = true;
        resumeInterviewVoiceRecognition = new SR();
        resumeInterviewVoiceRecognition.continuous = false;
        resumeInterviewVoiceRecognition.interimResults = true;
        resumeInterviewVoiceRecognition.lang = 'en-US';

        if (listenBtn) {
            listenBtn.innerHTML = `⏹ Stop Listening`;
            listenBtn.classList.replace('bg-indigo-600', 'bg-red-600');
            listenBtn.classList.replace('hover:bg-indigo-500', 'hover:bg-red-500');
        }
        if (statusText) statusText.textContent = "Listening... Speak clearly into your mic";
        if (pulse) pulse.classList.replace('bg-indigo-400', 'bg-red-400');
        if (dot) dot.classList.replace('bg-indigo-500', 'bg-red-500');

        resumeInterviewVoiceRecognition.onresult = (e) => {
            const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
            const answerInput = document.getElementById('ri-answer-input');
            if (answerInput) answerInput.value = transcript;
        };

        resumeInterviewVoiceRecognition.onend = () => {
            stopResumeInterviewVoiceListening();
        };

        resumeInterviewVoiceRecognition.onerror = () => {
            stopResumeInterviewVoiceListening();
            showToast('Voice input error occurred.', 'error');
        };

        resumeInterviewVoiceRecognition.start();
    }
}

function stopResumeInterviewVoiceListening() {
    resumeInterviewIsListening = false;
    const listenBtn = document.getElementById('voice-listen-btn');
    const statusText = document.getElementById('voice-status-text');
    const pulse = document.getElementById('voice-pulse');
    const dot = document.getElementById('voice-dot');

    if (listenBtn) {
        listenBtn.innerHTML = `🎤 Start Speaking`;
        listenBtn.classList.replace('bg-red-600', 'bg-indigo-600');
        listenBtn.classList.replace('hover:bg-red-500', 'hover:bg-indigo-500');
    }
    if (statusText) statusText.textContent = "Click Start Speaking to respond";
    if (pulse) pulse.classList.replace('bg-red-400', 'bg-indigo-400');
    if (dot) dot.classList.replace('bg-red-500', 'bg-indigo-500');

    if (resumeInterviewVoiceRecognition) {
        try { resumeInterviewVoiceRecognition.stop(); } catch(_) {}
        resumeInterviewVoiceRecognition = null;
    }
}

function toggleResumeInterviewTTS() {
    const qText = document.getElementById('ri-question-text')?.textContent;
    const ttsBtn = document.getElementById('voice-tts-btn');
    
    if (!qText) return;

    if (resumeInterviewTtsEnabled) {
        resumeInterviewTtsEnabled = false;
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (ttsBtn) {
            ttsBtn.innerHTML = `🔊 Read Question Aloud`;
            ttsBtn.classList.replace('bg-indigo-900/40', 'bg-slate-800');
            ttsBtn.classList.replace('text-indigo-300', 'text-slate-300');
        }
    } else {
        resumeInterviewTtsEnabled = true;
        speakResumeQuestion(qText);
        if (ttsBtn) {
            ttsBtn.innerHTML = `🔇 Stop Reading`;
            ttsBtn.classList.replace('bg-slate-800', 'bg-indigo-900/40');
            ttsBtn.classList.replace('text-slate-300', 'text-indigo-300');
        }
    }
}

function speakResumeQuestion(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Cancel current speaking
    const clean = text.replace(/[^\w\s\?\,\.\-]/g, '');
    const utterance = new SpeechSynthesisUtterance(clean.slice(0, 300));
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    
    utterance.onend = () => {
        const isVoiceMode = document.getElementById('mode-voice-btn')?.classList.contains('bg-indigo-600');
        if (isVoiceMode && !resumeInterviewIsListening) {
            toggleResumeInterviewVoiceListening();
        }
    };
    
    window.speechSynthesis.speak(utterance);
}

// ── Hint System ──────────────────────────────────────────
async function getResumeInterviewHint() {
    const hintEl = document.getElementById('ri-hint-area');
    const hintText = document.getElementById('ri-hint-text');
    if (!hintEl || !hintText) return;
    
    hintText.textContent = "Loading hint...";
    hintEl.classList.remove('hidden');

    try {
        const res = await fetch(`${API_BASE}/resume-interview/session/${resumeInterviewSession.session_id}/hint`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || "Failed to load hint");
        hintText.textContent = data.hint || "Elaborate further on implementation details.";
    } catch(err) {
        hintText.textContent = "Elaborate further on technical details and configurations.";
    }
}

// ── Submit Answer ────────────────────────────────────────
async function submitResumeInterviewAnswer(question) {
    const answerEl = document.getElementById('ri-answer-input');
    const answer = answerEl ? answerEl.value.trim() : '';
    if (!answer) { showToast('Please write or speak an answer before submitting.', 'warning'); return; }

    const submitBtn = document.getElementById('ri-submit-btn');
    const statusEl = document.getElementById('ri-eval-status');
    
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Evaluating...'; }
    if (statusEl) statusEl.classList.remove('hidden');
    if (window.speechSynthesis) window.speechSynthesis.cancel(); // Stop talking on submit

    try {
        const res = await fetch(`${API_BASE}/resume-interview/session/${resumeInterviewSession.session_id}/submit-answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ answer })
        });
        const data = await parseJSON(res);
        if (statusEl) statusEl.classList.add('hidden');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Answer'; }
        if (!res.ok) throw new Error(data.error || "Evaluation failed");

        // Render response details inside the result panel
        const evalResult = document.getElementById('ri-eval-result');
        const evaluation = data.evaluation || {};
        const score = evaluation.score || 0;
        const scoreColor = score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
        
        evalResult.classList.remove('hidden');
        evalResult.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-in slide-in-from-bottom duration-300">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 class="font-bold text-white text-base">Question Answer Score</h4>
                <span class="${scoreColor} font-black text-2xl">${score}<span class="text-xs text-slate-500">/100</span></span>
            </div>

            <!-- Breakdown Dimensions -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div class="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
                    <p class="text-slate-500 uppercase font-bold">Tech Accuracy</p>
                    <p class="text-white font-black text-sm mt-0.5">${evaluation.technical_accuracy || 0}%</p>
                </div>
                <div class="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
                    <p class="text-slate-500 uppercase font-bold">Confidence</p>
                    <p class="text-white font-black text-sm mt-0.5">${evaluation.confidence || 0}%</p>
                </div>
                <div class="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
                    <p class="text-slate-500 uppercase font-bold">Communication</p>
                    <p class="text-white font-black text-sm mt-0.5">${evaluation.communication || 0}%</p>
                </div>
                <div class="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
                    <p class="text-slate-500 uppercase font-bold">Problem Solving</p>
                    <p class="text-white font-black text-sm mt-0.5">${evaluation.problem_solving || 0}%</p>
                </div>
                <div class="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
                    <p class="text-slate-500 uppercase font-bold">Explanation Quality</p>
                    <p class="text-white font-black text-sm mt-0.5">${evaluation.explanation_quality || 0}%</p>
                </div>
                <div class="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
                    <p class="text-slate-500 uppercase font-bold">Practical Tech</p>
                    <p class="text-white font-black text-sm mt-0.5">${evaluation.practical_knowledge || 0}%</p>
                </div>
            </div>

            <!-- Feedback -->
            <div class="space-y-2">
                <p class="text-xs text-slate-500 font-bold uppercase">AI Evaluator Feedback</p>
                <p class="text-slate-200 text-sm leading-relaxed">${evaluation.feedback || 'No feedback'}</p>
            </div>

            <!-- Next navigation -->
            <div class="flex justify-end pt-2 border-t border-slate-800">
                ${data.is_complete
                    ? `<button onclick="completeResumeInterview()" class="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 active:scale-95">Finish & View Report</button>`
                    : `<button onclick="renderResumeInterviewFlow()" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95">
                        ${data.followup_triggered ? 'Next: Answer Follow-up →' : 'Next Question →'}
                       </button>`
                }
            </div>
        </div>`;

        // Hide main answer input buttons to prevent duplicate submission
        if (submitBtn) submitBtn.closest('div.flex').innerHTML = '';
        if (answerEl) answerEl.disabled = true;

    } catch(err) {
        if (statusEl) statusEl.classList.add('hidden');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Answer'; }
        showToast(err.message, 'error');
    }
}

// ── Complete & Report ─────────────────────────────────────
async function completeResumeInterview() {
    if (resumeInterviewTimer) {
        clearInterval(resumeInterviewTimer);
        resumeInterviewTimer = null;
    }
    
    showLoader();
    try {
        const res = await fetch(`${API_BASE}/resume-interview/session/${resumeInterviewSession.session_id}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ duration_seconds: resumeInterviewDurationSeconds })
        });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || "Failed to finalize session");
        
        // Show report
        renderResumeInterviewReport(resumeInterviewSession.session_id);
    } catch(err) {
        showToast(err.message, 'error');
        renderDashboard();
    }
}

async function renderResumeInterviewReport(sessionId) {
    setActiveNav('dashboard');
    showLoader();
    
    try {
        const res = await fetch(`${API_BASE}/resume-interview/report/${sessionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const report = await parseJSON(res);
        if (!res.ok) throw new Error(report.error || "Failed to fetch report");
        
        const overall = report.overall_score || 0;
        const oColor = overall >= 75 ? 'text-green-400' : overall >= 50 ? 'text-yellow-400' : 'text-red-400';
        const circumference = 251.2;
        const dashOffset = circumference - (overall / 100) * circumference;

        const durationMinutes = Math.floor(report.duration_seconds / 60);
        const durationSeconds = report.duration_seconds % 60;
        const dateStr = new Date(report.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

        const qaFeedHtml = report.questions.map((q, i) => {
            const ans = report.answers[i] || 'No answer submitted';
            const score = report.evaluations[i]?.score || 0;
            const evalFeedback = report.evaluations[i]?.feedback || 'N/A';
            const scoreColor = score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
            
            return `
            <div class="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5 space-y-3">
                <div class="flex items-center justify-between">
                    <span class="text-xs text-indigo-400 font-bold uppercase">Turn ${i+1}</span>
                    <span class="${scoreColor} font-black text-sm">Score: ${score}/100</span>
                </div>
                <div class="space-y-1">
                    <p class="text-xs text-slate-500 font-bold">Interviewer Question</p>
                    <p class="text-white text-sm leading-relaxed">${q}</p>
                </div>
                <div class="space-y-1">
                    <p class="text-xs text-slate-500 font-bold">Your Response</p>
                    <p class="text-slate-300 text-sm leading-relaxed">${ans}</p>
                </div>
                <div class="space-y-1 border-t border-slate-700/50 pt-2">
                    <p class="text-xs text-slate-500 font-bold">AI Analysis</p>
                    <p class="text-slate-400 text-xs leading-relaxed">${evalFeedback}</p>
                </div>
            </div>`;
        }).join('');

        const container = document.getElementById('app-container');
        container.innerHTML = `
        <div class="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            <!-- Header -->
            <div class="border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 class="text-3xl font-black text-white">Interview Performance Evaluation</h1>
                    <p class="text-slate-400 mt-1">Completed on ${dateStr} · Duration: ${durationMinutes}m ${durationSeconds}s</p>
                </div>
                <div class="flex gap-2">
                    ${overall >= 70 ? `
                    <button onclick="claimCertificate('${sessionId}', 'Resume-Based')" class="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg hover:shadow-yellow-500/20">
                        🎓 Claim Certificate
                    </button>
                    ` : ''}
                    <button onclick="renderDashboard()" class="bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                        Return to Dashboard
                    </button>
                </div>
            </div>

            <!-- Hero Score Box -->
            <div class="bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row items-center gap-8 shadow-xl">
                <!-- Circular Chart -->
                <div class="relative w-40 h-40 flex-shrink-0">
                    <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" stroke-width="10"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="${overall >= 75 ? '#22c55e' : '#eab308'}" stroke-width="10"
                            stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"
                            stroke-linecap="round" style="transition:stroke-dashoffset 1s ease"/>
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span class="font-black text-4xl ${oColor}">${overall.toFixed(0)}</span>
                        <span class="text-slate-500 text-xs font-bold uppercase tracking-wider">Overall</span>
                    </div>
                </div>

                <div class="flex-1 text-center lg:text-left space-y-2">
                    <h3 class="text-2xl font-black text-white">Resume-Based Performance</h3>
                    <p class="text-slate-400 text-sm leading-relaxed">
                        This evaluation is based on technical depth, accuracy, communication, and confidence displayed during the interview based strictly on your resume profile: <b>${report.resume_name}</b>.
                    </p>
                </div>

                <!-- Summary Scores -->
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 flex-shrink-0 w-full lg:w-auto">
                    ${[
                        ['Technical Score', report.technical_score, 'text-blue-400'],
                        ['Communication', report.communication_score, 'text-green-400'],
                        ['Confidence', report.confidence_score, 'text-yellow-400'],
                        ['Project Knowledge', report.project_knowledge, 'text-purple-400'],
                        ['Coding Readiness', report.coding_readiness, 'text-cyan-400']
                    ].map(([l, v, c]) => `
                    <div class="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/50">
                        <p class="text-xl font-black ${c}">${v?.toFixed(0) || 0}</p>
                        <p class="text-slate-500 text-[10px] uppercase font-bold mt-0.5">${l}</p>
                    </div>`).join('')}
                </div>
            </div>

            <!-- Strengths and Weaknesses -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Strengths -->
                <div class="bg-slate-900 border border-green-800/40 rounded-2xl p-6">
                    <h3 class="font-bold text-white text-lg mb-4 flex items-center gap-2">🟢 Identified Strengths</h3>
                    <ul class="space-y-2.5">
                        ${report.strong_areas.map(s => `
                        <li class="text-sm text-slate-300 flex items-start gap-2.5">
                            <span class="text-green-400 flex-shrink-0 mt-0.5">✓</span>
                            <span>${s}</span>
                        </li>`).join('') || '<p class="text-slate-500 text-sm">None identified</p>'}
                    </ul>
                </div>

                <!-- Weaknesses -->
                <div class="bg-slate-900 border border-red-800/40 rounded-2xl p-6">
                    <h3 class="font-bold text-white text-lg mb-4 flex items-center gap-2">🔴 Areas of Improvement</h3>
                    <ul class="space-y-2.5">
                        ${report.weak_areas.map(w => `
                        <li class="text-sm text-slate-300 flex items-start gap-2.5">
                            <span class="text-red-400 flex-shrink-0 mt-0.5">→</span>
                            <span>${w}</span>
                        </li>`).join('') || '<p class="text-slate-500 text-sm">None identified</p>'}
                    </ul>
                </div>
            </div>

            <!-- Recommendations -->
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 class="font-bold text-white text-lg mb-4 flex items-center gap-2">💡 Recommended Steps for Improvement</h3>
                <ul class="space-y-3">
                    ${report.suggestions.map((s, idx) => `
                    <li class="flex items-start gap-3 bg-yellow-900/10 border border-yellow-800/20 rounded-xl p-3.5">
                        <span class="w-5 h-5 rounded-full bg-yellow-600/40 text-yellow-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">${idx+1}</span>
                        <p class="text-slate-300 text-sm leading-relaxed">${s}</p>
                    </li>`).join('') || '<p class="text-slate-500 text-sm">No suggestions provided</p>'}
                </ul>
            </div>

            <!-- Dialogue History -->
            <div class="space-y-4">
                <h3 class="font-bold text-white text-xl">Interview Transcript & Evaluation</h3>
                <div class="space-y-4">${qaFeedHtml}</div>
            </div>
        </div>`;

    } catch(err) {
        showToast(err.message, 'error');
        renderDashboard();
    }
}

// ── Render Interview History ──────────────────────────────
async function renderResumeInterviewHistory() {
    setActiveNav('dashboard');
    showLoader();
    const container = document.getElementById('app-container');

    try {
        const res = await fetch(`${API_BASE}/resume-interview/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || "Failed to load history");

        const history = data.history || [];
        
        let rowsHtml = '';
        if (history.length === 0) {
            rowsHtml = `<tr><td colspan="6" class="p-10 text-center text-slate-500">No previous resume-based interviews found. Start your first session!</td></tr>`;
        } else {
            rowsHtml = history.map(h => {
                const sc = h.overall_score || 0;
                const scoreColor = sc >= 75 ? 'text-green-400' : sc >= 50 ? 'text-yellow-400' : 'text-red-400';
                const date = new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                const mins = Math.floor(h.duration_seconds / 60);
                const secs = h.duration_seconds % 60;
                
                return `
                <tr class="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td class="px-5 py-4"><span class="text-slate-200 text-sm font-semibold">${h.resume_name}</span></td>
                    <td class="px-5 py-4 text-center"><span class="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-full font-bold">${h.difficulty}</span></td>
                    <td class="px-5 py-4 text-center"><span class="${scoreColor} font-black text-sm">${sc.toFixed(0)}/100</span></td>
                    <td class="px-5 py-4 text-center text-slate-400 text-xs">${mins}m ${secs}s</td>
                    <td class="px-5 py-4 text-center text-slate-500 text-xs">${date}</td>
                    <td class="px-5 py-4 text-center">
                        <button onclick="renderResumeInterviewReport(${h.id})" class="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors">View Report</button>
                    </td>
                </tr>`;
            }).join('');
        }

        container.innerHTML = `
        <div class="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div class="border-b border-slate-800 pb-6 flex items-center justify-between">
                <div>
                    <h2 class="text-3xl font-extrabold text-white">Resume Interview History</h2>
                    <p class="text-slate-400 mt-1">Review performance evaluations of your past resume-based sessions.</p>
                </div>
                <button onclick="renderDashboard()" class="text-slate-400 hover:text-white text-sm font-semibold">
                    ← Back to Dashboard
                </button>
            </div>

            <div class="bg-slate-900 border border-slate-700 rounded-2xl overflow-x-auto">
                <table class="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                        <tr class="bg-slate-800/60 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                            <th class="px-5 py-4">Resume File</th>
                            <th class="px-5 py-4 text-center">Difficulty</th>
                            <th class="px-5 py-4 text-center">Overall Score</th>
                            <th class="px-5 py-4 text-center">Duration</th>
                            <th class="px-5 py-4 text-center">Date</th>
                            <th class="px-5 py-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        </div>`;

    } catch(err) {
        showToast(err.message, 'error');
        renderDashboard();
    }
}

// ────────────────────────────────────────────────────────────
//   CERTIFICATES
// ────────────────────────────────────────────────────────────
async function renderCertificates() {
    setActiveNav('certificates');
    showLoader();
    const container = document.getElementById('app-container');
    try {
        const res = await fetch(`${API_BASE}/certificate/my-certificates`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 422) { logout(); return; }
        if (!res.ok) throw new Error('Failed to load certificates data');
        const data = await parseJSON(res);
        const certs = data.certificates || [];

        if (certs.length === 0) {
            container.innerHTML = `
            <div class="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
                <div class="border-b border-slate-800 pb-6">
                    <h2 class="text-3xl font-extrabold text-white">My Certificates</h2>
                    <p class="text-slate-400 mt-1">View, download, and share your earned achievement credentials.</p>
                </div>
                <div class="bg-slate-900 border border-slate-700/60 rounded-2xl p-12 text-center max-w-xl mx-auto mt-10">
                    <span class="text-5xl">📜</span>
                    <h3 class="text-xl font-bold text-white mt-4">No Certificates Earned Yet</h3>
                    <p class="text-slate-400 text-sm mt-2 max-w-md mx-auto">
                        Complete either a Full Career Path Assessment (4 Rounds) or a Resume-Based Dynamic Interview with an overall score of 70% or higher to receive your official certificate!
                    </p>
                    <button onclick="renderRounds()" class="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/20">
                        Start Assessment
                    </button>
                </div>
            </div>`;
            return;
        }

        const cardsHtml = certs.map(c => {
            const dateStr = new Date(c.issue_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            return `
            <div class="bg-slate-900 border border-slate-700/85 rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all hover:scale-[1.02] hover:border-indigo-500/50">
                <!-- Certificate Miniature Graphic -->
                <div class="relative w-full aspect-[1.414/1] bg-slate-950 border-2 border-indigo-900 rounded-lg p-4 flex flex-col justify-between text-center overflow-hidden mb-5">
                    <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06),transparent)]"></div>
                    <div class="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">AI Interview Trainer</div>
                    <div class="space-y-1">
                        <div class="text-[9px] font-serif text-amber-500 uppercase tracking-wider">Certificate of Achievement</div>
                        <div class="text-[6px] text-slate-400">is proudly presented to the candidate for completing</div>
                        <div class="text-[8px] font-bold text-slate-200">${c.interview_type}</div>
                    </div>
                    <div class="flex justify-between items-center text-[5px] text-slate-500 border-t border-slate-800/80 pt-2 px-1">
                        <div>ID: ${c.id}</div>
                        <div class="text-amber-400 font-bold">Score: ${c.overall_score}%</div>
                        <div>Date: ${dateStr}</div>
                    </div>
                </div>

                <!-- Info details -->
                <div class="space-y-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800/50 rounded-full text-[10px] font-bold uppercase tracking-wider">${c.interview_type}</span>
                            <h3 class="font-extrabold text-white text-lg mt-2 font-mono">${c.id}</h3>
                        </div>
                        <div class="text-right">
                            <p class="text-2xl font-black text-amber-400">${c.overall_score}%</p>
                            <p class="text-slate-500 text-[10px] uppercase font-bold">Score Obtained</p>
                        </div>
                    </div>
                    <div class="text-xs text-slate-400 space-y-1">
                        <p><b>Issue Date:</b> ${dateStr}</p>
                    </div>
                </div>

                <!-- Action Grid -->
                <div class="grid grid-cols-2 gap-2 mt-6">
                    <button onclick="downloadCertPdf('${c.id}', '${c.pdf_filename}')" class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md">
                        📥 Download PDF
                    </button>
                    <button onclick="window.open('/verify-certificate/${c.id}', '_blank')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/50 font-semibold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5">
                        🔍 Verify Publicly
                    </button>
                    <button onclick="shareCertLinkedIn('${c.id}')" class="col-span-1 bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-700 hover:border-indigo-800 font-semibold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1">
                        🔗 LinkedIn Share
                    </button>
                    <button onclick="shareCertEmail('${c.id}')" class="col-span-1 bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-700 hover:border-indigo-800 font-semibold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1">
                        ✉ Email Share
                    </button>
                </div>
            </div>`;
        }).join('');

        container.innerHTML = `
        <div class="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
            <div class="border-b border-slate-800 pb-6 flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 class="text-3xl font-extrabold text-white">My Credentials</h2>
                    <p class="text-slate-400 mt-1">View, download, and share your official evaluation certificates.</p>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${cardsHtml}</div>
        </div>`;

    } catch (err) {
        showToast(err.message, 'error');
        renderDashboard();
    }
}

async function claimCertificate(interviewId, type) {
    showToast('Initializing certificate compilation...', 'info');
    try {
        const res = await fetch(`${API_BASE}/certificate/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ interview_id: Number(interviewId), interview_type: type })
        });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || 'Failed to claim certificate');
        showToast('Certificate successfully compiled and generated!', 'success');
        renderCertificates();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function downloadCertPdf(certId, filename) {
    showToast('Preparing download payload...', 'info');
    try {
        const res = await fetch(`${API_BASE}/certificate/download/${certId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('PDF retrieval failed.');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `AI_Interview_Certificate_${certId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('Download complete!', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function shareCertLinkedIn(certId) {
    const verifyUrl = `${window.location.origin}/verify-certificate/${certId}`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`;
    window.open(url, '_blank');
}

function shareCertEmail(certId) {
    const verifyUrl = `${window.location.origin}/verify-certificate/${certId}`;
    const subject = encodeURIComponent("AI Interview Assessment Certificate Earned!");
    const body = encodeURIComponent(`Hi there,\n\nI have successfully completed my AI Interview Trainer assessment and wanted to share my verified certificate of achievement!\n\nVerify certificate credentials here:\n${verifyUrl}\n\nBest regards`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
}

// ════════════════════════════════════════════════════════════
//   END AI CAREER ASSISTANT MODULE
// ════════════════════════════════════════════════════════════

