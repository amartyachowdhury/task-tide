const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const { DEFAULT_TENANT_ORG_ID } = require('../config/saas');

let SQL = null;
let db = null;
let openPromise = null;

/** Repo-root `database/` directory (this file lives in backend/src/db). */
function repoDatabaseDir() {
  return path.join(__dirname, '../../../database');
}

function getSqlitePath() {
  const explicit = process.env.TASK_TIDE_SQLITE_PATH;
  if (explicit != null && String(explicit).trim() !== '') {
    return String(explicit).trim();
  }
  if (process.env.DISABLE_TASK_PERSISTENCE === '1') {
    return ':memory:';
  }
  if (process.env.NODE_ENV === 'test') {
    return ':memory:';
  }
  return path.join(repoDatabaseDir(), 'tasks.db');
}

function wasmLocate(file) {
  return path.join(path.dirname(require.resolve('sql.js')), file);
}

function persistToDisk() {
  const sqlitePath = getSqlitePath();
  if (sqlitePath === ':memory:' || !db) return;
  const dir = path.dirname(sqlitePath);
  fs.mkdirSync(dir, { recursive: true });
  const data = db.export();
  fs.writeFileSync(sqlitePath, Buffer.from(data));
}

function runExec(sql) {
  db.run(sql);
  persistToDisk();
}

function runParameterized(sql, params) {
  db.run(sql, params);
  persistToDisk();
}

function allRows(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function getRow(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const has = stmt.step();
  const row = has ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

function ensureDefaultTenantOrg() {
  const existing = getRow('SELECT id FROM organizations WHERE id = ?', [DEFAULT_TENANT_ORG_ID]);
  if (existing) return DEFAULT_TENANT_ORG_ID;
  const now = new Date().toISOString();
  runParameterized('INSERT INTO organizations (id, name, created_at) VALUES (?, ?, ?)', [
    DEFAULT_TENANT_ORG_ID,
    'Workspace',
    now
  ]);
  return DEFAULT_TENANT_ORG_ID;
}

function ensureSaaSBaseTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS organization_users (
      organization_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      PRIMARY KEY (organization_id, user_id)
    );
  `);
}

function taskColumnNames() {
  return allRows('PRAGMA table_info(tasks)').map((c) => c.name);
}

function ensureTasksTable() {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      priority TEXT NOT NULL,
      due_date TEXT,
      estimate REAL NOT NULL DEFAULT 1,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      ai_score INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      organization_id TEXT
    );
  `);
}

function migrateTasksOrganizationId() {
  const cols = taskColumnNames();
  if (!cols.includes('organization_id')) {
    runExec('ALTER TABLE tasks ADD COLUMN organization_id TEXT');
  }
  const orgId = ensureDefaultTenantOrg();
  runParameterized(
    'UPDATE tasks SET organization_id = ? WHERE organization_id IS NULL OR organization_id = ?',
    [orgId, '']
  );
}

function migrateLegacyJsonIfEmpty() {
  if (process.env.NODE_ENV === 'test' && !process.env.TASK_TIDE_DATA_FILE) {
    return;
  }
  const row = getRow('SELECT COUNT(*) AS c FROM tasks');
  if (row && Number(row.c) > 0) return;

  const legacyPath =
    process.env.TASK_TIDE_DATA_FILE || path.join(repoDatabaseDir(), 'tasks.json');
  try {
    if (!fs.existsSync(legacyPath)) return;
    const raw = fs.readFileSync(legacyPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return;

    const orgId = ensureDefaultTenantOrg();

    const insertSql = `
      INSERT INTO tasks (
        id, title, description, category, priority, due_date, estimate,
        completed, created_at, updated_at, ai_score, completed_at, organization_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const item of parsed) {
      if (!item || typeof item.id !== 'string' || typeof item.title !== 'string') continue;
      db.run(insertSql, [
        item.id,
        item.title,
        item.description != null ? String(item.description) : '',
        item.category,
        item.priority,
        item.dueDate != null ? String(item.dueDate) : null,
        Number(item.estimate) || 1,
        item.completed ? 1 : 0,
        item.createdAt || new Date().toISOString(),
        item.updatedAt || new Date().toISOString(),
        Number(item.aiScore) || 0,
        item.completedAt != null ? String(item.completedAt) : null,
        orgId
      ]);
    }

    persistToDisk();
    fs.renameSync(legacyPath, `${legacyPath}.migrated`);
    if (process.env.NODE_ENV !== 'test') {
      console.log('[db] Migrated tasks from legacy JSON file to SQLite.');
    }
  } catch (e) {
    console.warn('[db] Legacy JSON migration skipped:', e.message);
  }
}

function createSchema() {
  ensureSaaSBaseTables();
  ensureTasksTable();
  migrateTasksOrganizationId();
}

async function openDatabase() {
  if (db) return db;
  if (openPromise) return openPromise;

  openPromise = (async () => {
    if (!SQL) {
      SQL = await initSqlJs({ locateFile: wasmLocate });
    }

    const sqlitePath = getSqlitePath();
    if (sqlitePath === ':memory:') {
      db = new SQL.Database();
    } else if (fs.existsSync(sqlitePath)) {
      const buf = fs.readFileSync(sqlitePath);
      db = new SQL.Database(new Uint8Array(buf));
    } else {
      fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
      db = new SQL.Database();
    }

    createSchema();
    migrateLegacyJsonIfEmpty();
    persistToDisk();
    return db;
  })();

  await openPromise;
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized; await openDatabase() before handling requests.');
  }
  return {
    runExec,
    runParameterized,
    allRows,
    getRow,
    persistToDisk
  };
}

function closeDatabase() {
  if (db) {
    try {
      persistToDisk();
    } catch {
      /* ignore */
    }
    db.close();
    db = null;
  }
  openPromise = null;
}

module.exports = {
  openDatabase,
  getDb,
  closeDatabase,
  getSqlitePath
};
