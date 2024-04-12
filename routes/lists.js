const controllers = require('../controllers');

const path = require('path');
const xlsx = require('xlsx');

const express = require('express');
const router = express.Router();

const multer = require('multer');
const storage = multer.diskStorage({
    destination: path.join('temp'),
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

router.get('/', controllers.lists.get);

router.post('/', upload.single('file'), (req, res, next) => {
    if (!req.file) {
        res.status(400).send('No file uploaded');
    } else {
        next();
    }
}, controllers.lists.post);

router.patch('/', controllers.lists.patch);

router.delete('/', controllers.lists.delete);

module.exports = router;