const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    res.send('signup user');
});

router.delete('/', (req, res) => {
    res.send('account deleted');
});

router.post('/signin', (req, res) => {
    res.send('signin user');
});

router.post('/signout', (req, res) => {
    res.send('signout user');
});

module.exports = router;