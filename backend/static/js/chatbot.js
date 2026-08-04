// ════════════════════════════════════════════════════════════
//   AI CAREER ASSISTANT — ENHANCED CHATBOT MODULE
//   Features: Voice I/O, File Upload, Quick Actions, Settings,
//   TTS, Session Memory, Drag & Drop, Responsive Sizing
//   NOTE: Core chat API logic lives in app.js — not touched here
// ════════════════════════════════════════════════════════════

// ── Session Memory ────────────────────────────────────────────
const chatSession = {
    resumeText:       null,
    resumeName:       null,
    atsScore:         null,
    interviewHistory: [],
    weakTopics:       [],
    codingScore:      null,
    learningProgress: {},
    interviewRound:   null,
    questionsAsked:   0,
    sessionStart:     Date.now(),
    learningStreak:   0
};

// ── Settings State ────────────────────────────────────────────
const chatSettings = {
    ttsEnabled:  false,
    compactMode: false,
    minimized:   false
};

// ── Voice / Upload State ──────────────────────────────────────
let voiceRecognition = null;
let isVoiceListening  = false;
let chatUploadedFile  = null;

// ── Quick Action Chips ────────────────────────────────────────
const QUICK_ACTIONS = [
    { label: '📄 Analyze Resume',   prompt: 'Please analyze my resume and give detailed feedback on strengths, weaknesses, and improvements.' },
    { label: '📊 ATS Score',        prompt: 'Help me improve my ATS score. What keywords am I missing and how can I optimize my resume?' },
    { label: '🎯 Mock Interview',   prompt: 'Start a mock interview with me. Act as an interviewer, ask one question at a time, evaluate my answer, then ask the next.' },
    { label: '💻 Coding Help',      prompt: 'Help me with coding problems. I want to practice DSA, algorithms, and data structures.' },
    { label: '🚀 Career Advice',    prompt: 'Give me personalized career advice. What should I focus on to get my dream job?' },
    { label: '👔 HR Questions',     prompt: 'Generate common HR interview questions and help me prepare strong answers.' },
    { label: '⚙️ Technical Q&A',    prompt: 'Ask me technical interview questions for a software engineering role one by one.' },
    { label: '🗺️ Roadmap',         prompt: 'Create a detailed, personalized learning roadmap for me based on my current skill level.' },
    { label: '🧠 DSA Help',         prompt: 'Help me with Data Structures and Algorithms. Explain concepts clearly and give me practice problems.' },
];

// ─────────────────────────────────────────────────────────────
//   INITIALISATION
// ─────────────────────────────────────────────────────────────
function initEnhancedChatbot() {
    _renderQuickActionChips();
    _initDragDrop();
    _applyResponsiveSize();
    window.addEventListener('resize', _applyResponsiveSize);
    _patchAppendForTTS();
}

// ─────────────────────────────────────────────────────────────
//   QUICK ACTIONS
// ─────────────────────────────────────────────────────────────
function _renderQuickActionChips() {
    const wrap = document.getElementById('chat-quick-chips');
    if (!wrap) return;
    wrap.innerHTML = QUICK_ACTIONS.map((a, i) =>
        `<button onclick="chatQuickAction(${i})" class="chat-chip text-[11px] font-semibold whitespace-nowrap px-2.5 py-1.5 rounded-lg transition-all duration-200">${a.label}</button>`
    ).join('');
}

function chatQuickAction(index) {
    const action = QUICK_ACTIONS[index];
    if (!action) return;
    const input = document.getElementById('chat-input');
    if (!input) return;
    input.value = action.prompt;
    autoResizeChatInput(input);
    chatSession.questionsAsked++;
    sendChatMessage();
}

// ─────────────────────────────────────────────────────────────
//   SETTINGS PANEL
// ─────────────────────────────────────────────────────────────
function toggleChatSettings() {
    const panel = document.getElementById('chat-settings-panel');
    if (panel) panel.classList.toggle('hidden');
}

function toggleTTS() {
    chatSettings.ttsEnabled = !chatSettings.ttsEnabled;
    const btn  = document.getElementById('tts-toggle');
    const knob = document.getElementById('tts-knob');
    if (chatSettings.ttsEnabled) {
        if (btn)  btn.style.background = '#4f46e5';
        if (knob) knob.style.transform = 'translateX(16px)';
        showToast('🔊 Text-to-Speech enabled', 'info');
    } else {
        if (btn)  btn.style.background = '#334155';
        if (knob) knob.style.transform = 'translateX(0)';
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
}

function toggleCompactMode() {
    chatSettings.compactMode = !chatSettings.compactMode;
    const btn  = document.getElementById('compact-toggle');
    const knob = document.getElementById('compact-knob');
    if (chatSettings.compactMode) {
        if (btn)  btn.style.background = '#4f46e5';
        if (knob) knob.style.transform = 'translateX(16px)';
    } else {
        if (btn)  btn.style.background = '#334155';
        if (knob) knob.style.transform = 'translateX(0)';
    }
    _applyResponsiveSize();
}

// ─────────────────────────────────────────────────────────────
//   MINIMIZE
// ─────────────────────────────────────────────────────────────
function minimizeChat() {
    const panel = document.getElementById('chat-panel');
    if (!panel) return;
    chatSettings.minimized = !chatSettings.minimized;
    if (chatSettings.minimized) {
        panel.style.height   = '54px';
        panel.style.overflow = 'hidden';
    } else {
        panel.style.overflow = '';
        _applyResponsiveSize();
    }
}

// ─────────────────────────────────────────────────────────────
//   VOICE INPUT (Speech-to-Text)
// ─────────────────────────────────────────────────────────────
function toggleVoiceInput() {
    if (isVoiceListening) { _stopVoice(); } else { _startVoice(); }
}

function _startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast('Voice input not supported in this browser', 'warning'); return; }
    voiceRecognition                = new SR();
    voiceRecognition.continuous     = false;
    voiceRecognition.interimResults = true;
    voiceRecognition.lang           = 'en-US';
    isVoiceListening = true;
    _setVoiceBtnState(true);
    showToast('🎤 Listening… speak now', 'info');
    voiceRecognition.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
        const inp = document.getElementById('chat-input');
        if (inp) { inp.value = transcript; autoResizeChatInput(inp); }
    };
    voiceRecognition.onend   = () => _stopVoice();
    voiceRecognition.onerror = () => { _stopVoice(); showToast('Voice recognition error', 'error'); };
    voiceRecognition.start();
}

// ─────────────────────────────────────────────────────────────
//   TEXT-TO-SPEECH
// ─────────────────────────────────────────────────────────────
function speakText(text) {
    if (!chatSettings.ttsEnabled || !window.speechSynthesis) return;
    const clean = text.replace(/[#*`~_]/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/<[^>]+>/g,'').trim();
    if (!clean) return;
    const utt  = new SpeechSynthesisUtterance(clean.slice(0, 500));
    utt.rate   = 0.95;
    utt.pitch  = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
}

function _patchAppendForTTS() {
    const orig = window.appendChatMessage;
    if (!orig) return;
    window.appendChatMessage = function(role, content, animate) {
        const id = orig.call(this, role, content, animate);
        if (role === 'assistant' && content) speakText(content);
        return id;
    };
}

// ─────────────────────────────────────────────────────────────
//   FILE UPLOAD
// ─────────────────────────────────────────────────────────────
function handleChatFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    _attachFileToChat(file);
}

function _attachFileToChat(file) {
    chatUploadedFile       = file;
    chatSession.resumeName = file.name;
    const indicator        = document.getElementById('chat-upload-indicator');
    const nameEl           = document.getElementById('chat-upload-name');
    if (indicator && nameEl) { nameEl.textContent = file.name; indicator.classList.remove('hidden'); }
    showToast('📄 "' + file.name + '" attached', 'success');
    if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => { chatSession.resumeText = e.target.result; };
        reader.readAsText(file);
    }
}

function removeChatUpload() {
    chatUploadedFile = null;
    const indicator  = document.getElementById('chat-upload-indicator');
    const fileInput  = document.getElementById('chat-file-input');
    if (indicator) indicator.classList.add('hidden');
    if (fileInput)  fileInput.value = '';
}

// ─────────────────────────────────────────────────────────────
//   DRAG & DROP
// ─────────────────────────────────────────────────────────────
function _initDragDrop() {
    const panel    = document.getElementById('chat-panel');
    const dropzone = document.getElementById('chat-dropzone');
    if (!panel || !dropzone) return;
    panel.addEventListener('dragenter', (e) => { e.preventDefault(); dropzone.classList.remove('hidden'); });
    panel.addEventListener('dragover',  (e) => { e.preventDefault(); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.add('hidden'));
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault(); dropzone.classList.add('hidden');
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) _attachFileToChat(file);
    });
}

// ─────────────────────────────────────────────────────────────
//   RESPONSIVE SIZING
// ─────────────────────────────────────────────────────────────
function _applyResponsiveSize() {
    const panel = document.getElementById('chat-panel');
    if (!panel || chatSettings.minimized) return;
    const w = window.innerWidth;
    if (w <= 480) {
        panel.style.width  = 'calc(100vw - 24px)';
        panel.style.height = '75vh';
        panel.style.right  = '12px';
        panel.style.bottom = '80px';
    } else if (w <= 1024) {
        panel.style.width  = '330px';
        panel.style.height = chatSettings.compactMode ? '400px' : '480px';
        panel.style.right  = '16px';
        panel.style.bottom = '88px';
    } else {
        panel.style.width  = '360px';
        panel.style.height = chatSettings.compactMode ? '400px' : '520px';
        panel.style.right  = '24px';
        panel.style.bottom = '96px';
    }
}

function _stopVoice() {
    isVoiceListening = false;
    if (voiceRecognition) { try { voiceRecognition.stop(); } catch(_) {} voiceRecognition = null; }
    _setVoiceBtnState(false);
}

function _setVoiceBtnState(active) {
    const btn  = document.getElementById('chat-voice-btn');
    const icon = document.getElementById('chat-voice-icon');
    if (!btn) return;
    if (active) {
        btn.classList.add('chat-voice-active');
        if (icon) icon.style.color = '#ef4444';
    } else {
        btn.classList.remove('chat-voice-active');
        if (icon) icon.style.color = '';
    }
}

// ── Boot ─────────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedChatbot);
} else {
    initEnhancedChatbot();
}

// ─────────────────────────────────────────────────────────────
//   CORE CHATBOT API & UI LOGIC
// ─────────────────────────────────────────────────────────────
let chatOpen = false;
let chatLoading = false;
let chatInitialized = false;
let lastBotMessageId = null;

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

function renderMarkdown(text) {
    if (typeof marked === 'undefined') return text.replace(/\n/g, '<br>');
    try {
        const html = marked.parse(text);
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

async function initChatbot() {
    chatInitialized = true;
    initMarked();
    showChatWidget();

    const msgContainer = document.getElementById('chat-messages');
    msgContainer.innerHTML = '';

    appendChatMessage('assistant', `👋 **Hi! I'm your AI Career Mentor.**

I can help you with:
- 📄 Resume analysis & ATS improvements
- 🎯 Mock interviews & question practice
- 💻 Coding help (DSA, Python, Java, React...)
- 🚀 Career guidance & learning roadmaps
- 🏢 Company-specific interview prep

What would you like to work on today?`, false);

    loadChatHistory();
    loadChatSuggestions();
}

function showChatWidget() {
    const widget = document.getElementById('chat-widget');
    if (widget && token) widget.style.display = '';
}

function hideChatWidget() {
    const widget = document.getElementById('chat-widget');
    if (widget) widget.style.display = 'none';
}

async function loadChatHistory() {
    if (!token) return;
    try {
        const res = await fetch(`${API_BASE}/chat/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.history && data.history.length > 0) {
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

async function sendChatMessage() {
    if (chatLoading) return;
    const input = document.getElementById('chat-input');
    const message = (input?.value || '').trim();
    if (!message) return;

    document.getElementById('chat-suggestions')?.classList.add('hidden');

    input.value = '';
    input.style.height = 'auto';
    appendChatMessage('user', message, true);
    scrollChatToBottom();

    chatLoading = true;
    setChatLoading(true);

    const payload = { message };
    if (typeof chatSession !== 'undefined') {
        if (chatSession.resumeText)  payload.resume_text  = chatSession.resumeText;
        if (chatSession.resumeName)  payload.resume_name  = chatSession.resumeName;
        if (chatSession.atsScore !== null) payload.ats_score = chatSession.atsScore;
    }

    try {
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 30000);

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

    if (!isUser && typeof hljs !== 'undefined') {
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) el.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b));
        }, 60);
    }

    return id;
}

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

async function regenerateLastResponse() {
    if (chatLoading) return;
    const msgs = document.querySelectorAll('#chat-messages > div');
    let lastUserMsg = null;
    for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].querySelector('.from-indigo-600')) {
            lastUserMsg = msgs[i].querySelector('p')?.textContent;
            break;
        }
    }
    if (!lastUserMsg) { showToast('No message to regenerate', 'warning'); return; }

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

function setChatLoading(loading) {
    const typing = document.getElementById('chat-typing');
    const sendBtn = document.getElementById('chat-send-btn');
    if (typing) typing.classList.toggle('hidden', !loading);
    if (sendBtn) sendBtn.disabled = loading;
    if (loading) scrollChatToBottom();
}

function scrollChatToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) setTimeout(() => { container.scrollTop = container.scrollHeight; }, 60);
}

function handleChatKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
    }
}

function autoResizeChatInput(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

(function injectChatStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out forwards; }

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

        #chat-messages::-webkit-scrollbar { width: 4px; }
        #chat-messages::-webkit-scrollbar-track { background: transparent; }
        #chat-messages::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

        @media (max-width: 420px) {
            #chat-panel { width: calc(100vw - 24px); right: 12px; }
        }
    `;
    document.head.appendChild(style);
})();

if (token && token !== 'undefined' && token !== 'null') {
    showChatWidget();
}

