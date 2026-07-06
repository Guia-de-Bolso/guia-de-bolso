// @ts-check

/** Base URL usada pelos testes E2E (CI sobe `npm run start` via playwright.config). */
export const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

/**
 * Evita overlay de onboarding em sessões novas do Playwright.
 * @param {import("@playwright/test").Page} page
 */
export async function skipOnboarding(page) {
  await page.addInitScript(() => {
    localStorage.setItem("onboarding_visto", "1");
  });
}
