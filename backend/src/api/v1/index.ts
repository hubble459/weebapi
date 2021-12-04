import express from 'express';
import pluginRouter from './plugin_router';
import searchRouter from './search_router';
import mangaRouter from './manga_router';
import userRouter from './user_router';
import animeRouter from './anime_router';
import proxyRouter from './proxy_router';

const router = express.Router();

// router.use('/plugin', pluginRouter);
router.use('/search', searchRouter);
router.use('/manga', mangaRouter);
router.use('/user', userRouter);
// router.use('/anime', animeRouter);
router.use('/proxy', proxyRouter);
router.get('/', (_res, req) => {
    req.json({
        endpoints: [
            // '/plugin',
            '/search',
            '/manga',
            '/user',
            // '/anime',
            '/proxy',
        ],
    });
});

export default router;
