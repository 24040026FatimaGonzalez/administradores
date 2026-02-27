// ============================================================
//  app.js — Servidor Principal
// ============================================================

const express       = require('express');
const path          = require('path');
const session       = require('express-session');

const rutasUsuarios = require('./routes/usuarios');
const rutasCursos   = require('./routes/cursos');

const app  = express();
const PORT = 3000;

// ── MIDDLEWARES ──
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret:            'techcourses_secret_2026',
    resave:            false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge:   1000 * 60 * 60 * 4   // 4 horas
    }
}));

// Archivos estáticos (carpeta public)
app.use(express.static(path.join(__dirname, 'public')));

// ── RUTAS API ──
app.use('/api/usuarios', rutasUsuarios);
app.use('/api/cursos',   rutasCursos);

// ── INICIAR ──
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});