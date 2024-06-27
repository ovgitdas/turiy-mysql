import crypto from "crypto";

const algorithm = "aes-256-cbc"; // Encryption algorithm
const password =
  process.env.CRYPTO_PASSWORD ??
  "{%8@jDkzv}s'i|K[b&:/$xPr,0n_7cXAeH(^Ch<BO*#.pJZ2-Wq9#z^&T{+}oYlZ*m$VwU3Th<uNj7{{{YKF%8oZ1qD*#W@aSr(E~Pj)O+cXziE2~4{XfH!jNqGp7%8@W2b2{9&Q!z^$KV7o#nT*%UPW@Sr<DL(E~JxOa)_cDVQ1z$bT*YuKo<SrDL(E+PjO)_a=B1G-PQ3Xa)fKJr(N<O,cD"; // Encryption key

export const getEncrypted = <T extends unknown>(object: T): string => {
  const text = JSON.stringify(object);
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

export const getDecrypted = <T extends unknown>(cipher: string): T => {
  const a = JSON.parse(cipher) as Array<string>;
  const salt = Buffer.from(a[1], "base64");
  const key = crypto.scryptSync(password, salt, 32); // Key derivation
  const iv = Buffer.from(a[2], "base64");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(a[0], "hex", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
};
