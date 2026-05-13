const fs = require('fs');
const path = require('path');
const os = require('os');

describe('SQLite task persistence', () => {
  let tmpDir;
  let dbFile;
  const savedSqlitePath = process.env.TASK_TIDE_SQLITE_PATH;
  const savedDataFile = process.env.TASK_TIDE_DATA_FILE;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'task-tide-sqlite-'));
    dbFile = path.join(tmpDir, 'tasks.db');
    process.env.TASK_TIDE_SQLITE_PATH = dbFile;

    jest.resetModules();
    const { closeDatabase } = require('../src/db/database');
    closeDatabase();
  });

  afterEach(async () => {
    const { closeDatabase } = require('../src/db/database');
    closeDatabase();

    if (savedSqlitePath === undefined) {
      delete process.env.TASK_TIDE_SQLITE_PATH;
    } else {
      process.env.TASK_TIDE_SQLITE_PATH = savedSqlitePath;
    }
    if (savedDataFile === undefined) {
      delete process.env.TASK_TIDE_DATA_FILE;
    } else {
      process.env.TASK_TIDE_DATA_FILE = savedDataFile;
    }
    jest.resetModules();
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('persists tasks across database reopen on disk', async () => {
    const { openDatabase, closeDatabase } = require('../src/db/database');
    const taskRepository = require('../src/db/taskRepository');

    await openDatabase();
    const now = new Date().toISOString();
    taskRepository.insert({
      id: 'id-1',
      title: 'Persisted',
      description: '',
      category: 'work',
      priority: 'medium',
      dueDate: null,
      estimate: 1,
      completed: false,
      createdAt: now,
      updatedAt: now,
      aiScore: 42
    });
    expect(taskRepository.findAll()).toHaveLength(1);
    closeDatabase();

    jest.resetModules();
    process.env.TASK_TIDE_SQLITE_PATH = dbFile;
    const { openDatabase: open2 } = require('../src/db/database');
    const taskRepository2 = require('../src/db/taskRepository');
    await open2();

    const rows = taskRepository2.findAll();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Persisted');
    expect(rows[0].aiScore).toBe(42);
  });

  it('migrates legacy tasks.json into SQLite when the DB is empty', async () => {
    const legacyPath = path.join(tmpDir, 'tasks.json');
    const sample = [
      {
        id: 'legacy-a',
        title: 'From JSON',
        description: 'd',
        category: 'personal',
        priority: 'low',
        dueDate: null,
        estimate: 2,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        aiScore: 10
      }
    ];
    fs.writeFileSync(legacyPath, JSON.stringify(sample), 'utf8');
    process.env.TASK_TIDE_DATA_FILE = legacyPath;

    jest.resetModules();
    const { openDatabase, closeDatabase } = require('../src/db/database');
    const taskRepository = require('../src/db/taskRepository');

    await openDatabase();
    const rows = taskRepository.findAll();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('From JSON');
    expect(fs.existsSync(legacyPath)).toBe(false);
    expect(fs.existsSync(`${legacyPath}.migrated`)).toBe(true);
    closeDatabase();
  });
});
