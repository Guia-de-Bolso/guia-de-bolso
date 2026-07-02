import assert from "node:assert/strict";
import { resolveApiUrl } from "./fetchApi.js";

const previous = process.env.NEXT_PUBLIC_CAPACITOR_API_ORIGIN;
process.env.NEXT_PUBLIC_CAPACITOR_API_ORIGIN = "";

assert.equal(resolveApiUrl("/api/buscar"), "/api/buscar");

process.env.NEXT_PUBLIC_CAPACITOR_API_ORIGIN = "https://app.guiadebolso.app/";

assert.equal(
  resolveApiUrl("/api/explorar"),
  "https://app.guiadebolso.app/api/explorar"
);

process.env.NEXT_PUBLIC_CAPACITOR_API_ORIGIN = previous ?? "";

console.log("fetchApi.test.js: ok");
