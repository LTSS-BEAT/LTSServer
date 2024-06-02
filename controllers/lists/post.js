const db = require('../../db');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

module.exports = (req, res, next) => {
    const uid = parseInt(req.body.uid);
    const xlsxFile = xlsx.readFile(path.join('temp', req.file.originalname));
    const sheetName = xlsxFile.SheetNames[0];
    const worksheet = xlsxFile.Sheets[sheetName];

    function excelDateToJSDate(excelDate) {
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        const dateString = date.toISOString().split('T')[0];
        return dateString;
    }

    // Convert sheet to JSON and transform date fields
    const lists = xlsx.utils.sheet_to_json(worksheet, { raw: true }).map(row => {
        if (row['작업일자'] && typeof row['작업일자'] === 'number') {
            row['작업일자'] = excelDateToJSDate(row['작업일자']);
        }
        return row;
    });

    
    const queryData = lists.map((list) => [list.상차지, list.도착지, list.작업일자, uid]);
    const query = 'INSERT INTO task (dep_name, dest_name, base_date, uid) VALUES ?';

    db.query(query, [queryData], (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        res.send('post lists');
    });

    fs.unlink(path.join('temp', req.file.originalname), (err) => {
        if (err) {
            console.error(err);
            return;
        }
    });
};