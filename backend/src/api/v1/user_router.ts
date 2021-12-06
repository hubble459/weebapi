import express, { Handler, RequestHandler } from 'express';
import database from '../../database';
import User from '../../models/user';

const router = express.Router();

router.get('/', async (req, res) => {
    const offset: number = +(req.query.offset || 0);
    const limit: number = +(req.query.limit || 100);
    const users = await database.users.all(limit, offset);
    const total = await database.users.count();
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
            } else if (!!await database.users.find(username)) {
                res.status(409).json({
                    message: 'This username is already taken'
                });
            } else {
                res.status(201).json(await database.users.add(username, password));
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
            const token = await database.users.login(username, password);
            res.status(201).json({ token });
        } catch (e: any) {
            res.status(401).json({ message: e.message });
        }
    } else {
        res.status(400).json({ message: 'Missing username or password in body' });
    }
});

const auth: RequestHandler = async (req, res, next) => {
    const bearerToken = req.header('Authorization');
    if (!!bearerToken) {
        let token: string | undefined;
        if (!!(token = bearerToken.match(/Bearer (?<token>.*)/)?.groups?.token)) {
            try {
                const userPayload = database.users.verify(token) as User;
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

router.get('/me', auth, async (req, res) => {
    const user_id = req.body.user.id;
    const user = await database.users.get(user_id);
    res.json(user);
});

router.get('/me/reading', auth, async (req, res) => {
    const user_id = req.body.user.id;
    const user = (await database.users.get(user_id))!;
    res.json(user.reading);
});

router.delete('/me/reading/:manga_id', auth, async (req, res) => {
    const manga_id = +req.params.manga_id;
    if (!isNaN(manga_id)) {
        const user_id = req.body.user.id;
        const deleted = await database.reading.remove(user_id, manga_id);
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
        const manga = await database.reading.update(progress, user_id, manga_id);
        res.json(manga);
    } else {
        res.status(400).json({ message: 'Missing progress in body' });
    }
});

router.post('/me/reading', auth, async (req, res) => {
    const manga_id = req.body.manga_id;
    const progress = +req.body.progress || 0;
    if (typeof manga_id === 'number') {
        const user_id = req.body.user.id;
        try {
            const manga = await database.reading.add(user_id, manga_id, progress);
            res.status(201).json(manga);
        } catch (e) {
            res.status(404).json({ message: `Manga with id '${manga_id}' not found` });
        }
    } else {
        res.status(400).json({ message: 'Missing manga_id in body' });
    }
});

export default router;
