class LoginSystem {
    constructor() {
        // Usar rutas relativas en lugar de absolutas
        this.redirectUrl = this.getRelativePath('../Prototipo/Prototipo.html');
        this.init();
    }

    init() {
        if (!this.requiredElementsExist()) {
            console.error('Elementos requeridos del login no encontrados');
            return;
        }
        this.bindEvents();
        this.checkRememberMe();
    }

    requiredElementsExist() {
        const requiredIds = ['loginForm', 'username', 'password'];
        return requiredIds.every(id => document.getElementById(id));
    }

    getRelativePath(targetFile) {
        // Obtener la ruta actual del archivo HTML
        const currentPath = window.location.pathname;
        const currentDirectory = currentPath.substring(0, currentPath.lastIndexOf('/'));
        
        // Si estamos en la raíz, usar la ruta directa
        if (currentDirectory === '../Prototipo/Prototipo.html') {
            return targetFile;
        }
        
        // Construir ruta relativa basada en la estructura de carpetas
        return `${currentDirectory}/${targetFile}`;
    }

    bindEvents() {
        // Form submission
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // Validación en tiempo real
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        usernameInput.addEventListener('input', () => this.validateUsername());
        passwordInput.addEventListener('input', () => this.validatePassword());
    }

    handleLogin(e) {
        e.preventDefault();
        
        if (this.validateForm()) {
            this.showLoading(true);
            
            // Simular proceso de login
            setTimeout(() => {
                this.showLoading(false);
                
                // Verificar credenciales
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                if (this.authenticateUser(username, password)) {
                    this.showMessage('¡Login exitoso! Redirigiendo al dashboard...', 'success');
                    
                    // Guardar estado de sesión
                    this.saveSession();
                    
                    // Redirigir al dashboard después de éxito
                    setTimeout(() => {
                        console.log('Redirigiendo a:', this.redirectUrl);
                        window.location.href = this.redirectUrl;
                    }, 1500);
                } else {
                    this.showMessage('Credenciales incorrectas. Use: admin / password', 'error');
                }
                
            }, 1500);
        }
    }

    authenticateUser(username, password) {
        // Credenciales predeterminadas según tu HTML
        return username === 'admin' && password === 'password';
    }

    validateForm() {
        const isUsernameValid = this.validateUsername();
        const isPasswordValid = this.validatePassword();
        
        return isUsernameValid && isPasswordValid;
    }

    validateUsername() {
        const usernameInput = document.getElementById('username');
        const username = usernameInput.value.trim();
        
        if (!username) {
            usernameInput.classList.add('error');
            return false;
        }
        
        usernameInput.classList.remove('error');
        return true;
    }

    validatePassword() {
        const passwordInput = document.getElementById('password');
        const password = passwordInput.value;
        
        if (!password) {
            passwordInput.classList.add('error');
            return false;
        }
        
        passwordInput.classList.remove('error');
        return true;
    }

    showLoading(show) {
        const loginBtn = document.querySelector('.btn-login');
        if (!loginBtn) return;
        
        if (show) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';
            loginBtn.classList.add('loading');
        } else {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingresar al Sistema';
            loginBtn.classList.remove('loading');
        }
    }

    showMessage(message, type) {
        // Crear contenedor de mensajes si no existe
        let messageContainer = document.getElementById('messageContainer');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'messageContainer';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                max-width: 300px;
            `;
            document.body.appendChild(messageContainer);
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            animation: slideIn 0.3s ease;
            ${type === 'success' ? 'background: #28a745;' : 'background: #dc3545;'}
        `;
        
        messageContainer.appendChild(messageEl);
        
        // Auto-remove después de 4 segundos
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => messageEl.remove(), 300);
            }
        }, 4000);
    }

    saveSession() {
        // Guardar estado de sesión en localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', document.getElementById('username').value);
        localStorage.setItem('loginTime', new Date().toISOString());
    }

    clearSession() {
        // Limpiar sesión
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('loginTime');
    }

    checkRememberMe() {
        // Verificar si ya hay una sesión activa
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (isLoggedIn === 'true') {
            const username = localStorage.getItem('username');
            if (username) {
                document.getElementById('username').value = username;
            }
        }
    }

    clearForm() {
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => input.classList.remove('error'));
    }
}

// Agregar estilos CSS para las animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .error {
        border-color: #dc3545 !important;
        background-color: #fff5f5 !important;
    }
    
    .btn-login.loading {
        opacity: 0.7;
        cursor: not-allowed;
    }
    
    .fa-spin {
        animation: fa-spin 1s infinite linear;
    }
    
    @keyframes fa-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Inicializar el sistema de login cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new LoginSystem();
});

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        // Si ya está logueado, redirigir al dashboard
        const loginSystem = new LoginSystem();
        window.location.href = loginSystem.redirectUrl;
    }
});