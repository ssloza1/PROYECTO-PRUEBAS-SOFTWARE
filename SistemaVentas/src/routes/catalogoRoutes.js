const { Router } = require('express');
const catalogoController = require('../controllers/catalogoController');

const router = Router();

// Categorías
router.get('/categorias', (req, res, next) => catalogoController.listarCategorias(req, res, next));
router.post('/categorias', (req, res, next) => catalogoController.crearCategoria(req, res, next));

// Proveedores
router.get('/proveedores', (req, res, next) => catalogoController.listarProveedores(req, res, next));
router.post('/proveedores', (req, res, next) => catalogoController.crearProveedor(req, res, next));

module.exports = router;
