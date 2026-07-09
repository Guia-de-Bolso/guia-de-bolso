import assert from "node:assert/strict";
import {
  buildFotosUrlsFromPhotoItems,
  movePhotoItem,
  movePhotoItemToCover,
} from "./photoItems.js";

const items = [
  { id: "a", existing: true, url: "https://a.test/1.jpg" },
  { id: "b", existing: true, url: "https://a.test/2.jpg" },
  { id: "c", existing: true, url: "https://a.test/3.jpg" },
];

assert.deepEqual(
  movePhotoItem(items, "b", -1).map((item) => item.id),
  ["b", "a", "c"]
);
assert.deepEqual(
  movePhotoItem(items, "b", 1).map((item) => item.id),
  ["a", "c", "b"]
);
assert.deepEqual(movePhotoItem(items, "a", -1), items);
assert.deepEqual(movePhotoItem(items, "c", 1), items);

assert.deepEqual(
  movePhotoItemToCover(items, "c").map((item) => item.id),
  ["c", "a", "b"]
);

assert.deepEqual(
  buildFotosUrlsFromPhotoItems(
    [
      { id: "a", existing: true, url: "https://a.test/1.jpg", thumbUrl: "https://a.test/1-thumb.jpg" },
      { id: "b", existing: true, url: "https://a.test/2.jpg" },
      { id: "c", existing: true, url: "https://a.test/3.jpg" },
    ],
    []
  ),
  [
    { url: "https://a.test/1.jpg", thumb: "https://a.test/1-thumb.jpg" },
    "https://a.test/2.jpg",
    "https://a.test/3.jpg",
  ]
);

assert.deepEqual(
  buildFotosUrlsFromPhotoItems(
    [
      { id: "a", existing: true, url: "https://a.test/1.jpg" },
      { id: "pending", file: new File([], "x.jpg"), existing: false },
    ],
    [{ url: "https://a.test/new-full.webp", thumb: "https://a.test/new-thumb.webp", blur: "data:image/jpeg;base64,new" }]
  ),
  [
    "https://a.test/1.jpg",
    {
      url: "https://a.test/new-full.webp",
      thumb: "https://a.test/new-thumb.webp",
      blur: "data:image/jpeg;base64,new",
    },
  ]
);

assert.deepEqual(buildFotosUrlsFromPhotoItems(movePhotoItem(items, "b", -1)), [
  "https://a.test/2.jpg",
  "https://a.test/1.jpg",
  "https://a.test/3.jpg",
]);

console.log("photoItems.test.js: ok");
