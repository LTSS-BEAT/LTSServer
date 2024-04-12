const db = require('../../db');

module.exports = (req, res, next) => {
    const query = 'SELECT * FROM task';

    db.query(query, (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(result);
        res.send({list: result});
    });
};