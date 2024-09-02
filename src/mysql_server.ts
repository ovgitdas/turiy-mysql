"use server";
import mysql from "mysql2/promise";
import { Tuple, Table } from "./types";

const SET = (table: Table): string => {
  const tableName = Object.keys(table)[0];
  const row = table[tableName];
  const columns = [];
  for (let col in row) {
    columns.push(`${col}='${row[col]}'`);
  }
  return `${tableName} SET ${columns.join(",")}`;
};

const WHERE = (tuple: Tuple): string => {
  const colNames = [];
  const colValues = [];
  for (let col in tuple) {
    colNames.push(`${col}`);
    colValues.push(`'${tuple[col]}'`);
  }
  return colNames.length === 1 && colNames[0].toLowerCase() === "where"
    ? `WHERE ${colValues[0]}`
    : `WHERE (${colNames.join(",")}) IN ((${colValues.join(",")}))`;
};

const WHERE_TAB = (table: Table): string => {
  const tableName = Object.keys(table)[0];
  const tuple = table[tableName];
  return `${tableName} ${WHERE(tuple)}`;
};

//? Execute any SQL statement
export const execute = async (query: string): Promise<Tuple[]> => {
  let results = [];
  try {
    const con = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    try {
      const res = await con.query(query);
      results = query.toLowerCase().startsWith("select")
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
export const insert = async (table: Table): Promise<boolean> =>
  (await execute(`INSERT INTO ${SET(table)}`)).length > 0;

//? e.g: update({item:{price:200, discount:5}}, {where: "(itemId) IN (('IT78945'))"})
//? e.g: update({item:{price:200, discount:5}}, {itemId: "IT78945"})
export const update = async (
  table: Table,
  condition: Tuple
): Promise<boolean> =>
  (await execute(`UPDATE ${SET(table)} ${WHERE(condition)}`)).length > 0;

//? e.g: del({item: {where: "(itemId) IN (('IT78945'))"}})
//? e.g: del({item: {itemId: "IT78945"}})
export const del = async (table: Table): Promise<boolean> =>
  (await execute(`DELETE FROM ${WHERE_TAB(table)}`)).length > 0;

//? e.g: select({user: {where: "(userId, password) IN (('123456789', 'P#@$%745458'))"}})
//? e.g: select({user: {userId: 123456789, password: "P#@$%745458"}})
export const select = async (table: Table): Promise<Tuple[]> =>
  await execute(`SELECT * FROM ${WHERE_TAB(table)}`);
