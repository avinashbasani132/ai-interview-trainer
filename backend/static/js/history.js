async function renderHistory() {
    setActiveNav('history');
    showLoader();
    const container = document.getElementById('app-container');
    try {
        const res = await fetch(`${API_BASE}/user/history`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load history');
        const data = await parseJSON(res);
        let history = data.history || [];

        const rows = history.length > 0 ? history.map(item => `
            <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                <td class="p-4"><span class="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-full">${item.round_type}</span></td>
                <td class="p-4">
                    <div class="flex items-center gap-2">
                        <div class="w-16 bg-slate-800 rounded-full h-1.5">
                            <div class="h-1.5 rounded-full ${item.score >= 70 ? 'bg-green-500' : 'bg-red-500'}" style="width:${Math.min(100,item.score)}%"></div>
                        </div>
                        <span class="font-bold text-sm ${item.score >= 70 ? 'text-green-400' : 'text-red-400'}">${item.score.toFixed(0)}</span>
                    </div>
                </td>
                <td class="p-4 text-slate-400 text-sm">${new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td class="p-4">
                    <span class="px-2 py-0.5 rounded-full text-xs font-bold ${item.status === 'Pass' ? 'bg-green-900/60 text-green-400 border border-green-800' : 'bg-red-900/60 text-red-400 border border-red-800'}">
                        ${item.status === 'Pass' ? '✔ Pass' : '✘ Fail'}
                    </span>
                </td>
                <td class="p-4 text-slate-400 text-sm italic max-w-xs" title="${item.feedback_summary}">${item.feedback_summary?.length > 80 ? item.feedback_summary.slice(0, 80) + '...' : item.feedback_summary}</td>
            </tr>`) .join('') :
            `<tr><td colspan="5" class="p-10 text-center text-slate-500">No interview history yet. Start your first round!</td></tr>`;

        // Render template with context
        container.innerHTML = renderTemplate('template-history', { rows });

        // Store data for filtering
        window._historyData = history;
    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-20">Error: ${err.message}</p>`;
    }
}

function filterHistory() {
    const filter = document.getElementById('filterRound').value;
    const data = (window._historyData || []).filter(i => filter === 'all' || i.round_type.includes(filter));
    const tbody = document.getElementById('history-tbody');
    if (!tbody) return;
    tbody.innerHTML = data.length > 0 ? data.map(item => `
        <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
            <td class="p-4"><span class="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-full">${item.round_type}</span></td>
            <td class="p-4">
                <div class="flex items-center gap-2">
                    <div class="w-16 bg-slate-800 rounded-full h-1.5"><div class="h-1.5 rounded-full ${item.score >= 70 ? 'bg-green-500' : 'bg-red-500'}" style="width:${Math.min(100,item.score)}%"></div></div>
                    <span class="font-bold text-sm ${item.score >= 70 ? 'text-green-400' : 'text-red-400'}">${item.score.toFixed(0)}</span>
                </div>
            </td>
            <td class="p-4 text-slate-400 text-sm">${new Date(item.date).toLocaleDateString()}</td>
            <td class="p-4"><span class="px-2 py-0.5 rounded-full text-xs font-bold ${item.status === 'Pass' ? 'bg-green-900/60 text-green-400 border border-green-800' : 'bg-red-900/60 text-red-400 border border-red-800'}">${item.status === 'Pass' ? '✔ Pass' : '✘ Fail'}</span></td>
            <td class="p-4 text-slate-400 text-sm italic">${item.feedback_summary?.slice(0, 80) || '—'}</td>
        </tr>`).join('') : `<tr><td colspan="5" class="p-8 text-center text-slate-500">No results for this filter.</td></tr>`;
}
