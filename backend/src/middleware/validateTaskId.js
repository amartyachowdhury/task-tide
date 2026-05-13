const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateTaskIdParam(req, res, next, id) {
  if (!UUID_RE.test(String(id))) {
    return res.status(400).json({
      success: false,
      error: 'Invalid task id',
      message: 'Task id must be a UUID'
    });
  }
  req.params.id = String(id);
  return next();
}

module.exports = { validateTaskIdParam };
