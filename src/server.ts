import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import usersRouter from './routes/usersRouter';
import otpRouter from './routes/otpRouter';
import pool from './database/database';
import bodyParser from 'body-parser';

dotenv.config();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure logging middleware
app.use(morgan('dev'));

app.get('/', async (req, res) => {
    const client = await pool.connect();
    const result = await client.query('SELECT $1::text as message', ['Hello World!']);
    const message = result.rows[0].message;
    res.send(message);
    client.release();
});

app.use('/user', usersRouter);
app.use('/otp', otpRouter);

const port = parseInt(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
    console.log(`Server is listening on port ${port}`);
});
