const fs = require('fs');
const path = require('path');

function persistenceActive() {
  if (process.env.DISABLE_TASK_PERSISTENCE === '1') return false;
  if (process.env.NODE_ENV === 'test' && process.env.TASK_TIDE_PERSIST_TEST !== '1') {
    return false;
  }
  return true;
}

function getDataFile() {
  return process.env.TASK_TIDE_DATA_FILE || path.join(__dirname, '../../data/tasks.json');
}

function isValidTaskRecord(item) {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.category === 'string' &&
    typeof item.priority === 'string'
  );
}

/**
 * Replace contents of tasksArr from disk (sync, startup only).
 * @param {object[]} tasksArr
 */
function loadTasksSync(tasksArr) {
  if (!persistenceActive()) return;
  const file = getDataFile();
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    tasksArr.length = 0;
    for (const item of parsed) {
      if (isValidTaskRecord(item)) {
        tasksArr.push(item);
      }
    }
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.warn('[tasksPersistence] load failed:', e.message);
    }
  }
}

let saveTimer;

/**
 * Debounced persist after in-memory mutations.
 * @param {object[]} tasksArr
 */
function notifyTasksMutated(tasksArr) {
  if (!persistenceActive()) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const file = getDataFile();
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(tasksArr, null, 2), 'utf8');
    } catch (e) {
      console.error('[tasksPersistence] save failed:', e.message);
    }
  }, 300);
}

module.exports = {
  loadTasksSync,
  notifyTasksMutated,
  getDataFile,
  persistenceActive
};
