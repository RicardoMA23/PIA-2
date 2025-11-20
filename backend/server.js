// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { extension } = require('mime-types');
const PDFDocument = require('pdfkit');

const app = express();
app.use(cors());
app.use(express.json());

// Logger para ver qué llega
app.use((req, _res, next) => {
  console.log('> ', req.method, req.url);
  next();
});

// ==============================
// Conexión a Postgres
// ==============================
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'QualityWeb360',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
});

// ==============================
// Archivos estáticos de uploads
// ==============================
const UPLOAD_DIR = path.join(__dirname, 'uploads', 'documentos');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==============================
// Multer (PDF/XLS/XLSX)
// ==============================
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const orig = file.originalname;
    const ext = path.extname(orig) || `.${extension(file.mimetype) || 'bin'}`;
    const base = path.basename(orig, ext).replace(/[^\w\-]+/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
  cb(new Error('Tipo de archivo no permitido (solo PDF/XLS/XLSX)'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

// ==============================
// Auth Middleware (JWT)
// ==============================
function authMiddleware(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No auth token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = payload; // { id, correo }
    next();
  } catch (_e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// ==============================
// Rutas base + LOGIN
// ==============================
app.get('/', (_req, res) => res.send('✅ API OK'));

app.get('/auth/login', (_req, res) => {
  res.status(405).send('Usa POST /auth/login con JSON');
});

// LOGIN real (POST) – versión sin /api para compatibilidad
app.post('/auth/login', loginHandler);
// LOGIN real (POST) – con /api para el frontend
app.post('/api/auth/login', loginHandler);

async function loginHandler(req, res) {
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.status(400).json({ error: 'Faltan campos' });
    }

    const { rows } = await pool.query(
      `SELECT id_usuario, nombre, correo, puesto, password_hash, activo
       FROM calidad.usuarios
       WHERE correo = $1
       LIMIT 1`,
      [correo]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const u = rows[0];
    if (!u.activo) return res.status(403).json({ error: 'Usuario inactivo' });

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: u.id_usuario, correo: u.correo },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      usuario: { id: u.id_usuario, nombre: u.nombre, correo: u.correo, puesto: u.puesto },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'login_failed' });
  }
}

// ==============================
// Métricas para Dashboard
// ==============================
app.get('/api/metrics', authMiddleware, async (_req, res) => {
  try {
    const [{ rows: d }, { rows: a }, { rows: ac }, { rows: i }] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS c FROM calidad.documentos'),
      pool.query('SELECT COUNT(*)::int AS c FROM calidad.auditorias'),
      pool.query('SELECT COUNT(*)::int AS c FROM calidad.acciones_correctivas'),
      pool.query('SELECT COUNT(*)::int AS c FROM calidad.indicadores'),
    ]);

    res.json({
      documentos: d[0]?.c || 0,
      auditorias: a[0]?.c || 0,
      acciones: ac[0]?.c || 0,
      indicadores: i[0]?.c || 0,
    });
  } catch (e) {
    console.error(e);
    res.json({ documentos: 0, auditorias: 0, acciones: 0, indicadores: 0 });
  }
});

// ==============================
// DOCUMENTOS – CRUD + archivo
// ==============================

// Listar
app.get('/api/documentos', authMiddleware, async (_req, res) => {
  try {
    const q = `
      SELECT d.id_documento, d.codigo, d.nombre_documento, d.version, d.fecha,
             d.estado, d.url_archivo, COALESCE(u.nombre,'') AS responsable, d.proceso
      FROM calidad.documentos d
      LEFT JOIN calidad.usuarios u ON u.id_usuario = d.id_responsable
      ORDER BY d.fecha DESC, d.id_documento DESC;
    `;
    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar documentos' });
  }
});

// Crear (con archivo)
app.post('/api/documentos', authMiddleware, upload.single('archivo'), async (req, res) => {
  try {
    const {
      codigo,
      nombre_documento,
      version = 'v1.0',
      fecha,
      estado = 'En Revisión',
      id_responsable,
      proceso,
    } = req.body;

    const archivo = req.file ? `/uploads/documentos/${req.file.filename}` : null;
    const q = `
      INSERT INTO calidad.documentos
        (codigo, nombre_documento, version, fecha, id_responsable, estado, url_archivo, proceso)
      VALUES ($1,$2,$3,COALESCE($4, CURRENT_DATE),$5,$6,$7,$8)
      RETURNING id_documento, codigo, nombre_documento, version, fecha, estado, url_archivo, proceso
    `;
    const params = [
      codigo || null,
      nombre_documento,
      version,
      fecha || null,
      id_responsable || null,
      estado,
      archivo,
      proceso || null,
    ];
    const { rows } = await pool.query(q, params);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al crear documento' });
  }
});

// Actualizar metadatos
app.put('/api/documentos/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre_documento, version, fecha, estado, id_responsable, codigo, proceso } = req.body;

    const q = `
      UPDATE calidad.documentos
      SET nombre_documento = COALESCE($1, nombre_documento),
          version          = COALESCE($2, version),
          fecha            = COALESCE($3, fecha),
          estado           = COALESCE($4, estado),
          id_responsable   = COALESCE($5, id_responsable),
          codigo           = COALESCE($6, codigo),
          proceso          = COALESCE($7, proceso)
      WHERE id_documento = $8
      RETURNING id_documento, codigo, nombre_documento, version, fecha, estado, url_archivo, proceso
    `;
    const { rows } = await pool.query(q, [
      nombre_documento || null,
      version || null,
      fecha || null,
      estado || null,
      id_responsable || null,
      codigo || null,
      proceso || null,
      id,
    ]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al actualizar documento' });
  }
});

// Reemplazar archivo
app.put(
  '/api/documentos/:id/archivo',
  authMiddleware,
  upload.single('archivo'),
  async (req, res) => {
    try {
      const id = req.params.id;
      const archivo = req.file ? `/uploads/documentos/${req.file.filename}` : null;
      if (!archivo) return res.status(400).json({ error: 'Falta archivo' });

      const prev = await pool.query(
        'SELECT url_archivo FROM calidad.documentos WHERE id_documento=$1',
        [id]
      );
      if (!prev.rows.length) return res.status(404).json({ error: 'No encontrado' });

      const oldRel = prev.rows[0].url_archivo ? prev.rows[0].url_archivo.replace(/^\//, '') : null;
      const oldAbs = oldRel ? path.join(__dirname, oldRel) : null;
      if (oldAbs && fs.existsSync(oldAbs)) {
        try { fs.unlinkSync(oldAbs); } catch (_e) {}
      }

      const { rows } = await pool.query(
        'UPDATE calidad.documentos SET url_archivo=$1 WHERE id_documento=$2 RETURNING *',
        [archivo, id]
      );
      res.json(rows[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error al reemplazar archivo' });
    }
  }
);

// Eliminar documento
app.delete('/api/documentos/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;

    const prev = await pool.query(
      'SELECT url_archivo FROM calidad.documentos WHERE id_documento=$1',
      [id]
    );
    if (prev.rows.length && prev.rows[0].url_archivo) {
      const rel = prev.rows[0].url_archivo.replace(/^\//, '');
      const abs = path.join(__dirname, rel);
      if (fs.existsSync(abs)) {
        try { fs.unlinkSync(abs); } catch (_e) {}
      }
    }

    const r = await pool.query('DELETE FROM calidad.documentos WHERE id_documento=$1', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
});

// ==============================
// AUDITORÍAS – CRUD
// ==============================
app.get('/api/auditorias', authMiddleware, async (_req, res) => {
  try {
    const q = `
      SELECT id_auditoria, codigo, proceso_auditado, fecha_programada,
             auditor, estado, resultado
      FROM calidad.auditorias
      ORDER BY fecha_programada DESC, id_auditoria DESC;
    `;
    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar auditorías' });
  }
});

app.post('/api/auditorias', authMiddleware, async (req, res) => {
  try {
    const {
      codigo,
      proceso_auditado,
      fecha_programada,
      auditor,
      estado,
      resultado,
    } = req.body;

    const q = `
      INSERT INTO calidad.auditorias
        (codigo, proceso_auditado, fecha_programada, auditor, estado, resultado)
      VALUES ($1,$2,COALESCE($3, CURRENT_DATE),$4,$5,$6)
      RETURNING id_auditoria, codigo, proceso_auditado, fecha_programada,
                auditor, estado, resultado;
    `;
    const vals = [
      codigo,
      proceso_auditado || null,
      fecha_programada || null,
      auditor || null,
      estado || 'Pendiente',
      resultado || null,
    ];

    console.log('POST /api/auditorias vals =', vals);

    const { rows } = await pool.query(q, vals);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al crear auditoría' });
  }
});

app.put('/api/auditorias/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      codigo,
      proceso_auditado,
      fecha_programada,
      auditor,
      estado,
      resultado,
    } = req.body;

    const q = `
      UPDATE calidad.auditorias SET
        codigo           = COALESCE($1, codigo),
        proceso_auditado = COALESCE($2, proceso_auditado),
        fecha_programada = COALESCE($3, fecha_programada),
        auditor          = COALESCE($4, auditor),
        estado           = COALESCE($5, estado),
        resultado        = COALESCE($6, resultado)
      WHERE id_auditoria = $7
      RETURNING id_auditoria, codigo, proceso_auditado, fecha_programada,
                auditor, estado, resultado;
    `;
    const vals = [
      codigo || null,
      proceso_auditado || null,
      fecha_programada || null,
      auditor || null,
      estado || null,
      resultado || null,
      id,
    ];
    const { rows } = await pool.query(q, vals);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al actualizar auditoría' });
  }
});

app.delete('/api/auditorias/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await pool.query(
      'DELETE FROM calidad.auditorias WHERE id_auditoria=$1',
      [id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al eliminar auditoría' });
  }
});

// ==============================
// ACCIONES CORRECTIVAS – CRUD
// ==============================
// ==============================
// ACCIONES CORRECTIVAS – CRUD
// ==============================
app.get('/api/acciones', authMiddleware, async (_req, res) => {
  try {
    const q = `
      SELECT
        id_accion,
        codigo,
        origen,
        descripcion,
        id_responsable AS responsable,  -- la BD tiene id_responsable
        fecha_limite,
        estado
      FROM calidad.acciones_correctivas
      ORDER BY fecha_limite DESC, id_accion DESC;
    `;
    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (e) {
    console.error('Error al listar acciones correctivas:', e);
    res.status(500).json({ error: 'Error al listar acciones correctivas' });
  }
});

app.post('/api/acciones', authMiddleware, async (req, res) => {
  try {
    const {
      codigo,
      origen,
      descripcion,
      responsable,      // viene del frontend, pero de momento no lo usamos
      fecha_limite,
      estado
    } = req.body;

    const q = `
      INSERT INTO calidad.acciones_correctivas
        (codigo, origen, descripcion, id_responsable, fecha_limite, estado)
      VALUES ($1,$2,$3,$4,COALESCE($5, CURRENT_DATE),$6)
      RETURNING
        id_accion,
        codigo,
        origen,
        descripcion,
        id_responsable AS responsable,
        fecha_limite,
        estado;
    `;
    const vals = [
      codigo || null,
      origen || null,
      descripcion || null,
      null,                 // id_responsable por ahora NULL
      fecha_limite || null,
      estado || 'Pendiente'
    ];

    const { rows } = await pool.query(q, vals);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Error al crear acción correctiva:', e);
    res.status(500).json({ error: 'Error al crear acción correctiva' });
  }
});

app.put('/api/acciones/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      codigo,
      origen,
      descripcion,
      responsable,      // lo ignoramos por ahora
      fecha_limite,
      estado
    } = req.body;

    const q = `
      UPDATE calidad.acciones_correctivas SET
        codigo        = COALESCE($1, codigo),
        origen        = COALESCE($2, origen),
        descripcion   = COALESCE($3, descripcion),
        fecha_limite  = COALESCE($4, fecha_limite),
        estado        = COALESCE($5, estado)
      WHERE id_accion = $6
      RETURNING
        id_accion,
        codigo,
        origen,
        descripcion,
        id_responsable AS responsable,
        fecha_limite,
        estado;
    `;
    const vals = [
      codigo || null,
      origen || null,
      descripcion || null,
      fecha_limite || null,
      estado || null,
      id
    ];

    const { rows } = await pool.query(q, vals);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Error al actualizar acción correctiva:', e);
    res.status(500).json({ error: 'Error al actualizar acción correctiva' });
  }
});

app.delete('/api/acciones/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await pool.query(
      'DELETE FROM calidad.acciones_correctivas WHERE id_accion=$1',
      [id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ ok: true });
  } catch (e) {
    console.error('Error al eliminar acción correctiva:', e);
    res.status(500).json({ error: 'Error al eliminar acción correctiva' });
  }
});


// ==============================
// INDICADORES – CRUD (+ PDF)
// ==============================
app.get('/api/indicadores', authMiddleware, async (_req, res) => {
  try {
    const q = `
      SELECT id_indicador, codigo, nombre_indicador, status, status2,
             proceso, responsable, objetivo_impacto, descripcion,
             unidad_medida, meta_objetivo, frecuencia_medicion,
             principal_objeto, cod_procedimiento, fecha_deseada_finalizacion,
             estrategia, metodologia, procedimiento, objetivos_adicionales
      FROM calidad.indicadores
      ORDER BY id_indicador DESC;
    `;
    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar indicadores' });
  }
});

app.post('/api/indicadores', authMiddleware, async (req, res) => {
  try {
    const {
      codigo, nombre_indicador, status, status2, proceso, responsable,
      objetivo_impacto, descripcion, unidad_medida, meta_objetivo,
      frecuencia_medicion, principal_objeto, cod_procedimiento,
      fecha_deseada_finalizacion, estrategia, metodologia,
      procedimiento, objetivos_adicionales,
    } = req.body;

    const q = `
      INSERT INTO calidad.indicadores
      (codigo, nombre_indicador, status, status2, proceso, responsable,
       objetivo_impacto, descripcion, unidad_medida, meta_objetivo,
       frecuencia_medicion, principal_objeto, cod_procedimiento,
       fecha_deseada_finalizacion, estrategia, metodologia,
       procedimiento, objetivos_adicionales)
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING id_indicador, codigo, nombre_indicador, status, status2,
                proceso, responsable, objetivo_impacto, descripcion,
                unidad_medida, meta_objetivo, frecuencia_medicion,
                principal_objeto, cod_procedimiento, fecha_deseada_finalizacion,
                estrategia, metodologia, procedimiento, objetivos_adicionales;
    `;
    const vals = [
      codigo || null, nombre_indicador || null, status || null, status2 || null,
      proceso || null, responsable || null, objetivo_impacto || null, descripcion || null,
      unidad_medida || null, meta_objetivo || null, frecuencia_medicion || null,
      principal_objeto || null, cod_procedimiento || null, fecha_deseada_finalizacion || null,
      estrategia || null, metodologia || null, procedimiento || null, objetivos_adicionales || null,
    ];
    const { rows } = await pool.query(q, vals);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al crear indicador' });
  }
});

app.put('/api/indicadores/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      codigo, nombre_indicador, status, status2, proceso, responsable,
      objetivo_impacto, descripcion, unidad_medida, meta_objetivo,
      frecuencia_medicion, principal_objeto, cod_procedimiento,
      fecha_deseada_finalizacion, estrategia, metodologia,
      procedimiento, objetivos_adicionales,
    } = req.body;

    const q = `
      UPDATE calidad.indicadores SET
        codigo=$1, nombre_indicador=$2, status=$3, status2=$4, proceso=$5,
        responsable=$6, objetivo_impacto=$7, descripcion=$8, unidad_medida=$9,
        meta_objetivo=$10, frecuencia_medicion=$11, principal_objeto=$12,
        cod_procedimiento=$13, fecha_deseada_finalizacion=$14, estrategia=$15,
        metodologia=$16, procedimiento=$17, objetivos_adicionales=$18
      WHERE id_indicador=$19
      RETURNING id_indicador, codigo, nombre_indicador, status, status2,
                proceso, responsable, objetivo_impacto, descripcion,
                unidad_medida, meta_objetivo, frecuencia_medicion,
                principal_objeto, cod_procedimiento, fecha_deseada_finalizacion,
                estrategia, metodologia, procedimiento, objetivos_adicionales;
    `;
    const vals = [
      codigo || null, nombre_indicador || null, status || null, status2 || null,
      proceso || null, responsable || null, objetivo_impacto || null, descripcion || null,
      unidad_medida || null, meta_objetivo || null, frecuencia_medicion || null,
      principal_objeto || null, cod_procedimiento || null, fecha_deseada_finalizacion || null,
      estrategia || null, metodologia || null, procedimiento || null, objetivos_adicionales || null,
      id,
    ];
    const { rows } = await pool.query(q, vals);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al actualizar indicador' });
  }
});

app.delete('/api/indicadores/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await pool.query('DELETE FROM calidad.indicadores WHERE id_indicador=$1', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al eliminar indicador' });
  }
});

// Exportar 1 indicador a PDF sencillo
app.get('/api/indicadores/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query(
      'SELECT * FROM calidad.indicadores WHERE id_indicador=$1 LIMIT 1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=indicador_${id}.pdf`);

    const doc = new PDFDocument({ margin: 36 });
    doc.pipe(res);

    const i = rows[0];
    doc.fontSize(18).text('Ficha de Indicador', { align: 'center' }).moveDown(1);
    const kv = (k, v) =>
      doc
        .fontSize(11)
        .text(`${k}: `, { continued: true })
        .font('Helvetica-Bold')
        .text(v ?? '')
        .font('Helvetica');

    kv('Código', i.codigo);
    kv('Indicador', i.nombre_indicador);
    kv('Status', `${i.status || ''} / ${i.status2 || ''}`);
    kv('Proceso', i.proceso);
    kv('Responsable', i.responsable);
    kv('Impacto', i.objetivo_impacto);
    kv('Unidad', i.unidad_medida);
    kv('Meta', i.meta_objetivo);
    kv('Frecuencia', i.frecuencia_medicion);
    kv('Principal Objeto', i.principal_objeto);
    kv('Código Procedimiento', i.cod_procedimiento);
    kv(
      'Fecha deseada fin',
      i.fecha_deseada_finalizacion
        ? new Date(i.fecha_deseada_finalizacion).toLocaleDateString('es-MX')
        : ''
    );

    doc.moveDown(0.5).font('Helvetica-Bold').text('Descripción');
    doc.font('Helvetica').text(i.descripcion || '');
    doc.moveDown(0.5).font('Helvetica-Bold').text('Estrategia');
    doc.font('Helvetica').text(i.estrategia || '');
    doc.moveDown(0.5).font('Helvetica-Bold').text('Metodología');
    doc.font('Helvetica').text(i.metodologia || '');
    doc.moveDown(0.5).font('Helvetica-Bold').text('Procedimiento');
    doc.font('Helvetica').text(i.procedimiento || '');
    doc.moveDown(0.5).font('Helvetica-Bold').text('Objetivos adicionales');
    doc.font('Helvetica').text(i.objetivos_adicionales || '');

    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al generar PDF' });
  }
});

// ==============================
// Arranque
// ==============================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
);
