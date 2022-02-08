import { Request, Response } from 'express';
import { scrapers } from '../../..';

export default async (req: Request, res: Response) => {
    const strUrl = req.query.url;
    if (strUrl && typeof strUrl === 'string') {
        let url: URL;
        try {
            url = new URL(strUrl);
        } catch (e) {
            return res.status(400);
        }
        const urls = await scrapers.images(url);
        const referer = `${url.protocol}//${url.hostname}`;
        res.json(
            urls.map((u) => ({
                url: u,
                referer,
                proxy: `${process.env.API_V1}/proxy?url=${u}&referer=${referer}`,
                proxy2: `https://cdn.noxtruyen.net/image?url=${u}&referer=${referer}`,
            }))
        );
    } else {
        res.status(400).json({ message: 'Missing URL in query' });
    }
};
