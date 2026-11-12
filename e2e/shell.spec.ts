import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["", "/privacy", "/terms", "/cookies"];
const LOCALES = ["pt-BR", "en"];
const SCHEMES = ["dark", "light"] as const;

test.describe("accessibility (axe)", () => {
  for (const scheme of SCHEMES) {
    for (const locale of LOCALES) {
      for (const path of PAGES) {
        test(`/${locale}${path} in ${scheme} theme has no violations`, async ({ page }) => {
          await page.emulateMedia({ colorScheme: scheme });
          await page.goto(`/${locale}${path}`);
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

          const results = await new AxeBuilder({ page }).analyze();
          expect(results.violations).toEqual([]);
        });
      }
    }
  }
});

test.describe("desktop layout", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("shows the sidebar on the left and header, content and footer on the right", async ({
    page,
  }) => {
    await page.goto("/pt-BR");

    const sidebar = page.getByRole("navigation", { name: "Navegação principal" });
    await expect(sidebar.getByRole("link", { name: "Início" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    const sidebarBox = await sidebar.boundingBox();
    const main = await page.getByRole("main").boundingBox();
    expect(sidebarBox!.x).toBeLessThan(main!.x);

    await expect(
      page.getByRole("banner").getByRole("link", { name: /Frontier Companion/ }),
    ).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Buscar" })).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByText(/Projeto de fãs, não oficial/),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir menu" })).toBeHidden();
  });

  test("footer links reach the legal pages", async ({ page }) => {
    await page.goto("/pt-BR");
    await page
      .getByRole("contentinfo")
      .getByRole("link", { name: "Política de Privacidade" })
      .click();
    await expect(page).toHaveURL(/\/pt-BR\/privacy$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Política de Privacidade" }),
    ).toBeVisible();
  });

  test("language switcher keeps the current page", async ({ page }) => {
    await page.goto("/pt-BR/privacy");
    await page
      .getByRole("navigation", { name: "Idioma" })
      .getByRole("link", { name: "EN" })
      .click();

    await expect(page).toHaveURL(/\/en\/privacy$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeVisible();
  });

  test("skip link moves focus to the main content", async ({ page }) => {
    await page.goto("/pt-BR");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Pular para o conteúdo" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
  });
});

test.describe("mobile layout", () => {
  test.use({ viewport: { width: 375, height: 700 } });

  test("hides the sidebar and offers an accessible off-canvas menu", async ({ page }) => {
    await page.goto("/pt-BR");
    await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeHidden();

    await page.getByRole("button", { name: "Abrir menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Menu de navegação" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Início" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "Abrir menu" })).toBeFocused();
  });

  test("has no horizontal scroll", async ({ page }) => {
    await page.goto("/pt-BR");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("menu dialog has no accessibility violations when open", async ({ page }) => {
    await page.goto("/pt-BR");
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
