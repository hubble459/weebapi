import MangaScraper from './helpers/manga/manga_scraper';
import SearchManga from './models/search_manga';
import glob from 'glob';
import path from 'path';

export class Scrapers implements MangaScraper {
    hostnames: string[] = [];
    readonly plugins: MangaScraper[] = [];

    constructor() {
        const devMode = !!process.env.TS_NODE_DEV;
        const files = glob.sync(`**/*.${devMode ? 't' : 'j'}s`, { cwd: path.join(__dirname, 'plugins'), absolute: true });

        for (const filepath of files) {
            let plugin = require(filepath);
            if (plugin.default) {
                plugin = plugin.default;
            }
            if (typeof plugin === 'function') {
                plugin = new plugin();
            }
            if (typeof plugin === 'undefined' || typeof plugin.hostnames === 'undefined') {
                continue;
            }
            this.hostnames.push(...(<MangaScraper>plugin).hostnames);
            this.plugins.push(plugin as MangaScraper);
        }
    }

    handles(hostname: string) {
        return !!this.plugins.find((p) => p.handles(hostname));
    }

    async scrape(url: URL) {
        const plugin = this.plugins.find((p) => p.handles(url.hostname));
        if (!plugin) {
            throw new Error('No scraper for this url');
        } else {
            const manga = await plugin.scrape(url);
            let seen: any = {};
            manga.chapters = manga.chapters.filter(c => seen.hasOwnProperty(c.url) ? false : (seen[c.url] = true));
            return manga;
        }
    }

    async images(url: URL) {
        const plugin = this.plugins.find((p) => p.handles(url.hostname));
        if (!plugin) {
            throw new Error('No scraper for this url');
        } else {
            return plugin.images(url);
        }
    }

    randomHostnames(amount: number, exclude: string[] = []) {
        const hostnames: string[] = [];
        for (let i = 0; i < amount; i++) {
            const random = Math.floor(Math.random() * this.hostnames.length);
            const hostname = this.hostnames[random];
            if (hostnames.includes(hostname) || exclude.includes(hostname)) {
                i--;
            } else {
                hostnames.push(hostname);
            }
        }
        return hostnames;
    }

    async search(query: string, hostnames: string[]): Promise<SearchManga[]> {
        if (!Array.isArray(hostnames) || !hostnames.length) {
            throw new Error('There has to be at least one hostname');
        }
        const plugins = this.plugins.filter((p) => !!hostnames.find((hn) => p.handles(hn)) && !!p.search);

        const promises: Promise<SearchManga[] | Error>[] = [];
        for (const plugin of plugins) {
            if (plugin.search) {
                promises.push(plugin.search(query, hostnames).catch((e: Error) => e));
            }
        }
        const array = await Promise.all(promises);
        const results: SearchManga[] = [];
        for (const ma of array) {
            if (ma instanceof Error) {
                console.error(ma.message);
            } else {
                results.push(...ma);
            }
        }
        return results;
    }
}

export const scrapers = new Scrapers();