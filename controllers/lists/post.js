const db = require('../../db');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

module.exports = (req, res, next) => {
    const uid = 1;

    const xlsxfile = xlsx.readFile(path.join('temp', req.file.originalname));
    const lists = xlsx.utils.sheet_to_json(xlsxfile.Sheets[xlsxfile.SheetNames[0]]);
    
    const queryData = lists.map((list) => [list.상차지, list.도착지, uid]);
    const query = 'INSERT INTO task (dep, dest, uid) VALUES ?';

    db.query(query, [queryData], (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(result);
        res.send('post lists');
    });

    fs.unlink(path.join('temp', req.file.originalname), (err) => {
        if (err) {
            console.error(err);
            return;
        }
    });
};