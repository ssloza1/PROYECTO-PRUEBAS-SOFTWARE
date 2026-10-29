// Pruebas adicionales de ProductoService para completar la cobertura de ramas
// (consulta por ID, validaciones restantes, actualización y baja lógica).
const { ProductoService } = require('../../src/services/productoService');

describe('Pruebas Unitarias - ProductoService (ampliadas)', () => {
  let prodRepo;
  let catRepo;
  let service;

  const base = { nombre: 'Monitor', precio: 145, stock: 10, stock_minimo: 2, id_categoria: 1, id_proveedor: 1 };

  beforeEach(() => {
    prodRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(async (d) => ({ id_producto: 7, ...d })),
      // Simula el UPDATE ... COALESCE de SQL: solo cambian los campos que vienen definidos
      update: jest.fn(async (id, d) => {
        const fila = { id_producto: id, nombre: 'P1', stock: 4, stock_minimo: 5 };
        Object.keys(d).forEach((k) => {
          if (d[k] !== undefined) fila[k] = d[k];
        });
        return fila;
      }),
      softDelete: jest.fn(),
    };
    catRepo = {
      findCategoriaById: jest.fn().mockResolvedValue({ id_categoria: 1 }),
      findProveedorById: jest.fn().mockResolvedValue({ id_proveedor: 1 }),
    };
    service = new ProductoService(prodRepo, catRepo);
  });

  describe('obtenerPorId', () => {
    test('CP-SERV-PROD-010: devuelve el producto con su nivel de stock', async () => {
      prodRepo.findById.mockResolvedValue({ id_producto: 3, nombre: 'P3', stock: 5, stock_minimo: 5 });

      const res = await service.obtenerPorId('3');

      expect(prodRepo.findById).toHaveBeenCalledWith(3);
      expect(res.nivel_stock).toBe('CRITICO');
    });

    test.each([['abc'], [0], [-1], [1.5]])('CP-SERV-PROD-011: rechaza el ID inválido %p', async (id) => {
      await expect(service.obtenerPorId(id)).rejects.toThrow('El ID de producto debe ser un entero positivo');
      expect(prodRepo.findById).not.toHaveBeenCalled();
    });
  });

  describe('registrarProducto - validaciones restantes', () => {
    test('CP-SERV-PROD-012: rechaza si no se envía el precio', async () => {
      const sinPrecio = { ...base };
      delete sinPrecio.precio;
      await expect(service.registrarProducto(sinPrecio)).rejects.toThrow('precio debe ser');
    });

    test.each([['abc'], [-0.01]])('CP-SERV-PROD-013: rechaza el precio %p', async (precio) => {
      await expect(service.registrarProducto({ ...base, precio })).rejects.toThrow('precio debe ser');
    });

    test('CP-SERV-PROD-014: valor límite - precio 0 es válido', async () => {
      const res = await service.registrarProducto({ ...base, precio: 0 });

      expect(res.precio).toBe(0);
    });

    test('CP-SERV-PROD-015: rechaza stock decimal y stock mínimo negativo o decimal', async () => {
      await expect(service.registrarProducto({ ...base, stock: 1.5 })).rejects.toThrow('stock debe ser');
      await expect(service.registrarProducto({ ...base, stock_minimo: -1 })).rejects.toThrow('stock mínimo debe ser');
      await expect(service.registrarProducto({ ...base, stock_minimo: 0.5 })).rejects.toThrow('stock mínimo debe ser');
      expect(prodRepo.create).not.toHaveBeenCalled();
    });

    test('CP-SERV-PROD-016: sin stock ni stock_minimo se asume 0 y el nivel es AGOTADO', async () => {
      const res = await service.registrarProducto({ nombre: 'Cable', precio: 3, id_categoria: 1, id_proveedor: 1 });

      expect(prodRepo.create).toHaveBeenCalledWith(expect.objectContaining({ stock: 0, stock_minimo: 0 }));
      expect(res.nivel_stock).toBe('AGOTADO');
    });

    test.each([[undefined], ['abc'], [0], [-1]])('CP-SERV-PROD-017: rechaza id_categoria %p', async (id_categoria) => {
      await expect(service.registrarProducto({ ...base, id_categoria })).rejects.toThrow('categoría válida');
    });

    test.each([[undefined], ['abc'], [0], [-1]])('CP-SERV-PROD-018: rechaza id_proveedor %p', async (id_proveedor) => {
      await expect(service.registrarProducto({ ...base, id_proveedor })).rejects.toThrow('proveedor válido');
    });

    test('CP-SERV-PROD-019: normaliza descripción y respeta activo = false', async () => {
      await service.registrarProducto({ ...base, descripcion: ' Full HD ', activo: false });

      expect(prodRepo.create).toHaveBeenCalledWith(expect.objectContaining({ descripcion: 'Full HD', activo: false }));
    });
  });

  describe('actualizarProducto', () => {
    beforeEach(() => prodRepo.findById.mockResolvedValue({ id_producto: 1, nombre: 'P1' }));

    test('CP-SERV-PROD-020: convierte los números y deja undefined lo que no se envía', async () => {
      const res = await service.actualizarProducto('1', { precio: '12.5', stock: '4', stock_minimo: '5' });

      expect(prodRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({ precio: 12.5, stock: 4, stock_minimo: 5 }));
      expect(res.nivel_stock).toBe('CRITICO');
    });

    test('CP-SERV-PROD-021: actualización parcial (solo nombre) no toca precio ni stock', async () => {
      await service.actualizarProducto(1, { nombre: 'Nuevo nombre' });

      expect(prodRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({
        nombre: 'Nuevo nombre', precio: undefined, stock: undefined, stock_minimo: undefined,
      }));
    });

    test('CP-SERV-PROD-022: rechaza nombre corto, precio negativo, stock decimal y stock mínimo negativo', async () => {
      await expect(service.actualizarProducto(1, { nombre: 'A' })).rejects.toThrow('nombre debe tener entre 2 y 150');
      await expect(service.actualizarProducto(1, { precio: -1 })).rejects.toThrow('precio debe ser');
      await expect(service.actualizarProducto(1, { stock: 2.5 })).rejects.toThrow('stock debe ser');
      await expect(service.actualizarProducto(1, { stock_minimo: -3 })).rejects.toThrow('stock mínimo debe ser');
      expect(prodRepo.update).not.toHaveBeenCalled();
    });

    test('CP-SERV-PROD-023: rechaza ID inválido y producto inexistente', async () => {
      await expect(service.actualizarProducto('abc', {})).rejects.toThrow('ID de producto inválido');

      prodRepo.findById.mockResolvedValue(null);
      await expect(service.actualizarProducto(9, {})).rejects.toThrow('Producto con ID 9 no encontrado');
    });
  });

  describe('desactivarProducto', () => {
    test('CP-SERV-PROD-024: rechaza ID inválido y producto inexistente', async () => {
      await expect(service.desactivarProducto('abc')).rejects.toThrow('ID de producto inválido');

      prodRepo.findById.mockResolvedValue(null);
      await expect(service.desactivarProducto(9)).rejects.toThrow('Producto con ID 9 no encontrado');
      expect(prodRepo.softDelete).not.toHaveBeenCalled();
    });
  });
});
