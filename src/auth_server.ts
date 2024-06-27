import crypto from "crypto";
import { UserCred } from "./user";
import { executeQuery } from "./mysql_server";
import { cookies } from "next/headers";
import { getClientIP, getUserAgent } from "./util";

const algorithm = "aes-256-cbc"; // Encryption algorithm
const password =
  process.env.CRYPTO_PASSWORD ??
  "{%8@jDkzv}s'i|K[b&:/$xPr,0n_7cXAeH(^Ch<BO*#.pJZ2-Wq9#z^&T{+}oYlZ*m$VwU3Th<uNj7{{{YKF%8oZ1qD*#W@aSr(E~Pj)O+cXziE2~4{XfH!jNqGp7%8@W2b2{9&Q!z^$KV7o#nT*%UPW@Sr<DL(E~JxOa)_cDVQ1z$bT*YuKo<SrDL(E+PjO)_a=B1G-PQ3Xa)fKJr(N<O,cD"; // Encryption key

const getCipher = (text: string) => {
  const salt = crypto.randomBytes(16); // Random salt for key generation
  const key = crypto.scryptSync(password, salt, 32); // Key derivation
  const iv = crypto.randomBytes(16); // Initialization vector
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return JSON.stringify([
    encrypted,
    salt.toString("base64"),
    iv.toString("base64"),
  ]);
};

const getText = (cipher: string) => {
  const a = JSON.parse(cipher) as Array<string>;
  const salt = Buffer.from(a[1], "base64");
  const key = crypto.scryptSync(password, salt, 32); // Key derivation
  const iv = Buffer.from(a[2], "base64");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(a[0], "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

const getUserCredCipher = (userCredValue: UserCred): string =>
  getCipher(JSON.stringify(userCredValue));

const getUserCredValue = (userCredCipher: string): UserCred =>
  JSON.parse(getText(userCredCipher));

const setSession = (userCredValue: UserCred) => {
  cookies().set("session", getUserCredCipher(userCredValue), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // One day
    path: "/",
  });
};

export const getSession = async (): Promise<UserCred | undefined> => {
  try {
    return getUserCredValue(cookies().get("session")?.value ?? "");
  } catch (ex) {
    return undefined;
  }
};

export const signin = async (
  userid: string,
  password: string
): Promise<boolean> => {
  const res = await executeQuery(
    `select * from ${process.env.USER_TABLE_NAME} where (${process.env.USER_ID_FIELD_NAME}, ${process.env.USER_PASSWORD_FIELD_NAME}) in (('${userid}', '${password}'))`
  );
  if (res.length > 0 && res[0].active) {
    setSession({
      user: res[0],
      agent: getUserAgent(),
      ip: getClientIP(),
    });
    return true;
  }
  return false;
};

export const signout = () => cookies().delete("session");

export const authCheck = async (): Promise<boolean> => {
  const userCred = await getSession();
  console.log(userCred);
  const agent = getUserAgent();
  console.log(agent);
  const ip = getClientIP();
  console.log(ip);
  return userCred
    ? userCred.user.active === 1 &&
        userCred.agent === agent &&
        userCred.ip === ip
    : false;
};

export const apiAuthCheck = async (
  session: string,
  ip: string,
  agent: string
): Promise<boolean> => {
  try {
    const userCred = getUserCredValue(session);
    return userCred
      ? userCred.user.active === 1 &&
          userCred.agent === agent &&
          userCred.ip === ip
      : false;
  } catch (ex) {
    return false;
  }
};

export const fetchUser = async (): Promise<
  { userId: number; businessId: number } | undefined
> => {
  try {
    const userCred = await getSession();
    const agent = getUserAgent();
    const ip = getClientIP();
    return userCred &&
      userCred.user.active === 1 &&
      userCred.agent === agent &&
      userCred.ip === ip
      ? { userId: userCred.user.id, businessId: userCred.user.businessId }
      : undefined;
  } catch (ex) {}
};
