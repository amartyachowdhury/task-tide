const { getDb } = require('./database');

function isoOrNull(v) {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function rowToTask(row) {
  const task = {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    category: row.category,
    priority: row.priority,
    dueDate: row.due_date != null ? row.due_date : null,
    estimate: row.estimate,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    aiScore: row.ai_score
  };
  if (row.completed_at != null) {
    task.completedAt = row.completed_at;
  }
  return task;
}

function findAll(organizationId) {
  const api = getDb();
  return api
    .allRows('SELECT * FROM tasks WHERE organization_id = ?', [organizationId])
    .map(rowToTask);
}

function findById(id, organizationId) {
  const api = getDb();
  const row = api.getRow('SELECT * FROM tasks WHERE id = ? AND organization_id = ?', [
    id,
    organizationId
  ]);
  return row ? rowToTask(row) : undefined;
}

function insert(task, organizationId) {
  const api = getDb();
  const dueDate = isoOrNull(task.dueDate);
  const completedAt = task.completedAt != null ? isoOrNull(task.completedAt) : null;
  api.runParameterized(
    `
    INSERT INTO tasks (
      id, title, description, category, priority, due_date, estimate,
      completed, created_at, updated_at, ai_score, completed_at, organization_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      task.id,
      task.title,
      task.description != null ? String(task.description) : '',
      task.category,
      task.priority,
      dueDate,
      Number(task.estimate) || 1,
      task.completed ? 1 : 0,
      task.createdAt,
      task.updatedAt,
      Number(task.aiScore) || 0,
      completedAt,
      organizationId
    ]
  );
}

function updateTask(task, organizationId) {
  const api = getDb();
  const dueDate = isoOrNull(task.dueDate);
  const completedAt = task.completedAt != null ? isoOrNull(task.completedAt) : null;
  api.runParameterized(
    `
    UPDATE tasks SET
      title = ?,
      description = ?,
      category = ?,
      priority = ?,
      due_date = ?,
      estimate = ?,
      completed = ?,
      updated_at = ?,
      ai_score = ?,
      completed_at = ?
    WHERE id = ? AND organization_id = ?
  `,
    [
      task.title,
      task.description != null ? String(task.description) : '',
      task.category,
      task.priority,
      dueDate,
      Number(task.estimate) || 1,
      task.completed ? 1 : 0,
      task.updatedAt,
      Number(task.aiScore) || 0,
      completedAt,
      task.id,
      organizationId
    ]
  );
}

function deleteById(id, organizationId) {
  const api = getDb();
  const before = api.getRow('SELECT id FROM tasks WHERE id = ? AND organization_id = ?', [
    id,
    organizationId
  ]);
  if (!before) return false;
  api.runParameterized('DELETE FROM tasks WHERE id = ? AND organization_id = ?', [id, organizationId]);
  return true;
}

function clearAll(organizationId) {
  getDb().runParameterized('DELETE FROM tasks WHERE organization_id = ?', [organizationId]);
}

module.exports = {
  findAll,
  findById,
  insert,
  updateTask,
  deleteById,
  clearAll,
  rowToTask
};
