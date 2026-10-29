const { CatalogoService } = require('../../src/services/catalogoService');

describe('Pruebas Unitarias - CatalogoService (categorías y proveedores)', () => {
  let repo;
  let service;

  beforeEach(() => {
    repo = {
      findAllCategorias: jest.fn().mockResolvedValue([{ id_categoria: 1 }]),
      createCategoria: jest.fn(async (d) => ({ id_categoria: 2, ...d })),
      findAllProveedores: jest.fn().mockResolvedValue([{ id_proveedor: 1 }]),
      createProveedor: jest.fn(async (d) => ({ id_proveedor: 2, ...d })),
    };
    service = new CatalogoService(repo);
  });

  describe('Categorías', () => {
    test('CP-SERV-CAT-001: listarCategorias devuelve lo que entrega el repositorio', async () => {
      await expect(service.listarCategorias()).resolves.toEqual([{ id_categoria: 1 }]);
    });

    test('CP-SERV-CAT-002: registra una categoría recortando espacios', async () => {
      await service.registrarCategoria({ nombre: '  Oficina ', descripcion: ' Papelería ' });

      expect(repo.createCategoria).toHaveBeenCalledWith({ nombre: 'Oficina', descripcion: 'Papelería' });
    });

    test('CP-SERV-CAT-003: sin descripción se guarda null', async () => {
      await service.registrarCategoria({ nombre: 'Redes' });

      expect(repo.createCategoria).toHaveBeenCalledWith({ nombre: 'Redes', descripcion: null });
    });

    test.each([[undefined], [''], ['A'], ['a'.repeat(101)]])('CP-SERV-CAT-004: rechaza el nombre %p', async (nombre) => {
      await expect(service.registrarCategoria({ nombre })).rejects.toThrow('nombre de la categoría es obligatorio');
      expect(repo.createCategoria).not.toHaveBeenCalled();
    });
  });

  describe('Proveedores', () => {
    test('CP-SERV-CAT-005: listarProveedores entrega filtros al repositorio (y {} por defecto)', async () => {
      await service.listarProveedores({ activo: true });
      await service.listarProveedores();

      expect(repo.findAllProveedores).toHaveBeenNthCalledWith(1, { activo: true });
      expect(repo.findAllProveedores).toHaveBeenNthCalledWith(2, {});
    });

    test('CP-SERV-CAT-006: registra un proveedor completo normalizando datos', async () => {
      await service.registrarProveedor({
        nombre: ' Tecno SA ', telefono: ' 022 ', correo: ' INFO@Tecno.com ', direccion: ' Quito ', activo: 0,
      });

      expect(repo.createProveedor).toHaveBeenCalledWith({
        nombre: 'Tecno SA', telefono: '022', correo: 'info@tecno.com', direccion: 'Quito', activo: false,
      });
    });

    test('CP-SERV-CAT-007: registra un proveedor mínimo con valores por defecto', async () => {
      await service.registrarProveedor({ nombre: 'Mínimo SA' });

      expect(repo.createProveedor).toHaveBeenCalledWith({
        nombre: 'Mínimo SA', telefono: null, correo: null, direccion: null, activo: true,
      });
    });

    test.each([[undefined], ['A'], ['a'.repeat(121)]])('CP-SERV-CAT-008: rechaza el nombre %p', async (nombre) => {
      await expect(service.registrarProveedor({ nombre })).rejects.toThrow('nombre del proveedor es obligatorio');
    });

    test('CP-SERV-CAT-009: rechaza un correo inválido', async () => {
      await expect(
        service.registrarProveedor({ nombre: 'Tecno SA', correo: 'mal-correo' })
      ).rejects.toThrow('correo del proveedor no es válido');
      expect(repo.createProveedor).not.toHaveBeenCalled();
    });
  });
});
