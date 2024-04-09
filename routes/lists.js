const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('get lists');
});

router.post('/', (req, res) => {
    res.send('post lists');
});

router.patch('/', (req, res) => {
    res.send('fetch lists');
});

router.delete('/', (req, res) => {
    res.send('delete lists');
});

module.exports = router;