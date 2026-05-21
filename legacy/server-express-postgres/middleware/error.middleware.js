function notFoundHandler(req, _res, next) {
  const error = new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, _req, res, _next) {
  const status = error.statusCode || error.status || (error.code === "LIMIT_FILE_SIZE" ? 413 : 500);
  const message = status === 413
    ? "El archivo es demasiado grande."
    : error.message || "Error interno del servidor.";

  if (status >= 500) console.error("API error:", error);

  res.status(status).json({
    ok: false,
    error: message,
    details: process.env.NODE_ENV === "production" ? undefined : error.details || error.stack
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
