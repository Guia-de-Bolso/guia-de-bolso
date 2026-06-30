import assert from "node:assert/strict";
import { shouldUseAppViewportShell } from "./appViewport.js";

assert.equal(shouldUseAppViewportShell("/"), true);
assert.equal(shouldUseAppViewportShell("/perfil"), true);
assert.equal(shouldUseAppViewportShell("/lugares/abc"), true);
assert.equal(shouldUseAppViewportShell("/admin"), false);
assert.equal(shouldUseAppViewportShell("/admin/lugares"), false);
assert.equal(shouldUseAppViewportShell("/landing"), false);
assert.equal(shouldUseAppViewportShell("/para-negocios"), false);

assert.equal(shouldUseAppViewportShell("/", "guiadebolso.app"), false);
assert.equal(shouldUseAppViewportShell("/", "www.guiadebolso.app"), false);
assert.equal(shouldUseAppViewportShell("/baixar", "guiadebolso.app"), false);
assert.equal(shouldUseAppViewportShell("/perfil", "app.guiadebolso.app"), true);
assert.equal(shouldUseAppViewportShell("/", "app.guiadebolso.app"), true);

console.log("appViewport.test.js: ok");
