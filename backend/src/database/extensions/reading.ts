import database from '../';
import { dbMangaToManga, dbMangaToMangaReading } from '../../api/v1/util';
import DBMangaReading from '../../models/database/db_manga_reading';
import MangaReading from '../../models/manga_reading';
import DBExtension from '../database_extension';
import MangaDB from './manga';

declare module '../' {
    interface Database {
        reading: ReadingDB;
    }
}

class ReadingDB extends DBExtension {
    readonly table_name = 'reading';
    readonly create_statement = 'CREATE TABLE IF NOT EXISTS reading (id INT PRIMARY KEY AUTO_INCREMENT, user_id INT, manga_id INT UNIQUE, progress INT, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE)';

    async all(): Promise<MangaReading[]> {
        return database.all<MangaReading>('SELECT * FROM reading');
    }
    async add(user_id: number, manga_id: number, progress: number = 0): Promise<MangaReading> {
        await database.run(
            'INSERT INTO reading (user_id, manga_id, progress) VALUES (?, ?, ?)',
            [user_id, manga_id, progress]
        );
        const manga = (await database.manga.get(manga_id))!;
        return {
            ...manga,
            progress
        }
    }
    async update(progress: number, user_id: number, manga_id: number): Promise<MangaReading> {
        await database.run(
            'UPDATE reading SET progress = ? WHERE user_id = ? AND manga_id = ?', [progress, user_id, manga_id]
        );
        const manga = (await database.manga.get(manga_id))!;
        return {
            ...manga,
            progress
        }
    }
    async get(user_id: number, fullReading: boolean = true): Promise<MangaReading[] | undefined> {
        const mangaReading = await database.all<DBMangaReading>(
            'SELECT * FROM reading INNER JOIN manga ON reading.manga_id = manga.id WHERE user_id = ?',
            [user_id]    
        );
        return Promise.all(mangaReading.map(dbMangaToMangaReading));
    }
    async remove(user_id: number, manga_id: number): Promise<boolean> {
        return (await database.run('DELETE FROM reading WHERE user_id = ? AND manga_id = ?', [user_id, manga_id])).affectedRows === 1;
    }
}

export default ReadingDB;
