"use server"
import mysql from "mysql2/promise"
import { Tuple, Table, MySQLConnection } from "./types"

const VALUE = (text: any): string => {
  try {
    if (text.includes("'")) {
      return text.split("'").join("''")
    }
  } catch (ex) {}
  return text
}

const SET = (table: Table): string => {
  const tableName = Object.keys(table)[0]
  const row = table[tableName]
  const columns = []
  for (let col in row) {
    columns.push(`${col}='${VALUE(row[col])}'`)
  }
  return `${tableName} SET ${columns.join(",")}`
}

const WHERE = (tuple: Tuple): string => {
  const colNames = []
  const colValues = []
  let and = ""
  let or = ""
  let orderby = ""
  for (const col in tuple) {
    if (col.toLowerCase() === "and") {
      and = ` AND (${tuple[col]})`
    } else if (col.toLowerCase() === "or") {
      or = ` OR (${tuple[col]})`
    } else if (col.toLowerCase() === "orderby") {
      orderby = ` ORDER BY ${tuple[col]}`
    } else {
      colNames.push(`${col}`)
      colValues.push(`'${VALUE(tuple[col])}'`)
    }
  }
  return colNames.length === 1 && colNames[0].toLowerCase() === "where"
    ? `WHERE ${tuple[colNames[0]]}${and}${or}${orderby}`
    : `WHERE (${colNames.join(",")}) IN ((${colValues.join(
        ","
      )}))${and}${or}${orderby}`
}

const WHERE_TAB = (table: Table): string => {
  const tableName = Object.keys(table)[0]
  const tuple = table[tableName]
  return `${tableName} ${WHERE(tuple)}`
}

//? Use a global variable to ensure the pool is only initialized once
//? across hot reloads in development and across function invocations
//?  in production serverless environments (if the instance is reused).
//~ This is a common pattern for singleton instances in Next.js/Node.js.
let cachedConnectionPool: mysql.Pool | null = null

export async function getPoolConnection() {
  if (!!cachedConnectionPool) {
    return await cachedConnectionPool.getConnection()
  }

  let connectionLimit = 10
  try {
    const connectionLimit = +(process.env.MYSQL_POOL_CONNECTION_LIMIT || 10)
  } catch (ex) {
    connectionLimit = 10
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
  })

  // Assign the pool to the global cache
  cachedConnectionPool = pool
  return await pool.getConnection()
}

//? Execute any SQL statement
const _execute = async (
  query: string,
  con: mysql.PoolConnection | mysql.Connection
) => {
  try {
    const res = await con.query(query)
    return query.split("(").join("").trim().toLowerCase().startsWith("select")
      ? (res[0] as any[])
      : [res]
  } catch (ex) {
    if (!process.env.NO_ERROR) {
      console.log("MySQL Query error!")
      console.error(ex)
    }
  }
  return []
}
export const execute = async (
  query: string,
  connectionInfo?: MySQLConnection
): Promise<Tuple[]> => {
  let results = []
  try {
    if (!!connectionInfo) {
      const con = await mysql.createConnection(connectionInfo)
      results = await _execute(query, con)
      await con.end()
    } else {
      const con = await getPoolConnection()
      results = await _execute(query, con)
      con.release()
    }
    // console.log("Close the database connection.");
  } catch (ex) {
    console.log("MySQL Connection error!")
    console.error(ex)
  }
  return results
}

//? e.g: insert({item:{itemId: "IT78945", price:300, discount:15}})
export const insert = async (
  table: Table,
  connectionInfo?: MySQLConnection
): Promise<boolean> =>
  (await execute(`INSERT INTO ${SET(table)}`, connectionInfo)).length > 0

//? e.g: update({item:{price:200, discount:5}}, {where: "(itemId) IN (('IT78945'))"})
//? e.g: update({item:{price:200, discount:5}}, {itemId: "IT78945"})
export const update = async (
  table: Table,
  condition: Tuple,
  connectionInfo?: MySQLConnection
): Promise<boolean> =>
  (await execute(`UPDATE ${SET(table)} ${WHERE(condition)}`, connectionInfo))
    .length > 0

//? e.g: del({item: {where: "(itemId) IN (('IT78945'))"}})
//? e.g: del({item: {itemId: "IT78945"}})
export const del = async (
  table: Table,
  connectionInfo?: MySQLConnection
): Promise<boolean> =>
  (await execute(`DELETE FROM ${WHERE_TAB(table)}`, connectionInfo)).length > 0

//? e.g: select({user: {where: "(userId, password) IN (('123456789', 'P#@$%745458'))"}})
//? e.g: select({user: {userId: 123456789, password: "P#@$%745458"}})
export const select = async (
  table: Table,
  connectionInfo?: MySQLConnection
): Promise<Tuple[]> =>
  await execute(`SELECT * FROM ${WHERE_TAB(table)}`, connectionInfo)
