require('dotenv').config();

const axios = require('axios');
const db = require('../../db');

module.exports = (req, res, next) => {
    const params = {
    query: req.query.keyword,
    };

    const headers = {
    'Authorization': `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
    'Accept': 'application/json'
    };

    axios.get('https://dapi.kakao.com/v2/local/search/keyword.JSON', {
        params: params,
        headers: headers
    })

    .then((response) => {
        const filtered = response.data.documents.map((data) => ({
            address: data.address_name,
            name: data.place_name,
            lon: data.x,
            lat: data.y
        }));
        res.send({data: filtered});
    })

    .catch((error) => {
        console.error('에러 발생:', error);
        res.sendStatus(500);
    });


};

