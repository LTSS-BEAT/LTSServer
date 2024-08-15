const controllers = require('../controllers');

const express = require('express');
const router = express.Router();

router.get('/', controllers.map);

module.exports = router;