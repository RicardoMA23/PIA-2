// routes/indicadores.routes.js
const express = require('express');
const router = express.Router();

// Si ya tienes un pool exportado en otro módulo:
const { Pool } = require('pg');
// Ajusta tu config o importa tu pool existente
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // o { user, host, database, password, port, ssl: { rejectUnauthorized:false } }
});

// (Opcional) middleware de auth si ya lo usas en otras rutas:
// const { verifyToken } = require('../middlewares/auth');
// router.use(verifyToken);

/** GET /api/indicadores */
router.get('/', async (_req, res) => {
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

/** POST /api/indicadores */
router.post('/', async (req, res) => {
  try {
    const {
      codigo, nombre_indicador, status, status2, proceso, responsable,
      objetivo_impacto, descripcion, unidad_medida, meta_objetivo,
      frecuencia_medicion, principal_objeto, cod_procedimiento,
      fecha_deseada_finalizacion, estrategia, metodologia,
      procedimiento, objetivos_adicionales
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
      RETURNING *;
    `;
    const vals = [
      codigo || null, nombre_indicador || null, status || null, status2 || null,
      proceso || null, responsable || null, objetivo_impacto || null,
      descripcion || null, unidad_medida || null, meta_objetivo || null,
      frecuencia_medicion || null, principal_objeto || null, cod_procedimiento || null,
      fecha_deseada_finalizacion || null, estrategia || null, metodologia || null,
      procedimiento || null, objetivos_adicionales || null
    ];
    const { rows } = await pool.query(q, vals);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al crear indicador' });
  }
});

/** PUT /api/indicadores/:id */
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      codigo, nombre_indicador, status, status2, proceso, responsable,
      objetivo_impacto, descripcion, unidad_medida, meta_objetivo,
      frecuencia_medicion, principal_objeto, cod_procedimiento,
      fecha_deseada_finalizacion, estrategia, metodologia,
      procedimiento, objetivos_adicionales
    } = req.body;

    const q = `
      UPDATE calidad.indicadores SET
        codigo=$1, nombre_indicador=$2, status=$3, status2=$4, proceso=$5,
        responsable=$6, objetivo_impacto=$7, descripcion=$8, unidad_medida=$9,
        meta_objetivo=$10, frecuencia_medicion=$11, principal_objeto=$12,
        cod_procedimiento=$13, fecha_deseada_finalizacion=$14, estrategia=$15,
        metodologia=$16, procedimiento=$17, objetivos_adicionales=$18
      WHERE id_indicador=$19
      RETURNING *;
    `;
    const vals = [
      codigo || null, nombre_indicador || null, status || null, status2 || null,
      proceso || null, responsable || null, objetivo_impacto || null,
      descripcion || null, unidad_medida || null, meta_objetivo || null,
      frecuencia_medicion || null, principal_objeto || null, cod_procedimiento || null,
      fecha_deseada_finalizacion || null, estrategia || null, metodologia || null,
      procedimiento || null, objetivos_adicionales || null, id
    ];
    const { rows } = await pool.query(q, vals);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al actualizar indicador' });
  }
});

/** DELETE /api/indicadores/:id */
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await pool.query('DELETE FROM calidad.indicadores WHERE id_indicador=$1', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al eliminar indicador' });
  }
});

module.exports = router;
