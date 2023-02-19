import express, { Router } from 'express';
import mangaRouter from './manga';
import userRouter from './user';
import proxyRouter from './proxy_router';
import { networkInterfaces } from 'os';

process.env.PORT = process.env.PORT || '3000';

const nets = networkInterfaces();
let address: string = '127.0.0.1';

for (const name in nets) {
    for (const net of nets[name]!) {
        if (net.family === 'IPv4' && !net.internal && net.address.startsWith('192')) {
            address = net.address;
            break;
        }
    }
    if (address !== '127.0.0.1') {
        break
    }
}

process.env.API = `http://${address}:${process.env.PORT}`;
process.env.API_V1 = `${process.env.API}/api/v1`;

const router = Router();
router.use('/manga', mangaRouter);
router.use('/user', userRouter);
router.use('/proxy', proxyRouter);
// SwaggerIO page

export default router;
