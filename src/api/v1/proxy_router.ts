import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

router.get('/', async (req, res) => {
    const url = req.query.url;
    const referer = (req.query.referer || req.query.referrer) as string;
    if (url && typeof url === 'string') {
        const response = await fetch(url, {
            headers: {
                Referer: referer,
            },
        });
        response.body!.pipe(res);
    }
});

export default router;
