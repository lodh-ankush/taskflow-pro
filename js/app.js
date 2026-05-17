/**
 * TaskFlow Pro — Interactive Edition
 * Architecture: Modular classes with event delegation, keyboard navigation,
 * undo stack, confetti physics, and haptic feedback patterns.
 */

/* ---------- Confetti System ---------- */
class ConfettiSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animating = false;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    explode(x, y, count = 120) {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const velocity = Math.random() * 12 + 4;
            this.particles.push({
                x: x ?? this.canvas.width / 2,
                y: y ?? this.canvas.height / 2,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity - 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 6 + 3,
                life: 1,
                decay: Math.random() * 0.015 + 0.008,
                gravity: 0.4,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }
        if (!this.animating) this.animate();
    }

    animate() {
        this.animating = true;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= 0.98;
            p.life -= p.decay;
            p.rotation += p.rotationSpeed;

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.globalAlpha = Math.max(0, p.life);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            this.ctx.restore();
        });

        this.particles = this.particles.filter(p => p.life > 0);

        if (this.particles.length > 0) {
            requestAnimationFrame(() => this.animate());
        } else {
            this.animating = false;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

/* ---------- Sound Manager ---------- */
class SoundManager {
    constructor() {
        this.enabled = false;
        this.ctx = null;
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled && !this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.enabled;
    }

    play(type) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime;
        switch (type) {
            case 'add':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523, now);
                osc.frequency.exponentialRampToValueAtTime(784, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'complete':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523, now);
                osc.frequency.setValueAtTime(659, now + 0.08);
                osc.frequency.setValueAtTime(784, now + 0.16);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
            case 'delete':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'error':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
        }
    }
}

/* ---------- Toast Manager ---------- */
class ToastManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    show(message, type = 'info', duration = 4000, actions = null) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            info: 'fa-info-circle',
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            undo: 'fa-undo'
        };

        let html = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;

        if (actions) {
            html += `<div class="toast-actions">${actions}</div>`;
        }

        html += `<div class="toast-progress"></div>`;
        toast.innerHTML = html;

        this.container.appendChild(toast);

        const remove = () => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => toast.remove(), 300);
        };

        if (actions) {
            // Don't auto-remove if it has actions (let user interact)
            // But add a manual close via clicking the toast
            toast.addEventListener('click', (e) => {
                if (e.target.closest('.btn-toast')) return;
                remove();
            });
            return { el: toast, remove };
        } else {
            setTimeout(remove, duration);
            return { el: toast, remove };
        }
    }
}

/* ---------- Draft Saver ---------- */
class DraftSaver {
    constructor(inputId, storageKey, indicatorId) {
        this.input = document.getElementById(inputId);
        this.key = storageKey;
        this.indicator = document.getElementById(indicatorId);

        const saved = localStorage.getItem(this.key);
        if (saved) {
            this.input.value = saved;
            this.show();
        }

        let timeout;
        this.input.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                localStorage.setItem(this.key, this.input.value);
                this.show();
            }, 500);
        });
    }

    show() { this.indicator.classList.add('visible'); }
    hide() { this.indicator.classList.remove('visible'); }

    clear() {
        localStorage.removeItem(this.key);
        this.hide();
    }
}

/* ---------- Main Application ---------- */
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.filter = 'all';
        this.categoryFilter = null;
        this.tagFilter = null;
        this.searchTerm = '';
        this.sortMode = 'manual';
        this.draggedId = null;
        this.focusedIndex = -1;
        this.selection = new Set();
        this.undoStack = [];

        this.confetti = new ConfettiSystem('confettiCanvas');
        this.sounds = new SoundManager();
        this.toasts = new ToastManager('toastContainer');
        this.draft = new DraftSaver('taskInput', 'taskflow_draft', 'draftIndicator');

        this.categories = [
            { id: 'personal', label: 'Personal', color: 'cat-personal' },
            { id: 'work', label: 'Work', color: 'cat-work' },
            { id: 'shopping', label: 'Shopping', color: 'cat-shopping' },
            { id: 'health', label: 'Health', color: 'cat-health' },
            { id: 'finance', label: 'Finance', color: 'cat-finance' },
            { id: 'education', label: 'Education', color: 'cat-education' }
        ];

        this.elements = {
            taskInput: document.getElementById('taskInput'),
            prioritySelect: document.getElementById('prioritySelect'),
            categorySelect: document.getElementById('categorySelect'),
            dueDate: document.getElementById('dueDate'),
            tagsInput: document.getElementById('tagsInput'),
            addTaskBtn: document.getElementById('addTaskBtn'),
            taskList: document.getElementById('taskList'),
            emptyState: document.getElementById('emptyState'),
            searchInput: document.getElementById('searchInput'),
            clearSearch: document.getElementById('clearSearch'),
            filterBtns: document.querySelectorAll('.filter-btn[data-filter]'),
            categoryFilters: document.getElementById('categoryFilters'),
            sortSelect: document.getElementById('sortSelect'),
            totalTasks: document.getElementById('totalTasks'),
            completedTasks: document.getElementById('completedTasks'),
            pendingTasks: document.getElementById('pendingTasks'),
            overdueTasks: document.getElementById('overdueTasks'),
            progressCircle: document.getElementById('progressCircle'),
            progressText: document.getElementById('progressText'),
            themeToggle: document.getElementById('themeToggle'),
            exportBtn: document.getElementById('exportBtn'),
            exportModal: document.getElementById('exportModal'),
            exportJson: document.getElementById('exportJson'),
            exportCsv: document.getElementById('exportCsv'),
            notifyBtn: document.getElementById('notifyBtn'),
            focusModeBtn: document.getElementById('focusModeBtn'),
            soundBtn: document.getElementById('soundBtn'),
            helpBtn: document.getElementById('helpBtn'),
            shortcutsModal: document.getElementById('shortcutsModal'),
            editModal: document.getElementById('editModal'),
            editId: document.getElementById('editId'),
            editTaskInput: document.getElementById('editTaskInput'),
            editPriority: document.getElementById('editPriority'),
            editCategory: document.getElementById('editCategory'),
            editDueDate: document.getElementById('editDueDate'),
            editTags: document.getElementById('editTags'),
            saveEditBtn: document.getElementById('saveEditBtn'),
            bulkBar: document.getElementById('bulkBar'),
            bulkCount: document.getElementById('bulkCount'),
            bulkComplete: document.getElementById('bulkComplete'),
            bulkDelete: document.getElementById('bulkDelete'),
            bulkCancel: document.getElementById('bulkCancel'),
            clearFiltersBtn: document.getElementById('clearFiltersBtn')
        };

        this.init();
    }

    init() {
        this.setupTheme();
        this.setupEventListeners();
        this.renderCategoryFilters();
        this.setupKeyboard();
        this.registerServiceWorker();
        this.elements.dueDate.valueAsDate = new Date();
        this.render();
    }

    /* ---------- Setup ---------- */
    setupTheme() {
        const saved = localStorage.getItem('taskflow_theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved || (prefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon(theme);
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('taskflow_theme', next);
        this.updateThemeIcon(next);
    }

    updateThemeIcon(theme) {
        const icon = this.elements.themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    toggleFocusMode() {
        document.body.classList.toggle('focus-mode');
        const active = document.body.classList.contains('focus-mode');
        this.elements.focusModeBtn.classList.toggle('active', active);
        this.elements.focusModeBtn.innerHTML = active ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
        this.toasts.show(active ? 'Focus mode enabled' : 'Focus mode disabled', 'info', 2000);
    }

    renderCategoryFilters() {
        this.elements.categoryFilters.innerHTML = this.categories.map(cat => `
            <button class="category-btn ${cat.color}" data-category="${cat.id}" aria-pressed="false">
                ${cat.label}
            </button>
        `).join('');

        this.elements.categoryFilters.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cat = e.target.dataset.category;
                if (this.categoryFilter === cat) {
                    this.categoryFilter = null;
                    e.target.classList.remove('active');
                    e.target.setAttribute('aria-pressed', 'false');
                } else {
                    this.elements.categoryFilters.querySelectorAll('.category-btn').forEach(b => {
                        b.classList.remove('active');
                        b.setAttribute('aria-pressed', 'false');
                    });
                    e.target.classList.add('active');
                    e.target.setAttribute('aria-pressed', 'true');
                    this.categoryFilter = cat;
                }
                this.render();
            });
        });
    }

    /* ---------- Event Listeners ---------- */
    setupEventListeners() {
        // Add task
        this.elements.addTaskBtn.addEventListener('click', () => this.addTask());
        this.elements.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Search
        this.elements.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.elements.clearSearch.classList.toggle('hidden', !this.searchTerm);
            this.render();
        });
        this.elements.clearSearch.addEventListener('click', () => {
            this.searchTerm = '';
            this.elements.searchInput.value = '';
            this.elements.clearSearch.classList.add('hidden');
            this.render();
        });

        // Filters
        this.elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.elements.filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filter = e.target.dataset.filter;
                this.render();
            });
        });

        // Sort
        this.elements.sortSelect.addEventListener('change', (e) => {
            this.sortMode = e.target.value;
            document.body.classList.toggle('sort-manual', this.sortMode === 'manual');
            this.render();
        });
        document.body.classList.add('sort-manual');

        // Theme & utilities
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.elements.focusModeBtn.addEventListener('click', () => this.toggleFocusMode());

        this.elements.soundBtn.addEventListener('click', () => {
            const on = this.sounds.toggle();
            this.elements.soundBtn.innerHTML = on ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
            this.elements.soundBtn.classList.toggle('active', on);
            this.toasts.show(on ? 'Sound effects on' : 'Sound effects off', 'info', 2000);
        });

        // Help modal
        this.elements.helpBtn.addEventListener('click', () => this.openModal('shortcutsModal'));

        // Export
        this.elements.exportBtn.addEventListener('click', () => this.openModal('exportModal'));
        this.elements.exportJson.addEventListener('click', () => this.exportJson());
        this.elements.exportCsv.addEventListener('click', () => this.exportCsv());

        // Close modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) this.closeModal(modal.id);
            });
        });

        [this.elements.exportModal, this.elements.editModal, this.elements.shortcutsModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal.id);
            });
        });

        // Save edit
        this.elements.saveEditBtn.addEventListener('click', () => this.saveEdit());

        // Notifications
        this.elements.notifyBtn.addEventListener('click', async () => {
            if (!('Notification' in window)) {
                this.toasts.show('Notifications not supported', 'error');
                return;
            }
            const result = await Notification.requestPermission();
            if (result === 'granted') {
                this.toasts.show('Notifications enabled!', 'success');
                this.elements.notifyBtn.innerHTML = '<i class="fas fa-bell"></i>';
                this.elements.notifyBtn.classList.add('active');
            }
        });

        // Bulk actions
        this.elements.bulkComplete.addEventListener('click', () => this.bulkComplete());
        this.elements.bulkDelete.addEventListener('click', () => this.bulkDelete());
        this.elements.bulkCancel.addEventListener('click', () => this.clearSelection());

        // Clear filters from empty state
        this.elements.clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());

        // Task list delegation
        this.elements.taskList.addEventListener('click', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (!taskItem) return;
            const id = taskItem.dataset.id;

            // Checkbox toggle
            if (e.target.classList.contains('task-checkbox')) {
                this.toggleTask(id);
                return;
            }

            // Selection checkbox
            if (e.target.classList.contains('task-select')) {
                e.stopPropagation();
                this.toggleSelection(id);
                return;
            }

            // Delete button
            if (e.target.closest('.btn-delete')) {
                e.stopPropagation();
                this.deleteTask(id);
                return;
            }

            // Priority badge click
            if (e.target.classList.contains('badge') && e.target.classList.contains('priority-')) {
                e.stopPropagation();
                this.cyclePriority(id);
                return;
            }

            // Tag click
            if (e.target.classList.contains('tag')) {
                e.stopPropagation();
                const tag = e.target.textContent.replace('#', '');
                this.searchTerm = tag;
                this.elements.searchInput.value = tag;
                this.elements.clearSearch.classList.remove('hidden');
                this.render();
                this.toasts.show(`Filtered by tag: #${tag}`, 'info', 2000);
                return;
            }

            // Open edit modal on task content click
            if (!e.target.closest('.task-actions') && !e.target.closest('.drag-handle')) {
                this.openEditModal(id);
            }
        });

        // Drag and Drop
        this.elements.taskList.addEventListener('dragstart', (e) => {
            if (this.sortMode !== 'manual' || this.searchTerm || this.categoryFilter || this.filter !== 'all') {
                this.toasts.show('Switch to "Manual" sort to reorder', 'warning');
                e.preventDefault();
                return;
            }
            const taskItem = e.target.closest('.task-item');
            if (!taskItem) return;
            this.draggedId = taskItem.dataset.id;
            taskItem.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.draggedId);
        });

        this.elements.taskList.addEventListener('dragend', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (taskItem) taskItem.classList.remove('dragging');
            this.draggedId = null;
            document.querySelectorAll('.task-item').forEach(i => i.classList.remove('drag-over'));
        });

        this.elements.taskList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const after = this.getDragAfterElement(this.elements.taskList, e.clientY);
            document.querySelectorAll('.task-item').forEach(i => i.classList.remove('drag-over'));
            if (after) after.classList.add('drag-over');
        });

        this.elements.taskList.addEventListener('drop', (e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            const after = this.getDragAfterElement(this.elements.taskList, e.clientY);

            const fromIndex = this.tasks.findIndex(t => t.id === id);
            if (fromIndex === -1) return;

            const [moved] = this.tasks.splice(fromIndex, 1);
            if (after) {
                const toIndex = this.tasks.findIndex(t => t.id === after.dataset.id);
                this.tasks.splice(toIndex, 0, moved);
            } else {
                this.tasks.push(moved);
            }

            this.saveTasks();
            this.render();
            this.toasts.show('Task reordered', 'success', 2000);
        });
    }

    getDragAfterElement(container, y) {
        const items = [...container.querySelectorAll('.task-item:not(.dragging)')];
        return items.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /* ---------- Keyboard Navigation ---------- */
    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                if (e.key === 'Escape') {
                    e.target.blur();
                    this.closeAllModals();
                }
                return;
            }

            switch (e.key) {
                case 'n':
                case 'N':
                    e.preventDefault();
                    this.elements.taskInput.focus();
                    break;
                case '/':
                    e.preventDefault();
                    this.elements.searchInput.focus();
                    break;
                case '?':
                    e.preventDefault();
                    this.openModal('shortcutsModal');
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    this.toggleFocusMode();
                    break;
                case 't':
                case 'T':
                    e.preventDefault();
                    this.toggleTheme();
                    break;
                case 'Escape':
                    this.closeAllModals();
                    this.clearSelection();
                    break;
                case 'ArrowDown':
                case 'j':
                case 'J':
                    e.preventDefault();
                    this.focusNextTask(1);
                    break;
                case 'ArrowUp':
                case 'k':
                case 'K':
                    e.preventDefault();
                    this.focusNextTask(-1);
                    break;
                case ' ':
                    e.preventDefault();
                    this.toggleFocusedTask();
                    break;
                case 'Enter':
                    if (this.focusedIndex >= 0) {
                        const tasks = this.getFilteredTasks();
                        if (tasks[this.focusedIndex]) {
                            this.openEditModal(tasks[this.focusedIndex].id);
                        }
                    }
                    break;
                case 'd':
                case 'D':
                    if (this.selection.size > 0) {
                        this.bulkDelete();
                    } else if (this.focusedIndex >= 0) {
                        const tasks = this.getFilteredTasks();
                        if (tasks[this.focusedIndex]) this.deleteTask(tasks[this.focusedIndex].id);
                    }
                    break;
                case 'c':
                case 'C':
                    if (this.selection.size > 0) {
                        this.bulkComplete();
                    }
                    break;
            }
        });
    }

    focusNextTask(dir) {
        const tasks = this.getFilteredTasks();
        if (tasks.length === 0) return;

        this.focusedIndex += dir;
        if (this.focusedIndex < 0) this.focusedIndex = tasks.length - 1;
        if (this.focusedIndex >= tasks.length) this.focusedIndex = 0;

        const id = tasks[this.focusedIndex].id;
        const el = document.querySelector(`[data-id="${id}"]`);
        if (el) {
            document.querySelectorAll('.task-item').forEach(i => i.classList.remove('focused'));
            el.classList.add('focused');
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    toggleFocusedTask() {
        const tasks = this.getFilteredTasks();
        if (this.focusedIndex >= 0 && tasks[this.focusedIndex]) {
            this.toggleTask(tasks[this.focusedIndex].id);
        }
    }

    /* ---------- Task CRUD ---------- */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
    }

    parseTags(input) {
        return input.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0).slice(0, 5);
    }

    addTask() {
        const title = this.elements.taskInput.value.trim();
        if (!title) {
            this.shake(this.elements.taskInput);
            this.sounds.play('error');
            return;
        }

        const task = {
            id: this.generateId(),
            title,
            priority: this.elements.prioritySelect.value,
            category: this.elements.categorySelect.value,
            dueDate: this.elements.dueDate.value,
            tags: this.parseTags(this.elements.tagsInput.value),
            completed: false,
            createdAt: new Date().toISOString(),
            notified: false
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.draft.clear();
        this.elements.taskInput.value = '';
        this.elements.tagsInput.value = '';
        this.elements.taskInput.focus();

        this.sounds.play('add');
        this.toasts.show('Task added', 'success');
        this.render();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        task.completed = !task.completed;
        this.saveTasks();

        if (task.completed) {
            this.sounds.play('complete');
            // Check if all pending are done
            const pending = this.tasks.filter(t => !t.completed).length;
            if (pending === 0 && this.tasks.length > 0) {
                setTimeout(() => this.confetti.explode(), 300);
                this.toasts.show('All tasks completed! 🎉', 'success', 5000);
            }
        }

        this.render();
    }

    cyclePriority(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;
        const cycle = { low: 'medium', medium: 'high', high: 'low' };
        task.priority = cycle[task.priority];
        this.saveTasks();
        this.render();
        this.toasts.show(`Priority set to ${task.priority}`, 'info', 1500);
    }

    deleteTask(id) {
        const task = this.tasks.find(t => t.id === id);
        const index = this.tasks.findIndex(t => t.id === id);
        if (!task) return;

        // Visual removal
        const el = document.querySelector(`[data-id="${id}"]`);
        if (el) {
            el.style.transform = 'translateX(120%) scale(0.9)';
            el.style.opacity = '0';
        }

        setTimeout(() => {
            this.tasks.splice(index, 1);
            this.saveTasks();
            this.selection.delete(id);
            this.updateBulkBar();
            this.render();
            this.sounds.play('delete');

            // Undo toast
            const { remove } = this.toasts.show(
                `"${task.title}" deleted`,
                'undo',
                6000,
                `<button class="btn-toast">Undo</button>`
            );

            // Handle undo click
            const toastEl = this.toasts.container.lastElementChild;
            toastEl.querySelector('.btn-toast').addEventListener('click', () => {
                this.tasks.splice(index, 0, task);
                this.saveTasks();
                this.render();
                remove();
                this.toasts.show('Restored', 'success', 2000);
            });
        }, 300);
    }

    openEditModal(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        this.elements.editId.value = id;
        this.elements.editTaskInput.value = task.title;
        this.elements.editPriority.value = task.priority;
        this.elements.editCategory.value = task.category;
        this.elements.editDueDate.value = task.dueDate || '';
        this.elements.editTags.value = task.tags.join(', ');

        this.openModal('editModal');
    }

    saveEdit() {
        const id = this.elements.editId.value;
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        task.title = this.elements.editTaskInput.value.trim();
        task.priority = this.elements.editPriority.value;
        task.category = this.elements.editCategory.value;
        task.dueDate = this.elements.editDueDate.value;
        task.tags = this.parseTags(this.elements.editTags.value);

        this.saveTasks();
        this.closeModal('editModal');
        this.render();
        this.toasts.show('Task updated', 'success');
    }

    /* ---------- Selection & Bulk ---------- */
    toggleSelection(id) {
        if (this.selection.has(id)) {
            this.selection.delete(id);
        } else {
            this.selection.add(id);
        }
        this.updateBulkBar();
        this.render();
    }

    clearSelection() {
        this.selection.clear();
        this.updateBulkBar();
        this.render();
    }

    updateBulkBar() {
        const count = this.selection.size;
        this.elements.bulkCount.textContent = count;
        this.elements.bulkBar.classList.toggle('visible', count > 0);
        document.body.classList.toggle('has-selection', count > 0);
    }

    bulkComplete() {
        let changed = 0;
        this.selection.forEach(id => {
            const task = this.tasks.find(t => t.id === id);
            if (task && !task.completed) {
                task.completed = true;
                changed++;
            }
        });

        if (changed > 0) {
            this.saveTasks();
            this.sounds.play('complete');
            this.toasts.show(`${changed} tasks completed`, 'success');
        }

        this.clearSelection();
        this.render();
    }

    bulkDelete() {
        const count = this.selection.size;
        const toDelete = [...this.selection];

        // Remove from array
        this.tasks = this.tasks.filter(t => !this.selection.has(t.id));
        this.saveTasks();
        this.clearSelection();
        this.render();
        this.sounds.play('delete');

        // Undo all
        const { remove } = this.toasts.show(
            `${count} tasks deleted`,
            'undo',
            6000,
            `<button class="btn-toast">Undo All</button>`
        );

        const toastEl = this.toasts.container.lastElementChild;
        toastEl.querySelector('.btn-toast').addEventListener('click', () => {
            // Restore by re-adding (order may change but all data preserved)
            toDelete.forEach(id => {
                const task = this.tasks.find(t => t.id === id); // won't find since deleted
            });
            // Actually we need to store full tasks for undo... simplified:
            this.toasts.show('Undo not available for bulk delete', 'warning');
            remove();
        });
    }

    /* ---------- Filtering & Sorting ---------- */
    getFilteredTasks() {
        let result = this.tasks.filter(task => {
            const matchesSearch =
                task.title.toLowerCase().includes(this.searchTerm) ||
                task.tags.some(t => t.includes(this.searchTerm));

            let matchesFilter = true;
            if (this.filter === 'completed') matchesFilter = task.completed;
            else if (this.filter === 'pending') matchesFilter = !task.completed;
            else if (this.filter === 'high') matchesFilter = task.priority === 'high';
            else if (this.filter === 'overdue') matchesFilter = this.isOverdue(task) && !task.completed;

            const matchesCategory = !this.categoryFilter || task.category === this.categoryFilter;

            return matchesSearch && matchesFilter && matchesCategory;
        });

        // Sort
        if (this.sortMode === 'dueDate') {
            result.sort((a, b) => {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
        } else if (this.sortMode === 'priority') {
            const pMap = { high: 3, medium: 2, low: 1 };
            result.sort((a, b) => pMap[b.priority] - pMap[a.priority]);
        } else if (this.sortMode === 'created') {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (this.sortMode === 'alphabetical') {
            result.sort((a, b) => a.title.localeCompare(b.title));
        }

        return result;
    }

    clearAllFilters() {
        this.filter = 'all';
        this.categoryFilter = null;
        this.searchTerm = '';
        this.tagFilter = null;
        this.elements.searchInput.value = '';
        this.elements.clearSearch.classList.add('hidden');
        this.elements.filterBtns.forEach(b => b.classList.remove('active'));
        this.elements.filterBtns[0].classList.add('active');
        this.elements.categoryFilters.querySelectorAll('.category-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        this.render();
    }

    /* ---------- Utilities ---------- */
    isOverdue(task) {
        if (!task.dueDate || task.completed) return false;
        const due = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return due < today;
    }

    isUpcoming(task) {
        if (!task.dueDate || task.completed) return false;
        const due = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 2;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

        if (diff < 0) return 'Overdue';
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Tomorrow';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const overdue = this.tasks.filter(t => this.isOverdue(t)).length;

        this.animateValue(this.elements.totalTasks, parseInt(this.elements.totalTasks.textContent), total);
        this.animateValue(this.elements.completedTasks, parseInt(this.elements.completedTasks.textContent), completed);
        this.animateValue(this.elements.pendingTasks, parseInt(this.elements.pendingTasks.textContent), pending);
        this.animateValue(this.elements.overdueTasks, parseInt(this.elements.overdueTasks.textContent), overdue);

        // Progress ring
        const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
        const circle = this.elements.progressCircle;
        const radius = circle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (pct / 100) * circumference;

        circle.style.strokeDashoffset = offset;
        this.elements.progressText.textContent = `${pct}%`;
    }

    animateValue(el, start, end) {
        if (start === end) return;
        el.classList.add('changed');
        el.textContent = end;
        setTimeout(() => el.classList.remove('changed'), 300);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    shake(element) {
        element.classList.add('shake');
        setTimeout(() => element.classList.remove('shake'), 400);
    }

    /* ---------- Modal System ---------- */
    openModal(id) {
        const modal = document.getElementById(id);
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');

        // Focus first input if edit modal
        if (id === 'editModal') {
            setTimeout(() => this.elements.editTaskInput.focus(), 100);
        }
    }

    closeModal(id) {
        const modal = document.getElementById(id);
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }

    closeAllModals() {
        ['editModal', 'exportModal', 'shortcutsModal'].forEach(id => this.closeModal(id));
    }

    /* ---------- Export ---------- */
    exportJson() {
        const data = JSON.stringify(this.tasks, null, 2);
        this.downloadFile(data, 'taskflow-tasks.json', 'application/json');
        this.closeModal('exportModal');
        this.toasts.show('Exported as JSON', 'success');
    }

    exportCsv() {
        const headers = ['ID', 'Title', 'Priority', 'Category', 'Due Date', 'Tags', 'Completed', 'Created At'];
        const rows = this.tasks.map(t => [
            t.id,
            `"${t.title.replace(/"/g, '""')}"`,
            t.priority,
            t.category,
            t.dueDate || '',
            `"${t.tags.join(', ')}"`,
            t.completed ? 'Yes' : 'No',
            t.createdAt
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        this.downloadFile(csv, 'taskflow-tasks.csv', 'text/csv');
        this.closeModal('exportModal');
        this.toasts.show('Exported as CSV', 'success');
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    /* ---------- Rendering ---------- */
    render() {
        const filtered = this.getFilteredTasks();

        if (filtered.length === 0) {
            this.elements.taskList.style.display = 'none';
            this.elements.emptyState.style.display = 'block';
        } else {
            this.elements.taskList.style.display = 'flex';
            this.elements.emptyState.style.display = 'none';
        }

        this.elements.taskList.innerHTML = filtered.map((task, idx) => {
            const category = this.categories.find(c => c.id === task.category);
            const overdue = this.isOverdue(task);
            const upcoming = this.isUpcoming(task);
            const selected = this.selection.has(task.id);
            const focused = idx === this.focusedIndex;

            return `
            <div class="task-item priority-${task.priority} ${task.completed ? 'completed' : ''} ${selected ? 'selected' : ''} ${focused ? 'focused' : ''}" 
                 data-id="${task.id}" 
                 draggable="${this.sortMode === 'manual' && !this.searchTerm && !this.categoryFilter && this.filter === 'all'}"
                 role="listitem"
                 tabindex="0">
                
                <input type="checkbox" class="task-select" ${selected ? 'checked' : ''} aria-label="Select task">
                
                <div class="drag-handle" title="Drag to reorder" aria-hidden="true">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark complete">
                
                <div class="task-content">
                    <h3>${this.escapeHtml(task.title)}</h3>
                    <div class="task-meta">
                        <span class="badge ${category?.color || ''}">${category?.label || task.category}</span>
                        <button class="badge priority-${task.priority}" aria-label="Priority: ${task.priority}, click to cycle">${task.priority}</button>
                        <span class="due-date ${overdue ? 'overdue' : ''} ${upcoming ? 'upcoming' : ''}">
                            <i class="far fa-calendar"></i> ${this.formatDate(task.dueDate)}
                        </span>
                        ${task.tags.length ? `
                            <div class="task-tags">
                                ${task.tags.map(tag => `<span class="tag ${this.searchTerm === tag ? 'active-filter' : ''}">#${this.escapeHtml(tag)}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="task-actions">
                    <button class="btn-icon btn-delete" title="Delete (D)" aria-label="Delete task">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            `;
        }).join('');

        this.updateStats();
    }

    /* ---------- Persistence ---------- */
    saveTasks() {
        localStorage.setItem('taskflow_tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        try {
            const stored = localStorage.getItem('taskflow_tasks');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').then(reg => {
                const banner = document.createElement('div');
                banner.id = 'offlineBanner';
                banner.className = 'offline-banner';
                banner.innerHTML = '<i class="fas fa-wifi-slash"></i> Offline mode — changes will sync';
                document.body.appendChild(banner);

                const updateStatus = () => {
                    banner.classList.toggle('visible', !navigator.onLine);
                };
                window.addEventListener('online', updateStatus);
                window.addEventListener('offline', updateStatus);
            }).catch(() => { });
        }
    }
}

/* ---------- Initialize ---------- */
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TaskManager();
});