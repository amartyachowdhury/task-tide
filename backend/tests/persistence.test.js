const fs = require('fs');
const path = require('path');
const os = require('os');

describe('tasksPersistence', () => {
  let tmpDir;
  let tmpFile;
  const savedPersistTest = process.env.TASK_TIDE_PERSIST_TEST;
  const savedDataFile = process.env.TASK_TIDE_DATA_FILE;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'task-tide-'));
    tmpFile = path.join(tmpDir, 'tasks.json');
    process.env.TASK_TIDE_PERSIST_TEST = '1';
    process.env.TASK_TIDE_DATA_FILE = tmpFile;
    jest.resetModules();
  });

  afterEach(() => {
    jest.useRealTimers();
    if (savedPersistTest === undefined) {
      delete process.env.TASK_TIDE_PERSIST_TEST;
    } else {
      process.env.TASK_TIDE_PERSIST_TEST = savedPersistTest;
    }
    if (savedDataFile === undefined) {
      delete process.env.TASK_TIDE_DATA_FILE;
    } else {
      process.env.TASK_TIDE_DATA_FILE = savedDataFile;
    }
    jest.resetModules();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes tasks to disk after debounced notify', () => {
    jest.useFakeTimers();
    const { tasks, resetTasksForTests } = require('../src/store/tasksStore');
    const persist = require('../src/store/tasksPersistence');

    expect(persist.persistenceActive()).toBe(true);

    resetTasksForTests();
    tasks.push({
      id: 'id-1',
      title: 'Persisted',
      description: '',
      category: 'work',
      priority: 'medium',
      dueDate: null,
      estimate: 1,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiScore: 42
    });

    persist.notifyTasksMutated(tasks);
    jest.advanceTimersByTime(400);

    const raw = fs.readFileSync(tmpFile, 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe('Persisted');
  });

  it('loadTasksSync restores tasks from file', () => {
    const sample = [
      {
        id: 'a',
        title: 'From disk',
        description: '',
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
    fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
    fs.writeFileSync(tmpFile, JSON.stringify(sample), 'utf8');

    const { tasks, resetTasksForTests } = require('../src/store/tasksStore');
    const persist = require('../src/store/tasksPersistence');
    resetTasksForTests();
    persist.loadTasksSync(tasks);

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('From disk');
  });
});
