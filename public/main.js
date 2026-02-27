// ============================================================
//  main.js — Lógica del cliente
//  Maneja: index, login, registro, dashboard (admin), perfil (usuario)
// ============================================================

const pagina = window.location.pathname.split('/').pop();

// ── Utilidad: formatear fecha local sin desfase UTC ──
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.substring(0, 10).split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ============================================================
//  INDEX — Cargar y renderizar cursos
// ============================================================
if (pagina === 'index.html' || pagina === '') {

    function renderCards(cursos) {
        const grid    = document.getElementById('grid-cursos');
        const countEl = document.getElementById('count-label');

        countEl.textContent = `${cursos.length} curso${cursos.length !== 1 ? 's' : ''}`;

        if (cursos.length === 0) {
            grid.innerHTML = `<div class="empty-state">No hay cursos registrados aún.</div>`;
            return;
        }

        grid.innerHTML = cursos.map((c) => {
            const precio    = parseFloat(c.costo);
            const precioNum = precio === 0 ? 'Gratis' : precio.toFixed(2);
            const esPago    = precio > 0;

            return `
            <article class="card-curso">
                <span class="nivel-badge">${c.nivel || 'Básico'}</span>
                <h2 class="curso-title">${c.nombre_curso}</h2>
                <div class="curso-meta">
                    <span class="meta-row">Instructor &nbsp;→&nbsp; <strong>${c.nombre_instructor}</strong></span>
                    <span class="meta-row">Inicio &nbsp;→&nbsp; <strong>${formatDate(c.fecha_inicio)}</strong></span>
                    <span class="meta-row">Nivel &nbsp;→&nbsp; <strong>${c.nivel || 'Básico'}</strong></span>
                </div>
                <div class="curso-footer">
                    <span class="curso-precio">
                        ${esPago ? `<span class="precio-sym">$</span>${precioNum}` : 'Gratis'}
                    </span>
                    <span class="curso-horas">${c.horas}h</span>
                </div>
            </article>`;
        }).join('');
    }

    async function cargarCursos() {
        try {
            const res    = await fetch('/api/cursos');
            const cursos = await res.json();
            renderCards(cursos);
        } catch {
            document.getElementById('grid-cursos').innerHTML =
                `<div class="empty-state">Error al cargar los cursos. Verifica que el servidor esté corriendo.</div>`;
        }
    }

    cargarCursos();
}

// ============================================================
//  LOGIN
// ============================================================
if (pagina === 'login.html') {

    const form    = document.getElementById('form-login');
    const errorEl = document.getElementById('error-msg');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.classList.add('d-none');

        const correo     = document.getElementById('correo').value.trim();
        const contrasena = document.getElementById('contrasena').value;

        try {
            const res  = await fetch('/api/usuarios/login', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ correo, contrasena })
            });

            const data = await res.json();

            if (!res.ok) {
                errorEl.textContent = data.error;
                errorEl.classList.remove('d-none');
                return;
            }

            // Admin → dashboard, usuario normal → perfil
            if (data.usuario.rol === 'admin') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'perfil.html';
            }

        } catch {
            errorEl.textContent = 'Error de conexión con el servidor.';
            errorEl.classList.remove('d-none');
        }
    });
}

// ============================================================
//  REGISTRO
// ============================================================
if (pagina === 'registro.html') {

    const form      = document.getElementById('form-registro');
    const errorEl   = document.getElementById('error-msg');
    const successEl = document.getElementById('success-msg');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.classList.add('d-none');
        successEl.classList.add('d-none');

        const nombre     = document.getElementById('nombre').value.trim();
        const correo     = document.getElementById('correo').value.trim();
        const celular    = document.getElementById('celular').value.trim();
        const contrasena = document.getElementById('contrasena').value;

        try {
            const res  = await fetch('/api/usuarios/registro', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ nombre, correo, celular, contrasena })
            });

            const data = await res.json();

            if (!res.ok) {
                errorEl.textContent = data.error;
                errorEl.classList.remove('d-none');
                return;
            }

            successEl.textContent = data.mensaje + ' Redirigiendo...';
            successEl.classList.remove('d-none');
            form.reset();

            setTimeout(() => { window.location.href = 'login.html'; }, 2000);

        } catch {
            errorEl.textContent = 'Error de conexión con el servidor.';
            errorEl.classList.remove('d-none');
        }
    });
}

// ============================================================
//  PERFIL — Usuario normal
// ============================================================
if (pagina === 'perfil.html') {

    // ── Verificar sesión ──
    async function verificarSesionUsuario() {
        try {
            const res  = await fetch('/api/usuarios/sesion');
            if (!res.ok) return window.location.href = 'login.html';

            const data = await res.json();

            // Si es admin, mandarlo a su dashboard
            if (data.usuario.rol === 'admin') return window.location.href = 'dashboard.html';

            // Mostrar nombre en navbar y saludo
            const nombre = data.usuario.nombre;
            document.getElementById('nombre-usuario').textContent = `👤 ${nombre}`;

            // Saludo con solo el primer nombre
            const primerNombre = nombre.split(' ')[0];
            document.getElementById('saludo-titulo').textContent = `Hola, ${primerNombre}`;

        } catch {
            window.location.href = 'login.html';
        }
    }

    // ── Cerrar sesión ──
    document.getElementById('btn-logout').addEventListener('click', async () => {
        try {
            await fetch('/api/usuarios/logout', { method: 'POST' });
        } catch (e) {}
        // Reemplaza el historial para que el botón "atrás" no regrese al perfil
        window.location.replace('login.html');
    });

    // ── Cargar cursos en tabla ──
    async function cargarCursosUsuario() {
        const tbody   = document.getElementById('tabla-cursos-usuario');
        const countEl = document.getElementById('count-cursos');

        try {
            const res    = await fetch('/api/cursos');
            const cursos = await res.json();

            countEl.textContent = `${cursos.length} curso${cursos.length !== 1 ? 's' : ''}`;

            if (cursos.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-4"
                            style="color:var(--muted);font-family:var(--mono);font-size:0.8rem;">
                            No hay cursos disponibles aún.
                        </td>
                    </tr>`;
                return;
            }

            tbody.innerHTML = cursos.map(c => {
                const precio = parseFloat(c.costo);
                const precioTxt = precio === 0
                    ? '<span style="color:var(--accent2)">Gratis</span>'
                    : `$${precio.toFixed(2)}`;

                return `
                <tr>
                    <td><strong>${c.nombre_curso}</strong></td>
                    <td>${c.nombre_instructor}</td>
                    <td><span class="nivel-tag nivel-${(c.nivel || '').toLowerCase().replace('á','a').replace('é','e')}">${c.nivel || '—'}</span></td>
                    <td>${c.horas}h</td>
                    <td>${formatDate(c.fecha_inicio)}</td>
                    <td>${precioTxt}</td>
                </tr>`;
            }).join('');

        } catch {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:#f47355;">Error al cargar cursos.</td></tr>`;
        }
    }

    verificarSesionUsuario();
    cargarCursosUsuario();
}

// ============================================================
//  DASHBOARD — Solo admin
// ============================================================
if (pagina === 'dashboard.html') {

    // ── Verificar sesión ──
    async function verificarSesion() {
        try {
            const res  = await fetch('/api/usuarios/sesion');
            if (!res.ok) return window.location.href = 'login.html';

            const data = await res.json();

            if (data.usuario.rol !== 'admin') return window.location.href = 'perfil.html';

            document.getElementById('nombre-admin').textContent = `👤 ${data.usuario.nombre}`;

        } catch {
            window.location.href = 'login.html';
        }
    }

    // ── Cerrar sesión ──
    document.getElementById('btn-logout').addEventListener('click', async () => {
        try {
            await fetch('/api/usuarios/logout', { method: 'POST' });
        } catch (e) {}
        window.location.replace('login.html');
    });

    // ── Formatear fecha para input date (YYYY-MM-DD) ──
    function formatearFechaParaInput(fechaStr) {
        if (!fechaStr) return '';
        if (fechaStr.match(/^\d{4}-\d{2}-\d{2}/)) return fechaStr.substring(0, 10);
        const partes = fechaStr.split('/');
        if (partes.length === 3) return `${partes[2]}-${partes[1]}-${partes[0]}`;
        try {
            const fecha = new Date(fechaStr);
            if (!isNaN(fecha.getTime())) return fecha.toISOString().split('T')[0];
        } catch (e) {}
        return '';
    }

    // ── Cargar cursos en tabla ──
    async function cargarTabla() {
        const tbody = document.getElementById('tabla-cursos');
        try {
            const res    = await fetch('/api/cursos');
            const cursos = await res.json();

            if (cursos.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-4"
                            style="color:var(--muted);font-family:var(--mono);font-size:0.8rem;">
                            No hay cursos registrados.
                        </td>
                    </tr>`;
                return;
            }

            tbody.innerHTML = cursos.map(c => `
                <tr>
                    <td>${c.nombre_curso}</td>
                    <td>${c.nombre_instructor}</td>
                    <td>${c.horas}h / ${c.nivel}</td>
                    <td>${formatDate(c.fecha_inicio)}</td>
                    <td>$${parseFloat(c.costo).toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1"
                                onclick="editarCurso(${c.id})">Editar</button>
                        <button class="btn btn-sm btn-outline-danger"
                                onclick="eliminarCurso(${c.id})">Eliminar</button>
                    </td>
                </tr>
            `).join('');

        } catch {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:#f47355;">Error al cargar cursos.</td></tr>`;
        }
    }

    // ── Guardar curso (crear o editar) ──
    const form        = document.getElementById('form-curso');
    const errorEl     = document.getElementById('form-error');
    const successEl   = document.getElementById('form-success');
    const btnCancelar = document.getElementById('btn-cancelar');
    const formTitulo  = document.getElementById('form-titulo');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.classList.add('d-none');
        successEl.classList.add('d-none');

        const id          = document.getElementById('curso-id').value;
        const fechaInicio = document.getElementById('fecha-inicio').value;

        if (!fechaInicio) {
            errorEl.textContent = 'La fecha de inicio es obligatoria.';
            errorEl.classList.remove('d-none');
            return;
        }

        const body = {
            nombre_curso:      document.getElementById('nombre-curso').value.trim(),
            nombre_instructor: document.getElementById('instructor').value.trim(),
            horas:             parseInt(document.getElementById('horas').value),
            nivel:             document.getElementById('nivel').value,
            fecha_inicio:      fechaInicio,
            costo:             parseFloat(document.getElementById('costo').value)
        };

        if (!body.nombre_curso || !body.nombre_instructor || !body.horas || !body.nivel || isNaN(body.costo)) {
            errorEl.textContent = 'Todos los campos son obligatorios.';
            errorEl.classList.remove('d-none');
            return;
        }

        const url    = id ? `/api/cursos/${id}` : '/api/cursos';
        const method = id ? 'PUT' : 'POST';

        try {
            const res  = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) {
                errorEl.textContent = data.error || 'Error al guardar el curso.';
                errorEl.classList.remove('d-none');
                return;
            }

            successEl.textContent = data.mensaje || 'Curso guardado correctamente.';
            successEl.classList.remove('d-none');
            form.reset();
            document.getElementById('curso-id').value = '';
            formTitulo.textContent = 'Nuevo Curso';
            btnCancelar.classList.add('d-none');
            cargarTabla();

            setTimeout(() => successEl.classList.add('d-none'), 3000);

        } catch (err) {
            console.error('Error:', err);
            errorEl.textContent = 'Error de conexión con el servidor.';
            errorEl.classList.remove('d-none');
        }
    });

    // ── Cancelar edición ──
    btnCancelar.addEventListener('click', () => {
        form.reset();
        document.getElementById('curso-id').value = '';
        formTitulo.textContent = 'Nuevo Curso';
        btnCancelar.classList.add('d-none');
        errorEl.classList.add('d-none');
        successEl.classList.add('d-none');
    });

    // ── Editar curso ──
    window.editarCurso = async (id) => {
        try {
            const res    = await fetch('/api/cursos');
            const cursos = await res.json();
            const c      = cursos.find(x => x.id === id);
            if (!c) return;

            document.getElementById('curso-id').value     = c.id;
            document.getElementById('nombre-curso').value = c.nombre_curso;
            document.getElementById('instructor').value   = c.nombre_instructor;
            document.getElementById('horas').value        = c.horas;
            document.getElementById('nivel').value        = c.nivel;
            document.getElementById('fecha-inicio').value = formatearFechaParaInput(c.fecha_inicio);
            document.getElementById('costo').value        = c.costo;

            formTitulo.textContent = 'Editar Curso';
            btnCancelar.classList.remove('d-none');
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch {
            alert('Error al cargar los datos del curso.');
        }
    };

    // ── Eliminar curso ──
    window.eliminarCurso = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este curso?')) return;

        try {
            const res  = await fetch(`/api/cursos/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) return alert(data.error);

            cargarTabla();

        } catch {
            alert('Error al eliminar el curso.');
        }
    };

    // ── Iniciar ──
    verificarSesion();
    cargarTabla();
}