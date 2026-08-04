async function renderLeaderboard() {
    setActiveNav('leaderboard');
    showLoader();
    const container = document.getElementById('app-container');
    try {
        const res = await fetch(`${API_BASE}/user/analytics/leaderboard`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load leaderboard');
        const data = await parseJSON(res);
        const lb = data.leaderboard || [];

        const medalEmoji = ['🥇', '🥈', '🥉'];
        const rankColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];

        const rows = lb.map((u, i) => `
            <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition-colors ${i < 3 ? 'font-bold' : ''}">
                <td class="px-5 py-4 text-center">
                    <span class="${i < 3 ? rankColors[i] : 'text-slate-400'} font-black text-lg">
                        ${i < 3 ? medalEmoji[i] : `#${u.rank}`}
                    </span>
                </td>
                <td class="px-5 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white">${(u.username || 'U')[0].toUpperCase()}</div>
                        <span class="${i < 3 ? 'text-white' : 'text-slate-300'}">${u.username}</span>
                    </div>
                </td>
                <td class="px-5 py-4 text-center">
                    <div class="inline-flex items-center gap-2">
                        <div class="w-20 bg-slate-800 rounded-full h-1.5">
                            <div class="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style="width:${Math.min(100, u.readiness_score)}%"></div>
                        </div>
                        <span class="${i < 3 ? rankColors[i] : 'text-slate-300'} font-bold text-sm">${u.readiness_score.toFixed(1)}%</span>
                    </div>
                </td>
                <td class="px-5 py-4 text-center">
                    <span class="px-2 py-0.5 bg-green-900/40 border border-green-800 text-green-400 text-xs rounded-full font-semibold">${u.rounds_cleared} Rounds</span>
                </td>
            </tr>`).join('') || `<tr><td colspan="4" class="text-center py-10 text-slate-500">No users on the leaderboard yet. Be the first!</td></tr>`;

        // Podium markup
        let podiumHtml = '';
        if (lb.length >= 3) {
            const podiumItems = [1, 0, 2].map(i => {
                const u = lb[i];
                if (!u) return `<div></div>`;
                const heights = ['h-24', 'h-32', 'h-20'];
                const gradients = ['from-slate-400 to-slate-300', 'from-yellow-500 to-amber-400', 'from-amber-700 to-amber-600'];
                const podiumH = [heights[1], heights[0], heights[2]];
                return `
                <div class="flex flex-col items-center gap-2 flex-1">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br ${gradients[i]} flex items-center justify-center text-white font-black text-lg shadow-lg">${(u.username || 'U')[0].toUpperCase()}</div>
                    <p class="text-white font-bold text-sm truncate max-w-[80px]" title="${u.username}">${u.username}</p>
                    <p class="text-slate-400 text-xs font-semibold">${u.readiness_score.toFixed(1)}%</p>
                    <div class="${podiumH[i === 0 ? 1 : i === 1 ? 0 : 2]} w-full bg-gradient-to-t ${gradients[i]} rounded-t-lg flex items-end justify-center pb-2">
                        <span class="text-white text-xl font-black">${medalEmoji[i]}</span>
                    </div>
                </div>`;
            }).join('');
            podiumHtml = `<div class="grid grid-cols-3 gap-4 items-end max-w-lg mx-auto bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80">${podiumItems}</div>`;
        }

        // Chart markup
        let chartHtml = '';
        if (lb.length > 0) {
            chartHtml = `
            <div class="bg-slate-900 border border-slate-700 p-6 rounded-2xl">
                <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Top 5 Scores</h3>
                <div style="height:200px; position:relative;">
                    <canvas id="lb-chart"></canvas>
                </div>
            </div>`;
        }

        // Evaluate template
        container.innerHTML = renderTemplate('template-leaderboard', {
            podiumHtml,
            chartHtml,
            rows
        });

        // Initialize Chart.js bar chart for top 5
        if (lb.length > 0 && typeof Chart !== 'undefined') {
            const ctx = document.getElementById('lb-chart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: lb.slice(0, 5).map(u => u.username),
                    datasets: [{
                        label: 'Readiness Score',
                        data: lb.slice(0, 5).map(u => u.readiness_score),
                        backgroundColor: ['rgba(234,179,8,0.7)', 'rgba(148,163,184,0.7)', 'rgba(180,83,9,0.7)', 'rgba(99,102,241,0.5)', 'rgba(99,102,241,0.4)'],
                        borderColor: ['rgb(234,179,8)', 'rgb(148,163,184)', 'rgb(180,83,9)', 'rgb(99,102,241)', 'rgb(99,102,241)'],
                        borderWidth: 2,
                        borderRadius: 6,
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.parsed.y.toFixed(1)}%` } } },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', callback: v => v + '%' }, min: 0, max: 100 }
                    }
                }
            });
        }
    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-20">Error loading leaderboard: ${err.message}</p>`;
    }
}
