import jwt from 'jsonwebtoken';
import { getRepository } from 'typeorm';
import { User } from '../../database/entity/user';
import bcrypt from 'bcryptjs';
import { Manga } from '../../database/entity/manga';
import { scrapers } from '../..';
import { Chapter } from '../../database/entity/chapter';

const PRIVATE_JWT_KEY = 'mqPmLVUt@R%7u{E4';
const REFRESH_RATE = 15 * 60 * 1000; // 15 minutes in ms
// const REFRESH_RATE = 15 * 1000; // 15 seconds in ms

export function verify(token: string) {
    return jwt.verify(token, PRIVATE_JWT_KEY);
}

export function sign(user: Omit<User, 'password_hash'>) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
        },
        PRIVATE_JWT_KEY,
        { expiresIn: '7d' }
    );
}

export async function login(username: string, password: string) {
    const user = await getRepository(User).findOne({ where: { username: username } });
    if (!!user) {
        const passChecked = bcrypt.compareSync(password, user.password_hash);
        if (passChecked) {
            return { token: sign(user), user };
        }
    }
    throw new Error("Username and password don't match");
}

export async function register(username: string, password: string) {
    const password_hash = bcrypt.hashSync(password);
    return getRepository(User).save({ username: username, password_hash: password_hash, reading: [] });
}

export function needsRefresh(manga: Manga) {
    console.log(manga.refreshed.valueOf());

    return manga.refreshed.valueOf() + REFRESH_RATE < Date.now();
}

export async function refreshManga(manga: Manga) {
    const scraped = (await scrapers.scrape(new URL(manga.url))) as Manga;
    scraped.refreshed = new Date();
    // const chapters = scraped.chapters;
    scraped.id = manga.id;
    scraped.chapter_count = scraped.chapters.length;
    await getRepository(Manga).save(scraped);
    delete (<any>scraped).chapters;

    return scraped;
}
