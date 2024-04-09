const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    res.send('make schedule');
});

module.exports = router;