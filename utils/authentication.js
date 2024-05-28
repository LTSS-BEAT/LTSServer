require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.headers['authorization'];
    const secretKey = process.env.JWT_KEY;

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, secretKey, (err, data) => {
        if (err) {
            return res.sendStatus(403);
        }

        const isSignout = signoutUsers.hasOwnProperty(data.uid);
        if (isSignout) {
            return res.sendStatus(403);
        }
        req.uid = data.uid;
        next();
    });
    
};
