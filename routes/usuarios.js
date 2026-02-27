// ============================================================
//  routes/usuarios.js — Login, registro, sesión, logout
// ============================================================

const express          = require('express');
const router           = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

const SALT_ROUNDS = 10;

// ── POST /api/usuarios/login ──
router.post('/login', async (req, res) => {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena)
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });

    try {
        const [rows] = await db.query(
            'SELECT id, nombre, correo, password, rol FROM usuarios WHERE correo = ?',
            [correo]
        );

        if (rows.length === 0)
            return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

        const usuario  = rows[0];
        const coincide = await bcrypt.compare(contrasena, usuario.password);

        if (!coincide)
            return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

        // Guardar sesión (sin exponer el hash)
        req.session.usuario = {
            id:     usuario.id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol:    usuario.rol
        };

        res.json({ mensaje: 'Sesión iniciada.', usuario: req.session.usuario });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ── POST /api/usuarios/registro ──
router.post('/registro', async (req, res) => {
    const { nombre, correo, celular, contrasena } = req.body;

    if (!nombre || !correo || !contrasena)
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });

    if (contrasena.length < 4)
        return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres.' });

    try {
        const [existe] = await db.query(
            'SELECT id FROM usuarios WHERE correo = ?', [correo]
        );

        if (existe.length > 0)
            return res.status(409).json({ error: 'El correo ya está registrado.' });

        const hash = await bcrypt.hash(contrasena, SALT_ROUNDS);

        await db.query(
            'INSERT INTO usuarios (nombre, correo, celular, password, rol) VALUES (?, ?, ?, ?, ?)',
            [nombre, correo, celular || null, hash, 'usuario']
        );

        res.status(201).json({ mensaje: 'Cuenta creada. Ya puedes iniciar sesión.' });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ── POST /api/usuarios/logout ──
router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ mensaje: 'Sesión cerrada.' });
    });
});

// ── GET /api/usuarios/sesion ──
// Devuelve el usuario activo o 401 si no hay sesión
router.get('/sesion', (req, res) => {
    if (req.session && req.session.usuario)
        return res.json({ usuario: req.session.usuario });

    res.status(401).json({ error: 'Sin sesión activa.' });
});

module.exports = router;