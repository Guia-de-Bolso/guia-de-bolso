import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { preloadGalleryPhotos } from "./galleryPhotoPreload.js";

describe("galleryPhotoPreload", () => {
  it("não quebra sem window", () => {
    assert.doesNotThrow(() => preloadGalleryPhotos(["https://example.com/a.jpg"], 0));
  });
});
