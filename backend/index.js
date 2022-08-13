const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

const db = require('./queries');

app.use(bodyParser.json());
app.use(cors({
    origin: 'https://rateyourmusic.com'
}));

app.get('/release/:id', db.getRatingByRelease);
app.get('/releases/:id', db.getRatingsByReleases);
app.post('/release/:id', db.setRatingByRelease);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});
