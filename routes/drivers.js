const controllers = require('../controllers');

const express = require('express');
const router = express.Router();

router.get('/', controllers.drivers.get);

router.post('/', controllers.drivers.post);

router.patch('/', controllers.drivers.patch);

router.delete('/', controllers.drivers.delete);

module.exports = router;