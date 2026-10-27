const catalogoService = require('../services/catalogoService');

class CatalogoController {
  // --- Categorías ---
  async listarCategorias(req, res, next) {
    try {
      const categorias = await catalogoService.listarCategorias();
      res.json({ exito: true, total: categorias.length, datos: categorias });
    } catch (err) {
      next(err);
    }
  }

  async crearCategoria(req, res, next) {
    try {
      const nueva = await catalogoService.registrarCategoria(req.body);
      res.status(201).json({ exito: true, mensaje: 'Categoría creada', datos: nueva });
    } catch (err) {
      next(err);
    }
  }

  // --- Proveedores ---
  async listarProveedores(req, res, next) {
    try {
      const filtros = {
        activo: req.query.activo !== undefined ? req.query.activo === 'true' : undefined,
      };
      const proveedores = await catalogoService.listarProveedores(filtros);
      res.json({ exito: true, total: proveedores.length, datos: proveedores });
    } catch (err) {
      next(err);
    }
  }

  async crearProveedor(req, res, next) {
    try {
      const nuevo = await catalogoService.registrarProveedor(req.body);
      res.status(201).json({ exito: true, mensaje: 'Proveedor registrado', datos: nuevo });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CatalogoController();
