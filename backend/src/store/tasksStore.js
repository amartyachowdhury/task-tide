const taskRepository = require('../db/taskRepository');
const { DEFAULT_TENANT_ORG_ID } = require('../config/saas');

function resetTasksForTests() {
  taskRepository.clearAll(DEFAULT_TENANT_ORG_ID);
}

module.exports = { resetTasksForTests };
