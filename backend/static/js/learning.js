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

        const cardsHtml = subjects.map(sub => {
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

        const scoreClass = score >= 70 ? 'text-green-400' : 'text-yellow-400';

        // Render template with context
        container.innerHTML = renderTemplate('template-learning', { scoreClass, score, cardsHtml });
    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-20">Error loading learning center.</p>`;
    }
}
