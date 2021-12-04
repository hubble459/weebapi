import express from 'express';
import { scraper } from '../..';

const router = express.Router();

router.get('/manga', async (req, res) => {
    const query = req.query.query as string;
    if (!query || typeof query !== 'string') {
        res.status(400).json({ message: 'Missing search query' });
    } else {
        let hostnames: string[] = ((req.query.hostnames || req.query.hostname) as string[]) || [];
        if (typeof hostnames === 'string') {
            hostnames = (<string>hostnames).split(',');
        }
        const results = await scraper.search(query, hostnames);

        res.json(
            results.map((m) => ({
                ...m,
                manga: `http://localhost:${process.env.PORT || 8080}/manga?url=${m.url}`,
                cover_proxy: m.cover
                    ? `http://localhost:${process.env.PORT || 8080}/api/v1/proxy?url=${m.cover}&referer=${m.url}`
                    : undefined,
            }))
        );
    }
});

export default router;
