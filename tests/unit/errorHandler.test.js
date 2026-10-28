const errorHandler = require('../../src/middlewares/errorHandler');

/** Crea un objeto res falso que guarda el código y el cuerpo enviados */
function crearRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Pruebas Unitarias - errorHandler (mapeo de errores a códigos HTTP)', () => {
  const entornoOriginal = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = entornoOriginal;
    jest.restoreAllMocks();
  });

  test.each([
    ['válido', 'El correo no es válido'],
    ['valido (sin tilde)', 'El campo no es valido'],
    ['obligatorio', 'El nombre es obligatorio'],
    ['requerido', 'El campo es requerido'],
    ['no encontrado', 'Producto con ID 5 no encontrado'],
    ['no existe', 'El cliente no existe'],
    ['insuficiente', 'Stock insuficiente'],
    ['duplicad', 'Producto duplicado'],
    ['inactiv', 'El cliente está inactivo'],
    ['previamente', 'La venta ya fue anulada previamente'],
    ['debe', 'El precio debe ser mayor a cero'],
  ])('CP-ERR-001: palabra clave "%s" se mapea a 400', (_nombre, mensaje) => {
    const res = crearRes();

    errorHandler(new Error(mensaje), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ exito: false, error: mensaje }));
  });

  test('CP-ERR-002: un error con err.status = 400 responde 400 aunque el mensaje no tenga palabras clave', () => {
    const res = crearRes();
    const err = new Error('JSON malformado');
    err.status = 400;

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('CP-ERR-003: respeta cualquier err.status explícito (ej. 404)', () => {
    const res = crearRes();
    const err = new Error('No existe la ruta');
    err.status = 404;

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('CP-ERR-004: un error inesperado responde 500 con su mensaje', () => {
    const res = crearRes();

    errorHandler(new Error('Fallo de conexión con la base de datos'), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ exito: false, error: 'Fallo de conexión con la base de datos' })
    );
  });

  test('CP-ERR-005: un error sin mensaje responde 500 con el texto genérico', () => {
    const res = crearRes();

    errorHandler({}, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Error interno del servidor' }));
  });

  test('CP-ERR-006: en entorno test NO se registran errores 500 en consola ni se expone el stack', () => {
    process.env.NODE_ENV = 'test';
    const consola = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = crearRes();

    errorHandler(new Error('Error inesperado'), {}, res, jest.fn());

    expect(consola).not.toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].detalles).toBeUndefined();
  });

  test('CP-ERR-007: en producción un error 500 se registra en consola y no expone el stack', () => {
    process.env.NODE_ENV = 'production';
    const consola = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = crearRes();

    errorHandler(new Error('Error inesperado'), {}, res, jest.fn());

    expect(consola).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0][0].detalles).toBeUndefined();
  });

  test('CP-ERR-008: en desarrollo la respuesta incluye el stack para depurar', () => {
    process.env.NODE_ENV = 'development';
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = crearRes();

    errorHandler(new Error('Error inesperado'), {}, res, jest.fn());

    expect(res.json.mock.calls[0][0].detalles).toContain('Error inesperado');
  });
});
