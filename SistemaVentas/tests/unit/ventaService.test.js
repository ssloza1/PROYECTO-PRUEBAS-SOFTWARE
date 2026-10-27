const { VentaService } = require('../../src/services/ventaService');
const { createMockDb } = require('../mocks/dbMock');

describe('Pruebas Unitarias - VentaService (Núcleo de Negocio y Transacciones)', () => {
  let mockVentaRepo;
  let mockProductoRepo;
  let mockClienteRepo;
  let mockDb;
  let service;

  beforeEach(() => {
    mockVentaRepo = {
      findAll: jest.fn(),
      findByIdWithDetails: jest.fn(),
      createHeader: jest.fn(),
      createDetail: jest.fn(),
      updateStatus: jest.fn(),
      findDetailsByVentaId: jest.fn(),
    };

    mockProductoRepo = {
      findById: jest.fn(),
      updateStock: jest.fn(),
    };

    mockClienteRepo = {
      findById: jest.fn(),
    };

    mockDb = createMockDb();

    service = new VentaService(
      mockVentaRepo,
      mockProductoRepo,
      mockClienteRepo,
      mockDb
    );
  });

  describe('Registro de Venta (RN-VENTA-01 a RN-VENTA-07)', () => {
    const payloadValido = {
      id_cliente: 1,
      items: [
        { id_producto: 1, cantidad: 2 },
        { id_producto: 2, cantidad: 1 },
      ],
    };

    const clienteActivo = {
      id_cliente: 1,
      nombre: 'Ana Pérez',
      cedula: 'TEST-CLI-001',
      activo: true,
    };

    const prod1 = {
      id_producto: 1,
      nombre: 'Teclado USB',
      precio: 15.50,
      stock: 20,
      activo: true,
    };

    const prod2 = {
      id_producto: 2,
      nombre: 'Ratón USB',
      precio: 8.25,
      stock: 10,
      activo: true,
    };

    test('CP-SERV-VENTA-001: Registra venta exitosa, descuenta stock y confirma transacción', async () => {
      mockClienteRepo.findById.mockResolvedValue(clienteActivo);
      mockProductoRepo.findById
        .mockResolvedValueOnce(prod1)
        .mockResolvedValueOnce(prod2);

      mockVentaRepo.createHeader.mockResolvedValue({
        id_venta: 100,
        id_cliente: 1,
        total: 39.25,
        estado: 'COMPLETADA',
      });

      mockVentaRepo.createDetail
        .mockResolvedValueOnce({ id_detalle: 1, id_venta: 100, id_producto: 1, cantidad: 2, precio_unitario: 15.5 })
        .mockResolvedValueOnce({ id_detalle: 2, id_venta: 100, id_producto: 2, cantidad: 1, precio_unitario: 8.25 });

      mockProductoRepo.updateStock.mockResolvedValue({ id_producto: 1, stock: 18 });

      const resultado = await service.registrarVenta(payloadValido);

      expect(resultado).toBeDefined();
      expect(resultado.id_venta).toBe(100);
      expect(resultado.estado).toBe('COMPLETADA');
      expect(resultado.totales.total).toBe(39.25);

      // Verificar ciclo transaccional: BEGIN -> COMMIT
      expect(mockDb.clientMock.query).toHaveBeenCalledWith('BEGIN');
      expect(mockDb.clientMock.query).toHaveBeenCalledWith('COMMIT');
      expect(mockDb.clientMock.release).toHaveBeenCalledTimes(1);

      // Verificar que se descontó el stock de ambos productos
      expect(mockProductoRepo.updateStock).toHaveBeenCalledWith(1, -2, mockDb.clientMock);
      expect(mockProductoRepo.updateStock).toHaveBeenCalledWith(2, -1, mockDb.clientMock);
    });

    test('CP-SERV-VENTA-002: Rechaza venta si el cliente está inactivo', async () => {
      mockClienteRepo.findById.mockResolvedValue({
        ...clienteActivo,
        activo: false,
      });

      await expect(service.registrarVenta(payloadValido)).rejects.toThrow(
        'se encuentra inactivo y no puede realizar compras'
      );

      expect(mockDb.getClient).not.toHaveBeenCalled();
    });

    test('CP-SERV-VENTA-003: Rechaza venta si el cliente no existe', async () => {
      mockClienteRepo.findById.mockResolvedValue(null);

      await expect(service.registrarVenta(payloadValido)).rejects.toThrow(
        'El cliente con ID 1 no existe'
      );
    });

    test('CP-SERV-VENTA-004: Rechaza venta si la lista de ítems está vacía', async () => {
      mockClienteRepo.findById.mockResolvedValue(clienteActivo);

      await expect(
        service.registrarVenta({ id_cliente: 1, items: [] })
      ).rejects.toThrow('La venta debe incluir al menos un producto');
    });

    test('CP-SERV-VENTA-005: Rechaza orden con productos duplicados en ítems', async () => {
      mockClienteRepo.findById.mockResolvedValue(clienteActivo);

      await expect(
        service.registrarVenta({
          id_cliente: 1,
          items: [
            { id_producto: 1, cantidad: 2 },
            { id_producto: 1, cantidad: 3 },
          ],
        })
      ).rejects.toThrow('está duplicado en la orden');
    });

    test('CP-SERV-VENTA-006: Rechaza venta por stock insuficiente (Análisis de Valor Límite: stock 5, pide 6)', async () => {
      mockClienteRepo.findById.mockResolvedValue(clienteActivo);
      mockProductoRepo.findById.mockResolvedValue({
        ...prod1,
        stock: 5,
      });

      await expect(
        service.registrarVenta({
          id_cliente: 1,
          items: [{ id_producto: 1, cantidad: 6 }],
        })
      ).rejects.toThrow('Stock insuficiente para "Teclado USB"');

      // No debe iniciar transacción
      expect(mockDb.getClient).not.toHaveBeenCalled();
    });

    test('CP-SERV-VENTA-007: Venta válida en valor límite de stock (stock 5, pide exactamente 5)', async () => {
      mockClienteRepo.findById.mockResolvedValue(clienteActivo);
      mockProductoRepo.findById.mockResolvedValue({
        ...prod1,
        stock: 5,
      });

      mockVentaRepo.createHeader.mockResolvedValue({ id_venta: 101, total: 77.5, estado: 'COMPLETADA' });
      mockVentaRepo.createDetail.mockResolvedValue({ id_detalle: 1 });
      mockProductoRepo.updateStock.mockResolvedValue({ id_producto: 1, stock: 0 });

      const res = await service.registrarVenta({
        id_cliente: 1,
        items: [{ id_producto: 1, cantidad: 5 }],
      });

      expect(res.id_venta).toBe(101);
      expect(mockDb.clientMock.query).toHaveBeenCalledWith('COMMIT');
    });

    test('CP-SERV-VENTA-008: Realiza ROLLBACK si ocurre un error durante la transacción', async () => {
      mockClienteRepo.findById.mockResolvedValue(clienteActivo);
      mockProductoRepo.findById.mockResolvedValue(prod1);

      mockVentaRepo.createHeader.mockResolvedValue({ id_venta: 102, total: 31, estado: 'COMPLETADA' });
      // Simular fallo en inserción de detalle
      mockVentaRepo.createDetail.mockRejectedValue(new Error('Fallo de conexión en inserción'));

      await expect(
        service.registrarVenta({
          id_cliente: 1,
          items: [{ id_producto: 1, cantidad: 2 }],
        })
      ).rejects.toThrow('Fallo de conexión en inserción');

      expect(mockDb.clientMock.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockDb.clientMock.release).toHaveBeenCalled();
    });
  });

  describe('Anulación de Venta y Reposición de Inventario (RN-VENTA-08 y RN-VENTA-09)', () => {
    test('CP-SERV-VENTA-009: Anula venta completada y restituye el stock de los productos', async () => {
      mockVentaRepo.findByIdWithDetails.mockResolvedValue({
        id_venta: 50,
        estado: 'COMPLETADA',
      });

      mockVentaRepo.findDetailsByVentaId.mockResolvedValue([
        { id_producto: 1, cantidad: 3 },
        { id_producto: 2, cantidad: 2 },
      ]);

      mockVentaRepo.updateStatus.mockResolvedValue({
        id_venta: 50,
        estado: 'ANULADA',
      });

      const res = await service.anularVenta(50);

      expect(res.venta.estado).toBe('ANULADA');
      expect(res.mensaje).toContain('anulada exitosamente');

      // Se repone stock sumando delta positivo
      expect(mockProductoRepo.updateStock).toHaveBeenCalledWith(1, 3, mockDb.clientMock);
      expect(mockProductoRepo.updateStock).toHaveBeenCalledWith(2, 2, mockDb.clientMock);
      expect(mockDb.clientMock.query).toHaveBeenCalledWith('COMMIT');
    });

    test('CP-SERV-VENTA-010: Rechaza anular una venta que ya está en estado ANULADA', async () => {
      mockVentaRepo.findByIdWithDetails.mockResolvedValue({
        id_venta: 51,
        estado: 'ANULADA',
      });

      await expect(service.anularVenta(51)).rejects.toThrow('La venta ya fue anulada previamente');

      expect(mockDb.getClient).not.toHaveBeenCalled();
    });
  });
});
