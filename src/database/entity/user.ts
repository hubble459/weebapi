import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, OneToMany } from 'typeorm';
import { Reading } from './reading';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    username!: string;

    @Column()
    password_hash!: string;

    @OneToMany(() => Reading, (reading: Reading) => reading.user, {cascade: true, onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    @JoinColumn()
    reading!: Reading[];
}
