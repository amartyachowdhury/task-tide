const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err);

  const error = {
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong'
  };

  if (err.isJoi) {
    error.error = 'Validation Error';
    error.message = err.details.map((detail) => detail.message).join(', ');
    error.statusCode = 400;
  }

  if (err.statusCode) {
    error.statusCode = err.statusCode;
  }

  res.status(error.statusCode || 500).json(error);
};

module.exports = { errorHandler };
