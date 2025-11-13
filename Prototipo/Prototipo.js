// Prototipo.js — QualityWeb360 (Dashboard + CRUD Documentos/Indicadores protegidos por JWT)
const API = 'http://localhost:3001/api';
const BACKEND = 'http://localhost:3001'; // para abrir archivos /uploads

/* =========================
   Autenticación de la vista
   ========================= */
function requireLogin() {
  const token = localStorage.getItem('token');
  if (!token) window.location.href = '../index/index.html';
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
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); }
  catch { return {}; }
}

/* =========================
   Navegación SPA
   ========================= */
function initSectionNav() {
  const links = document.querySelectorAll('.sidebar .nav-link');
  const sections = document.querySelectorAll('.section');
  const title = document.getElementById('section-title');

  function show(secId) {
    sections.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(secId);
    if (target) target.classList.add('active');

    links.forEach(l => l.classList.remove('active'));
    const link = document.querySelector(`.sidebar .nav-link[data-section="${secId}"]`);
    if (link) link.classList.add('active');

    const map = {
      dashboard: 'Dashboard',
      documentos: 'Control de Documentos',
      auditorias: 'Auditorías Internas',
      acciones: 'Acciones Correctivas',
      indicadores: 'Indicadores'
    };
    if (title) title.textContent = map[secId] || 'Dashboard';
  }

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sec = link.getAttribute('data-section');
      if (sec) show(sec);
    });
  });

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
    'Inactivo': 'bg-secondary',
    'En revisión': 'bg-warning'
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
function showErrorToast(msg = 'Error') { console.error(msg); }

/* =========================
   Fetch helpers
   ========================= */
async function getJSON(url) {
  const r = await fetch(url, { headers: authHeaders() });
  if (r.status === 401) { localStorage.clear(); requireLogin(); return; }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function postForm(url, formData) {
  const r = await fetch(url, { method: 'POST', headers: authHeaders(), body: formData });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function postJSON(url, data) {
  const r = await fetch(url, { method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function putJSON(url, data) {
  const r = await fetch(url, { method: 'PUT', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function putForm(url, formData) {
  const r = await fetch(url, { method: 'PUT', headers: authHeaders(), body: formData });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function del(url) {
  const r = await fetch(url, { method: 'DELETE', headers: authHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* =========================
   Dashboard: Métricas
   ========================= */
async function cargarMetricas() {
  const elDocs = document.getElementById('docsCount');
  const elAud  = document.getElementById('auditsCount');
  const elAcc  = document.getElementById('actionsCount');
  const elInd  = document.getElementById('indicatorsCount');
  if (!elDocs && !elAud && !elAcc && !elInd) return;
  try {
    const m = await getJSON(`${API}/metrics`);
    if (!m) return;
    if (elDocs) elDocs.textContent = m.documentos ?? 0;
    if (elAud)  elAud.textContent  = m.auditorias ?? 0;
    if (elAcc)  elAcc.textContent  = m.acciones ?? 0;
    if (elInd)  elInd.textContent  = m.indicadores ?? 0;
  } catch { showErrorToast('No se pudieron cargar las métricas'); }
}

/* =========================
   DOCUMENTOS (lista + acciones)
   ========================= */
let __docsCache = [];

async function cargarDocumentos() {
  const tbody = document.querySelector('#tablaDocumentos tbody');
  if (!tbody) return;
  try {
    const rows = await getJSON(`${API}/documentos`);
    if (!rows) return;
    __docsCache = rows;
    tbody.innerHTML = rows.map(d => `
      <tr data-id="${d.id_documento}">
        <td>${safe(d.codigo)}</td>
        <td>${safe(d.nombre_documento)}</td>
        <td>${safe(d.version)}</td>
        <td>${formatDate(d.fecha)}</td>
        <td>${safe(d.responsable)}</td>
        <td><span class="${badgeClass(d.estado)}">${safe(d.estado)}</span></td>
        <td class="text-end">
          <button class="btn btn-info btn-sm btn-view"    data-url="${safe(d.url_archivo)}" title="Ver archivo">👁</button>
          <button class="btn btn-warning btn-sm btn-edit" data-id="${d.id_documento}" title="Editar">✏️</button>
          <button class="btn btn-danger btn-sm btn-del"   data-id="${d.id_documento}" title="Eliminar">🗑</button>
        </td>
      </tr>
    `).join('');
  } catch {
    showErrorToast('No se pudieron cargar los documentos');
  }
}

function abrirModalNuevo() {
  document.getElementById('docModalTitle').textContent = 'Nuevo Documento';
  document.getElementById('doc_id').value = '';
  document.getElementById('doc_codigo').value = '';
  document.getElementById('doc_nombre').value = '';
  document.getElementById('doc_version').value = 'v1.0';
  document.getElementById('doc_fecha').valueAsDate = new Date();
  document.getElementById('doc_estado').value = 'En Revisión';
  document.getElementById('doc_proceso').value = '';
  document.getElementById('doc_archivo').value = '';
  document.getElementById('doc_archivo_help').textContent = '';
  new bootstrap.Modal(document.getElementById('docModal')).show();
}

function abrirModalEditar(doc) {
  document.getElementById('docModalTitle').textContent = 'Editar Documento';
  document.getElementById('doc_id').value = doc.id_documento;
  document.getElementById('doc_codigo').value = doc.codigo || '';
  document.getElementById('doc_nombre').value = doc.nombre_documento || '';
  document.getElementById('doc_version').value = doc.version || '';
  document.getElementById('doc_fecha').value = doc.fecha ? new Date(doc.fecha).toISOString().substring(0,10) : '';
  document.getElementById('doc_estado').value = doc.estado || 'En Revisión';
  document.getElementById('doc_proceso').value = doc.proceso || '';
  document.getElementById('doc_archivo').value = '';
  document.getElementById('doc_archivo_help').textContent = doc.url_archivo ? `Archivo actual: ${doc.url_archivo}` : 'Sin archivo';
  new bootstrap.Modal(document.getElementById('docModal')).show();
}

async function onSubmitDocumento(e) {
  e.preventDefault();
  const id     = document.getElementById('doc_id').value.trim();
  const codigo = document.getElementById('doc_codigo').value.trim();
  const nombre = document.getElementById('doc_nombre').value.trim();
  const version= document.getElementById('doc_version').value.trim();
  const fecha  = document.getElementById('doc_fecha').value;
  const estado = document.getElementById('doc_estado').value;
  const proceso= document.getElementById('doc_proceso').value;
  const file   = document.getElementById('doc_archivo').files[0];

  if (!nombre) { alert('El nombre del documento es obligatorio'); return; }

  try {
    if (!id) {
      const user = getCurrentUser();
      const fd = new FormData();
      if (codigo) fd.append('codigo', codigo);
      fd.append('nombre_documento', nombre);
      if (version) fd.append('version', version);
      if (fecha) fd.append('fecha', fecha);
      if (estado) fd.append('estado', estado);
      if (proceso) fd.append('proceso', proceso);
      if (file) fd.append('archivo', file);
      if (user?.id) fd.append('id_responsable', user.id);
      await postForm(`${API}/documentos`, fd);
    } else {
      await putJSON(`${API}/documentos/${id}`, {
        codigo: codigo || null,
        nombre_documento: nombre || null,
        version: version || null,
        fecha: fecha || null,
        estado: estado || null,
        proceso: proceso || null
      });
      if (file) {
        const fd2 = new FormData();
        fd2.append('archivo', file);
        await putForm(`${API}/documentos/${id}/archivo`, fd2);
      }
    }
    bootstrap.Modal.getInstance(document.getElementById('docModal')).hide();
    await cargarDocumentos();
    await cargarMetricas();
  } catch (err) {
    console.error(err);
    alert('No se pudo guardar el documento');
  }
}

function initTablaDocumentosActions() {
  const tbody = document.querySelector('#tablaDocumentos tbody');
  if (!tbody) return;

  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.classList.contains('btn-view')) {
      const urlRel = btn.dataset.url;
      if (!urlRel) return alert('Este registro no tiene archivo');
      const full = urlRel.startsWith('http') ? urlRel : `${BACKEND}${urlRel}`;
      window.open(full, '_blank');
      return;
    }

    if (btn.classList.contains('btn-edit')) {
      const id = Number(btn.dataset.id);
      const doc = __docsCache.find(x => x.id_documento === id);
      if (!doc) return alert('No encontrado');
      abrirModalEditar(doc);
      return;
    }

    if (btn.classList.contains('btn-del')) {
      const id = Number(btn.dataset.id);
      if (!confirm('¿Eliminar este documento? Esta acción no se puede deshacer.')) return;
      try {
        await del(`${API}/documentos/${id}`);
        await cargarDocumentos();
        await cargarMetricas();
      } catch (err) {
        console.error(err);
        alert('No se pudo eliminar');
      }
      return;
    }
  });
}

/* =========================
   INDICADORES (CRUD + export PDF)
   ========================= */
let __indsCache = [];

function leerIndicadorForm() {
  return {
    codigo: document.getElementById('ind_codigo').value.trim(),
    nombre_indicador: document.getElementById('ind_nombre').value.trim(),
    status: document.getElementById('ind_status').value,
    status2: document.getElementById('ind_status2').value,
    proceso: document.getElementById('ind_proceso').value.trim(),
    responsable: document.getElementById('ind_responsable').value.trim(),
    objetivo_impacto: document.getElementById('ind_objetivo_impacto').value,
    descripcion: document.getElementById('ind_descripcion').value.trim(),
    unidad_medida: document.getElementById('ind_unidad').value.trim(),
    meta_objetivo: document.getElementById('ind_meta').value.trim(),
    frecuencia_medicion: document.getElementById('ind_frecuencia').value.trim(),
    principal_objeto: document.getElementById('ind_principal_objeto').value.trim(),
    cod_procedimiento: document.getElementById('ind_cod_proc').value.trim(),
    fecha_deseada_finalizacion: document.getElementById('ind_fecha_deseada').value || null,
    estrategia: document.getElementById('ind_estrategia').value.trim(),
    metodologia: document.getElementById('ind_metodologia').value.trim(),
    procedimiento: document.getElementById('ind_procedimiento').value.trim(),
    objetivos_adicionales: document.getElementById('ind_obj_adic').value.trim()
  };
}
function escribirIndicadorForm(ind = {}) {
  document.getElementById('ind_codigo').value = ind.codigo || '';
  document.getElementById('ind_nombre').value = ind.nombre_indicador || '';
  document.getElementById('ind_status').value = ind.status || 'Activo';
  document.getElementById('ind_status2').value = ind.status2 || 'Nuevo';
  document.getElementById('ind_proceso').value = ind.proceso || '';
  document.getElementById('ind_responsable').value = ind.responsable || '';
  document.getElementById('ind_objetivo_impacto').value = ind.objetivo_impacto || 'Bajo';
  document.getElementById('ind_descripcion').value = ind.descripcion || '';
  document.getElementById('ind_unidad').value = ind.unidad_medida || '';
  document.getElementById('ind_meta').value = ind.meta_objetivo || '';
  document.getElementById('ind_frecuencia').value = ind.frecuencia_medicion || '';
  document.getElementById('ind_principal_objeto').value = ind.principal_objeto || '';
  document.getElementById('ind_cod_proc').value = ind.cod_procedimiento || '';
  document.getElementById('ind_fecha_deseada').value = ind.fecha_deseada_finalizacion ? new Date(ind.fecha_deseada_finalizacion).toISOString().substring(0,10) : '';
  document.getElementById('ind_estrategia').value = ind.estrategia || '';
  document.getElementById('ind_metodologia').value = ind.metodologia || '';
  document.getElementById('ind_procedimiento').value = ind.procedimiento || '';
  document.getElementById('ind_obj_adic').value = ind.objetivos_adicionales || '';
}

async function cargarIndicadores() {
  const tbody = document.querySelector('#tablaIndicadores tbody');
  if (!tbody) return;
  try {
    const rows = await getJSON(`${API}/indicadores`);
    if (!rows) return;
    __indsCache = rows;
    tbody.innerHTML = rows.map(i => `
      <tr data-id="${i.id_indicador}">
        <td>${safe(i.codigo)}</td>
        <td>${safe(i.nombre_indicador)}</td>
        <td>${safe(i.proceso)}</td>
        <td>${safe(i.responsable)}</td>
        <td>${safe(i.unidad_medida)}</td>
        <td>${safe(i.meta_objetivo)}</td>
        <td>${safe(i.frecuencia_medicion)}</td>
        <td><span class="${badgeClass(i.status)}">${safe(i.status)}</span></td>
        <td class="text-end">
          <button class="btn btn-info btn-sm btn-ind-view"  data-id="${i.id_indicador}" title="Ver">👁</button>
          <button class="btn btn-warning btn-sm btn-ind-edit" data-id="${i.id_indicador}" title="Editar">✏️</button>
          <button class="btn btn-danger btn-sm btn-ind-del"  data-id="${i.id_indicador}" title="Eliminar">🗑</button>
        </td>
      </tr>
    `).join('');
  } catch {
    showErrorToast('No se pudieron cargar los indicadores');
  }
}

function abrirModalIndicadorNuevo() {
  document.getElementById('indicadorModalTitle').textContent = 'Nuevo Indicador';
  document.getElementById('ind_id').value = '';
  escribirIndicadorForm({});
  new bootstrap.Modal(document.getElementById('indicadorModal')).show();
}
function abrirModalIndicadorEditar(ind) {
  document.getElementById('indicadorModalTitle').textContent = 'Editar Indicador';
  document.getElementById('ind_id').value = ind.id_indicador;
  escribirIndicadorForm(ind);
  new bootstrap.Modal(document.getElementById('indicadorModal')).show();
}
function abrirModalIndicadorVer(ind) {
  abrirModalIndicadorEditar(ind);
  document.getElementById('indicadorModalTitle').textContent = 'Ver Indicador';
}

async function onSubmitIndicador(e) {
  e.preventDefault();
  const id = document.getElementById('ind_id').value.trim();
  const payload = leerIndicadorForm();

  if (!payload.nombre_indicador) { alert('El nombre del indicador es obligatorio'); return; }

  try {
    if (!id) {
      await postJSON(`${API}/indicadores`, payload);
    } else {
      await putJSON(`${API}/indicadores/${id}`, payload);
    }
    bootstrap.Modal.getInstance(document.getElementById('indicadorModal')).hide();
    await cargarIndicadores();
    await cargarMetricas();
  } catch (err) {
    console.error(err);
    alert('No se pudo guardar el indicador');
  }
}

function initTablaIndicadoresActions() {
  const tbody = document.querySelector('#tablaIndicadores tbody');
  if (!tbody) return;

  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const ind = __indsCache.find(x => x.id_indicador === id);
    if (!ind) return;

    if (btn.classList.contains('btn-ind-view')) {
      abrirModalIndicadorVer(ind);
      return;
    }
    if (btn.classList.contains('btn-ind-edit')) {
      abrirModalIndicadorEditar(ind);
      return;
    }
    if (btn.classList.contains('btn-ind-del')) {
      if (!confirm('¿Eliminar este indicador?')) return;
      try {
        await del(`${API}/indicadores/${id}`);
        await cargarIndicadores();
        await cargarMetricas();
      } catch (err) {
        console.error(err);
        alert('No se pudo eliminar el indicador');
      }
      return;
    }
  });
}

function exportIndicadoresPDF() {
  // Exportación simple: abre una ventana imprimible (desde ahí “Guardar como PDF”)
  const rows = __indsCache;
  const html = `
    <html>
    <head>
      <meta charset="utf-8">
      <title>Indicadores - Reporte</title>
      <style>
        body{font-family:Arial; margin:24px;}
        h2{margin-bottom:12px}
        table{width:100%; border-collapse:collapse}
        th,td{border:1px solid #999; padding:6px; font-size:12px}
        th{background:#eee}
      </style>
    </head>
    <body>
      <h2>Reporte de Indicadores</h2>
      <table>
        <thead>
          <tr>
            <th>Código</th><th>Indicador</th><th>Proceso</th><th>Responsable</th>
            <th>Unidad</th><th>Meta</th><th>Frecuencia</th><th>Status</th>
            <th>Impacto</th><th>Fecha deseada fin</th>
          </tr>
        </thead>
        <tbody>
          ${
            rows.map(i => `
              <tr>
                <td>${safe(i.codigo)}</td>
                <td>${safe(i.nombre_indicador)}</td>
                <td>${safe(i.proceso)}</td>
                <td>${safe(i.responsable)}</td>
                <td>${safe(i.unidad_medida)}</td>
                <td>${safe(i.meta_objetivo)}</td>
                <td>${safe(i.frecuencia_medicion)}</td>
                <td>${safe(i.status)}</td>
                <td>${safe(i.objetivo_impacto || '')}</td>
                <td>${formatDate(i.fecha_deseada_finalizacion)}</td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
      <script>window.print()</script>
    </body>
    </html>
  `;
  const w = window.open('', '_blank');
  w.document.open();
  w.document.write(html);
  w.document.close();
}

/* =========================
   AUDITORÍAS / ACCIONES (solo lectura)
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
  } catch { showErrorToast('No se pudieron cargar las auditorías'); }
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
  } catch { showErrorToast('No se pudieron cargar las auditorías recientes'); }
}
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
  } catch { showErrorToast('No se pudieron cargar las acciones correctivas'); }
}

/* =========================
   Init
   ========================= */
document.addEventListener('DOMContentLoaded', () => {
  requireLogin();
  initSectionNav();

  // Dashboard
  cargarMetricas();
  cargarAuditoriasRecientes();

  // Tablas
  cargarDocumentos();
  cargarAuditorias();
  cargarAcciones();
  cargarIndicadores();

  // Documentos
  const btnNuevoDoc = document.getElementById('btnNuevoDocumento');
  if (btnNuevoDoc) btnNuevoDoc.addEventListener('click', abrirModalNuevo);
  const formDoc = document.getElementById('formDocumento');
  if (formDoc) formDoc.addEventListener('submit', onSubmitDocumento);
  initTablaDocumentosActions();

  // Indicadores
  const btnNuevoIndicador = document.getElementById('btnNuevoIndicador');
  if (btnNuevoIndicador) btnNuevoIndicador.addEventListener('click', abrirModalIndicadorNuevo);
  const formIndicador = document.getElementById('formIndicador');
  if (formIndicador) formIndicador.addEventListener('submit', onSubmitIndicador);
  initTablaIndicadoresActions();

  // Exportar Indicadores a PDF
  const btnExp = document.getElementById('btnExportIndicadores');
  if (btnExp) btnExp.addEventListener('click', exportIndicadoresPDF);

  // Logout
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) btnLogout.addEventListener('click', logout);
});
