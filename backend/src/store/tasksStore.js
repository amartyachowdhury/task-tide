/**
 * Single in-memory task list shared by task and AI routes.
 */
const tasks = [];

function resetTasksForTests() {
  tasks.length = 0;
}

module.exports = { tasks, resetTasksForTests };
