/**
 * @file This file defines the shared TypeScript types and interfaces used throughout the library.
 * These types provide a consistent data structure for database rows, tables, sessions, and connection information.
 */

/**
 * Represents a generic key-value object, typically used for a single database row
 * or a set of conditions in a WHERE clause.
 * The values can be either a string or a number.
 */
export type Tuple = {
  [key: string]: string | number;
};

/**
 * Represents a database table operation, mapping a table name to a `Tuple`.
 * For `INSERT` or `UPDATE`, the Tuple contains the column data.
 * For `SELECT` or `DELETE`, the Tuple contains the `WHERE` clause conditions.
 * @example
 * // For an insert operation
 * const userInsert: Table = { user: { name: 'John', age: 30 } };
 */
export type Table = {
  [key: string]: Tuple;
};

/**
 * Defines the structure of the session object that is stored in the encrypted cookie.
 * It contains the authenticated user's data and a snapshot of their client information
 * for security validation.
 */
export type Session = {
  /** The authenticated user's data, retrieved from the database. */
  user: Tuple;
  /** The IP address of the client when the session was created. */
  ip: string;
  /** The User-Agent string of the client's browser when the session was created. */
  agent: string;
};

/**
 * Defines the structure for client authentication details, often passed to
 * functions that perform validation without direct access to request headers.
 */
export type BrowserClientAuth = {
  /** The encrypted session string, read from the cookie. */
  sessionCipher: string;
  /** The client's IP address. */
  ip: string;
  /** The client's User-Agent string. */
  agent: string;
};

/**
 * Defines the connection parameters for establishing a direct connection to a MySQL database.
 */
export type MySQLConnection = {
  host: string;
  user: string;
  password: string;
  database: string;
};
