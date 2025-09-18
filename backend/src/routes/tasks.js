const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

// In-memory storage (replace with database in production)
let tasks = [];

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

// Helper function to calculate AI score
const calculateAIScore = (task) => {
  let score = 0;
  
  // Priority scoring
  const priorityScores = { high: 30, medium: 20, low: 10 };
  score += priorityScores[task.priority];

  // Due date urgency
  if (task.dueDate) {
    const daysUntilDue = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 1) score += 20;
    else if (daysUntilDue <= 3) score += 15;
    else if (daysUntilDue <= 7) score += 10;
  }

  // Title keywords
  const urgentKeywords = ['urgent', 'asap', 'immediately', 'deadline', 'critical'];
  const titleLower = task.title.toLowerCase();
  if (urgentKeywords.some(keyword => titleLower.includes(keyword))) {
    score += 15;
  }

  return Math.min(score, 100);
};

// GET /api/tasks - Get all tasks
router.get('/', (req, res) => {
  try {
    const { category, priority, completed } = req.query;
    
    let filteredTasks = [...tasks];
    
    // Apply filters
    if (category && category !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.category === category);
    }
    
    if (priority && priority !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === priority);
    }
    
    if (completed !== undefined) {
      const isCompleted = completed === 'true';
      filteredTasks = filteredTasks.filter(task => task.completed === isCompleted);
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
    
    res.json({
      success: true,
      data: filteredTasks,
      count: filteredTasks.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
      message: error.message
    });
  }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', (req, res) => {
  try {
    const task = tasks.find(t => t.id === req.params.id);
    
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task',
      message: error.message
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
        details: error.details.map(d => d.message)
      });
    }
    
    const task = {
      id: uuidv4(),
      ...value,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiScore: calculateAIScore(value)
    };
    
    tasks.push(task);
    
    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create task',
      message: error.message
    });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', (req, res) => {
  try {
    const taskIndex = tasks.findIndex(t => t.id === req.params.id);
    
    if (taskIndex === -1) {
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
        details: error.details.map(d => d.message)
      });
    }
    
    const updatedTask = {
      ...tasks[taskIndex],
      ...value,
      updatedAt: new Date().toISOString(),
      aiScore: calculateAIScore({ ...tasks[taskIndex], ...value })
    };
    
    tasks[taskIndex] = updatedTask;
    
    res.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update task',
      message: error.message
    });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', (req, res) => {
  try {
    const taskIndex = tasks.findIndex(t => t.id === req.params.id);
    
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    const deletedTask = tasks.splice(taskIndex, 1)[0];
    
    res.json({
      success: true,
      data: deletedTask,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete task',
      message: error.message
    });
  }
});

// PATCH /api/tasks/:id/toggle - Toggle task completion
router.patch('/:id/toggle', (req, res) => {
  try {
    const taskIndex = tasks.findIndex(t => t.id === req.params.id);
    
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    tasks[taskIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: tasks[taskIndex],
      message: `Task marked as ${tasks[taskIndex].completed ? 'completed' : 'incomplete'}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to toggle task',
      message: error.message
    });
  }
});

module.exports = router;
