const dotenv = require('dotenv');
dotenv.config();

const Pool = require('pg').Pool;
const pool = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

const getRatingByRelease = (request, response) => {
    const id = parseInt(request.params.id);

    pool.query('SELECT * FROM ratings WHERE release_id = $1', [id], (error, results) => {
        if (error) {
            throw error;
        }

        let res;

        if (results.rows[0]) {
            res = results.rows[0];
        } else {
            res = {avg_rating: 0, rating_count: 0};
        }

        response.status(200).json(res);
    });
};

const setRatingByRelease = (request, response) => {
    const id = parseInt(request.params.id);
    const {trueRating, ratingCount} = request.body;

    pool.query('SELECT * FROM ratings WHERE release_id = $1', [id], (error, results) => {
        if (error) {
            throw error;
        }

        if (results.rows[0]) {
            pool.query(`UPDATE ratings SET avg_rating = $1, rating_count = $2 WHERE release_id = $3`, [trueRating, ratingCount, id], (error) => {
                if (error) {
                    throw error;
                }
            });
        } else {
            pool.query(`INSERT INTO ratings (release_id, avg_rating, rating_count) VALUES  ($1, $2, $3)`, [id, trueRating, ratingCount], (error) => {
                if (error) {
                    throw error;
                }
            });
        }

        response.status(200).json(`Updated entry with id: ${id}`);
    });
};

module.exports = {
    getRatingByRelease,
    setRatingByRelease
};
