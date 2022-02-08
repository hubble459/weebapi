import api_v1 from './api/v1';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createConnection } from 'typeorm';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/api/v1', api_v1);
app.use('/', express.static(path.join(__dirname, '../docs')));

createConnection().then(() => {
    console.log('Database connected!');
    app.listen(+process.env.PORT!, () => {
        console.log(`AWI listening on ${process.env.API}/`);
    });
});
