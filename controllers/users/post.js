module.exports = (req, res, next) => {
    res.send('account created');
};
const db = require('../../db');
const bcrypt = require('bcrypt');

module.exports = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error hashing password' });
        }

        const query = 'INSERT INTO user (email, pwd) VALUES (?, ?)';
        db.query(query, [email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ success: false, message: 'Email already registered' });
                }
                return res.json({ success: false, message: 'Error registering user' });
            }
            res.json({ success: true, message: 'User registered successfully' });
        });
    });
};