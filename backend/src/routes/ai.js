const express = require('express');
const router = express.Router();

// In-memory storage (replace with database in production)
let tasks = [];

// GET /api/ai/suggestions - Get AI suggestions
router.get('/suggestions', (req, res) => {
  try {
    const suggestions = [];
    
    // Overdue tasks
    const overdueTasks = tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
    );
    if (overdueTasks.length > 0) {
      suggestions.push({
        type: 'warning',
        message: `You have ${overdueTasks.length} overdue task(s). Consider rescheduling or completing them soon.`,
        action: 'View overdue tasks',
        priority: 'high'
      });
    }

    // High priority tasks without due dates
    const highPriorityNoDue = tasks.filter(task => 
      task.priority === 'high' && !task.dueDate && !task.completed
    );
    if (highPriorityNoDue.length > 0) {
      suggestions.push({
        type: 'info',
        message: `You have ${highPriorityNoDue.length} high priority task(s) without due dates. Consider setting deadlines.`,
        action: 'Set due dates',
        priority: 'medium'
      });
    }

    // Task distribution analysis
    const categoryCounts = tasks.reduce((acc, task) => {
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
        action: 'Break down tasks',
        priority: 'low'
      });
    }

    // Productivity suggestions
    const completedToday = tasks.filter(task => {
      const today = new Date();
      const completedDate = new Date(task.completedAt || task.createdAt);
      return task.completed && completedDate.toDateString() === today.toDateString();
    }).length;

    if (completedToday === 0 && tasks.filter(t => !t.completed).length > 0) {
      suggestions.push({
        type: 'motivation',
        message: "Start your day with a quick win! Complete a small task to build momentum.",
        action: 'Find quick tasks',
        priority: 'medium'
      });
    }

    // Time management suggestions
    const totalEstimatedHours = tasks
      .filter(task => !task.completed)
      .reduce((total, task) => total + (task.estimate || 1), 0);

    if (totalEstimatedHours > 40) {
      suggestions.push({
        type: 'warning',
        message: `You have ${totalEstimatedHours} hours of estimated work. Consider prioritizing or delegating some tasks.`,
        action: 'Review workload',
        priority: 'high'
      });
    }

    res.json({
      success: true,
      data: suggestions,
      count: suggestions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI suggestions',
      message: error.message
    });
  }
});

// GET /api/ai/analytics - Get productivity analytics
router.get('/analytics', (req, res) => {
  try {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const timeBlocked = tasks.reduce((total, task) => {
      return total + (task.completed ? (task.estimate || 1) : 0);
    }, 0);

    const categoryStats = tasks.reduce((acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = { total: 0, completed: 0 };
      }
      acc[task.category].total++;
      if (task.completed) {
        acc[task.category].completed++;
      }
      return acc;
    }, {});

    const priorityStats = tasks.reduce((acc, task) => {
      if (!acc[task.priority]) {
        acc[task.priority] = { total: 0, completed: 0 };
      }
      acc[task.priority].total++;
      if (task.completed) {
        acc[task.priority].completed++;
      }
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        overview: {
          totalTasks,
          completedTasks,
          productivityScore,
          timeBlocked
        },
        categoryStats,
        priorityStats,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics',
      message: error.message
    });
  }
});

// POST /api/ai/prioritize - Get AI-powered task prioritization
router.post('/prioritize', (req, res) => {
  try {
    const { tasks: tasksToPrioritize } = req.body;
    
    if (!Array.isArray(tasksToPrioritize)) {
      return res.status(400).json({
        success: false,
        error: 'Tasks must be an array'
      });
    }

    const prioritizedTasks = tasksToPrioritize.map(task => {
      let score = 0;
      
      // Priority scoring
      const priorityScores = { high: 30, medium: 20, low: 10 };
      score += priorityScores[task.priority] || 0;

      // Due date urgency
      if (task.dueDate) {
        const daysUntilDue = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue <= 1) score += 20;
        else if (daysUntilDue <= 3) score += 15;
        else if (daysUntilDue <= 7) score += 10;
      }

      // Title keywords
      const urgentKeywords = ['urgent', 'asap', 'immediately', 'deadline', 'critical'];
      const titleLower = (task.title || '').toLowerCase();
      if (urgentKeywords.some(keyword => titleLower.includes(keyword))) {
        score += 15;
      }

      // Category weighting
      const categoryWeights = { work: 1.2, health: 1.1, learning: 1.0, personal: 0.9 };
      score *= (categoryWeights[task.category] || 1.0);

      return {
        ...task,
        aiScore: Math.min(Math.round(score), 100)
      };
    });

    // Sort by AI score
    prioritizedTasks.sort((a, b) => b.aiScore - a.aiScore);

    res.json({
      success: true,
      data: prioritizedTasks,
      message: 'Tasks prioritized successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to prioritize tasks',
      message: error.message
    });
  }
});

module.exports = router;
