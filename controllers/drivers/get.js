const db = require('../../db');

module.exports = (req, res, next) => {
    const uid = req.query.uid? req.query.uid : 1;
    const query = 'SELECT * FROM driver WHERE uid = ?';

    db.query(query, [uid], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database query error');
            return;
        }
        res.send({ drivers: result });
    });
};
