// Standard Rounds Context
let chatContext = [];
let chatQuestionCount = 0;
const CHAT_MAX_QUESTIONS = 5;

// Resume Interview Context
let resumeInterviewSession = null;
let resumeInterviewDurationSeconds = 0;
let resumeInterviewTimer = null;
let resumeInterviewTtsEnabled = false;
let resumeInterviewIsListening = false;
let resumeInterviewVoiceRecognition = null;

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
        startAptitudeRound();
    } else if (round === 2) {
        renderTechnicalChat();
    } else if (round === 3) {
        renderCodingRound();
    } else if (round === 4) {
        renderHRRound();
    } else {
        stage.innerHTML = `<p class="text-slate-400 text-center py-8">🎉 All rounds complete! Check your Dashboard.</p>`;
    }
}

// ─── Round 2: Technical AI Chat ──────────────────────────────
async function renderTechnicalChat() {
    const stage = getInterviewStage();
    chatContext = [];
    chatQuestionCount = 0;

    stage.innerHTML = `<div class="flex items-center gap-4 py-4"><div class="loader"></div><p class="text-slate-400 animate-pulse">AI is preparing your first question...</p></div>`;

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
            renderTechSummary(data);
        } else {
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
//   ROUNDS DASHBOARD
// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────
//   INTERVIEW HUB & GENERAL ROUNDS DASHBOARD
// ────────────────────────────────────────────────────────────
async function renderRounds() {
    setActiveNav('rounds');
    const container = document.getElementById('app-container');
    container.innerHTML = renderTemplate('template-interview');
}

async function renderGeneralInterviewStepper() {
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

        const stepperHtml = rounds.map((r, i) => {
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
        }).join('');

        container.innerHTML = renderTemplate('template-interview-general', { stepperHtml, roundCards });

    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-20">Error loading rounds: ${err.message}</p>`;
    }
}

// ────────────────────────────────────────────────────────────
//   RESUME-BASED ADAPTIVE INTERVIEW SETUP & FLOW
// ────────────────────────────────────────────────────────────
async function renderResumeInterviewSetup() {
    setActiveNav('dashboard');
    const container = document.getElementById('app-container');
    showLoader();
    
    try {
        const res = await fetch(`${API_BASE}/resume/history`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error("Failed to load resume history");
        const historyData = await parseJSON(res);
        const history = historyData.history || [];
        
        let dropdownHtml = `<option value="">-- Choose from History --</option>`;
        if (history.length > 0) {
            dropdownHtml += history.map(h => `<option value="${h.id}">${h.filename} (Score: ${h.score?.toFixed(0) || 'N/A'})</option>`).join('');
        }
        
        // Setup dropdown variables directly inside template evaluation
        const stepperHtml = ''; // not used
        const roundCards = ''; // not used
        container.innerHTML = `
        <div class="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
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
    const zone = document.getElementById('setup-upload-zone');
    if (zone) zone.classList.remove('border-indigo-500');
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
            <div class="lg:col-span-2 space-y-6">
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

            <div class="space-y-6">
                <div class="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-center space-y-4 shadow-xl shadow-indigo-950/10">
                    <h3 class="font-bold text-white text-lg">Ready to begin?</h3>
                    <p class="text-slate-400 text-sm">The interview contains 5 core questions plus adaptive follow-ups based on your responses.</p>
                    <button onclick="startResumeInterview()" class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95 w-full">
                        Start AI Interview Now
                    </button>
                </div>

                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 class="font-bold text-white text-base mb-3 flex items-center gap-2">📋 Interview Question Plan</h3>
                    <ol class="space-y-3">${planQuestionsHtml}</ol>
                </div>
            </div>
        </div>
    </div>`;
}

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
        const currentQ = qAsked[qAsked.length - 1]; 
        const totalPlanned = 5;
        const mainIdx = sessionState.current_question_idx;
        const isFollowUp = qAsked.length > (2 * mainIdx + 1);

        container.innerHTML = `
        <div class="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
            <div class="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                    <span class="text-xs text-indigo-400 uppercase tracking-widest font-bold">Resume-Based Interview</span>
                    <h2 class="text-2xl font-black text-white flex items-center gap-2 mt-1">
                        Question ${mainIdx + 1} of ${totalPlanned} 
                        ${isFollowUp ? '<span class="text-xs bg-purple-900 border border-purple-700 text-purple-300 px-2.5 py-1 rounded-full font-bold ml-2">adaptive follow-up</span>' : ''}
                    </h2>
                </div>
                <div class="flex items-center gap-2">
                    <button id="mode-typing-btn" onclick="toggleResumeInterviewInputMode('typing')" class="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold border border-indigo-500 shadow transition-all active:scale-95">Typing Mode</button>
                    <button id="mode-voice-btn" onclick="toggleResumeInterviewInputMode('voice')" class="px-3.5 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold border border-slate-700 transition-all active:scale-95">Voice Mode</button>
                </div>
            </div>

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

            <div class="bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-lg flex-shrink-0 mt-0.5">🤖</div>
                <div class="space-y-3 flex-1">
                    <p class="text-white font-medium text-lg leading-relaxed" id="ri-question-text">${currentQ}</p>
                    <div id="ri-hint-area" class="hidden text-slate-400 text-xs italic bg-slate-800/40 border border-slate-700/30 p-3 rounded-lg flex items-center gap-2">
                        <span>💡</span> <span id="ri-hint-text">Hint goes here...</span>
                    </div>
                </div>
            </div>

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

            <div id="ri-eval-result" class="hidden"></div>
        </div>`;

        if (resumeInterviewTtsEnabled) {
            speakResumeQuestion(currentQ);
        }
        toggleResumeInterviewInputMode(resumeInterviewIsListening ? 'voice' : 'typing');

    } catch(err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-20">Error loading interview: ${err.message}</p>`;
    }
}

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
    window.speechSynthesis.cancel();
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

async function submitResumeInterviewAnswer(question) {
    const answerEl = document.getElementById('ri-answer-input');
    const answer = answerEl ? answerEl.value.trim() : '';
    if (!answer) { showToast('Please write or speak an answer before submitting.', 'warning'); return; }

    const submitBtn = document.getElementById('ri-submit-btn');
    const statusEl = document.getElementById('ri-eval-status');
    
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Evaluating...'; }
    if (statusEl) statusEl.classList.remove('hidden');
    if (window.speechSynthesis) window.speechSynthesis.cancel();

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

            <div class="space-y-2">
                <p class="text-xs text-slate-500 font-bold uppercase">AI Evaluator Feedback</p>
                <p class="text-slate-200 text-sm leading-relaxed">${evaluation.feedback || 'No feedback'}</p>
            </div>

            <div class="flex justify-end pt-2 border-t border-slate-800">
                ${data.is_complete
                    ? `<button onclick="completeResumeInterview()" class="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 active:scale-95">Finish & View Report</button>`
                    : `<button onclick="renderResumeInterviewFlow()" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95">
                        ${data.followup_triggered ? 'Next: Answer Follow-up →' : 'Next Question →'}
                       </button>`
                }
            </div>
        </div>`;

        if (submitBtn) submitBtn.closest('div.flex').innerHTML = '';
        if (answerEl) answerEl.disabled = true;

    } catch(err) {
        if (statusEl) statusEl.classList.add('hidden');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Answer'; }
        showToast(err.message, 'error');
    }
}

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

            <div class="bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row items-center gap-8 shadow-xl">
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

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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

// ─── Company-Based Placement Assessment Module ──────────────────────────────
let companyListCached = null;
let companyState = {
    sessionId: null,
    companyId: null,
    companyName: "",
    logoUrl: "",
    currentRound: 1,
    questions: [],
    currentQIdx: 0,
    answers: {},
    markedReview: {},
    timerSeconds: 0,
    timerInterval: null,
    jobRole: "Software Engineer",
    difficulty: "Medium"
};
let companySpeechRecognition = null;
let companyIsListeningState = false;
let companyTtsState = false;

// 1. Company Hub Renderer
async function renderCompanyInterviewHub() {
    setActiveNav('dashboard');
    showLoader();
    const container = document.getElementById('app-container');

    try {
        const res = await fetch(`${API_BASE}/company/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || "Failed to load companies list");

        companyListCached = data.companies || [];

        container.innerHTML = `
        <div class="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h2 class="text-3xl font-extrabold text-white flex items-center gap-2">
                        <span>🏢</span> MNC Placement Preparation
                    </h2>
                    <p class="text-slate-400 mt-1">Practice mock placement rounds tailored specifically to company recruitment standards.</p>
                </div>
                <button onclick="renderDashboard()" class="text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-1.5 transition-colors">
                    ← Back to Dashboard
                </button>
            </div>

            <!-- Search & Filters -->
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/50 p-4 border border-slate-800 rounded-2xl">
                <!-- Tabs -->
                <div class="flex flex-wrap gap-2">
                    ${['All', 'Product', 'Service', 'Startup', 'Government'].map(cat => `
                    <button onclick="filterCategory('${cat}')" data-cat="${cat}" 
                        class="category-tab px-4 py-2 text-xs font-bold rounded-xl border border-slate-700 transition-all active:scale-95 ${cat === 'All' ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/20' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}">
                        ${cat === 'All' ? 'All Companies' : cat === 'Product' ? 'Product Based' : cat === 'Service' ? 'Service Based' : cat === 'Startup' ? 'Startups' : 'Government'}
                    </button>`).join('')}
                </div>

                <!-- Search Input -->
                <div class="relative w-full lg:max-w-md">
                    <input type="text" id="company-search-input" oninput="filterCompanies()" 
                        placeholder="Search by company name, category, role or difficulty..." 
                        class="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-4 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors">
                    <span class="absolute right-3.5 top-3 text-slate-500">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </span>
                </div>
            </div>

            <!-- Company Cards Grid -->
            <div id="company-list-grid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                <!-- Cards injected here -->
            </div>
        </div>`;

        renderCompanyCards(companyListCached);

    } catch (err) {
        showToast(err.message, 'error');
        renderDashboard();
    }
}

// 2. Render Cards
function renderCompanyCards(companies) {
    const grid = document.getElementById('company-list-grid');
    if (!grid) return;

    if (companies.length === 0) {
        grid.innerHTML = `
        <div class="col-span-full py-16 text-center space-y-3">
            <span class="text-4xl">🔍</span>
            <p class="text-slate-400 font-semibold">No companies match your search parameters.</p>
            <p class="text-xs text-slate-500">Try searching for other categories or terms.</p>
        </div>`;
        return;
    }

    grid.innerHTML = companies.map(c => {
        const diffColor = c.difficulty?.toLowerCase() === 'hard' ? 'text-red-400 bg-red-950/40 border-red-900/50' : c.difficulty?.toLowerCase() === 'medium' ? 'text-yellow-400 bg-yellow-950/40 border-yellow-900/50' : 'text-green-400 bg-green-950/40 border-green-900/50';
        return `
        <div onclick="renderCompanyDetails(${c.id})" 
            class="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/5 cursor-pointer group">
            <div class="space-y-4">
                <div class="flex items-start justify-between">
                    <img src="${c.logo_url || 'https://img.icons8.com/color/144/services.png'}" alt="${c.name} logo" 
                        class="w-14 h-14 object-contain rounded-xl bg-slate-950 p-2.5 border border-slate-800"
                        onerror="this.src='https://img.icons8.com/color/144/services.png'">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${diffColor}">
                        ${c.difficulty || 'Medium'}
                    </span>
                </div>

                <div>
                    <h3 class="font-extrabold text-white text-base leading-tight group-hover:text-purple-400 transition-colors">${c.name}</h3>
                    <span class="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">${c.category || 'Product'} Based</span>
                </div>

                <p class="text-slate-400 text-xs leading-relaxed line-clamp-3">${c.description || 'Prepare for placement rounds with customized assessments.'}</p>
            </div>

            <div class="mt-5 pt-4 border-t border-slate-800 space-y-3.5">
                <div class="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-400">
                    <div class="flex items-center gap-1">⏱ ${c.duration || '2.5 Hours'}</div>
                    <div class="flex items-center gap-1">📋 5 Rounds</div>
                </div>
                <button class="w-full py-2 bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition-all group-hover:bg-purple-600 group-hover:text-white">
                    Start Prep →
                </button>
            </div>
        </div>`;
    }).join('');
}

// 3. Filter tabs & queries
function filterCategory(cat) {
    document.querySelectorAll('.category-tab').forEach(b => {
        if (b.getAttribute('data-cat') === cat) {
            b.className = "category-tab px-4 py-2 text-xs font-bold rounded-xl border border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-600/20 transition-all active:scale-95";
        } else {
            b.className = "category-tab px-4 py-2 text-xs font-bold rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 transition-all active:scale-95";
        }
    });
    filterCompanies();
}

function filterCompanies() {
    const query = document.getElementById('company-search-input')?.value.toLowerCase() || '';
    const activeTab = document.querySelector('.category-tab.bg-purple-600')?.getAttribute('data-cat') || 'All';

    if (!companyListCached) return;

    const filtered = companyListCached.filter(c => {
        if (activeTab !== 'All') {
            if (activeTab === 'Product' && c.category !== 'Product') return false;
            if (activeTab === 'Service' && c.category !== 'Service') return false;
            if (activeTab === 'Startup' && c.category !== 'Startup') return false;
            if (activeTab === 'Government' && c.category !== 'Government') return false;
        }

        if (!query) return true;

        const nameMatch = c.name.toLowerCase().includes(query);
        const catMatch = (c.category || '').toLowerCase().includes(query);
        const diffMatch = (c.difficulty || '').toLowerCase().includes(query);
        const roleMatch = (c.hiring_type || '').toLowerCase().includes(query);
        const descMatch = (c.description || '').toLowerCase().includes(query);

        return nameMatch || catMatch || diffMatch || roleMatch || descMatch;
    });

    renderCompanyCards(filtered);
}

// 4. Company Detail view
function renderCompanyDetails(companyId) {
    setActiveNav('dashboard');
    showLoader();
    const container = document.getElementById('app-container');

    const comp = companyListCached.find(c => c.id === companyId);
    if (!comp) {
        showToast("Company not found", "error");
        renderCompanyInterviewHub();
        return;
    }

    // Dynamic selection process descriptive text
    let selectionHtml = '';
    if (comp.category?.toLowerCase() === 'product') {
        selectionHtml = `
        <ol class="space-y-3.5 text-slate-300 text-sm">
            <li class="flex gap-2.5"><b class="text-purple-400">1.</b> Aptitude Screening (Cognitive, quantitative, logical reasoning)</li>
            <li class="flex gap-2.5"><b class="text-purple-400">2.</b> Technical MCQ Assessment (Core CS fundamentals, OS, DBMS)</li>
            <li class="flex gap-2.5"><b class="text-purple-400">3.</b> Coding Assessment (Medium-Hard DSA and algorithmic problems)</li>
            <li class="flex gap-2.5"><b class="text-purple-400">4.</b> Technical AI Interview (System Design, Scalability & Depth)</li>
            <li class="flex gap-2.5"><b class="text-purple-400">5.</b> HR & Behavioral Interview (Company leadership values & culture fit)</li>
        </ol>`;
    } else if (comp.category?.toLowerCase() === 'service') {
        selectionHtml = `
        <ol class="space-y-3.5 text-slate-300 text-sm">
            <li class="flex gap-2.5"><b class="text-purple-400">1.</b> Cognitive Aptitude round (Quantitative, verbal, reasoning)</li>
            <li class="flex gap-2.5"><b class="text-purple-400">2.</b> Programming MCQs (Fundamentals of Python, Java, SQL, C++)</li>
            <li class="flex gap-2.5"><b class="text-purple-400">3.</b> Coding Round (Easy-Medium array, string, lookup challenges)</li>
            <li class="flex gap-2.5"><b class="text-purple-400">4.</b> Technical Conversational Assessment (Core technology concepts)</li>
            <li class="flex gap-2.5"><b class="text-purple-400">5.</b> HR Interview (Comms, client handling, communication check)</li>
        </ol>`;
    } else {
        selectionHtml = `
        <ol class="space-y-3.5 text-slate-300 text-sm">
            <li class="flex gap-2.5"><b class="text-purple-400">1.</b> Quick Aptitude MCQ screening</li>
            <li class="flex gap-2.5"><b class="text-purple-400">2.</b> Agile Technical MCQ (Frameworks, tech stack knowledge)</li>
            <li class="flex gap-2.5"><b class="text-purple-400">3.</b> Live DSA Coding Challenge (Algorithmic problem-solving speed)</li>
            <li class="flex gap-2.5"><b class="text-purple-400">4.</b> Technical System & Architecture AI interview</li>
            <li class="flex gap-2.5"><b class="text-purple-400">5.</b> HR Alignment check (Speed, culture, agile mindset)</li>
        </ol>`;
    }

    const rolesList = [
        "Software Engineer", "Software Developer", "Full Stack Developer", "Frontend Developer", "Backend Developer", 
        "Python Developer", "Java Developer", "React Developer", "Node.js Developer", "Data Analyst", 
        "Data Scientist", "AI Engineer", "ML Engineer", "Cloud Engineer", "DevOps Engineer", 
        "Cyber Security Engineer", "Testing Engineer"
    ];

    container.innerHTML = `
    <div class="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
        <!-- Back Link -->
        <button onclick="renderCompanyInterviewHub()" class="text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-1">
            ← Back to Companies
        </button>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Info Panel -->
            <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
                <div class="flex items-center gap-4">
                    <img src="${comp.logo_url || 'https://img.icons8.com/color/144/services.png'}" alt="${comp.name} logo" 
                        class="w-16 h-16 object-contain rounded-2xl bg-slate-950 p-2 border border-slate-800"
                        onerror="this.src='https://img.icons8.com/color/144/services.png'">
                    <div>
                        <h2 class="text-2xl font-black text-white">${comp.name}</h2>
                        <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">${comp.category} Based Interview Prep</p>
                    </div>
                </div>

                <div class="space-y-2">
                    <h3 class="text-slate-200 font-bold text-sm">Company Overview</h3>
                    <p class="text-slate-400 text-sm leading-relaxed">${comp.description || 'Prepare for placements.'}</p>
                </div>

                <div class="space-y-4">
                    <h3 class="text-slate-200 font-bold text-sm">Typical Selection Pattern</h3>
                    <div class="bg-slate-950 border border-slate-800/80 rounded-2xl p-5">
                        ${selectionHtml}
                    </div>
                </div>
            </div>

            <!-- Right Setup Panel -->
            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-6">
                <div class="space-y-5">
                    <h3 class="text-white font-extrabold text-lg pb-3 border-b border-slate-800">Setup Assessment</h3>
                    
                    <!-- Role Dropdown -->
                    <div class="space-y-1.5">
                        <label class="text-xs font-bold text-slate-400">Target Role</label>
                        <select id="company-role-selector" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500">
                            ${rolesList.map(r => `<option value="${r}">${r}</option>`).join('')}
                        </select>
                    </div>

                    <!-- Difficulty Selection -->
                    <div class="space-y-1.5">
                        <label class="text-xs font-bold text-slate-400">Assessment Difficulty</label>
                        <div class="grid grid-cols-3 gap-2">
                            ${['Easy', 'Medium', 'Hard'].map(d => `
                            <button onclick="setCompanySetupDifficulty('${d}')" id="setup-diff-${d}" 
                                class="setup-diff-btn py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${d === 'Medium' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}">
                                ${d}
                            </button>`).join('')}
                        </div>
                    </div>

                    <!-- Meta specs -->
                    <div class="bg-slate-950 border border-slate-800/60 rounded-2xl p-4 space-y-3 text-xs text-slate-400">
                        <div class="flex justify-between"><span>📋 Total Rounds:</span><strong class="text-white">5 Rounds</strong></div>
                        <div class="flex justify-between"><span>⏱ Suggested Duration:</span><strong class="text-white">${comp.duration || '2.5 Hours'}</strong></div>
                        <div class="flex justify-between"><span>🎯 Target Difficulty:</span><strong class="text-white text-purple-400" id="selected-setup-diff-label">Medium</strong></div>
                    </div>
                </div>

                <button onclick="startCompanyInterview(${comp.id})" 
                    class="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-black rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95">
                    Start Placement Assessment
                </button>
            </div>
        </div>
    </div>`;
}

function setCompanySetupDifficulty(diff) {
    document.querySelectorAll('.setup-diff-btn').forEach(btn => {
        if (btn.id === `setup-diff-${diff}`) {
            btn.className = "setup-diff-btn py-2 text-xs font-bold rounded-xl border border-purple-500 bg-purple-600 text-white shadow transition-all active:scale-95";
        } else {
            btn.className = "setup-diff-btn py-2 text-xs font-bold rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 transition-all active:scale-95";
        }
    });
    const label = document.getElementById('selected-setup-diff-label');
    if (label) label.textContent = diff;
}

// 5. Start Assessment
async function startCompanyInterview(companyId) {
    const roleSelector = document.getElementById('company-role-selector');
    const selectedRole = roleSelector ? roleSelector.value : 'Software Engineer';
    const activeDiffBtn = document.querySelector('.setup-diff-btn.bg-purple-600');
    const selectedDifficulty = activeDiffBtn ? activeDiffBtn.textContent.trim() : 'Medium';

    showLoader();

    try {
        const res = await fetch(`${API_BASE}/company/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                company_id: companyId,
                job_role: selectedRole,
                difficulty: selectedDifficulty
            })
        });

        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || "Failed to start placement interview");

        // Save layout details
        companyState.sessionId = data.session_id;
        companyState.companyId = companyId;
        companyState.currentRound = data.current_round;
        companyState.jobRole = selectedRole;
        companyState.difficulty = selectedDifficulty;

        renderCompanyInterviewRun(data.session_id);

    } catch (err) {
        showToast(err.message, 'error');
        renderCompanyDetails(companyId);
    }
}

// 6. Placement Assessment Runner View
async function renderCompanyInterviewRun(sessionId) {
    setActiveNav('dashboard');
    showLoader();
    const container = document.getElementById('app-container');

    try {
        // Load session metadata state
        const sRes = await fetch(`${API_BASE}/company/session/${sessionId}/state`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const sData = await parseJSON(sRes);
        if (!sRes.ok) throw new Error(sData.error || "Failed to retrieve session state");

        companyState.companyName = sData.company_name;
        companyState.logoUrl = sData.logo_url;
        companyState.currentRound = sData.current_round;
        companyState.roundsList = sData.rounds || ["Aptitude", "Technical MCQ", "Coding", "Technical AI", "HR"];

        if (sData.status === 'completed') {
            renderCompanyInterviewSummary(sessionId);
            return;
        }

        // Fetch questions for current round
        const qRes = await fetch(`${API_BASE}/company/session/${sessionId}/round/${companyState.currentRound}/questions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const qData = await parseJSON(qRes);
        if (!qRes.ok) throw new Error(qData.error || "Failed to load round questions");

        companyState.questions = qData.questions || [];
        companyState.currentQIdx = 0;
        companyState.answers = {};
        companyState.markedReview = {};

        // Sync already answered ones (if retrying or refreshing)
        companyState.questions.forEach((q, idx) => {
            if (q.user_answer) {
                companyState.answers[q.id] = q.user_answer;
            }
        });

        // Initialize template layout from template-company-interview-run script
        container.innerHTML = renderTemplate('template-company-interview-run');

        // Start timer
        startCompanyRoundTimer(companyState.currentRound === 1 || companyState.currentRound === 2 ? 900 : 1800); // 15 mins for MCQs, 30 for coding/conversational

        renderCompanyRoundContent();

    } catch (err) {
        showToast(err.message, 'error');
        renderCompanyInterviewHub();
    }
}

// Timer helpers
function startCompanyRoundTimer(seconds) {
    clearInterval(companyState.timerInterval);
    companyState.timerSeconds = seconds;
    
    companyState.timerInterval = setInterval(() => {
        companyState.timerSeconds--;
        const m = Math.floor(companyState.timerSeconds / 60).toString().padStart(2, '0');
        const s = (companyState.timerSeconds % 60).toString().padStart(2, '0');
        
        const el = document.getElementById('run-timer-display');
        if (el) el.textContent = `${m}:${s}`;
        
        if (companyState.timerSeconds <= 0) {
            clearInterval(companyState.timerInterval);
            showToast("Round timer expired. Auto-submitting round.", "warning");
            submitCompanyRoundSession();
        }
    }, 1000);
}

// 7. Render dynamic panels inside company_interview_run template
function renderCompanyRoundContent() {
    const roundNum = companyState.currentRound;
    const questions = companyState.questions;
    const currentQIdx = companyState.currentQIdx;
    const activeQ = questions[currentQIdx];

    // Set logo
    const logoEl = document.getElementById('run-logo-container');
    if (logoEl) {
        logoEl.innerHTML = `<img src="${companyState.logoUrl || 'https://img.icons8.com/color/144/services.png'}" class="w-6 h-6 object-contain" onerror="this.src='https://img.icons8.com/color/144/services.png'">`;
    }

    // Set titles
    const compTitleEl = document.getElementById('run-company-title');
    if (compTitleEl) {
        compTitleEl.textContent = `${companyState.companyName} (${companyState.jobRole})`;
    }

    const roundTitleEl = document.getElementById('run-round-title');
    if (roundTitleEl) {
        roundTitleEl.textContent = companyState.roundsList[roundNum - 1] || `Round ${roundNum}`;
    }

    // Set question headers
    const qHeaderEl = document.getElementById('run-question-idx-header');
    if (qHeaderEl) {
        if (roundNum === 1 || roundNum === 2) {
            qHeaderEl.textContent = `Question ${currentQIdx + 1} of ${questions.length}`;
        } else if (roundNum === 3) {
            qHeaderEl.textContent = `DSA Coding Assessment`;
        } else {
            qHeaderEl.textContent = `Conversational Turn ${questions.length} of 3`;
        }
    }

    const qTopicEl = document.getElementById('run-question-topic-badge');
    if (qTopicEl) {
        qTopicEl.textContent = activeQ?.topic || (roundNum === 3 ? 'Coding' : roundNum === 4 ? 'Technical AI' : 'HR');
    }

    // Set question text
    const qTextEl = document.getElementById('run-question-text');
    if (qTextEl && activeQ) {
        qTextEl.textContent = activeQ.question_text;
    }

    // Navigation buttons state
    const btnPrev = document.getElementById('run-btn-prev');
    const btnNext = document.getElementById('run-btn-next');
    if (btnPrev) btnPrev.disabled = currentQIdx === 0 || roundNum >= 3;
    if (btnNext) {
        if (roundNum === 1 || roundNum === 2) {
            btnNext.disabled = currentQIdx === questions.length - 1;
            btnNext.textContent = "Next →";
        } else {
            btnNext.disabled = true;
            btnNext.textContent = "Next →";
        }
    }

    // Palette Grid
    const paletteGrid = document.getElementById('run-palette-grid');
    if (paletteGrid) {
        if (roundNum === 1 || roundNum === 2) {
            paletteGrid.innerHTML = questions.map((q, idx) => {
                let pColor = "bg-slate-800 border-slate-700 text-slate-400 hover:border-purple-500/50";
                if (idx === currentQIdx) {
                    pColor = "bg-purple-600 text-white border-purple-500 shadow shadow-purple-600/30";
                } else if (companyState.markedReview[q.id]) {
                    pColor = "bg-yellow-600 text-white border-yellow-500 hover:bg-yellow-500";
                } else if (companyState.answers[q.id]) {
                    pColor = "bg-green-600 text-white border-green-500 hover:bg-green-500";
                }
                return `
                <button onclick="jumpToRunQuestionOffset(${idx - currentQIdx})" 
                    class="w-10 h-10 rounded-xl font-bold text-xs border transition-all active:scale-95 ${pColor}">
                    ${idx + 1}
                </button>`;
            }).join('');
        } else if (roundNum === 3) {
            paletteGrid.innerHTML = `
            <button class="col-span-5 py-2.5 rounded-xl bg-purple-600 text-white border border-purple-500 font-bold text-xs pointer-events-none shadow shadow-purple-600/20">
                DSA Problem 1
            </button>`;
        } else {
            // Conversational 3 turns palette
            paletteGrid.innerHTML = [0, 1, 2].map(i => {
                let pColor = "bg-slate-800 border-slate-700 text-slate-500";
                if (i === currentQIdx) {
                    pColor = "bg-purple-600 text-white border-purple-500 shadow";
                } else if (i < questions.length - 1 || (i === questions.length - 1 && activeQ?.user_answer)) {
                    pColor = "bg-green-600 text-white border-green-500";
                }
                return `
                <button class="w-10 h-10 rounded-xl font-bold text-xs border pointer-events-none ${pColor}">
                    Q${i + 1}
                </button>`;
            }).join('');
        }
    }

    // Answer Zone
    const answerZone = document.getElementById('run-answer-input-zone');
    if (answerZone && activeQ) {
        if (roundNum === 1 || roundNum === 2) {
            const opts = activeQ.options || {};
            const selected = companyState.answers[activeQ.id] || "";
            answerZone.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${["A", "B", "C", "D"].map(letter => {
                    const isSelected = selected.toUpperCase() === letter;
                    const borderCol = isSelected ? 'border-purple-500 bg-purple-950/20' : 'border-slate-800 bg-slate-900 hover:border-slate-700';
                    const iconBg = isSelected ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-950 border-slate-850 text-slate-400';
                    return `
                    <div onclick="recordCompanyAnswer('${letter}')" 
                        class="flex items-center gap-3.5 border rounded-2xl p-4 cursor-pointer transition-all duration-300 active:scale-[0.99] ${borderCol}">
                        <span class="w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center border ${iconBg}">${letter}</span>
                        <p class="text-slate-200 text-sm leading-snug">${opts[letter] || ''}</p>
                    </div>`;
                }).join('')}
            </div>`;
        } else if (roundNum === 3) {
            answerZone.innerHTML = `
            <div class="flex flex-col space-y-4">
                <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-slate-400">Coding Language</label>
                    <select id="coding-lang-selector" onchange="changeCompanyCodingLanguage()" 
                        class="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500">
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                        <option value="c++">C++</option>
                    </select>
                </div>
                <div id="coding-editor-container" class="w-full h-80 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
                    <p class="text-slate-500 text-xs p-4 animate-pulse">Initializing code editor...</p>
                </div>
            </div>`;
            
            // Monaco initialization
            setTimeout(() => {
                if (monacoEditor) {
                    try { monacoEditor.dispose(); } catch(_) {}
                    monacoEditor = null;
                }
                require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.41.0/min/vs' } });
                require(['vs/editor/editor.main'], function() {
                    const containerEl = document.getElementById('coding-editor-container');
                    if (!containerEl) return;
                    containerEl.innerHTML = '';
                    monacoEditor = monaco.editor.create(containerEl, {
                        value: companyState.answers[activeQ.id] || getCompanyStarterCode('python'),
                        language: 'python',
                        theme: 'vs-dark',
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: 'on',
                        automaticLayout: true
                    });
                    monacoEditor.onDidChangeModelContent(() => {
                        companyState.answers[activeQ.id] = monacoEditor.getValue();
                    });
                });
            }, 100);
        } else {
            // Conversational Round Turn (Speech/Text inputs)
            answerZone.innerHTML = `
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
                <textarea id="company-conversational-answer-textarea" rows="4" oninput="syncCompanyConversationalAns()"
                    placeholder="Type or speak your answer here..."
                    class="w-full bg-transparent text-white text-sm resize-none focus:outline-none placeholder-slate-500 leading-relaxed">${companyState.answers[activeQ.id] || ''}</textarea>
                
                <div class="flex items-center justify-between pt-3 border-t border-slate-800">
                    <div class="flex items-center gap-2">
                        <button id="company-mic-btn" onclick="toggleCompanyVoiceListening()" 
                            class="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95">
                            <span id="company-mic-dot" class="w-2 h-2 rounded-full bg-slate-500"></span>
                            <span id="company-mic-text">Mic Off</span>
                        </button>
                        <button id="company-tts-btn" onclick="toggleCompanyTTS()" 
                            class="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95">
                            🔊 Speak Question
                        </button>
                    </div>
                    <span id="company-speech-pulse" class="text-xs text-purple-400 font-bold hidden animate-pulse">Listening...</span>
                </div>
            </div>`;
            if (companyTtsState) {
                readCompanyQuestionAloud(activeQ.question_text);
            }
        }
    }
}

// 8. Monaco Language selectors
function changeCompanyCodingLanguage() {
    const sel = document.getElementById('coding-lang-selector');
    if (!sel || !monacoEditor) return;
    const lang = sel.value;
    const monacoLang = lang === 'c++' ? 'cpp' : lang;
    monaco.editor.setModelLanguage(monacoEditor.getModel(), monacoLang);
    monacoEditor.setValue(getCompanyStarterCode(lang));
}

function getCompanyStarterCode(lang) {
    if (typeof getStarterCode === 'function') {
        return getStarterCode(lang);
    }
    const startermaps = {
        python: "def solve():\n    # Write your python code here\n    pass\n",
        javascript: "function solve() {\n    // Write your javascript code here\n}\n",
        java: "public class Solution {\n    public static void main(String[] args) {\n        // Write your java code here\n    }\n}\n",
        "c++": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your C++ code here\n    return 0;\n}\n"
    };
    return startermaps[lang] || startermaps.python;
}

// Conversational sync
function syncCompanyConversationalAns() {
    const txt = document.getElementById('company-conversational-answer-textarea');
    const activeQ = companyState.questions[companyState.currentQIdx];
    if (txt && activeQ) {
        companyState.answers[activeQ.id] = txt.value;
    }
}

// 9. Input control and helpers
function jumpToRunQuestionOffset(delta) {
    const newIdx = companyState.currentQIdx + delta;
    if (newIdx < 0 || newIdx >= companyState.questions.length) return;
    companyState.currentQIdx = newIdx;
    renderCompanyRoundContent();
}

function recordCompanyAnswer(letter) {
    const activeQ = companyState.questions[companyState.currentQIdx];
    if (!activeQ) return;
    companyState.answers[activeQ.id] = letter;
    renderCompanyRoundContent();
}

function toggleMarkForReview() {
    const activeQ = companyState.questions[companyState.currentQIdx];
    if (!activeQ) return;
    companyState.markedReview[activeQ.id] = !companyState.markedReview[activeQ.id];
    renderCompanyRoundContent();
}

function clearCurrentAnswer() {
    const activeQ = companyState.questions[companyState.currentQIdx];
    if (!activeQ) return;
    delete companyState.answers[activeQ.id];
    if (companyState.currentRound === 3 && monacoEditor) {
        monacoEditor.setValue(getCompanyStarterCode(document.getElementById('coding-lang-selector')?.value || 'python'));
    } else {
        const txt = document.getElementById('company-conversational-answer-textarea');
        if (txt) txt.value = '';
    }
    renderCompanyRoundContent();
}

// 10. Submit and check rounds
async function submitCompanyRoundSession() {
    // Check if at least one question is answered
    const activeQ = companyState.questions[companyState.currentQIdx];
    if (!activeQ) return;

    if (companyState.currentRound in [1, 2]) {
        // Require at least some choices answered for safety warning
        const unanswered = companyState.questions.filter(q => !companyState.answers[q.id]);
        if (unanswered.length > 0) {
            const proceed = confirm(`You have ${unanswered.length} unanswered questions. Submit anyway?`);
            if (!proceed) return;
        }
    } else {
        const ans = companyState.answers[activeQ.id] || '';
        if (!ans.trim()) {
            showToast("Please provide an answer before submitting.", "warning");
            return;
        }
    }

    showLoader();
    if (companyState.timerInterval) clearInterval(companyState.timerInterval);

    try {
        const res = await fetch(`${API_BASE}/company/session/${companyState.sessionId}/submit-answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                session_id: companyState.sessionId,
                answers: companyState.answers
            })
        });

        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || "Answer evaluation failed");

        // Check if follow-up turn was returned
        if (data.is_complete === false && data.next_question) {
            // Conversational round turn completed, follow up generated!
            companyState.questions.push(data.next_question);
            companyState.currentQIdx = companyState.questions.length - 1;
            
            // Resume timer for next turn
            startCompanyRoundTimer(300); // 5 mins per turn
            renderCompanyRoundContent();
            hideLoader();
            showToast("Gemini has generated a follow-up question.", "info");
            return;
        }

        // Entire round evaluated
        const passed = data.passed;
        const container = document.getElementById('app-container');

        // Stop TTS speak if any
        try { window.speechSynthesis.cancel(); } catch(_) {}

        let outcomeHtml = '';
        if (passed) {
            outcomeHtml = `
            <div class="bg-green-950/40 border border-green-800 rounded-3xl p-6 md:p-8 text-center space-y-5 animate-in zoom-in duration-300">
                <span class="text-5xl">🎉</span>
                <div class="space-y-1">
                    <h3 class="text-2xl font-black text-green-400">Round Passed!</h3>
                    <p class="text-slate-400 text-sm">Excellent work! You achieved a score of <b>${data.score?.toFixed(1)}%</b> in this round.</p>
                </div>
                
                <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 text-left max-w-lg mx-auto">
                    <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Interviewer Feedback</p>
                    <p class="text-slate-300 text-sm leading-relaxed">${data.feedback || 'Proceed to the next round.'}</p>
                </div>

                <div class="flex justify-center gap-3">
                    ${data.status === 'completed' ? `
                    <button onclick="renderCompanyInterviewSummary(${companyState.sessionId})" 
                        class="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition-all shadow shadow-purple-500/25">
                        View Full Summary & Certificate →
                    </button>` : `
                    <button onclick="renderCompanyInterviewRun(${companyState.sessionId})" 
                        class="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition-all shadow shadow-purple-500/25">
                        Proceed to Next Round →
                    </button>`}
                </div>
            </div>`;
        } else {
            // Failed: check if they can retry (status fails or attempts incremented)
            const isFailedSession = data.status === 'failed';
            outcomeHtml = `
            <div class="bg-red-950/40 border border-red-800 rounded-3xl p-6 md:p-8 text-center space-y-5 animate-in zoom-in duration-300">
                <span class="text-5xl">😔</span>
                <div class="space-y-1">
                    <h3 class="text-2xl font-black text-red-400">Round Not Cleared</h3>
                    <p class="text-slate-400 text-sm">Your score was <b>${data.score?.toFixed(1)}%</b>. The passing threshold is 70%.</p>
                </div>
                
                <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 text-left max-w-lg mx-auto">
                    <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Areas of Improvement</p>
                    <p class="text-slate-300 text-sm leading-relaxed">${data.feedback || 'Take review and try again.'}</p>
                </div>

                <div class="flex justify-center gap-3">
                    ${isFailedSession ? `
                    <div class="space-y-3">
                        <p class="text-xs text-red-400">Attempts exceeded. The assessment session has closed.</p>
                        <div class="flex gap-2 justify-center">
                            <button onclick="renderCompanyInterviewHub()" class="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl transition-colors">
                                Back to Hub
                            </button>
                            <button onclick="renderCompanyDetails(${companyState.companyId})" class="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-colors shadow">
                                Restart Assessment
                            </button>
                        </div>
                    </div>` : `
                    <div class="space-y-3">
                        <p class="text-xs text-yellow-400">You have 1 attempt remaining for this round before elimination.</p>
                        <button onclick="renderCompanyInterviewRun(${companyState.sessionId})" 
                            class="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition-all shadow shadow-purple-500/25">
                            Retry This Round 🔄
                        </button>
                    </div>`}
                </div>
            </div>`;
        }

        container.innerHTML = `
        <div class="w-full max-w-2xl mx-auto py-8">
            ${outcomeHtml}
        </div>`;

    } catch (err) {
        showToast(err.message, 'error');
        renderCompanyInterviewRun(companyState.sessionId);
    }
}

// 11. Final Report / Summary Renderer
async function renderCompanyInterviewSummary(sessionId) {
    setActiveNav('dashboard');
    showLoader();
    const container = document.getElementById('app-container');

    try {
        const res = await fetch(`${API_BASE}/company/session/${sessionId}/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || "Failed to compile summary report");

        const s = data.summary || {};
        const overall = s.overall_score || 70;
        const tech = s.technical_score || 70;
        const coding = s.coding_score || 70;
        const comms = s.communication_score || 70;
        const passedThreshold = overall >= 70;

        const colors = overall >= 75 ? 'text-green-400 border-green-700/50' : overall >= 60 ? 'text-yellow-400 border-yellow-700/50' : 'text-red-400 border-red-700/50';

        container.innerHTML = `
        <div class="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
            <!-- Header back links -->
            <div class="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                    <h2 class="text-3xl font-extrabold text-white">Performance Evaluation</h2>
                    <p class="text-slate-400 mt-1">Mock recruitment analysis for ${data.company_name} — ${companyState.jobRole}</p>
                </div>
                <button onclick="renderCompanyInterviewHub()" class="text-slate-400 hover:text-white text-sm font-semibold">
                    ← Back to Companies
                </button>
            </div>

            <!-- Score board Hero -->
            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row items-center gap-6">
                <!-- Circular Score -->
                <div class="w-32 h-32 rounded-full border-4 ${colors} flex flex-col items-center justify-center flex-shrink-0 bg-slate-950">
                    <span class="text-3xl font-black text-white">${overall.toFixed(0)}</span>
                    <span class="text-[9px] uppercase tracking-wider font-bold text-slate-500">Overall Score</span>
                </div>

                <div class="flex-1 text-center lg:text-left space-y-2">
                    <h3 class="text-xl font-bold text-slate-100">${passedThreshold ? '🎉 Selected / Placement Ready' : '😔 Needs Improvement'}</h3>
                    <p class="text-slate-400 text-sm leading-relaxed">
                        Hiring decision synthesis: <strong class="text-white">${s.recommendation || 'Selected'}</strong> with an expected selection probability of <strong class="text-purple-400">${s.selection_probability || overall}%</strong>.
                    </p>
                </div>

                <div class="grid grid-cols-3 gap-2 flex-shrink-0 w-full lg:w-auto">
                    ${[
                        ['Technical', tech, 'text-blue-400'],
                        ['Coding', coding, 'text-green-400'],
                        ['Communication', comms, 'text-yellow-400']
                    ].map(([l, v, c]) => `
                    <div class="bg-slate-950 border border-slate-850 rounded-xl p-3 text-center min-w-[90px]">
                        <p class="text-lg font-black ${c}">${v.toFixed(0)}</p>
                        <p class="text-[9px] uppercase tracking-wider text-slate-500 font-bold">${l}</p>
                    </div>`).join('')}
                </div>
            </div>

            <!-- Strengths / Weaknesses Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-slate-900 border border-green-900/40 rounded-3xl p-6">
                    <h4 class="font-bold text-white mb-4 flex items-center gap-2">🟢 Key Strengths</h4>
                    <ul class="space-y-3">
                        ${(s.strengths || []).map(st => `
                        <li class="text-slate-300 text-sm flex items-start gap-2.5">
                            <span class="text-green-400 flex-shrink-0">✓</span>
                            <span>${st}</span>
                        </li>`).join('') || '<li class="text-slate-500 text-sm">None noted</li>'}
                    </ul>
                </div>

                <div class="bg-slate-900 border border-red-900/40 rounded-3xl p-6">
                    <h4 class="font-bold text-white mb-4 flex items-center gap-2">🔴 Improvement Gaps</h4>
                    <ul class="space-y-3">
                        ${(s.weaknesses || []).map(wk => `
                        <li class="text-slate-300 text-sm flex items-start gap-2.5">
                            <span class="text-red-400 flex-shrink-0">→</span>
                            <span>${wk}</span>
                        </li>`).join('') || '<li class="text-slate-500 text-sm">None noted</li>'}
                    </ul>
                </div>
            </div>

            <!-- Certificate card -->
            ${passedThreshold ? `
            <div class="bg-gradient-to-br from-purple-950/20 to-indigo-950/20 border border-purple-500/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow shadow-purple-500/5">
                <div class="space-y-2">
                    <h4 class="text-white font-extrabold text-lg flex items-center gap-1.5">
                        <span>🎓</span> Claim Completion Certificate
                    </h4>
                    <p class="text-slate-400 text-sm">You passed the placement threshold! Claim your digital completion certificate with verification signature.</p>
                </div>
                <button onclick="claimCompanyCertificate(${sessionId})"
                    class="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow active:scale-95 flex items-center gap-2">
                    Claim Placement Certificate 📜
                </button>
            </div>` : ''}
        </div>`;

    } catch (err) {
        showToast(err.message, 'error');
        renderCompanyInterviewHub();
    }
}

// Certificate generator
async function claimCompanyCertificate(sessionId) {
    showLoader();
    try {
        const res = await fetch(`${API_BASE}/certificate/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ session_id: sessionId })
        });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || "Failed to generate certificate");

        showToast("Certificate generated successfully!", "success");
        renderCertificates();

    } catch (err) {
        showToast(err.message, 'error');
        hideLoader();
    }
}

// 12. Voice Recognition and TTS integration
function toggleCompanyVoiceListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
        showToast("Speech Recognition is not supported by your browser.", "warning");
        return;
    }

    const micBtn = document.getElementById('company-mic-btn');
    const micDot = document.getElementById('company-mic-dot');
    const micText = document.getElementById('company-mic-text');
    const pulse = document.getElementById('company-speech-pulse');
    const textEl = document.getElementById('company-conversational-answer-textarea');

    if (companyIsListeningState) {
        // Stop listening
        if (companySpeechRecognition) {
            try { companySpeechRecognition.stop(); } catch(_) {}
            companySpeechRecognition = null;
        }
        companyIsListeningState = false;
        if (micBtn) micBtn.className = "px-4 py-2 bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95";
        if (micDot) micDot.className = "w-2 h-2 rounded-full bg-slate-500";
        if (micText) micText.textContent = "Mic Off";
        if (pulse) pulse.classList.add('hidden');
    } else {
        // Start listening
        companyIsListeningState = true;
        if (micBtn) micBtn.className = "px-4 py-2 bg-purple-600 border border-purple-500 text-white shadow shadow-purple-600/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95";
        if (micDot) micDot.className = "w-2 h-2 rounded-full bg-red-400 animate-ping";
        if (micText) micText.textContent = "Mic On";
        if (pulse) pulse.classList.remove('hidden');

        companySpeechRecognition = new SR();
        companySpeechRecognition.continuous = false;
        companySpeechRecognition.interimResults = true;
        companySpeechRecognition.lang = 'en-US';

        companySpeechRecognition.onresult = (event) => {
            const trans = Array.from(event.results)
                .map(r => r[0].transcript)
                .join('');
            if (textEl) {
                textEl.value = trans;
                syncCompanyConversationalAns();
            }
        };

        companySpeechRecognition.onend = () => {
            if (companyIsListeningState) {
                toggleCompanyVoiceListening(); // Stop cleanly
            }
        };

        companySpeechRecognition.onerror = () => {
            toggleCompanyVoiceListening();
            showToast("Voice capture error occurred.", "error");
        };

        companySpeechRecognition.start();
    }
}

function toggleCompanyTTS() {
    const activeQ = companyState.questions[companyState.currentQIdx];
    if (!activeQ) return;
    readCompanyQuestionAloud(activeQ.question_text);
}

function readCompanyQuestionAloud(text) {
    if (!('speechSynthesis' in window)) {
        showToast("Text-to-Speech not supported in this browser.", "warning");
        return;
    }
    
    try { window.speechSynthesis.cancel(); } catch(_) {}
    
    companyTtsState = true;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    
    utterance.onend = () => {
        // Auto trigger voice mic after question finishes reading if voice mode is chosen
        const isVoiceMode = companyIsListeningState;
        if (!isVoiceMode) {
            // Optional: let them answer
        }
    };
    
    window.speechSynthesis.speak(utterance);
}

function quitInterviewRun() {
    if (confirm("Are you sure you want to quit the assessment? Progress for this round will be lost.")) {
        clearInterval(companyState.timerInterval);
        try { window.speechSynthesis.cancel(); } catch(_) {}
        renderCompanyInterviewHub();
    }
}

