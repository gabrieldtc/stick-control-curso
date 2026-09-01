// ============ AUTHENTICATION ============

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se está logado
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname;
    
    if (!token && !isAuthPage(currentPage)) {
        // Se não tem token e não está em página de auth, redireciona
        location.href = '/';
    } else if (token && currentPage === '/') {
        // Se tem token e está na página inicial, vai para intro
        location.href = '/intro';
    }
    
    // Setup de event listeners
    setupAuthForms();
});

function isAuthPage(path) {
    return path === '/' || path === '/index.html';
}

function setupAuthForms() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    
    errorDiv.textContent = '';
    
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || 'Erro ao fazer login');
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        location.href = '/intro';
    } catch (error) {
        errorDiv.textContent = '❌ ' + error.message;
        console.error('Login error:', error);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;
    const errorDiv = document.getElementById('signup-error');
    
    errorDiv.textContent = '';
    
    if (password !== passwordConfirm) {
        errorDiv.textContent = '❌ As senhas não conferem';
        return;
    }
    
    try {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || 'Erro ao criar conta');
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        location.href = '/intro';
    } catch (error) {
        errorDiv.textContent = '❌ ' + error.message;
        console.error('Signup error:', error);
    }
}

function togglePage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function goToPage(pageId) {
    const page = document.getElementById(pageId);
    if (page) {
        togglePage(pageId);
    }
}

function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        location.href = '/';
    }
}

// ============ API HELPERS ============

async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(endpoint, {
        ...options,
        headers
    });
    
    if (response.status === 401) {
        localStorage.removeItem('token');
        location.href = '/';
        throw new Error('Sessão expirada');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Erro na requisição');
    }
    
    return data;
}

// ============ UTILITY FUNCTIONS ============

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// ============ ACHIEVEMENTS CONSTANTS ============

const ACHIEVEMENTS = [
    // Progresso
    { id: 'first_chapter', name: '🎵 Primeiro Passo', description: 'Complete o 1º capítulo', icon: '🎵' },
    { id: 'five_chapters', name: '📈 Cinco Capítulos', description: 'Complete 5 capítulos', icon: '📈' },
    { id: 'ten_chapters', name: '📚 Dez Capítulos', description: 'Complete 10 capítulos', icon: '📚' },
    { id: 'twenty_chapters', name: '📖 Vinte Capítulos', description: 'Complete 20 capítulos', icon: '📖' },
    { id: 'thirty_chapters', name: '📕 Trinta Capítulos', description: 'Complete 30 capítulos', icon: '📕' },
    { id: 'forty_chapters', name: '📗 Quarenta Capítulos', description: 'Complete 40 capítulos', icon: '📗' },
    { id: 'fifty_chapters', name: '📙 Cinquenta Capítulos', description: 'Complete 50 capítulos', icon: '📙' },
    
    // Preparação
    { id: 'all_prep', name: '🎓 Mestre da Preparação', description: 'Complete todos os capítulos de preparação', icon: '🎓' },
    { id: 'first_prep', name: '🌟 Primeira Preparação', description: 'Complete o 1º capítulo de preparação', icon: '🌟' },
    
    // Principal
    { id: 'all_main', name: '🏆 Mestre do Groove', description: 'Complete todos os capítulos principais', icon: '🏆' },
    { id: 'chapter_0', name: '🥇 Início Lendário', description: 'Complete o capítulo 0', icon: '🥇' },
    { id: 'chapter_56', name: '⭐ Midway Star', description: 'Complete o capítulo 56', icon: '⭐' },
    
    // Velocidade
    { id: 'bpm_60', name: '⚡ Primeira Velocidade', description: 'Atinja 60 BPM', icon: '⚡' },
    { id: 'bpm_100', name: '🔥 Turbo', description: 'Atinja 100 BPM', icon: '🔥' },
    { id: 'bpm_150', name: '💨 Supersônico', description: 'Atinja 150 BPM', icon: '💨' },
    { id: 'bpm_180', name: '🚀 Hipersônico', description: 'Atinja 180 BPM', icon: '🚀' },
    { id: 'bpm_200', name: '⚙️ Monstruoso', description: 'Atinja 200 BPM', icon: '⚙️' },
    
    // Sequência
    { id: 'streak_1', name: '✅ Primeira Sequência', description: 'Pratique 1 dia seguido', icon: '✅' },
    { id: 'streak_3', name: '✔️ Três Dias', description: 'Pratique 3 dias seguidos', icon: '✔️' },
    { id: 'streak_7', name: '🔗 Uma Semana', description: 'Pratique 7 dias seguidos', icon: '🔗' },
    { id: 'streak_14', name: '⛓️ Duas Semanas', description: 'Pratique 14 dias seguidos', icon: '⛓️' },
    { id: 'streak_30', name: '📅 Um Mês', description: 'Pratique 30 dias seguidos', icon: '📅' },
    
    // Dedicação
    { id: 'practice_15m', name: '⏱️ Aquecimento', description: 'Pratique 15 minutos', icon: '⏱️' },
    { id: 'practice_1h', name: '⏳ Uma Hora', description: 'Pratique 1 hora', icon: '⏳' },
    { id: 'practice_5h', name: '🎯 Cinco Horas', description: 'Pratique 5 horas', icon: '🎯' },
    { id: 'practice_10h', name: '💪 Dez Horas', description: 'Pratique 10 horas', icon: '💪' },
    { id: 'practice_50h', name: '🦾 Cinquenta Horas', description: 'Pratique 50 horas', icon: '🦾' },
    { id: 'practice_100h', name: '👑 Cem Horas', description: 'Pratique 100 horas', icon: '👑' },
    { id: 'practice_200h', name: '💎 Duzentas Horas', description: 'Pratique 200 horas', icon: '💎' },
    
    // Testes
    { id: 'first_test', name: '📋 Primeiro Teste', description: 'Complete 1 teste', icon: '📋' },
    { id: 'five_tests', name: '📑 Cinco Testes', description: 'Complete 5 testes', icon: '📑' },
    { id: 'fifteen_tests', name: '📄 Quinze Testes', description: 'Complete 15 testes', icon: '📄' },
    { id: 'twentyfive_tests', name: '📃 Vinte e Cinco Testes', description: 'Complete 25 testes', icon: '📃' },
    { id: 'thirtyfive_tests', name: '🗒️ Trinta e Cinco Testes', description: 'Complete 35 testes', icon: '🗒️' },
    { id: 'all_tests', name: '🎖️ Mestre dos Testes', description: 'Complete todos os testes', icon: '🎖️' },
    
    // Ritmos
    { id: 'rhythm_3', name: '🎵 Três Ritmos', description: 'Complete 3 ritmos', icon: '🎵' },
    { id: 'rhythm_6', name: '🎶 Seis Ritmos', description: 'Complete 6 ritmos', icon: '🎶' },
    { id: 'rhythm_all', name: '🎼 Todos os Ritmos', description: 'Complete todos os ritmos', icon: '🎼' },
    { id: 'rhythm_tests', name: '🎹 Ritmos Mestres', description: 'Teste todos os ritmos', icon: '🎹' }
];

// ============ PAGE-SPECIFIC LOGIC ============

// Atualizar nome do usuário no dashboard
document.addEventListener('DOMContentLoaded', function() {
    const user = getCurrentUser();
    if (user) {
        const nameElements = document.querySelectorAll('#dashboard-name, .user-name');
        nameElements.forEach(el => {
            if (el) el.textContent = user.name;
        });
    }
});

console.log('✅ App.js carregado com sucesso');
