// Task-Tide API Service
// Handles communication with the backend API

class TaskTideAPI {
    constructor() {
        this.baseUrl = 'http://localhost:3001/api';
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: this.defaultHeaders,
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
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

    // Health check
    async healthCheck() {
        try {
            const response = await fetch('http://localhost:3001/health');
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Create global API instance
window.taskTideAPI = new TaskTideAPI();
