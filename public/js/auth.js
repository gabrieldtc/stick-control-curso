// ============ AUTH JS ============

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotForm = document.getElementById('forgot-form');
const authFooter = document.getElementById('auth-footer');
const alertBox = document.getElementById('alert-box');

let isLoginMode = true;
let forgotEmail = '';

// Check if already logged in - redirect based on progress
const token = localStorage.getItem('token');
if (token) {
  const introCompleted = localStorage.getItem('introCompleted');
  const lastChapter = localStorage.getItem('lastChapter');
  
  if (introCompleted && lastChapter) {
    window.location.href = '/curso?cap=' + lastChapter;
  } else if (introCompleted) {
    window.location.href = '/dashboard';
  } else {
    window.location.href = '/intro';
  }
}

// Toggle between login and register (event delegation)
document.getElementById('toggle-text').addEventListener('click', (e) => {
  if (e.target.id === 'toggle-auth') {
    e.preventDefault();
    if (isLoginMode) {
      showForm('register');
    } else {
      showForm('login');
    }
  }
});

// Show alert
function showAlert(message, type = 'error') {
  alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

// Clear alert
function clearAlert() {
  alertBox.innerHTML = '';
}

// Show specific form
function showForm(form) {
  clearAlert();
  loginForm.style.display = 'none';
  registerForm.style.display = 'none';
  forgotForm.style.display = 'none';
  authFooter.style.display = 'block';
  
  if (form === 'login') {
    isLoginMode = true;
    loginForm.style.display = 'block';
    document.getElementById('toggle-text').innerHTML = 'Não tem conta? <a href="#" id="toggle-auth">Cadastre-se</a>';
  } else if (form === 'register') {
    isLoginMode = false;
    registerForm.style.display = 'block';
    document.getElementById('toggle-text').innerHTML = 'Já tem conta? <a href="#" id="toggle-auth">Entrar</a>';
  } else if (form === 'forgot') {
    forgotForm.style.display = 'block';
    authFooter.style.display = 'none';
    document.getElementById('forgot-step-1').style.display = 'block';
    document.getElementById('forgot-step-2').style.display = 'none';
    document.getElementById('forgot-step-3').style.display = 'none';
  }
}

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showAlert(data.error || 'Erro ao fazer login');
      return;
    }
    
    // Save token and user
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirect based on progress
    const introCompleted = localStorage.getItem('introCompleted');
    const lastChapter = localStorage.getItem('lastChapter');
    
    if (introCompleted && lastChapter) {
      window.location.href = '/curso?cap=' + lastChapter;
    } else if (introCompleted) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/intro';
    }
    
  } catch (error) {
    showAlert('Erro de conexão. Tente novamente.');
  }
});

// Register
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();
  
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirm = document.getElementById('register-confirm').value;
  const secretQuestion = document.getElementById('register-secret-question').value;
  const secretAnswer = document.getElementById('register-secret-answer').value;
  
  // Validate passwords match
  if (password !== confirm) {
    showAlert('As senhas não coincidem');
    return;
  }
  
  if (!secretQuestion) {
    showAlert('Selecione uma pergunta secreta');
    return;
  }
  
  if (!secretAnswer) {
    showAlert('Digite sua resposta secreta');
    return;
  }
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, secretQuestion, secretAnswer })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showAlert(data.error || 'Erro ao criar conta');
      return;
    }
    
    // Save token and user
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirect to intro for new users
    window.location.href = '/intro';
    
  } catch (error) {
    showAlert('Erro de conexão. Tente novamente.');
  }
});

// Forgot password - link click
document.getElementById('forgot-password-link').addEventListener('click', (e) => {
  e.preventDefault();
  showForm('forgot');
});

// Forgot password - step 1: get secret question
document.getElementById('forgot-step-1').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();
  
  forgotEmail = document.getElementById('forgot-email').value;
  
  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showAlert(data.error || 'Erro ao buscar pergunta secreta');
      return;
    }
    
    document.getElementById('forgot-question-text').textContent = data.secretQuestion;
    document.getElementById('forgot-step-1').style.display = 'none';
    document.getElementById('forgot-step-2').style.display = 'block';
    
  } catch (error) {
    showAlert('Erro de conexão. Tente novamente.');
  }
});

// Forgot password - step 2: verify secret answer
document.getElementById('forgot-step-2').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();
  
  const secretAnswer = document.getElementById('forgot-answer').value;
  
  // Show step 3 (new password)
  // We verify when resetting the password
  document.getElementById('forgot-step-2').style.display = 'none';
  document.getElementById('forgot-step-3').style.display = 'block';
  document.getElementById('forgot-step-3').dataset.secretAnswer = secretAnswer;
});

// Forgot password - step 3: reset password
document.getElementById('forgot-step-3').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();
  
  const secretAnswer = document.getElementById('forgot-step-3').dataset.secretAnswer;
  const newPassword = document.getElementById('forgot-new-password').value;
  const confirmPassword = document.getElementById('forgot-confirm-password').value;
  
  if (newPassword !== confirmPassword) {
    showAlert('As senhas não coincidem');
    return;
  }
  
  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail, secretAnswer, newPassword })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showAlert(data.error || 'Erro ao redefinir senha');
      return;
    }
    
    // Save token and user
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    showAlert('Senha redefinida com sucesso! Redirecionando...', 'success');
    
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1500);
    
  } catch (error) {
    showAlert('Erro de conexão. Tente novamente.');
  }
});
