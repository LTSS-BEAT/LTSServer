const db = require('../../db');

module.exports = (req, res, next) => {
    const uid = 1;
    const queryData = req.body.drivers.map((driver) => [driver.name, driver.lpnum, driver.contact, uid]);
    const query = 'INSERT INTO driver (name, lpnum, contact, uid) VALUES ?';

    db.query(query, [queryData], (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        res.send('post drivers');
    });
};