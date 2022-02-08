import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    JoinColumn,
    CreateDateColumn,
    OneToOne,
    PrimaryColumn,
    Index,
    Unique,
    ManyToOne,
} from 'typeorm';
import { Manga } from './manga';
import { User } from './user';

@Entity()
@Unique('sid', ['user.id', 'manga.id'])
export class Reading {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    progress!: number;

    @ManyToOne(() => Manga, { cascade: true, onDelete: 'CASCADE', onUpdate: 'CASCADE', eager: true })
    @JoinColumn()
    manga!: Manga;

    @ManyToOne(() => User, {
        eager: false,
    })
    @JoinColumn()
    user!: User;

    @UpdateDateColumn({ type: 'timestamp' })
    updated!: Date;

    @CreateDateColumn({ type: 'timestamp' })
    created!: Date;
}
