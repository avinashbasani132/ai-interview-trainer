async function renderCertificates() {
    setActiveNav('certificates');
    showLoader();
    const container = document.getElementById('app-container');
    try {
        const res = await fetch(`${API_BASE}/certificate/my-certificates`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 422) { logout(); return; }
        if (!res.ok) throw new Error('Failed to load certificates data');
        const data = await parseJSON(res);
        const certs = data.certificates || [];

        let contentHtml = '';
        if (certs.length === 0) {
            contentHtml = `
            <div class="bg-slate-900 border border-slate-700/60 rounded-2xl p-12 text-center max-w-xl mx-auto mt-10">
                <span class="text-5xl">📜</span>
                <h3 class="text-xl font-bold text-white mt-4">No Certificates Earned Yet</h3>
                <p class="text-slate-400 text-sm mt-2 max-w-md mx-auto">
                    Complete either a Full Career Path Assessment (4 Rounds) or a Resume-Based Dynamic Interview with an overall score of 70% or higher to receive your official certificate!
                </p>
                <button onclick="renderRounds()" class="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/20">
                    Start Assessment
                </button>
            </div>`;
        } else {
            const cardsHtml = certs.map(c => {
                const dateStr = new Date(c.issue_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                return `
                <div class="bg-slate-900 border border-slate-700/85 rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all hover:scale-[1.02] hover:border-indigo-500/50">
                    <!-- Certificate Miniature Graphic -->
                    <div class="relative w-full aspect-[1.414/1] bg-slate-950 border-2 border-indigo-900 rounded-lg p-4 flex flex-col justify-between text-center overflow-hidden mb-5">
                        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06),transparent)]"></div>
                        <div class="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">AI Interview Trainer</div>
                        <div class="space-y-1">
                            <div class="text-[9px] font-serif text-amber-500 uppercase tracking-wider">Certificate of Achievement</div>
                            <div class="text-[6px] text-slate-400">is proudly presented to the candidate for completing</div>
                            <div class="text-[8px] font-bold text-slate-200">${c.interview_type}</div>
                        </div>
                        <div class="flex justify-between items-center text-[5px] text-slate-500 border-t border-slate-800/80 pt-2 px-1">
                            <div>ID: ${c.id}</div>
                            <div class="text-amber-400 font-bold">Score: ${c.overall_score}%</div>
                            <div>Date: ${dateStr}</div>
                        </div>
                    </div>

                    <!-- Info details -->
                    <div class="space-y-3">
                        <div class="flex justify-between items-start">
                            <div>
                                <span class="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800/50 rounded-full text-[10px] font-bold uppercase tracking-wider">${c.interview_type}</span>
                                <h3 class="font-extrabold text-white text-lg mt-2 font-mono">${c.id}</h3>
                            </div>
                            <div class="text-right">
                                <p class="text-2xl font-black text-amber-400">${c.overall_score}%</p>
                                <p class="text-slate-500 text-[10px] uppercase font-bold">Score Obtained</p>
                            </div>
                        </div>
                        <div class="text-xs text-slate-400 space-y-1">
                            <p><b>Issue Date:</b> ${dateStr}</p>
                        </div>
                    </div>

                    <!-- Action Grid -->
                    <div class="grid grid-cols-2 gap-2 mt-6">
                        <button onclick="downloadCertPdf('${c.id}', '${c.pdf_filename}')" class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md">
                            📥 Download PDF
                        </button>
                        <button onclick="window.open('/verify-certificate/${c.id}', '_blank')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/50 font-semibold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5">
                            🔍 Verify Publicly
                        </button>
                        <button onclick="shareCertLinkedIn('${c.id}')" class="col-span-1 bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-700 hover:border-indigo-800 font-semibold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1">
                            🔗 LinkedIn Share
                        </button>
                        <button onclick="shareCertEmail('${c.id}')" class="col-span-1 bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-700 hover:border-indigo-800 font-semibold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1">
                            ✉ Email Share
                        </button>
                    </div>
                </div>`;
            }).join('');
            contentHtml = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${cardsHtml}</div>`;
        }

        container.innerHTML = renderTemplate('template-certificate', { contentHtml });

    } catch (err) {
        showToast(err.message, 'error');
        renderDashboard();
    }
}

async function claimCertificate(interviewId, type) {
    showToast('Initializing certificate compilation...', 'info');
    try {
        const res = await fetch(`${API_BASE}/certificate/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ interview_id: Number(interviewId), interview_type: type })
        });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || 'Failed to claim certificate');
        showToast('Certificate successfully compiled and generated!', 'success');
        renderCertificates();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function downloadCertPdf(certId, filename) {
    showToast('Preparing download payload...', 'info');
    try {
        const res = await fetch(`${API_BASE}/certificate/download/${certId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('PDF retrieval failed.');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `AI_Interview_Certificate_${certId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('Download complete!', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function shareCertLinkedIn(certId) {
    const verifyUrl = `${window.location.origin}/verify-certificate/${certId}`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`;
    window.open(url, '_blank');
}

function shareCertEmail(certId) {
    const verifyUrl = `${window.location.origin}/verify-certificate/${certId}`;
    const subject = encodeURIComponent("AI Interview Assessment Certificate Earned!");
    const body = encodeURIComponent(`Hi there,\n\nI have successfully completed my AI Interview Trainer assessment and wanted to share my verified certificate of achievement!\n\nVerify certificate credentials here:\n${verifyUrl}\n\nBest regards`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
}
