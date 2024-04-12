const controllers = require('../controllers');

const express = require('express');
const router = express.Router();

router.get('/internal', controllers.search.internalSearch);
router.get('/external', controllers.search.externalSearch);

module.exports = router;