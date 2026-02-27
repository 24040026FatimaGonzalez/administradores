// ============================================================
//  routes/cursos.js — CRUD de cursos
//  Solo el admin puede crear, editar y eliminar
// ============================================================

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ── Middleware: verificar que hay sesión activa ──
function soloAutenticado(req, res, next) {
    if (req.session && req.session.usuario)
        return next();
    res.status(401).json({ error: 'Debes iniciar sesión.' });
}

// ── Middleware: verificar que es admin ──
function soloAdmin(req, res, next) {
    if (req.session && req.session.usuario && req.session.usuario.rol === 'admin')
        return next();
    res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
}

// ── GET /api/cursos — Obtener todos los cursos (público) ──
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM cursos ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener cursos:', error);
        res.status(500).json({ error: 'Error al obtener los cursos.' });
    }
});

// ── POST /api/cursos — Registrar nuevo curso (solo admin) ──
router.post('/', soloAdmin, async (req, res) => {
    const { nombre_curso, nombre_instructor, horas, nivel, fecha_inicio, costo } = req.body;

    if (!nombre_curso || !nombre_instructor || !horas || !nivel || !fecha_inicio || costo === undefined)
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });

    try {
        const sql = `INSERT INTO cursos 
                     (nombre_curso, nombre_instructor, horas, nivel, fecha_inicio, costo)
                     VALUES (?, ?, ?, ?, ?, ?)`;

        await db.query(sql, [nombre_curso, nombre_instructor, horas, nivel, fecha_inicio, costo]);
        res.status(201).json({ mensaje: 'Curso registrado con éxito.' });

    } catch (error) {
        console.error('Error al registrar curso:', error);
        res.status(500).json({ error: 'Error al registrar el curso.' });
    }
});

// ── PUT /api/cursos/:id — Editar curso (solo admin) ──
router.put('/:id', soloAdmin, async (req, res) => {
    const { id } = req.params;
    const { nombre_curso, nombre_instructor, horas, nivel, fecha_inicio, costo } = req.body;

    try {
        const sql = `UPDATE cursos SET
                     nombre_curso = ?, nombre_instructor = ?,
                     horas = ?, nivel = ?, fecha_inicio = ?, costo = ?
                     WHERE id = ?`;

        const [resultado] = await db.query(sql,
            [nombre_curso, nombre_instructor, horas, nivel, fecha_inicio, costo, id]
        );

        if (resultado.affectedRows === 0)
            return res.status(404).json({ error: 'Curso no encontrado.' });

        res.json({ mensaje: 'Curso actualizado correctamente.' });

    } catch (error) {
        console.error('Error al actualizar curso:', error);
        res.status(500).json({ error: 'Error al actualizar el curso.' });
    }
});

// ── DELETE /api/cursos/:id — Eliminar curso (solo admin) ──
router.delete('/:id', soloAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const [resultado] = await db.query('DELETE FROM cursos WHERE id = ?', [id]);

        if (resultado.affectedRows === 0)
            return res.status(404).json({ error: 'Curso no encontrado.' });

        res.json({ mensaje: 'Curso eliminado correctamente.' });

    } catch (error) {
        console.error('Error al eliminar curso:', error);
        res.status(500).json({ error: 'Error al eliminar el curso.' });
    }
});

module.exports = router;