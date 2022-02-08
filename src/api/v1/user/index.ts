import express, { RequestHandler } from 'express';
import { getRepository } from 'typeorm';
import { Reading } from '../../../database/entity/reading';
import { User } from '../../../database/entity/user';
import { login, needsRefresh, refreshManga, register, sign, verify } from '../util';
import randtoken from 'rand-token';
import { Chapter } from '../../../database/entity/chapter';

const router = express.Router();

router.get('/', async (req, res) => {
    const offset: number = +(req.query.offset || 0);
    const limit: number = +(req.query.limit || 100);
    const users = await getRepository(User).find({ skip: offset, take: limit });
    const total = await getRepository(User).count();
    res.json({
        users,
        offset,
        limit,
        total,
    });
});

/**
 * Register
 */
router.post('/', async (req, res) => {
    const username = req.body?.username;
    const password = req.body?.password;
    if (!!username && !!password) {
        if (typeof username === 'string' && typeof password === 'string') {
            if (username.length < 3) {
                res.status(400).json({ message: 'Username should be longer than 2 characters' });
            } else if (password.length < 8) {
                res.status(400).json({ message: 'Password should be longer than 7 characters' });
            } else if (!/\W/g.test(password) || !/\d/g.test(password)) {
                res.status(400).json({
                    message: 'Password should contain at least one special character and a number',
                });
            } else if (!!(await getRepository(User).findOne({ where: { username } }))) {
                res.status(409).json({
                    message: 'This username is already taken',
                });
            } else {
                res.status(201).json(await register(username, password));
            }
        } else {
            res.status(400).json({ message: 'Username and password should be of type string' });
        }
    } else {
        res.status(400).json({ message: 'Missing either username or password in body' });
    }
});

/**
 * Login
 */
router.post('/login', async (req, res) => {
    const username = req.body?.username;
    const password = req.body?.password;
    if (!!password && typeof password === 'string' && !!username && typeof username === 'string') {
        try {
            const { token, user } = await login(username, password);
            const refreshToken = randtoken.uid(256);
            refreshTokens[refreshToken] = user;
            res.status(201).json({ token, refreshToken });
        } catch (e: any) {
            res.status(401).json({ message: e.message });
        }
    } else {
        res.status(400).json({ message: 'Missing username or password in body' });
    }
});

const refreshTokens: { [key: string]: User } = {};
/**
 * Refresh Token
 */
router.post('/token', async (req, res) => {
    const refreshToken = req.body.token;
    const username = req.body.username;
    if (!!username && !!refreshToken) {
        const user = refreshTokens[refreshToken];
        if (!!user) {
            if (user.username === username) {
                const token = sign(user);
                res.json({ token });
            } else {
                res.status(401).json({ message: 'Bad username' });
            }
        } else {
            res.status(401).json({ message: 'Bad refresh token' });
        }
    } else {
        res.status(400).json({ message: 'Missing token and/ or username' });
    }
});

const auth: RequestHandler = async (req, res, next) => {
    const bearerToken = req.header('Authorization');
    if (!!bearerToken) {
        let token: string | undefined;
        if (!!(token = bearerToken.match(/Bearer (?<token>.*)/)?.groups?.token)) {
            try {
                const userPayload = verify(token) as User;
                if (typeof userPayload === 'object') {
                    req.body.user = userPayload;
                    next();
                } else {
                    res.status(500).json({ message: 'Internal server error' });
                }
            } catch (e: any) {
                res.status(401).json({ message: e.message || 'Failed to verify token' });
            }
        } else {
            res.status(401).json({ message: 'Authorization should be a bearer token' });
        }
    } else {
        res.status(401).json({ message: 'Missing Authorization in headers' });
    }
};

router.get('/check', auth, async (_, res) => {
    res.json({ message: 'Token is valid' });
});

router.get('/me', auth, async (req, res) => {
    const user_id = req.body.user.id;
    const user = await getRepository(User).findOne(user_id);
    res.json(user);
});

router.get('/me/reading', auth, async (req, res) => {
    const user_id = req.body.user.id;
    const reading = (await getRepository(Reading).find({
        where: { user: { id: user_id } },
    }))!;

    res.json(reading);
});

router.get('/me/reading/:manga_id', auth, async (req, res) => {
    const manga_id = +req.params.manga_id;
    if (!isNaN(manga_id)) {
        const user_id = req.body.user.id;
        const reading = await getRepository(Reading).findOne({ user: { id: user_id }, manga: {id: manga_id} });
        if (!!reading) {
            if (needsRefresh(reading.manga)) {
                reading.manga = await refreshManga(reading.manga);
            }
            res.json(reading);
        } else {
            res.status(404).json({ message: `Not reading a manga with id '${manga_id}'` });
        }
    } else {
        res.status(400).json({ message: 'Missing manga_id in body' });
    }
});

router.delete('/me/reading/:manga_id', auth, async (req, res) => {
    const manga_id = +req.params.manga_id;
    if (!isNaN(manga_id)) {
        const user_id = req.body.user.id;
        const deleted = await getRepository(Reading).delete({ manga: { id: manga_id }, user: { id: user_id } });
        res.json({ deleted });
    } else {
        res.status(400).json({ message: 'Missing manga_id in body' });
    }
});

router.patch('/me/reading/:manga_id', auth, async (req, res) => {
    const manga_id = +req.params.manga_id;
    const progress = +req.body.progress;
    if (!isNaN(manga_id) && !isNaN(progress)) {
        const user_id = req.body.user.id;
        try {
            const manga = await getRepository(Reading).update(
                { user: { id: user_id }, manga: { id: manga_id } },
                {
                    progress,
                }
            );
            res.json(manga);
        } catch (e) {
            res.status(400).json({ message: `manga with id '${manga_id}' not in reading list` });
        }
    } else {
        res.status(400).json({ message: 'Missing progress in body' });
    }
});

router.post('/me/reading', auth, async (req, res) => {
    const manga_id = req.body.manga_id;
    const progress = +req.body.progress || 0;
    if (typeof manga_id === 'number') {
        console.log(req.body.user);

        const user_id = req.body.user.id;
        const exists =
            (await getRepository(Reading).findOne({
                where: { manga: { id: manga_id }, user: { id: user_id } },
            })) !== undefined;
        if (!exists) {
            try {
                const manga = await getRepository(Reading).insert({
                    progress: progress,
                    manga: { id: manga_id },
                    user: { id: user_id },
                });
                res.status(201).json(manga);
            } catch (e: any) {
                console.error(e);

                res.status(404).json({ message: `Manga with id '${manga_id}' not found`, error: e.message });
            }
        } else {
            res.status(409).json({ message: 'You are already reading this manga!' });
        }
    } else {
        res.status(400).json({ message: 'Missing manga_id in body' });
    }
});

export default router;
