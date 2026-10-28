const clienteRepository = require('../repositories/clienteRepository');
const { validarCedula, validarEmail, validarTexto, validarEnteroPositivo } = require('../utils/validadores');

/**
 * Servicio de lógica de negocio para Clientes
 */
class ClienteService {
  constructor(clienteRepo = clienteRepository) {
    this.clienteRepo = clienteRepo;
  }

  async listarClientes(filtros = {}) {
    return await this.clienteRepo.findAll(filtros);
  }

  async obtenerPorId(id) {
    const idNum = Number(id);
    if (!validarEnteroPositivo(idNum)) {
      throw new Error('ID de cliente inválido');
    }
    const cliente = await this.clienteRepo.findById(idNum);
    if (!cliente) {
      throw new Error(`Cliente con ID ${idNum} no encontrado`);
    }
    return cliente;
  }

  async registrarCliente(data) {
    // 1. Validar nombre
    if (!data.nombre || !validarTexto(data.nombre, 2, 120)) {
      throw new Error('El nombre del cliente es obligatorio (entre 2 y 120 caracteres)');
    }

    // 2. Validar cédula
    if (!data.cedula) {
      throw new Error('La cédula del cliente es obligatoria');
    }
    const valCedula = validarCedula(data.cedula);
    if (!valCedula.esValida) {
      throw new Error(`Cédula inválida: ${valCedula.razon || 'formato no admitido'}`);
    }

    // Verificar unicidad de cédula
    const existente = await this.clienteRepo.findByCedula(data.cedula.trim());
    if (existente) {
      throw new Error(`Ya existe un cliente registrado con la cédula ${data.cedula}`);
    }

    // 3. Validar email si fue provisto
    if (data.correo && !validarEmail(data.correo)) {
      throw new Error('El correo electrónico no tiene un formato válido');
    }

    return await this.clienteRepo.create({
      nombre: data.nombre.trim(),
      cedula: data.cedula.trim(),
      telefono: data.telefono ? data.telefono.trim() : null,
      correo: data.correo ? data.correo.trim().toLowerCase() : null,
      direccion: data.direccion ? data.direccion.trim() : null,
      activo: data.activo !== undefined ? Boolean(data.activo) : true,
    });
  }

  async actualizarCliente(id, data) {
    const idNum = Number(id);
    if (!validarEnteroPositivo(idNum)) {
      throw new Error('ID de cliente inválido');
    }

    const existente = await this.clienteRepo.findById(idNum);
    if (!existente) {
      throw new Error(`Cliente con ID ${idNum} no encontrado`);
    }

    if (data.nombre !== undefined && !validarTexto(data.nombre, 2, 120)) {
      throw new Error('El nombre debe tener entre 2 y 120 caracteres');
    }

    if (data.correo !== undefined && data.correo !== null && data.correo !== '') {
      if (!validarEmail(data.correo)) {
        throw new Error('El correo electrónico no tiene un formato válido');
      }
    }

    return await this.clienteRepo.update(idNum, {
      ...data,
      correo: data.correo ? data.correo.trim().toLowerCase() : data.correo,
    });
  }

  async desactivarCliente(id) {
    const idNum = Number(id);
    if (!validarEnteroPositivo(idNum)) {
      throw new Error('ID de cliente inválido');
    }
    const existente = await this.clienteRepo.findById(idNum);
    if (!existente) {
      throw new Error(`Cliente con ID ${idNum} no encontrado`);
    }
    return await this.clienteRepo.softDelete(idNum);
  }
}

module.exports = new ClienteService();
module.exports.ClienteService = ClienteService;
