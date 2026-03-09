
// State Management
let token = localStorage.getItem('access_token');
const API_BASE = '/api';

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

        if (!res.ok) throw new Error(data.error || data.msg || 'Authentication failed');

        token = data.access_token;
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

        if (res.status === 401) {
            logout();
            return;
        }

        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || data.msg || "Failed to load dashboard data");

        // Fetch Analytics for the chart
        let chartData = { "Technical Round": 60, "HR Round": 80, "Aptitude Test": 70 }; // default mock fallback
        try {
            const analyticsRes = await fetch(`${API_BASE}/user/analytics/performance`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (analyticsRes.ok) {
                const aData = await parseJSON(analyticsRes);
                if (aData.success_rates) chartData = aData.success_rates;
            }
        } catch (e) { }

        const score = data.readiness_score ? data.readiness_score.toFixed(1) : 0;
        const jobReadiness = data.ml_job_prediction ? data.ml_job_prediction.readiness_prediction : score;
        const jobInsight = data.ml_job_prediction ? data.ml_job_prediction.insight : "Complete more rounds for prediction.";
        const currentRound = data.current_round || 1;
        const currentStreak = data.current_streak || 0;
        const maxStreak = data.max_streak || 0;

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
            <div class="bg-slate-900 border border-slate-700 p-6 rounded-xl hover:border-yellow-500 transition-colors cursor-pointer flex justify-between items-center group" onclick="alert('Routing to Arena...')">
                <div>
                    <div class="flex items-center gap-2 mb-2">
                        <h3 class="text-xl font-bold text-yellow-400 group-hover:text-yellow-300">Daily DSA Problem</h3>
                        <span class="text-xs px-2 py-1 rounded bg-slate-800 ${diffColor}">${data.daily_dsa.difficulty}</span>
                    </div>
                    <p class="text-slate-200 font-semibold mb-1">${data.daily_dsa.title}</p>
                    <p class="text-slate-400 text-sm">🔥 Current Streak: ${currentStreak} days</p>
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
                        <p class="text-slate-400 mt-2">${jobInsight}</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Readiness Score & ML Prediction -->
                    <div class="md:col-span-2 bg-slate-900 border border-slate-700 p-6 rounded-xl flex flex-col justify-center">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-xl font-bold text-white">ML Job Readiness Prediction</h3>
                            <span class="text-2xl font-black ${jobReadiness >= 70 ? 'text-green-400' : 'text-blue-400'}">${jobReadiness}%</span>
                        </div>
                        <div class="w-full bg-slate-800 rounded-full h-4 mb-2">
                            <div class="bg-gradient-to-r from-blue-500 to-indigo-500 h-4 rounded-full transition-all duration-1000" style="width: ${jobReadiness}%"></div>
                        </div>
                        <div class="flex justify-between items-center mt-2">
                           <p class="text-xs text-slate-500 text-left">Current Stage: ${currentRound} of 3</p>
                           <p class="text-xs text-slate-500 text-right">Raw Readiness: ${score}%</p>
                        </div>
                    </div>
                    
                    <!-- Analytics Chart Card -->
                    <div class="bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col justify-center items-center">
                        <h3 class="text-sm font-bold text-slate-300 mb-2 w-full text-center">Round Success Rates</h3>
                        <div class="relative w-full aspect-square max-h-40">
                            <canvas id="performanceChart"></canvas>
                        </div>
                    </div>
                </div>
                
                <h3 class="text-xl font-bold text-white mt-8 mb-4">Daily Targets & Tools</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${dsaHtml}
                    
                    <div class="bg-slate-900 border border-slate-700 p-6 rounded-xl hover:border-blue-500 transition-colors cursor-pointer flex justify-between items-center group" onclick="renderRounds()">
                        <div>
                            <h3 class="text-xl font-bold text-blue-400 mb-2 group-hover:text-blue-300">Continue Rounds</h3>
                            <p class="text-slate-400 text-sm">${attemptsRemaining} Attempts Remaining</p>
                        </div>
                        <svg class="w-8 h-8 text-blue-500 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </div>

                    <div class="bg-slate-900 border border-slate-700 p-6 rounded-xl hover:border-purple-500 transition-colors cursor-pointer flex justify-between items-center group" onclick="renderResumePage()">
                        <div>
                            <h3 class="text-xl font-bold text-purple-400 mb-2 group-hover:text-purple-300">Resume Hub</h3>
                            <p class="text-slate-400 text-sm max-w-[150px]">Score and Interview</p>
                        </div>
                        <svg class="w-8 h-8 text-purple-500 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                </div>
            </div>
                    <div class="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        <!-- Round Success Rate Chart -->
                        <div class="bg-slate-900 border border-slate-700 p-6 rounded-xl flex flex-col">
                            <h3 class="text-lg font-bold text-white mb-4">Round Success Rates</h3>
                            <div class="flex-grow relative min-h-[250px] w-full flex items-center justify-center">
                                <canvas id="performanceChart"></canvas>
                            </div>
                        </div>

                        <!-- Topics \u0026 Resume Analysis -->
                        <div class="bg-slate-900 border border-slate-700 p-6 rounded-xl flex flex-col">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-bold text-white">Focus Areas</h3>
                                <button onclick="renderLearning()" class="text-xs bg-indigo-600/20 text-indigo-400 px-3 py-1 rounded hover:bg-indigo-600/40 transition-colors">Study Plan</button>
                            </div>
                            
                            <div class="flex-grow flex flex-col justify-center space-y-4">
                                <div>
                                    <p class="text-sm text-slate-400 mb-2">Algorithm Proficiency</p>
                                    <div class="w-full bg-slate-800 rounded-full h-2.5">
                                        <div class="bg-blue-500 h-2.5 rounded-full" style="width: ${Math.min(100, (currentStreak * 10) + 15)}%"></div>
                                    </div>
                                </div>
                                <div>
                                    <p class="text-sm text-slate-400 mb-2">System Design (Target)</p>
                                    <div class="w-full bg-slate-800 rounded-full h-2.5">
                                        <div class="bg-purple-500 h-2.5 rounded-full" style="width: 45%"></div>
                                    </div>
                                </div>
                                <div>
                                    <p class="text-sm text-slate-400 mb-2">CS Fundamentals</p>
                                    <div class="w-full bg-slate-800 rounded-full h-2.5">
                                        <div class="bg-emerald-500 h-2.5 rounded-full" style="width: ${score}%"></div>
                                    </div>
                                </div>
                                
                                <div class="mt-4 pt-4 border-t border-slate-800">
                                    <p class="text-sm text-slate-400 mb-2 font-semibold">Priority Weak Topics:</p>
                                    <div class="flex flex-wrap gap-2">
                                        ${weakTopics.split(',').slice(0, 3).map(t => t.trim() ? `<span class="bg-orange-900/30 text-orange-400 border border-orange-800/50 text-xs px-2 py-1 rounded">${t}</span>` : '').join('') || '<span class="text-slate-500 text-sm italic">Take more interviews to generate insights</span>'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Render Chart.js
        setTimeout(() => {
            const ctx = document.getElementById('performanceChart');
            if (ctx && window.Chart) {
                // Ensure array data for fallback to prevent crash
                const dData = Object.values(chartData);
                const showChart = dData.some(v => v > 0);

                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(chartData),
                        datasets: [{
                            data: showChart ? dData : [1, 1, 1], // Fake equal data if 0
                            backgroundColor: showChart ? ['#3b82f6', '#8b5cf6', '#10b981'] : ['#1e293b', '#1e293b', '#1e293b'],
                            borderColor: '#0f172a',
                            borderWidth: 2,
                            hoverOffset: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '75%',
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    color: '#cbd5e1',
                                    font: { size: 12, family: "'Inter', sans-serif" },
                                    padding: 20,
                                    usePointStyle: true,
                                    pointStyle: 'circle'
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        if (!showChart) return " Not Enough Data";
                                        return ` ${context.label}: ${context.raw}% Success`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }, 150);

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

        if (res.status === 401) {
            logout();
            return;
        }

        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || data.msg || "Failed to load history data");
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
function renderLearning() {
    const container = document.getElementById('app-container');

    const courses = [
        { title: "Python Course", description: "Learn Python programming from beginner to advanced.", link: "https://www.w3schools.com/python/" },
        { title: "Java Course", description: "Master Java for technical interviews.", link: "https://www.w3schools.com/java/" },
        { title: "DSA with C++", description: "Practice data structures and algorithms using C++.", link: "https://www.geeksforgeeks.org/data-structures/" },
        { title: "DBMS", description: "Learn database concepts for interviews.", link: "https://www.geeksforgeeks.org/dbms/" },
        { title: "HTML", description: "Learn website structure and markup.", link: "https://www.w3schools.com/html/" },
        { title: "CSS", description: "Learn styling and layout design.", link: "https://www.w3schools.com/css/" },
        { title: "JavaScript", description: "Learn frontend programming and DOM manipulation.", link: "https://www.w3schools.com/js/" }
    ];

    let courseHtml = '';
    courses.forEach(course => {
        courseHtml += `
            <div class="bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col justify-between transition-colors hover:border-blue-500 hover:shadow-lg">
                <div>
                    <h3 class="text-xl font-bold text-white mb-2">${course.title}</h3>
                    <p class="text-sm text-slate-400 mb-6">${course.description}</p>
                </div>
                <button onclick="window.open('${course.link}', '_blank')" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded transition-colors shadow text-sm">
                    Start Learning
                </button>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="w-full h-full space-y-6 animate-fade-in fade-in transition-all pb-10">
            <div class="flex flex-col mb-6">
                <h2 class="text-3xl font-extrabold text-white">Learning Center</h2>
                <p class="text-slate-400 mt-2">Access top resources for your interview preparation topics.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${courseHtml}
            </div>
        </div>
    `;
}

async function completeRoadmapStep(stepId) {
    try {
        const res = await fetch(`${API_BASE}/roadmap/complete/${stepId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            renderLearning();
        } else {
            const data = await parseJSON(res);
            alert("Could not update step: " + (data.error || "Unknown error"));
        }
    } catch (err) {
        alert("Request failed: " + err.message);
    }
}

// ---------------- PROFILE VIEW ----------------
async function renderProfile() {
    const container = document.getElementById('app-container');
    container.innerHTML = `<div class="w-full h-full flex items-center justify-center"><div class="loader"></div></div>`;

    try {
        const res = await fetch(`${API_BASE}/user/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            logout();
            return;
        }

        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || data.msg || "Failed to load profile data");

        // Info mapping
        const email = data.email || "Unknown User";
        const emailInitial = email.charAt(0).toUpperCase();

        const totalInterviews = data.total_interviews || 0;
        const roundsCleared = data.rounds_cleared || 0;
        const failedAttempts = data.failed_attempts || 0;
        const avgScore = data.average_score || 0;
        const readinessScore = data.readiness_score || 0;

        // Attendance Stats
        const attendanceCount = totalInterviews + failedAttempts;
        const totalExpected = 10;
        const attendancePerc = totalExpected > 0 ? Math.round((attendanceCount / totalExpected) * 100) : 0;

        // Ranking Score Calculation (Basic arbitrary calc taking top factors)
        const rankingScore = Math.min(100, Math.round((readinessScore * 0.5) + (avgScore * 0.3) + ((roundsCleared * 10) * 0.2)));
        let performanceLevel = "Beginner";
        if (rankingScore > 85) performanceLevel = "Expert";
        else if (rankingScore > 70) performanceLevel = "Advanced";
        else if (rankingScore > 50) performanceLevel = "Intermediate";

        // Achievements format
        const achievementsData = data.achievements && data.achievements.length > 0 ? data.achievements : [];
        let achievementsHtml = '';
        if (achievementsData.length === 0) {
            achievementsHtml = `<p class="text-slate-500 italic text-sm mt-3">No achievements yet. Keep practicing!</p>`;
        } else {
            achievementsData.forEach(badge => {
                achievementsHtml += `
                    <div class="flex items-center gap-3 bg-slate-800 border border-slate-700 p-3 rounded-lg mb-2 shadow-sm">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center text-sm shadow">🏆</div>
                        <span class="text-slate-200 font-semibold text-sm">${badge}</span>
                    </div>
                `;
            });
        }

        // Custom fixed achievement injection based on Streak
        if (data.current_streak >= 7) {
            achievementsHtml += `
                <div class="flex items-center gap-3 bg-slate-800 border border-slate-700 p-3 rounded-lg mb-2 shadow-sm">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center text-sm shadow">🔥</div>
                    <span class="text-slate-200 font-semibold text-sm">7 Day Streak</span>
                </div>
            `;
        }
        if (data.current_streak > 0 && achievementsHtml.includes("No achievements")) {
            achievementsHtml = ""; // Clear placeholder since we are adding the streak default
        }

        const dsaSolved = data.dsa_problems_solved !== undefined ? data.dsa_problems_solved : 0;
        const currentStreak = data.current_streak || 0;
        const maxStreak = data.max_streak || 0;

        container.innerHTML = `
            <div class="w-full h-full max-w-5xl mx-auto space-y-6 animate-fade-in fade-in transition-all pb-10">
                
                <!-- Profile Header Card -->
                <div class="bg-slate-900 border border-slate-700 p-8 rounded-2xl flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    
                    <div class="w-24 h-24 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-black text-white shadow-lg border-4 border-slate-800">
                        ${emailInitial}
                    </div>
                    <div class="flex-1 text-center md:text-left z-10 w-full">
                        <h2 class="text-3xl font-extrabold text-white mb-1">My Profile</h2>
                        <p class="text-indigo-400 font-medium mb-4 flex items-center justify-center md:justify-start gap-2">
                             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                             ${email}
                        </p>
                        
                        <!-- Mini Stats Row -->
                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full lg:max-w-2xl">
                             <div class="bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-center shadow-sm">
                                 <p class="text-slate-400 text-[10px] md:text-xs uppercase tracking-wider mb-1 line-clamp-1">Total Rounds</p>
                                 <p class="text-white font-bold text-lg leading-tight transition-transform">${totalInterviews}</p>
                             </div>
                             <div class="bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-center shadow-sm">
                                 <p class="text-slate-400 text-[10px] md:text-xs uppercase tracking-wider mb-1 line-clamp-1">Cleared</p>
                                 <p class="text-green-400 font-bold text-lg leading-tight transition-transform">${roundsCleared}</p>
                             </div>
                             <div class="bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-center shadow-sm relative overflow-hidden group">
                                 <div class="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                 <p class="text-orange-400/80 font-bold text-[10px] md:text-xs uppercase tracking-wider mb-1 line-clamp-1 relative z-10">Daily Streak</p>
                                 <p class="text-orange-400 font-black text-lg leading-tight transition-transform relative z-10">${currentStreak} <span class="text-sm font-normal">🔥</span></p>
                             </div>
                             <div class="bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-center shadow-sm relative overflow-hidden group">
                                 <div class="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                 <p class="text-blue-400/80 font-bold text-[10px] md:text-xs uppercase tracking-wider mb-1 line-clamp-1 relative z-10">DSA Solved</p>
                                 <p class="text-blue-400 font-black text-lg leading-tight transition-transform relative z-10">${dsaSolved}</p>
                             </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    <!-- Performance Ranking Panel -->
                    <div class="lg:col-span-2 space-y-6">
                         <div class="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-lg">
                             <h3 class="text-lg font-bold text-white mb-5 flex items-center gap-2">
                                 <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                 Performance Ranking
                             </h3>
                             
                             <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                 <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex flex-col justify-center">
                                      <p class="text-slate-400 text-sm mb-1">Ranking Score</p>
                                      <div class="flex items-end gap-2">
                                          <span class="text-4xl font-black text-white">${rankingScore}%</span>
                                      </div>
                                      <div class="w-full bg-slate-950 rounded-full h-2 mt-3 overflow-hidden">
                                          <div class="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out" style="width: ${rankingScore}%"></div>
                                      </div>
                                 </div>
                                 <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex flex-col justify-center">
                                      <p class="text-slate-400 text-sm mb-1">Performance Level</p>
                                      <span class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">${performanceLevel}</span>
                                      <p class="text-xs text-slate-500 mt-2">Based on aggregate interview metrics.</p>
                                 </div>
                             </div>

                             <div class="grid grid-cols-2 gap-4">
                                  <div class="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                                      <p class="text-slate-500 text-xs mb-1">Raw Readiness Score</p>
                                      <p class="text-white font-semibold">${readinessScore.toFixed(1)}%</p>
                                  </div>
                                  <div class="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                                      <p class="text-slate-500 text-xs mb-1">Average Subtest Score</p>
                                      <p class="text-white font-semibold">${avgScore.toFixed(1)}%</p>
                                  </div>
                             </div>
                         </div>

                         <!-- Attendance Stats -->
                         <div class="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-lg">
                              <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                 <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                 Attendance Tracking
                              </h3>
                              
                              <div class="flex justify-between items-center mb-2">
                                   <span class="text-slate-300 font-medium">${attendanceCount} <span class="text-slate-500 text-sm">/ ${totalExpected} Sessions</span></span>
                                   <span class="text-emerald-400 font-bold">${attendancePerc}%</span>
                              </div>
                              <div class="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                                  <div class="bg-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out" style="width: ${Math.min(100, attendancePerc)}%"></div>
                              </div>
                              <p class="text-xs text-slate-500 mt-3 text-right">Target attendance to maximize readiness predictability.</p>
                         </div>
                    </div>

                    <!-- Achievements Sidebar -->
                    <div class="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-lg h-fit">
                         <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                             <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                             Achievements & Badges
                         </h3>
                         <div class="flex flex-col">
                             ${achievementsHtml}
                         </div>
                    </div>

                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-10">Error loading profile: ${err.message}</p>`;
    }
}

async function renderRounds() {
    const container = document.getElementById('app-container');
    container.innerHTML = `<div class="w-full h-full flex items-center justify-center"><div class="loader"></div></div>`;

    try {
        // Fetch current round data to determine locked/unlocked status
        const res = await fetch(`${API_BASE}/user/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            logout();
            return;
        }

        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || data.msg || "Failed to load rounds data");

        const currentRound = data.current_round || 1;

        const rounds = [
            { id: 1, title: "Round 1 – Aptitude Test", desc: "Logical reasoning and quantitative aptitude questions" },
            { id: 2, title: "Round 2 – Technical Interview", desc: "Coding and CS fundamentals" },
            { id: 3, title: "Round 3 – HR Interview", desc: "Communication and behavioral questions" }
        ];

        let roundsHtml = '';

        rounds.forEach(round => {
            let statusBadge = '';
            let actionHtml = '';
            let borderClass = 'border-slate-700';

            if (round.id < currentRound) {
                statusBadge = '<span class="px-2 py-1 rounded text-xs font-bold bg-green-900/50 text-green-400 border border-green-800">Completed</span>';
                actionHtml = '<p class="text-sm text-slate-500">Already passed.</p>';
            } else if (round.id === currentRound) {
                statusBadge = '<span class="px-2 py-1 rounded text-xs font-bold bg-blue-900/50 text-blue-400 border border-blue-800">Unlocked</span>';
                actionHtml = `<button onclick="${round.id === 1 ? 'startAptitudeRound()' : 'startInterview()'}" class="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded transition-colors shadow-lg">Start Round</button>`;
                borderClass = 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]';
            } else {
                statusBadge = '<span class="px-2 py-1 rounded text-xs font-bold bg-slate-800 text-slate-500 border border-slate-700">Locked</span>';
                actionHtml = '<button disabled class="bg-slate-800 text-slate-500 font-semibold py-2 px-6 rounded cursor-not-allowed">Locked</button>';
            }

            roundsHtml += `
                <div class="bg-slate-900 border ${borderClass} p-6 rounded-xl transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <h3 class="text-xl font-bold text-white">${round.title}</h3>
                            ${statusBadge}
                        </div>
                        <p class="text-slate-400 text-sm whitespace-pre-line">${round.desc}</p>
                    </div>
                    <div>
                        ${actionHtml}
                    </div>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="w-full h-full space-y-8 animate-fade-in fade-in transition-all">
                <div>
                    <h2 class="text-3xl font-extrabold text-white">Interview Rounds</h2>
                    <p class="text-slate-400 mt-2">Progress through the sequential interview process.</p>
                </div>
                
                <div class="flex flex-col gap-6 mb-12">
                    ${roundsHtml}
                </div>
                
                <div class="mt-8 pt-8 border-t border-slate-800">
                    <h2 class="text-2xl font-extrabold text-white mb-2">Company Specific Interviews</h2>
                    <p class="text-slate-400 mb-6">Practice with real interview patterns from top tech companies.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <!-- Company Cards -->
                        <div class="bg-slate-900 border border-slate-700 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] p-6 rounded-xl transition-all cursor-pointer group flex flex-col items-center text-center" onclick="alert('Google Interview track starting soon!')">
                            <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center p-3 mb-4 group-hover:scale-110 transition-transform shadow-md">
                                <svg viewBox="0 0 24 24" class="w-10 h-10"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                            </div>
                            <h3 class="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">Google</h3>
                            <p class="text-slate-400 text-xs mt-1">Focus: DSA, System Design</p>
                        </div>
                        
                        <div class="bg-slate-900 border border-slate-700 hover:border-orange-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] p-6 rounded-xl transition-all cursor-pointer group flex flex-col items-center text-center" onclick="alert('Amazon Interview track starting soon!')">
                            <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center p-3 mb-4 group-hover:scale-110 transition-transform shadow-md">
                                <svg viewBox="0 0 24 24" class="w-10 h-10"><path d="M13.78 18.29c-1.87.69-4.22.95-6.57.95-3.16 0-6.27-.6-7.21-1.04v-2.3c3.48 1.48 6.61 1.3 9.49.52.41-.11.83-.24 1.25-.4l.26 1.42c1.07-.63 1.83-1.67 2.22-3.1h-7.61v-2.31h10.43c-.88 1.76-1.52 3.3-1.52 3.3-.23.63-.52 1.93-.74 2.96zm8.13-3.61c.45-.63.95-1.53 1.31-2.42l-.24-.1c-.44.82-.94 1.62-1.48 2.37l.41.15zM2.87 2.08H5.6s3.15 6.78 3.52 7.71h.12c.29-.8 .81-2.19 1.48-4.08h2.09c.67 1.89 1.18 3.28 1.48 4.08h.12c.36-.92 3.52-7.71 3.52-7.71h2.7v10.4h-2.28V4.86h-.06l-4.11 7.62h-1.6l-4.14-7.62h-.06v7.62H2.87v-10.4z" fill="#FF9900"/></svg>
                            </div>
                            <h3 class="text-white font-bold text-lg group-hover:text-orange-400 transition-colors">Amazon</h3>
                            <p class="text-slate-400 text-xs mt-1">Focus: Leadership Principles</p>
                        </div>
                        
                        <div class="bg-slate-900 border border-slate-700 hover:border-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] p-6 rounded-xl transition-all cursor-pointer group flex flex-col items-center text-center" onclick="alert('Microsoft Interview track starting soon!')">
                            <div class="w-16 h-16 bg-[#00A4EF] rounded-full flex items-center justify-center p-4 mb-4 group-hover:scale-110 transition-transform shadow-md">
                                <svg viewBox="0 0 24 24" class="w-8 h-8"><path fill="#FFF" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/></svg>
                            </div>
                            <h3 class="text-white font-bold text-lg group-hover:text-indigo-400 transition-colors">Microsoft</h3>
                            <p class="text-slate-400 text-xs mt-1">Focus: OOP, Core CS</p>
                        </div>
                        
                        <div class="bg-slate-900 border border-slate-700 hover:border-rose-500 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] p-6 rounded-xl transition-all cursor-pointer group flex flex-col items-center text-center opacity-50 relative overflow-hidden">
                            <div class="absolute inset-0 bg-slate-950/40 z-10 flex items-center justify-center backdrop-blur-[1px]">
                                <span class="bg-slate-900 text-slate-300 font-bold px-3 py-1 rounded text-xs border border-slate-700">Coming Soon</span>
                            </div>
                            <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center p-3 mb-4 shadow-md">
                                <svg viewBox="0 0 24 24" class="w-10 h-10"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.09.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.254-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.376.202 2.394.1 2.646.64.699 1.026 1.591 1.026 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" fill="#181717"/></svg>
                            </div>
                            <h3 class="text-white font-bold text-lg">More Targets</h3>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-10">Error loading rounds: ${err.message}</p>`;
    }
}

function renderArena() {
    const container = document.getElementById('app-container');
    container.innerHTML = `
        <div class="h-full flex flex-col space-y-4 animate-fade-in fade-in transition-all">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h2 class="text-3xl font-extrabold text-white">Coding Arena</h2>
                    <p class="text-slate-400 mt-2">Practice data structures with live code execution.</p>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full pb-8">
                <!-- Problem Description Panel -->
                <div class="bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col max-h-[70vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-white">Two Sum</h3>
                        <span class="px-2 py-1 rounded text-xs font-bold bg-green-900/50 text-green-400 border border-green-800">Easy</span>
                    </div>
                    <p class="text-slate-300 text-sm mb-4 leading-relaxed">
                        Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.
                        <br><br>
                        You may assume that each input would have exactly one solution, and you may not use the same element twice.
                    </p>
                    
                    <div class="mt-4 bg-slate-800 rounded-md p-4">
                        <p class="text-slate-400 text-xs font-semibold mb-2">Example 1:</p>
                        <code class="text-slate-300 text-sm bg-slate-950 p-2 rounded block">
                        Input: nums = [2,7,11,15], target = 9<br>
                        Output: [0,1]<br>
                        Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
                        </code>
                    </div>
                </div>

                <!-- Code Editor Panel (Mocked for now) -->
                <div class="bg-slate-900 border border-slate-700 rounded-xl flex flex-col h-full overflow-hidden">
                    <div class="flex justify-between items-center bg-slate-800 p-3 border-b border-slate-700">
                        <select id="arena-lang" class="bg-slate-900 text-white text-sm rounded border border-slate-700 px-3 py-1">
                            <option value="python">Python 3</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                        </select>
                        <button type="button" onclick="submitArenaCode()" class="bg-green-600 hover:bg-green-500 text-white font-semibold py-1 px-4 rounded text-sm transition-colors shadow">
                            Run Code
                        </button>
                    </div>
                    
                    <div class="flex-grow p-0 w-full h-[400px] lg:h-full relative" id="editor-container">
                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 z-10" id="editor-loading">Loading Editor Engine...</div>
                        <!-- Monaco mounts here -->
                    </div>
                    
                    <div id="arena-output" class="h-40 bg-slate-950 border-t border-slate-700 p-4 text-sm font-mono text-slate-400 overflow-y-auto hidden selection:bg-indigo-500/30">
                        <!-- Output will appear here -->
                    </div>
                </div>
            </div>
        </div>
    `;

    initMonaco();
}

let monacoEditor = null;
const langTemplates = {
    python: `def twoSum(nums, target):
    # Write your Python solution here
    pass

# Test your code
print(twoSum([2, 7, 11, 15], 9))`,
    java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your Java solution here
        return new int[]{};
    }
    
    public static void main(String[] args) {
        Solution sol = new Solution();
        int[] result = sol.twoSum(new int[]{2, 7, 11, 15}, 9);
        System.out.println("[" + result[0] + ", " + result[1] + "]");
    }
}`,
    cpp: `#include <iostream>
#include <vector>

using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your C++ solution here
        return {};
    }
};

int main() {
    Solution sol;
    vector<int> nums = {2, 7, 11, 15};
    vector<int> result = sol.twoSum(nums, 9);
    if(result.size() >= 2) cout << "[" << result[0] << ", " << result[1] << "]" << endl;
    return 0;
}`,
    javascript: `function twoSum(nums, target) {
    // Write your JavaScript solution here
    return [];
}

// Test your code
console.log(twoSum([2, 7, 11, 15], 9));`
};

function initMonaco() {
    if (window.require) {
        require(['vs/editor/editor.main'], function () {
            document.getElementById('editor-loading').classList.add('hidden');

            const initialLang = document.getElementById('arena-lang').value;

            monacoEditor = monaco.editor.create(document.getElementById('editor-container'), {
                value: langTemplates[initialLang],
                language: initialLang,
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                scrollBeyondLastLine: false,
                padding: { top: 16 }
            });

            // Handle Language Change
            document.getElementById('arena-lang').addEventListener('change', (e) => {
                const newLang = e.target.value;
                monaco.editor.setModelLanguage(monacoEditor.getModel(), newLang);
                if (monacoEditor.getValue().trim().length < 5 || Object.values(langTemplates).includes(monacoEditor.getValue())) {
                    monacoEditor.setValue(langTemplates[newLang]);
                }
            });
        });
    } else {
        setTimeout(initMonaco, 200); // Check again if CDN hasn't loaded yet
    }
}

async function submitArenaCode() {
    const outPanel = document.getElementById('arena-output');
    outPanel.classList.remove('hidden');
    outPanel.innerHTML = `<div class="flex items-center gap-3 text-indigo-400 font-semibold mb-2"><div class="w-4 h-4 border-2 border-indigo-500 border-t-transparent flex items-center justify-center animate-spin rounded-full"></div> Compiling & Executing...</div>`;

    let code = "";
    if (monacoEditor) {
        code = monacoEditor.getValue();
    } else {
        // Fallback
        const textArea = document.getElementById('arena-code');
        code = textArea ? textArea.value : "";
    }

    const language = document.getElementById('arena-lang').value;

    try {
        const res = await fetch(`${API_BASE}/code/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ code: code, language: language })
        });
        const data = await parseJSON(res);

        if (!res.ok) throw new Error(data.error || "Execution Request Failed");

        outPanel.innerHTML = `
            <div class="px-4 py-3 rounded border bg-slate-900 border-slate-700 text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">${(data.output || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
        `;
    } catch (err) {
        outPanel.innerHTML = `<span class="text-red-500 font-bold border-l-4 border-red-500 pl-3">Connection Error:</span> ${err.message}`;
    }
}

async function renderLeaderboard() {
    const container = document.getElementById('app-container');
    container.innerHTML = `<div class="w-full h-full flex items-center justify-center"><div class="loader"></div></div>`;

    try {
        const res = await fetch(`${API_BASE}/user/analytics/leaderboard`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.status === 401) { logout(); return; }
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || "Failed to load leaderboard");

        let rows = '';
        if (data.leaderboard && data.leaderboard.length > 0) {
            data.leaderboard.forEach(u => {
                rows += `
                    <tr class="border-b border-slate-700 hover:bg-slate-800 transition-colors">
                        <td class="p-4 font-bold text-slate-300">#${u.rank}</td>
                        <td class="p-4 flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm">
                                ${u.username.substring(0, 2).toUpperCase()}
                            </div>
                            ${u.username}
                        </td>
                        <td class="p-4 text-green-400 font-mono font-bold">${u.readiness_score}%</td>
                        <td class="p-4 text-slate-400">${u.rounds_cleared} Rounds</td>
                    </tr>
                 `;
            });
        } else {
            rows = `<tr><td colspan="4" class="p-8 text-center text-slate-500">No data available yet. Be the first to start practicing!</td></tr>`;
        }

        container.innerHTML = `
            <div class="h-full flex flex-col space-y-4 animate-fade-in fade-in transition-all">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-3xl font-extrabold text-white">Global Leaderboard</h2>
                        <p class="text-slate-400 mt-2">See how you stack up against top candidates.</p>
                    </div>
                </div>
                
                <div class="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-800 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-700">
                                <th class="p-4 font-semibold w-24">Rank</th>
                                <th class="p-4 font-semibold">Candidate</th>
                                <th class="p-4 font-semibold">Job Readiness</th>
                                <th class="p-4 font-semibold">Experience Level</th>
                            </tr>
                        </thead>
                        <tbody id="leaderboard-body">
                            ${rows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-10">Error loading leaderboard: ${err.message}</p>`;
    }
}

async function renderCommunity() {
    const container = document.getElementById('app-container');
    container.innerHTML = `<div class="w-full h-full flex items-center justify-center"><div class="loader"></div></div>`;

    try {
        const res = await fetch(`${API_BASE}/community/posts`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.status === 401) { logout(); return; }

        // Setup initial UI regardless of fetch success to allow posting
        let postsHtml = '';
        if (res.ok) {
            const data = await parseJSON(res);
            if (data.posts && data.posts.length > 0) {
                data.posts.forEach(p => {
                    const d = new Date(p.created_at).toLocaleDateString();
                    postsHtml += `
                        <div class="bg-slate-900 border border-slate-700 rounded-xl p-5 hover:border-indigo-500 transition-colors">
                            <h3 class="text-lg font-bold text-white mb-2">${p.title}</h3>
                            <p class="text-slate-400 text-sm mb-4 line-clamp-3">${p.content}</p>
                            <div class="flex justify-between items-center text-xs text-slate-500">
                                <span class="font-medium text-indigo-400">@${p.author}</span>
                                <div class="flex items-center gap-4">
                                    <span class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg> ${p.replies_count}</span>
                                    <span>${d}</span>
                                </div>
                            </div>
                        </div>
                    `;
                });
            } else {
                postsHtml = `<div class="p-8 text-center text-slate-500 col-span-full bg-slate-900 rounded-xl border border-slate-700 border-dashed">No discussions yet. Start one!</div>`;
            }
        }

        container.innerHTML = `
            <div class="h-full flex flex-col space-y-6 animate-fade-in fade-in transition-all">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-3xl font-extrabold text-white">Community Forum</h2>
                        <p class="text-slate-400 mt-2">Discuss interview strategies and ask for help.</p>
                    </div>
                    <button onclick="alert('Post creation modal coming soon!')" class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow">
                        + New Post
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                    ${postsHtml}
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-10">Error loading community: ${err.message}</p>`;
    }
}
// ---------------- RESUME PAGE ----------------
let currentResumeSkills = [];

function renderResumePage() {
    const container = document.getElementById('app-container');
    container.innerHTML = `
        <div class="w-full h-full space-y-8 animate-fade-in fade-in transition-all pb-12">
            <div>
                <h2 class="text-3xl font-extrabold text-white">Resume Hub</h2>
                <p class="text-slate-400 mt-2">Upload your resume to receive AI feedback and unlock specialized mock interviews.</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Upload Box -->
                <div class="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-lg relative items-center justify-center flex flex-col text-center group cursor-pointer hover:border-indigo-500 transition-colors">
                    <input type="file" id="resumeUpload" onchange="uploadResume(event)" accept=".pdf" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10">
                    <div class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-900/40 transition-colors">
                        <svg class="w-8 h-8 text-indigo-400 group-hover:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    </div>
                    <h3 class="text-xl font-bold text-slate-200 group-hover:text-white transition-colors">Upload New Resume</h3>
                    <p class="text-slate-400 text-sm mt-2">PDF files only. Max size 5MB.</p>
                    <div id="resume-status" class="mt-6 w-full hidden text-left text-sm text-slate-300"></div>
                </div>
                
                <!-- Info / Results Panel -->
                <div class="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-lg" id="resume-details-panel">
                    <div class="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
                        <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        <p>Upload a resume to see your score, skills, and AI feedback here.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function uploadResume(e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('resume-status').classList.remove('hidden');
    document.getElementById('resume-status').innerHTML = `<div class="loader inline-block"></div> <span class="ml-2">Processing PDF via Gemini AI...</span>`;

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

        currentResumeSkills = data.extracted_skills || [];

        const suggestionsList = (data.suggestions && data.suggestions.length > 0)
            ? data.suggestions.map(s => `<li>• ${s}</li>`).join('')
            : '<li>• None at this time.</li>';

        const strengthsList = (data.strengths && data.strengths.length > 0)
            ? data.strengths.map(s => `<li>• ${s}</li>`).join('')
            : '<li>• No distinct strengths highlighted.</li>';

        const weaknessesList = (data.weaknesses && data.weaknesses.length > 0)
            ? data.weaknesses.map(s => `<li>• ${s}</li>`).join('')
            : '<li>• No critical weaknesses found.</li>';

        document.getElementById('resume-status').innerHTML = `<span class="text-green-400">✅ Resume Parsed Successfully!</span>`;

        const scoreColor = data.resume_score >= 80 ? 'text-green-500' : (data.resume_score >= 50 ? 'text-yellow-500' : 'text-red-500');
        const strokeColor = data.resume_score >= 80 ? '#10b981' : (data.resume_score >= 50 ? '#f59e0b' : '#ef4444');
        const dashArray = 251.2; // 2 * PI * 40
        const dashOffset = dashArray - ((data.resume_score / 100) * dashArray);

        document.getElementById('resume-details-panel').innerHTML = `
            <div class="flex flex-col md:flex-row items-center gap-6 border-b border-indigo-500/30 pb-6 mb-6">
                
                <!-- Circular Score Ring -->
                <div class="relative w-32 h-32 flex-shrink-0">
                    <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="#1e293b" stroke-width="8" fill="transparent"></circle>
                        <circle cx="50" cy="50" r="40" stroke="${strokeColor}" stroke-width="8" fill="transparent" stroke-dasharray="${dashArray}" stroke-dashoffset="${dashOffset}" class="transition-all duration-1000 ease-out"></circle>
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span class="text-3xl font-black ${scoreColor}">${data.resume_score}</span>
                        <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ATS Score</span>
                    </div>
                </div>
                
                <div class="flex-1 text-center md:text-left">
                    <h3 class="text-2xl font-bold text-white mb-2">Resume Intelligence</h3>
                    <p class="text-slate-400 text-sm leading-relaxed">Your resume has been analyzed. A score above 80 indicates high ATS compatibility. Review the AI suggestions below before proceeding to your tailored mock interview.</p>
                </div>
            </div>
            
            <div class="mb-4">
                <span class="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2 block">Detected Skills & Technologies</span>
                <div class="flex flex-wrap gap-2">
                    ${currentResumeSkills.map(s => `<span class="bg-slate-800 text-slate-200 px-3 py-1 rounded-full text-xs border border-slate-700">${s}</span>`).join('') || '<span class="text-slate-500 text-sm">No skills automatically detected.</span>'}
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <span class="text-green-400 text-xs uppercase tracking-wider font-bold mb-2 block border-b border-green-900/50 pb-1">Strengths</span>
                    <ul class="text-slate-300 text-sm space-y-1">${strengthsList}</ul>
                </div>
                <div>
                    <span class="text-orange-400 text-xs uppercase tracking-wider font-bold mb-2 block border-b border-orange-900/50 pb-1">Weaknesses</span>
                    <ul class="text-slate-300 text-sm space-y-1">${weaknessesList}</ul>
                </div>
            </div>
            
            <div class="mb-8">
                <span class="text-indigo-400 text-xs uppercase tracking-wider font-bold mb-2 block">AI Suggestions for Improvement</span>
                <ul class="text-slate-300 text-sm space-y-2 bg-slate-950 p-4 rounded-lg border border-slate-800">${suggestionsList}</ul>
            </div>
            
            <button onclick="startResumeInterview()" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-transform active:scale-95 text-lg flex items-center justify-center gap-3">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Launch Custom Mock Interview
            </button>
        `;
    } catch (err) {
        document.getElementById('resume-status').innerHTML = `<span class="text-red-400">Upload failed: ${err.message}</span>`;
    }
}

// ---------------- INTERVIEW PROCESS ----------------
let currentSessionId = null;
let resumeQuestionsList = [];

async function startInterview() {
    const container = document.getElementById('app-container');
    container.innerHTML = `<div id="interview-stage" class="w-full h-full max-w-4xl mx-auto py-8"><div class="loader mx-auto"></div></div>`;
    const stage = document.getElementById('interview-stage');

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

async function startResumeInterview() {
    if (!currentResumeSkills || currentResumeSkills.length === 0) {
        alert("Please upload a resume first to extract skills for the interview.");
        return;
    }

    const container = document.getElementById('app-container');
    container.innerHTML = `<div id="interview-stage" class="w-full h-full max-w-4xl mx-auto py-8"><div class="text-center text-indigo-400 mb-4 animate-pulse">Generating your custom mock interview based on your resume...</div><div class="loader mx-auto"></div></div>`;
    const stage = document.getElementById('interview-stage');

    try {
        // 1. Start a real backend session so /evaluate works
        const resStart = await fetch(`${API_BASE}/interview/start`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataStart = await parseJSON(resStart);
        if (!resStart.ok) throw new Error(dataStart.error);
        currentSessionId = dataStart.session_id;

        // 2. Fetch custom resume questions
        const res = await fetch(`${API_BASE}/interview/resume-interview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ skills: currentResumeSkills })
        });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error);

        resumeQuestionsList = data.questions || [];
        if (resumeQuestionsList.length === 0) throw new Error("No questions generated.");

        renderResumeQuestion(0);
    } catch (err) {
        stage.innerHTML = `<p class="text-red-400">Error generating resume interview: ${err.message}</p>`;
    }
}

function renderResumeQuestion(index) {
    if (index >= resumeQuestionsList.length) {
        // Complete the mock interview early if finished
        document.getElementById('interview-stage').innerHTML = `
            <div class="bg-indigo-900/40 border border-indigo-500/50 p-10 rounded-2xl text-center shadow-2xl">
                <h3 class="text-3xl font-black text-white mb-4">Interview Complete!</h3>
                <p class="text-indigo-200 mb-6 font-medium">You completed all customized questions based on your resume.</p>
                <button onclick="renderDashboard()" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg">Return to Dashboard</button>
            </div>
        `;
        return;
    }

    const stage = document.getElementById('interview-stage');
    const question = resumeQuestionsList[index];

    stage.innerHTML = `
        <div class="flex justify-between items-center mb-6 border-b border-indigo-500/30 pb-3">
            <div>
                <h3 class="text-2xl font-bold text-white">Custom Resume Interview Active</h3>
                <span class="text-sm text-indigo-400 font-medium">Question ${index + 1} of ${resumeQuestionsList.length}</span>
            </div>
            <span id="timer-display" class="text-lg font-mono bg-red-900/50 border border-red-700 text-red-400 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                <svg class="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                --:--
            </span>
        </div>
        
        <div class="bg-slate-800/80 border border-slate-700 p-8 rounded-xl mb-6 shadow-xl relative overflow-hidden">
            <div class="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <p class="font-semibold text-xl text-slate-100 mb-2 leading-relaxed" id="current-question-text">${question}</p>
        </div>
        
        <textarea id="answer-box" rows="7" placeholder="Draft your response here..." class="w-full bg-slate-800/80 border border-slate-700 text-slate-200 p-5 rounded-xl mb-6 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none placeholder-slate-500 transition-all text-sm leading-relaxed shadow-inner"></textarea>
        
        <div class="flex justify-between items-center">
            <span id="eval-loading" class="text-sm text-indigo-400 hidden flex items-center gap-2 font-medium">
                <div class="loader inline-block"></div> AI is reviewing your answer...
            </span>
            <button id="submit-btn" onclick="submitResumeAnswer(${index})" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-10 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-transform active:scale-95 ml-auto">Submit Custom Answer</button>
        </div>
        <div id="eval-result" class="mt-8 hidden bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl"></div>
    `;

    // Resume Specific Timeline / 15 Minute per question timer
    startTimer(15 * 60, () => submitResumeAnswer(index));
}

async function submitResumeAnswer(index) {
    clearInterval(timerInterval); // Stop timer

    const answerBox = document.getElementById('answer-box');
    const answer = answerBox ? answerBox.value : "No Answer Submitted (Timeout)";
    const question = document.getElementById('current-question-text').innerText;

    if (!answer.trim()) return;

    document.getElementById('eval-loading').classList.remove('hidden');
    if (document.getElementById('submit-btn')) document.getElementById('submit-btn').disabled = true;

    try {
        const res = await fetch(`${API_BASE}/interview/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ session_id: currentSessionId, question, answer })
        });
        const data = await parseJSON(res);

        document.getElementById('eval-loading').classList.add('hidden');

        const resultDiv = document.getElementById('eval-result');
        resultDiv.classList.remove('hidden');

        const aiEval = data.evaluation;
        const color = aiEval.score >= 70 ? 'text-green-400' : 'text-orange-400';

        resultDiv.innerHTML = `
            <div class="flex justify-between items-center border-b border-slate-700 pb-4 mb-5">
                <h4 class="font-bold text-xl text-white">AI Real-time Feedback</h4>
                <span class="${color} font-black text-4xl">${aiEval.score}<span class="text-lg text-slate-500">/100</span></span>
            </div>
            <div class="p-4 bg-slate-800 rounded-lg text-slate-300 text-sm mb-6 leading-relaxed border-l-4 border-indigo-500">${aiEval.feedback}</div>
            
            <div class="grid grid-cols-2 gap-6 text-sm mb-6">
                <div>
                    <strong class="text-green-400 mb-3 block flex items-center gap-2 border-b border-green-900/50 pb-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Key Strengths</strong>
                    <ul class="text-slate-400 space-y-2 list-inside list-disc">${aiEval.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
                </div>
                <div>
                    <strong class="text-orange-400 mb-3 block flex items-center gap-2 border-b border-orange-900/50 pb-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Improvement Areas</strong>
                    <ul class="text-slate-400 space-y-2 list-inside list-disc">${aiEval.weaknesses.map(s => `<li>${s}</li>`).join('')}</ul>
                </div>
            </div>
            
            <div class="flex justify-end pt-6 border-t border-slate-700">
                <button onclick="renderResumeQuestion(${index + 1})" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-10 rounded-lg shadow-lg transition-transform active:scale-95">${index >= resumeQuestionsList.length - 1 ? 'Finish Interview' : 'Next Question'}</button>
            </div>
        `;
    } catch (err) {
        document.getElementById('eval-loading').classList.add('hidden');
        alert("Evaluation failed: " + err.message);
    }
}

// ---------------- ROUNDS STATE ----------------
// variables currentSessionId, currentAptitudeIndex, userAptitudeAnswers, aptitudeQuestions, resumeQuestionsList already present above.

// Conversational State
let chatContext = [];
let questionCount = 1;

async function startInterview() {
    const stage = document.getElementById('interview-stage');
    if (!stage) {
        // Fallback or navigate if called outside rounds view
        renderRounds();
        return;
    }

    stage.innerHTML = `<div class="w-full text-center py-10"><div class="loader mx-auto mb-4"></div><p class="text-indigo-400 font-semibold animate-pulse">Initializing AI Interview Protocol...</p></div>`;

    try {
        const res = await fetch(`${API_BASE}/interview/start`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error);

        currentSessionId = data.session_id;

        // Reset interview tracking vars 
        currentAptitudeIndex = 0;
        userAptitudeAnswers = {};
        chatContext = [];
        questionCount = 1;

        if (data.round === 1) {
            startAptitudeRound();
        } else {
            renderQuestion(data.round);
        }
    } catch (err) {
        stage.innerHTML = `<p class="text-red-400 text-center font-bold">Error starting interview: ${err.message}</p>`;
    }
}

// ---- APTITUDE ROUND SPECIFIC LOGIC ----

function renderAptitudeQuestion() {
    const stage = document.getElementById('interview-stage');
    if (!aptitudeQuestions || aptitudeQuestions.length === 0) {
        stage.innerHTML = `<p class="text-red-400">No questions available. Please seed the database.</p>`;
        return;
    }

    const q = aptitudeQuestions[currentAptitudeIndex];
    const savedAnswer = userAptitudeAnswers[q.id] || "";

    let optionsHtml = '';
    ['A', 'B', 'C', 'D'].forEach(optKey => {
        const isChecked = savedAnswer === optKey ? "checked" : "";
        optionsHtml += `
            <label class="flex items-center gap-3 p-4 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors shadow-sm">
                <input type="radio" name="aptitude-answer" value="${optKey}" onclick="saveAptitudeAnswer(${q.id}, '${optKey}')" class="w-4 h-4 text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500" ${isChecked}>
                <span class="text-slate-200"><strong class="text-slate-400 mr-2 min-w-[20px] inline-block">${optKey}.</strong> ${q.options[optKey]}</span>
            </label>
        `;
    });

    const isFirst = currentAptitudeIndex === 0;
    const isLast = currentAptitudeIndex === aptitudeQuestions.length - 1;

    stage.innerHTML = `
        <div class="flex justify-between items-center mb-6 border-b border-slate-700 pb-3">
            <div>
                <h3 class="text-2xl font-bold text-white">Round 1 Active (Aptitude)</h3>
                <span class="text-sm text-slate-400 font-medium">Question ${currentAptitudeIndex + 1} / ${aptitudeQuestions.length}</span>
            </div>
            <span id="timer-display" class="text-lg font-mono bg-red-900/50 border border-red-700 text-red-400 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                <svg class="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                --:--
            </span>
        </div>
        
        <div class="bg-slate-800/50 border border-slate-700 p-8 rounded-xl mb-8 shadow-xl min-h-[300px]">
            <p class="text-xs text-blue-400 font-black uppercase tracking-widest mb-3 bg-blue-900/30 inline-block px-3 py-1 rounded">${q.topic}</p>
            <p class="font-bold text-xl text-slate-100 mb-8 leading-relaxed">${q.text}</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${optionsHtml}
            </div>
        </div>
        
        <div class="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-5 rounded-2xl border border-slate-700 shadow-lg">
            <button onclick="navigateAptitude(-1)" ${isFirst ? 'disabled class="opacity-50 cursor-not-allowed text-slate-400 px-6 py-2 hover:bg-slate-800 rounded"' : 'class="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold py-2 px-6 rounded transition-colors"'}>
                &larr; Previous
            </button>
            
            <div class="flex flex-wrap justify-center gap-1.5 my-4 md:my-0 flex-1 px-4">
                ${aptitudeQuestions.map((_, i) => `<div class="w-2.5 h-2.5 rounded-full transition-colors ${userAptitudeAnswers[aptitudeQuestions[i].id] ? 'bg-indigo-500' : 'bg-slate-700'} ${i === currentAptitudeIndex ? 'ring-2 ring-indigo-300 scale-125' : ''}" title="Q${i + 1}"></div>`).join('')}
            </div>
            
            ${!isLast ? `<button onclick="navigateAptitude(1)" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-8 rounded shadow-lg transition-colors">Next &rarr;</button>` : `<button id="submit-btn" onclick="submitAptitudeRound()" class="bg-green-600 hover:bg-green-500 text-white font-black py-2.5 px-10 rounded shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-transform active:scale-95 text-lg">Finish Test</button>`}
        </div>
        
        <div id="eval-loading" class="mt-6 text-center text-sm font-semibold text-indigo-400 hidden animate-pulse bg-indigo-900/20 py-2 rounded">Submitting answers and analyzing performance...</div>
    `;
}

function saveAptitudeAnswer(qId, val) {
    userAptitudeAnswers[qId] = val;
    // Visually update the little dot immediately
    const index = aptitudeQuestions.findIndex(q => q.id === qId);
    if (index !== -1) {
        const dots = document.querySelectorAll('.rounded-full.w-2\\.5');
        if (dots[index]) {
            dots[index].classList.remove('bg-slate-700');
            dots[index].classList.add('bg-indigo-500');
        }
    }
}

function navigateAptitude(dir) {
    const newIdx = currentAptitudeIndex + dir;
    if (newIdx >= 0 && newIdx < aptitudeQuestions.length) {
        currentAptitudeIndex = newIdx;
        renderAptitudeQuestion();
    }
}

async function submitAptitudeRound() {
    clearInterval(timerInterval);
    document.getElementById('eval-loading').classList.remove('hidden');
    if (document.getElementById('submit-btn')) document.getElementById('submit-btn').disabled = true;

    try {
        const res = await fetch(`${API_BASE}/interview/aptitude/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ session_id: currentSessionId, answers: userAptitudeAnswers })
        });
        const data = await parseJSON(res);

        if (!res.ok) throw new Error(data.error || "Failed API submission");

        const stage = document.getElementById('interview-stage');
        const color = data.status === 'PASS' ? 'text-green-400' : 'text-red-400';
        const borderColor = data.status === 'PASS' ? 'border-green-800/50' : 'border-red-800/50';

        const progressBtn = data.status === 'PASS' ? `<button onclick="renderRounds()" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] text-xl transition-transform active:scale-95">Proceed to Technical Round &rarr;</button>` : `<button onclick="renderDashboard()" class="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold py-4 px-8 rounded-xl transition-colors">Finish & Return to Dashboard</button>`;

        stage.innerHTML = `
            <div class="max-w-3xl mx-auto bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
                
                <div class="bg-slate-950 p-8 text-center border-b border-slate-800 relative">
                    <div class="absolute inset-0 bg-gradient-to-b ${data.status === 'PASS' ? 'from-green-900/20' : 'from-red-900/20'} to-transparent opacity-50 pointer-events-none"></div>
                    <h2 class="text-indigo-400 text-sm font-black uppercase tracking-[0.3em] mb-2 relative z-10">Evaluation Complete</h2>
                    <h1 class="text-4xl md:text-5xl font-extrabold text-white relative z-10">Aptitude Round Result</h1>
                </div>

                <div class="p-8 md:p-12">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <div class="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 text-center shadow-inner">
                            <p class="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2">Final Score</p>
                            <p class="${color} text-4xl md:text-5xl font-black">${Math.round(data.score)}%</p>
                        </div>
                        <div class="bg-slate-800/80 border ${borderColor} bg-gradient-to-br ${data.status === 'PASS' ? 'from-slate-800 to-green-950/20' : 'from-slate-800 to-red-950/20'} rounded-2xl p-6 text-center shadow-lg transform transition-transform hover:scale-105">
                            <p class="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2">Status</p>
                            <p class="${color} text-2xl md:text-4xl font-black mt-1">${data.status}</p>
                        </div>
                        <div class="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 text-center shadow-inner pt-7">
                            <p class="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">Correct</p>
                            <p class="text-green-400 text-2xl md:text-3xl font-black">${data.correct}</p>
                        </div>
                        <div class="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 text-center shadow-inner pt-7">
                            <p class="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">Wrong</p>
                            <p class="text-red-400 text-2xl md:text-3xl font-black">${data.wrong}</p>
                        </div>
                    </div>
                    
                    <div class="bg-slate-950 border border-slate-800 rounded-2xl p-8 mb-10 shadow-inner">
                        <h3 class="text-indigo-400 font-extrabold text-lg mb-4 flex items-center gap-2 uppercase tracking-wide">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            AI Performance Analysis
                        </h3>
                        <p class="text-slate-300 text-base md:text-lg leading-relaxed">${data.feedback}</p>
                    </div>
                    
                    <div class="mt-8">
                        ${progressBtn}
                    </div>
                </div>
            </div>
        `;

    } catch (err) {
        document.getElementById('interview-stage').innerHTML = `<div class="max-w-2xl mx-auto bg-slate-900 border border-red-900 p-8 rounded text-center"><p class="text-red-400 font-bold mb-4">Error processing answers: ${err.message}</p><button onclick="renderRounds()" class="bg-slate-700 hover:bg-slate-600 font-bold text-white px-6 py-2 rounded">Go Back</button></div>`;
    }
}

async function startResumeInterview() {
    const container = document.getElementById('app-container');
    container.innerHTML = `<div id="interview-stage" class="w-full h-full max-w-4xl mx-auto py-8"><div class="text-center text-indigo-400 mb-4 animate-pulse">Generating custom questions based on your resume...</div><div class="loader mx-auto"></div></div>`;
    const stage = document.getElementById('interview-stage');

    try {
        // Fetch custom questions based on skills
        const qRes = await fetch(`${API_BASE}/interview/resume-interview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ skills: currentResumeSkills })
        });
        const qData = await parseJSON(qRes);
        if (!qRes.ok) throw new Error(qData.error || "Failed context gen");

        resumeQuestionsList = qData.questions || ["Tell me about your tech stack."];

        // Start standard session
        const sRes = await fetch(`${API_BASE}/interview/start`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const sData = await parseJSON(sRes);
        currentSessionId = sData.session_id;

        renderResumeQuestion(0);
    } catch (err) {
        stage.innerHTML = `<p class="text-red-400">Error: ${err.message}</p>`;
    }
}

function renderResumeQuestion(index) {
    if (index >= resumeQuestionsList.length) {
        renderDashboard();
        return;
    }

    const question = resumeQuestionsList[index];
    const stage = document.getElementById('interview-stage');

    stage.innerHTML = `
        <div class="flex justify-between items-center mb-4 border-b border-indigo-500/50 pb-2">
            <h3 class="text-xl font-bold text-indigo-400">Resume-Based Interview (Q${index + 1}/${resumeQuestionsList.length})</h3>
            <span class="text-xs bg-indigo-900 border border-indigo-700 text-indigo-200 px-2 py-1 rounded">Custom Gen</span>
        </div>
        <div class="bg-slate-800 p-6 rounded-xl mb-4 border border-slate-700 relative shadow-xl">
            <div class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg">🎙️</div>
            <p class="font-semibold text-slate-100 text-lg" id="current-question">${question}</p>
        </div>
        <textarea id="answer-box" rows="5" placeholder="Type your detailed explanation based on your experience..." class="w-full bg-slate-900 border border-slate-700 text-white p-4 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-inner"></textarea>
        <div class="flex justify-end gap-3 items-center">
            <span id="eval-loading" class="text-sm text-indigo-400 hidden animate-pulse">AI is validating your experience...</span>
            <button id="submit-btn" onclick="submitResumeAnswer(${index})" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg transition-transform shadow-[0_0_15px_rgba(79,70,229,0.5)] active:scale-95">Submit Response</button>
        </div>
        <div id="eval-result" class="mt-6 hidden bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-2xl"></div>
    `;
}

async function submitResumeAnswer(index) {
    const answerBox = document.getElementById('answer-box');
    const answer = answerBox ? answerBox.value : "";
    const question = document.getElementById('current-question').innerText;

    if (!answer.trim()) return;

    document.getElementById('eval-loading').classList.remove('hidden');
    document.getElementById('submit-btn').disabled = true;

    try {
        const res = await fetch(`${API_BASE}/interview/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ session_id: currentSessionId, question, answer })
        });
        const data = await parseJSON(res);

        document.getElementById('eval-loading').classList.add('hidden');

        const resultDiv = document.getElementById('eval-result');
        resultDiv.classList.remove('hidden');

        const aiEval = data.evaluation;
        const color = aiEval.score >= 70 ? 'text-green-400' : 'text-orange-400';

        resultDiv.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h4 class="font-bold text-lg text-white">AI Real-time Feedback</h4>
                <span class="${color} font-black text-3xl">${aiEval.score}<span class="text-lg text-slate-500">/100</span></span>
            </div>
            <p class="text-slate-300 text-sm mb-5 leading-relaxed bg-slate-900 p-4 rounded text-left border-l-4 border-indigo-500">${aiEval.feedback}</p>
            <div class="grid grid-cols-2 gap-4 text-xs mb-5">
                <div class="bg-slate-900 p-3 rounded">
                    <strong class="text-green-400 mb-2 block flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Solid Points</strong>
                    <ul class="list-disc pl-4 text-slate-400 space-y-1">${aiEval.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
                </div>
                <div class="bg-slate-900 p-3 rounded">
                    <strong class="text-orange-400 mb-2 block flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Missing Gaps</strong>
                    <ul class="list-disc pl-4 text-slate-400 space-y-1">${aiEval.weaknesses.map(s => `<li>${s}</li>`).join('')}</ul>
                </div>
            </div>
            <div class="flex justify-end pt-4 border-t border-slate-700">
                <button onclick="renderResumeQuestion(${index + 1})" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-8 rounded shadow transition-transform active:scale-95">${index >= resumeQuestionsList.length - 1 ? 'Finish Interview' : 'Next Question'}</button>
            </div>
        `;
    } catch (err) {
        document.getElementById('eval-loading').classList.add('hidden');
        alert("Evaluation failed: " + err.message);
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
        // AI Conversational Chat UI
        let chatHistoryHtml = '';
        if (chatContext.length > 0) {
            chatHistoryHtml = chatContext.map(msg =>
                `<div class="mb-3 p-3 rounded-lg ${msg.role === 'user' ? 'bg-slate-700 ml-12 border border-slate-600' : 'bg-indigo-900/50 mr-12 border border-indigo-700'}">
                    <span class="text-xs font-bold ${msg.role === 'user' ? 'text-slate-400' : 'text-indigo-400'} block mb-1 uppercase">${msg.role === 'user' ? 'You' : 'Interviewer'}</span>
                    <p class="text-slate-200 text-sm whitespace-pre-line">${msg.content}</p>
                </div>`
            ).join('');
        }

        stage.innerHTML = `
            <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
                <div class="flex items-center gap-3">
                    <h3 class="text-xl font-bold text-white">Dynamic AI Interview (Round ${round})</h3>
                    <span class="text-xs bg-indigo-900 border border-indigo-700 text-indigo-200 px-2 py-1 rounded">Q${questionCount} / 5</span>
                </div>
            </div>
            
            <div class="bg-slate-900 border border-slate-700 p-4 rounded-xl mb-4 max-h-[40vh] overflow-y-auto shadow-inner flex flex-col" id="chat-history-container">
                ${chatHistoryHtml}
                <div class="mb-3 p-3 rounded-lg bg-indigo-900/80 mr-12 border border-indigo-600 shadow-lg">
                    <span class="text-xs font-bold text-indigo-300 block mb-1 uppercase flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path></svg>
                        Interviewer
                    </span>
                    <p class="font-semibold text-white text-base" id="current-question">${question}</p>
                </div>
                <div id="is-typing" class="hidden text-xs text-indigo-400 italic mt-2 ml-2 animate-pulse">AI is thinking...</div>
            </div>
            
            <textarea id="answer-box" rows="4" placeholder="Type your detailed technical explanation here..." class="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-inner"></textarea>
            
            <div class="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <span id="eval-loading" class="text-sm text-slate-400 hidden animate-pulse ml-2 flex items-center gap-2">
                    <div class="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div> AI is analyzing your response...
                </span>
                <span class="flex-1"></span>
                <button id="submit-btn" onclick="submitAnswer(${round})" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-8 rounded-lg shadow-lg transition-transform active:scale-95 flex items-center gap-2">
                    Send Reply <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
            </div>
            <div id="eval-result" class="mt-6 hidden bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-xl"></div>
        `;

        // Scroll to bottom
        const chatContainer = document.getElementById('chat-history-container');
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// ---------------- TIMER LOGIC ----------------
let timerInterval;
function startTimer(seconds, autoSubmitCallback = null) {
    clearInterval(timerInterval);
    let timeLeft = seconds;
    const display = document.getElementById('timer-display');

    timerInterval = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        if (display) {
            display.innerHTML = `<svg class="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${m}:${s}`;
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (autoSubmitCallback) {
                autoSubmitCallback();
            } else if (document.getElementById('submit-btn')) {
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

    const evalLoading = document.getElementById('eval-loading');
    const submitBtn = document.getElementById('submit-btn');
    if (evalLoading) evalLoading.classList.remove('hidden');
    if (submitBtn) submitBtn.disabled = true;

    // Add typing indicator mapping for chat interface
    const isTyping = document.getElementById('is-typing');
    if (isTyping) isTyping.classList.remove('hidden');

    try {
        if (round === 1 || round === 3) {
            // Old evaluate path for MCQ or Video placeholder
            const res = await fetch(`${API_BASE}/interview/evaluate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ session_id: currentSessionId, question, answer })
            });
            const data = await parseJSON(res);
            if (evalLoading) evalLoading.classList.add('hidden');
            renderEvaluationResult(data);
        } else {
            // New conversational chat path
            const res = await fetch(`${API_BASE}/interview/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ session_id: currentSessionId, question: question, answer: answer, context: chatContext, question_count: questionCount })
            });
            const data = await parseJSON(res);

            if (evalLoading) evalLoading.classList.add('hidden');
            if (isTyping) isTyping.classList.add('hidden');
            if (!res.ok) throw new Error(data.error || "Failed chat check");

            // Append the successful Q/A to context
            chatContext.push({ role: 'interviewer', content: question });
            chatContext.push({ role: 'user', content: answer });

            // Render partial feedback popout or handle strictly end of 5
            if (data.is_complete) {
                renderEvaluationResult({
                    evaluation: data.evaluation,
                    status: data.round >= 4 ? 'completed' : 'in_progress',
                    next_round: data.round,
                    attempts: 1
                });
            } else {
                questionCount += 1;
                renderQuestion(round, data.next_question);
            }
        }
    } catch (err) {
        if (evalLoading) evalLoading.classList.add('hidden');
        if (isTyping) isTyping.classList.add('hidden');
        if (submitBtn) submitBtn.disabled = false;
        alert("Evaluation failed: " + err.message);
    }
}

// Init App
renderApp();
