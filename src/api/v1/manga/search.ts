import { Request, Response } from 'express';
import { scrapers } from '../../..';

export default async (req: Request, res: Response) => {
    const query = req.query.query as string;
    if (!query || typeof query !== 'string') {
        res.status(400).json({ message: 'Missing search query' });
    } else {
        let hostnames: string[] = ((req.query.hostnames || req.query.hostname) as string[]) || [];
        if (typeof hostnames === 'string') {
            hostnames = (<string>hostnames).split(',');
        }
        try {
            const results = await scrapers.search(query, hostnames);
            res.json(
                results.map((m) => ({
                    ...m,
                    manga: `${process.env.API_V1}/manga?url=${m.url}`,
                    cover_proxy: m.cover
                        ? `${process.env.API_V1}/proxy?url=${m.cover}&referer=${m.url}`
                        : undefined,
                }))
            );
        } catch (e: any) {
            res.status(400).json({ message: e.message });
        }
    }
};
