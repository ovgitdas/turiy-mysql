"use server";
import { select } from "./mysql_server";
import { cookies } from "next/headers";
import {
  getClientIP,
  getUserAgent,
  getSession,
  getSessionFor,
  setSession,
} from "./session_server";
import { BrowserClientAuth, Table, Tuple } from "./types";

//? eg. signin({user:{id:'my-user-id', password:"my-password"}})
export const signin = async (userTable: Table): Promise<Tuple | undefined> => {
  const res = await select(userTable);
  if (res.length > 0 && res[0].active) {
    setSession({
      user: res[0],
      agent: await getUserAgent(),
      ip: await getClientIP(),
    });
    return res[0];
  }
};

export const signout = async () => (await cookies()).delete("session");

export const authCheck = async (): Promise<Tuple | undefined> => {
  const session = await getSession();
  const agent = await getUserAgent();
  const ip = await getClientIP();
  return session && session.user //&& session.agent === agent && session.ip === ip
    ? session.user
    : undefined;
};

export const authCheckFor = async ({
  sessionCipher,
  ip,
  agent,
}: BrowserClientAuth): Promise<Tuple | undefined> => {
  const session = await getSessionFor(sessionCipher);
  return session && session.user && session.agent === agent && session.ip === ip
    ? session.user
    : undefined;
};
