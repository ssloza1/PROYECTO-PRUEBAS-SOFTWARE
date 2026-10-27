const db = require('../config/db');

/**
 * Repositorio para entidades de catálogo (Categorías y Proveedores)
 */
class CatalogoRepository {
  // --- CATEGORÍAS ---
  async findAllCategorias(client = null) {
    const executor = client || db;
    const res = await executor.query(
      `SELECT id_categoria, nombre, descripcion FROM public.categorias ORDER BY id_categoria ASC`
    );
    return res.rows;
  }

  async findCategoriaById(id, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `SELECT id_categoria, nombre, descripcion FROM public.categorias WHERE id_categoria = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async createCategoria(data, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `INSERT INTO public.categorias (nombre, descripcion) VALUES ($1, $2) RETURNING id_categoria, nombre, descripcion`,
      [data.nombre, data.descripcion || null]
    );
    return res.rows[0];
  }

  // --- PROVEEDORES ---
  async findAllProveedores(filtros = {}, client = null) {
    const executor = client || db;
    let query = `SELECT id_proveedor, nombre, telefono, correo, direccion, activo FROM public.proveedores WHERE 1=1`;
    const params = [];
    if (filtros.activo !== undefined) {
      params.push(filtros.activo);
      query += ` AND activo = $${params.length}`;
    }
    query += ` ORDER BY id_proveedor ASC`;
    const res = await executor.query(query, params);
    return res.rows;
  }

  async findProveedorById(id, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `SELECT id_proveedor, nombre, telefono, correo, direccion, activo FROM public.proveedores WHERE id_proveedor = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async createProveedor(data, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `INSERT INTO public.proveedores (nombre, telefono, correo, direccion, activo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_proveedor, nombre, telefono, correo, direccion, activo`,
      [
        data.nombre,
        data.telefono || null,
        data.correo || null,
        data.direccion || null,
        data.activo !== undefined ? data.activo : true,
      ]
    );
    return res.rows[0];
  }
}

module.exports = new CatalogoRepository();
