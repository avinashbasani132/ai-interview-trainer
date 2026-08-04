async function renderCommunity() {
    setActiveNav('community');
    showLoader();
    const container = document.getElementById('app-container');
    try {
        const res = await fetch(`${API_BASE}/community/posts`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load community');
        const data = await parseJSON(res);
        const posts = data.posts || [];

        const postCardsHtml = posts.map(p => `
            <div class="bg-slate-900 border border-slate-700 hover:border-slate-600 p-5 rounded-xl transition-all shadow-md">
                <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">${(p.author || 'U')[0].toUpperCase()}</div>
                        <div>
                            <p class="text-slate-200 font-semibold text-sm">${p.author}</p>
                            <p class="text-slate-500 text-xs">${new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                    </div>
                    <span class="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 font-semibold">${p.replies_count} replies</span>
                </div>
                <h3 class="text-white font-bold mb-2 text-base">${p.title}</h3>
                <p class="text-slate-400 text-sm leading-relaxed mb-4">${p.content.length > 200 ? p.content.slice(0, 200) + '...' : p.content}</p>
                <div class="flex items-center gap-4">
                    <button class="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-350 text-xs font-bold transition-colors"
                        onclick="toggleReplies(${p.id})">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                        View & Reply
                    </button>
                    <span class="text-slate-500 text-xs">👍 ${p.upvotes || 0}</span>
                </div>
                
                <!-- Replies list container -->
                <div id="replies-${p.id}" class="hidden mt-4 border-t border-slate-800/80 pt-4 space-y-3">
                </div>
                
                <!-- Reply submit form container -->
                <div id="reply-form-${p.id}" class="hidden mt-3 flex gap-2">
                    <input id="reply-input-${p.id}" type="text" placeholder="Write a reply..."
                        class="flex-1 bg-slate-800 border border-slate-700 text-white p-2.5 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500">
                    <button onclick="submitReply(${p.id})" class="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow">Reply</button>
                </div>
            </div>`).join('') || `
            <div class="col-span-full text-center py-16 text-slate-500">
                <div class="text-5xl mb-4">💬</div>
                <p class="font-semibold text-slate-400">No posts yet.</p>
                <p class="text-sm">Be the first to share your interview experience!</p>
            </div>`;

        container.innerHTML = renderTemplate('template-community', { postCardsHtml });
    } catch (err) {
        container.innerHTML = `<p class="text-red-400 text-center mt-20">Error loading community: ${err.message}</p>`;
    }
}

function openCreatePostModal() {
    const modal = document.getElementById('create-post-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeCreatePostModal() {
    const modal = document.getElementById('create-post-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

async function submitPost() {
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    if (!title || !content) { showToast('Title and content are required.', 'warning'); return; }
    try {
        const res = await fetch(`${API_BASE}/community/post`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ title, content })
        });
        if (!res.ok) throw new Error('Failed to create post');
        closeCreatePostModal();
        renderCommunity();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function toggleReplies(postId) {
    const repliesDiv = document.getElementById(`replies-${postId}`);
    const formDiv = document.getElementById(`reply-form-${postId}`);
    if (!repliesDiv || !formDiv) return;

    if (!repliesDiv.classList.contains('hidden')) {
        repliesDiv.classList.add('hidden');
        formDiv.classList.add('hidden');
        return;
    }

    repliesDiv.classList.remove('hidden');
    formDiv.classList.remove('hidden');
    repliesDiv.innerHTML = `<p class="text-slate-500 text-xs animate-pulse">Loading replies...</p>`;

    try {
        const res = await fetch(`${API_BASE}/community/posts/${postId}/replies`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Could not load replies');
        const data = await parseJSON(res);
        const replies = data.replies || [];

        if (replies.length === 0) {
            repliesDiv.innerHTML = `<p class="text-slate-500 text-xs italic">No replies yet. Start the conversation!</p>`;
            return;
        }

        repliesDiv.innerHTML = replies.map(r => `
            <div class="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-start gap-3">
                <div class="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">${(r.author || 'U')[0].toUpperCase()}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-slate-300 text-xs font-bold">${r.author}</span>
                        <span class="text-[10px] text-slate-500">${new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p class="text-slate-400 text-xs leading-relaxed">${r.content}</p>
                </div>
            </div>`).join('');
    } catch (err) {
        repliesDiv.innerHTML = `<p class="text-red-400 text-xs">Error: ${err.message}</p>`;
    }
}

async function submitReply(postId) {
    const input = document.getElementById(`reply-input-${postId}`);
    const content = input ? input.value.trim() : '';
    if (!content) { showToast('Reply cannot be empty.', 'warning'); return; }

    try {
        const res = await fetch(`${API_BASE}/community/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ post_id: postId, content })
        });
        if (!res.ok) throw new Error('Failed to post reply');
        if (input) input.value = '';
        showToast('Reply posted!', 'success');
        // Refresh replies list
        toggleReplies(postId);
        // Force refresh replies list (it was visible, so toggleReplies hid it. Call again to show & reload)
        toggleReplies(postId);
    } catch (err) {
        showToast(err.message, 'error');
    }
}
