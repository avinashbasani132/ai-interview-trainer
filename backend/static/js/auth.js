function renderAuth() {
    const container = document.getElementById('app-container');
    container.innerHTML = renderTemplate('template-auth');
}

async function handleAuth(action, isAdminLogin = false) {
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
        
        // Check if admin login is valid
        if (isAdminLogin && action === 'login' && !data.data.is_admin) {
            throw new Error('Access denied: You do not have administrator privileges.');
        }
        
        token = data.data.access_token;
        localStorage.setItem('access_token', token);
        
        // Push state so renderApp routes correctly based on URL
        if (data.data.is_admin) {
            window.history.pushState({}, '', '/admin');
        } else {
            window.history.pushState({}, '', '/dashboard');
        }
        
        renderApp();
    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
    }
}
