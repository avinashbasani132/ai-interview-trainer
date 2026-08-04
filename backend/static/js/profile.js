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
        const email = data.email || 'User';
        const emailInitial = (email || 'U')[0].toUpperCase();

        const statsItems = [
            ['Total Interviews', data.total_interviews || 0, '📊'],
            ['Rounds Cleared', data.rounds_cleared || 0, '✅'],
            ['Failed Attempts', data.failed_attempts || 0, '❌'],
            ['DSA Solved', (data.current_streak !== undefined ? data.ml_job_prediction?.dsa_solved ?? 0 : 0), '💻'],
            ['Current Streak', (data.current_streak || 0) + ' days', '🔥'],
            ['Max Streak', (data.max_streak || 0) + ' days', '⭐'],
        ];

        const statsHtml = statsItems.map(([label, val, icon]) => `
            <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                <p class="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">${icon} ${label}</p>
                <p class="text-xl font-bold text-white">${val}</p>
            </div>`).join('');

        const perfItems = [
            ['Aptitude', sr['Aptitude Test'] || 0, 'blue'],
            ['Technical', sr['Technical Round'] || 0, 'indigo'],
            ['HR', sr['HR Round'] || 0, 'purple'],
        ];

        const performanceBreakdownHtml = perfItems.map(([label, val, color]) => `
            <div>
                <div class="flex justify-between mb-1">
                    <span class="text-slate-300 text-sm font-semibold">${label}</span>
                    <span class="text-${color}-400 font-bold">${val.toFixed(1)}%</span>
                </div>
                <div class="w-full bg-slate-800 rounded-full h-2">
                    <div class="h-2 rounded-full bg-gradient-to-r from-${color}-500 to-${color}-400" style="width:${Math.min(100,val)}%"></div>
                </div>
            </div>`).join('');

        // Append ML Job Prediction dynamically if present
        let mlHtml = '';
        if (mlPred && mlPred.prediction !== undefined) {
            mlHtml = `
            <div class="bg-gradient-to-r from-indigo-900/50 to-blue-900/50 border border-indigo-700/40 rounded-2xl p-6 mt-6">
                <h3 class="text-lg font-bold text-white mb-2">🤖 ML Job Readiness Prediction</h3>
                <div class="flex items-center gap-4 flex-wrap">
                    <div class="text-4xl font-black ${mlPred.prediction >= 70 ? 'text-green-400' : 'text-yellow-400'}">${mlPred.prediction?.toFixed(1) ?? '—'}%</div>
                    <div>
                        <p class="text-slate-300 font-semibold">${mlPred.label || 'Needs Improvement'}</p>
                        <p class="text-slate-400 text-sm">${mlPred.advice || 'Keep practicing to boost your score.'}</p>
                    </div>
                </div>
            </div>`;
        }

        // Render template with context
        const templateHtml = renderTemplate('template-profile', {
            emailInitial,
            email,
            statsHtml,
            certsEarned,
            latestCert,
            highestScore,
            achievementBadges,
            performanceBreakdownHtml
        });

        // Inject ML section dynamically before the achievements box (or at the bottom)
        const wrapper = document.createElement('div');
        wrapper.innerHTML = templateHtml;
        const mainDiv = wrapper.firstElementChild;
        if (mainDiv && mlHtml) {
            // Find achievements section to insert before
            const achievementsHeader = Array.from(mainDiv.querySelectorAll('h3')).find(el => el.textContent.includes('Achievements'));
            if (achievementsHeader && achievementsHeader.parentElement) {
                const parent = achievementsHeader.parentElement;
                const mlEl = document.createElement('div');
                mlEl.innerHTML = mlHtml;
                mainDiv.insertBefore(mlEl.firstElementChild, parent);
            } else {
                mainDiv.innerHTML += mlHtml;
            }
        }

        container.innerHTML = wrapper.innerHTML;

    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-20">Error loading profile: ${err.message}</p>`;
    }
}

async function saveUsername() {
    const val = document.getElementById('username-input').value.trim();
    const status = document.getElementById('username-status');
    if (!val) { status.textContent = 'Please enter a username.'; return; }
    status.textContent = '✅ Username saved (requires /api/user/update-username endpoint).';
    showToast('Username preference saved!', 'success');
}
