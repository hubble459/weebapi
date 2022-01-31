import { Manga as DBManga } from '../database/entity/manga';
export default interface Manga extends Omit<DBManga, 'countChapters'> {
    // id: number;
    // url: string;
    // hostname: string;
    // title: string;
    // description: string;
    // cover?: string;
    // status: boolean;
    // alt_titles: string[];
    // authors: string[];
    // genres: string[];
    // chapters: Chapter[];
    // chapter_count: number;
    // updated: Date;
    // refreshed: Date;
}
