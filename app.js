require('dotenv').config();
global.signoutUsers = {};

const express = require('express');
const path = require('path');
const route = require('./routes');

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/drivers', route.drivers);
app.use('/lists', route.lists);
app.use('/login', route.login);
app.use('/password', route.password);
app.use('/register', route.register);
app.use('/registerTruckers', route.registerTruckers);
app.use('/schedule', route.schedule);
app.use('/schedules', route.schedules);
app.use('/search', route.search);
app.use('/truckers', route.truckers);
app.use('/upload', route.upload);
app.use('/users', route.users);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 