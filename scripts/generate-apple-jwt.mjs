import fs from "node:fs";
import jwt from "jsonwebtoken";

const TEAM_ID = "V4FTHNLS6A";
const KEY_ID = "98S7G525YW";
const CLIENT_ID = "app.guiadebolso.auth";
const P8_PATH = "/Users/brunodisliler/Documents/RecoveryCodes/Apple-AuthKey_98S7G525YW.p8";

const privateKey = fs.readFileSync(P8_PATH, "utf8");
const now = Math.floor(Date.now() / 1000);
const exp = now + 60 * 60 * 24 * 180;

const token = jwt.sign(
  {
    iss: TEAM_ID,
    iat: now,
    exp,
    aud: "https://appleid.apple.com",
    sub: CLIENT_ID,
  },
  privateKey,
  {
    algorithm: "ES256",
    header: {
      kid: KEY_ID,
    },
  }
);

console.log(token);
