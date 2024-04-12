const db = require('../../db');

module.exports = (req, res, next) => {
    const queryData = req.body.lists.map((list) => [list.tid]);
    const query = 'DELETE FROM task WHERE tid = ?'

    db.query(query, [queryData], (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        res.send('delete lists');
    });
};