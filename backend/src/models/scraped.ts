import Chapter from "./chapter";
import Manga from "./manga";

export type ScrapedManga = Omit<Manga, 'id' | 'chapters'> & {
    chapters: ScrapedChapter[];
}

export type ScrapedChapter = Omit<Chapter, 'manga_id'>