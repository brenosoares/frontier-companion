import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Facts below come from the committed dataset (data/processed): 285 items.
const ITEM_COUNT = 285;

test.describe("items catalog", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("lists every item: all feature flags are confirmed as released, so nothing is hidden", async ({
    page,
  }) => {
    await page.goto("/pt-BR/items");

    await expect(page.getByRole("heading", { level: 1, name: "Itens" })).toBeVisible();
    await expect(page.getByRole("status")).toHaveText(`${ITEM_COUNT} itens`);
    await expect(page.getByRole("link", { name: /Óleo de Rubimora/ })).toBeVisible();
    await expect(page.getByLabel("Mostrar conteúdo possivelmente indisponível")).toHaveCount(0);
  });

  test("filters by text ignoring accents, and mirrors the filter in the URL", async ({ page }) => {
    await page.goto("/pt-BR/items");
    await page.getByRole("searchbox", { name: "Filtrar itens" }).fill("minerio cobre");

    await expect(page.getByRole("status")).toHaveText("1 item");
    await expect(page.getByRole("link", { name: /Minério de Cobre/ })).toBeVisible();
    await expect(page).toHaveURL(/q=minerio\+cobre|q=minerio%20cobre/);
  });

  test("finds items by their English name while browsing in Portuguese", async ({ page }) => {
    await page.goto("/pt-BR/items");
    await page.getByRole("searchbox", { name: "Filtrar itens" }).fill("copper ore");

    await expect(page.getByRole("link", { name: /Minério de Cobre/ })).toBeVisible();
  });

  test("filters by category and sorts by value", async ({ page }) => {
    await page.goto("/pt-BR/items");
    await page.getByLabel("Categoria").selectOption("Metal");
    const metalCount = await page.getByRole("status").innerText();
    expect(parseInt(metalCount)).toBeLessThan(ITEM_COUNT);

    await page.getByLabel("Ordenar por").selectOption("value");
    await expect(page).toHaveURL(/tag=Metal/);
    await expect(page).toHaveURL(/sort=value/);
  });

  test("restores filters from a shared URL", async ({ page }) => {
    await page.goto("/en/items?q=bronze&sort=weight");

    await expect(page.getByRole("searchbox", { name: "Filter items" })).toHaveValue("bronze");
    await expect(page.getByLabel("Sort by")).toHaveValue("weight");
  });

  test("header search jumps to the catalog with the query applied", async ({ page }) => {
    await page.goto("/pt-BR");
    await page.getByRole("banner").getByRole("searchbox", { name: "Buscar" }).fill("bronze");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/pt-BR\/items\?q=bronze/);
    await expect(page.getByRole("searchbox", { name: "Filtrar itens" })).toHaveValue("bronze");
    await expect(page.getByRole("link", { name: /Barra de Bronze/ })).toBeVisible();
  });

  test("marks Items as the current page in the sidebar", async ({ page }) => {
    await page.goto("/pt-BR/items/BronzeBar");
    const sidebar = page.getByRole("navigation", { name: "Navegação principal" });
    await expect(sidebar.getByRole("link", { name: "Itens" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

test.describe("item detail", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("shows the item, how to make it and where it is used", async ({ page }) => {
    await page.goto("/pt-BR/items/BronzeBar");

    await expect(page.getByRole("heading", { level: 1, name: "Barra de Bronze" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Como fazer" })).toBeVisible();
    // Three recipes (1x, 5x, 25x), each made in a different furnace tier.
    await expect(page.getByRole("link", { name: "25× Minério de Cobre" })).toBeVisible();
    await expect(page.getByText("Fornalha", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Usado em" })).toBeVisible();
  });

  test("raw items show where to find them instead of a recipe", async ({ page }) => {
    await page.goto("/pt-BR/items/CopperOre");

    await expect(page.getByRole("heading", { level: 2, name: "Onde encontrar" })).toBeVisible();
    await expect(page.getByText("Depósito de Cobre Pequeno")).toBeVisible();
    await expect(page.getByText("Ao quebrar ou coletar").first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Como fazer" })).toHaveCount(0);
  });

  test("items without a known origin say so honestly", async ({ page }) => {
    await page.goto("/pt-BR/items/Clam");

    await expect(page.getByRole("heading", { level: 2, name: "Onde encontrar" })).toBeVisible();
    await expect(page.getByText("Não identificamos nos dados do jogo")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Como fazer" })).toHaveCount(0);
  });

  test("shows the item's pixel-art icon, loaded", async ({ page }) => {
    await page.goto("/pt-BR/items/BronzeBar");

    const icon = page.getByRole("article").locator("header img").first();
    await expect(icon).toHaveAttribute("src", "/icons/items/BronzeBarIcon.png");
    await expect(icon).toBeVisible();
    await expect
      .poll(() => icon.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
  });

  test("recipes show the icon of every ingredient and of the result", async ({ page }) => {
    await page.goto("/pt-BR/items/BronzeBar");

    const section = page.locator("section").filter({
      has: page.getByRole("heading", { level: 2, name: "Como fazer" }),
    });
    const firstRecipe = section.locator(":scope > ul > li").first();
    await expect(firstRecipe.locator("img")).toHaveCount(4); // 3 ingredients + the bar
    await expect(firstRecipe.locator('img[src="/icons/items/CopperOreIcon.png"]')).toBeVisible();
  });

  test("ingredient links navigate to the ingredient page", async ({ page }) => {
    await page.goto("/pt-BR/items/BronzeBar");
    await page.getByRole("link", { name: "1× Minério de Cobre" }).click();

    await expect(page).toHaveURL(/\/pt-BR\/items\/CopperOre$/);
    await expect(page.getByRole("heading", { level: 1, name: "Minério de Cobre" })).toBeVisible();
    // It is an ingredient of the bronze bar, listed under "Usado em".
    await expect(page.getByRole("link", { name: "1× Barra de Bronze" }).first()).toBeVisible();
  });

  test("is localized", async ({ page }) => {
    await page.goto("/en/items/BronzeBar");
    await expect(page.getByRole("heading", { level: 1, name: "Bronze Bar" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "How to make" })).toBeVisible();
  });

  test("language switcher keeps the item", async ({ page }) => {
    await page.goto("/pt-BR/items/BronzeBar");
    await page
      .getByRole("navigation", { name: "Idioma" })
      .getByRole("link", { name: "EN" })
      .click();
    await expect(page).toHaveURL(/\/en\/items\/BronzeBar$/);
  });

  test("returns 404 for an unknown item", async ({ request }) => {
    const response = await request.get("/pt-BR/items/DoesNotExist");
    expect(response.status()).toBe(404);
  });
});

test.describe("accessibility (axe)", () => {
  const pages = [
    "/pt-BR/items",
    "/en/items",
    "/pt-BR/items?q=bronze&tag=Metal&sort=value&unavailable=1",
    "/pt-BR/items/BronzeBar",
    "/en/items/BronzeBar",
    "/pt-BR/items/AdvancedFuel1",
    "/pt-BR/items/CopperOre",
    "/en/items/CopperOre",
    "/pt-BR/items/Clam",
  ];

  for (const scheme of ["dark", "light"] as const) {
    for (const path of pages) {
      test(`${path} in ${scheme} theme has no violations`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        // Wait for the client explorer to replace its Suspense fallback.
        if (path.includes("/items") && !/items\/\w/.test(path)) {
          await expect(page.getByRole("status")).toBeVisible();
        }

        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 375, height: 700 } });

  for (const path of ["/pt-BR/items", "/pt-BR/items/BronzeBar"]) {
    test(`${path} has no horizontal scroll`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
