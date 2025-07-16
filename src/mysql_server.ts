/**
 * @file This module provides a data access layer for interacting with a MySQL database.
 * It includes a connection pool for efficient database connections and helper
 * functions for common CRUD (Create, Read, Update, Delete) operations.
 * It is designed for use in a server-side environment like Next.js Server Components.
 */
"use server";
import mysql from "mysql2/promise";
import { Tuple, Table, MySQLConnection } from "./types";

/**
 * Escapes single quotes in a string to prevent SQL injection in string values.
 * @param {any} text - The input value to sanitize.
 * @returns {string} The sanitized string, with single quotes doubled up.
 * @private
 */
const VALUE = (text: any): string => {
  try {
    if (text.includes("'")) {
      return text.split("'").join("''");
    }
  } catch (ex) {}
  return text;
};

/**
 * Generates the `SET` clause for an SQL `INSERT` or `UPDATE` statement.
 * @param {Table} table - A `Table` object containing column-value pairs.
 * @returns {string} The formatted `tableName SET col1='val1',col2='val2'` string.
 * @private
 */
const SET = (table: Table): string => {
  const tableName = Object.keys(table)[0];
  const row = table[tableName];
  const columns = [];
  for (let col in row) {
    columns.push(`${col}='${VALUE(row[col])}'`);
  }
  return `${tableName} SET ${columns.join(",")}`;
};

/**
 * Generates the `WHERE` clause for an SQL statement from a tuple object.
 * It supports simple key-value equality, as well as custom `AND`, `OR`, and `ORDER BY` clauses.
 * @param {Tuple} tuple - An object representing the conditions.
 * @returns {string} The formatted `WHERE` clause string.
 * @private
 */
const WHERE = (tuple: Tuple): string => {
  const colNames = [];
  const colValues = [];
  let and = "";
  let or = "";
  let orderby = "";
  for (const col in tuple) {
    if (col.toLowerCase() === "and") {
      and = ` AND (${tuple[col]})`;
    } else if (col.toLowerCase() === "or") {
      or = ` OR (${tuple[col]})`;
    } else if (col.toLowerCase() === "orderby") {
      orderby = ` ORDER BY ${tuple[col]}`;
    } else {
      colNames.push(`${col}`);
      colValues.push(`'${VALUE(tuple[col])}'`);
    }
  }
  return colNames.length === 1 && colNames[0].toLowerCase() === "where"
    ? `WHERE ${tuple[colNames[0]]}${and}${or}${orderby}`
    : `WHERE (${colNames.join(",")}) IN ((${colValues.join(
        ","
      )}))${and}${or}${orderby}`;
};

/**
 * Generates a `tableName` and `WHERE` clause combination.
 * @param {Table} table - A `Table` object where the value is the tuple for the `WHERE` clause.
 * @returns {string} A string combining the table name and the `WHERE` clause.
 * @private
 */
const WHERE_TAB = (table: Table): string => {
  const tableName = Object.keys(table)[0];
  const tuple = table[tableName];
  return `${tableName} ${WHERE(tuple)}`;
};

/**
 * A cached connection pool instance to prevent re-creating the pool on every request.
 * This singleton pattern is crucial for performance in serverless environments
 * and during hot-reloading in development.
 * @type {(mysql.Pool | null)}
 */
let cachedConnectionPool: mysql.Pool | null = null;

/**
 * Retrieves a connection from the cached MySQL connection pool.
 * If the pool does not exist, it initializes it using environment variables.
 * @returns {Promise<mysql.PoolConnection>} A promise that resolves with a database connection from the pool.
 */
export async function getPoolConnection() {
  if (!!cachedConnectionPool) {
    return await cachedConnectionPool.getConnection();
  }

  let connectionLimit = 10;
  try {
    const connectionLimit = +(process.env.MYSQL_POOL_CONNECTION_LIMIT || 10);
  } catch (ex) {
    connectionLimit = 10;
  }

  // If not cached, create a new pool
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true, // If true, the pool will queue connection requests if no connection is available.
    connectionLimit: connectionLimit, // Max number of connections in the pool
    queueLimit: 0, // No limit on the number of queued requests
  });

  // Assign the pool to the global cache
  cachedConnectionPool = pool;
  return await pool.getConnection();
}

/**
 * The internal query execution function.
 * @param {string} query - The SQL query to execute.
 * @param {mysql.PoolConnection | mysql.Connection} con - The database connection to use.
 * @returns {Promise<any[]>} A promise that resolves with query results.
 * For SELECT queries, it returns an array of rows. For other queries, it returns the raw result from the driver.
 * @private
 */
const _execute = async (
  query: string,
  con: mysql.PoolConnection | mysql.Connection
) => {
  try {
    const res = await con.query(query);
    return query.split("(").join("").trim().toLowerCase().startsWith("select")
      ? (res[0] as any[])
      : [res];
  } catch (ex) {
    if (!process.env.NO_ERROR) {
      console.log("MySQL Query error!");
      console.error(ex);
    }
  }
  return [];
};
/**
 * Executes a raw SQL query. It can use either the connection pool (default) or a direct,
 * single-use connection if connection info is provided. The connection is automatically
 * released (for pools) or ended (for direct connections).
 *
 * @param {string} query - The raw SQL query string to execute.
 * @param {MySQLConnection} [connectionInfo] - Optional connection details for creating a temporary, direct connection.
 * @returns {Promise<Tuple[]>} A promise that resolves to an array of result rows.
 */
export const execute = async (
  query: string,
  connectionInfo?: MySQLConnection
): Promise<Tuple[]> => {
  let results = [];
  try {
    if (!!connectionInfo) {
      const con = await mysql.createConnection(connectionInfo);
      results = await _execute(query, con);
      await con.end();
    } else {
      const con = await getPoolConnection();
      results = await _execute(query, con);
      con.release();
    }
    // console.log("Close the database connection.");
  } catch (ex) {
    console.log("MySQL Connection error!");
    console.error(ex);
  }
  return results;
};

/**
 * Inserts a new row into a table.
 * @example
 * // Inserts a new item into the 'item' table.
 * await insert({ item: { itemId: "IT78945", price: 300, discount: 15 } });
 * @param {Table} table - A `Table` object where the key is the table name and the value contains the data for the new row.
 * @param {MySQLConnection} [connectionInfo] - Optional direct connection details.
 * @returns {Promise<boolean>} A promise that resolves to `true` on successful insertion, `false` otherwise.
 */
export const insert = async (
  table: Table,
  connectionInfo?: MySQLConnection
): Promise<boolean> =>
  (await execute(`INSERT INTO ${SET(table)}`, connectionInfo)).length > 0;

/**
 * Updates existing rows in a table that match a given condition.
 * @example
 * // Updates the price for a specific item.
 * await update({ item: { price: 200 } }, { itemId: "IT78945" });
 * @example
 * // Updates using a custom WHERE clause.
 * await update({ item: { discount: 5 } }, { where: "price > 100" });
 * @param {Table} table - A `Table` object containing the new values to set.
 * @param {Tuple} condition - A `Tuple` object defining the `WHERE` clause to identify rows to update.
 * @param {MySQLConnection} [connectionInfo] - Optional direct connection details.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the update was successful, `false` otherwise.
 */
export const update = async (
  table: Table,
  condition: Tuple,
  connectionInfo?: MySQLConnection
): Promise<boolean> =>
  (await execute(`UPDATE ${SET(table)} ${WHERE(condition)}`, connectionInfo))
    .length > 0;

/**
 * Deletes rows from a table that match a given condition.
 * @example
 * // Deletes a specific item.
 * await del({ item: { itemId: "IT78945" } });
 * @param {Table} table - A `Table` object where the key is the table name and the value is a `Tuple` defining the `WHERE` clause.
 * @param {MySQLConnection} [connectionInfo] - Optional direct connection details.
 * @returns {Promise<boolean>} A promise that resolves to `true` on successful deletion, `false` otherwise.
 */
export const del = async (
  table: Table,
  connectionInfo?: MySQLConnection
): Promise<boolean> =>
  (await execute(`DELETE FROM ${WHERE_TAB(table)}`, connectionInfo)).length > 0;

/**
 * Selects all columns (`SELECT *`) from a table for rows that match a given condition.
 * @example
 * // Selects a user by their id and password.
 * await select({ user: { userId: 123456789, password: "password123" } });
 * @param {Table} table - A `Table` object where the key is the table name and the value is a `Tuple` defining the `WHERE` clause.
 * @param {MySQLConnection} [connectionInfo] - Optional direct connection details.
 * @returns {Promise<Tuple[]>} A promise that resolves to an array of rows matching the query.
 */
export const select = async (
  table: Table,
  connectionInfo?: MySQLConnection
): Promise<Tuple[]> =>
  await execute(`SELECT * FROM ${WHERE_TAB(table)}`, connectionInfo);
