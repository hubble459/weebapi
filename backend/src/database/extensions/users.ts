import database from '../';
import DBUser from '../../models/database/db_user';
import User from '../../models/user';
import DBExtension from '../database_extension';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

declare module '../' {
    interface Database {
        users: UsersDB;
    }
}

class UsersDB extends DBExtension<User> {
    private readonly privateJWTKey: jwt.Secret = 'mqPmLVUt@R%7u{E4';
    readonly table_name = 'users';
    override readonly priority = 0;
    readonly create_statement = 'CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY AUTO_INCREMENT, username VARCHAR(13) UNIQUE NOT NULL, password_hash TEXT NOT NULL)';

    async all(limit: number = 30, offset: number = 0) {
        const users = await database.all<DBUser>('SELECT * FROM users LIMIT ? OFFSET ?', [limit, offset]);

        return users.map((dbUser) => ({
            username: dbUser.username,
            id: dbUser.id,
        })) as User[];
    }

    async get(user_id: number, fullReading: boolean = true): Promise<User | undefined> {
        const dbUser = await database.get<DBUser>('SELECT * FROM users WHERE id = ?', [user_id]);
        if (!!dbUser) {
            const reading = await database.reading.get(dbUser.id, fullReading);
            if (!!reading) {
                return {
                    id: dbUser.id,
                    username: dbUser.username,
                    reading
                };
            }
        }
    }

    async login(username: string, password: string) {
        const user = await database.get<DBUser>('SELECT * FROM users WHERE username = ?', [username]);
        if (!!user) {
            const passChecked = bcrypt.compareSync(password, user.password_hash);
            if (passChecked) {
                return jwt.sign({
                    id: user.id,
                    username: user.username,
                }, this.privateJWTKey, { expiresIn: '7d' })
            }
        }
        throw new Error('User or password incorrect');
    }

    verify(token: string) {
        return jwt.verify(token, this.privateJWTKey);
    }

    async update(user: User, password: string) {
        const password_hash = bcrypt.hashSync(password);
        await database.run(
            'UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, user.id]
        );
        return user;
    }

    async add(username: string, password: string): Promise<User> {
        const password_hash = bcrypt.hashSync(password);
        const res = await database.run(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            [username, password_hash]
        );
        return {
            id: res.insertId,
            username,
            reading: [],
        };
    }

    async remove(username: string) {
        return (await database.run('DELETE FROM users WHERE username = ?', [username])).affectedRows === 1;
    }
}

export default UsersDB;
