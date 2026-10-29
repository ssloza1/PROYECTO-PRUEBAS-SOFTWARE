const { ClienteService } = require('../../src/services/clienteService');

describe('Pruebas Unitarias - ClienteService (reglas de negocio con repositorio simulado)', () => {
  let repo;
  let service;

  const cliente = { id_cliente: 1, nombre: 'Ana Pérez', cedula: 'TEST-CLI-001', activo: true };

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCedula: jest.fn(),
      create: jest.fn(async (datos) => ({ id_cliente: 10, ...datos })),
      update: jest.fn(async (id, datos) => ({ id_cliente: id, ...datos })),
      softDelete: jest.fn(),
    };
    service = new ClienteService(repo);
  });

  describe('Consulta', () => {
    test('CP-SERV-CLI-001: listarClientes entrega los filtros al repositorio (y {} por defecto)', async () => {
      repo.findAll.mockResolvedValue([cliente]);

      await service.listarClientes({ activo: true, busqueda: 'ana' });
      await service.listarClientes();

      expect(repo.findAll).toHaveBeenNthCalledWith(1, { activo: true, busqueda: 'ana' });
      expect(repo.findAll).toHaveBeenNthCalledWith(2, {});
    });

    test('CP-SERV-CLI-002: obtenerPorId devuelve el cliente existente', async () => {
      repo.findById.mockResolvedValue(cliente);

      await expect(service.obtenerPorId('1')).resolves.toEqual(cliente);
      expect(repo.findById).toHaveBeenCalledWith(1);
    });

    test.each([['abc'], [0], [-3], [1.5]])('CP-SERV-CLI-003: obtenerPorId rechaza el ID inválido %p', async (id) => {
      await expect(service.obtenerPorId(id)).rejects.toThrow('ID de cliente inválido');
      expect(repo.findById).not.toHaveBeenCalled();
    });

    test('CP-SERV-CLI-004: obtenerPorId rechaza un cliente inexistente', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.obtenerPorId(99)).rejects.toThrow('Cliente con ID 99 no encontrado');
    });
  });

  describe('Registro (RN-CLI-01 y RN-CLI-02)', () => {
    const datosValidos = { nombre: '  Alan Arias  ', cedula: ' 1710034065 ', telefono: ' 0991234567 ', correo: ' Alan@ESPE.edu.ec ', direccion: ' Quito ' };

    test('CP-SERV-CLI-005: registra un cliente válido normalizando espacios y minúsculas', async () => {
      repo.findByCedula.mockResolvedValue(null);

      const res = await service.registrarCliente(datosValidos);

      expect(repo.findByCedula).toHaveBeenCalledWith('1710034065');
      expect(repo.create).toHaveBeenCalledWith({
        nombre: 'Alan Arias',
        cedula: '1710034065',
        telefono: '0991234567',
        correo: 'alan@espe.edu.ec',
        direccion: 'Quito',
        activo: true,
      });
      expect(res.id_cliente).toBe(10);
    });

    test('CP-SERV-CLI-006: sin datos opcionales guarda null y respeta activo = false', async () => {
      repo.findByCedula.mockResolvedValue(null);

      await service.registrarCliente({ nombre: 'Luis', cedula: 'TEST-LUIS', activo: false });

      expect(repo.create).toHaveBeenCalledWith({
        nombre: 'Luis', cedula: 'TEST-LUIS', telefono: null, correo: null, direccion: null, activo: false,
      });
    });

    test.each([[''], [' '], ['A'], ['a'.repeat(121)], [undefined]])(
      'CP-SERV-CLI-007: rechaza nombre inválido %p (valores límite 2 y 120)',
      async (nombre) => {
        await expect(service.registrarCliente({ ...datosValidos, nombre })).rejects.toThrow('nombre del cliente es obligatorio');
        expect(repo.create).not.toHaveBeenCalled();
      }
    );

    test('CP-SERV-CLI-008: acepta nombres en los valores límite (2 y 120 caracteres)', async () => {
      repo.findByCedula.mockResolvedValue(null);

      await expect(service.registrarCliente({ nombre: 'Al', cedula: 'TEST-1' })).resolves.toBeDefined();
      await expect(service.registrarCliente({ nombre: 'a'.repeat(120), cedula: 'TEST-2' })).resolves.toBeDefined();
    });

    test('CP-SERV-CLI-009: rechaza si falta la cédula', async () => {
      await expect(service.registrarCliente({ nombre: 'Ana' })).rejects.toThrow('cédula del cliente es obligatoria');
    });

    test('CP-SERV-CLI-010: rechaza una cédula con formato inválido e incluye la razón', async () => {
      await expect(service.registrarCliente({ nombre: 'Ana', cedula: '123' })).rejects.toThrow(/Cédula inválida: .*10 dígitos/);
      expect(repo.findByCedula).not.toHaveBeenCalled();
    });

    test('CP-SERV-CLI-011: rechaza una cédula ya registrada (unicidad)', async () => {
      repo.findByCedula.mockResolvedValue(cliente);

      await expect(service.registrarCliente({ nombre: 'Ana', cedula: 'TEST-CLI-001' })).rejects.toThrow('Ya existe un cliente');
      expect(repo.create).not.toHaveBeenCalled();
    });

    test('CP-SERV-CLI-012: rechaza un correo con formato inválido', async () => {
      repo.findByCedula.mockResolvedValue(null);

      await expect(
        service.registrarCliente({ nombre: 'Ana', cedula: 'TEST-1', correo: 'sin-arroba' })
      ).rejects.toThrow('correo electrónico no tiene un formato válido');
    });
  });

  describe('Actualización', () => {
    beforeEach(() => repo.findById.mockResolvedValue(cliente));

    test('CP-SERV-CLI-013: actualiza y pasa el correo en minúsculas', async () => {
      await service.actualizarCliente('1', { nombre: 'Ana María', correo: 'ANA@Correo.COM' });

      expect(repo.update).toHaveBeenCalledWith(1, { nombre: 'Ana María', correo: 'ana@correo.com' });
    });

    test.each([[''], [null], [undefined]])('CP-SERV-CLI-014: correo %p no se valida ni se transforma', async (correo) => {
      await service.actualizarCliente(1, { nombre: 'Ana', correo });

      expect(repo.update).toHaveBeenCalledWith(1, { nombre: 'Ana', correo });
    });

    test('CP-SERV-CLI-015: rechaza ID inválido, cliente inexistente, nombre corto y correo inválido', async () => {
      await expect(service.actualizarCliente('x', {})).rejects.toThrow('ID de cliente inválido');
      await expect(service.actualizarCliente(1, { nombre: 'A' })).rejects.toThrow('nombre debe tener entre 2 y 120');
      await expect(service.actualizarCliente(1, { correo: 'mal' })).rejects.toThrow('formato válido');

      repo.findById.mockResolvedValue(null);
      await expect(service.actualizarCliente(5, {})).rejects.toThrow('Cliente con ID 5 no encontrado');
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('Desactivación lógica', () => {
    test('CP-SERV-CLI-016: desactiva un cliente existente', async () => {
      repo.findById.mockResolvedValue(cliente);
      repo.softDelete.mockResolvedValue({ id_cliente: 1, nombre: 'Ana Pérez', activo: false });

      const res = await service.desactivarCliente('1');

      expect(res.activo).toBe(false);
      expect(repo.softDelete).toHaveBeenCalledWith(1);
    });

    test('CP-SERV-CLI-017: rechaza ID inválido o cliente inexistente', async () => {
      await expect(service.desactivarCliente('abc')).rejects.toThrow('ID de cliente inválido');

      repo.findById.mockResolvedValue(null);
      await expect(service.desactivarCliente(7)).rejects.toThrow('Cliente con ID 7 no encontrado');
      expect(repo.softDelete).not.toHaveBeenCalled();
    });
  });
});
