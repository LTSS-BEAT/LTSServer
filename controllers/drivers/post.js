const db = require('../../db');

module.exports = (req, res, next) => {
    const uid = 1;
    const { name, carNumber, address, phoneNumber } = req.body;
    const query = 'INSERT INTO driver (name, lpnum, contact, uid) VALUES (?, ?, ?, ?)';

    db.query(query, [name, carNumber, phoneNumber, uid], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error registering driver' });
        }
        res.json({ success: true, message: 'Driver registered successfully' });
    });
};