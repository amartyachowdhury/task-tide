const request = require('supertest');
const app = require('../src/server');
const { resetTasksForTests } = require('../src/store/tasksStore');

describe('Task-Tide API', () => {
  beforeEach(() => {
    resetTasksForTests();
  });

  describe('GET /health', () => {
    it('returns healthy status when the database is reachable', async () => {
      const res = await request(app).get('/health').expect(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.ready).toBe(true);
      expect(res.body.checks.database).toBe('ok');
      expect(res.body.service).toBe('task-tide-backend');
    });
  });

  describe('GET /api/unknown', () => {
    it('returns 404 JSON for unknown API paths', async () => {
      const res = await request(app).get('/api/does-not-exist').expect(404);
      expect(res.body.error).toBe('Endpoint not found');
    });
  });

  describe('Auth', () => {
    it('registers a workspace and accepts Bearer token on tasks', async () => {
      const email = `int-${Date.now()}@example.com`;
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'password12',
          organizationName: 'Integration Org'
        })
        .expect(201);

      expect(reg.body.success).toBe(true);
      const token = reg.body.data.token;
      expect(token).toBeDefined();

      const tasks = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(tasks.body.success).toBe(true);
      expect(Array.isArray(tasks.body.data)).toBe(true);
      expect(typeof tasks.body.total).toBe('number');
    });
  });

  describe('Task API validation & bulk', () => {
    it('rejects non-UUID task ids', async () => {
      const res = await request(app).get('/api/tasks/not-a-uuid').expect(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid task id');
    });

    it('rejects invalid list query parameters', async () => {
      const res = await request(app).get('/api/tasks').query({ limit: 9999 }).expect(400);
      expect(res.body.success).toBe(false);
    });

    it('bulk-deletes tasks by id', async () => {
      const a = await request(app)
        .post('/api/tasks')
        .send({
          title: 'A',
          description: '',
          category: 'work',
          priority: 'low',
          dueDate: null,
          estimate: 1,
          completed: false
        })
        .expect(201);
      const b = await request(app)
        .post('/api/tasks')
        .send({
          title: 'B',
          description: '',
          category: 'work',
          priority: 'low',
          dueDate: null,
          estimate: 1,
          completed: false
        })
        .expect(201);

      const del = await request(app)
        .post('/api/tasks/bulk/delete')
        .send({ ids: [a.body.data.id, b.body.data.id] })
        .expect(200);

      expect(del.body.success).toBe(true);
      expect(del.body.data.deleted).toBe(2);

      const list = await request(app).get('/api/tasks').expect(200);
      expect(list.body.total).toBe(0);
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

    it('filters tasks by search query q on title or description', async () => {
      await request(app)
        .post('/api/tasks')
        .send({
          title: 'Quarterly report',
          description: 'Finance spreadsheet',
          category: 'work',
          priority: 'medium',
          dueDate: null,
          estimate: 1,
          completed: false
        })
        .expect(201);

      await request(app)
        .post('/api/tasks')
        .send({
          title: 'Grocery run',
          description: 'Milk and eggs',
          category: 'personal',
          priority: 'low',
          dueDate: null,
          estimate: 1,
          completed: false
        })
        .expect(201);

      const byTitle = await request(app).get('/api/tasks').query({ q: 'Quarterly' }).expect(200);
      expect(byTitle.body.count).toBe(1);
      expect(byTitle.body.data[0].title).toContain('Quarterly');

      const byDesc = await request(app).get('/api/tasks').query({ q: 'eggs' }).expect(200);
      expect(byDesc.body.count).toBe(1);
      expect(byDesc.body.data[0].title).toContain('Grocery');
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
