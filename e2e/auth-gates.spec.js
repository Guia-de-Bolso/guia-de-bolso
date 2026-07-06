// @ts-check
import { test, expect } from "@playwright/test";
import { baseURL, skipOnboarding } from "./helpers.js";

const roteiroPayload = {
  dias: "2",
  perfil: "casal",
  interesses: ["praia"],
};

test.describe("auth gates — API", () => {
  test("POST /api/buscar without session returns 401 LOGIN_REQUIRED", async ({ request }) => {
    const res = await request.post(`${baseURL}/api/buscar`, {
      data: { query: "praia perto de mim" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("LOGIN_REQUIRED");
  });

  test("POST /api/roteiro without session returns 401 LOGIN_REQUIRED", async ({ request }) => {
    const res = await request.post(`${baseURL}/api/roteiro`, {
      data: roteiroPayload,
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("LOGIN_REQUIRED");
  });

  test("POST /api/roteiro/salvar without session returns 401 LOGIN_REQUIRED", async ({ request }) => {
    const res = await request.post(`${baseURL}/api/roteiro/salvar`, {
      data: {
        titulo: "Roteiro teste",
        dias: "2",
        perfil: "casal",
        interesses: ["praia"],
        conteudo: "# Dia 1\n\nTeste",
      },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("LOGIN_REQUIRED");
  });

  test("DELETE /api/conta without session returns 401", async ({ request }) => {
    const res = await request.delete(`${baseURL}/api/conta`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("UNAUTHORIZED");
  });

  test("GET /api/cron/lugares-purge without secret returns 401", async ({ request }) => {
    const res = await request.get(`${baseURL}/api/cron/lugares-purge`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });
});

test.describe("auth gates — UI", () => {
  test("home guest search opens login modal for IA busca", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto(baseURL);

    await page.getByPlaceholder("O que você quer descobrir hoje?").fill("restaurante à beira-mar");
    await page.getByRole("button", { name: "Buscar" }).click();

    await expect(
      page.getByText("Faça login para buscar lugares com inteligência artificial")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar com Google" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Agora não" })).toBeVisible();
  });

  test("home guest quick chip opens login modal for IA busca", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto(baseURL);

    await page.getByRole("button", { name: /Lugares calmos/i }).click();

    await expect(
      page.getByText("Faça login para buscar lugares com inteligência artificial")
    ).toBeVisible();
  });

  test("admin guest redirects to login with return path", async ({ page }) => {
    await page.goto(`${baseURL}/admin`);
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/next=%2Fadmin|next=\/admin/);
  });
});
