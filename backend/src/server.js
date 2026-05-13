const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { tasks } = require('./store/tasksStore');
const { loadTasksSync } = require('./store/tasksPersistence');
loadTasksSync(tasks);

const taskRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

const defaultDevOrigins = [
  'http://localhost:8080',
  'http://localhost:8000',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173'
];

const configuredOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const singleFrontend = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL.trim()].filter(Boolean)
  : [];

const allowedOrigins = new Set([
  ...defaultDevOrigins,
  ...configuredOrigins,
  ...singleFrontend
]);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true
  })
);
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'task-tide-backend',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Task-Tide Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      tasks: '/api/tasks',
      ai: '/api/ai'
    }
  });
});

// 404 handler (must be registered before the error handler)
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server when run directly (not when imported by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Task-Tide Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
  });
}

module.exports = app;
