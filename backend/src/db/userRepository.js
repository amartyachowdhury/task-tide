const { getDb } = require('./database');

function findUserByEmail(email) {
  const row = getDb().getRow('SELECT * FROM users WHERE email = ?', [String(email).toLowerCase().trim()]);
  return row || null;
}

function findUserById(id) {
  const row = getDb().getRow('SELECT id, email, created_at FROM users WHERE id = ?', [id]);
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    createdAt: row.created_at
  };
}

function createUser({ id, email, passwordHash }) {
  const now = new Date().toISOString();
  getDb().runParameterized(
    'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
    [id, String(email).toLowerCase().trim(), passwordHash, now]
  );
}

function createOrganization({ id, name }) {
  const now = new Date().toISOString();
  getDb().runParameterized('INSERT INTO organizations (id, name, created_at) VALUES (?, ?, ?)', [
    id,
    name,
    now
  ]);
}

function linkUserToOrg({ organizationId, userId, role }) {
  getDb().runParameterized(
    'INSERT INTO organization_users (organization_id, user_id, role) VALUES (?, ?, ?)',
    [organizationId, userId, role || 'owner']
  );
}

function findOrganizationById(id) {
  const row = getDb().getRow('SELECT id, name, created_at FROM organizations WHERE id = ?', [id]);
  if (!row) return null;
  return { id: row.id, name: row.name, createdAt: row.created_at };
}

function findPrimaryOrganizationIdForUser(userId) {
  const row = getDb().getRow(
    `SELECT organization_id FROM organization_users
     WHERE user_id = ?
     ORDER BY CASE WHEN role = 'owner' THEN 0 ELSE 1 END
     LIMIT 1`,
    [userId]
  );
  return row ? row.organization_id : null;
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  createOrganization,
  linkUserToOrg,
  findOrganizationById,
  findPrimaryOrganizationIdForUser
};
