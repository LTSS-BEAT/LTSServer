module.exports = (req, res, next) => {
    res.send('account created');
};
const db = require('../../db');

module.exports = (req, res, next) => {
    const queryData = [req.body.user.email, req.body.user.pwd];

    const query = 'INSERT INTO user (email, pwd) VALUES (?, ?)';
    db.query(query, queryData, (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        res.send('account created');
    });
};