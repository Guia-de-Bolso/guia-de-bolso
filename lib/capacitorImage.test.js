import assert from "node:assert/strict";
import { resolveCapacitorGallerySrc } from "./capacitorImage.js";

assert.equal(
  resolveCapacitorGallerySrc({
    url: "https://a.test/full.webp",
    thumb: "https://a.test/thumb.webp",
    isActive: false,
    isAdjacent: false,
  }),
  "https://a.test/full.webp"
);

assert.equal(
  resolveCapacitorGallerySrc({
    url: "https://a.test/full.webp",
    thumb: "https://a.test/thumb.webp",
    isActive: true,
    isAdjacent: false,
  }),
  "https://a.test/full.webp"
);

console.log("capacitorImage.test.js: ok");
