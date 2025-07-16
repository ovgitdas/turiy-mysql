/**
 * @file This module provides server-side session management utilities for Next.js.
 * It handles creating, reading, and parsing secure, encrypted, HTTP-only session cookies.
 * It also provides helpers for extracting client information like IP address and User-Agent from request headers.
 */
"use server";
import { cookies, headers } from "next/headers";
import { BrowserClientAuth, Session } from "./types";
import { getDecrypted, getEncrypted } from "./encrypt_server";

/**
 * Serializes, encrypts, and sets the session data as an HTTP-only cookie.
 * The cookie is configured to be secure in production and has a max age of 24 hours.
 *
 * @param {Session} session - The session object to be stored.
 * It must conform to the `Session` type, containing user data, IP, and user agent.
 */
export const setSession = async (session: Session) => {
  const encryptedSession = getEncrypted(session);
  (await cookies()).set("session", encryptedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // One day
    path: "/",
  });
};

/**
 * Reads and decrypts the session cookie from the incoming request.
 *
 * @returns {Promise<Session | undefined>} A promise that resolves with the parsed `Session` object if the cookie is valid, or `undefined` if the cookie does not exist or fails decryption.
 */
export const getSession = async (): Promise<Session | undefined> => {
  try {
    return getDecrypted((await cookies()).get("session")?.value ?? "");
  } catch (ex) {
    return undefined;
  }
};

/**
 * Decrypts a session cipher string directly, without reading from a cookie.
 * This is useful in scenarios where the session data is transmitted via other means.
 *
 * @param {string} sessionCipher - The encrypted session string.
 * @returns {Promise<Session | undefined>} A promise that resolves with the parsed `Session` object if the cipher is valid, or `undefined` on failure.
 */
export const getSessionFor = async (
  sessionCipher: string
): Promise<Session | undefined> => {
  try {
    return getDecrypted(sessionCipher);
  } catch (ex) {
    return undefined;
  }
};

/**
 * Gets the client's IP address from the request headers.
 * It prioritizes `x-forwarded-for` (common in proxies) and falls back to `x-real-ip`.
 *
 * @returns {Promise<string>} A promise that resolves with the client's IP address, or a fallback IP ('0.0.0.0').
 */
export const getClientIP = async () => {
  const FALLBACK_IP_ADDRESS = "0.0.0.0";
  const forwardedFor = (await headers()).get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0] ?? FALLBACK_IP_ADDRESS;
  }

  return (await headers()).get("x-real-ip") ?? FALLBACK_IP_ADDRESS;
};

/**
 * Gets the client's User-Agent string from the request headers.
 *
 * @returns {Promise<string>} A promise that resolves with the User-Agent string, or an empty string if not present.
 */
export const getUserAgent = async () => {
  return (await headers()).get("user-agent") ?? "";
};

/**
 * Gathers all browser client authentication details into a single object.
 * This includes the encrypted session cipher, the user agent, and the IP address.
 * @returns {Promise<BrowserClientAuth | undefined>} A promise that resolves with a `BrowserClientAuth` object, or `undefined` on error.
 */
export const getBrowserClientAuth = async (): Promise<
  BrowserClientAuth | undefined
> => {
  try {
    const sessionCipher = (await cookies()).get("session")?.value ?? "";
    const agent = await getUserAgent();
    const ip = await getClientIP();
    return { sessionCipher, agent, ip };
  } catch (ex) {}
};
