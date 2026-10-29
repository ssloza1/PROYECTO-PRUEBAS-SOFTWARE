// DEFECTOS CONOCIDOS (nivel unitario).
//
// Cada prueba describe el comportamiento CORRECTO esperado y se marca con `test.failing`:
//  - Mientras el defecto exista, la prueba figura como aprobada (el código falla como se documentó).
//  - Al corregir el código, Jest informa que una prueba `failing` ahora pasa: hay que quitar `.failing`
//    para convertirla en una prueba normal (regresión protegida).
jest.mock('pg', () => ({ Pool: jest.fn(() => ({ on: jest.fn(), query: jest.fn(), connect: jest.fn(), end: jest.fn() })) }));
jest.mock('dotenv', () => ({ config: jest.fn() }));

const { validarNumeroPositivo, validarEnteroPositivo } = require('../../src/utils/validadores');
const { calcularIVA } = require('../../src/utils/calculos');
const { ProductoService } = require('../../src/services/productoService');
const { ClienteService } = require('../../src/services/clienteService');

describe('Defectos conocidos - validadores y cálculos', () => {
  test.failing('CP-DEF-001: validarNumeroPositivo no debe aceptar cadena vacía, null ni booleanos (Number() los convierte en 0 o 1)', () => {
    expect(validarNumeroPositivo('', true)).toBe(false);
    expect(validarNumeroPositivo(null, true)).toBe(false);
    expect(validarNumeroPositivo(true)).toBe(false);
  });

  test.failing('CP-DEF-002: validarNumeroPositivo no debe aceptar Infinity', () => {
    expect(validarNumeroPositivo(Infinity)).toBe(false);
  });

  test.failing('CP-DEF-003: validarEnteroPositivo no debe aceptar cadena vacía, null ni booleanos', () => {
    expect(validarEnteroPositivo('', true)).toBe(false);
    expect(validarEnteroPositivo(null, true)).toBe(false);
    expect(validarEnteroPositivo(true)).toBe(false);
  });

  test.failing('CP-DEF-004: calcularIVA(27.9, 15) debe ser 4.19 (4.185 redondeado hacia arriba); hoy da 4.18 por error de coma flotante', () => {
    expect(calcularIVA(27.9, 15)).toBe(4.19);
  });
});

describe('Defectos conocidos - servicios', () => {
  test.failing('CP-DEF-005: registrarProducto debe rechazar precio null (hoy lo guarda como 0)', async () => {
    const service = new ProductoService(
      { create: jest.fn(async (d) => ({ id_producto: 1, ...d })) },
      { findCategoriaById: jest.fn().mockResolvedValue({}), findProveedorById: jest.fn().mockResolvedValue({}) }
    );

    await expect(
      service.registrarProducto({ nombre: 'Mouse', precio: null, id_categoria: 1, id_proveedor: 1 })
    ).rejects.toThrow('precio');
  });

  test.failing('CP-DEF-006: registrarCliente no debe lanzar TypeError con un teléfono numérico (debe normalizarlo o rechazarlo con mensaje)', async () => {
    const service = new ClienteService({ findByCedula: jest.fn().mockResolvedValue(null), create: jest.fn(async (d) => d) });
    let error = null;

    try {
      await service.registrarCliente({ nombre: 'Ana', cedula: 'TEST-1', telefono: 123456 });
    } catch (e) {
      error = e;
    }

    expect(error === null || !(error instanceof TypeError)).toBe(true);
  });
});

describe('Defectos conocidos - seguridad de configuración', () => {
  test.failing('CP-DEF-007: db.js no debe tener una contraseña por defecto escrita en el código fuente', () => {
    const { Pool } = require('pg');
    Pool.mockClear();
    const entorno = { ...process.env };
    ['DATABASE_URL', 'DB_PASSWORD', 'DB_USER'].forEach((v) => delete process.env[v]);

    jest.isolateModules(() => {
      require('../../src/config/db');
    });
    const configuracion = Pool.mock.calls[0][0];
    process.env = entorno;

    expect(configuracion.password).toBeUndefined();
  });
});
