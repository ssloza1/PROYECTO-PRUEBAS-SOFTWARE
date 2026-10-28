const productoService = require('../services/productoService');

class ProductoController {
  async listar(req, res, next) {
    try {
      const filtros = {
        activo: req.query.activo !== undefined ? req.query.activo === 'true' : undefined,
        id_categoria: req.query.id_categoria ? Number(req.query.id_categoria) : undefined,
        stock_bajo: req.query.stock_bajo === 'true',
        busqueda: req.query.q,
      };
      const productos = await productoService.listarProductos(filtros);
      res.json({ exito: true, total: productos.length, datos: productos });
    } catch (err) {
      next(err);
    }
  }

  async obtenerPorId(req, res, next) {
    try {
      const producto = await productoService.obtenerPorId(req.params.id);
      res.json({ exito: true, datos: producto });
    } catch (err) {
      next(err);
    }
  }

  async crear(req, res, next) {
    try {
      const nuevo = await productoService.registrarProducto(req.body);
      res.status(201).json({ exito: true, mensaje: 'Producto creado exitosamente', datos: nuevo });
    } catch (err) {
      next(err);
    }
  }

  async actualizar(req, res, next) {
    try {
      const actualizado = await productoService.actualizarProducto(req.params.id, req.body);
      res.json({ exito: true, mensaje: 'Producto actualizado exitosamente', datos: actualizado });
    } catch (err) {
      next(err);
    }
  }

  async eliminar(req, res, next) {
    try {
      const resultado = await productoService.desactivarProducto(req.params.id);
      res.json({ exito: true, mensaje: 'Producto desactivado exitosamente', datos: resultado });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProductoController();
