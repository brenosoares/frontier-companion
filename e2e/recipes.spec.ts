import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/*
 * Facts below come from the committed dataset (data/processed). Counts that depend on which feature
 * flags are treated as released (see RELEASED_FEATURE_FLAGS) are deliberately not asserted.
 */
test.describe("recipes hub", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("starts with the crafting machines; constructs live in their own section", async ({
    page,
  }) => {
    await page.goto("/pt-BR/recipes");

    await expect(page.getByRole("heading", { level: 1, name: "Receitas" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Fabricação" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(0);

    for (const name of ["Fornalha", "Montador"]) {
      await expect(page.getByRole("link", { name: new RegExp(`^${name}`) }).first()).toBeVisible();
    }
    await expect(page.getByRole("link", { name: /^Armazenamento/ })).toHaveCount(0);
  });

  test("shows how many entries each category has", async ({ page }) => {
    await page.goto("/pt-BR/recipes");

    await expect(page.getByRole("link", { name: /^Fornalha\s+\d+ itens/ }).first()).toBeVisible();
    await expect(page.getByText(/possivelmente indisponíveis/)).toHaveCount(0);
  });

  test("the sidebar highlights Receitas", async ({ page }) => {
    await page.goto("/pt-BR/recipes");
    const sidebar = page.getByRole("navigation", { name: "Navegação principal" });
    await expect(sidebar.getByRole("link", { name: "Receitas" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(sidebar.getByRole("link", { name: "Calculadora" })).toBeVisible();
  });

  test("is localized", async ({ page }) => {
    await page.goto("/en/recipes");
    await expect(page.getByRole("heading", { level: 2, name: "Crafting" })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Furnace/ }).first()).toBeVisible();
  });
});

test.describe("a construct category", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("shows cards with icon, name, cost and where it is made", async ({ page }) => {
    await page.goto("/pt-BR/constructs/category/constructs-storage");

    await expect(page.getByRole("heading", { level: 1, name: "Armazenamento" })).toBeVisible();
    const card = page.getByRole("link", { name: /Caixa de Madeira/ });
    await expect(card).toContainText("Custo");
    await expect(card).toContainText("10×");
    await expect(card).toContainText("Modo de construção");
    await expect(card.locator("img").first()).toHaveAttribute(
      "src",
      /\/icons\/constructs\/.+\.png/,
    );
    // Every cost line carries its item's icon, like on the construct page.
    await expect(card.locator('img[src^="/icons/items/"]').first()).toBeVisible();
  });

  test("clicking a card opens the construct's details", async ({ page }) => {
    await page.goto("/pt-BR/constructs/category/constructs-storage");
    await page.locator('a[href$="/constructs/StorageBox"]').click();

    await expect(page).toHaveURL(/\/pt-BR\/constructs\/\w+$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Caixa de Armazenamento" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Custo de construção" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Como obter" })).toBeVisible();
    await expect(page.getByText("Construa no modo de construção do jogo.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Voltar para Armazenamento" })).toBeVisible();
  });

  test("a construct's cost links to the item page", async ({ page }) => {
    await page.goto("/pt-BR/constructs/category/constructs-storage");
    await page.locator('a[href$="/constructs/StorageBox"]').click();
    await page.getByRole("link", { name: "Madeira", exact: true }).click();

    await expect(page).toHaveURL(/\/pt-BR\/items\/Wood$/);
  });

  test("filters by name or ingredient and mirrors the filter in the URL", async ({ page }) => {
    await page.goto("/pt-BR/constructs/category/constructs-storage");
    const status = page.getByRole("status");
    const before = parseInt(await status.innerText());

    await page.getByRole("searchbox", { name: "Filtrar" }).fill("fibra");
    await expect(page).toHaveURL(/q=fibra/);
    await expect.poll(async () => parseInt(await status.innerText())).toBeLessThan(before);
    await expect(page.getByRole("link", { name: /Sacos de Juta/ })).toBeVisible();
  });

  test("offers no availability toggle when nothing is flagged", async ({ page }) => {
    await page.goto("/pt-BR/constructs/category/decorations-lights");
    await expect(page.getByRole("status")).toBeVisible();
    await expect(page.getByLabel("Mostrar conteúdo possivelmente indisponível")).toHaveCount(0);
  });

  test("a construct formerly behind a flag is shown normally, with its blueprint price", async ({
    page,
  }) => {
    await page.goto("/pt-BR/constructs/AnimalBedSmall");

    await expect(page.getByRole("note")).toHaveCount(0);
    await expect(page.getByText(/blueprint é vendido por mercadores por/)).toBeVisible();
  });
});

test.describe("a crafting category", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("lists what a machine makes, with ingredients and every tier that makes it", async ({
    page,
  }) => {
    await page.goto("/pt-BR/recipes/craft-Furnace");

    await expect(page.getByRole("heading", { level: 1, name: "Fornalha" })).toBeVisible();
    const card = page.getByRole("link", { name: /Barra de Bronze/ });
    await expect(card).toContainText("1× Minério de Cobre");
    // Tiers read in order, whatever their ids look like.
    const badges = card.locator("span").filter({ hasText: /^Fornalha( I{1,3})?$/ });
    await expect(badges).toHaveText(["Fornalha", "Fornalha II", "Fornalha III"]);
  });

  test("clicking a card opens the item page", async ({ page }) => {
    await page.goto("/pt-BR/recipes/craft-Furnace");
    await page.getByRole("link", { name: /Barra de Bronze/ }).click();

    await expect(page).toHaveURL(/\/pt-BR\/items\/BronzeBar$/);
    await expect(page.getByRole("heading", { level: 2, name: "Como fazer" })).toBeVisible();
  });

  test("says how many units a craft yields when it is more than one", async ({ page }) => {
    await page.goto("/pt-BR/recipes/craft-SeedMaker");
    await expect(page.getByText(/Rende \d+×/).first()).toBeVisible();
  });
});

test.describe("unknown categories and constructs", () => {
  test("answer 404", async ({ request }) => {
    expect((await request.get("/pt-BR/recipes/nope")).status()).toBe(404);
    expect((await request.get("/pt-BR/constructs/Nope")).status()).toBe(404);
    expect((await request.get("/fr/recipes")).status()).toBe(404);
  });
});

test.describe("materials calculator", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("calculates materials for the chosen item and quantity, and keeps them in the URL", async ({
    page,
  }) => {
    await page.goto("/pt-BR/calculator");
    await expect(page.getByText("Escolha um item para calcular")).toBeVisible();

    await page.getByLabel("Item a fabricar").selectOption("BronzeBar");
    await page.getByLabel("Quantidade").fill("10");

    const materials = page.getByRole("region", { name: "Materiais para obter" });
    await expect(materials.getByText("Minério de Cobre")).toBeVisible();
    await expect(materials.getByText("10×").first()).toBeVisible();
    await expect(page).toHaveURL(/item=BronzeBar/);
    await expect(page).toHaveURL(/qty=10/);
  });

  test("builds a multi-step plan in dependency order", async ({ page }) => {
    await page.goto("/pt-BR/calculator?item=CrystalMatrix&qty=3");

    // `ol > li`: the steps themselves, not the ingredient lists nested inside each one.
    const steps = page.getByRole("region", { name: "Etapas de fabricação" }).locator("ol > li");
    await expect(steps.first()).toBeVisible();
    // The requested item is the last step; its ingredients come before it.
    await expect(steps.last()).toContainText("3× Prisma de Cristal");
    expect(await steps.count()).toBeGreaterThan(10);
  });

  test("lets the player switch between recipe variants", async ({ page }) => {
    // Wheat seeds can be made from fibre, wheat, or rare wheat (which yields more).
    await page.goto("/pt-BR/calculator?item=WheatSeeds&qty=7");

    const variant = page.getByLabel("Receita");
    await expect(variant.locator("option")).toHaveCount(3);
    const materials = page.getByRole("region", { name: "Materiais para obter" });
    // The default avoids the mutated plant, which needs modified seeds.
    await expect(materials.getByText("Trigo", { exact: true })).toBeVisible();
    await expect(materials.getByText("Origem desconhecida")).toHaveCount(0);

    await variant.selectOption({ label: "1× Trigo (Mutante) → 3× Sementes de Trigo" });
    await expect(page).toHaveURL(/v=WheatSeeds%3AWheatSeeds3/);
    // Mutated wheat has a known origin (modified seeds), so it is not "unknown".
    await expect(materials.getByText("Trigo (Mutante)")).toBeVisible();
    await expect(materials.getByText("Origem desconhecida")).toHaveCount(0);
  });

  test("starts from an item page link", async ({ page }) => {
    await page.goto("/pt-BR/items/BronzeBar");
    await page.getByRole("link", { name: "Calcular materiais" }).click();

    await expect(page).toHaveURL(/\/pt-BR\/calculator\?item=BronzeBar/);
    await expect(page.getByLabel("Item a fabricar")).toHaveValue("BronzeBar");
  });

  test("raw items have no calculate link", async ({ page }) => {
    await page.goto("/pt-BR/items/CopperOre");
    await expect(page.getByRole("link", { name: "Calcular materiais" })).toHaveCount(0);
  });

  test("shrugs off malformed URL parameters", async ({ page }) => {
    await page.goto("/pt-BR/calculator?item=..%2F..%2Fetc&qty=abc&v=%3Cscript%3E");

    await expect(page.getByText("Escolha um item para calcular")).toBeVisible();
    await expect(page.getByLabel("Quantidade")).toHaveValue("1");
  });

  test("is localized", async ({ page }) => {
    await page.goto("/en/calculator?item=BronzeBar&qty=2");
    await expect(
      page.getByRole("heading", { level: 1, name: "Materials calculator" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Crafting steps" })).toBeVisible();
  });
});

test.describe("accessibility (axe)", () => {
  const pages = [
    "/pt-BR/recipes",
    "/en/recipes",
    "/pt-BR/constructs/category/constructs-storage",
    "/en/constructs/category/decorations-furniture",
    "/pt-BR/constructs/category/constructs-modular",
    "/pt-BR/recipes/craft-Furnace",
    "/pt-BR/constructs/AnimalBedSmall",
    "/en/constructs/StorageBox",
    "/pt-BR/calculator",
    "/pt-BR/calculator?item=CrystalMatrix&qty=3",
    "/en/calculator?item=WheatSeeds&qty=7",
  ];

  for (const scheme of ["dark", "light"] as const) {
    for (const path of pages) {
      test(`${path} in ${scheme} theme has no violations`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        // Wait for the client component to replace its Suspense fallback.
        await expect(page.locator("#card-filter, #calc-item, h2").first()).toBeVisible();

        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 375, height: 700 } });

  for (const path of [
    "/pt-BR/recipes",
    "/pt-BR/constructs/category/constructs-storage",
    "/pt-BR/constructs/StorageBox",
    "/pt-BR/calculator?item=CrystalMatrix&qty=3",
  ]) {
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
