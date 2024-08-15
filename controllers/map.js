require('dotenv').config();

const axios = require('axios');

module.exports = async (req, res, next) => {
    const result = [];

    // JSON 형식의 쿼리 데이터를 배열로 파싱
    const queryData = JSON.parse(req.query.cords);

    for (const data of queryData) {
        const cords = {};
        const viaPoints = [];

        for (let i = 0; i < data.length; i++) {
            if (i === 0) {
                cords['dep_lon'] = data[i][0];
                cords['dep_lat'] = data[i][1];
            } else if (i === data.length - 1) {
                cords['dest_lon'] = data[i][0];
                cords['dest_lat'] = data[i][1];
            } else {
                viaPoints.push([data[i][0], data[i][1]]);
            }
        }

        const mapData = await getMapData(
            cords.dep_lon,
            cords.dep_lat,
            cords.dest_lon,
            cords.dest_lat,
            viaPoints
        );
        result.push(mapData);
    }

    res.json(result);
};

async function getMapData(dep_lon, dep_lat, dest_lon, dest_lat, viaPoints) {
    try {
        const params = {
            origin: `${dep_lon},${dep_lat}`,
            destination: `${dest_lon},${dest_lat}`,
        };

        if (viaPoints && viaPoints.length > 0) {
            const maxViaPoints = viaPoints.slice(0, 5);
            const waypointsString = maxViaPoints
                .map(via => `${via[0]},${via[1]}`)
                .join('|');
            params['waypoints'] = waypointsString;
        }

        const headers = {
            'Authorization': `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
            'Content-Type': 'application/json',
        };

        const response = await axios.get('https://apis-navi.kakaomobility.com/v1/directions', {
            params: params,
            headers: headers,
        });

        const guides = response.data.routes[0].sections[0].guides;
        const result = guides.map(guide => [guide.y, guide.x]);

        return result;

    } catch (error) {
        console.error(error);
        return null;
    }
}
