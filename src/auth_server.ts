/**
 * @file This file provides server-side authentication functions for a Next.js application.
 * It handles user sign-in, sign-out, and session validation by leveraging the session
 * and database modules. It is designed to be used within Server Actions or API Routes.
 */
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

/**
 * Attempts to sign in a user by verifying their credentials against the database.
 * If the credentials are valid and the user is active, a new session is created and stored in an encrypted cookie.
 *
 * @example
 * // Signs in a user with their id and password.
 * await signin({ user: { id: 'my-user-id', password: "my-password" } });
 * @param {Table} userTable - A `Table` object containing the user's credentials for the `WHERE` clause.
 * @returns {Promise<Tuple | undefined>} A promise that resolves with the user's data (as a `Tuple`) on successful sign-in, or `undefined` on failure.
 */
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

/**
 * Signs out the current user by deleting their session cookie.
 */
export const signout = async () => (await cookies()).delete("session");

/**
 * Checks if the current request is associated with a valid, authenticated session.
 * It retrieves the session from the cookie and validates it.
 *
 * Note: The check for matching IP address and User Agent is currently commented out
 * for flexibility, but can be enabled for stricter security.
 *
 * @returns {Promise<Tuple | undefined>} A promise that resolves with the authenticated user's data
 * if the session is valid, or `undefined` otherwise.
 */
export const authCheck = async (): Promise<Tuple | undefined> => {
  const session = await getSession();
  const agent = await getUserAgent();
  const ip = await getClientIP();
  // Stricter check can be enabled by uncommenting the following lines:
  return session && session.user //&& session.agent === agent && session.ip === ip
    ? session.user
    : undefined;
};

/**
 * Performs an authentication check using client details provided directly,
 * rather than reading from the incoming request's cookies and headers.
 * This is useful for scenarios like WebSocket authentication where headers are not readily available.
 * It decrypts the provided session cipher and validates it against the provided IP and user agent.
 *
 * @param {BrowserClientAuth} authDetails - An object containing the session cipher, IP address, and user agent.
 * @returns {Promise<Tuple | undefined>} A promise that resolves with the user's data if the session is
 * valid and all details match, or `undefined` otherwise.
 */
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
