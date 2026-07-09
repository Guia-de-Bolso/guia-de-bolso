import assert from "node:assert/strict";
import {
  applyGalleryVisibility,
  mergeGalleryPhotos,
  normalizeGalleryPhotos,
} from "./photoGallery.js";

assert.deepEqual(normalizeGalleryPhotos(["https://a.test/1.jpg"]), [
  { url: "https://a.test/1.jpg" },
]);

assert.deepEqual(
  normalizeGalleryPhotos([
    {
      url: "https://a.test/full.webp",
      thumb: "https://a.test/thumb.webp",
      blur: "data:image/jpeg;base64,x",
    },
  ]),
  [
    {
      url: "https://a.test/full.webp",
      thumb: "https://a.test/thumb.webp",
      blur: "data:image/jpeg;base64,x",
    },
  ]
);

assert.deepEqual(
  mergeGalleryPhotos(
    {
      fotos: [
        {
          url: "https://a.test/full.webp",
          thumb: "https://a.test/thumb.webp",
          blur: "data:image/jpeg;base64,x",
        },
      ],
    },
    ["https://a.test/full.webp"]
  ),
  [
    {
      url: "https://a.test/full.webp",
      thumb: "https://a.test/thumb.webp",
      blur: "data:image/jpeg;base64,x",
    },
  ]
);

assert.deepEqual(
  applyGalleryVisibility(
    [
      { url: "https://a.test/1.jpg" },
      { url: "https://a.test/2.jpg" },
    ],
    "https://a.test/2.jpg",
    false
  ),
  [{ url: "https://a.test/2.jpg" }]
);

console.log("photoGallery.test.js: ok");
