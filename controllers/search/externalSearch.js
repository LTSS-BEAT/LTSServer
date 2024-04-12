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
        console.log('응답 데이터:', response.data);
        res.send(response.data);
    })

    .catch((error) => {
        console.error('에러 발생:', error);
        res.sendStatus(500);
    });


};

