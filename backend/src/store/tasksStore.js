const taskRepository = require('../db/taskRepository');

function resetTasksForTests() {
  taskRepository.clearAll();
}

module.exports = { resetTasksForTests };
