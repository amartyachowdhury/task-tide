const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config({ quiet: true });

const { openDatabase } = require('./db/database');
const { authenticate } = require('./middleware/authenticate');

const app = express();

/** Monorepo: backend/src → repo root. Docker backend image: static files live under /app next to src. */
function resolveRepoRoot() {
  const twoUp = path.join(__dirname, '../..');
  if (fs.existsSync(path.join(twoUp, 'landing'))) {
    return twoUp;
  }
  const oneUp = path.join(__dirname, '..');
  if (fs.existsSync(path.join(oneUp, 'landing'))) {
    return oneUp;
  }
  return oneUp;
}

const repoRoot = resolveRepoRoot();
const landingDir = path.join(repoRoot, 'landing');
const frontendPublicDir = path.join(repoRoot, 'frontend/public');
const frontendSrcDir = path.join(repoRoot, 'frontend/src');
const PORT = process.env.PORT || 3001;

app.use(async (req, res, next) => {
  try {
    await openDatabase();
    next();
  } catch (err) {
    next(err);
  }
});

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');
const { errorHandler } = require('./middleware/errorHandler');

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

// Health check endpoint (database readiness without failing legacy probes)
app.get('/health', (req, res) => {
  let database = 'unknown';
  try {
    const { getDb } = require('./db/database');
    const row = getDb().getRow('SELECT 1 AS ok');
    database = row != null && Number(row.ok) === 1 ? 'ok' : 'error';
  } catch {
    database = 'error';
  }

  const ready = database === 'ok';
  res.status(200).json({
    status: ready ? 'healthy' : 'degraded',
    ready,
    checks: { database },
    timestamp: new Date().toISOString(),
    service: 'task-tide-backend',
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', authenticate, taskRoutes);
app.use('/api/ai', authenticate, aiRoutes);

app.use('/', express.static(landingDir, { index: 'index.html' }));
app.use('/public', express.static(frontendPublicDir));
app.use('/src', express.static(frontendSrcDir));

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
  openDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Task-Tide Backend running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
      });
    })
    .catch((err) => {
      console.error('Failed to open database:', err);
      process.exit(1);
    });
}

module.exports = app;
