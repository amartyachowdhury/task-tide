const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong'
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error.error = 'Validation Error';
    error.message = Object.values(err.errors).map(val => val.message).join(', ');
    error.statusCode = 400;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    error.error = 'Duplicate Field Error';
    error.message = 'Duplicate field value entered';
    error.statusCode = 400;
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    error.error = 'Resource Not Found';
    error.message = 'Invalid ID format';
    error.statusCode = 404;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.error = 'Invalid Token';
    error.message = 'Invalid authentication token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.error = 'Token Expired';
    error.message = 'Authentication token has expired';
    error.statusCode = 401;
  }

  // Joi validation errors
  if (err.isJoi) {
    error.error = 'Validation Error';
    error.message = err.details.map(detail => detail.message).join(', ');
    error.statusCode = 400;
  }

  // Custom error with status code
  if (err.statusCode) {
    error.statusCode = err.statusCode;
  }

  res.status(error.statusCode || 500).json(error);
};

module.exports = { errorHandler };
