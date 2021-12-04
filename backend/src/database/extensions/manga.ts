import database from '../';
import { dbMangaToManga, mangaToDbManga } from '../../api/v1/util';
import DBManga from '../../models/database/db_manga';
import Manga from '../../models/manga';
import { ScrapedManga } from '../../models/scraped';
import DBExtension from '../database_extension';

declare module '../' {
    interface Database {
        manga: MangaDB;
    }
}

class MangaDB extends DBExtension<Manga> {
    readonly table_name: string = 'manga';
    override readonly priority = 0;
    readonly create_statement: string =
        'CREATE TABLE IF NOT EXISTS manga (id INT PRIMARY KEY AUTO_INCREMENT, url VARCHAR(255) UNIQUE NOT NULL, hostname TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, cover TEXT, status BOOLEAN NOT NULL, updated BIGINT NOT NULL, alt_titles TEXT NOT NULL, authors TEXT NOT NULL, genres TEXT NOT NULL, chapters INT NOT NULL, refreshed BIGINT NOT NULL)';

    async all(limit: number = 30, offset: number = 0) {
        const manga = await database.all<DBManga>('SELECT * FROM manga LIMIT ? OFFSET ?', [limit, offset]);
        return await Promise.all(manga.map(dbMangaToManga));
    }

    async get(id: number) {
        const manga = await database.get<DBManga>('SELECT * FROM manga WHERE id = ?', [id]);
        return manga ? dbMangaToManga(manga) : undefined;
    }

    async find(url: string) {
        const manga = await database.get<DBManga>('SELECT * FROM manga WHERE url = ?', [url]);
        return manga ? dbMangaToManga(manga) : undefined;
    }

    async update(manga: ScrapedManga, id: number) {
        const dbManga: DBManga = { ...mangaToDbManga(manga), id };
        await database.run(
            'UPDATE manga SET url = :url, hostname = :hostname, title = :title, description = :description, cover = :cover, status = :status, updated = :updated, alt_titles = :alt_titles, authors = :authors, genres = :genres, chapters = :chapters, refreshed = :refreshed WHERE id = :id',
            dbManga as any
        );
        await database.chapters.replace(id, manga.chapters);
        return dbMangaToManga(dbManga);
    }

    async add(manga: ScrapedManga) {
        const dbManga = mangaToDbManga(manga);

        const runResult = await database.run(
            'INSERT INTO manga (url, hostname, title, description, cover, status, updated, alt_titles, authors, genres, chapters, refreshed) VALUES (:url, :hostname, :title, :description, :cover, :status, :updated, :alt_titles, :authors, :genres, :chapters, :refreshed)',
            dbManga as any
        );
        dbManga.id = runResult.insertId;
        await database.chapters.add(dbManga.id, manga.chapters);
        return dbMangaToManga(dbManga);
    }

    async remove(id: number) {
        return (await database.run('DELETE FROM manga WHERE id = ?', [id])).affectedRows === 1;
    }
}

export default MangaDB;
