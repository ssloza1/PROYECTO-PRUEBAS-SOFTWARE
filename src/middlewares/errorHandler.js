/**
 * Middleware centralizado de manejo de errores
 * Mapea errores de validación de negocio a código HTTP 400
 */
function errorHandler(err, req, res, _next) {
  const mensaje = (err.message || '').toLowerCase();

  const esErrorValidacion =
    err.status === 400 ||
    mensaje.includes('válido') ||
    mensaje.includes('valido') ||
    mensaje.includes('obligatorio') ||
    mensaje.includes('requerido') ||
    mensaje.includes('no encontrado') ||
    mensaje.includes('no existe') ||
    mensaje.includes('insuficiente') ||
    mensaje.includes('duplicad') ||
    mensaje.includes('inactiv') ||
    mensaje.includes('previamente') ||
    mensaje.includes('debe');

  const status = err.status || (esErrorValidacion ? 400 : 500);

  // En test o desarrollo solo logueamos errores inesperados 500
  if (process.env.NODE_ENV !== 'test' && status === 500) {
    console.error('[Error no controlado]', err);
  }

  res.status(status).json({
    exito: false,
    error: err.message || 'Error interno del servidor',
    detalles: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

module.exports = errorHandler;
