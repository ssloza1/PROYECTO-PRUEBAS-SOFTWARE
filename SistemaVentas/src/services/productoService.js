const productoRepository = require('../repositories/productoRepository');
const catalogoRepository = require('../repositories/catalogoRepository');
const { evaluarNivelStock } = require('../utils/calculos');
const { validarTexto, validarNumeroPositivo, validarEnteroPositivo } = require('../utils/validadores');

/**
 * Servicio de lógica de negocio para Productos e Inventario
 */
class ProductoService {
  constructor(prodRepo = productoRepository, catRepo = catalogoRepository) {
    this.productoRepo = prodRepo;
    this.catalogoRepo = catRepo;
  }

  /**
   * Obtiene lista de productos con nivel de stock calculado
   * @param {object} filtros
   */
  async listarProductos(filtros = {}) {
    const productos = await this.productoRepo.findAll(filtros);
    return productos.map((p) => ({
      ...p,
      nivel_stock: evaluarNivelStock(p.stock, p.stock_minimo),
    }));
  }

  /**
   * Obtiene un producto por ID con su nivel de stock
   * @param {number} id
   */
  async obtenerPorId(id) {
    const idNum = Number(id);
    if (!validarEnteroPositivo(idNum)) {
      throw new Error('El ID de producto debe ser un entero positivo');
    }

    const producto = await this.productoRepo.findById(idNum);
    if (!producto) {
      throw new Error(`Producto con ID ${idNum} no encontrado`);
    }

    return {
      ...producto,
      nivel_stock: evaluarNivelStock(producto.stock, producto.stock_minimo),
    };
  }

  /**
   * Registra un nuevo producto validando reglas de negocio
   * @param {object} data
   */
  async registrarProducto(data) {
    // 1. Validar nombre
    if (!data.nombre || !validarTexto(data.nombre, 2, 150)) {
      throw new Error('El nombre del producto es obligatorio (entre 2 y 150 caracteres)');
    }

    // 2. Validar precio (>= 0)
    if (data.precio === undefined || !validarNumeroPositivo(data.precio, true)) {
      throw new Error('El precio debe ser un número mayor o igual a cero');
    }

    // 3. Validar stock (entero >= 0)
    const stock = data.stock !== undefined ? Number(data.stock) : 0;
    if (!validarEnteroPositivo(stock, true)) {
      throw new Error('El stock debe ser un número entero mayor o igual a cero');
    }

    // 4. Validar stock mínimo (entero >= 0)
    const stockMinimo = data.stock_minimo !== undefined ? Number(data.stock_minimo) : 0;
    if (!validarEnteroPositivo(stockMinimo, true)) {
      throw new Error('El stock mínimo debe ser un número entero mayor o igual a cero');
    }

    // 5. Validar existencia de categoría
    if (!data.id_categoria || !validarEnteroPositivo(data.id_categoria)) {
      throw new Error('Debe especificar una categoría válida');
    }
    const categoria = await this.catalogoRepo.findCategoriaById(Number(data.id_categoria));
    if (!categoria) {
      throw new Error(`La categoría con ID ${data.id_categoria} no existe`);
    }

    // 6. Validar existencia de proveedor
    if (!data.id_proveedor || !validarEnteroPositivo(data.id_proveedor)) {
      throw new Error('Debe especificar un proveedor válido');
    }
    const proveedor = await this.catalogoRepo.findProveedorById(Number(data.id_proveedor));
    if (!proveedor) {
      throw new Error(`El proveedor con ID ${data.id_proveedor} no existe`);
    }

    // Guardar
    const nuevo = await this.productoRepo.create({
      nombre: data.nombre.trim(),
      descripcion: data.descripcion ? data.descripcion.trim() : null,
      precio: Number(data.precio),
      stock,
      stock_minimo: stockMinimo,
      id_categoria: Number(data.id_categoria),
      id_proveedor: Number(data.id_proveedor),
      activo: data.activo !== undefined ? Boolean(data.activo) : true,
    });

    return {
      ...nuevo,
      nivel_stock: evaluarNivelStock(nuevo.stock, nuevo.stock_minimo),
    };
  }

  /**
   * Actualiza datos de un producto
   * @param {number} id 
   * @param {object} data 
   */
  async actualizarProducto(id, data) {
    const idNum = Number(id);
    if (!validarEnteroPositivo(idNum)) {
      throw new Error('ID de producto inválido');
    }

    const existente = await this.productoRepo.findById(idNum);
    if (!existente) {
      throw new Error(`Producto con ID ${idNum} no encontrado`);
    }

    if (data.nombre !== undefined && !validarTexto(data.nombre, 2, 150)) {
      throw new Error('El nombre debe tener entre 2 y 150 caracteres');
    }

    if (data.precio !== undefined && !validarNumeroPositivo(data.precio, true)) {
      throw new Error('El precio debe ser un número mayor o igual a cero');
    }

    if (data.stock !== undefined && !validarEnteroPositivo(Number(data.stock), true)) {
      throw new Error('El stock debe ser un entero mayor o igual a cero');
    }

    if (data.stock_minimo !== undefined && !validarEnteroPositivo(Number(data.stock_minimo), true)) {
      throw new Error('El stock mínimo debe ser un entero mayor o igual a cero');
    }

    const actualizado = await this.productoRepo.update(idNum, {
      ...data,
      precio: data.precio !== undefined ? Number(data.precio) : undefined,
      stock: data.stock !== undefined ? Number(data.stock) : undefined,
      stock_minimo: data.stock_minimo !== undefined ? Number(data.stock_minimo) : undefined,
    });

    return {
      ...actualizado,
      nivel_stock: evaluarNivelStock(actualizado.stock, actualizado.stock_minimo),
    };
  }

  /**
   * Desactiva un producto (soft delete)
   * @param {number} id 
   */
  async desactivarProducto(id) {
    const idNum = Number(id);
    if (!validarEnteroPositivo(idNum)) {
      throw new Error('ID de producto inválido');
    }
    const existente = await this.productoRepo.findById(idNum);
    if (!existente) {
      throw new Error(`Producto con ID ${idNum} no encontrado`);
    }
    return await this.productoRepo.softDelete(idNum);
  }
}

module.exports = new ProductoService();
module.exports.ProductoService = ProductoService;
