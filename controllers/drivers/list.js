const db = require('../../db');

module.exports = (req, res, next) => {
    const query = 'SELECT did, name, lpnum FROM driver';

    db.query(query, (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        res.send({drivers: result});
    });
};