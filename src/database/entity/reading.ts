import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, JoinColumn, CreateDateColumn, OneToOne } from 'typeorm';
import { Manga } from './manga';
import { User } from './user';

@Entity()
export class Reading {
    @Column()
    progress!: number;

    @OneToOne(() => Manga, {cascade: true, onDelete: 'CASCADE', eager: true, primary: true})
    @JoinColumn()
    manga!: Manga;

    @OneToOne(() => User, (user: User) => user.reading, {cascade: true, onDelete: 'CASCADE', eager: false, primary: true})
    @JoinColumn()
    user!: User;

    @UpdateDateColumn({type: 'timestamp'})
    updated!: Date;

    @CreateDateColumn({type: 'timestamp'})
    created!: Date;
}
