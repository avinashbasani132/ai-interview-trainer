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
        const progressPercentage = Math.min(100, ((currentRound - 1) / 3) * 100).toFixed(0);
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

        const scoreClass = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-blue-400';
        const attemptsClass = attemptsRemaining > 0 ? 'text-white' : 'text-red-400';
        const nextStepMessage = nextStepMessages[currentRound] || 'All rounds complete!';
        const roundLabel = roundLabels[currentRound] || 'Complete';
        const roundLabelNext = roundLabels[currentRound] || 'Final Stage';

        // Render template with context variables
        container.innerHTML = renderTemplate('template-dashboard', {
            nextStepMessage,
            streak,
            scoreClass,
            score,
            currentRound,
            roundLabel,
            progressPercentage,
            attemptsClass,
            attemptsRemaining,
            weakTopics,
            roundLabelNext,
            dsaHtml,
            achievementBadges
        });

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
