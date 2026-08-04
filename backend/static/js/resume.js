async function renderResumePage() {
    setActiveNav('resume');
    const container = document.getElementById('app-container');
    container.innerHTML = renderTemplate('template-resume');
    loadResumeHistory();
}

async function processResumeFile(file) {
    const statusEl = document.getElementById('resume-upload-status');
    const resultsEl = document.getElementById('resume-results');
    if (statusEl) {
        statusEl.classList.remove('hidden');
        statusEl.innerHTML = `<div class="bg-indigo-900/20 border border-indigo-700 text-indigo-300 p-4 rounded-xl flex items-center gap-3">
            <div class="animate-spin w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full"></div> Analyzing ${file.name}...
        </div>`;
    }

    const formData = new FormData();
    formData.append('resume', file);
    try {
        const res = await fetch(`${API_BASE}/resume/upload-resume`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error);
        if (statusEl) statusEl.classList.add('hidden');
        renderResumeResults(data);
        loadResumeHistory();
    } catch(e) {
        if (statusEl) statusEl.innerHTML = `<div class="bg-red-900/20 border border-red-700 text-red-300 p-4 rounded-xl">❌ ${e.message}</div>`;
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
    } catch (err) {
        showToast(err.message, 'error');
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
    const kwDensity = (data.keyword_density || 0).toFixed(1);
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

    const ivReasonSummary = `${ivReason.slice(0,200)}${ivReason.length>200?'...':''}`;

    // Compute sub-sections HTML
    const statsGridHtml = [
        ['Skills',skills.length,'text-blue-400'],
        ['Missing',missing.length,missing.length===0?'text-green-400':'text-orange-400'],
        ['Strengths',strengths.length,'text-purple-400'],
        ['Keywords',data.keyword_matches?data.keyword_matches.length:0,'text-cyan-400'],
        ['Certs',data.certifications_count||0,'text-yellow-400'],
        ['Soft',softSkills.length,'text-pink-400']
    ].map(([l,v,c])=>`
        <div class="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/50">
            <p class="text-xl font-black ${c}">${v}</p><p class="text-slate-400 text-xs mt-0.5">${l}</p>
        </div>`).join('');

    const skillsCount = skills.length;
    const softSkillsCountHtml = softSkills.length > 0 ? `<span class="text-xs text-slate-400">${softSkills.length} soft skills</span>` : '';
    const skillsContentHtml = Object.keys(skillsByCat).length > 0
        ? `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">${skillCatsHtml}</div>`
        : `<div class="flex flex-wrap gap-2">${skills.map(s=>`<span class="text-xs px-2.5 py-1 bg-blue-900/40 border border-blue-700/40 text-blue-300 rounded-full">${s}</span>`).join('')||'<p class="text-slate-500 text-sm">No technical skills detected. Add a dedicated Skills section.</p>'}</div>`;

    const softSkillsSectionHtml = softSkills.length > 0 ? `<div class="mt-4 pt-4 border-t border-slate-700/50">
        <p class="text-pink-400 text-xs font-bold uppercase tracking-wider mb-2">Soft Skills</p>
        <div class="flex flex-wrap gap-1.5">${softSkills.map(s=>`<span class="text-xs px-2 py-0.5 bg-pink-900/30 border border-pink-700/30 text-pink-300 rounded-full">${s}</span>`).join('')}</div>
    </div>` : '';

    const atsCompatIssuesHtml = (atsCompat.issues||[]).length === 0
        ? '<p class="text-green-400 text-sm">✅ No ATS formatting issues!</p>'
        : (atsCompat.issues||[]).map(i=>`<div class="text-xs text-orange-300 flex items-start gap-2 mb-1.5 bg-orange-900/10 border border-orange-800/20 rounded-lg p-2"><span>⚠</span>${i}</div>`).join('');

    const atsCompatSuggestionsHtml = (atsCompat.suggestions||[]).length > 0
        ? `<div class="mt-2">${(atsCompat.suggestions||[]).map(s=>`<p class="text-slate-400 text-xs mb-1">→ ${s}</p>`).join('')}</div>`
        : '';

    const wordCount = atsCompat.word_count || 0;
    const pageEstimate = atsCompat.page_estimate || 1;

    const grammarWordCount = grammar.word_count || 0;
    const grammarAvgSentence = grammar.avg_sentence_length || 0;
    const grammarPassiveVoice = grammar.passive_voice_count || 0;

    const grammarIssuesHtml = (grammar.issues||[]).length > 0
        ? grammar.issues.map(i=>`<div class="text-xs text-orange-300 flex items-start gap-2 mb-1.5 bg-orange-900/10 border border-orange-800/20 rounded-lg p-2"><span>⚠</span>${i}</div>`).join('')
        : '<p class="text-green-400 text-sm">✅ No major grammar issues!</p>';

    const kwMatchedCount = data.keyword_matches ? data.keyword_matches.length : 0;
    const kwMissingCount = data.missing_keywords ? data.missing_keywords.length : 0;

    const keywordAnalysisHtml = data.missing_keywords && data.missing_keywords.length > 0
        ? `<p class="text-slate-400 text-xs mb-2">Missing keywords:</p>
           <div class="flex flex-wrap gap-1.5">${data.missing_keywords.slice(0, 8).map(k=>`<span class="text-xs px-2 py-0.5 bg-red-900/30 border border-red-700/30 text-red-300 rounded-full">${k}</span>`).join('')}</div>`
        : '<p class="text-green-400 text-sm">✅ Good keyword coverage!</p>';

    const strengthsHtml = strengths.map(s=>`<li class="text-sm text-slate-300 leading-relaxed">${s}</li>`).join('') || '<p class="text-slate-500 text-sm">Complete more sections to identify strengths.</p>';
    const weaknessesHtml = weaknesses.map(w=>`<li class="text-sm text-slate-300 leading-relaxed">${w}</li>`).join('') || '<p class="text-slate-500 text-sm">No significant weaknesses — great job!</p>';

    const suggestionsHtml = suggestions.map((s,i)=>`
        <li class="flex items-start gap-3 bg-yellow-900/10 border border-yellow-800/20 rounded-xl p-3">
            <span class="w-5 h-5 rounded-full bg-yellow-600/40 text-yellow-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">${i+1}</span>
            <p class="text-slate-300 text-sm">${s}</p>
        </li>`).join('') || '<p class="text-slate-500 text-sm">No suggestions — great resume!</p>';

    const missingSkillsHtml = missingSkills.map(s=>`<span class="text-xs px-2.5 py-1 bg-red-900/30 border border-red-700/40 text-red-300 rounded-full font-medium">${s}</span>`).join('') || '<p class="text-slate-500 text-sm">None identified.</p>';
    const missingSkillsTipHtml = missingSkills.length > 0 ? '<p class="text-slate-500 text-xs mt-2">💡 Add these if you have any experience with them.</p>' : '';

    const totalQuestions = easyQs.length + medQs.length + hardQs.length;
    const easyCount = easyQs.length;
    const mediumCount = medQs.length;
    const hardCount = hardQs.length;

    const easyQuestionsHtml = easyQs.length ? `<div class="mb-4"><p class="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">🟢 Easy — Conceptual & HR</p><ol class="space-y-2">${qListHtml(easyQs,'green','E')}</ol></div>` : '';
    const mediumQuestionsHtml = medQs.length ? `<div class="mb-4"><p class="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">🟡 Medium — Technical & Behavioral</p><ol class="space-y-2">${qListHtml(medQs,'yellow','M')}</ol></div>` : '';
    const hardQuestionsHtml = hardQs.length ? `<div><p class="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">🔴 Hard — System Design</p><ol class="space-y-2">${qListHtml(hardQs,'red','H')}</ol></div>` : '';

    const learningRoadmapHtml = Object.keys(roadmap).length > 0 ? `
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
    </div>` : '';

    const downloadBtnHtml = recordId ? `
    <button onclick="downloadPDFReport(${recordId}, '${filename}')"
        class="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/30 active:scale-95">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        Download PDF Report
    </button>` : '';

    // Render template with computed context
    resultsEl.classList.remove('hidden');
    resultsEl.innerHTML = renderTemplate('template-resume-results', {
        scoreColor,
        score,
        circumference,
        dashOffset,
        scoreBadgeClass,
        scoreLabel,
        ivBadgeClass,
        ivReadiness,
        expLevel,
        quantAchievements,
        ivReasonSummary,
        statsGridHtml,
        breakdownRows,
        contactBadges,
        jrHtml,
        skillsCount,
        softSkillsCountHtml,
        skillsContentHtml,
        softSkillsSectionHtml,
        missHtml,
        compatScore,
        atsCompatIssuesHtml,
        atsCompatSuggestionsHtml,
        wordCount,
        pageEstimate,
        grammarColor,
        grammarGrade,
        grammarWordCount,
        grammarAvgSentence,
        grammarPassiveVoice,
        grammarIssuesHtml,
        kwDensity,
        kwMatchedCount,
        kwMissingCount,
        keywordAnalysisHtml,
        strengthsHtml,
        weaknessesHtml,
        suggestionsHtml,
        missingSkillsHtml,
        missingSkillsTipHtml,
        totalQuestions,
        easyCount,
        mediumCount,
        hardCount,
        easyQuestionsHtml,
        mediumQuestionsHtml,
        hardQuestionsHtml,
        learningRoadmapHtml,
        downloadBtnHtml
    });
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
