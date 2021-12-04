export default interface DBMangaReading {
    id: number;
    url: string;
    hostname: string;
    title: string;
    description: string;
    cover: string | null;
    status: number;
    updated: number;
    alt_titles: string;
    authors: string;
    genres: string;
    chapters: number;
    refreshed: number;
    progress: number;
}