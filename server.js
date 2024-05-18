import express from 'express';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Middleware para verificar el token JWT
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Acceso denegado' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
};

app.post('/usuarios/registro', async (req, res) => {
    const { nombre, password, presupuesto } = req.body;

    if (!nombre || !password || !presupuesto) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query('SELECT * FROM usuarios WHERE nombre = $1', [nombre]);

        if (result.rows.length > 0) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        await pool.query('INSERT INTO usuarios (nombre, password_hash, presupuesto) VALUES ($1, $2, $3)', [nombre, hashedPassword, presupuesto]);

        const usuarioResult = await pool.query('SELECT * FROM usuarios WHERE nombre = $1', [nombre]);
        const usuario = usuarioResult.rows[0];
        res.status(201).json({ mensaje: 'Usuario registrado correctamente', presupuesto: usuario.presupuesto });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


app.post('/usuarios/login', async (req, res) => {
    const { nombre, password } = req.body;

    if (!nombre || !password) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE nombre = $1', [nombre]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        const usuario = result.rows[0];
        const isMatch = await bcrypt.compare(password, usuario.password_hash);

        if (!isMatch) {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }

        const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, presupuesto: usuario.presupuesto });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


app.get('/usuario/perfil', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        const usuario = result.rows[0];
        const ingresos = await pool.query('SELECT * FROM ingresos WHERE usuario_id = $1', [req.user.id]);
        const gastos = await pool.query('SELECT * FROM gastos WHERE usuario_id = $1', [req.user.id]);

        res.json({
            nombre: usuario.nombre,
            presupuesto: usuario.presupuesto,
            ingresos: ingresos.rows,
            gastos: gastos.rows
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/ingresos', authenticateToken, async (req, res) => {
    const { cantidad, fecha } = req.body;

    try {
        await pool.query('INSERT INTO ingresos (usuario_id, cantidad, fecha) VALUES ($1, $2, $3)', [req.user.id, cantidad, fecha]);
        res.status(201).json({ mensaje: 'Ingreso registrado correctamente' });
    } catch (error) {
        console.error('Error al registrar ingreso:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/gastos', authenticateToken, async (req, res) => {
    const { nombre, costo, categoria, fecha } = req.body;

    try {
        await pool.query('INSERT INTO gastos (usuario_id, nombre, costo, categoria, fecha) VALUES ($1, $2, $3, $4, $5)', [req.user.id, nombre, costo, categoria, fecha]);
        res.status(201).json({ mensaje: 'Gasto registrado correctamente' });
    } catch (error) {
        console.error('Error al registrar gasto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.listen(PORT, () => {
    console.log(`🔥Server on 🔥 http://localhost:${PORT}`);
});
