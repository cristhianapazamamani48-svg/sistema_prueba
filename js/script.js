// URL de nuestro servidor Express Node.js (Si lo dejas vacío "/" usa el mismo host)
const API_URL = '/api/tasks';

// Referencias a elementos del DOM
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-desc');
const taskList = document.getElementById('task-list');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const taskStats = document.getElementById('task-stats');

// Estado local para mantener las tareas
let tasks = [];

// Iniciar aplicación obteniendo tareas
document.addEventListener('DOMContentLoaded', fetchTasks);

// Manejar el envío del formulario
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    const description = taskDescInput.value.trim();
    
    if (title) {
        await addTask({ title, description });
        taskTitleInput.value = '';
        taskDescInput.value = '';
        taskTitleInput.focus();
    }
});

// Peticiones a la API Backend
async function fetchTasks() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al cargar tareas de la base de datos');
        
        tasks = await response.json();
        renderTasks();
    } catch (error) {
        console.error('Error fetching tasks:', error);
        loadingState.innerHTML = `
            <span style="color: var(--danger-color); font-weight:600;">
                <i class="ri-error-warning-line"></i> Error de conexión.<br>
                <small style="color:var(--text-muted); font-weight:normal;">Asegúrate de ejecutar 'node server.js' y tener MySQL corriendo.</small>
            </span>
        `;
    }
}

async function addTask(taskData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) throw new Error('Error al crear tarea');
        
        const newTask = await response.json();
        tasks.unshift(newTask); // Añadir al principio del arreglo
        renderTasks();
    } catch (error) {
        console.error('Error adding task:', error);
        alert('Hubo un error al crear la tarea. Revisa la consola.');
    }
}

window.toggleTaskStatus = async function(id, currentStatus) {
    // Actualización visual inmediata (Optimistic UI update)
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
        tasks[taskIndex].is_completed = !currentStatus;
        renderTasks();
    }

    try {
        await fetch(`${API_URL}/${id}/toggle`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_completed: !currentStatus })
        });
    } catch (error) {
        console.error('Error toggling task:', error);
        // Revertir si hay error
        if (taskIndex !== -1) {
            tasks[taskIndex].is_completed = currentStatus;
            renderTasks();
        }
        alert('Error al actualizar la base de datos.');
    }
};

window.deleteTask = async function(id) {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;
    
    // Actualización visual inmediata
    const previousTasks = [...tasks];
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();

    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.error('Error deleting task:', error);
        // Revertir si hay error
        tasks = previousTasks;
        renderTasks();
        alert('Error al eliminar la base de datos.');
    }
};

// Funciones de Renderizado
function renderTasks() {
    loadingState.classList.add('hidden');
    
    if (tasks.length === 0) {
        emptyState.classList.remove('hidden');
        taskList.innerHTML = '';
        updateStats();
        return;
    }
    
    emptyState.classList.add('hidden');
    taskList.innerHTML = '';
    
    tasks.forEach((task, index) => {
        // En MySQL, booleanos a veces vienen como 1/0
        const isCompleted = task.is_completed === 1 || task.is_completed === true;
        
        const li = document.createElement('li');
        li.className = `task-item ${isCompleted ? 'completed' : ''}`;
        li.style.animationDelay = `${index * 0.05}s`; // Efecto cascada
        
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" 
                   ${isCompleted ? 'checked' : ''} 
                   onchange="window.toggleTaskStatus(${task.id}, ${isCompleted})">
            
            <div class="task-content">
                <h3>${escapeHTML(task.title)}</h3>
                ${task.description ? `<p>${escapeHTML(task.description)}</p>` : ''}
            </div>
            
            <div class="task-actions">
                <button class="btn-icon" onclick="window.deleteTask(${task.id})" title="Eliminar tarea">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `;
        
        taskList.appendChild(li);
    });
    
    updateStats();
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.is_completed === 1 || t.is_completed === true).length;
    taskStats.textContent = `${completed} completadas de ${total}`;
}

// Utilidad de seguridad contra XSS
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
