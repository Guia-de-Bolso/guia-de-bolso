import assert from "node:assert/strict";
import { shouldUseAppViewportShell } from "./appViewport.js";

assert.equal(shouldUseAppViewportShell("/"), true);
assert.equal(shouldUseAppViewportShell("/perfil"), true);
assert.equal(shouldUseAppViewportShell("/lugares/abc"), true);
assert.equal(shouldUseAppViewportShell("/admin"), false);
assert.equal(shouldUseAppViewportShell("/admin/lugares"), false);
assert.equal(shouldUseAppViewportShell("/landing"), false);
assert.equal(shouldUseAppViewportShell("/para-negocios"), false);

console.log("appViewport.test.js: ok");
