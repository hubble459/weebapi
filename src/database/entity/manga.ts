import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    OneToMany,
    JoinColumn,
    AfterLoad,
    getRepository,
    BeforeInsert,
} from 'typeorm';
import { Chapter } from './chapter';

@Entity()
export class Manga {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    url!: string;

    @Column()
    hostname!: string;

    @Column()
    title!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({ nullable: true })
    cover?: string;

    @Column()
    status!: boolean;

    @Column({ type: 'simple-array' })
    alt_titles!: string[];

    @Column({ type: 'simple-array' })
    authors!: string[];

    @Column({ type: 'simple-array' })
    genres!: string[];

    @OneToMany(() => Chapter, (chapter: Chapter) => chapter.manga, { eager: false, cascade: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn()
    chapters!: Chapter[];

    @Column({ type: 'timestamp' })
    updated!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    refreshed!: Date;

    chapter_count!: number;

    @BeforeInsert()
    setRefreshed() {
        this.refreshed = new Date();
    }

    @AfterLoad()
    async countChapters() {
        this.chapter_count = (
            await getRepository(Chapter).findAndCount({ loadRelationIds: true, where: { manga: { id: this.id } } })
        )[1];
    }
}
