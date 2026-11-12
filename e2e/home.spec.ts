import { expect, test } from "@playwright/test";

test("root redirects to the default locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/pt-BR$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
});

test("unknown locale returns 404", async ({ request }) => {
  const response = await request.get("/fr");
  expect(response.status()).toBe(404);
});

test("sends baseline security headers and hides the framework", async ({ request }) => {
  const response = await request.get("/pt-BR");
  const headers = response.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-powered-by"]).toBeUndefined();
});
