const controllers = require('../controllers');

const express = require('express');
const router = express.Router();

router.post('/', controllers.users.post);

router.delete('/', controllers.users.delete);

router.post('/signin', controllers.users.signin);

router.post('/signout', controllers.users.signout);

module.exports = router;