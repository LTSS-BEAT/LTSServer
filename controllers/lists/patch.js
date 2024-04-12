const db = require('../../db');

module.exports = (req, res, next) => {
    const queryData = req.body.lists.map((list) => [list.dep, list.dest, list.dep_adress, list.dest_adress, list.dep_time_min, list.dep_time_max, list.dest_time_min, list.dest_time_max, list.tid]);
    const query = 'UPDATE task SET dep=?, dest=?, dep_adress=?, dest_adress=?, dep_time_min=?, dep_time_max=?, dest_time_min=?, dest_time_max=? WHERE tid=?'

    db.query(query, [queryData], (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        res.send('patch lists');
    });
};