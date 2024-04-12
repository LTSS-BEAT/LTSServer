const db = require('../../db');

module.exports = (req, res, next) => {
    const queryData = req.body.drivers.map((driver) => [driver.did]);
    const query = 'DELETE FROM driver WHERE did = ?';

    db.query(query, [queryData], (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        res.send('delete drivers');
    });
};