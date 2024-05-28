require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const db = require('../../db');

module.exports = (req, res, next) => {
    const email = req.body.user.email;
    const password = req.body.user.pwd;

    const query = 'SELECT uid, pwd FROM user WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.sendStatus(500);
        }

        if (results.length === 0) {
            // 사용자가 존재하지 않을 때
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = results[0];

        // 비밀번호 비교
        const isMatch = await bcrypt.compare(password, user.pwd);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isSignout = signoutUsers.hasOwnProperty(user.uid);
        if (isSignout) {
            setTimeout(()=>{
                delete signoutUsers[user.uid];
            }, 60*1000*60*2);
        }
        
        const payload = {
            uid: user.uid,
        };
        const secretKey = process.env.JWT_KEY;
        const token = jwt.sign(payload, secretKey, { expiresIn: '2h' });

        res.send(token);
    });
};