// Task-Tide API Service
// Handles communication with the backend API

class TaskTideAPI {
    constructor() {
        this.baseUrl = TaskTideAPI.resolveApiBaseUrl();
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    static resolveApiBaseUrl() {
        if (typeof document !== 'undefined') {
            const injected =
                typeof window !== 'undefined' && window.__TASK_TIDE_API_BASE__;
            if (injected && String(injected).trim()) {
                return String(injected).trim().replace(/\/$/, '');
            }
            const meta = document.querySelector('meta[name="task-tide-api-base"]');
            const raw = meta && meta.getAttribute('content');
            if (raw && raw.trim()) {
                const t = raw.trim();
                if (t.startsWith('/')) {
                    const origin =
                        typeof window !== 'undefined' && window.location && window.location.origin
                            ? window.location.origin
                            : '';
                    return (origin + t).replace(/\/$/, '');
                }
                return t.replace(/\/$/, '');
            }
        }
        return 'http://localhost:3001/api';
    }

    static authStorageKey() {
        return 'taskTideAuthToken';
    }

    getStoredToken() {
        try {
            return localStorage.getItem(TaskTideAPI.authStorageKey());
        } catch {
            return null;
        }
    }

    setStoredToken(token) {
        try {
            if (token) localStorage.setItem(TaskTideAPI.authStorageKey(), token);
            else localStorage.removeItem(TaskTideAPI.authStorageKey());
        } catch {
            /* ignore */
        }
    }

    clearStoredToken() {
        this.setStoredToken(null);
    }

    authHeader() {
        const token = this.getStoredToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    static resolveBackendOrigin() {
        const base = TaskTideAPI.resolveApiBaseUrl();
        return base.replace(/\/api\/?$/i, '') || base;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.defaultHeaders,
                ...this.authHeader(),
                ...(options.headers || {}),
            },
        };

        try {
            const response = await fetch(url, config);
            const contentType = response.headers.get('content-type') || '';
            const text = await response.text();
            let data = {};

            if (text) {
                if (contentType.includes('application/json')) {
                    try {
                        data = JSON.parse(text);
                    } catch {
                        throw new Error(`Invalid JSON from API (HTTP ${response.status})`);
                    }
                } else {
                    data = { message: text };
                }
            }

            if (!response.ok) {
                throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Task Management API
    async getTasks(filters = {}) {
        const queryParams = new URLSearchParams();

        if (filters.category && filters.category !== 'all') {
            queryParams.append('category', filters.category);
        }
        if (filters.priority && filters.priority !== 'all') {
            queryParams.append('priority', filters.priority);
        }
        if (filters.completed !== undefined) {
            queryParams.append('completed', filters.completed);
        }
        if (filters.q && String(filters.q).trim()) {
            queryParams.append('q', String(filters.q).trim());
        }

        const queryString = queryParams.toString();
        const endpoint = queryString ? `/tasks?${queryString}` : '/tasks';

        return this.request(endpoint);
    }

    async getTask(id) {
        return this.request(`/tasks/${id}`);
    }

    async createTask(taskData) {
        return this.request('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData),
        });
    }

    async updateTask(id, taskData) {
        return this.request(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(taskData),
        });
    }

    async deleteTask(id) {
        return this.request(`/tasks/${id}`, {
            method: 'DELETE',
        });
    }

    async toggleTask(id) {
        return this.request(`/tasks/${id}/toggle`, {
            method: 'PATCH',
        });
    }

    // AI API
    async getAISuggestions() {
        return this.request('/ai/suggestions');
    }

    async getAnalytics() {
        return this.request('/ai/analytics');
    }

    async prioritizeTasks(tasks) {
        return this.request('/ai/prioritize', {
            method: 'POST',
            body: JSON.stringify({ tasks }),
        });
    }

    async authRegister(payload) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
    }

    async authLogin(payload) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
    }

    async authMe() {
        return this.request('/auth/me');
    }

    // Health check
    async healthCheck() {
        try {
            const origin = TaskTideAPI.resolveBackendOrigin();
            const response = await fetch(`${origin}/health`);
            return response.ok;
        } catch {
            return false;
        }
    }
}

// Create global API instance
window.taskTideAPI = new TaskTideAPI();
