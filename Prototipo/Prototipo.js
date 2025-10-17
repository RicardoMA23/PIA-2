// Prototipo.js — QualityWeb360 (Dashboard + Listados protegidos por JWT)
const API = 'http://localhost:3001/api';

/* =========================
   Autenticación de la vista
   ========================= */
function requireLogin() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '../index/index.html';
  }
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return { 'Authorization': `Bearer ${token}` };
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '../index/index.html';
}

/* =========================
   Navegación entre secciones (SPA)
   ========================= */
function initSectionNav() {
  const links = document.querySelectorAll('.sidebar .nav-link');
  const sections = document.querySelectorAll('.section');
  const title = document.getElementById('section-title');

  function show(secId) {
    // Secciones
    sections.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(secId);
    if (target) target.classList.add('active');

    // Links activos
    links.forEach(l => l.classList.remove('active'));
    const link = document.querySelector(`.sidebar .nav-link[data-section="${secId}"]`);
    if (link) link.classList.add('active');

    // Título
    const map = {
      dashboard: 'Dashboard',
      documentos: 'Control de Documentos',
      auditorias: 'Auditorías Internas',
      acciones: 'Acciones Correctivas',
      indicadores: 'Indicadores'
    };
    if (title) title.textContent = map[secId] || 'Dashboard';
  }

  // Click en el sidebar
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sec = link.getAttribute('data-section');
      if (sec) show(sec);
    });
  });

  // Click en tarjetas del dashboard
  document.querySelectorAll('.stat-card[data-goto]').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const sec = card.getAttribute('data-goto');
      if (sec) show(sec);
    });
  });
}

/* =========================
   Helpers UI / Formatos
   ========================= */
function badgeClass(estado) {
  const map = {
    'Aprobado': 'bg-success',
    'En Revisión': 'bg-warning',
    'Obsoleto': 'bg-danger',

    'Completada': 'bg-success',
    'En Progreso': 'bg-warning',
    'Pendiente': 'bg-danger',

    'Activo': 'bg-success',
    'Inactivo': 'bg-secondary'
  };
  return `badge ${map[estado] || 'bg-secondary'}`;
}

function safe(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  return String(val);
}

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return safe(d);
  return dt.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function showErrorToast(msg = 'Error al cargar datos') {
  console.error(msg);
}

/* =========================
   Endpoints protegidos
   ========================= */
async function getJSON(url) {
  const r = await fetch(url, { headers: authHeaders() });
  if (r.status === 401) {
    localStorage.clear();
    requireLogin();
    return;
  }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/* =========================
   Dashboard: Métricas
   ========================= */
async function cargarMetricas() {
  const elDocs = document.getElementById('docsCount');
  const elAud = document.getElementById('auditsCount');
  const elAcc = document.getElementById('actionsCount');
  const elInd = document.getElementById('indicatorsCount');

  if (!elDocs && !elAud && !elAcc && !elInd) return;

  try {
    const m = await getJSON(`${API}/metrics`);
    if (!m) return;
    if (elDocs) elDocs.textContent = m.documentos ?? 0;
    if (elAud)  elAud.textContent  = m.auditorias ?? 0;
    if (elAcc)  elAcc.textContent  = m.acciones ?? 0;
    if (elInd)  elInd.textContent  = m.indicadores ?? 0;
  } catch {
    showErrorToast('No se pudieron cargar las métricas');
  }
}

/* =========================
   Documentos
   ========================= */
async function cargarDocumentos() {
  const tbody = document.querySelector('#tablaDocumentos tbody');
  if (!tbody) return;

  try {
    const rows = await getJSON(`${API}/documentos`);
    if (!rows) return;
    tbody.innerHTML = rows.map(d => `
      <tr>
        <td>${safe(d.codigo)}</td>
        <td>${safe(d.nombre_documento)}</td>
        <td>${safe(d.version)}</td>
        <td>${formatDate(d.fecha)}</td>
        <td>${safe(d.responsable)}</td>
        <td><span class="${badgeClass(d.estado)}">${safe(d.estado)}</span></td>
        <td class="text-end">
          <button class="btn btn-info btn-sm" data-codigo="${safe(d.codigo)}">👁</button>
          <button class="btn btn-warning btn-sm" data-id="${d.id_documento}">✏️</button>
          <button class="btn btn-danger btn-sm" data-id="${d.id_documento}">🗑</button>
        </td>
      </tr>
    `).join('');
  } catch {
    showErrorToast('No se pudieron cargar los documentos');
  }
}

/* =========================
   Auditorías (lista y recientes)
   ========================= */
async function cargarAuditorias() {
  const tbody = document.querySelector('#tablaAuditorias tbody');
  if (!tbody) return;

  try {
    const rows = await getJSON(`${API}/auditorias`);
    if (!rows) return;
    tbody.innerHTML = rows.map(a => `
      <tr>
        <td>${safe(a.codigo)}</td>
        <td>${safe(a.proceso_auditado)}</td>
        <td>${formatDate(a.fecha_programada)}</td>
        <td>${safe(a.auditor)}</td>
        <td><span class="${badgeClass(a.estado)}">${safe(a.estado)}</span></td>
        <td>${safe(a.resultado)}</td>
      </tr>
    `).join('');
  } catch {
    showErrorToast('No se pudieron cargar las auditorías');
  }
}

async function cargarAuditoriasRecientes() {
  const tbody = document.querySelector('#tablaAuditoriasRecientes tbody');
  if (!tbody) return;

  try {
    const rows = await getJSON(`${API}/auditorias`);
    if (!rows) return;
    const recientes = rows.slice(0, 3);
    tbody.innerHTML = recientes.map(a => `
      <tr>
        <td>${safe(a.codigo)}</td>
        <td>${safe(a.proceso_auditado)}</td>
        <td>${formatDate(a.fecha_programada)}</td>
        <td><span class="${badgeClass(a.estado)}">${safe(a.estado)}</span></td>
      </tr>
    `).join('');
  } catch {
    showErrorToast('No se pudieron cargar las auditorías recientes');
  }
}

/* =========================
   Acciones Correctivas
   ========================= */
async function cargarAcciones() {
  const tbody = document.querySelector('#tablaAcciones tbody');
  if (!tbody) return;

  try {
    const rows = await getJSON(`${API}/acciones`);
    if (!rows) return;
    tbody.innerHTML = rows.map(ac => `
      <tr>
        <td>${safe(ac.codigo)}</td>
        <td>${safe(ac.origen)}</td>
        <td>${safe(ac.descripcion)}</td>
        <td>${safe(ac.responsable)}</td>
        <td>${formatDate(ac.fecha_limite)}</td>
        <td><span class="${badgeClass(ac.estado)}">${safe(ac.estado)}</span></td>
        <td class="text-end">
          <button class="btn btn-info btn-sm" data-codigo="${safe(ac.codigo)}">👁</button>
          <button class="btn btn-warning btn-sm" data-id="${ac.id_accion}">✏️</button>
          <button class="btn btn-danger btn-sm" data-id="${ac.id_accion}">🗑</button>
        </td>
      </tr>
    `).join('');
  } catch {
    showErrorToast('No se pudieron cargar las acciones correctivas');
  }
}

/* =========================
   Indicadores
   ========================= */
async function cargarIndicadores() {
  const tbody = document.querySelector('#tablaIndicadores tbody');
  if (!tbody) return;

  try {
    const rows = await getJSON(`${API}/indicadores`);
    if (!rows) return;
    tbody.innerHTML = rows.map(i => `
      <tr>
        <td>${safe(i.codigo)}</td>
        <td>${safe(i.nombre_indicador)}</td>
        <td>${safe(i.proceso)}</td>
        <td>${safe(i.responsable)}</td>
        <td>${safe(i.unidad_medida)}</td>
        <td>${safe(i.meta_objetivo)}</td>
        <td>${safe(i.frecuencia_medicion)}</td>
        <td><span class="${badgeClass(i.status)}">${safe(i.status)}</span></td>
        <td class="text-end">
          <button class="btn btn-info btn-sm" data-codigo="${safe(i.codigo)}">👁</button>
          <button class="btn btn-warning btn-sm" data-id="${i.id_indicador}">✏️</button>
          <button class="btn btn-danger btn-sm" data-id="${i.id_indicador}">🗑</button>
        </td>
      </tr>
    `).join('');
  } catch {
    showErrorToast('No se pudieron cargar los indicadores');
  }
}

/* =========================
   Inicialización por vista
   ========================= */
document.addEventListener('DOMContentLoaded', () => {
  // Exige sesión
  requireLogin();

  // Navegación SPA (sidebar + tarjetas)
  initSectionNav();

  // Dashboard
  cargarMetricas();
  cargarAuditoriasRecientes();

  // Secciones (solo si existe su tabla en el DOM)
  cargarDocumentos();
  cargarAuditorias();
  cargarAcciones();
  cargarIndicadores();

  // Logout (si existe el botón)
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) btnLogout.addEventListener('click', logout);
});
