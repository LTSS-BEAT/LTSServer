const db = require('../../db');
const axios = require('axios');
require('dotenv').config();

module.exports = async (req, res, next) => {
    const uid = req.body.uid? req.body.uid : 1;
    const { name, carNumber, address, phoneNumber } = req.body;
    const {lon, lat} = await getCoordinates(address);
    const query = 'INSERT INTO driver (name, lpnum, contact, lon, lat, uid) VALUES (?, ?, ?, ?, ?, ?)';

    db.query(query, [name, carNumber, phoneNumber, lon, lat, uid], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error registering driver' });
        }
        res.json({ success: true, message: 'Driver registered successfully' });
    });
};

async function getCoordinates(address) {
    const params = {
        query: address,
    };

    const headers = {
        'Authorization': `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
        'Accept': 'application/json'
    };

    try {
        const response = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
            params: params,
            headers: headers
        });
        const lon = response.data.documents[0].x;
        const lat = response.data.documents[0].y;
        return { lon, lat };

    } catch (error) {
        console.error('에러 발생:', error);
        res.sendStatus(500);
    }
}