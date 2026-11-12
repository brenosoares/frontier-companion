import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("constructs section", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("lists constructs and decorations by build-menu category", async ({ page }) => {
    await page.goto("/pt-BR/constructs");

    await expect(
      page.getByRole("heading", { level: 1, name: "Construções e decorações" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Construções" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Decorações" })).toBeVisible();
    for (const name of ["Armazenamento", "Cercas", "Móveis", "Luzes"]) {
      await expect(page.getByRole("link", { name: new RegExp(`^${name}`) }).first()).toBeVisible();
    }
  });

  test("the sidebar highlights Construções, also on a category and a construct", async ({
    page,
  }) => {
    const sidebar = page.getByRole("navigation", { name: "Navegação principal" });
    for (const path of [
      "/pt-BR/constructs",
      "/pt-BR/constructs/category/constructs-storage",
      "/pt-BR/constructs/StorageBox",
    ]) {
      await page.goto(path);
      await expect(sidebar.getByRole("link", { name: "Construções" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }
  });

  test("navigates from the hub to a category to a construct and back", async ({ page }) => {
    await page.goto("/pt-BR/constructs");
    await page.getByRole("link", { name: /^Armazenamento/ }).click();
    await expect(page).toHaveURL(/\/pt-BR\/constructs\/category\/constructs-storage$/);

    await page.locator('a[href$="/constructs/StorageBox"]').click();
    await expect(page).toHaveURL(/\/pt-BR\/constructs\/StorageBox$/);

    await page.getByRole("link", { name: "Voltar para Armazenamento" }).click();
    await expect(page).toHaveURL(/\/constructs\/category\/constructs-storage$/);
    await page.getByRole("link", { name: "Voltar para construções" }).click();
    await expect(page).toHaveURL(/\/pt-BR\/constructs$/);
  });

  test("is localized", async ({ page }) => {
    await page.goto("/en/constructs");
    await expect(
      page.getByRole("heading", { level: 1, name: "Constructs and decorations" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /^Storage/ }).first()).toBeVisible();
  });

  test("old recipe URLs redirect, and unknown paths answer 404", async ({ page, request }) => {
    await page.goto("/pt-BR/recipes/constructs/StorageBox");
    await expect(page).toHaveURL(/\/pt-BR\/constructs\/StorageBox$/);

    await page.goto("/en/recipes/decorations-furniture");
    await expect(page).toHaveURL(/\/en\/constructs\/category\/decorations-furniture$/);

    expect((await request.get("/pt-BR/constructs/Nope")).status()).toBe(404);
    expect((await request.get("/pt-BR/constructs/category/nope")).status()).toBe(404);
    // A crafting family is not a construct category, and vice versa.
    expect((await request.get("/pt-BR/constructs/category/craft-Furnace")).status()).toBe(404);
  });
});

test.describe("constructs accessibility (axe)", () => {
  for (const colorScheme of ["dark", "light"] as const) {
    for (const path of ["/pt-BR/constructs", "/en/constructs"]) {
      test(`${path} in ${colorScheme} theme has no violations`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
});
