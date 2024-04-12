const { correctByDistance } = require("hangul-util");
const db = require('../../db');

module.exports = (req, res, next) => {
    const query = 'SELECT * FROM place';
    db.query(query, (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        const names = result.map((data) => data.name);
        const option = { distance: 2, maxSlice: 2, isSplit: true };
        const place = correctByDistance(req.query.keyword, names, option);

        if(!place.length) {
            res.send({place});
            return;
        }

        const query = 'SELECT * FROM place WHERE name=?';
        db.query(query, place[0], (err, result) => {
            if (err) {
                console.error(err);
                res.sendStatus(500);
                return;
            }
            res.send({place: result});
        });
    });
};
