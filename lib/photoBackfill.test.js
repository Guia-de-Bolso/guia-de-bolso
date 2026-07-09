import assert from "node:assert/strict";
import {
  buildPublicStorageUrl,
  buildThumbStoragePath,
  getPhotoDerivativeBackfillNeeds,
  inferThumbPublicUrl,
  isManagedStoragePhotoUrl,
  listPhotoEntriesForEntity,
  mergePhotoDerivativeBackfill,
  parseStoragePublicUrl,
} from "./photoBackfill.js";

const SUPABASE = "https://rsdjbqzjdyeaedyqwrvc.supabase.co";
const FULL_URL = `${SUPABASE}/storage/v1/object/public/lugares-fotos/abc/1700000000-praia.webp`;

assert.equal(isManagedStoragePhotoUrl(FULL_URL), true);
assert.equal(isManagedStoragePhotoUrl("https://picsum.photos/200"), false);

assert.deepEqual(parseStoragePublicUrl(FULL_URL), {
  bucket: "lugares-fotos",
  path: "abc/1700000000-praia.webp",
});

assert.equal(
  buildThumbStoragePath("abc/1700000000-praia.webp"),
  "abc/1700000000-praia-thumb.webp"
);

assert.equal(
  inferThumbPublicUrl(FULL_URL, SUPABASE),
  `${SUPABASE}/storage/v1/object/public/lugares-fotos/abc/1700000000-praia-thumb.webp`
);

assert.equal(
  buildPublicStorageUrl(SUPABASE, "lugares-fotos", "abc/foto.webp"),
  `${SUPABASE}/storage/v1/object/public/lugares-fotos/abc/foto.webp`
);

assert.equal(
  getPhotoDerivativeBackfillNeeds("https://a.test/1.jpg").needed,
  true
);

assert.equal(
  getPhotoDerivativeBackfillNeeds({
    url: "https://a.test/full.webp",
    thumb: "https://a.test/thumb.webp",
    blur: "data:image/jpeg;base64,x",
  }).needed,
  false
);

assert.equal(
  getPhotoDerivativeBackfillNeeds({
    url: "https://a.test/full.webp",
    thumb: "https://a.test/thumb.webp",
  }).missingBlur,
  true
);

assert.deepEqual(
  listPhotoEntriesForEntity({ fotos: ["https://a.test/1.jpg"] }),
  [{ entry: "https://a.test/1.jpg", index: 0, promoteLegacy: false }]
);

assert.deepEqual(
  listPhotoEntriesForEntity(
    { imagem_url: "https://a.test/legado.jpg" },
    { legacyUrlField: "imagem_url" }
  ),
  [{ entry: "https://a.test/legado.jpg", index: 0, promoteLegacy: true }]
);

assert.deepEqual(
  mergePhotoDerivativeBackfill(
    { url: "https://a.test/full.webp", thumb: "https://a.test/full.webp" },
    {
      thumbUrl: "https://a.test/thumb.webp",
      blur: "data:image/jpeg;base64,abc",
    }
  ),
  {
    url: "https://a.test/full.webp",
    thumb: "https://a.test/thumb.webp",
    blur: "data:image/jpeg;base64,abc",
  }
);

console.log("photoBackfill.test.js: ok");
