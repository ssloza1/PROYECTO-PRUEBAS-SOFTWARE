const { Router } = require('express');
const ventaController = require('../controllers/ventaController');

const router = Router();

router.get('/', (req, res, next) => ventaController.listar(req, res, next));
router.get('/:id', (req, res, next) => ventaController.obtenerPorId(req, res, next));
router.post('/', (req, res, next) => ventaController.crear(req, res, next));
router.post('/:id/anular', (req, res, next) => ventaController.anular(req, res, next));

module.exports = router;
