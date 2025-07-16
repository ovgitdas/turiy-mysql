/**
 * @file This file provides utility functions for symmetric encryption and decryption
 * using AES (Advanced Encryption Standard). It is used to secure sensitive data,
 * such as session information stored in cookies.
 */
import AES from "crypto-js/aes";
import { enc } from "crypto-js";

/**
 * The secret key used for AES encryption and decryption.
 * It attempts to read the key from the `CRYPTO_PASSWORD` environment variable.
 * If the environment variable is not set, it falls back to a hardcoded default key.
 *
 * @warning It is strongly recommended to set a unique, secure `CRYPTO_PASSWORD` in your production environment.
 */
const password =
  process.env.CRYPTO_PASSWORD ??
  "{%8@jDkzv}s'i|K[b&:/$xPr,0n_7cXAeH(^Ch<BO*#.pJZ2-Wq9#z^&T{+}oYlZ*m$VwU3Th<uNj7{{{YKF%8oZ1qD*#W@aSr(E~Pj)O+cXziE2~4{XfH!jNqGp7%8@W2b2{9&Q!z^$KV7o#nT*%UPW@Sr<DL(E~JxOa)_cDVQ1z$bT*YuKo<SrDL(E+PjO)_a=B1G-PQ3Xa)fKJr(N<O,cD"; // Encryption key

/**
 * Encrypts a given JavaScript object. The object is first serialized to a JSON string,
 * then encrypted using AES.
 * @param {any} object - The JavaScript object or value to encrypt.
 * @returns {string} The AES-encrypted ciphertext, as a string.
 */
export const getEncrypted = (object: any): string =>
  AES.encrypt(JSON.stringify(object), password).toString();

/**
 * Decrypts an AES-encrypted ciphertext string back into a JavaScript object.
 * It returns `undefined` if decryption or JSON parsing fails.
 * @param {string} cipher - The AES-encrypted ciphertext to decrypt.
 * @returns {any | undefined} The original JavaScript object, or `undefined` if the process fails.
 */
export const getDecrypted = (cipher: string): any => {
  try {
    return JSON.parse(AES.decrypt(cipher, password).toString(enc.Utf8));
  } catch {}
};
