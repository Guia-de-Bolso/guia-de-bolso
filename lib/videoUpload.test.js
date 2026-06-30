import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isMp4VideoFile, needsVideoCompression, canUploadVideoAsIs } from "./videoCompress.js";
import {
  formatVideoDuration,
  formatVideoFileSize,
  isAcceptedVideoFile,
  LUGAR_VIDEO_LIMITS,
} from "./videoUpload.js";

describe("videoUpload", () => {
  it("aceita mp4, mov e webm", () => {
    assert.equal(isAcceptedVideoFile({ type: "video/mp4", name: "a.mp4" }), true);
    assert.equal(isAcceptedVideoFile({ type: "video/quicktime", name: "a.mov" }), true);
    assert.equal(isAcceptedVideoFile({ type: "video/webm", name: "a.webm" }), true);
    assert.equal(isAcceptedVideoFile({ type: "image/jpeg", name: "a.jpg" }), false);
  });

  it("formata tamanho e duração", () => {
    assert.equal(formatVideoFileSize(512 * 1024), "512 KB");
    assert.equal(formatVideoFileSize(2.5 * 1024 * 1024), "2.5 MB");
    assert.equal(formatVideoDuration(45), "45s");
    assert.equal(formatVideoDuration(75), "1:15");
  });

  it("expõe limites de entrada e saída", () => {
    assert.ok(LUGAR_VIDEO_LIMITS.maxInputBytes > LUGAR_VIDEO_LIMITS.maxOutputBytes);
    assert.equal(LUGAR_VIDEO_LIMITS.maxDurationSeconds, 60);
  });
});

describe("videoCompress helpers", () => {
  it("detecta mp4", () => {
    assert.equal(isMp4VideoFile({ type: "video/mp4", name: "clip.mp4" }), true);
    assert.equal(isMp4VideoFile({ type: "video/quicktime", name: "clip.mov" }), false);
  });

  it("só pede compressão acima de 25 MB", () => {
    const smallMp4 = { type: "video/mp4", name: "ok.mp4", size: 3.8 * 1024 * 1024 };
    assert.equal(needsVideoCompression(smallMp4), false);
    assert.equal(canUploadVideoAsIs(smallMp4), true);

    const hdMp4 = { type: "video/mp4", name: "4k.mp4", size: 15 * 1024 * 1024 };
    assert.equal(needsVideoCompression(hdMp4), false);

    const hugeMp4 = { type: "video/mp4", name: "big.mp4", size: 80 * 1024 * 1024 };
    assert.equal(needsVideoCompression(hugeMp4), true);

    const mov = { type: "video/quicktime", name: "iphone.mov", size: 3.8 * 1024 * 1024 };
    assert.equal(needsVideoCompression(mov), false);
    assert.equal(canUploadVideoAsIs(mov), true);
  });
});
