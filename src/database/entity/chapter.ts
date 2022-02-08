import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm';
import { Manga } from './manga';

@Entity()
export class Chapter {
    @Column({ primary: true })
    url!: string;

    @Column()
    hostname!: string;

    @Column()
    title!: string;

    @Column()
    number!: number;

    @Column()
    posted?: Date;

    @ManyToOne(() => Manga, (manga: Manga) => manga.chapters, { eager: false, primary: true })
    @JoinColumn()
    manga!: Manga;
}
