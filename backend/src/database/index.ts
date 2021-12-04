import path from 'path';
import MySQL from 'mysql2/promise';
import glob from 'glob';
import DBExtension from './database_extension';
require('dotenv').config();

type QueryValues = (string | number) | (string | number)[] | { [param: string]: any };

/**
 * Database instance
 *
 * @author meep334
 * @date 07/11/2021
 * @export
 * @class Database
 */
export class Database {
    private readonly doneListeners: (() => any)[] = [];
    private isDone: boolean = false;
    public readonly mysql: MySQL.Pool;
    private readonly options: MySQL.PoolOptions;

    public constructor(options: MySQL.PoolOptions) {
        this.mysql = MySQL.createPool(options);
        this.options = options;
        this.loadExtensions();
    }

    public async set(key: string, value: number) {
        return this.query<MySQL.ResultSetHeader>(`SET ${key} = ${value}`);
    }

    public async all<T>(query: string, values?: QueryValues) {
        return this.query<T[]>(query, values);
    }

    public async run(query: string, values?: QueryValues) {
        return this.query<MySQL.OkPacket>(query, values);
    }

    public async get<T>(query: string, values?: QueryValues) {
        return (await this.query<[T | undefined]>(query, values))[0];
    }

    private async query<T>(sql: string, values?: QueryValues): Promise<T> {
        if (typeof values === 'object' && !Array.isArray(values)) {
            const arr: any[] = [];
            sql = sql.replace(/\:([^, \)]+)/g, (_, name) => {
                arr.push((<any>values)[name]);
                return '?';
            });
            values = arr;
        }
        const [rows] = await this.mysql.query(sql, values);
        return rows as any as T;
    }

    public async loadExtensions() {
        const files = glob.sync(
            `${path.resolve(__dirname, './extensions')}/**/*.${process.env.TS_NODE_DEV ? 't' : 'j'}s`,
            { absolute: true }
        );
        const extensions: DBExtension[] = [];
        for (const filepath of files) {
            let extension = await import(filepath);

            if ((<any>extension).default) {
                extension = extension.default;
            }

            if (typeof extension === 'function') {
                const ext = new extension();
                extensions.push(ext);
            }
        }
        extensions.sort((e1, e2) => e1.priority - e2.priority);
        for (const ext of extensions) {
            await ext.create();

            // @ts-ignore
            this[ext.table_name] = ext;
        }
        this.isDone = true;
        this.doneListeners.forEach((f) => f());
    }

    public onDone(callback: () => any) {
        if (!this.isDone) {
            this.doneListeners.push(callback);
        } else {
            callback();
        }
    }
}

export default new Database({
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: +(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
});
