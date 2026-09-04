import assert from "node:assert/strict";
import {
  buildHeroGalleryItems,
  getGalleryPhotoPreloadIndex,
  getGalleryPhotosForPreload,
  getGalleryVideoLayout,
  isGalleryChromeTarget,
  isGalleryTapGesture,
  isGalleryVideoItem,
} from "./galleryMedia.js";

assert.deepEqual(buildHeroGalleryItems(["https://a.test/1.jpg"], null), [
  { type: "photo", url: "https://a.test/1.jpg" },
]);

assert.deepEqual(
  buildHeroGalleryItems(
    [{ url: "https://a.test/1.jpg", thumb: "https://a.test/t.jpg" }],
    "https://a.test/clip.mp4"
  ),
  [
    {
      type: "video",
      url: "https://a.test/clip.mp4",
      poster: "https://a.test/1.jpg",
    },
    { type: "photo", url: "https://a.test/1.jpg", thumb: "https://a.test/t.jpg" },
  ]
);

assert.deepEqual(buildHeroGalleryItems([], "https://a.test/clip.mp4", "https://a.test/p.jpg"), [
  { type: "video", url: "https://a.test/clip.mp4", poster: "https://a.test/p.jpg" },
]);

const withVideo = buildHeroGalleryItems(["https://a.test/1.jpg", "https://a.test/2.jpg"], "https://v.test/a.mp4");
assert.equal(isGalleryVideoItem(withVideo[0]), true);
assert.equal(isGalleryVideoItem(withVideo[1]), false);
assert.deepEqual(getGalleryPhotosForPreload(withVideo), [
  { url: "https://a.test/1.jpg" },
  { url: "https://a.test/2.jpg" },
]);
assert.equal(getGalleryPhotoPreloadIndex(withVideo, 0), 0);
assert.equal(getGalleryPhotoPreloadIndex(withVideo, 1), 0);
assert.equal(getGalleryPhotoPreloadIndex(withVideo, 2), 1);

assert.equal(
  isGalleryTapGesture({ x: 10, y: 10, t: 1000 }, { x: 14, y: 12, t: 1100 }),
  true
);
assert.equal(
  isGalleryTapGesture({ x: 10, y: 10, t: 1000 }, { x: 40, y: 10, t: 1100 }),
  false
);
assert.equal(
  isGalleryTapGesture({ x: 10, y: 10, t: 1000 }, { x: 10, y: 10, t: 1600 }),
  false
);
assert.equal(isGalleryChromeTarget(null), false);

assert.equal(getGalleryVideoLayout(1080, 1920), "portrait");
assert.equal(getGalleryVideoLayout(1920, 1080), "landscape");
assert.equal(getGalleryVideoLayout(1080, 1080), "landscape");
assert.equal(getGalleryVideoLayout(0, 1920), "unknown");

console.log("galleryMedia.test.js: ok");
