async function renderAdmin() {
    setActiveNav('admin');
    const container = document.getElementById('app-container');
    container.innerHTML = renderTemplate('template-admin');
    
    // Hide the main student sidebar when in the admin portal
    const mainSidebar = document.getElementById('sidebar');
    if (mainSidebar) mainSidebar.classList.add('hidden');
    
    await fetchAdminData();
}

function switchAdminTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-pane').forEach(el => el.classList.add('hidden'));
    
    // Deactivate all nav buttons
    document.querySelectorAll('.admin-tab').forEach(el => {
        el.classList.remove('active', 'bg-slate-800', 'text-white');
        el.classList.add('text-slate-400');
    });
    
    // Show selected tab
    document.getElementById(`admin-tab-${tabName}`).classList.remove('hidden');
    
    // Activate nav button
    const btn = document.querySelector(`button[onclick="switchAdminTab('${tabName}')"]`);
    if(btn) {
        btn.classList.add('active', 'bg-slate-800', 'text-white');
        btn.classList.remove('text-slate-400');
    }

    // Set Header Title
    const titles = {
        'dashboard': 'Test Rounds',
        'users': 'Registration Details',
        'certificates': 'Certificates',
        'structure': 'Question Structure'
    };
    document.getElementById('admin-header-title').innerText = titles[tabName] || 'Admin Portal';

    // Fetch relevant data if not loaded
    if(tabName === 'users') fetchUsers();
    else if(tabName === 'interviews') fetchInterviews();
    else if(tabName === 'questions') fetchQuestions();
    else if(tabName === 'companies') fetchCompanies();
    else if(tabName === 'certificates') fetchCertificates();
    else if(tabName === 'system') fetchSystemHealthAndLogs();
}

async function fetchAdminData() {
    try {
        const statsRes = await fetch(`${API_BASE}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (statsRes.ok) {
            const stats = await parseJSON(statsRes);
            const statsContainer = document.getElementById('admin-stats-container');
            if (statsContainer) {
                statsContainer.innerHTML = `
                    <div class="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <p class="text-slate-400 text-sm font-semibold">Total Users</p>
                            <p class="text-3xl font-bold text-white mt-1">${stats.total_users}</p>
                        </div>
                        <div class="p-3 bg-blue-900/30 text-blue-400 rounded-lg"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></div>
                    </div>
                    <div class="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <p class="text-slate-400 text-sm font-semibold">Total Sessions</p>
                            <p class="text-3xl font-bold text-white mt-1">${stats.total_sessions}</p>
                        </div>
                        <div class="p-3 bg-indigo-900/30 text-indigo-400 rounded-lg"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>
                    </div>
                    <div class="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <p class="text-slate-400 text-sm font-semibold">Active Sessions</p>
                            <p class="text-3xl font-bold text-emerald-400 mt-1">${stats.active_sessions}</p>
                        </div>
                        <div class="p-3 bg-emerald-900/30 text-emerald-400 rounded-lg"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg></div>
                    </div>
                    <div class="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <p class="text-slate-400 text-sm font-semibold">Rounds Cleared</p>
                            <p class="text-3xl font-bold text-amber-400 mt-1">${Math.round(stats.total_rounds_cleared)}</p>
                        </div>
                        <div class="p-3 bg-amber-900/30 text-amber-400 rounded-lg"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                    </div>
                `;
            }
        } else if (statsRes.status === 401 || statsRes.status === 403) {
            showToast('Security: You are not logged in with an Administrator account!', 'error');
            setTimeout(() => { logout(); }, 2000);
            return;
        }
    } catch (err) {
        console.error(err);
        showToast('Error loading dashboard stats', 'error');
    }
}

// User Management
async function fetchUsers() {
    try {
        const res = await fetch(`${API_BASE}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const data = await parseJSON(res);
            const tbody = document.getElementById('admin-users-tbody');
            if (data.users.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500">No users found.</td></tr>`;
                return;
            }
            tbody.innerHTML = data.users.map(u => `
                <tr class="hover:bg-slate-800/50 transition-colors cursor-pointer" onclick="viewUserModal(${u.id})">
                    <td class="px-6 py-4 flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                            ${(u.email || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                            <p class="font-medium text-white">${u.username || 'Anonymous'}</p>
                            <p class="text-xs text-slate-500">${u.email}</p>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        ${u.is_admin ? '<span class="px-2.5 py-1 bg-amber-900/30 text-amber-400 text-xs rounded-full font-semibold border border-amber-500/20">Admin</span>' : '<span class="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs rounded-full border border-slate-700">User</span>'}
                    </td>
                    <td class="px-6 py-4 text-center text-slate-300">${u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</td>
                    <td class="px-6 py-4 text-center text-slate-300">${(u.readiness_score || 0).toFixed(1)}</td>
                    <td class="px-6 py-4 text-center text-slate-300">${u.total_interviews}</td>
                    <td class="px-6 py-4 text-center"><button class="text-indigo-400 hover:text-indigo-300 text-sm font-medium">View</button></td>
                </tr>
            `).join('');
        }
    } catch (err) { console.error(err); }
}

async function viewUserModal(userId) {
    try {
        const res = await fetch(`${API_BASE}/admin/users/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if(res.ok){
            const data = await parseJSON(res);
            const user = data.user;
            document.getElementById('admin-modal-title').innerText = `Profile: ${user.username || 'Anonymous'}`;
            
            let html = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <h4 class="text-slate-400 text-xs uppercase tracking-wider mb-2">Account Info</h4>
                            <p class="text-white"><span class="text-slate-500 w-24 inline-block">Email:</span> ${user.email}</p>
                            <p class="text-white"><span class="text-slate-500 w-24 inline-block">Role:</span> ${user.is_admin ? 'Admin' : 'Student'}</p>
                            <p class="text-white"><span class="text-slate-500 w-24 inline-block">Joined:</span> ${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                            <p class="text-white"><span class="text-slate-500 w-24 inline-block">Last Login:</span> ${user.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}</p>
                        </div>
                        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <h4 class="text-slate-400 text-xs uppercase tracking-wider mb-2">Performance</h4>
                            <p class="text-white"><span class="text-slate-500 w-32 inline-block">Readiness Score:</span> ${user.readiness_score.toFixed(1)}/10</p>
                            <p class="text-white"><span class="text-slate-500 w-32 inline-block">Total Interviews:</span> ${user.total_interviews}</p>
                            <p class="text-white"><span class="text-slate-500 w-32 inline-block">Rounds Cleared:</span> ${user.rounds_cleared}</p>
                            <p class="text-white"><span class="text-slate-500 w-32 inline-block">DSA Solved:</span> ${user.dsa_problems_solved}</p>
                        </div>
                    </div>
                    <div>
                        <h4 class="text-white font-semibold mb-3">Interview Sessions (${user.sessions.length})</h4>
                        <div class="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                            ${user.sessions.length ? user.sessions.map(s => `
                                <div class="p-3 border-b border-slate-700 last:border-0 flex justify-between items-center text-sm">
                                    <div>
                                        <span class="text-white font-medium">Round ${s.current_round}</span>
                                        ${s.is_admin_test ? '<span class="ml-2 px-1.5 py-0.5 bg-indigo-900/50 text-indigo-400 text-[10px] rounded">Admin Test</span>' : ''}
                                    </div>
                                    <span class="${s.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}">${s.status}</span>
                                </div>
                            `).join('') : '<p class="p-4 text-slate-500 text-sm">No sessions found.</p>'}
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('admin-modal-body').innerHTML = html;
            
            const modal = document.getElementById('admin-modal');
            const content = document.getElementById('admin-modal-content');
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                content.classList.remove('scale-95');
            }, 10);
        }
    } catch (err) { console.error(err); }
}

function closeAdminModal() {
    const modal = document.getElementById('admin-modal');
    const content = document.getElementById('admin-modal-content');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

// Other fetches (stubs for UI population)
async function fetchInterviews() {
    try {
        const res = await fetch(`${API_BASE}/admin/interviews`, { headers: { 'Authorization': `Bearer ${token}` } });
        if(res.ok){
            const data = await parseJSON(res);
            document.getElementById('admin-interviews-tbody').innerHTML = data.interviews.map(i => `
                <tr class="border-b border-slate-800/50">
                    <td class="px-6 py-4 text-slate-400">#${i.id}</td>
                    <td class="px-6 py-4 text-white">${i.user_email}</td>
                    <td class="px-6 py-4 text-slate-300">${i.job_role || 'N/A'}</td>
                    <td class="px-6 py-4 text-center text-white font-medium">R${i.current_round}</td>
                    <td class="px-6 py-4 text-center">
                        <span class="px-2.5 py-1 text-xs rounded-full border ${i.status === 'in_progress' ? 'bg-amber-900/30 text-amber-400 border-amber-500/20' : 'bg-emerald-900/30 text-emerald-400 border-emerald-500/20'}">${i.status}</span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        ${i.is_admin_test ? '<span class="px-2 py-1 text-[10px] uppercase font-bold text-indigo-400 bg-indigo-900/30 rounded border border-indigo-500/20">TEST</span>' : '<span class="text-slate-500 text-xs">Real</span>'}
                    </td>
                </tr>
            `).join('');
        }
    } catch(err) { console.error(err); }
}

async function fetchQuestions() {
    try {
        const res = await fetch(`${API_BASE}/admin/questions`, { headers: { 'Authorization': `Bearer ${token}` } });
        if(res.ok) {
            const data = await parseJSON(res);
            const tbody = document.getElementById('admin-questions-tbody');
            if(data.questions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-500">No questions found.</td></tr>';
                return;
            }
            tbody.innerHTML = data.questions.map(q => `
                <tr class="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td class="px-6 py-4 text-white">${q.category} ${q.technology ? `<span class="text-xs text-slate-500">(${q.technology})</span>` : ''}</td>
                    <td class="px-6 py-4 text-slate-300 truncate max-w-xs" title="${q.question_text}">${q.question_text}</td>
                    <td class="px-6 py-4 text-center">
                        <span class="px-2.5 py-1 text-xs rounded-full border ${q.difficulty === 'Easy' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/20' : q.difficulty === 'Medium' ? 'bg-amber-900/30 text-amber-400 border-amber-500/20' : 'bg-red-900/30 text-red-400 border-red-500/20'}">${q.difficulty}</span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        ${q.is_active ? '<span class="text-emerald-400 text-xs">Active</span>' : '<span class="text-slate-500 text-xs">Inactive</span>'}
                    </td>
                </tr>
            `).join('');
        }
    } catch(err) { console.error(err); }
}

async function fetchCompanies() {
    try {
        const res = await fetch(`${API_BASE}/admin/companies`, { headers: { 'Authorization': `Bearer ${token}` } });
        if(res.ok) {
            const data = await parseJSON(res);
            const tbody = document.getElementById('admin-companies-tbody');
            if(data.companies.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-500">No companies found.</td></tr>';
                return;
            }
            tbody.innerHTML = data.companies.map(c => `
                <tr class="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td class="px-6 py-4 text-white font-medium">${c.name}</td>
                    <td class="px-6 py-4 text-center text-slate-300">${c.category || 'General'}</td>
                    <td class="px-6 py-4 text-center">
                        ${c.is_active ? '<span class="text-emerald-400 text-xs">Active</span>' : '<span class="text-slate-500 text-xs">Inactive</span>'}
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button class="text-indigo-400 hover:text-indigo-300 text-sm font-medium">Edit</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch(err) { console.error(err); }
}

async function fetchCertificates() {
    try {
        const res = await fetch(`${API_BASE}/admin/certificates`, { headers: { 'Authorization': `Bearer ${token}` } });
        if(res.ok) {
            const data = await parseJSON(res);
            const tbody = document.getElementById('admin-certificates-tbody');
            if(data.certificates.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500">No certificates issued yet.</td></tr>';
                return;
            }
            tbody.innerHTML = data.certificates.map(c => `
                <tr class="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td class="px-6 py-4 text-slate-400 text-xs font-mono">${c.id.substring(0,8)}...</td>
                    <td class="px-6 py-4">
                        <p class="font-medium text-white">${c.candidate_name}</p>
                        <p class="text-xs text-slate-500">${c.email}</p>
                    </td>
                    <td class="px-6 py-4 text-center text-slate-300">${c.type}</td>
                    <td class="px-6 py-4 text-center text-white font-bold">${parseFloat(c.score).toFixed(1)}%</td>
                    <td class="px-6 py-4 text-center text-slate-400 text-sm">${new Date(c.issue_date).toLocaleDateString()}</td>
                    <td class="px-6 py-4 text-center">
                        <button class="text-indigo-400 hover:text-indigo-300 text-sm font-medium">View</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch(err) { console.error(err); }
}

async function fetchSystemHealthAndLogs() {
    try {
        const healthRes = await fetch(`${API_BASE}/admin/health`, { headers: { 'Authorization': `Bearer ${token}` } });
        if(healthRes.ok) {
            const h = await parseJSON(healthRes);
            document.getElementById('admin-health-container').innerHTML = `
                <div class="bg-slate-900 border ${h.backend === 'HEALTHY' ? 'border-emerald-500/30' : 'border-red-500/30'} p-4 rounded-xl flex items-center gap-4">
                    <div class="p-3 ${h.backend === 'HEALTHY' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'} rounded-lg">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path></svg>
                    </div>
                    <div><p class="text-slate-400 text-sm">Flask Backend</p><p class="text-xl font-bold text-white">${h.backend}</p></div>
                </div>
                <div class="bg-slate-900 border ${h.database === 'HEALTHY' ? 'border-emerald-500/30' : 'border-red-500/30'} p-4 rounded-xl flex items-center gap-4">
                    <div class="p-3 ${h.database === 'HEALTHY' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'} rounded-lg">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
                    </div>
                    <div><p class="text-slate-400 text-sm">SQLite Database</p><p class="text-xl font-bold text-white">${h.database}</p></div>
                </div>
                <div class="bg-slate-900 border ${h.ai_api === 'HEALTHY' ? 'border-emerald-500/30' : 'border-red-500/30'} p-4 rounded-xl flex items-center gap-4">
                    <div class="p-3 ${h.ai_api === 'HEALTHY' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'} rounded-lg">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <div><p class="text-slate-400 text-sm">Gemini AI Service</p><p class="text-xl font-bold text-white">${h.ai_api}</p></div>
                </div>
            `;
        }
        
        const logsRes = await fetch(`${API_BASE}/admin/logs`, { headers: { 'Authorization': `Bearer ${token}` } });
        if(logsRes.ok){
            const data = await parseJSON(logsRes);
            const tbody = document.getElementById('admin-logs-tbody');
            if(data.logs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-500">No logs found.</td></tr>`;
            } else {
                tbody.innerHTML = data.logs.map(l => `
                    <tr>
                        <td class="px-6 py-3 text-slate-400 text-xs">${new Date(l.timestamp).toLocaleString()}</td>
                        <td class="px-6 py-3 text-white text-xs">${l.admin_email}</td>
                        <td class="px-6 py-3 text-emerald-400 text-xs font-semibold">${l.action}</td>
                        <td class="px-6 py-3 text-slate-300 text-xs">${l.target || '-'}</td>
                    </tr>
                `).join('');
            }
        }
    } catch(err) { console.error(err); }
}

async function bypassToRound(roundNumber) {
    if (!confirm(`QA TEST MODE: Start Round ${roundNumber}? This session is isolated and will not affect real analytics.`)) return;
    try {
        const res = await fetch(`${API_BASE}/admin/bypass-round`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ round: roundNumber })
        });
        if (res.ok) {
            const data = await parseJSON(res);
            showToast(`Started QA Test for Round ${roundNumber}`, 'success');
            
            if (typeof getInterviewStage === 'function') {
                currentSessionId = data.session_id;
                const stage = getInterviewStage();
                stage.innerHTML = `<div class="flex items-center gap-4 py-4"><div class="loader"></div><p class="text-slate-400 animate-pulse">Initializing round ${data.round}...</p></div>`;
                
                if (data.round === 1) {
                    startAptitudeRound();
                } else {
                    renderQuestion(data.round);
                }
            } else { 
                renderDashboard(); 
            }
        } else {
            const data = await parseJSON(res);
            if (res.status === 401 || res.status === 403) {
                showToast('Security: You are not logged in with an Administrator account!', 'error');
                setTimeout(() => { logout(); }, 2000);
            } else {
                showToast(data.error || 'Failed to start test round', 'error');
            }
        }
    } catch (err) {
        showToast('Error bypassing round', 'error');
    }
}
