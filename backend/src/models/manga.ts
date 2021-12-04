import Chapter from './chapter';

export default interface Manga {
    id: number;
    url: string;
    hostname: string;
    title: string;
    description: string;
    cover: string | null;
    status: boolean;
    updated: number;
    refreshed: number;
    alt_titles: string[];
    authors: string[];
    genres: string[];
    chapters: Chapter[];
}
