import database from '../';
import Chapter from '../../models/chapter';
import { ScrapedChapter } from '../../models/scraped';
import DBExtension from '../database_extension';

declare module '../' {
    interface Database {
        chapters: ChaptersDB;
    }
}

class ChaptersDB extends DBExtension {
    readonly table_name = 'chapters';
    override readonly priority = 1;
    readonly create_statement =
        'CREATE TABLE IF NOT EXISTS chapters (manga_id INT NOT NULL, url VARCHAR(255) UNIQUE NOT NULL, hostname TEXT NOT NULL, title TEXT NOT NULL, number INT NOT NULL, posted BIGINT, FOREIGN KEY(manga_id) REFERENCES manga(id) ON DELETE CASCADE)';

    async all(): Promise<never> {
        throw new Error("Can't get all chapters");
    }

    async update(): Promise<never> {
        throw new Error("Can't update chapters");
    }

    async get(manga_id: number) {
        const dbChapters = await database.all<Chapter>('SELECT * FROM chapters WHERE manga_id = ?', [manga_id]);
        return dbChapters;
    }

    async add(manga_id: number, chapters: ScrapedChapter[]) {
        const dbChapters: Chapter[] = chapters.map((ch) => ({
            ...ch,
            manga_id,
        }));
        const promises = [];
        for (const chapter of dbChapters) {
            const prom = database.run(
                'INSERT INTO chapters VALUES (:manga_id, :url, :hostname, :title, :number, :posted)',
                chapter as any
            );
            promises.push(prom);
        }
        await Promise.all(promises);
        return dbChapters;
    }

    async remove(manga_id: number) {
        await database.run('DELETE FROM chapters WHERE manga_id = ?', [manga_id]);
        return true;
    }

    async replace(manga_id: number, chapters: ScrapedChapter[]) {
        await this.remove(manga_id);
        return this.add(manga_id, chapters);
    }
}

export default ChaptersDB;
