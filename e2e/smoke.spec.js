// @ts-check
import { test, expect } from "@playwright/test";
import { baseURL, skipOnboarding } from "./helpers.js";

test.describe("smoke", () => {
  test("health endpoint", async ({ request }) => {
    const res = await request.get(`${baseURL}/api/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe("guia-de-bolso");
  });

  test("home loads with search and bottom nav", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto(baseURL);
    await expect(page.getByPlaceholder("O que você quer descobrir hoje?")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Explorar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Montar meu dia" })).toBeVisible();
  });

  test("login page renders auth options", async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await expect(page.getByRole("heading", { name: /descoberta começa aqui/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar com Google" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Continuar sem login" })).toBeVisible();
  });

  test("explorar page renders category discovery", async ({ page }) => {
    await page.goto(`${baseURL}/categorias`);
    await expect(page.getByRole("heading", { name: "Explorar", exact: true })).toBeVisible();
    // Shell estático — não exige Supabase real (CI usa placeholders).
    await expect(page.getByText("Descoberta local")).toBeVisible();
  });

  test("roteiros page renders header", async ({ page }) => {
    await page.goto(`${baseURL}/roteiros`);
    await expect(page.getByRole("heading", { name: "Roteiros", exact: true })).toBeVisible();
  });

  test("favoritos guest sees login gate", async ({ page }) => {
    await page.goto(`${baseURL}/favoritos`);
    await expect(page.getByRole("heading", { name: "Faça login para ver seus favoritos" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Fazer login" })).toBeVisible();
  });

  test("favoritos guest login button opens auth modal", async ({ page }) => {
    await page.goto(`${baseURL}/favoritos`);
    await page.getByRole("button", { name: "Fazer login" }).click();
    await expect(page.getByRole("button", { name: "Entrar com Google" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Agora não" })).toBeVisible();
  });

  test("perfil guest sees benefits and auth", async ({ page }) => {
    await page.goto(`${baseURL}/perfil`);
    await expect(page.getByText("Entre para personalizar o Guia.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar com Google" })).toBeVisible();
  });

  test("bottom nav navigates to explorar", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto(baseURL);
    await page.getByRole("link", { name: "Explorar" }).click();
    await expect(page).toHaveURL(/\/categorias/);
    await expect(page.getByRole("heading", { name: "Explorar", exact: true })).toBeVisible();
  });
});
