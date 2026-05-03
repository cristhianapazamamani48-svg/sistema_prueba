const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (frontend)
app.use(express.static(path.join(__dirname)));

// Conexión a MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // IMPORTANTE: Cambiar si tu DB tiene clave
    database: process.env.DB_NAME || 'task_manager_db'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a MySQL:', err.message);
        console.log('   Asegúrate de que MySQL esté encendido y hayas ejecutado database.sql');
        return;
    }
    console.log('✅ Conectado a la base de datos MySQL');
});

// Rutas de la API (Backend)
// 1. Obtener todas las tareas
app.get('/api/tasks', (req, res) => {
    const query = 'SELECT * FROM tasks ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. Crear una nueva tarea
app.post('/api/tasks', (req, res) => {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'El título es requerido' });

    const query = 'INSERT INTO tasks (title, description) VALUES (?, ?)';
    db.query(query, [title, description], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: results.insertId, title, description, is_completed: 0 });
    });
});

// 3. Marcar como completada/pendiente
app.put('/api/tasks/:id/toggle', (req, res) => {
    const { id } = req.params;
    const { is_completed } = req.body;
    
    const query = 'UPDATE tasks SET is_completed = ? WHERE id = ?';
    db.query(query, [is_completed, id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Tarea actualizada' });
    });
});

// 4. Eliminar tarea
app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM tasks WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Tarea eliminada' });
    });
});

// Ruta principal para enviar al frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
