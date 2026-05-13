const request = require('supertest');
const app = require('../src/server');
const { resetTasksForTests } = require('../src/store/tasksStore');

describe('Task-Tide API', () => {
  beforeEach(() => {
    resetTasksForTests();
  });

  describe('GET /health', () => {
    it('returns healthy status', async () => {
      const res = await request(app).get('/health').expect(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('task-tide-backend');
    });
  });

  describe('GET /api/unknown', () => {
    it('returns 404 JSON for unknown API paths', async () => {
      const res = await request(app).get('/api/does-not-exist').expect(404);
      expect(res.body.error).toBe('Endpoint not found');
    });
  });

  describe('Tasks + shared store with AI', () => {
    it('creates a task and exposes it to AI analytics', async () => {
      const create = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Write tests',
          description: 'Integration coverage',
          category: 'work',
          priority: 'high',
          dueDate: null,
          estimate: 2,
          completed: false
        })
        .expect(201);

      expect(create.body.success).toBe(true);
      expect(create.body.data.id).toBeDefined();

      const analytics = await request(app).get('/api/ai/analytics').expect(200);
      expect(analytics.body.success).toBe(true);
      expect(analytics.body.data.overview.totalTasks).toBe(1);
      expect(analytics.body.data.overview.completedTasks).toBe(0);
    });

    it('includes overdue warning in AI suggestions when task is overdue', async () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      await request(app)
        .post('/api/tasks')
        .send({
          title: 'Late task',
          description: '',
          category: 'work',
          priority: 'medium',
          dueDate: past,
          estimate: 1,
          completed: false
        })
        .expect(201);

      const suggestions = await request(app).get('/api/ai/suggestions').expect(200);
      expect(suggestions.body.data.some((s) => s.type === 'warning')).toBe(true);
    });

    it('sets completedAt when toggling complete and clears when toggling back', async () => {
      const { body } = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Toggle me',
          description: '',
          category: 'personal',
          priority: 'low',
          dueDate: null,
          estimate: 1,
          completed: false
        })
        .expect(201);

      const id = body.data.id;

      const on = await request(app).patch(`/api/tasks/${id}/toggle`).expect(200);
      expect(on.body.data.completed).toBe(true);
      expect(on.body.data.completedAt).toBeDefined();

      const off = await request(app).patch(`/api/tasks/${id}/toggle`).expect(200);
      expect(off.body.data.completed).toBe(false);
      expect(off.body.data.completedAt).toBeUndefined();
    });

    it('updates completedAt via PUT when marking completed', async () => {
      const { body } = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Finish me',
          description: '',
          category: 'health',
          priority: 'medium',
          dueDate: null,
          estimate: 1,
          completed: false
        })
        .expect(201);

      const id = body.data.id;

      const updated = await request(app)
        .put(`/api/tasks/${id}`)
        .send({ completed: true })
        .expect(200);

      expect(updated.body.data.completed).toBe(true);
      expect(updated.body.data.completedAt).toBeDefined();
    });
  });

  describe('POST /api/ai/prioritize', () => {
    it('returns prioritized tasks for a valid array', async () => {
      const res = await request(app)
        .post('/api/ai/prioritize')
        .send({
          tasks: [
            {
              title: 'Urgent deadline',
              priority: 'high',
              category: 'work',
              dueDate: new Date(Date.now() + 86400000).toISOString()
            }
          ]
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].aiScore).toBeGreaterThan(0);
    });

    it('rejects non-array tasks payload', async () => {
      const res = await request(app)
        .post('/api/ai/prioritize')
        .send({ tasks: 'nope' })
        .expect(400);
      expect(res.body.success).toBe(false);
    });
  });
});
