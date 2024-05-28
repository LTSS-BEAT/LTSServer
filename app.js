require('dotenv').config();
const signoutUsers = {};

const express = require('express');
const route = require('./routes');

const app = express();
const port = process.env.PORT;

app.use(express.json());

app.use('/users', route.users);
app.use('/lists', route.lists);
app.use('/search', route.search);
app.use('/schedule', route.schedule);
app.use('/drivers', route.drivers);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 