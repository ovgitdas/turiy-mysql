import AES from "crypto-js/aes";
import { enc } from "crypto-js";

const password =
  process.env.CRYPTO_PASSWORD ??
  "{%8@jDkzv}s'i|K[b&:/$xPr,0n_7cXAeH(^Ch<BO*#.pJZ2-Wq9#z^&T{+}oYlZ*m$VwU3Th<uNj7{{{YKF%8oZ1qD*#W@aSr(E~Pj)O+cXziE2~4{XfH!jNqGp7%8@W2b2{9&Q!z^$KV7o#nT*%UPW@Sr<DL(E~JxOa)_cDVQ1z$bT*YuKo<SrDL(E+PjO)_a=B1G-PQ3Xa)fKJr(N<O,cD"; // Encryption key

export const getEncrypted = (object: any): string =>
  AES.encrypt(JSON.stringify(object), password).toString();

export const getDecrypted = (cipher: string): any => {
  try {
    return JSON.parse(AES.decrypt(cipher, password).toString(enc.Utf8));
  } catch {}
};
