import express from 'express';
import database from '../../database';
import { scraper } from '../..';
import Chapter from '../../models/chapter';
import { getURL } from './util';

const refreshRate = 15 * 60 * 1000; // 15 minutes in ms

const router = express.Router();

router.get('/', async (req, res) => {
    const strUrl = req.query.url;
    if (strUrl && typeof strUrl === 'string') {
        let manga = await database.manga.find(strUrl);
        if (manga) {
            res.redirect(301, `/api/v1/manga/${manga.id}`);
        } else {
            try {
                const url = new URL(strUrl);
                const scrapedManga = await scraper.scrape(url);
                manga = await database.manga.add(scrapedManga);
                res.redirect(301, `/api/v1/manga/${manga.id}`);
            } catch (e: any) {
                res.status(400).json({ message: e.message });
            }
        }
    } else {
        res.status(400).json({ message: 'Missing URL in query' });
    }
});

router.get('/images', async (req, res) => {
    const strUrl = req.query.url;
    if (strUrl && typeof strUrl === 'string') {
        let url: URL;
        try {
            url = new URL(strUrl);
        } catch (e) {
            return res.status(400);
        }
        const urls = await scraper.images(url);
        const referer = `${url.protocol}//${url.hostname}`;
        res.json(
            urls.map((u) => ({
                url: u,
                referer,
                proxy: `http://localhost:${process.env.PORT || 8080}/api/v1/proxy?url=${u}&referer=${referer}`,
                proxy2: `https://cdn.noxtruyen.net/image?url=${u}&referer=${referer}`,
            }))
        );
    } else {
        res.status(400).json({ message: 'Missing URL in query' });
    }
});

router.patch('/:manga_id', async (req, res) => {
    const id = req.params.manga_id;
    if (/^\d+$/.test(id)) {
        const manga_id = +id;
        let manga = await database.manga.get(manga_id);
        if (manga) {
            const url = req.body.url;
            if (typeof url !== 'string') {
                res.status(400).json({ message: 'Missing URL in body' });
            } else {
                let dbManga = await database.manga.find(url);
                if (!!dbManga) {
                    res.status(409).json({
                        message: `Manga with url '${url}' already exists`,
                        conflict: `/api/v1/manga/${dbManga.id}`,
                    });
                } else {
                    try {
                        const scraped = await scraper.scrape(new URL(url));
                        dbManga = await database.manga.update(scraped, manga.id);
                        res.json(dbManga);
                    } catch (e: any) {
                        res.status(400).json({ message: e.message });
                    }
                }
            }
        } else {
            res.status(404).json({
                message: 'Manga with this ID could not be found',
            });
        }
    } else {
        res.status(400).json({ message: 'Manga ID should be a number' });
    }
});

router.get('/:manga_id', async (req, res) => {
    const id = req.params.manga_id;
    if (/^\d+$/.test(id)) {
        const noRefresh = !!req.query.norefresh && req.query.norefresh !== 'false';
        const alternatives = !!req.query.alternatives && req.query.alternatives !== 'false';
        const manga_id = +id;
        let manga = await database.manga.get(manga_id);
        if (manga) {
            if (alternatives) {
                const alternatives = await scraper.search(manga.title, scraper.randomHostnames(5, [manga.hostname]));

                res.json({
                    title: manga.title,
                    alt_titles: manga.alt_titles,
                    hostname: manga.hostname,
                    alternatives: alternatives.filter((alt) => alt.hostname !== manga!.hostname),
                });
            } else {
                if (!noRefresh && manga.refreshed + refreshRate < Date.now()) {
                    try {
                        const url = new URL(manga.url);
                        const scraped = await scraper.scrape(url);
                        manga = await database.manga.update(scraped, manga.id);
                    } catch (e: any) {
                        return res.status(400).json({ message: e.message, url: manga.url });
                    }
                }
                // const chapters = await database.chapters.get(manga.id);
                manga.chapters = manga.chapters.map((ch: Chapter) => {
                    return {
                        ...ch,
                        images: `${getURL()}/api/v1/manga/images?url=${ch.url}`,
                    };
                });
                res.json(manga);
            }
        } else {
            res.status(404).json({
                message: 'Manga with this ID could not be found',
            });
        }
    } else {
        res.status(400).json({ message: 'Manga ID should be a number' });
    }
});

export default router;
