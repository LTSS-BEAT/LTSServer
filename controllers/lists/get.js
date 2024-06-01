const db = require('../../db');

module.exports = (req, res, next) => {
    const date = req.query.date;

    if (!date) {
        return res.status(400).send({ error: 'Date query parameter is required' });
    }

    const query = 'SELECT * FROM task WHERE base_date = ?';
    const queryParams = [date];

    db.query(query, queryParams, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ error: 'Database query error' });
        }
        console.log(result);
        res.send({ list: result });
    });
};
