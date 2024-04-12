const express = require('express');
const multer = require('multer');

const app = express();
const port = 3000;

// Set up multer storage
const storage = multer.diskStorage({
    destination: './', // Replace with your desired destination folder
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

// Create multer instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Handle POST request with file upload
app.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        res.status(400).send('No file uploaded');
    } else {
        res.send('File uploaded successfully');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});