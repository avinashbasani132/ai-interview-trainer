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

// ─────────────────────────────────────────────────────────────
//   INJECT PREMIUM STYLES
// ─────────────────────────────────────────────────────────────
(function _injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes chatPulseRing {
            0%   { transform:scale(1);   opacity:0.7; }
            50%  { transform:scale(1.6); opacity:0;   }
            100% { transform:scale(1);   opacity:0;   }
        }
        @keyframes onlineBlink {
            0%,100% { opacity:1;   }
            50%     { opacity:0.3; }
        }
        @keyframes fadeInMsg {
            from { opacity:0; transform:translateY(7px); }
            to   { opacity:1; transform:translateY(0);   }
        }
        @keyframes fabIn {
            0%   { transform:scale(0); opacity:0;   }
            65%  { transform:scale(1.12); opacity:1; }
            100% { transform:scale(1);   opacity:1; }
        }
        @keyframes voicePulse {
            0%,100% { box-shadow:0 0 0 0   rgba(239,68,68,0.5); }
            50%     { box-shadow:0 0 0 8px rgba(239,68,68,0);   }
        }

        #chat-fab { animation: fabIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
        #chat-pulse-ring { animation: chatPulseRing 2s ease-in-out infinite; }
        .chat-online-dot { animation: onlineBlink 2.5s ease-in-out infinite; }

        #chat-panel {
            transition:
                transform  0.35s cubic-bezier(0.34,1.56,0.64,1),
                opacity    0.25s ease,
                height     0.28s ease;
        }

        .animate-fadeIn { animation: fadeInMsg 0.22s ease-out both; }

        .chat-chip {
            background:rgba(79,70,229,0.12);
            border:1px solid rgba(99,102,241,0.22);
            color:#a5b4fc;
        }
        .chat-chip:hover {
            background:rgba(79,70,229,0.28) !important;
            border-color:rgba(99,102,241,0.5) !important;
            color:#c7d2fe !important;
            transform:scale(1.05);
        }

        .chat-voice-active {
            background:rgba(239,68,68,0.18) !important;
            border-color:rgba(239,68,68,0.45) !important;
            animation:voicePulse 1s ease-in-out infinite;
        }

        #chat-input {
            background:rgba(22,32,55,0.75);
            border:1px solid rgba(99,102,241,0.2);
            border-radius:12px;
            padding:8px 12px;
            max-height:100px;
            scrollbar-width:none;
            color:#e2e8f0;
            transition:border-color 0.2s, box-shadow 0.2s;
        }
        #chat-input:focus {
            border-color:rgba(99,102,241,0.55) !important;
            box-shadow:0 0 0 3px rgba(99,102,241,0.12);
            outline:none;
        }
        #chat-input::placeholder { color:#475569; }
        #chat-send-btn:disabled { opacity:0.45; cursor:not-allowed; }

        #chat-messages::-webkit-scrollbar { width:3px; }
        #chat-messages::-webkit-scrollbar-track { background:transparent; }
        #chat-messages::-webkit-scrollbar-thumb { background:#2d3748; border-radius:3px; }

        #chat-suggestion-list button {
            font-size:11px;
            background:rgba(30,41,59,0.85);
            border:1px solid rgba(99,102,241,0.2);
            color:#94a3b8;
            padding:5px 10px;
            border-radius:8px;
            transition:all 0.2s;
        }
        #chat-suggestion-list button:hover {
            background:rgba(79,70,229,0.2);
            border-color:rgba(99,102,241,0.45);
            color:#c7d2fe;
        }

        .chat-bot-msg h1,.chat-bot-msg h2,.chat-bot-msg h3 { color:#e2e8f0; margin-top:0.6rem; margin-bottom:0.2rem; font-weight:700; }
        .chat-bot-msg h1 { font-size:1rem; } .chat-bot-msg h2 { font-size:0.9rem; } .chat-bot-msg h3 { font-size:0.85rem; }
        .chat-bot-msg p  { margin:0.25rem 0; color:#cbd5e1; line-height:1.6; font-size:0.82rem; }
        .chat-bot-msg ul,.chat-bot-msg ol { padding-left:1.2rem; margin:0.35rem 0; }
        .chat-bot-msg li { margin:0.2rem 0; color:#cbd5e1; font-size:0.82rem; }
        .chat-bot-msg code:not(pre code) { background:#1e293b; border:1px solid #334155; color:#7dd3fc; padding:1px 5px; border-radius:4px; font-size:0.78rem; }
        .chat-bot-msg pre { background:#070d1f; border:1px solid #1e293b; border-radius:10px; overflow-x:auto; margin:0.5rem 0; padding:0.75rem 1rem; }
        .chat-bot-msg pre code { background:transparent; border:none; color:inherit; padding:0; font-size:0.78rem; }
        .chat-bot-msg strong { color:#f1f5f9; } .chat-bot-msg em { color:#94a3b8; }
        .chat-bot-msg blockquote { border-left:3px solid #4f46e5; padding-left:0.75rem; color:#94a3b8; margin:0.5rem 0; font-style:italic; }
        .chat-bot-msg a  { color:#818cf8; text-decoration:underline; }
        .chat-bot-msg table { width:100%; border-collapse:collapse; font-size:0.78rem; }
        .chat-bot-msg th { background:#1e293b; color:#94a3b8; padding:4px 8px; text-align:left; }
        .chat-bot-msg td { border:1px solid #1e293b; padding:4px 8px; color:#cbd5e1; }

        @media (max-width:480px) {
            #chat-panel { width:calc(100vw - 24px) !important; height:75vh !important; right:12px !important; bottom:80px !important; }
            #chat-fab   { right:12px !important; bottom:16px !important; }
        }
        @media (min-width:481px) and (max-width:1024px) {
            #chat-panel { width:330px !important; }
        }
    `;
    document.head.appendChild(style);
})();

// ─────────────────────────────────────────────────────────────
//   BOOT
// ─────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedChatbot);
} else {
    initEnhancedChatbot();
}

// ════════════════════════════════════════════════════════════
//   END ENHANCED CHATBOT MODULE
// ════════════════════════════════════════════════════════════
