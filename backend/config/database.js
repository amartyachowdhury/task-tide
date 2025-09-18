// Database configuration
// This is a placeholder for future database integration

const config = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'tasktide_dev',
    username: process.env.DB_USER || 'tasktide',
    password: process.env.DB_PASSWORD || 'password',
    dialect: 'postgres',
    logging: console.log
  },
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
