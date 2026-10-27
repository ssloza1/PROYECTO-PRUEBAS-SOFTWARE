const { ProductoService } = require('../../src/services/productoService');

describe('Pruebas Unitarias - ProductoService (Reglas de Negocio con Mocks)', () => {
  let mockProductoRepo;
  let mockCatalogoRepo;
  let service;

  beforeEach(() => {
    mockProductoRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStock: jest.fn(),
      softDelete: jest.fn(),
    };

    mockCatalogoRepo = {
      findCategoriaById: jest.fn(),
      findProveedorById: jest.fn(),
    };

    service = new ProductoService(mockProductoRepo, mockCatalogoRepo);
  });

  describe('Registro de Productos (RN-PROD-01 a RN-PROD-05)', () => {
    const productoValido = {
      nombre: 'Monitor 24 pulgadas',
      descripcion: 'Monitor IPS Full HD',
      precio: 145.00,
      stock: 10,
      stock_minimo: 2,
      id_categoria: 1,
      id_proveedor: 1,
      activo: true,
    };

    test('CP-SERV-PROD-001: Registra producto exitosamente cuando todos los datos son válidos', async () => {
      mockCatalogoRepo.findCategoriaById.mockResolvedValue({ id_categoria: 1, nombre: 'Tecnología' });
      mockCatalogoRepo.findProveedorById.mockResolvedValue({ id_proveedor: 1, nombre: 'Distribuidora Central' });
      mockProductoRepo.create.mockResolvedValue({
        id_producto: 10,
        ...productoValido,
      });

      const resultado = await service.registrarProducto(productoValido);

      expect(resultado).toBeDefined();
      expect(resultado.id_producto).toBe(10);
      expect(resultado.nivel_stock).toBe('NORMAL');
      expect(mockProductoRepo.create).toHaveBeenCalledTimes(1);
    });

    test('CP-SERV-PROD-002: Rechaza producto con nombre vacío o muy corto', async () => {
      await expect(
        service.registrarProducto({ ...productoValido, nombre: ' ' })
      ).rejects.toThrow('El nombre del producto es obligatorio');

      expect(mockProductoRepo.create).not.toHaveBeenCalled();
    });

    test('CP-SERV-PROD-003: Rechaza producto con precio negativo', async () => {
      await expect(
        service.registrarProducto({ ...productoValido, precio: -10 })
      ).rejects.toThrow('El precio debe ser un número mayor o igual a cero');

      expect(mockProductoRepo.create).not.toHaveBeenCalled();
    });

    test('CP-SERV-PROD-004: Rechaza producto con stock negativo', async () => {
      await expect(
        service.registrarProducto({ ...productoValido, stock: -5 })
      ).rejects.toThrow('El stock debe ser un número entero mayor o igual a cero');
    });

    test('CP-SERV-PROD-005: Rechaza si la categoría especificada no existe en la base de datos', async () => {
      mockCatalogoRepo.findCategoriaById.mockResolvedValue(null);

      await expect(
        service.registrarProducto({ ...productoValido, id_categoria: 999 })
      ).rejects.toThrow('La categoría con ID 999 no existe');

      expect(mockProductoRepo.create).not.toHaveBeenCalled();
    });

    test('CP-SERV-PROD-006: Rechaza si el proveedor no existe en la base de datos', async () => {
      mockCatalogoRepo.findCategoriaById.mockResolvedValue({ id_categoria: 1, nombre: 'Tecnología' });
      mockCatalogoRepo.findProveedorById.mockResolvedValue(null);

      await expect(
        service.registrarProducto({ ...productoValido, id_proveedor: 888 })
      ).rejects.toThrow('El proveedor con ID 888 no existe');

      expect(mockProductoRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('Consulta de Productos', () => {
    test('CP-SERV-PROD-007: Calcula dinámicamente el nivel de stock en la lista', async () => {
      mockProductoRepo.findAll.mockResolvedValue([
        { id_producto: 1, nombre: 'P1', stock: 0, stock_minimo: 5 },
        { id_producto: 2, nombre: 'P2', stock: 3, stock_minimo: 5 },
        { id_producto: 3, nombre: 'P3', stock: 15, stock_minimo: 5 },
      ]);

      const lista = await service.listarProductos();
      expect(lista[0].nivel_stock).toBe('AGOTADO');
      expect(lista[1].nivel_stock).toBe('CRITICO');
      expect(lista[2].nivel_stock).toBe('NORMAL');
    });

    test('CP-SERV-PROD-008: Lanza error al buscar por ID inexistente', async () => {
      mockProductoRepo.findById.mockResolvedValue(null);

      await expect(service.obtenerPorId(999)).rejects.toThrow('no encontrado');
    });
  });

  describe('Desactivación Lógica (Soft Delete)', () => {
    test('CP-SERV-PROD-009: Desactiva producto existente', async () => {
      mockProductoRepo.findById.mockResolvedValue({ id_producto: 1, nombre: 'P1', activo: true });
      mockProductoRepo.softDelete.mockResolvedValue({ id_producto: 1, nombre: 'P1', activo: false });

      const res = await service.desactivarProducto(1);
      expect(res.activo).toBe(false);
      expect(mockProductoRepo.softDelete).toHaveBeenCalledWith(1);
    });
  });
});
