
// State Management
let token = localStorage.getItem('access_token');
const API_BASE = 'http://127.0.0.1:5000/api';

// Safe JSON parser to prevent "Unexpected token <"
async function parseJSON(res) {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Server returned HTML instead of JSON:", text);
        throw new Error("Server error. Check backend logs.");
    }
}

// Render Views based on auth state
function renderApp() {
    const sidebar = document.getElementById('sidebar');
    const mobileHeader = document.querySelector('header.md\\:hidden');

    if (token) {
        if (sidebar) sidebar.classList.remove('hidden');
        if (mobileHeader) mobileHeader.classList.remove('hidden');
        renderDashboard();
    } else {
        if (sidebar) sidebar.classList.add('hidden');
        if (mobileHeader) mobileHeader.classList.add('hidden');
        renderAuth();
    }
}

function logout() {
    localStorage.removeItem('access_token');
    token = null;
    renderApp();
}

// ---------------- AUTHENTICATION VIEW ----------------
function renderAuth() {
    const container = document.getElementById('app-container');
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full">
            <div class="bg-slate-900 border border-slate-700 p-8 rounded-xl shadow-2xl max-w-md w-full">
                <h2 class="text-2xl font-bold mb-6 text-center text-white">Login / Register</h2>
                <input id="email" type="email" placeholder="Email" class="w-full bg-slate-800 border-slate-700 text-white p-3 rounded mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400">
                <input id="password" type="password" placeholder="Password" class="w-full bg-slate-800 border-slate-700 text-white p-3 rounded mb-6 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400">
                <div class="flex gap-4">
                    <button onclick="handleAuth('login')" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors">Login</button>
                    <button onclick="handleAuth('register')" class="flex-1 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold py-3 rounded transition-colors">Register</button>
                </div>
                <p id="auth-error" class="text-red-400 mt-4 text-sm text-center hidden"></p>
            </div>
        </div>
    `;
}

async function handleAuth(action) {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('auth-error');
    errorEl.classList.add('hidden');

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

// ---------------- DASHBOARD VIEW ----------------
async function renderDashboard() {
    const container = document.getElementById('app-container');
    container.innerHTML = `<div class="w-full h-full flex items-center justify-center"><div class="loader"></div></div>`;

    try {
        const res = await fetch(`${API_BASE}/user/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load dashboard data");
        const data = await parseJSON(res);

        const score = data.readiness_score ? data.readiness_score.toFixed(1) : 0;
        const currentRound = data.current_round || 1;

        // Progress percentage roughly calculated (25% per round complete)
        const progressPercentage = ((currentRound - 1) / 3) * 100;

        let nextStepInfo = "";
        if (currentRound === 1) nextStepInfo = "You need to pass Aptitude Round to unlock Technical Round.";
        else if (currentRound === 2) nextStepInfo = "You need to pass Technical Round to unlock HR Round.";
        else if (currentRound === 3) nextStepInfo = "You need to pass HR Round to complete the process.";
        else nextStepInfo = "Congratulations, you have completed all rounds!";

        const attemptsRemaining = data.attempts_remaining !== undefined ? data.attempts_remaining : 2;
        const weakTopics = data.weak_topics && data.weak_topics.length > 0 ? data.weak_topics.join(', ') : 'None identified yet';

        let dsaHtml = '';
        if (data.daily_dsa) {
            const diffColor = data.daily_dsa.difficulty === 'Hard' ? 'text-red-400' : (data.daily_dsa.difficulty === 'Medium' ? 'text-yellow-400' : 'text-green-400');
            dsaHtml = `
            <div class="bg-slate-900 border border-slate-700 p-6 rounded-xl hover:border-yellow-500 transition-colors cursor-pointer flex justify-between items-center group" onclick="alert('DSA Problem click handled later')">
                <div>
                    <div class="flex items-center gap-2 mb-2">
                        <h3 class="text-xl font-bold text-yellow-400 group-hover:text-yellow-300">Daily DSA Problem</h3>
                        <span class="text-xs px-2 py-1 rounded bg-slate-800 ${diffColor}">${data.daily_dsa.difficulty}</span>
                    </div>
                    <p class="text-slate-200 font-semibold mb-1">${data.daily_dsa.title}</p>
                    <p class="text-slate-400 text-sm">Solve this to improve your algorithmic skills.</p>
                </div>
                <svg class="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
            </div>`;
        } else {
            dsaHtml = `
            <div class="bg-slate-900 border border-slate-700 p-6 rounded-xl relative overflow-hidden group">
                <h3 class="text-xl font-bold text-slate-500 mb-2">Daily DSA Problem</h3>
                <p class="text-slate-400 text-sm">No daily problem available currently.</p>
            </div>`;
        }

        container.innerHTML = `
            <div class="w-full h-full space-y-8 animate-fade-in fade-in transition-all">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-3xl font-extrabold text-white">Your Dashboard</h2>
                        <p class="text-slate-400 mt-2">${nextStepInfo}</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Readiness Score & Progress -->
                    <div class="md:col-span-2 bg-slate-900 border border-slate-700 p-6 rounded-xl flex flex-col justify-center">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-xl font-bold text-white">Readiness Score</h3>
                            <span class="text-2xl font-black ${score >= 70 ? 'text-green-400' : 'text-blue-400'}">${score}%</span>
                        </div>
                        <div class="w-full bg-slate-800 rounded-full h-4 mb-2">
                            <div class="bg-gradient-to-r from-blue-500 to-indigo-500 h-4 rounded-full transition-all duration-1000" style="width: ${progressPercentage}%"></div>
                        </div>
                        <p class="text-xs text-slate-500 text-right">Progress: Stage ${currentRound} of 3</p>
                    </div>
                    
                    <!-- Stats Card -->
                    <div class="bg-slate-900 border border-slate-700 p-6 rounded-xl flex flex-col justify-center gap-4">
                        <div>
                            <p class="text-slate-400 text-sm mb-1 uppercase tracking-wider font-semibold">Attempts Remaining</p>
                            <p class="text-2xl font-bold ${attemptsRemaining > 0 ? 'text-white' : 'text-red-400'}">${attemptsRemaining}</p>
                        </div>
                        <div>
                            <p class="text-slate-400 text-sm mb-1 uppercase tracking-wider font-semibold">Weak Topics</p>
                            <p class="text-sm font-medium text-red-300">${weakTopics}</p>
                        </div>
                    </div>
                </div>
                
                <h3 class="text-xl font-bold text-white mt-8 mb-4">Actions & Challenges</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Action Cards -->
                    <div class="bg-slate-900 border border-slate-700 p-6 rounded-xl hover:border-blue-500 transition-colors cursor-pointer flex justify-between items-center group" onclick="startInterview()">
                        <div>
                            <h3 class="text-xl font-bold text-blue-400 mb-2 group-hover:text-blue-300">Start Next Round</h3>
                            <p class="text-slate-400 text-sm">Continue from Stage ${currentRound}</p>
                        </div>
                        <svg class="w-8 h-8 text-blue-500 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </div>
                    
                    <div class="bg-slate-900 border border-slate-700 p-6 rounded-xl relative overflow-hidden group hover:border-purple-500 transition-colors cursor-pointer">
                        <h3 class="text-xl font-bold text-purple-400 mb-2 group-hover:text-purple-300 flex items-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                            Upload Resume
                        </h3>
                        <p class="text-slate-400 text-sm mb-4">Let the AI extract your skills.</p>
                        <input type="file" id="resumeUpload" onchange="uploadResume(event)" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10">
                        <p id="resume-status" class="text-xs text-green-400 hidden mt-2">Uploading...</p>
                    </div>
                    
                    ${dsaHtml}
                </div>
                
                <div id="interview-stage" class="hidden bg-slate-900 border border-slate-700 rounded-xl p-6 mt-8">
                    <!-- Interview content injected here -->
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-10">Error loading dashboard: ${err.message}</p>`;
    }
}

// ---------------- HISTORY VIEW ----------------
async function renderHistory() {
    const container = document.getElementById('app-container');
    container.innerHTML = `<div class="w-full h-full flex items-center justify-center"><div class="loader"></div></div>`;

    try {
        const res = await fetch(`${API_BASE}/user/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load history data");
        const data = await parseJSON(res);
        const history = data.history || [];

        let rows = history.map(item => `
            <tr class="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                <td class="p-4 text-slate-300">${item.round_type}</td>
                <td class="p-4 text-slate-300 font-semibold">${item.score}</td>
                <td class="p-4 text-slate-400 text-sm whitespace-nowrap">${new Date(item.date).toLocaleDateString()}</td>
                <td class="p-4">
                    <span class="px-2 py-1 rounded text-xs font-bold ${item.status === 'Pass' ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-red-900/50 text-red-400 border border-red-800'}">
                        ${item.status}
                    </span>
                </td>
                <td class="p-4 text-slate-400 text-sm italic max-w-xs truncate" title="${item.feedback_summary}">
                    ${item.feedback_summary}
                </td>
            </tr>
        `).join('');

        if (history.length === 0) {
            rows = `<tr><td colspan="5" class="p-4 text-center text-slate-500">No interview history found. Go to Dashboard to start!</td></tr>`;
        }

        container.innerHTML = `
            <div class="w-full h-full space-y-8 animate-fade-in fade-in transition-all">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h2 class="text-3xl font-extrabold text-white">Interview History</h2>
                        <p class="text-slate-400 mt-2">Track your past performance and AI feedback.</p>
                    </div>
                </div>

                <!-- Filters Placeholder -->
                <div class="flex gap-4 mb-4">
                    <select id="filterRound" class="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2">
                        <option value="all">All Rounds</option>
                        <option value="MCQ Screening">Aptitude (MCQ)</option>
                        <option value="Technical AI">Technical</option>
                        <option value="HR">HR</option>
                    </select>
                </div>
                
                <div class="bg-slate-900 border border-slate-700 rounded-xl overflow-x-auto">
                    <table class="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr class="bg-slate-800/50 text-slate-300 border-b border-slate-700 text-sm uppercase tracking-wider">
                                <th class="p-4 font-semibold">Round Name</th>
                                <th class="p-4 font-semibold">Score</th>
                                <th class="p-4 font-semibold">Date</th>
                                <th class="p-4 font-semibold">Status</th>
                                <th class="p-4 font-semibold">Feedback Summary</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-10">Error loading history: ${err.message}</p>`;
    }
}

// ---------------- LEARNING VIEW ----------------
async function renderLearning() {
    const container = document.getElementById('app-container');
    container.innerHTML = `<div class="w-full h-full flex items-center justify-center"><div class="loader"></div></div>`;

    try {
        const res = await fetch(`${API_BASE}/user/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await parseJSON(res);
        const score = data.readiness_score || 0;

        const subjects = [
            { name: "Python Course", category: "Language" },
            { name: "Java Course", category: "Language" },
            { name: "DSA with C++", category: "Data Structures", isCore: true },
            { name: "Operating Systems", category: "Core CS", isCore: true },
            { name: "DBMS", category: "Core CS", isCore: true },
            { name: "Computer Networks", category: "Core CS", isCore: true }
        ];

        // Simplistic logic: If readiness is < 60, highlight Core CS subjects
        const needsHelp = score < 60;

        const cards = subjects.map(sub => {
            const highlight = needsHelp && sub.isCore;
            return `
                <div class="bg-slate-900 border ${highlight ? 'border-red-500/50 bg-red-950/20' : 'border-slate-700 hover:border-blue-500'} p-6 rounded-xl transition-colors flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-start mb-4">
                            <h3 class="text-xl font-bold ${highlight ? 'text-red-400' : 'text-slate-200'}">${sub.name}</h3>
                            <span class="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">${sub.category}</span>
                        </div>
                        ${highlight ? '<p class="text-xs text-red-400 mb-4 flex items-center gap-1"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg> Recommended based on recent scores</p>' : '<p class="text-xs text-slate-500 mb-4">Standard Module</p>'}
                    </div>
                    <button class="w-full py-2 rounded text-sm font-semibold transition-colors ${highlight ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}">
                        Improve Now
                    </button>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="w-full h-full space-y-8 animate-fade-in fade-in transition-all">
                <div>
                    <h2 class="text-3xl font-extrabold text-white">Learning Center</h2>
                    <p class="text-slate-400 mt-2">Personalized course recommendations to boost your readiness score.</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${cards}
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-10">Error loading learning center.</p>`;
    }
}

// ---------------- PLACEHOLDER VIEWS ----------------
function renderProfile() {
    const container = document.getElementById('app-container');
    container.innerHTML = `<div class="p-8"><h2 class="text-2xl font-bold text-white mb-4">Profile</h2><p class="text-slate-400">Profile management coming soon.</p></div>`;
}

function renderRounds() {
    // For now, redirects to interview start flow
    startInterview();
}

async function uploadResume(e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('resume-status').classList.remove('hidden');
    document.getElementById('resume-status').textContent = "Processing PDF via Gemini AI...";

    const formData = new FormData();
    formData.append('resume', file);

    try {
        const res = await fetch(`${API_BASE}/resume/upload-resume`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error);

        document.getElementById('resume-status').textContent = `Uploaded! Detected skills: ${data.extracted_skills.join(", ")}`;
    } catch (err) {
        document.getElementById('resume-status').textContent = `Upload failed: ${err.message}`;
        document.getElementById('resume-status').classList.replace('text-green-400', 'text-red-400');
    }
}

// ---------------- INTERVIEW PROCESS ----------------
let currentSessionId = null;

async function startInterview() {
    const stage = document.getElementById('interview-stage');
    stage.innerHTML = `<div class="loader mx-auto"></div>`;
    stage.classList.remove('hidden');

    try {
        const res = await fetch(`${API_BASE}/interview/start`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await parseJSON(res);

        if (!res.ok) throw new Error(data.error);
        currentSessionId = data.session_id;

        renderQuestion(data.round);
    } catch (err) {
        stage.innerHTML = `<p class="text-red-400">Error starting interview: ${err.message}</p>`;
    }
}

function renderQuestion(round) {
    let question = "Tell me about a time you faced a difficult technical challenge and how you resolved it.";
    let options = [];

    if (round === 1) {
        question = "What is the time complexity of searching in a balanced Binary Search Tree?";
        options = ["O(1)", "O(n)", "O(log n)", "O(n log n)"];
    } else if (round === 2) {
        question = "Explain the difference between a process and a thread in an Operating System.";
    } else if (round === 3) {
        question = "Please record a short video answering: How do you handle conflict in a team?";
    } else if (round === 4) {
        question = "Where do you see yourself in 5 years as an engineer?";
    }

    const stage = document.getElementById('interview-stage');

    if (round === 1) {
        // Round 1: Aptitude MCQ with Timer
        const optionsHtml = options.map((opt, i) => `
            <label class="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <input type="radio" name="mcq-answer" value="${opt}" class="w-4 h-4 text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500">
                <span class="text-slate-200">${opt}</span>
            </label>
        `).join('');

        stage.innerHTML = `
            <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                <h3 class="text-xl font-bold text-white">Round 1 Active (Aptitude)</h3>
                <span id="timer-display" class="text-sm font-mono bg-red-900/50 border border-red-700 text-red-400 px-3 py-1 rounded-full flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    02:00
                </span>
            </div>
            <div class="bg-slate-800/50 border border-slate-700 p-6 rounded-xl mb-6">
                <p class="font-semibold text-lg text-slate-100 mb-6" id="current-question">${question}</p>
                <div class="space-y-3" id="mcq-options-container">
                    ${optionsHtml}
                </div>
            </div>
            
            <div class="flex justify-end gap-3 items-center">
                <span id="eval-loading" class="text-sm text-slate-400 hidden animate-pulse">AI is evaluating...</span>
                <button id="submit-btn" onclick="submitAnswer(1)" class="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-8 rounded-lg shadow-lg transition-transform active:scale-95">Submit Answer</button>
            </div>
            <div id="eval-result" class="mt-6 hidden bg-slate-800 border border-slate-700 p-4 rounded-xl"></div>
        `;
        startTimer(120); // 2 minutes
    } else if (round === 3) {
        // Round 3: HR Video Recording UI
        stage.innerHTML = `
            <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                <h3 class="text-xl font-bold text-white">Round 3 Active (HR Video)</h3>
                <span class="text-xs bg-purple-900 border border-purple-700 text-purple-200 px-2 py-1 rounded">Camera Required</span>
            </div>
            <div class="bg-slate-800 p-4 rounded mb-4">
                <p class="font-semibold text-slate-200" id="current-question">${question}</p>
            </div>
            
            <div class="flex flex-col items-center gap-4 mb-4">
                <video id="video-preview" class="w-full max-w-lg bg-black rounded-lg border border-slate-700 aspect-video object-cover" autoplay muted></video>
                <div class="flex gap-4">
                    <button id="record-btn" onclick="startRecording()" class="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-full flex items-center gap-2 transition-colors">
                        <div class="w-3 h-3 bg-white rounded-full"></div> Start Recording
                    </button>
                    <button id="stop-btn" onclick="stopRecording()" class="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-full hidden transition-colors">
                        Stop Recording
                    </button>
                    <button id="upload-btn" onclick="uploadMediaHr()" class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-full hidden transition-colors shadow-lg">
                        Submit Video
                    </button>
                </div>
                <p id="record-status" class="text-xs text-slate-400">Ready to record.</p>
            </div>
            
            <div id="eval-loading" class="text-sm text-slate-400 hidden animate-pulse text-center w-full">AI is evaluating your video (this may take a moment)...</div>
            <div id="eval-result" class="mt-6 hidden bg-slate-800 border border-slate-700 p-4 rounded-xl"></div>
        `;
        // We will initialize the stream when the user clicks 'start', for simple permissions handling
    } else {
        // Standard Text AI UI
        stage.innerHTML = `
            <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                <h3 class="text-xl font-bold text-white">Round ${round} Active (Technical)</h3>
                <span class="text-xs bg-blue-900 border border-blue-700 text-blue-200 px-2 py-1 rounded">System Default Question</span>
            </div>
            <div class="bg-slate-800 p-4 rounded mb-4">
                <p class="font-semibold text-slate-200" id="current-question">${question}</p>
            </div>
            <textarea id="answer-box" rows="5" placeholder="Type your detailed technical explanation here..." class="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
            <div class="flex justify-end gap-3 items-center">
                <span id="eval-loading" class="text-sm text-slate-400 hidden animate-pulse">AI is evaluating...</span>
                <button onclick="submitAnswer(${round})" class="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded transition-colors shadow-lg">Submit Answer to AI</button>
            </div>
            <div id="eval-result" class="mt-6 hidden bg-slate-800 border border-slate-700 p-4 rounded-xl"></div>
        `;
    }
}

// ---------------- TIMER LOGIC ----------------
let timerInterval;
function startTimer(seconds) {
    clearInterval(timerInterval);
    let timeLeft = seconds;
    const display = document.getElementById('timer-display');

    timerInterval = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        if (display) {
            display.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${m}:${s}`;
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (document.getElementById('submit-btn')) {
                document.getElementById('submit-btn').click(); // Auto-submit
            }
        }
    }, 1000);
}

// ---------------- MEDIA RECORDING (ROUND 3 HR) ----------------
let mediaRecorder;
let audioChunks = [];
let recordedBlob = null;
let mediaStream = null;

async function startRecording() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoElement = document.getElementById('video-preview');
        videoElement.srcObject = mediaStream;

        mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            recordedBlob = new Blob(audioChunks, { type: 'video/webm' });
            videoElement.srcObject = null;
            videoElement.src = URL.createObjectURL(recordedBlob);
            videoElement.controls = true;
            document.getElementById('record-status').textContent = "Recording saved locally. Review or submit.";

            // Cleanup camera
            mediaStream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();

        document.getElementById('record-btn').classList.add('hidden');
        document.getElementById('stop-btn').classList.remove('hidden');
        document.getElementById('upload-btn').classList.add('hidden');
        document.getElementById('record-status').textContent = "Recording in progress... Speak clearly.";
        document.getElementById('record-status').classList.replace('text-slate-400', 'text-red-400');
        document.getElementById('record-status').classList.add('animate-pulse');

    } catch (err) {
        alert("Camera access denied or error: " + err.message);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        document.getElementById('stop-btn').classList.add('hidden');
        document.getElementById('upload-btn').classList.remove('hidden');
        document.getElementById('record-btn').classList.remove('hidden');
        document.getElementById('record-btn').innerHTML = `<div class="w-3 h-3 bg-white rounded-full"></div> Re-record`;

        document.getElementById('record-status').classList.replace('text-red-400', 'text-green-400');
        document.getElementById('record-status').classList.remove('animate-pulse');
    }
}

async function uploadMediaHr() {
    if (!recordedBlob) return;

    document.getElementById('eval-loading').classList.remove('hidden');
    document.getElementById('upload-btn').disabled = true;
    document.getElementById('upload-btn').classList.add('opacity-50');

    const formData = new FormData();
    // Use .webm default extension from browser
    formData.append('video', recordedBlob, 'hr_video.webm');
    formData.append('session_id', currentSessionId);

    try {
        const res = await fetch(`${API_BASE}/media/upload-hr-video`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await parseJSON(res);

        document.getElementById('eval-loading').classList.add('hidden');

        if (!res.ok) throw new Error(data.error);

        renderEvaluationResult(data);

    } catch (err) {
        document.getElementById('eval-loading').classList.add('hidden');
        document.getElementById('upload-btn').disabled = false;
        document.getElementById('upload-btn').classList.remove('opacity-50');
        alert("Upload parsing failed: " + err.message);
    }
}

// Helper to render AI feedback for multiple round types
function renderEvaluationResult(data) {
    const resultDiv = document.getElementById('eval-result');
    resultDiv.classList.remove('hidden');

    const aiEval = data.evaluation;
    const color = aiEval.score >= 70 ? 'text-green-400' : 'text-red-400';

    resultDiv.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h4 class="font-bold text-lg">AI Feedback</h4>
            <span class="${color} font-black text-2xl">${aiEval.score}/100</span>
        </div>
        <p class="text-slate-300 text-sm mb-4 leading-relaxed">${aiEval.feedback}</p>
        <div class="grid grid-cols-2 gap-4 text-xs">
            <div>
                <strong class="text-green-400 mb-1 block">Strengths</strong>
                <ul class="list-disc pl-4 text-slate-400">${aiEval.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
            </div>
            <div>
                <strong class="text-red-400 mb-1 block">Weaknesses</strong>
                <ul class="list-disc pl-4 text-slate-400">${aiEval.weaknesses.map(s => `<li>${s}</li>`).join('')}</ul>
            </div>
        </div>
        <div class="mt-4 p-3 bg-blue-900 border border-blue-700 rounded text-sm text-blue-200">
            <strong>Action needed:</strong> ${aiEval.recommendation}
        </div>
        <div class="mt-6 flex justify-end">
            ${data.status !== 'completed' && data.status !== 'failed'
            ? `<button onclick="renderQuestion(${data.next_round})" class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-6 rounded transition-colors shadow-lg">Next Round (${data.attempts}/2 Attempts)</button>`
            : `<button onclick="renderDashboard()" class="bg-slate-600 text-white font-semibold py-2 px-6 rounded">Finish Session</button>`
        }
        </div>
    `;
}

async function submitAnswer(round) {
    clearInterval(timerInterval); // Stop timer on submit

    let answer = "";
    if (round === 1) {
        const checked = document.querySelector('input[name="mcq-answer"]:checked');
        answer = checked ? checked.value : "No Answer Submitted (Timeout)";
    } else {
        const answerBox = document.getElementById('answer-box');
        if (answerBox) answer = answerBox.value;
    }

    const question = document.getElementById('current-question').innerText;
    if (!answer.trim() && round !== 1) return;

    document.getElementById('eval-loading').classList.remove('hidden');
    if (document.getElementById('submit-btn')) document.getElementById('submit-btn').disabled = true;

    try {
        const res = await fetch(`${API_BASE}/interview/evaluate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ session_id: currentSessionId, question, answer })
        });
        const data = await parseJSON(res);

        document.getElementById('eval-loading').classList.add('hidden');
        renderEvaluationResult(data);


    } catch (err) {
        document.getElementById('eval-loading').classList.add('hidden');
        alert("Evaluation failed: " + err.message);
    }
}

// Init App
renderApp();
