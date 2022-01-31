import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm';
import { Manga } from './manga';

@Entity()
export class Chapter {
    @Column()
    url!: string;

    @Column()
    hostname!: string;

    @Column()
    title!: string;

    @Column({ primary: true })
    number!: number;

    @Column({ nullable: true })
    posted?: Date;

    @ManyToOne(() => Manga, (manga: Manga) => manga.chapters, { eager: false, primary: true })
    @JoinColumn()
    manga!: Manga;
}
