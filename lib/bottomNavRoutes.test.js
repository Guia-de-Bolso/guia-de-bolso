import assert from "node:assert/strict";
import { BOTTOM_NAV_HREFS, BOTTOM_NAV_ROUTES } from "./bottomNavRoutes.js";

assert.equal(BOTTOM_NAV_ROUTES.length, 5);
assert.deepEqual(BOTTOM_NAV_HREFS, [
  "/",
  "/categorias",
  "/atrativos",
  "/favoritos",
  "/perfil",
]);

console.log("bottomNavRoutes.test.js: ok");
