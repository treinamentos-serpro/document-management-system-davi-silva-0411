class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function sendError(res, statusCode, code, message) {
  return res.status(statusCode).json({ error: { code, message } });
}

module.exports = { AppError, sendError };
