const { closeDatabase, openDatabase } = require('../src/db/database');

beforeAll(async () => {
  await openDatabase();
});

afterAll(() => {
  closeDatabase();
});
