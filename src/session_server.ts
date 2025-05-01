"use server";
import { cookies, headers } from "next/headers";
import { BrowserClientAuth, Session } from "./types";
import { getDecrypted, getEncrypted } from "./encrypt_server";

export const setSession = async (session: Session) => {
  (await cookies()).set("session", getEncrypted(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // One day
    path: "/",
  });
};

export const getSession = async (): Promise<Session | undefined> => {
  try {
    return getDecrypted((await cookies()).get("session")?.value ?? "");
  } catch (ex) {
    return undefined;
  }
};

export const getSessionFor = async (
  sessionCipher: string
): Promise<Session | undefined> => {
  try {
    return getDecrypted(sessionCipher);
  } catch (ex) {
    return undefined;
  }
};

export const getClientIP = async () => {
  const FALLBACK_IP_ADDRESS = "0.0.0.0";
  const forwardedFor = (await headers()).get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0] ?? FALLBACK_IP_ADDRESS;
  }

  return (await headers()).get("x-real-ip") ?? FALLBACK_IP_ADDRESS;
};

export const getUserAgent = async () => {
  return (await headers()).get("user-agent") ?? "";
};

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
