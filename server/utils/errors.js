class AppError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function badRequest(message, details) {
  return new AppError(message, 400, details);
}

function unauthorized(message = "Tu sesión expiró o falta iniciar sesión.", details) {
  return new AppError(message, 401, details);
}

function forbidden(message = "No tienes permisos para hacer esto.", details) {
  return new AppError(message, 403, details);
}

function notFound(message = "Recurso no encontrado.", details) {
  return new AppError(message, 404, details);
}

module.exports = {
  AppError,
  badRequest,
  unauthorized,
  forbidden,
  notFound
};
