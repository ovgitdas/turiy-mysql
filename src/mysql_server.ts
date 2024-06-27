import mysql from "mysql2/promise";
import { Tuple, InsertProps, UpdateProps, DeleteProps } from "./types";

export const executeQuery = async (sql: string): Promise<Tuple[]> => {
  let results = [];
  try {
    const con = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    try {
      const res = await con.query(sql);
      results = sql.toLowerCase().startsWith("select")
        ? (res[0] as any[])
        : [res];
    } catch (ex) {
      console.log("MySQL Query error!");
      console.error(ex);
    }
    await con.end();
    console.log("Close the database connection.");
  } catch (ex) {
    console.log("MySQL Connection error!");
    console.error(ex);
  }
  return results;
};

const join = (data: Tuple): string => {
  let sql = "";
  let first = true;
  for (const [key, value] of Object.entries(data)) {
    if (!first) {
      sql += ", ";
    }
    sql += `${key} = '${value}'`;
    first = false;
  }
  return sql;
};

export const mysqlInsert = async ({
  tableName,
  data,
}: InsertProps): Promise<boolean> =>
  (await executeQuery(`INSERT INTO ${tableName} SET ${join(data)}`)).length > 0;

export const mysqlUpdate = async ({
  tableName,
  data,
  where,
}: UpdateProps): Promise<boolean> =>
  (await executeQuery(`UPDATE ${tableName} SET ${join(data)} WHERE ${where}`))
    .length > 0;

export const mysqlDelete = async ({
  tableName,
  where,
}: DeleteProps): Promise<boolean> =>
  (await executeQuery(`Delete From ${tableName} WHERE ${where}`)).length > 0;
