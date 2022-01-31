import Chapter from './chapter';
import Manga from './manga';

export type ScrapedManga = Omit<Manga, 'id' | 'chapters' | 'refreshed' | 'chapter_count'> & {
    chapters: ScrapedChapter[];
};

export type ScrapedChapter = Omit<Chapter, 'manga' | 'id'>;
