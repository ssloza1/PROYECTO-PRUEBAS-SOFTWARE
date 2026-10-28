const catalogoRepository = require('../repositories/catalogoRepository');
const { validarTexto, validarEmail, validarEnteroPositivo } = require('../utils/validadores');

/**
 * Servicio para Categorías y Proveedores
 */
class CatalogoService {
  constructor(catalogoRepo = catalogoRepository) {
    this.catalogoRepo = catalogoRepo;
  }

  // --- CATEGORÍAS ---
  async listarCategorias() {
    return await this.catalogoRepo.findAllCategorias();
  }

  async registrarCategoria(data) {
    if (!data.nombre || !validarTexto(data.nombre, 2, 100)) {
      throw new Error('El nombre de la categoría es obligatorio (entre 2 y 100 caracteres)');
    }
    return await this.catalogoRepo.createCategoria({
      nombre: data.nombre.trim(),
      descripcion: data.descripcion ? data.descripcion.trim() : null,
    });
  }

  // --- PROVEEDORES ---
  async listarProveedores(filtros = {}) {
    return await this.catalogoRepo.findAllProveedores(filtros);
  }

  async registrarProveedor(data) {
    if (!data.nombre || !validarTexto(data.nombre, 2, 120)) {
      throw new Error('El nombre del proveedor es obligatorio (entre 2 y 120 caracteres)');
    }
    if (data.correo && !validarEmail(data.correo)) {
      throw new Error('El correo del proveedor no es válido');
    }
    return await this.catalogoRepo.createProveedor({
      nombre: data.nombre.trim(),
      telefono: data.telefono ? data.telefono.trim() : null,
      correo: data.correo ? data.correo.trim().toLowerCase() : null,
      direccion: data.direccion ? data.direccion.trim() : null,
      activo: data.activo !== undefined ? Boolean(data.activo) : true,
    });
  }
}

module.exports = new CatalogoService();
module.exports.CatalogoService = CatalogoService;
