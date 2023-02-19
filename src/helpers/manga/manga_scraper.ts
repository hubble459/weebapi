import Manga from '../../models/manga';
import { ScrapedManga } from '../../models/scraped';
import SearchManga from '../../models/search_manga';

export default interface MangaScraper {
    readonly hostnames: string[];
    handles(hostname: string): boolean;
    scrape(url: URL): Promise<ScrapedManga>;
    images(url: URL): Promise<string[]>;
    search?(query: string, hostnames?: string[]): Promise<SearchManga[]>;
}
