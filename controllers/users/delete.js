module.exports = (req, res, next) => {
};

module.exports = (req, res, next) => {
    res.send('account created');
};
const db = require('../../db');

module.exports = (req, res, next) => {
    const queryData = [req.body.user.email, req.body.user.pwd];
    
    const query = 'DELETE FROM user WHERE email = ? AND pwd = ?';
    db.query(query, [queryData], (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        res.send('account deleted');
    });
};