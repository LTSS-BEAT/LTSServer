const db = require('../../db');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

module.exports = (req, res, next) => {
    console.log(req);
    const uid = parseInt(req.body.uid);
    const xlsxFile = xlsx.readFile(path.join('temp', req.file.originalname));
    const sheetName = xlsxFile.SheetNames[0];
    const worksheet = xlsxFile.Sheets[sheetName];

    function excelDateToJSDate(excelDate) {
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        const dateString = date.toISOString().split('T')[0];
        return dateString;
    }

    // Convert sheet to JSON and handle empty cells by filling them with empty strings
    const lists = xlsx.utils.sheet_to_json(worksheet, {
        raw: true, // 그대로 데이터를 읽음
        defval: '' // 빈 셀을 빈 문자열로 대체
    }).map(row => {
        // '작업일자' 컬럼이 숫자(엑셀 날짜 형식)인 경우 변환
        if (row['작업일자'] && typeof row['작업일자'] === 'number') {
            row['작업일자'] = excelDateToJSDate(row['작업일자']);
        }
        return row;
    });

    // 데이터가 완전한지 확인하고, 빈 값이 있으면 무시하거나 처리
    const queryData = lists.map(list => {
        if (list.상차지 && list.도착지 && list.작업일자) { // 중요한 필드가 비어있지 않은지 확인
            return [list.상차지, list.도착지, list.작업일자, uid];
        }
        return null; // 빈 데이터는 제외
    }).filter(item => item !== null); // null 값 제거

    if (queryData.length === 0) {
        return res.status(400).send('No valid data found.');
    }

    const query = 'INSERT INTO task (dep_name, dest_name, base_date, uid) VALUES ?';

    db.query(query, [queryData], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }
        res.send('Post lists success');
    });

    fs.unlink(path.join('temp', req.file.originalname), (err) => {
        if (err) {
            console.error('Failed to delete temp file:', err);
        }
    });
};
