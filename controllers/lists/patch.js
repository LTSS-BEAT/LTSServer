const db = require('../../db');

module.exports = (req, res, next) => {
    const queryData = req.body.lists.map((list) => [list.dep_name, list.dep_adress, list.dest_name, list.dest_adress, list.dep_time_min, list.dep_time_max, list.dest_time_min, list.dest_time_max, list.dep_lat, list.dep_lon, list.dest_lat, list.dest_lon, list.tid]); 
    const query = 'UPDATE task SET dep_name=?, dep_adress=?, dest_adress=?, dest_name=?, dep_time_min=?, dep_time_max=?, dest_time_min=?, dest_time_max=? ,dep_lat=?, dep_lon=?, dest_lat=?, dest_lon=?, WHERE tid=?'

    db.query(query, [queryData], (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        res.send('patch lists');
    });
};