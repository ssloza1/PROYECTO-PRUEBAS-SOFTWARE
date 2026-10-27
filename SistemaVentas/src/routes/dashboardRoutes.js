const { Router } = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = Router();

router.get('/metricas', (req, res, next) => dashboardController.obtenerMetricas(req, res, next));

module.exports = router;
