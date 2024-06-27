import { cookies } from "next/headers";
import { Session } from "./types";
import { getDecrypted, getEncrypted } from "./encrypt_server";

export const setSession = (session: Session) => {
  cookies().set("session", getEncrypted(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // One day
    path: "/",
  });
};

export const getSession = async (): Promise<Session | undefined> => {
  try {
    return getDecrypted(cookies().get("session")?.value ?? "");
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
