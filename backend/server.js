// server.js (versión mínima y comprobada)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json()); // <- NECESARIO para Body JSON

// Logger para ver exactamente qué llega
app.use((req, _res, next) => {
  console.log('> ', req.method, req.url);
  next();
});

// Conexión a Postgres
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'gestion_calidad',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
});

// Ruta de prueba
app.get('/', (_req, res) => res.send('✅ API OK'));

// GET de diagnóstico (por si estás tecleando en navegador)
app.get('/auth/login', (_req, res) => {
  res.status(405).send('Usa POST /auth/login con JSON');
});

// LOGIN real (POST)
app.post('/auth/login', async (req, res) => {
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

    const token = jwt.sign({ id: u.id_usuario, correo: u.correo }, process.env.JWT_SECRET || 'secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '2h'
    });

    res.json({
      message: 'Login exitoso',
      token,
      usuario: { id: u.id_usuario, nombre: u.nombre, correo: u.correo, puesto: u.puesto }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'login_failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
