// Pruebas adicionales de VentaService: validaciones previas a la transacción,
// manejo de errores (ROLLBACK) y consultas.
const { VentaService } = require('../../src/services/ventaService');
const { createMockDb } = require('../mocks/dbMock');

describe('Pruebas Unitarias - VentaService (ampliadas)', () => {
  let ventaRepo;
  let productoRepo;
  let clienteRepo;
  let db;
  let service;

  const cliente = { id_cliente: 1, nombre: 'Ana Pérez', cedula: 'TEST-CLI-001', activo: true };
  const producto = { id_producto: 1, nombre: 'Teclado USB', precio: 15.5, stock: 20, activo: true };
  const payload = { id_cliente: 1, items: [{ id_producto: 1, cantidad: 2 }] };

  beforeEach(() => {
    ventaRepo = {
      findAll: jest.fn(),
      findByIdWithDetails: jest.fn(),
      createHeader: jest.fn().mockResolvedValue({ id_venta: 100, id_cliente: 1, total: 31, estado: 'COMPLETADA' }),
      createDetail: jest.fn().mockResolvedValue({ id_detalle: 1 }),
      updateStatus: jest.fn(),
      findDetailsByVentaId: jest.fn(),
    };
    productoRepo = {
      findById: jest.fn().mockResolvedValue(producto),
      updateStock: jest.fn().mockResolvedValue({ id_producto: 1, stock: 18 }),
    };
    clienteRepo = { findById: jest.fn().mockResolvedValue(cliente) };
    db = createMockDb();
    service = new VentaService(ventaRepo, productoRepo, clienteRepo, db);
  });

  describe('Consultas', () => {
    test('CP-SERV-VENTA-011: listarVentas entrega filtros al repositorio (y {} por defecto)', async () => {
      ventaRepo.findAll.mockResolvedValue([]);

      await service.listarVentas({ estado: 'ANULADA' });
      await service.listarVentas();

      expect(ventaRepo.findAll).toHaveBeenNthCalledWith(1, { estado: 'ANULADA' });
      expect(ventaRepo.findAll).toHaveBeenNthCalledWith(2, {});
    });

    test('CP-SERV-VENTA-012: obtenerPorId devuelve la venta con sus detalles', async () => {
      ventaRepo.findByIdWithDetails.mockResolvedValue({ id_venta: 5, detalles: [] });

      await expect(service.obtenerPorId('5')).resolves.toEqual({ id_venta: 5, detalles: [] });
      expect(ventaRepo.findByIdWithDetails).toHaveBeenCalledWith(5);
    });

    test('CP-SERV-VENTA-013: obtenerPorId rechaza ID inválido y venta inexistente', async () => {
      await expect(service.obtenerPorId('abc')).rejects.toThrow('ID de venta inválido');

      ventaRepo.findByIdWithDetails.mockResolvedValue(null);
      await expect(service.obtenerPorId(9)).rejects.toThrow('Venta con ID 9 no encontrada');
    });
  });

  describe('registrarVenta - validaciones previas (no abren transacción)', () => {
    test.each([[undefined], ['abc'], [0], [-1]])('CP-SERV-VENTA-014: rechaza id_cliente %p', async (id_cliente) => {
      await expect(service.registrarVenta({ ...payload, id_cliente })).rejects.toThrow('ID de cliente válido');
      expect(db.getClient).not.toHaveBeenCalled();
    });

    test('CP-SERV-VENTA-015: rechaza si items no es un arreglo', async () => {
      await expect(service.registrarVenta({ id_cliente: 1 })).rejects.toThrow('al menos un producto');
    });

    test('CP-SERV-VENTA-016: rechaza un ítem con ID de producto inválido', async () => {
      await expect(
        service.registrarVenta({ id_cliente: 1, items: [{ id_producto: 0, cantidad: 1 }] })
      ).rejects.toThrow('ID de producto válido');
    });

    test.each([[0], [-2], [1.5], ['abc'], [undefined]])('CP-SERV-VENTA-017: rechaza la cantidad %p', async (cantidad) => {
      await expect(
        service.registrarVenta({ id_cliente: 1, items: [{ id_producto: 1, cantidad }] })
      ).rejects.toThrow('entero mayor a cero');
    });

    test('CP-SERV-VENTA-018: rechaza producto inexistente y producto inactivo', async () => {
      productoRepo.findById.mockResolvedValueOnce(null);
      await expect(service.registrarVenta(payload)).rejects.toThrow('El producto con ID 1 no existe');

      productoRepo.findById.mockResolvedValueOnce({ ...producto, activo: false });
      await expect(service.registrarVenta(payload)).rejects.toThrow('se encuentra inactivo');
      expect(db.getClient).not.toHaveBeenCalled();
    });

    test('CP-SERV-VENTA-019: rechaza porcentajes de IVA o descuento fuera de [0, 100] antes de abrir la transacción', async () => {
      await expect(service.registrarVenta({ ...payload, porcentajeIVA: 101 })).rejects.toThrow('IVA debe estar entre 0 y 100');
      await expect(service.registrarVenta({ ...payload, porcentajeDescuento: -1 })).rejects.toThrow('descuento debe estar entre 0 y 100');
      expect(db.getClient).not.toHaveBeenCalled();
    });
  });

  describe('registrarVenta - transacción', () => {
    test('CP-SERV-VENTA-020: calcula totales con IVA y descuento y los guarda en la cabecera', async () => {
      const res = await service.registrarVenta({ ...payload, porcentajeIVA: 12, porcentajeDescuento: 10 });

      // 2 x 15.50 = 31.00 -> descuento 3.10 -> base 27.90 -> IVA 12% = 3.348 (3.35) -> total 31.25
      expect(res.totales).toEqual({ subtotal: 31, descuento: 3.1, iva: 3.35, total: 31.25, totalItems: 2 });
      expect(ventaRepo.createHeader).toHaveBeenCalledWith(
        { id_cliente: 1, total: 31.25, estado: 'COMPLETADA' },
        db.clientMock
      );
    });

    test('CP-SERV-VENTA-021: la transacción empieza con BEGIN y termina con COMMIT', async () => {
      await service.registrarVenta(payload);

      const sentencias = db.clientMock.query.mock.calls.map((c) => c[0]);
      expect(sentencias).toEqual(['BEGIN', 'COMMIT']);
      expect(db.clientMock.release).toHaveBeenCalledTimes(1);
    });

    test('CP-SERV-VENTA-022: ROLLBACK si falla la creación de la cabecera', async () => {
      ventaRepo.createHeader.mockRejectedValue(new Error('Fallo al insertar cabecera'));

      await expect(service.registrarVenta(payload)).rejects.toThrow('Fallo al insertar cabecera');

      const sentencias = db.clientMock.query.mock.calls.map((c) => c[0]);
      expect(sentencias).toEqual(['BEGIN', 'ROLLBACK']);
      expect(db.clientMock.release).toHaveBeenCalledTimes(1);
    });

    test('CP-SERV-VENTA-023: ROLLBACK si no se pudo descontar el stock (otra venta lo consumió)', async () => {
      productoRepo.updateStock.mockResolvedValue(null);

      await expect(service.registrarVenta(payload)).rejects.toThrow('No se pudo descontar el stock del producto Teclado USB');

      expect(db.clientMock.query).toHaveBeenCalledWith('ROLLBACK');
      expect(db.clientMock.query).not.toHaveBeenCalledWith('COMMIT');
      expect(db.clientMock.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('anularVenta', () => {
    test('CP-SERV-VENTA-024: rechaza ID inválido y venta inexistente', async () => {
      await expect(service.anularVenta('abc')).rejects.toThrow('ID de venta inválido');

      ventaRepo.findByIdWithDetails.mockResolvedValue(null);
      await expect(service.anularVenta(9)).rejects.toThrow('Venta con ID 9 no encontrada');
      expect(db.getClient).not.toHaveBeenCalled();
    });

    test('CP-SERV-VENTA-025: ROLLBACK si falla la reposición del stock durante la anulación', async () => {
      ventaRepo.findByIdWithDetails.mockResolvedValue({ id_venta: 50, estado: 'COMPLETADA' });
      ventaRepo.updateStatus.mockResolvedValue({ id_venta: 50, estado: 'ANULADA' });
      ventaRepo.findDetailsByVentaId.mockResolvedValue([{ id_producto: 1, cantidad: 3 }]);
      productoRepo.updateStock.mockRejectedValue(new Error('Fallo al reponer stock'));

      await expect(service.anularVenta(50)).rejects.toThrow('Fallo al reponer stock');

      expect(db.clientMock.query).toHaveBeenCalledWith('ROLLBACK');
      expect(db.clientMock.query).not.toHaveBeenCalledWith('COMMIT');
      expect(db.clientMock.release).toHaveBeenCalledTimes(1);
    });
  });
});
