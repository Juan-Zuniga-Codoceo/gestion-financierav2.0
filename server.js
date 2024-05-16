import express from 'express';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const usuariosFilePath = join(__dirname, 'data', 'usuarios.json');

if (!fs.existsSync(join(__dirname, 'data'))) {
    fs.mkdirSync(join(__dirname, 'data'));
}

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Función para obtener el próximo ID de usuario disponible
function obtenerProximoIdUsuario(usuarios) {
    return usuarios.reduce((max, usuario) => (usuario.id > max ? usuario.id : max), 0) + 1;
}

app.post('/usuarios/registro', (req, res) => {
    const { nombre, presupuesto } = req.body;

    if (!nombre || !presupuesto) {
        return res.status(400).json({ error: 'Nombre y presupuesto son campos requeridos' });
    }

    try {
        let usuarios = [];
        if (fs.existsSync(usuariosFilePath)) {
            usuarios = JSON.parse(fs.readFileSync(usuariosFilePath, 'utf8'));
        }

        const usuarioExistenteIndex = usuarios.findIndex(user => user.nombre === nombre);
        if (usuarioExistenteIndex !== -1) {
            usuarios[usuarioExistenteIndex].presupuesto = parseFloat(presupuesto);
        } else {
            usuarios.push({ nombre, presupuesto: parseFloat(presupuesto) });
        }

        fs.writeFileSync(usuariosFilePath, JSON.stringify(usuarios, null, 2), 'utf8');

        const presupuestoActualizado = parseFloat(presupuesto);
        res.status(201).json({ mensaje: 'Usuario registrado correctamente o presupuesto actualizado', presupuesto: presupuestoActualizado });

    } catch (error) {
        console.error('Error al registrar usuario o actualizar presupuesto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

function obtenerPresupuestoInicial() {
    try {
        const usuarios = JSON.parse(fs.readFileSync(usuariosFilePath, 'utf8'));
        if (usuarios.length > 0) {
            return usuarios[0].presupuesto;
        }
        return 0;
    } catch (error) {
        console.error('Error al obtener el presupuesto inicial:', error);
        return 0;
    }
}

app.get('/presupuesto/inicial', (req, res) => {
    const presupuestoInicial = obtenerPresupuestoInicial();
    res.json({ presupuestoInicial });
});

app.listen(PORT, () => {
    console.log(`🔥Server on 🔥 http://localhost:${PORT}`);
});

