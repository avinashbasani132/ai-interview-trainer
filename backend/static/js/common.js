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

// ─── Template Compiler Utility ────────────────────────────────
function renderTemplate(templateId, localScope = {}) {
    const templateEl = document.getElementById(templateId);
    if (!templateEl) {
        console.error(`Template element with ID ${templateId} not found.`);
        return '';
    }
    let templateText = templateEl.innerHTML;
    
    // Escape backticks inside the template to prevent early termination
    templateText = templateText.replace(/`/g, '\\`');
    
    // Evaluate the template string inside the context of localScope
    const keys = Object.keys(localScope);
    const values = Object.values(localScope);
    try {
        const fn = new Function(...keys, `return \`${templateText}\`;`);
        return fn(...values);
    } catch (e) {
        console.error(`Error compiling template ${templateId}:`, e);
        return `<p class="text-red-400">Template compilation error</p>`;
    }
}

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
        
        const path = window.location.pathname;
        if (path === '/admin') {
            if (typeof renderAdmin === 'function') {
                renderAdmin();
            } else {
                renderDashboard();
            }
        } else {
            renderDashboard();
        }
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

// ─── Helper: simple markdown renderer ──────────────────────
function renderMarkdown(text) {
    if (typeof marked !== 'undefined') {
        return marked.parse(text);
    }
    return text.replace(/\n/g, '<br>');
}

// ─── Helper: Full Screen Mode ─────────────────────────────
function enterFullScreenMode() {
    const sidebar = document.getElementById('sidebar');
    const mobileHeader = document.querySelector('header.md\\:hidden');
    const footer = document.getElementById('app-footer');
    const chatWidget = document.getElementById('chat-widget');
    const container = document.getElementById('app-container');

    if (sidebar) sidebar.classList.add('hidden');
    if (mobileHeader) mobileHeader.classList.add('hidden');
    if (footer) footer.style.display = 'none';
    if (chatWidget) chatWidget.style.display = 'none';
    if (container) {
        container.classList.remove('p-6', 'lg:p-10');
        container.classList.add('p-0');
    }
}

function exitFullScreenMode() {
    const sidebar = document.getElementById('sidebar');
    const mobileHeader = document.querySelector('header.md\\:hidden');
    const footer = document.getElementById('app-footer');
    const chatWidget = document.getElementById('chat-widget');
    const container = document.getElementById('app-container');

    if (sidebar) sidebar.classList.remove('hidden');
    if (mobileHeader) mobileHeader.classList.remove('hidden');
    if (footer) footer.style.display = '';
    if (chatWidget) chatWidget.style.display = '';
    if (container) {
        container.classList.remove('p-0');
        container.classList.add('p-6', 'lg:p-10');
    }
}

// Bootstrap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderApp);
} else {
    renderApp();
}
