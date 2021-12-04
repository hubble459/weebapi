import apiv1 from './api/v1';
import express from 'express';
import cors from 'cors';
import database from './database';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/api/v1', apiv1);

const port = process.env.PORT || 3000;
process.env.PORT = String(port);

database.onDone(() => {
    app.listen(port, () => {
        console.log(`AWI listening on http://localhost:${port}`);
    });
});
