import { database } from "../..";
import DBManga from "../../models/database/db_manga";
import DBMangaReading from "../../models/database/db_manga_reading";
import Manga from "../../models/manga";
import MangaReading from "../../models/manga_reading";
import { ScrapedManga } from "../../models/scraped";
const SPLITTER = '$}|{$';

export function getPort() {
    return process.env.PORT || 3000;
}

export function getHostname() {
    return process.env.HOSTNAME || '192.168.2.27';
}

export function getURL() {
    return `http://${getHostname()}:${getPort()}`;
}

export const noProxyHostnames = Object.freeze([
    '1stkissmanga.io',
    '1stkissmanga.com',
])

export function mangaProxies(...manga: Manga[]) {
    return manga.map((m) => {
        const cover_proxy = m.cover
            ? noProxyHostnames.includes(new URL(m.cover).hostname)
            ? m.cover
                : `${getURL()}/api/v1/proxy?url=${m.cover}&referer=${m.url}`
                : undefined;
        return {
            ...m,
            cover_proxy
        }
    });
}

export async function dbMangaToManga(dbManga: DBManga | DBMangaReading): Promise<Manga> {
    return {
        ...dbManga,
        status: Boolean(dbManga.status),
        alt_titles: dbManga.alt_titles.split(SPLITTER),
        authors: dbManga.authors.split(SPLITTER),
        genres: dbManga.genres.split(SPLITTER),
        chapters: await database.chapters.get(dbManga.id)
    };
}

export async function dbMangaToMangaReading(dbManga: DBMangaReading): Promise<MangaReading> {
    return dbMangaToManga(dbManga) as any as MangaReading;
}

export function mangaToDbManga(manga: ScrapedManga | Manga) {
    return {
        url: manga.url,
        hostname: manga.hostname,
        title: manga.title,
        description: manga.description,
        cover: manga.cover || null,
        status: +manga.status,
        updated: manga.updated,
        alt_titles: manga.alt_titles.join(SPLITTER),
        authors: manga.authors.join(SPLITTER),
        genres: manga.genres.join(SPLITTER),
        chapters: manga.chapters.length,
        refreshed: Date.now(),
    } as DBManga;
}