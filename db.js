// ============================================================
//  db.js — Conexión a MySQL (XAMPP)
// ============================================================

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host:               'localhost',
    user:               'root',
    password:           '',
    database:           'crud_cursos',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0
});

pool.getConnection()
    .then(c => { console.log('✅ Conectado a cursos_db'); c.release(); })
    .catch(e => console.error('❌ Error al conectar a cursos_db:', e.message));

module.exports = pool;