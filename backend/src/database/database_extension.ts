import database from '.';

/**
 * Extend this to create a database table with typed functions
 *
 * @author meep334
 * @date 07/11/2021
 * @export
 * @abstract
 * @class DBExtension
 * @template T table type
 * @example
 * export default class extends DBExtension<{id: number, name: string}> {
 *     ...override functions
 * }
 */
export default abstract class DBExtension<T = any> {
    abstract readonly create_statement: string;
    abstract readonly table_name: string;
    readonly priority: number = 100;
    abstract all(): Promise<T[]>;
    abstract add(value: T | any, ...args: any[]): Promise<T>;
    abstract update(value: T | any, ...args: any[]): Promise<T>;
    abstract get(id: any): Promise<T | undefined>;
    abstract remove(id: T | any, ...args: any[]): Promise<boolean>;

    /**
     * Create the table by running the `create_statement` query
     *
     * @author meep334
     * @date 06/11/2021
     * @memberof DBExtension
     */
    async create() {
        database.run(this.create_statement);
    }

    /**
     * Get the amount of rows in this table
     *
     * @author meep334
     * @date 06/11/2021
     * @returns {Promise<number>} 
     * @memberof DBExtension
     */
    async count(): Promise<number> {
        return +((await database.get<{ count: string }>(`SELECT COUNT(*) as count FROM ${this.table_name}`))?.count || 0);
    }

    /**
     * Clear the table
     *
     * @author meep334
     * @date 06/11/2021
     * @returns {Promise<number>} amount of rows cleared
     * @memberof DBExtension
     */
    async clear(): Promise<number> {
        await database.run(`ALTER TABLE ${this.table_name} AUTO_INCREMENT = 0`);
        return (await database.run(`DELETE FROM ${this.table_name}`)).changedRows;
    }

    /**
     * Drop the table
     *
     * @author meep334
     * @date 06/11/2021
     * @memberof DBExtension
     */
    async drop() {
        await database.run(`DROP TABLE ${this.table_name}`);
    }
}
