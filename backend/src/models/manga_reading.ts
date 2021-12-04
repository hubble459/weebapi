import Manga from "./manga";

export default interface MangaReading extends Manga {
    progress: number;
}