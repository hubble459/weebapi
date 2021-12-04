import MangaReading from "./manga_reading";

export default interface User {
    id: number;
    username: string;
    reading: MangaReading[];
}