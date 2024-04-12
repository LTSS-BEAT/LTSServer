const db = require('../../db');

module.exports = (req, res, next) => {
    const queryData = req.body.drivers.map((driver) => [driver.name, driver.lpnum, driver.contact, driver.did]);
    const query = 'UPDATE driver SET name = ?, lpnum = ?, contact = ? WHERE did = ?';

    db.query(query, [queryData], (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        res.send('patch drivers');
    });
};