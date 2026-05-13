// Task-Tide: AI-Powered Task Scheduler
// Enhanced JavaScript functionality with AI features

class TaskTideApp {
    constructor() {
        this.tasks = [];
        this.useApi = false;
        this.currentView = 'tasks';
        this.currentDate = new Date();
        this.theme = localStorage.getItem('theme') || 'light';
        this.aiSuggestions = [];

        void this.bootstrap();
    }

    static normalizeTaskFromApi(raw) {
        const base = {
            ...raw,
            dueDate: raw.dueDate ? new Date(raw.dueDate) : null,
            createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
            updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(raw.createdAt || Date.now())
        };
        if (raw.completed && raw.completedAt) {
            base.completedAt = new Date(raw.completedAt);
        } else {
            delete base.completedAt;
        }
        return base;
    }

    async bootstrap() {
        const api = typeof window !== 'undefined' ? window.taskTideAPI : null;
        try {
            this.useApi = !!(api && (await api.healthCheck()));
        } catch {
            this.useApi = false;
        }

        if (this.useApi) {
            try {
                await this.reloadTasksFromApi();
            } catch (err) {
                console.warn('[TaskTide] API unreachable, using local storage', err);
                this.useApi = false;
                this.loadTasksFromLocal();
            }
        } else {
            this.loadTasksFromLocal();
        }

        this.setConnectionStatus();
        this.setupEventListeners();
        this.applyTheme();
        this.renderTasks();
        this.renderCalendar();
        await this.generateAISuggestions();
        await this.updateAnalytics();
    }

    async reloadTasksFromApi() {
        const res = await window.taskTideAPI.getTasks({});
        if (!res.success) {
            throw new Error(res.error || 'Failed to load tasks');
        }
        this.tasks = (res.data || []).map(TaskTideApp.normalizeTaskFromApi);
    }

    setConnectionStatus() {
        const el = document.getElementById('connection-status');
        if (!el) return;
        el.textContent = this.useApi ? 'Live sync' : 'Local only';
        el.title = this.useApi
            ? 'Tasks sync with Task-Tide API'
            : 'API unreachable — tasks stay in this browser only';
        el.classList.toggle('connection-offline', !this.useApi);
    }

    async refreshInsightsAfterMutation() {
        await this.generateAISuggestions();
        await this.updateAnalytics();
    }

    // Theme Management
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeIcon = document.querySelector('#theme-toggle i');
        if (themeIcon) {
            themeIcon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }

    // Event Listeners
    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Calendar navigation
        const prevMonth = document.getElementById('prev-month');
        const nextMonth = document.getElementById('next-month');
        if (prevMonth) prevMonth.addEventListener('click', () => this.previousMonth());
        if (nextMonth) nextMonth.addEventListener('click', () => this.nextMonth());

        // Filters
        const categoryFilter = document.getElementById('category-filter');
        const priorityFilter = document.getElementById('priority-filter');
        const statusFilter = document.getElementById('status-filter');
        if (categoryFilter) categoryFilter.addEventListener('change', () => this.renderTasks());
        if (priorityFilter) priorityFilter.addEventListener('change', () => this.renderTasks());
        if (statusFilter) statusFilter.addEventListener('change', () => this.renderTasks());

        const taskSearch = document.getElementById('task-search');
        const taskSort = document.getElementById('task-sort');
        const exportBtn = document.getElementById('export-tasks-btn');
        if (taskSearch) taskSearch.addEventListener('input', () => this.renderTasks());
        if (taskSort) taskSort.addEventListener('change', () => this.renderTasks());
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportTasksToJson());

        document.addEventListener('keydown', (e) => {
            if (e.defaultPrevented) return;
            const tag = e.target && e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) {
                return;
            }
            if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const tasksView = document.getElementById('tasks-view');
                const searchEl = document.getElementById('task-search');
                if (searchEl && tasksView && !tasksView.classList.contains('hidden')) {
                    e.preventDefault();
                    searchEl.focus();
                }
            }
        });

        // Modal close
        const modal = document.getElementById('task-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'task-modal') {
                    this.closeTaskModal();
                }
            });
        }

        const viewToggle = document.getElementById('view-toggle');
        if (viewToggle) {
            viewToggle.addEventListener('click', () => this.cycleMainView());
        }
    }

    cycleMainView() {
        const order = ['tasks', 'calendar', 'analytics'];
        const i = order.indexOf(this.currentView);
        const nextIdx = i < 0 ? 0 : (i + 1) % order.length;
        this.switchView(order[nextIdx]);
    }

    // View Management
    switchView(view) {
        this.currentView = view;
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeNav = document.querySelector(`[data-view="${view}"]`);
        if (activeNav) activeNav.classList.add('active');

        // Show/hide views
        document.querySelectorAll('.view-container').forEach(container => {
            container.classList.add('hidden');
        });
        const targetView = document.getElementById(`${view}-view`);
        if (targetView) targetView.classList.remove('hidden');

        // Render appropriate content
        switch(view) {
            case 'tasks':
                this.renderTasks();
                break;
            case 'calendar':
                this.renderCalendar();
                break;
            case 'analytics':
                void this.updateAnalytics();
                break;
        }
    }

    // Task Management
    async addTask() {
        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-description').value.trim();
        const category = document.getElementById('task-category').value;
        const priority = document.getElementById('task-priority').value;
        const dueDate = document.getElementById('task-due-date').value;
        const estimate = parseFloat(document.getElementById('task-estimate').value) || 1;

        if (!title) {
            alert('Please enter a task title');
            return;
        }

        if (this.useApi && window.taskTideAPI) {
            try {
                const payload = {
                    title,
                    description,
                    category,
                    priority,
                    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                    estimate,
                    completed: false
                };
                const res = await window.taskTideAPI.createTask(payload);
                this.tasks.push(TaskTideApp.normalizeTaskFromApi(res.data));
            } catch (err) {
                alert(err.message || 'Could not create task on the server');
                return;
            }
        } else {
            const task = {
                id: Date.now().toString(),
                title,
                description,
                category,
                priority,
                dueDate: dueDate ? new Date(dueDate) : null,
                estimate,
                completed: false,
                createdAt: new Date(),
                aiScore: this.calculateAIScore(title, description, priority, dueDate)
            };
            this.tasks.push(task);
            this.saveTasksToLocal();
        }

        this.clearTaskForm();
        this.renderTasks();
        await this.refreshInsightsAfterMutation();
    }

    calculateAIScore(title, description, priority, dueDate) {
        let score = 0;
        
        // Priority scoring
        const priorityScores = { high: 3, medium: 2, low: 1 };
        score += priorityScores[priority] * 10;

        // Due date urgency
        if (dueDate) {
            const daysUntilDue = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysUntilDue <= 1) score += 20;
            else if (daysUntilDue <= 3) score += 15;
            else if (daysUntilDue <= 7) score += 10;
        }

        // Title keywords
        const urgentKeywords = ['urgent', 'asap', 'immediately', 'deadline', 'critical'];
        const titleLower = title.toLowerCase();
        if (urgentKeywords.some(keyword => titleLower.includes(keyword))) {
            score += 15;
        }

        return Math.min(score, 100);
    }

    clearTaskForm() {
        document.getElementById('task-title').value = '';
        document.getElementById('task-description').value = '';
        document.getElementById('task-category').value = 'personal';
        document.getElementById('task-priority').value = 'medium';
        document.getElementById('task-due-date').value = '';
        document.getElementById('task-estimate').value = '';
    }

    async toggleTask(id) {
        const task = this.tasks.find((t) => t.id === id);
        if (!task) return;

        if (this.useApi && window.taskTideAPI) {
            try {
                const res = await window.taskTideAPI.toggleTask(id);
                const idx = this.tasks.findIndex((t) => t.id === id);
                if (idx !== -1) {
                    this.tasks[idx] = TaskTideApp.normalizeTaskFromApi(res.data);
                }
            } catch (err) {
                alert(err.message || 'Could not update task on the server');
                return;
            }
        } else {
            task.completed = !task.completed;
            if (task.completed) {
                task.completedAt = new Date().toISOString();
            } else {
                delete task.completedAt;
            }
            this.saveTasksToLocal();
        }

        this.renderTasks();
        await this.refreshInsightsAfterMutation();
    }

    async deleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        if (this.useApi && window.taskTideAPI) {
            try {
                await window.taskTideAPI.deleteTask(id);
                this.tasks = this.tasks.filter((t) => t.id !== id);
            } catch (err) {
                alert(err.message || 'Could not delete task on the server');
                return;
            }
        } else {
            this.tasks = this.tasks.filter((t) => t.id !== id);
            this.saveTasksToLocal();
        }

        this.renderTasks();
        await this.refreshInsightsAfterMutation();
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.showTaskModal(task);
        }
    }

    // Task Rendering
    renderTasks() {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;

        const categoryFilter = document.getElementById('category-filter');
        const priorityFilter = document.getElementById('priority-filter');
        const statusFilter = document.getElementById('status-filter');
        const searchInput = document.getElementById('task-search');
        const sortSelect = document.getElementById('task-sort');

        const categoryValue = categoryFilter ? categoryFilter.value : 'all';
        const priorityValue = priorityFilter ? priorityFilter.value : 'all';
        const statusValue = statusFilter ? statusFilter.value : 'all';
        const searchRaw = searchInput ? searchInput.value.trim() : '';
        const sortValue = sortSelect ? sortSelect.value : 'smart';

        let filteredTasks = [...this.tasks];

        if (categoryValue !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.category === categoryValue);
        }
        if (priorityValue !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.priority === priorityValue);
        }
        if (statusValue === 'active') {
            filteredTasks = filteredTasks.filter((task) => !task.completed);
        } else if (statusValue === 'completed') {
            filteredTasks = filteredTasks.filter((task) => task.completed);
        }

        if (searchRaw) {
            const needle = searchRaw.toLowerCase();
            filteredTasks = filteredTasks.filter((task) => {
                const title = (task.title || '').toLowerCase();
                const description = (task.description || '').toLowerCase();
                return title.includes(needle) || description.includes(needle);
            });
        }

        this.sortTaskList(filteredTasks, sortValue);

        taskList.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
    }

    sortTaskList(list, sortValue) {
        const priorityRank = { high: 3, medium: 2, low: 1 };
        const createdDesc = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
        const createdAsc = (a, b) => new Date(a.createdAt) - new Date(b.createdAt);
        const incompleteFirst = (a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return 0;
        };

        switch (sortValue) {
            case 'due_asc':
                list.sort((a, b) => {
                    const inc = incompleteFirst(a, b);
                    if (inc !== 0) return inc;
                    const at = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
                    const bt = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
                    if (at !== bt) return at - bt;
                    return createdDesc(a, b);
                });
                break;
            case 'priority':
                list.sort((a, b) => {
                    const inc = incompleteFirst(a, b);
                    if (inc !== 0) return inc;
                    const pr = (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
                    if (pr !== 0) return pr;
                    return createdDesc(a, b);
                });
                break;
            case 'newest':
                list.sort((a, b) => {
                    const inc = incompleteFirst(a, b);
                    if (inc !== 0) return inc;
                    return createdDesc(a, b);
                });
                break;
            case 'oldest':
                list.sort((a, b) => {
                    const inc = incompleteFirst(a, b);
                    if (inc !== 0) return inc;
                    return createdAsc(a, b);
                });
                break;
            default:
                list.sort((a, b) => {
                    if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1;
                    }
                    if (a.aiScore !== b.aiScore) {
                        return b.aiScore - a.aiScore;
                    }
                    if (a.dueDate && b.dueDate) {
                        return new Date(a.dueDate) - new Date(b.dueDate);
                    }
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
        }
    }

    exportTasksToJson() {
        const rows = this.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            category: t.category,
            priority: t.priority,
            dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
            estimate: t.estimate || 1,
            completed: !!t.completed,
            completedAt: t.completedAt ? new Date(t.completedAt).toISOString() : undefined,
            createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : undefined,
            aiScore: typeof t.aiScore === 'number' ? t.aiScore : 0
        }));
        const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `task-tide-tasks-${new Date().toISOString().slice(0, 10)}.json`;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    createTaskHTML(task) {
        const dueDateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
        const safeId = String(task.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const descHtml = task.description
            ? `<div class="task-description">${this.escapeHtml(task.description)}</div>`
            : '';

        return `
            <div class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-task-id="${this.escapeHtml(String(task.id))}">
                <div class="task-header">
                    <div>
                        <div class="task-title">${this.escapeHtml(task.title)}</div>
                        ${descHtml}
                    </div>
                    <div class="task-actions">
                        <button class="task-action" onclick="app.editTask('${safeId}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="task-action" onclick="app.deleteTask('${safeId}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="task-meta-info">
                    <span class="task-category">
                        <i class="fas fa-tag"></i>
                        ${this.escapeHtml(task.category)}
                    </span>
                    <span class="task-priority ${task.priority}">
                        <i class="fas fa-flag"></i>
                        ${this.escapeHtml(task.priority)}
                    </span>
                    <span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                        <i class="fas fa-calendar"></i>
                        ${dueDateStr}
                    </span>
                    <span class="task-estimate">
                        <i class="fas fa-clock"></i>
                        ${task.estimate || 1}h
                    </span>
                    <span class="ai-score">
                        <i class="fas fa-brain"></i>
                        AI: ${task.aiScore}
                    </span>
                </div>
                <div class="task-checkbox" onclick="app.toggleTask('${safeId}')">
                    <i class="fas fa-${task.completed ? 'check-circle' : 'circle'}"></i>
                </div>
            </div>
        `;
    }

    // Calendar Management
    renderCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        const currentMonth = document.getElementById('current-month');
        
        if (!calendarGrid || !currentMonth) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        currentMonth.textContent = this.currentDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let calendarHTML = '';

        // Day headers
        days.forEach(day => {
            calendarHTML += `<div class="day-header">${day}</div>`;
        });

        // Calendar days
        const currentDate = new Date(startDate);
        for (let i = 0; i < 42; i++) {
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = this.isToday(currentDate);
            const dayTasks = this.getTasksForDate(currentDate);

            calendarHTML += `
                <div class="calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" 
                     data-date="${currentDate.toISOString().split('T')[0]}">
                    <div class="day-number">${currentDate.getDate()}</div>
                    <div class="day-tasks">
                        ${dayTasks.slice(0, 3).map((task) => {
                            const safeId = String(task.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                            return `
                            <div class="day-task" onclick="app.openTaskById('${safeId}')">
                                ${this.escapeHtml(task.title)}
                            </div>`;
                        }).join('')}
                        ${dayTasks.length > 3 ? `<div class="day-task">+${dayTasks.length - 3} more</div>` : ''}
                    </div>
                </div>
            `;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        calendarGrid.innerHTML = calendarHTML;
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    getTasksForDate(date) {
        return this.tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return taskDate.toDateString() === date.toDateString();
        });
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    // AI Features
    async generateAISuggestions() {
        if (this.useApi && window.taskTideAPI) {
            try {
                const res = await window.taskTideAPI.getAISuggestions();
                this.aiSuggestions = Array.isArray(res.data) ? res.data : [];
                this.renderAISuggestions();
                return;
            } catch (err) {
                console.warn('[TaskTide] AI suggestions API failed, using local rules', err);
            }
        }

        const suggestions = [];
        
        // Overdue tasks
        const overdueTasks = this.tasks.filter(task => 
            task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
        );
        if (overdueTasks.length > 0) {
            suggestions.push({
                type: 'warning',
                message: `You have ${overdueTasks.length} overdue task(s). Consider rescheduling or completing them soon.`,
                action: 'View overdue tasks'
            });
        }

        // High priority tasks without due dates
        const highPriorityNoDue = this.tasks.filter(task => 
            task.priority === 'high' && !task.dueDate && !task.completed
        );
        if (highPriorityNoDue.length > 0) {
            suggestions.push({
                type: 'info',
                message: `You have ${highPriorityNoDue.length} high priority task(s) without due dates. Consider setting deadlines.`,
                action: 'Set due dates'
            });
        }

        // Task distribution analysis
        const categoryCounts = this.tasks.reduce((acc, task) => {
            if (!task.completed) {
                acc[task.category] = (acc[task.category] || 0) + 1;
            }
            return acc;
        }, {});

        const maxCategory = Object.keys(categoryCounts).reduce((a, b) => 
            categoryCounts[a] > categoryCounts[b] ? a : b, 'personal'
        );

        if (categoryCounts[maxCategory] > 5) {
            suggestions.push({
                type: 'suggestion',
                message: `You have many ${maxCategory} tasks. Consider breaking them into smaller, manageable pieces.`,
                action: 'Break down tasks'
            });
        }

        // Productivity suggestions
        const completedToday = this.tasks.filter(task => {
            const today = new Date();
            const completedDate = new Date(task.completedAt || task.createdAt);
            return task.completed && completedDate.toDateString() === today.toDateString();
        }).length;

        if (completedToday === 0 && this.tasks.filter(t => !t.completed).length > 0) {
            suggestions.push({
                type: 'motivation',
                message: "Start your day with a quick win! Complete a small task to build momentum.",
                action: 'Find quick tasks'
            });
        }

        this.aiSuggestions = suggestions;
        this.renderAISuggestions();
    }

    renderAISuggestions() {
        const container = document.getElementById('ai-suggestions-container');
        if (!container) return;
        
        container.innerHTML = this.aiSuggestions.map((suggestion) => `
            <div class="ai-suggestion ${suggestion.type}">
                <div class="suggestion-message">${this.escapeHtml(suggestion.message)}</div>
                <button class="suggestion-action" onclick="app.handleSuggestion(${JSON.stringify(suggestion.type)})">
                    ${this.escapeHtml(suggestion.action)}
                </button>
            </div>
        `).join('');
    }

    handleSuggestion(type) {
        this.recordSuggestionUse();
        switch(type) {
            case 'warning':
                // Filter to show overdue tasks
                const priorityFilter = document.getElementById('priority-filter');
                const categoryFilter = document.getElementById('category-filter');
                const statusFilterW = document.getElementById('status-filter');
                if (priorityFilter) priorityFilter.value = 'all';
                if (categoryFilter) categoryFilter.value = 'all';
                if (statusFilterW) statusFilterW.value = 'all';
                this.renderTasks();
                break;
            case 'info':
                // Show high priority tasks
                const priorityFilter2 = document.getElementById('priority-filter');
                const statusFilterI = document.getElementById('status-filter');
                if (priorityFilter2) priorityFilter2.value = 'high';
                if (statusFilterI) statusFilterI.value = 'all';
                this.renderTasks();
                break;
            case 'suggestion':
                // Show task breakdown modal
                this.showTaskBreakdownModal();
                break;
            case 'motivation':
                // Show quick tasks
                this.showQuickTasks();
                break;
        }
    }

    recordSuggestionUse() {
        const n = parseInt(localStorage.getItem('aiSuggestionsUsed') || '0', 10) + 1;
        localStorage.setItem('aiSuggestionsUsed', String(n));
        void this.updateAnalytics();
    }

    escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    showTaskBreakdownModal() {
        const modal = document.getElementById('task-modal');
        const modalTitle = document.getElementById('modal-title');
        const taskDetails = document.getElementById('task-details');
        if (!modal || !modalTitle || !taskDetails) return;

        const unfinished = this.tasks.filter((t) => !t.completed);
        const byCategory = unfinished.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + 1;
            return acc;
        }, {});

        const summary =
            Object.keys(byCategory).length > 0
                ? `By category: ${Object.entries(byCategory)
                      .map(([k, v]) => `${k} (${v})`)
                      .join(', ')}`
                : 'No open tasks right now.';

        modalTitle.textContent = 'Task breakdown';
        taskDetails.innerHTML = `
            <div class="task-detail-section">
                <p>Try splitting large work into 30–60 minute steps so momentum stays high.</p>
                <p>You have <strong>${unfinished.length}</strong> open task(s).</p>
                <p>${this.escapeHtml(summary)}</p>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="app.closeTaskModal()">Close</button>
            </div>`;
        modal.classList.add('active');
        this.switchView('tasks');
    }

    showQuickTasks() {
        this.switchView('tasks');
        const priorityFilter = document.getElementById('priority-filter');
        const categoryFilter = document.getElementById('category-filter');
        const statusFilter = document.getElementById('status-filter');
        if (priorityFilter) priorityFilter.value = 'all';
        if (categoryFilter) categoryFilter.value = 'all';
        if (statusFilter) statusFilter.value = 'all';

        const quick = this.tasks
            .filter((t) => !t.completed && (t.estimate || 1) <= 1)
            .sort((a, b) => (a.estimate || 1) - (b.estimate || 1));

        const modal = document.getElementById('task-modal');
        const modalTitle = document.getElementById('modal-title');
        const taskDetails = document.getElementById('task-details');
        if (!modal || !modalTitle || !taskDetails) return;

        modalTitle.textContent = 'Quick wins';
        if (quick.length === 0) {
            taskDetails.innerHTML = `
                <div class="task-detail-section">
                    <p>No tasks with an estimate of 1 hour or less. Add a small task or lower an estimate to build momentum.</p>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="app.closeTaskModal()">Close</button>
                </div>`;
        } else {
            const items = quick
                .slice(0, 10)
                .map((t) => {
                    const safeId = String(t.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                    return `<li><button type="button" class="quick-task-link" onclick="app.openTaskById('${safeId}')">${this.escapeHtml(
                        t.title
                    )}</button> <span class="task-estimate">(${t.estimate || 1}h)</span></li>`;
                })
                .join('');

            taskDetails.innerHTML = `
                <div class="task-detail-section">
                    <p>Pick a small task to finish first:</p>
                    <ul class="quick-task-list">${items}</ul>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="app.closeTaskModal()">Close</button>
                </div>`;
        }
        modal.classList.add('active');
    }

    openTaskById(id) {
        const task = this.tasks.find((x) => x.id === id);
        if (task) {
            this.showTaskModal(task);
        }
    }

    // Analytics
    async updateAnalytics() {
        const aiSuggestionsUsed = parseInt(localStorage.getItem('aiSuggestionsUsed') || '0', 10);

        if (this.useApi && window.taskTideAPI) {
            try {
                const res = await window.taskTideAPI.getAnalytics();
                const overview = res.data && res.data.overview;
                if (overview) {
                    const completedTasksEl = document.getElementById('completed-tasks');
                    const productivityScoreEl = document.getElementById('productivity-score');
                    const timeBlockedEl = document.getElementById('time-blocked');
                    const aiSuggestionsUsedEl = document.getElementById('ai-suggestions-used');

                    if (completedTasksEl) {
                        completedTasksEl.textContent = String(overview.completedTasks);
                    }
                    if (productivityScoreEl) {
                        productivityScoreEl.textContent = `${overview.productivityScore}%`;
                    }
                    if (timeBlockedEl) {
                        timeBlockedEl.textContent = `${overview.timeBlocked}h`;
                    }
                    if (aiSuggestionsUsedEl) {
                        aiSuggestionsUsedEl.textContent = String(aiSuggestionsUsed);
                    }
                    return;
                }
            } catch (err) {
                console.warn('[TaskTide] Analytics API failed, using local counts', err);
            }
        }

        const completedTasks = this.tasks.filter((task) => task.completed).length;
        const totalTasks = this.tasks.length;
        const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const timeBlocked = this.tasks.reduce((total, task) => {
            return total + (task.completed ? task.estimate || 1 : 0);
        }, 0);

        const completedTasksEl = document.getElementById('completed-tasks');
        const productivityScoreEl = document.getElementById('productivity-score');
        const timeBlockedEl = document.getElementById('time-blocked');
        const aiSuggestionsUsedEl = document.getElementById('ai-suggestions-used');

        if (completedTasksEl) completedTasksEl.textContent = completedTasks;
        if (productivityScoreEl) productivityScoreEl.textContent = `${productivityScore}%`;
        if (timeBlockedEl) timeBlockedEl.textContent = `${timeBlocked}h`;
        if (aiSuggestionsUsedEl) aiSuggestionsUsedEl.textContent = String(aiSuggestionsUsed);
    }

    // Modal Management
    showTaskModal(task) {
        const modal = document.getElementById('task-modal');
        const modalTitle = document.getElementById('modal-title');
        const taskDetails = document.getElementById('task-details');

        if (!modal || !modalTitle || !taskDetails) return;

        const safeId = String(task.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const desc = task.description
            ? this.escapeHtml(task.description)
            : 'No description provided';

        modalTitle.textContent = task.title;
        taskDetails.innerHTML = `
            <div class="task-detail-section">
                <h4>Description</h4>
                <p>${desc}</p>
            </div>
            <div class="task-detail-section">
                <h4>Details</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Category:</strong> ${this.escapeHtml(task.category)}
                    </div>
                    <div class="detail-item">
                        <strong>Priority:</strong> ${this.escapeHtml(task.priority)}
                    </div>
                    <div class="detail-item">
                        <strong>Due Date:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                    </div>
                    <div class="detail-item">
                        <strong>Estimate:</strong> ${task.estimate || 1} hours
                    </div>
                    <div class="detail-item">
                        <strong>AI Score:</strong> ${task.aiScore}/100
                    </div>
                    <div class="detail-item">
                        <strong>Created:</strong> ${new Date(task.createdAt).toLocaleDateString()}
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="app.toggleTask('${safeId}'); app.closeTaskModal();">
                    ${task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
                <button class="btn btn-secondary" onclick="app.closeTaskModal()">Close</button>
            </div>
        `;

        modal.classList.add('active');
    }

    closeTaskModal() {
        const modal = document.getElementById('task-modal');
        if (modal) modal.classList.remove('active');
    }

    // Data Persistence (local-only; API mode keeps canonical state on the server)
    saveTasksToLocal() {
        if (this.useApi) return;
        localStorage.setItem('taskTideTasks', JSON.stringify(this.tasks));
    }

    loadTasksFromLocal() {
        const saved = localStorage.getItem('taskTideTasks');
        if (saved) {
            this.tasks = JSON.parse(saved).map((task) => ({
                ...task,
                dueDate: task.dueDate ? new Date(task.dueDate) : null,
                createdAt: new Date(task.createdAt)
            }));
        }
    }
}

// Global functions for HTML onclick handlers
async function addTask() {
    await app.addTask();
}

function closeTaskModal() {
    app.closeTaskModal();
}

// Initialize the app
const app = new TaskTideApp();
