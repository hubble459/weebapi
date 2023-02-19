import express from 'express';
import { getRepository, getManager } from 'typeorm';
import { scrapers } from '../../..';
import { Chapter } from '../../../database/entity/chapter';
import { Manga } from '../../../database/entity/manga';
import { needsRefresh, refreshManga } from '../util';
import images from './images';
import search from './search';

const router = express.Router();

router.get('/images', images);

router.get('/search', search);

router.get('/', async (req, res) => {
    const strUrl = req.query.url;
    if (strUrl && typeof strUrl === 'string') {
        const manga = await getRepository(Manga).findOne({ where: { url: strUrl } });
        if (manga) {
            res.redirect(301, `${process.env.API_V1}/manga/${manga.id}`);
        } else {
            try {
                const url = new URL(strUrl);
                const scrapedManga = await scrapers.scrape(url);
                const manga = await getRepository(Manga).save(scrapedManga);
                res.redirect(301, `${process.env.API_V1}/manga/${manga.id}`);
            } catch (e: any) {
                res.status(400).json({ message: e.message });
            }
        }
    } else {
        const offset: number = +(req.query.offset || 0);
        const limit: number = +(req.query.limit || 100);
        const manga = await getRepository(Manga).find({ take: limit, skip: offset });
        const total = await getRepository(Manga).count();
        res.json({
            manga,
            offset,
            limit,
            total,
        });
    }
});

/**
 * Replace an existing manga with another url
 */
router.patch('/:manga_id', async (req, res) => {
    const id = req.params.manga_id;
    if (/^\d+$/.test(id)) {
        let manga = await getRepository(Manga).findOne(+id);
        if (manga) {
            const url = req.body.url;
            if (typeof url !== 'string') {
                res.status(400).json({ message: 'Missing URL in body' });
            } else {
                let dbManga = await getRepository(Manga).findOne({ where: { url: url } });
                if (!!dbManga) {
                    res.status(409).json({
                        message: `Manga with url '${url}' already exists`,
                        conflict: `${process.env.API_V1}/manga/${dbManga.id}`,
                    });
                } else {
                    try {
                        const scraped = (await scrapers.scrape(new URL(url))) as Manga;
                        scraped.id = manga.id;
                        dbManga = await getRepository(Manga).save(scraped);
                        res.json(dbManga);
                    } catch (e: any) {
                        const statusCode = +(<string>e.message || '').split(/Status: /)[1] || 400;
                        res.status(statusCode).json({ message: e.message });
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
        const noRefresh = req.query.norefresh === 'true';
        const alternatives = req.query.alternatives === 'true';
        const manga_id = +id;
        let manga = await getRepository(Manga).findOne(manga_id); 
        // const raw = await getRepository(Manga)
        //     .createQueryBuilder()
        //     .addSelect('COUNT(chapter.url)', 'chapter_count')
        //     .leftJoin(Chapter, 'chapter', 'chapter.mangaId = Manga.id')
        //     .groupBy('chapter.mangaId')
        //     .where({id: manga_id})
        //     .getRawAndEntities();
        // let manga = raw.entities[0];


        if (manga) {
            // manga.chapter_count = +raw.raw[0].chapter_count;

            if (alternatives) {
                const alternatives = await scrapers.search(manga.title, scrapers.randomHostnames(5, [manga.hostname]));

                res.json({
                    title: manga.title,
                    alt_titles: manga.alt_titles,
                    hostname: manga.hostname,
                    alternatives: alternatives.filter((alt) => alt.hostname !== manga!.hostname),
                });
            } else {
                if (!noRefresh && needsRefresh(manga)) {
                    console.log('refreshing');

                    try {
                        manga = await refreshManga(manga);
                    } catch (e: any) {
                        return res.status(400).json({ message: e.message, url: manga.url });
                    }
                }

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

router.get('/:manga_id/chapters', async (req, res) => {
    const id = req.params.manga_id;
    if (/^\d+$/.test(id)) {
        const exists = await getRepository(Manga).findOne(+id);
        if (exists) {
            const offset = +(req.query.offset ?? '0') ?? 0;
            const limit = +(req.query.limit ?? '20') ?? 20;
            const desc = req.query.desc === 'true' || (!!req.query.asc && req.query.asc !== 'true');
            const chapters = await getRepository(Chapter).find({
                loadRelationIds: true,
                where: { manga: { id: +id } },
                take: limit,
                skip: offset,
                order: { number: desc ? 'ASC' : 'DESC' },
            });
            res.json(
                chapters.map((ch: Chapter) => {
                    return {
                        ...ch,
                        images: `${process.env.API_V1}/manga/images?url=${ch.url}`,
                    };
                })
            );
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
