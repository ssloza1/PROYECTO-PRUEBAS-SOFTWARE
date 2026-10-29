const db = require('../config/db');

/**
 * Repositorio de acceso a datos para Productos
 */
class ProductoRepository {
  /**
   * Obtiene todos los productos con datos de categoría y proveedor
   * @param {object} [filtros={}]
   * @param {import('pg').PoolClient} [client]
   */
  async findAll(filtros = {}, client = null) {
    const executor = client || db;
    let query = `
      SELECT 
        p.id_producto,
        p.nombre,
        p.descripcion,
        p.precio::float AS precio,
        p.stock,
        p.stock_minimo,
        p.id_proveedor,
        pr.nombre AS nombre_proveedor,
        p.id_categoria,
        c.nombre AS nombre_categoria,
        p.activo
      FROM public.productos p
      LEFT JOIN public.categorias c ON p.id_categoria = c.id_categoria
      LEFT JOIN public.proveedores pr ON p.id_proveedor = pr.id_proveedor
      WHERE 1=1
    `;
    const params = [];

    if (filtros.activo !== undefined) {
      params.push(filtros.activo);
      query += ` AND p.activo = $${params.length}`;
    }

    if (filtros.id_categoria) {
      params.push(filtros.id_categoria);
      query += ` AND p.id_categoria = $${params.length}`;
    }

    if (filtros.stock_bajo === true) {
      query += ` AND p.stock <= p.stock_minimo`;
    }

    if (filtros.busqueda) {
      params.push(`%${filtros.busqueda}%`);
      query += ` AND (p.nombre ILIKE $${params.length} OR p.descripcion ILIKE $${params.length})`;
    }

    query += ` ORDER BY p.id_producto ASC`;

    const res = await executor.query(query, params);
    return res.rows;
  }

  /**
   * Busca un producto por ID
   * @param {number} id 
   * @param {import('pg').PoolClient} [client]
   */
  async findById(id, client = null) {
    const executor = client || db;
    const query = `
      SELECT 
        p.id_producto,
        p.nombre,
        p.descripcion,
        p.precio::float AS precio,
        p.stock,
        p.stock_minimo,
        p.id_proveedor,
        pr.nombre AS nombre_proveedor,
        p.id_categoria,
        c.nombre AS nombre_categoria,
        p.activo
      FROM public.productos p
      LEFT JOIN public.categorias c ON p.id_categoria = c.id_categoria
      LEFT JOIN public.proveedores pr ON p.id_proveedor = pr.id_proveedor
      WHERE p.id_producto = $1
    `;
    const res = await executor.query(query, [id]);
    return res.rows[0] || null;
  }

  /**
   * Crea un nuevo producto
   * @param {object} data 
   * @param {import('pg').PoolClient} [client]
   */
  async create(data, client = null) {
    const executor = client || db;
    const query = `
      INSERT INTO public.productos 
        (nombre, descripcion, precio, stock, stock_minimo, id_proveedor, id_categoria, activo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id_producto, nombre, descripcion, precio::float AS precio, stock, stock_minimo, 
        id_proveedor, id_categoria, activo
    `;
    const values = [
      data.nombre,
      data.descripcion || null,
      data.precio,
      data.stock || 0,
      data.stock_minimo || 0,
      data.id_proveedor,
      data.id_categoria,
      data.activo !== undefined ? data.activo : true,
    ];
    const res = await executor.query(query, values);
    return res.rows[0];
  }

  /**
   * Actualiza los datos de un producto
   * @param {number} id 
   * @param {object} data 
   * @param {import('pg').PoolClient} [client]
   */
  async update(id, data, client = null) {
    const executor = client || db;
    const query = `
      UPDATE public.productos
      SET 
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        precio = COALESCE($3, precio),
        stock = COALESCE($4, stock),
        stock_minimo = COALESCE($5, stock_minimo),
        id_proveedor = COALESCE($6, id_proveedor),
        id_categoria = COALESCE($7, id_categoria),
        activo = COALESCE($8, activo)
      WHERE id_producto = $9
      RETURNING 
        id_producto, nombre, descripcion, precio::float AS precio, stock, stock_minimo, 
        id_proveedor, id_categoria, activo
    `;
    const values = [
      data.nombre,
      data.descripcion,
      data.precio,
      data.stock,
      data.stock_minimo,
      data.id_proveedor,
      data.id_categoria,
      data.activo,
      id,
    ];
    const res = await executor.query(query, values);
    return res.rows[0] || null;
  }

  /**
   * Actualiza el stock de un producto (suma o resta)
   * @param {number} id 
   * @param {number} delta - Positivo para sumar, negativo para restar
   * @param {import('pg').PoolClient} [client]
   */
  async updateStock(id, delta, client = null) {
    const executor = client || db;
    const query = `
      UPDATE public.productos
      SET stock = stock + $1
      WHERE id_producto = $2 AND (stock + $1) >= 0
      RETURNING id_producto, nombre, stock
    `;
    const res = await executor.query(query, [delta, id]);
    return res.rows[0] || null;
  }

  /**
   * Desactiva (eliminación lógica) un producto
   * @param {number} id 
   * @param {import('pg').PoolClient} [client]
   */
  async softDelete(id, client = null) {
    const executor = client || db;
    const query = `
      UPDATE public.productos
      SET activo = FALSE
      WHERE id_producto = $1
      RETURNING id_producto, nombre, activo
    `;
    const res = await executor.query(query, [id]);
    return res.rows[0] || null;
  }
}

module.exports = new ProductoRepository();
