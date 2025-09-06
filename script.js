// Task-Tide: AI-Powered Task Scheduler
// Enhanced JavaScript functionality with AI features

class TaskTideApp {
    constructor() {
        this.tasks = [];
        this.currentView = 'tasks';
        this.currentDate = new Date();
        this.theme = localStorage.getItem('theme') || 'light';
        this.aiSuggestions = [];
        
        this.init();
    }

    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.applyTheme();
        this.renderTasks();
        this.renderCalendar();
        this.generateAISuggestions();
        this.updateAnalytics();
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
        if (categoryFilter) categoryFilter.addEventListener('change', () => this.renderTasks());
        if (priorityFilter) priorityFilter.addEventListener('change', () => this.renderTasks());

        // Modal close
        const modal = document.getElementById('task-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'task-modal') {
                    this.closeTaskModal();
                }
            });
        }
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
                this.updateAnalytics();
                break;
        }
    }

    // Task Management
    addTask() {
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
        this.saveTasks();
        this.clearTaskForm();
        this.renderTasks();
        this.generateAISuggestions();
        this.updateAnalytics();
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

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateAnalytics();
        }
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateAnalytics();
        }
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
        
        const categoryValue = categoryFilter ? categoryFilter.value : 'all';
        const priorityValue = priorityFilter ? priorityFilter.value : 'all';

        let filteredTasks = this.tasks;

        // Apply filters
        if (categoryValue !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.category === categoryValue);
        }
        if (priorityValue !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.priority === priorityValue);
        }

        // Sort by AI score and due date
        filteredTasks.sort((a, b) => {
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

        taskList.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
    }

    createTaskHTML(task) {
        const dueDateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <div>
                        <div class="task-title">${task.title}</div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="task-action" onclick="app.editTask('${task.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="task-action" onclick="app.deleteTask('${task.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="task-meta-info">
                    <span class="task-category">
                        <i class="fas fa-tag"></i>
                        ${task.category}
                    </span>
                    <span class="task-priority ${task.priority}">
                        <i class="fas fa-flag"></i>
                        ${task.priority}
                    </span>
                    <span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                        <i class="fas fa-calendar"></i>
                        ${dueDateStr}
                    </span>
                    <span class="task-estimate">
                        <i class="fas fa-clock"></i>
                        ${task.estimate}h
                    </span>
                    <span class="ai-score">
                        <i class="fas fa-brain"></i>
                        AI: ${task.aiScore}
                    </span>
                </div>
                <div class="task-checkbox" onclick="app.toggleTask('${task.id}')">
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
                        ${dayTasks.slice(0, 3).map(task => `
                            <div class="day-task" onclick="app.showTaskModal(app.tasks.find(t => t.id === '${task.id}'))">
                                ${task.title}
                            </div>
                        `).join('')}
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
    generateAISuggestions() {
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
        
        container.innerHTML = this.aiSuggestions.map(suggestion => `
            <div class="ai-suggestion ${suggestion.type}">
                <div class="suggestion-message">${suggestion.message}</div>
                <button class="suggestion-action" onclick="app.handleSuggestion('${suggestion.type}')">
                    ${suggestion.action}
                </button>
            </div>
        `).join('');
    }

    handleSuggestion(type) {
        switch(type) {
            case 'warning':
                // Filter to show overdue tasks
                const priorityFilter = document.getElementById('priority-filter');
                const categoryFilter = document.getElementById('category-filter');
                if (priorityFilter) priorityFilter.value = 'all';
                if (categoryFilter) categoryFilter.value = 'all';
                this.renderTasks();
                break;
            case 'info':
                // Show high priority tasks
                const priorityFilter2 = document.getElementById('priority-filter');
                if (priorityFilter2) priorityFilter2.value = 'high';
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

    // Analytics
    updateAnalytics() {
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const totalTasks = this.tasks.length;
        const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        const timeBlocked = this.tasks.reduce((total, task) => {
            return total + (task.completed ? task.estimate : 0);
        }, 0);

        const aiSuggestionsUsed = parseInt(localStorage.getItem('aiSuggestionsUsed') || '0');

        const completedTasksEl = document.getElementById('completed-tasks');
        const productivityScoreEl = document.getElementById('productivity-score');
        const timeBlockedEl = document.getElementById('time-blocked');
        const aiSuggestionsUsedEl = document.getElementById('ai-suggestions-used');

        if (completedTasksEl) completedTasksEl.textContent = completedTasks;
        if (productivityScoreEl) productivityScoreEl.textContent = `${productivityScore}%`;
        if (timeBlockedEl) timeBlockedEl.textContent = `${timeBlocked}h`;
        if (aiSuggestionsUsedEl) aiSuggestionsUsedEl.textContent = aiSuggestionsUsed;
    }

    // Modal Management
    showTaskModal(task) {
        const modal = document.getElementById('task-modal');
        const modalTitle = document.getElementById('modal-title');
        const taskDetails = document.getElementById('task-details');

        if (!modal || !modalTitle || !taskDetails) return;

        modalTitle.textContent = task.title;
        taskDetails.innerHTML = `
            <div class="task-detail-section">
                <h4>Description</h4>
                <p>${task.description || 'No description provided'}</p>
            </div>
            <div class="task-detail-section">
                <h4>Details</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Category:</strong> ${task.category}
                    </div>
                    <div class="detail-item">
                        <strong>Priority:</strong> ${task.priority}
                    </div>
                    <div class="detail-item">
                        <strong>Due Date:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                    </div>
                    <div class="detail-item">
                        <strong>Estimate:</strong> ${task.estimate} hours
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
                <button class="btn btn-primary" onclick="app.toggleTask('${task.id}'); app.closeTaskModal();">
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

    // Data Persistence
    saveTasks() {
        localStorage.setItem('taskTideTasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('taskTideTasks');
        if (saved) {
            this.tasks = JSON.parse(saved).map(task => ({
                ...task,
                dueDate: task.dueDate ? new Date(task.dueDate) : null,
                createdAt: new Date(task.createdAt)
            }));
        }
    }
}

// Global functions for HTML onclick handlers
function addTask() {
    app.addTask();
}

function closeTaskModal() {
    app.closeTaskModal();
}

// Initialize the app
const app = new TaskTideApp();
