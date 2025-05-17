"use server";
import mysql from "mysql2/promise";
import { Tuple, Table, MySQLConnection } from "./types";

const VALUE = (text: any): string => {
  try {
    if (text.includes("'")) {
      return text.split("'").join("''");
    }
  } catch (ex) {}
  return text;
};

const SET = (table: Table): string => {
  const tableName = Object.keys(table)[0];
  const row = table[tableName];
  const columns = [];
  for (let col in row) {
    columns.push(`${col}='${VALUE(row[col])}'`);
  }
  return `${tableName} SET ${columns.join(",")}`;
};

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

const WHERE_TAB = (table: Table): string => {
  const tableName = Object.keys(table)[0];
  const tuple = table[tableName];
  return `${tableName} ${WHERE(tuple)}`;
};

//? Execute any SQL statement
export const execute = async (
  query: string,
  connectionInfo?: MySQLConnection
): Promise<Tuple[]> => {
  let results = [];
  try {
    const con = await mysql.createConnection(
      connectionInfo || {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
      }
    );
    try {
      const res = await con.query(query);
      results = query
        .split("(")
        .join("")
        .trim()
        .toLowerCase()
        .startsWith("select")
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

//? e.g: insert({item:{itemId: "IT78945", price:300, discount:15}})
export const insert = async (
  table: Table,
  connectionInfo?: MySQLConnection
): Promise<boolean> =>
  (await execute(`INSERT INTO ${SET(table)}`, connectionInfo)).length > 0;

//? e.g: update({item:{price:200, discount:5}}, {where: "(itemId) IN (('IT78945'))"})
//? e.g: update({item:{price:200, discount:5}}, {itemId: "IT78945"})
export const update = async (
  table: Table,
  condition: Tuple,
  connectionInfo?: MySQLConnection
): Promise<boolean> =>
  (await execute(`UPDATE ${SET(table)} ${WHERE(condition)}`, connectionInfo))
    .length > 0;

//? e.g: del({item: {where: "(itemId) IN (('IT78945'))"}})
//? e.g: del({item: {itemId: "IT78945"}})
export const del = async (
  table: Table,
  connectionInfo?: MySQLConnection
): Promise<boolean> =>
  (await execute(`DELETE FROM ${WHERE_TAB(table)}`, connectionInfo)).length > 0;

//? e.g: select({user: {where: "(userId, password) IN (('123456789', 'P#@$%745458'))"}})
//? e.g: select({user: {userId: 123456789, password: "P#@$%745458"}})
export const select = async (
  table: Table,
  connectionInfo?: MySQLConnection
): Promise<Tuple[]> =>
  await execute(`SELECT * FROM ${WHERE_TAB(table)}`, connectionInfo);
