function renderAuth() {
    const container = document.getElementById('app-container');
    container.innerHTML = renderTemplate('template-auth');
}

async function handleAuth(action) {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('auth-error');
    errorEl.classList.add('hidden');
    if (!email || !password) { 
        errorEl.textContent = 'Email and password are required.'; 
        errorEl.classList.remove('hidden'); 
        return; 
    }

    try {
        const res = await fetch(`${API_BASE}/auth/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.error || 'Authentication failed');
        token = data.data.access_token;
        localStorage.setItem('access_token', token);
        renderApp();
    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
    }
}
