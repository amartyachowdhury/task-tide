const { randomUUID } = require('crypto');
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const taskRepository = require('../db/taskRepository');
const { validateTaskIdParam } = require('../middleware/validateTaskId');

// Validation schemas
const taskSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).allow(''),
  category: Joi.string().valid('work', 'personal', 'health', 'learning').required(),
  priority: Joi.string().valid('high', 'medium', 'low').required(),
  dueDate: Joi.date().iso().allow(null),
  estimate: Joi.number().min(0.5).max(24).default(1),
  completed: Joi.boolean().default(false)
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200),
  description: Joi.string().max(1000).allow(''),
  category: Joi.string().valid('work', 'personal', 'health', 'learning'),
  priority: Joi.string().valid('high', 'medium', 'low'),
  dueDate: Joi.date().iso().allow(null),
  estimate: Joi.number().min(0.5).max(24),
  completed: Joi.boolean()
});

const listQuerySchema = Joi.object({
  category: Joi.string().valid('all', 'work', 'personal', 'health', 'learning'),
  priority: Joi.string().valid('all', 'high', 'medium', 'low'),
  completed: Joi.string().valid('true', 'false'),
  q: Joi.string().max(200).allow(''),
  limit: Joi.number().integer().min(1).max(500).default(500),
  offset: Joi.number().integer().min(0).max(100_000).default(0)
});

const bulkIdsSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).min(1).max(100).required()
});

const bulkSetCompletedSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).min(1).max(100).required(),
  completed: Joi.boolean().required()
});

// Helper function to calculate AI score
const calculateAIScore = (task) => {
  let score = 0;

  const priorityScores = { high: 30, medium: 20, low: 10 };
  score += priorityScores[task.priority];

  if (task.dueDate) {
    const daysUntilDue = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 1) score += 20;
    else if (daysUntilDue <= 3) score += 15;
    else if (daysUntilDue <= 7) score += 10;
  }

  const urgentKeywords = ['urgent', 'asap', 'immediately', 'deadline', 'critical'];
  const titleLower = task.title.toLowerCase();
  if (urgentKeywords.some((keyword) => titleLower.includes(keyword))) {
    score += 15;
  }

  return Math.min(score, 100);
};

function normalizeTaskPayload(value) {
  const out = { ...value };
  if (out.dueDate instanceof Date) {
    out.dueDate = out.dueDate.toISOString();
  }
  return out;
}

// GET /api/tasks - List tasks (validated query + pagination)
router.get('/', (req, res) => {
  try {
    const { error, value: query } = listQuerySchema.validate(req.query, {
      stripUnknown: true,
      convert: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.details.map((d) => d.message)
      });
    }

    const { organizationId } = req.auth;
    const { category, priority, completed, q, limit, offset } = query;

    let filteredTasks = [...taskRepository.findAll(organizationId)];

    if (category && category !== 'all') {
      filteredTasks = filteredTasks.filter((task) => task.category === category);
    }

    if (priority && priority !== 'all') {
      filteredTasks = filteredTasks.filter((task) => task.priority === priority);
    }

    if (completed !== undefined) {
      const isCompleted = completed === 'true';
      filteredTasks = filteredTasks.filter((task) => task.completed === isCompleted);
    }

    const search = typeof q === 'string' ? q.trim() : '';
    if (search) {
      const needle = search.toLowerCase();
      filteredTasks = filteredTasks.filter((task) => {
        const title = (task.title || '').toLowerCase();
        const description = (task.description || '').toLowerCase();
        return title.includes(needle) || description.includes(needle);
      });
    }

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

    const total = filteredTasks.length;
    const page = filteredTasks.slice(offset, offset + limit);

    res.json({
      success: true,
      data: page,
      count: page.length,
      total,
      limit,
      offset
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
      message: err.message
    });
  }
});

router.post('/bulk/delete', (req, res) => {
  try {
    const { error, value } = bulkIdsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map((d) => d.message)
      });
    }
    const ids = [...new Set(value.ids)];
    const { organizationId } = req.auth;
    taskRepository.bulkDeleteByIds(ids, organizationId);
    res.json({
      success: true,
      data: { deleted: ids.length },
      message: `${ids.length} task(s) deleted`
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete tasks',
      message: err.message
    });
  }
});

router.post('/bulk/set-completed', (req, res) => {
  try {
    const { error, value } = bulkSetCompletedSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map((d) => d.message)
      });
    }
    const ids = [...new Set(value.ids)];
    const { organizationId } = req.auth;
    taskRepository.bulkSetCompleted(ids, organizationId, value.completed);
    res.json({
      success: true,
      data: { updated: ids.length, completed: value.completed },
      message: `${ids.length} task(s) updated`
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to update tasks',
      message: err.message
    });
  }
});

router.param('id', validateTaskIdParam);

// GET /api/tasks/:id - Get single task
router.get('/:id', (req, res) => {
  try {
    const task = taskRepository.findById(req.params.id, req.auth.organizationId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task',
      message: err.message
    });
  }
});

// POST /api/tasks - Create new task
router.post('/', (req, res) => {
  try {
    const { error, value } = taskSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map((d) => d.message)
      });
    }

    const normalized = normalizeTaskPayload(value);
    const task = {
      id: randomUUID(),
      ...normalized,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiScore: calculateAIScore(normalized)
    };

    if (task.completed) {
      task.completedAt = new Date().toISOString();
    }

    taskRepository.insert(task, req.auth.organizationId);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to create task',
      message: err.message
    });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', (req, res) => {
  try {
    const existing = taskRepository.findById(req.params.id, req.auth.organizationId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const { error, value } = updateTaskSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map((d) => d.message)
      });
    }

    const normalized = normalizeTaskPayload(value);
    const merged = { ...existing, ...normalized };
    if (normalized.completed === true && !existing.completed) {
      merged.completedAt = new Date().toISOString();
    } else if (normalized.completed === false) {
      delete merged.completedAt;
    }

    const updatedTask = {
      ...merged,
      updatedAt: new Date().toISOString(),
      aiScore: calculateAIScore(merged)
    };

    taskRepository.updateTask(updatedTask, req.auth.organizationId);

    res.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to update task',
      message: err.message
    });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', (req, res) => {
  try {
    const existing = taskRepository.findById(req.params.id, req.auth.organizationId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    taskRepository.deleteById(req.params.id, req.auth.organizationId);

    res.json({
      success: true,
      data: existing,
      message: 'Task deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete task',
      message: err.message
    });
  }
});

// PATCH /api/tasks/:id/toggle - Toggle task completion
router.patch('/:id/toggle', (req, res) => {
  try {
    const existing = taskRepository.findById(req.params.id, req.auth.organizationId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const nextCompleted = !existing.completed;
    const updatedTask = {
      ...existing,
      completed: nextCompleted,
      updatedAt: new Date().toISOString()
    };
    if (nextCompleted) {
      updatedTask.completedAt = new Date().toISOString();
    } else {
      delete updatedTask.completedAt;
    }

    taskRepository.updateTask(updatedTask, req.auth.organizationId);

    res.json({
      success: true,
      data: updatedTask,
      message: `Task marked as ${updatedTask.completed ? 'completed' : 'incomplete'}`
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to toggle task',
      message: err.message
    });
  }
});

module.exports = router;
