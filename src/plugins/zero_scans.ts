import DOMMangaScraper, { DOMMangaScraperQueries } from '../helpers/manga/dom_manga_scraper';

class ZeroScans extends DOMMangaScraper {
    hostnames: string[] = ['zeroscans.com', 'the-nonames.com'];
    queries: DOMMangaScraperQueries = {
        parse: {
            title: 'h5.text-highlight',
            description: 'div.col-lg-9.text-muted',
            cover: 'div.media a.media-content',
            cover_attrs: ['style'],
            chapter: {
                href: 'div.list-item.col-sm-3 div a.item-author',
                posted: 'div.list-item.col-sm-3 div a.item-company',
                number: 'div.list-item.col-sm-3 span',
            },
        },
        images: {
            image: 'img',
        },
        search: {
            url: 'https://${hostname}.com/comics?query=${query}',
            href: 'a.list-title.ajax',
            title: 'a.list-title.ajax',
            image: 'a.media-content[style]',
            image_attrs: ['style'],
            encode: false,
        },
    };

    override async images(url: URL) {
        const { $ } = await this.getPage(url);
        const element = $('#pages-container + script');
        const data = element.text();
        const match = data.match(/window\.chapterPages = (?<array>[^;]+);/);
        if (match) {
            const arr = JSON.parse(match.groups!.array) as string[];
            return arr.map((link) =>
                link.startsWith('http') ? link : `${url.protocol}//${url.hostname}${link}`
            );
        }
        return [];
    }
}

export default ZeroScans;
