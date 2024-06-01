require('dotenv').config();
const jwt = require('jsonwebtoken');
const signoutUsers = global.signoutUsers;

module.exports = (req, res, next) => {
    const token = req.headers['authorization'];
    const secretKey = process.env.JWT_KEY;

    jwt.verify(token, secretKey, (err, data) => {
        if (err) {
            return res.sendStatus(403);
        }
        signoutUsers[users.uid] = token;
        res.sendStatus(200);
    });
};