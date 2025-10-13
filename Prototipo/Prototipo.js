         // Verificar autenticación al cargar la página
    document.addEventListener('DOMContentLoaded', function() {
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        
        if (!isAuthenticated || isAuthenticated !== 'true') {
            document.getElementById('loginOverlay').style.display = 'flex';
        } else {
            document.getElementById('loginOverlay').style.display = 'none';
        }
        
        // Manejar el formulario de login
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Validación simple (en un caso real, esto se haría contra un servidor)
            if (username === 'admin' && password === 'admin123') {
                // Guardar estado de autenticación
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('username', username);
                
                // Ocultar overlay de login
                document.getElementById('loginOverlay').style.display = 'none';
            } else {
                // Mostrar mensaje de error
                document.getElementById('errorMessage').classList.remove('d-none');
            }
        });
    });

        document.addEventListener('DOMContentLoaded', function() {
            // Navegación entre secciones
            const navLinks = document.querySelectorAll('.nav-link');
            const sections = document.querySelectorAll('.section');
            const sectionTitle = document.getElementById('section-title');
            
            navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Remover clase active de todos los links
                    navLinks.forEach(navLink => {
                        navLink.classList.remove('active');
                    });
                    
                    // Agregar clase active al link clickeado
                    this.classList.add('active');
                    
                    // Ocultar todas las secciones
                    sections.forEach(section => {
                        section.classList.remove('active');
                    });
                    
                    // Mostrar la sección correspondiente
                    const sectionId = this.getAttribute('data-section');
                    document.getElementById(sectionId).classList.add('active');
                    
                    // Actualizar el título de la sección
                    sectionTitle.textContent = this.textContent.trim();
                });
            });
        });