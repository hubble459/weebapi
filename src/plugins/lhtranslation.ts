// import DOMMangaScraper, { DOMMangaScraperQueries } from '../helpers/manga/dom_manga_scraper';
// import fetch from 'node-fetch';
// import SearchManga from '../models/search_manga';

// class LHTranslation extends DOMMangaScraper {
//     hostnames: string[] = [''];
//     queries: DOMMangaScraperQueries = {
//         parse: {
//             title: 'h1',
//             description: 'div.row:has(h3) p:contains( )',
//             cover: 'img.thumbnail',
//             status: 'a[href="/manga-on-going.html"], a[href="/manga-going.html"]',
//             alt_titles: 'li:has(> b:icontains(other names))',
//             authors: 'li:has(> b:icontains(author))',
//             genres: 'li:has(> b:icontains(genre))',
//             chapter: {
//                 href: '#list-chapters p span a',
//                 title: '#list-chapters p span a b',
//                 posted: '#list-chapters p i time',
//             },
//         },
//         images: {
//             image: '#content img.chapter-img',
//         },
//     };

//     override async search(query: string) {
//         const url = new URL(`https://lhtranslation.net/app/manga/controllers/search.single.php?q=${query}`);
//         const hostname = url.hostname;
//         const hostwithprot = `${url.protocol}//${url.hostname}`;
//         const json = await fetch(url.href, {
//             headers: { Referer: hostwithprot },
//         }).then((res) => {
//             if (res.ok) {
//                 return res.json();
//             } else {
//                 throw new Error(res.statusText);
//             }
//         });

//         const arr = json[0].data;
//         const results: SearchManga[] = [];

//         for (const m of arr) {
//             const onclick: string = m.onclick;
//             const match = onclick.match(/window\.location='(?<path>[^']+)'/);
//             results.push({
//                 hostname,
//                 title: m.primary,
//                 cover: m.image,
//                 url: `${hostwithprot}/${match!.groups!.path}`,
//                 updated: -1,
//             });
//         }
//         return results;
//     }
// }

// export default LHTranslation;
